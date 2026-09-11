import http, { IncomingMessage, ServerResponse } from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { config } from './config.js';
import { getCachedStatus, getCachedStats, getCachedInfo, getRecentLogs } from './redis.js';
import { recordClientSessionStart, recordClientSessionEnd, getRecentMetrics, getRecentSystemEvents } from './db.js';
import { renderDashboardHtml } from './dashboard.js';

export function createProxyServer(): { server: http.Server; wss: WebSocketServer } {
  const server = http.createServer((req: IncomingMessage, res: ServerResponse) => {
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

    // 2. Health check endpoint for cloud platform liveness probes
    if (pathname === '/health') {
      getCachedStatus().then((status) => {
        const isHealthy = status === 'online' || status === 'starting';
        res.writeHead(isHealthy ? 200 : 503, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          status: isHealthy ? 'ok' : 'degraded',
          nodeStatus: status,
          domain: config.domain,
          timestamp: Date.now()
        }));
      });
      return;
    }

    // 3. API Status for live dashboard polling
    if (pathname === '/api/status') {
      Promise.all([getCachedStatus(), getCachedStats(), getCachedInfo(), getRecentLogs(25)]).then(
        ([status, stats, info, logs]) => {
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            status,
            domain: config.domain,
            port: config.port,
            stats,
            info,
            logs
          }));
        }
      );
      return;
    }

    // 4. API Metrics History from SQLite
    if (pathname === '/api/metrics') {
      const history = getRecentMetrics(30);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(history));
      return;
    }

    // 5. API Event Logs from SQLite
    if (pathname === '/api/events') {
      const events = getRecentSystemEvents(50);
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(events));
      return;
    }

    // 6. Proxy REST API to internal Lavalink (e.g. /v4/*, /version)
    if (pathname.startsWith('/v4/') || pathname === '/version') {
      proxyHttpRequest(req, res);
      return;
    }

    // 404 Fallback
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Not Found', path: pathname }));
  });

  // 7. WebSocket Reverse Proxy for /v4/websocket
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
    clientWs.close(1011, 'Lavalink node unreachable');
  });

  clientWs.on('close', (code, reason) => {
    recordClientSessionEnd(sessionId);
    console.log(`[WS Proxy] Client disconnected: ${clientName} (code ${code})`);
    if (targetWs.readyState === WebSocket.OPEN) {
      targetWs.close(code, reason);
    }
  });

  targetWs.on('close', (code, reason) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.close(code, reason);
    }
  });
}
