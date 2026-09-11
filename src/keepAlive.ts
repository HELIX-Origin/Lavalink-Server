import http from 'node:http';
import { config } from './config.js';
import { logSystemEvent } from './db.js';
import { appendRecentLog } from './redis.js';

export interface KeepAliveState {
  enabled: boolean;
  targetUrl: string;
  intervalMs: number;
  lastPingTimestamp: number | null;
  lastPingStatus: number | null;
  lastPingLatencyMs: number | null;
  lastPingError: string | null;
  successPings: number;
  failedPings: number;
  jvmWarmupCount: number;
}

const state: KeepAliveState = {
  enabled: false,
  targetUrl: '',
  intervalMs: config.keepAliveIntervalMs,
  lastPingTimestamp: null,
  lastPingStatus: null,
  lastPingLatencyMs: null,
  lastPingError: null,
  successPings: 0,
  failedPings: 0,
  jvmWarmupCount: 0
};

let externalPingTimer: NodeJS.Timeout | null = null;
let initialTimeout: NodeJS.Timeout | null = null;
let jvmWarmupTimer: NodeJS.Timeout | null = null;

function resolveTargetUrl(): string {
  // 1. Direct external URL provided by cloud platforms (e.g. Render)
  if (process.env.RENDER_EXTERNAL_URL) {
    return process.env.RENDER_EXTERNAL_URL.trim().replace(/\/+$/, '');
  }
  // 2. Render injected external hostname
  if (process.env.RENDER_EXTERNAL_HOSTNAME) {
    return `https://${process.env.RENDER_EXTERNAL_HOSTNAME.trim().replace(/\/+$/, '')}`;
  }
  // 3. Railway public domain or static URL
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN.trim().replace(/\/+$/, '')}`;
  }
  if (process.env.RAILWAY_STATIC_URL) {
    const raw = process.env.RAILWAY_STATIC_URL.trim().replace(/\/+$/, '');
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }
  // 4. Heroku default domain or app name
  if (process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME) {
    return `https://${process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME.trim().replace(/\/+$/, '')}`;
  }
  if (process.env.HEROKU_APP_NAME) {
    return `https://${process.env.HEROKU_APP_NAME.trim()}.herokuapp.com`;
  }
  // 5. Fly.io app domain
  if (process.env.FLY_APP_NAME) {
    return `https://${process.env.FLY_APP_NAME.trim()}.fly.dev`;
  }
  // 6. Koyeb public domain
  if (process.env.KOYEB_PUBLIC_DOMAIN) {
    return `https://${process.env.KOYEB_PUBLIC_DOMAIN.trim().replace(/\/+$/, '')}`;
  }
  // 7. General DOMAIN environment variable
  if (process.env.DOMAIN && process.env.DOMAIN !== 'localhost') {
    const raw = process.env.DOMAIN.trim().replace(/\/+$/, '');
    return raw.startsWith('http') ? raw : `https://${raw}`;
  }
  // 8. Resolved system domain from config
  if (config.domain && config.domain !== 'localhost') {
    return `https://${config.domain}`;
  }
  // 9. Local loopback fallback
  return `http://127.0.0.1:${config.port}`;
}


/**
 * Triggers an external HTTP ping against the public /health endpoint.
 * Resets the inactivity timer on cloud hosts (e.g. Render free tier).
 */
