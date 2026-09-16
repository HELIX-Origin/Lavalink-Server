import path from 'node:path';

export interface ServerConfig {
  // Internal network — the Lavalink node bind (LAVA_INTERNAL_URL host:port).
  internalHost: string;
  internalPort: number;
  internalUrl: string;
  internalWsProtocol: 'ws' | 'wss';
  internalWsUri: string;
  internalWsHost: string;
  internalWsPort: number;
  internalWsPath: string;

  // Public network — client-facing details (LAVA_PUBLIC_URL / LAVA_PUBLIC_WS_URI).
  // The real gateway port is masked behind a Cloudflare tunnel / reverse proxy.
  publicHost: string;
  publicPort: number;
  publicUrl: string;
  publicWsUri: string;
  secure: boolean;
  reverseProxyEnabled: boolean;
  reverseProxyType: string;

  // Gateway (dashboard + proxy) — auto-derived, always LAVA_INTERNAL_URL port + 1.
  gatewayHost: string;
  gatewayPort: number;

  pass: string;
  cipherUrl: string;
  cipherPassword: string;
  youtubeClientId: string;
  youtubeClientSecret: string;
  spotifyClientId: string;
  spotifyClientSecret: string;
  geniusToken: string;
  dbPath: string;
  isProduction: boolean;
  dashboardTheme: string;
  dashboardColorScheme: string;

  // Feature toggles (library imports only — not env-driven).
  dashboardEnabled: boolean;
  supervisorEnabled: boolean;
  youtubeOAuthEnabled: boolean;
}

type EnvSource = NodeJS.ProcessEnv;

function env(source: EnvSource, key: string, fallback: string): string {
  return source[key]?.trim() || fallback;
}

function envInt(source: EnvSource, key: string, fallback: number): number {
  const raw = source[key]?.trim();
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) || parsed < 1 || parsed > 65535 ? fallback : parsed;
}

function envBool(source: EnvSource, key: string, fallback: boolean): boolean {
  const raw = source[key]?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === 'true' || raw === '1';
}

/**
 * Parses a "host:port" value that may optionally carry a scheme (e.g. "0.0.0.0:2333"
 * or "http://127.0.0.1:2333"). Falls back to the supplied default port when absent.
 */
function parseHostPort(raw: string, defaultPort: number): { hostname: string; port: number } {
  const prefixed = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`;
  try {
    const url = new URL(prefixed);
    if (!url.hostname) return { hostname: raw, port: defaultPort };
    const parsed = url.port ? parseInt(url.port, 10) : defaultPort;
    const port = isNaN(parsed) || parsed < 1 || parsed > 65535 ? defaultPort : parsed;
    return { hostname: url.hostname, port };
  } catch {
    return { hostname: raw, port: defaultPort };
  }
}

/**
 * Normalises a WebSocket URI, extracting its protocol, host, port and path. Falls back to
 * a constructed URI (default path /v4/websocket) when the input is missing or invalid.
 */
function parseWsUri(
  raw: string,
  fallbackProtocol: 'ws' | 'wss',
  fallbackHostname: string,
  fallbackPort: number,
  fallbackPath = '/v4/websocket'
): { uri: string; protocol: 'ws' | 'wss'; hostname: string; port: number; pathname: string } {
  try {
    const url = new URL(raw);
    if (!url.hostname) throw new Error('empty host');
    const parsed = url.port ? parseInt(url.port, 10) : fallbackPort;
    const port = isNaN(parsed) || parsed < 1 || parsed > 65535 ? fallbackPort : parsed;
    const protocol = url.protocol === 'wss:' ? 'wss' : url.protocol === 'ws:' ? 'ws' : fallbackProtocol;
    return {
      uri: url.href.replace(/\/+$/, ''),
      protocol,
      hostname: url.hostname,
      port,
      pathname: url.pathname || fallbackPath
    };
  } catch {
    return {
      uri: `${fallbackProtocol}://${fallbackHostname}:${fallbackPort}${fallbackPath}`,
      protocol: fallbackProtocol,
      hostname: fallbackHostname,
      port: fallbackPort,
      pathname: fallbackPath
    };
  }
}

