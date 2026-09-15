import http, { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config.js';
import { getCachedStatus, getCachedStats, getCachedInfo, getRecentLogs } from './redis.js';
import { recordClientSessionStart, recordClientSessionEnd, getRecentMetrics, getRecentSystemEvents, logSystemEvent } from './db.js';
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

export function createProxyServer(options: ProxyOptions = {}): { server: http.Server; wss: WebSocketServer } {
  const server = http.createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;

    // 1. Dashboard UI
    if (pathname === '/' || pathname === '/dashboard') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(renderDashboardHtml());
      return;
    }

    // 2. Static Pages (Docs, Privacy, TOS) - under /dashboard/
    if (pathname === '/dashboard/docs') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(renderDocsHtml());
      return;
    }

    if (pathname === '/dashboard/privacy') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(renderPrivacyHtml());
      return;
    }

    if (pathname === '/dashboard/tos') {
      res.writeHead(200, {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache'
      });
      res.end(renderTosHtml());
      return;
    }

    // 3. Health check endpoint for liveness probes
    if (pathname === '/health') {
      const status = await getCachedStatus();
      const isHealthy = status === 'online' || status === 'starting';
      res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        status: isHealthy ? 'ok' : 'degraded',
        nodeStatus: status,
        domain: config.domain,
        timestamp: Date.now()
      }));
      return;
    }

    // 4. API Status (Public connection details)
    if (pathname === '/api/status') {
      const [status, stats, info] = await Promise.all([
        getCachedStatus(),
        getCachedStats(),
        getCachedInfo()
      ]);

      const isSsl = config.secure;
      const botPort = isSsl ? 443 : config.port;

      const payload: Record<string, unknown> = {
        status,
        domain: config.domain,
        port: config.port,
        stats,
        info,
        connection: {
          host: config.domain,
          port: botPort,
          password: config.pass,
          secure: isSsl,
          websocketUrl: `${isSsl ? 'wss' : 'ws'}://${config.domain}${isSsl ? '' : `:${config.port}`}/v4/websocket`,
          lavalinkPublicUrl: config.publicUrl,
          dashboardPublicUrl: config.dashboardUrl,
          dashboardPort: config.dashboardPort
        },
        youtubeOAuth: getOAuthState()
      };

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(payload));
      return;
    }

    // 5. API Metrics History from SQLite (Publicly available performance metrics)
    if (pathname === '/api/metrics') {
      const history = getRecentMetrics(30);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(history));
      return;
    }

    // 6. YouTube OAuth Management Routes (Public)
    if (pathname.startsWith('/api/oauth/youtube')) {
      if (pathname === '/api/oauth/youtube/status' && req.method === 'GET') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: true, oauth: getOAuthState() }));
        return;
      }

      if (pathname === '/api/oauth/youtube/start' && req.method === 'POST') {
        try {
          const oauth = await initiateDeviceFlow();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, oauth }));
        } catch (err: any) {
          res.writeHead(500, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'Failed to start device flow' }));
        }
        return;
      }

      if (pathname === '/api/oauth/youtube/manual' && req.method === 'POST') {
        try {
          const { token } = await parseJsonBody<{ token?: string }>(req);
          if (!token || typeof token !== 'string') {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'A valid refresh token string is required' }));
            return;
          }

          const ok = await applyManualToken(token);
          if (ok) {
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: true, oauth: getOAuthState() }));
          } else {
            res.writeHead(400, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ success: false, error: 'Invalid refresh token format' }));
          }
        } catch (err: any) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: err?.message || 'Malformed request body' }));
        }
        return;
      }
    }

    // 7. Proxy REST API to internal Lavalink (e.g. /v4/*, /version, /youtube/*)
    if (pathname.startsWith('/v4/') || pathname === '/version' || pathname.startsWith('/youtube')) {
      proxyHttpRequest(req, res);
      return;
    }

    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
  });

  // WebSocket Reverse Proxy for /v4/websocket
  const wss = new WebSocketServer({ noServer: true });

  server.on('upgrade', (req: IncomingMessage, socket, head) => {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    if (url.pathname === '/v4/websocket') {
      wss.handleUpgrade(req, socket, head, (clientWs) => {
        handleWebSocketProxy(clientWs, req);
      });
    } else {
      socket.destroy();
    }
  });

  return { server, wss };
}

function proxyHttpRequest(clientReq: IncomingMessage, clientRes: ServerResponse): void {
  const options: http.RequestOptions = {
    hostname: config.host,
    port: config.port,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `${config.host}:${config.port}`
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

  // Target internal Lavalink WebSocket
  const headers: Record<string, string> = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (value && typeof value === 'string' && key.toLowerCase() !== 'host') {
      headers[key] = value;
    }
  }

  const targetWs = new WebSocket(`ws://${config.host}:${config.port}${req.url}`, {
    headers
  });

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
    // Bi-directional pipe
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