import http from 'node:http';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config.js';
import { getCachedStatus, getCachedStats, getCachedInfo } from './redis.js';
import { recordClientSessionStart, recordClientSessionEnd, getRecentMetrics } from './db.js';
import { renderDashboardHtml, renderDocsHtml, renderPrivacyHtml, renderTosHtml } from './pages/index.js';
import { getOAuthState, initiateDeviceFlow, applyManualToken } from './youtube-oauth.js';

export interface ProxyOptions {
  onRestart?: () => Promise<void>;
}

function parseJsonBody<T = Record<string, unknown>>(req: IncomingMessage): Promise<T> {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 64) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {});
      } catch (err) {
        reject(err);
      }
    });
    req.on('error', reject);
  });
}

function sendJson(res: ServerResponse, statusCode: number, payload: unknown): void {
  res.writeHead(statusCode, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
  res.end(JSON.stringify(payload));
}

function sendHtml(res: ServerResponse, html: string): void {
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-cache' });
  res.end(html);
}

async function buildStatusPayload(): Promise<Record<string, unknown>> {
  const [status, stats, info] = await Promise.all([
    getCachedStatus(),
    getCachedStats(),
    getCachedInfo()
  ]);

  const payload: Record<string, unknown> = {
    status,
    stats,
    info,
    connection: {
      internal: {
        host: config.internalHost,
        port: config.internalPort,
        url: config.internalUrl,
        websocketUri: config.internalWsUri
      },
      public: {
        host: config.publicHost,
        port: config.publicPort,
        url: config.publicUrl,
        websocketUri: config.publicWsUri,
        secure: config.secure,
        portMasked: config.reverseProxyEnabled,
        proxyType: config.reverseProxyType,
        password: config.pass
      },
      gateway: {
        host: config.gatewayHost,
        port: config.gatewayPort
      }
    }
  };

  if (config.youtubeOAuthEnabled) {
    payload.youtubeOAuth = getOAuthState();
  }

  return payload;
}

export function createProxyServer(options: ProxyOptions = {}): { server: http.Server; wss: WebSocketServer } {
  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // Root redirects to the dashboard endpoint
    if (pathname === '/') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      res.writeHead(302, { Location: '/dashboard' });
      res.end();
      return;
    }

    // Dashboard UI + static pages
    if (pathname === '/dashboard') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      sendHtml(res, renderDashboardHtml());
      return;
    }

    if (pathname === '/dashboard/docs') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      sendHtml(res, renderDocsHtml());
      return;
    }

    if (pathname === '/dashboard/privacy') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      sendHtml(res, renderPrivacyHtml());
      return;
    }

    if (pathname === '/dashboard/tos') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      sendHtml(res, renderTosHtml());
      return;
    }

    // Health check for liveness probes
    if (pathname === '/health') {
      const status = await getCachedStatus();
      const isHealthy = status === 'online' || status === 'starting';
      res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({
        status: isHealthy ? 'ok' : 'degraded',
        nodeStatus: status,
        connection: {
          internal: { url: config.internalUrl },
          public: {
            url: config.publicUrl,
            secure: config.secure,
            portMasked: config.reverseProxyEnabled,
            proxyType: config.reverseProxyType
          }
        },
        timestamp: Date.now()
      }));
      return;
    }

    // Dashboard API: full status (internal + public connection details)
    if (pathname === '/dashboard/api/status') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      sendJson(res, 200, await buildStatusPayload());
      return;
    }

    // Dashboard API: metrics history from SQLite
    if (pathname === '/dashboard/api/metrics') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      sendJson(res, 200, getRecentMetrics(30));
      return;
    }

    // Dashboard API: real-time connection events (SSE)
    if (pathname === '/dashboard/api/events') {
      if (!config.dashboardEnabled) {
        sendJson(res, 404, { error: 'Dashboard disabled' });
        return;
      }
      res.writeHead(200, {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive'
      });
      res.write('retry: 5000\n\n');

      const sendConnectionEvent = async () => {
        const payload = await buildStatusPayload();
        res.write(`event: connection\ndata: ${JSON.stringify(payload.connection)}\n\n`);
      };

      sendConnectionEvent().catch(() => {});
      const timer = setInterval(() => sendConnectionEvent().catch(() => {}), 5000);
      req.on('close', () => clearInterval(timer));
      return;
    }

    // Dashboard API: YouTube OAuth
    if (config.dashboardEnabled && pathname.startsWith('/dashboard/api/oauth/youtube')) {
      if (pathname === '/dashboard/api/oauth/youtube/status' && req.method === 'GET') {
        if (!config.youtubeOAuthEnabled) {
          sendJson(res, 404, { error: 'YouTube OAuth disabled' });
          return;
        }
        sendJson(res, 200, { success: true, oauth: getOAuthState() });
        return;
      }

      if (pathname === '/dashboard/api/oauth/youtube/start' && req.method === 'POST') {
        if (!config.youtubeOAuthEnabled) {
          sendJson(res, 404, { error: 'YouTube OAuth disabled' });
          return;
        }
        try {
          const oauth = await initiateDeviceFlow();
          sendJson(res, 200, { success: true, oauth });
        } catch (err: any) {
          sendJson(res, 500, { success: false, error: err?.message || 'Failed to start device flow' });
        }
        return;
      }

      if (pathname === '/dashboard/api/oauth/youtube/manual' && req.method === 'POST') {
        if (!config.youtubeOAuthEnabled) {
          sendJson(res, 404, { error: 'YouTube OAuth disabled' });
          return;
        }
        try {
          const { token } = await parseJsonBody<{ token?: string }>(req);
          if (!token || typeof token !== 'string') {
            sendJson(res, 400, { success: false, error: 'A valid refresh token string is required' });
            return;
          }

          const ok = await applyManualToken(token);
          if (ok) {
            sendJson(res, 200, { success: true, oauth: getOAuthState() });
          } else {
            sendJson(res, 400, { success: false, error: 'Invalid refresh token format' });
          }
        } catch (err: any) {
          sendJson(res, 400, { success: false, error: err?.message || 'Malformed request body' });
        }
        return;
      }
    }

    // Server endpoint: the internal Lavalink node, mounted at /server (and its API surface)
    if (pathname === '/server' || pathname === '/server/' || pathname.startsWith('/server/')) {
      const targetPath = pathname.startsWith('/server/') ? pathname.slice('/server'.length) : '/v4/info';
      proxyHttpRequest(req, res, targetPath);
      return;
    }

    // Client-facing Lavalink API mounted at the root (matches LAVA_PUBLIC_WS_URI paths)
    if (pathname.startsWith('/v4/') || pathname === '/version' || pathname.startsWith('/youtube')) {
      proxyHttpRequest(req, res);
      return;
    }

    sendJson(res, 404, { error: 'Not Found', path: pathname });
  });

  // WebSocket reverse proxy — client-facing /v4/websocket and /server/v4/websocket
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/v4/websocket' || url.pathname === '/server/v4/websocket') {
      wss.handleUpgrade(req, socket, head, (clientWs) => {
        handleWebSocketProxy(clientWs, req);
      });
    } else {
      socket.destroy();
    }
  });

  return { server, wss };
}