export function buildConfig(source: EnvSource = process.env): ServerConfig {
  const internalHostPort = parseHostPort(env(source, 'LAVA_INTERNAL_URL', '0.0.0.0:2333'), 2333);
  const internalHost = internalHostPort.hostname;
  const internalPort = internalHostPort.port;

  const internalWs = parseWsUri(
    env(source, 'LAVA_INTERNAL_WS_URI', `ws://${internalHost}:${internalPort}/v4/websocket`),
    'ws',
    internalHost,
    internalPort
  );
  const internalProtocol = internalWs.protocol === 'wss' ? 'https' : 'http';

  const internalUrl = `${internalProtocol}://${internalHost}:${internalPort}`;

  const publicRaw = env(source, 'LAVA_PUBLIC_URL', '').replace(/\/+$/, '');
  let publicHost = internalHost;
  let secure = false;
  if (publicRaw) {
    try {
      const url = new URL(publicRaw);
      publicHost = url.hostname || internalHost;
      secure = url.protocol === 'https:';
    } catch {
      publicHost = publicRaw;
    }
  }

  // When no public URL is provided the public side falls back to the internal URL/WS
  // (the public WebSocket shares the same host as the server's public URL).
  const publicUrl = publicRaw || internalUrl;

  // Explicit port from the public URL when present, otherwise the standard port for
  // the scheme (443 for https). Not used when the port is masked behind a proxy.
  const publicPort = (() => {
    try {
      const u = new URL(publicUrl);
      if (u.port) {
        const parsed = parseInt(u.port, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 65535) return parsed;
      }
      return u.protocol === 'https:' ? 443 : 80;
    } catch {
      return internalPort;
    }
  })();

  const publicWsRaw = env(source, 'LAVA_PUBLIC_WS_URI', '');
  const publicWs = publicWsRaw
    ? parseWsUri(publicWsRaw, secure ? 'wss' : 'ws', publicHost, internalPort + 1)
    : publicRaw
      ? parseWsUri(`${secure ? 'wss' : 'ws'}://${publicHost}/v4/websocket`, secure ? 'wss' : 'ws', publicHost, internalPort + 1)
      : parseWsUri(internalWs.uri, internalWs.protocol, internalWs.hostname, internalWs.port, internalWs.pathname);

  const gatewayHost = ['0.0.0.0', '::', '::0'].includes(internalHost) ? '0.0.0.0' : internalHost;
  const gatewayPort = internalPort + 1;

  return {
    internalHost,
    internalPort,
    internalUrl,
    internalWsProtocol: internalWs.protocol,
    internalWsUri: internalWs.uri,
    internalWsHost: internalWs.hostname,
    internalWsPort: internalWs.port,
    internalWsPath: internalWs.pathname,
    publicHost,
    publicPort,
    publicUrl,
    publicWsUri: publicWs.uri,
    secure,
    reverseProxyEnabled: envBool(source, 'REVERSE_PROXY_ENABLED', false),
    reverseProxyType: env(source, 'REVERSE_PROXY_TYPE', '').toLowerCase(),
    gatewayHost,
    gatewayPort,
    pass: env(source, 'LAVA_PASS', 'youshallnotpass'),
    cipherUrl: env(source, 'LAVA_CIPHER_URL', 'https://cipher.kikkia.dev/'),
    cipherPassword: env(source, 'LAVA_CIPHER_PASSWORD', ''),
    youtubeClientId: env(source, 'YOUTUBE_CLIENT_ID', ''),
    youtubeClientSecret: env(source, 'YOUTUBE_CLIENT_SECRET', ''),
    spotifyClientId: env(source, 'SPOTIFY_CLIENT_ID', ''),
    spotifyClientSecret: env(source, 'SPOTIFY_CLIENT_SECRET', ''),
    geniusToken: env(source, 'GENIUS_ACCESS_TOKEN', ''),
    dbPath: path.resolve(env(source, 'DB_PATH', './database.db')),
    isProduction: env(source, 'NODE_ENV', 'production') === 'production',
    dashboardTheme: env(source, 'DASHBOARD_THEME', 'dark').toLowerCase(),
    dashboardColorScheme: env(source, 'DASHBOARD_COLOR_SCHEME', 'default').toLowerCase(),
    dashboardEnabled: true,
    supervisorEnabled: true,
    youtubeOAuthEnabled: true
  };
}

/** Module-level config. Imported by every subsystem, so in-place mutation propagates. */
export const config: ServerConfig = buildConfig(process.env);

/**
 * Rebuilds config from an environment source and applies overrides to the shared object.
 * Used by the library API (`startServer`) so hosts can inject their own settings.
 */
export function configure(
  overrides: Partial<ServerConfig>,
  source: EnvSource = process.env
): ServerConfig {
  Object.assign(config, { ...buildConfig(source), ...overrides });
  return config;
}