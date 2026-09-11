import http, { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config.js';
import { getCachedStatus, getCachedStats, getCachedInfo, getRecentLogs } from './redis.js';
import { recordClientSessionStart, recordClientSessionEnd, getRecentMetrics, getRecentSystemEvents, logSystemEvent } from './db.js';
import { renderDashboardHtml } from './dashboard.js';
import { getKeepAliveState, triggerKeepAlivePing } from './keepAlive.js';

export interface ProxyOptions {
  onRestart?: () => Promise<void>;
}

function getExpectedAdminToken(): string {
  return crypto.createHash('sha256').update(`lavalink-admin:${config.adminKey}`).digest('hex');
}

export function isOwnerAuthenticated(req: IncomingMessage): boolean {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith('Bearer ') ? authHeader.substring(7).trim() : null;
  const cookieHeader = req.headers.cookie;
  const cookieToken = cookieHeader
    ?.split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith('admin_token='))
    ?.substring(12);

  const testToken = token || cookieToken;
  if (!testToken) return false;

  const expected = getExpectedAdminToken();
  return testToken === expected || testToken === config.adminKey;
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

    // 2. Health check endpoint for cloud platform liveness probes & keep-alive
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

    // 3. API Status (Public connection details vs Owner-only diagnostics)
    if (pathname === '/api/status') {
      const isOwner = isOwnerAuthenticated(req);
      const [status, stats, info] = await Promise.all([
        getCachedStatus(),
        getCachedStats(),
        getCachedInfo()
      ]);

      const isSsl = config.domain !== 'localhost';
      const botPort = isSsl ? 443 : config.port;

      const payload: Record<string, unknown> = {
        status,
        domain: config.domain,
        port: config.port,
        stats,
        info,
        keepAlive: getKeepAliveState(),
        connection: {
          host: config.domain,
          port: botPort,
          password: config.lavalinkPass,
          secure: isSsl,
          websocketUrl: `${isSsl ? 'wss' : 'ws'}://${config.domain}${isSsl ? '' : `:${config.port}`}/v4/websocket`
        },
        isOwner
      };

      if (isOwner) {
        payload.logs = await getRecentLogs(50);
        payload.adminKey = config.adminKey;
      }

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      });
      res.end(JSON.stringify(payload));
      return;
    }

    // 4. API Auth Login
    if (pathname === '/api/auth/login' && req.method === 'POST') {
      try {
        const { password } = await parseJsonBody<{ password?: string }>(req);
        if (password && (password === config.adminKey || password === config.lavalinkPass)) {
          const token = getExpectedAdminToken();
          res.writeHead(200, {
            'Content-Type': 'application/json',
            'Set-Cookie': `admin_token=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=86400`
          });
          res.end(JSON.stringify({ success: true, token }));
          logSystemEvent('info', 'Host account owner authenticated via dashboard');
        } else {
          res.writeHead(401, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: false, error: 'Invalid password' }));
        }
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Malformed request body' }));
      }
      return;
    }

    // 5. API Auth Verify
    if (pathname === '/api/auth/verify') {
      const isOwner = isOwnerAuthenticated(req);
      res.writeHead(isOwner ? 200 : 401, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ authenticated: isOwner }));
      return;
    }

    // 6. API Logs (Host Owner Only)
    if (pathname === '/api/logs') {
      if (!isOwnerAuthenticated(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Host account owner login required' }));
        return;
      }
      const logs = await getRecentLogs(60);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-cache' });
      res.end(JSON.stringify({ logs }));
      return;
    }

    // 7. API Event Logs from SQLite (Host Owner Only)
    if (pathname === '/api/events') {
      if (!isOwnerAuthenticated(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Host account owner login required' }));
        return;
      }
      const events = getRecentSystemEvents(50);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(events));
      return;
    }

    // 8. API Metrics History from SQLite (Publicly available performance metrics)
    if (pathname === '/api/metrics') {
      const history = getRecentMetrics(30);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(history));
      return;
    }

    // 9. API Admin Actions (Host Owner Only)
    if (pathname === '/api/admin/action' && req.method === 'POST') {
      if (!isOwnerAuthenticated(req)) {
        res.writeHead(401, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Unauthorized: Host account owner login required' }));
        return;
      }

      try {
        const { action } = await parseJsonBody<{ action?: string }>(req);

        if (action === 'ping') {
          const result = await triggerKeepAlivePing();
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, result, keepAlive: getKeepAliveState() }));
          return;
        }

        if (action === 'restart') {
          logSystemEvent('warn', 'Manual node restart requested by host owner');
          if (options.onRestart) {
            void options.onRestart();
          }
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ success: true, message: 'Node restart initiated' }));
          return;
        }

        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: `Unknown action: ${action}` }));
      } catch {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Bad request' }));
      }
      return;
    }

    // 10. Proxy REST API to internal Lavalink (e.g. /v4/*, /version)
    if (pathname.startsWith('/v4/') || pathname === '/version') {
      proxyHttpRequest(req, res);
      return;
    }

    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
  });

  // 11. WebSocket Reverse Proxy for /v4/websocket with Keep-Alive Heartbeat
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
    hostname: config.lavalinkHost,
    port: config.lavalinkPort,
    path: clientReq.url,
    method: clientReq.method,
    headers: {
      ...clientReq.headers,
      host: `${config.lavalinkHost}:${config.lavalinkPort}`
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

  const targetWs = new WebSocket(`ws://${config.lavalinkHost}:${config.lavalinkPort}${req.url}`, {
    headers
  });

  // Active Keep-Alive Ping frames every 30s to keep cloud reverse proxies from terminating idle connections
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