function proxyHttpRequest(clientReq: IncomingMessage, clientRes: ServerResponse, targetPath?: string): void {
  const upstreamPath = targetPath ?? clientReq.url ?? '/';
  const options: http.RequestOptions = {
    hostname: config.internalWsHost,
    port: config.internalWsPort,
    path: upstreamPath,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `${config.internalWsHost}:${config.internalWsPort}`
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    clientRes.writeHead(proxyRes.statusCode || 500, proxyRes.headers);
    proxyRes.pipe(clientRes, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('[Proxy] HTTP Proxy request error:', err.message);
    if (!clientRes.headersSent) {
      clientRes.writeHead(502, { 'Content-Type': 'application/json' });
      clientRes.end(JSON.stringify({ error: 'Bad Gateway: Lavalink node unreachable', details: err.message }));
    }
  });

  clientReq.pipe(proxyReq, { end: true });
}

function handleWebSocketProxy(clientWs: WebSocket, req: IncomingMessage): void {
  const sessionId = Math.random().toString(36).substring(2, 15);
  const clientName = (req.headers['client-name'] as string) || (req.headers['user-agent'] as string) || 'unknown-client';
  const remoteIp = (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';

  recordClientSessionStart(sessionId, clientName, remoteIp);
  console.log(`[WS Proxy] Client connected: ${clientName} (${remoteIp})`);

  // Rewrite the /server/prefix so the internal node always receives its native WS path
  const targetPath = (req.url || '/').replace(/^\/server/, '') || '/v4/websocket';
  const targetUrl = `${config.internalWsProtocol ?? 'ws'}://${config.internalWsHost}:${config.internalWsPort}${targetPath}`;

  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value && typeof value === 'string' && key.toLowerCase() !== 'host') {
      headers[key] = value;
    }
  }

  const targetWs = new WebSocket(targetUrl, { headers });

  // Active Keep-Alive Ping frames every 30s to keep reverse proxies from terminating idle connections
  const keepAlivePingTimer = setInterval(() => {
    if (clientWs.readyState === WebSocket.OPEN) {
      try { clientWs.ping(); } catch {}
    }
    if (targetWs.readyState === WebSocket.OPEN) {
      try { targetWs.ping(); } catch {}
    }
  }, 30000);

  const cleanup = () => {
    clearInterval(keepAlivePingTimer);
  };

  targetWs.on('open', () => {
    clientWs.on('message', (data, isBinary) => {
      if (targetWs.readyState === WebSocket.OPEN) {
        targetWs.send(data, { binary: isBinary });
      }
    });

    targetWs.on('message', (data, isBinary) => {
      if (clientWs.readyState === WebSocket.OPEN) {
        clientWs.send(data, { binary: isBinary });
      }
    });
  });

  targetWs.on('error', (err) => {
    console.error('[WS Proxy] Target Lavalink WebSocket error:', err.message);
    cleanup();
    clientWs.close(1011, 'Lavalink node unreachable');
  });

  clientWs.on('close', (code, reason) => {
    cleanup();
    recordClientSessionEnd(sessionId);
    console.log(`[WS Proxy] Client disconnected: ${clientName} (code ${code})`);
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.close(code, reason);
    }
  });

  targetWs.on('close', (code, reason) => {
    cleanup();
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code, reason);
    }
  });
}