export async function triggerKeepAlivePing(): Promise<{
  success: boolean;
  status?: number;
  latencyMs?: number;
  error?: string;
}> {
  const targetUrl = `${state.targetUrl || resolveTargetUrl()}/health`;
  const startTime = Date.now();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(targetUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Lavalink-KeepAlive/2.0 (+https://github.com/HELIX-Origin/Lavalink-Server)',
        'Accept': 'application/json',
        'X-KeepAlive-Trigger': 'automated'
      }
    });
    clearTimeout(timeout);

    const latencyMs = Date.now() - startTime;
    state.lastPingTimestamp = Date.now();
    state.lastPingStatus = res.status;
    state.lastPingLatencyMs = latencyMs;
    state.lastPingError = null;

    if (res.ok) {
      state.successPings++;
      const msg = `[KeepAlive] Ping successful to ${targetUrl} (HTTP ${res.status}, ${latencyMs}ms)`;
      console.log(msg);
      appendRecentLog(msg).catch(() => {});
      return { success: true, status: res.status, latencyMs };
    } else {
      state.failedPings++;
      const msg = `[KeepAlive] Ping received non-200 HTTP ${res.status} (${latencyMs}ms)`;
      console.warn(msg);
      appendRecentLog(msg).catch(() => {});
      return { success: false, status: res.status, latencyMs };
    }
  } catch (err: unknown) {
    const latencyMs = Date.now() - startTime;
    const errorMsg = err instanceof Error ? err.message : String(err);

    state.lastPingTimestamp = Date.now();
    state.lastPingStatus = null;
    state.lastPingLatencyMs = latencyMs;
    state.lastPingError = errorMsg;
    state.failedPings++;

    const msg = `[KeepAlive] Ping error (${targetUrl}): ${errorMsg}`;
    console.log(msg);
    appendRecentLog(msg).catch(() => {});
    return { success: false, latencyMs, error: errorMsg };
  }
}

/**
 * Internal JVM warm-up ping.
 * Prevents Linux container cgroup CPU quota throttling and JIT cache eviction
 * when no players are actively streaming.
 */
async function warmUpJvmNode(): Promise<void> {
  return new Promise((resolve) => {
    const req = http.request(
      {
        hostname: config.lavalinkHost,
        port: config.lavalinkPort,
        path: '/v4/info',
        method: 'GET',
        headers: {
          Authorization: config.lavalinkPass,
          Accept: 'application/json'
        },
        timeout: 4000
      },
      (res) => {
        res.resume(); // Discard stream
        res.on('end', () => {
          state.jvmWarmupCount++;
          resolve();
        });
      }
    );

    req.on('error', () => resolve());
    req.on('timeout', () => {
      req.destroy();
      resolve();
    });
    req.end();
  });
}

/**
 * Starts the dual-action keep-alive service:
 * 1. Public endpoint ping to prevent cloud provider sleep (Render spins down after 15m).
 * 2. Internal loop to warm up JRE threads and avoid CPU cgroup throttles.
 */
export function startKeepAlive(): void {
  if (!config.keepAliveEnabled) {
    console.log('[KeepAlive] Service disabled via KEEP_ALIVE_ENABLED=false.');
    state.enabled = false;
    return;
  }

  state.enabled = true;
  state.targetUrl = resolveTargetUrl();
  state.intervalMs = config.keepAliveIntervalMs;

  const pingUrl = `${state.targetUrl}/health`;
  const intervalMin = Math.round(state.intervalMs / 60000);

  console.log(`[KeepAlive] Service active. Target: ${pingUrl} (Interval: ${intervalMin}m)`);
  logSystemEvent('info', `Keep-alive service active on ${pingUrl}`, {
    intervalMs: state.intervalMs,
    targetUrl: pingUrl
  });

  // 1. Initial delayed ping (give server 25s to finish booting)
  initialTimeout = setTimeout(() => {
    void triggerKeepAlivePing();
    externalPingTimer = setInterval(() => {
      void triggerKeepAlivePing();
    }, state.intervalMs);
  }, 25000);

  // 2. Internal JVM warm-up loop every 2 minutes
  jvmWarmupTimer = setInterval(() => {
    void warmUpJvmNode();
  }, 120000);
}

export function stopKeepAlive(): void {
  if (initialTimeout) {
    clearTimeout(initialTimeout);
    initialTimeout = null;
  }
  if (externalPingTimer) {
    clearInterval(externalPingTimer);
    externalPingTimer = null;
  }
  if (jvmWarmupTimer) {
    clearInterval(jvmWarmupTimer);
    jvmWarmupTimer = null;
  }
  state.enabled = false;
  console.log('[KeepAlive] Keep-alive service stopped.');
}

export function getKeepAliveState(): KeepAliveState {
  return { ...state };
}
