import { config } from './config.js';
import { logSystemEvent } from './db.js';
import { appendRecentLog } from './redis.js';

let keepAliveTimer: NodeJS.Timeout | null = null;
let initialTimeout: NodeJS.Timeout | null = null;

/**
 * Starts a background keep-alive pinger designed to prevent cloud hosts
 * like Render from putting the web service to sleep due to inbound HTTP inactivity.
 *
 * Render spins down free-tier web services after 15 minutes of zero inbound HTTP traffic.
 * This service pings the public `/health` endpoint every 10 minutes to maintain 24/7 liveness.
 */
export function startKeepAlive(): void {
  if (process.env.KEEP_ALIVE_ENABLED?.toLowerCase() === 'false') {
    console.log('[KeepAlive] Keep-alive service disabled via KEEP_ALIVE_ENABLED=false.');
    return;
  }

  // Resolve target ping URL
  let baseUrl = process.env.KEEP_ALIVE_URL?.trim();
  if (!baseUrl) {
    if (process.env.RENDER_EXTERNAL_URL) {
      baseUrl = process.env.RENDER_EXTERNAL_URL.trim();
    } else if (config.domain && config.domain !== 'localhost') {
      baseUrl = `https://${config.domain}`;
    } else {
      baseUrl = `http://localhost:${config.port}`;
    }
  }

  baseUrl = baseUrl.replace(/\/+$/, '');
  const pingUrl = `${baseUrl}/health`;

  const intervalMs = Number.parseInt(
    process.env.KEEP_ALIVE_INTERVAL_MS || String(10 * 60 * 1000), // Default 10 minutes
    10
  );

  console.log(`[KeepAlive] Service active. Target: ${pingUrl} (Interval: ${Math.round(intervalMs / 60000)} min)`);
  logSystemEvent('info', `Keep-alive service active on ${pingUrl}`, { intervalMs });

  const ping = async () => {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const res = await fetch(pingUrl, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Lavalink-KeepAlive/1.0',
          'Accept': 'application/json'
        }
      });
      clearTimeout(timeout);

      if (res.ok) {
        const msg = `[KeepAlive] Ping successful to ${pingUrl} (HTTP ${res.status})`;
        console.log(msg);
        appendRecentLog(msg).catch(() => {});
      } else {
        const msg = `[KeepAlive] Ping responded with HTTP ${res.status}`;
        console.warn(msg);
        appendRecentLog(msg).catch(() => {});
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      const msg = `[KeepAlive] Ping notice (${pingUrl}): ${errorMsg}`;
      console.log(msg);
      appendRecentLog(msg).catch(() => {});
    }
  };

  // First ping after 30 seconds to allow initial boot, then recurring
  initialTimeout = setTimeout(() => {
    void ping();
    keepAliveTimer = setInterval(() => void ping(), intervalMs);
  }, 30000);
}

export function stopKeepAlive(): void {
  if (initialTimeout) {
    clearTimeout(initialTimeout);
    initialTimeout = null;
  }
  if (keepAliveTimer) {
    clearInterval(keepAliveTimer);
    keepAliveTimer = null;
  }
  console.log('[KeepAlive] Keep-alive service stopped.');
}
