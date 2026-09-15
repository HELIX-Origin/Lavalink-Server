import path from 'node:path';

export interface ServerConfig {
  port: number;
  host: string;
  domain: string;
  pass: string;
  secure: boolean;
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
  internalUrl: string;
  publicUrl: string;
  dashboardPort: number;
  dashboardHost: string;
  dashboardInternalUrl: string;
  dashboardUrl: string;
}

function env(key: string, fallback: string): string {
  return process.env[key]?.trim() || fallback;
}

function envInt(key: string, fallback: number): number {
  const raw = process.env[key]?.trim();
  if (!raw) return fallback;
  const parsed = parseInt(raw, 10);
  return isNaN(parsed) || parsed < 1 || parsed > 65535 ? fallback : parsed;
}

function envBool(key: string, fallback: boolean): boolean {
  const raw = process.env[key]?.trim().toLowerCase();
  if (!raw) return fallback;
  return raw === 'true' || raw === '1';
}

function stripProtocol(url: string): string {
  return url.replace(/^https?:\/\//, '');
}

function parseBaseUrl(raw: string): { hostname: string; port: number } | null {
  try {
    const url = new URL(raw);
    if (!url.hostname) return null;
    const port = url.port ? parseInt(url.port, 10) : NaN;
    return {
      hostname: url.hostname,
      port: isNaN(port) || port < 1 || port > 65535 ? 0 : port
    };
  } catch {
    return null;
  }
}

const host = env('LAVA_HOST', '127.0.0.1');
const port = envInt('LAVA_PORT', 2333);
const secure = envBool('LAVA_SECURE', false);
const lavaDomainRaw = env('LAVA_DOMAIN', 'localhost');
const domain = stripProtocol(lavaDomainRaw);
const protocol = secure ? 'https' : 'http';
const publicProtocol = lavaDomainRaw.startsWith('https://') ? 'https' : protocol;

const dashboardInternalRaw = env('DASHBOARD_INTERNAL_URL', '');
const dashboardInternal = parseBaseUrl(dashboardInternalRaw);
const dashboardHost = dashboardInternal?.hostname || host;
const dashboardPort = dashboardInternal && dashboardInternal.port > 0 ? dashboardInternal.port : port + 1;
const dashboardInternalUrl = dashboardInternalRaw || `${protocol}://${dashboardHost}:${dashboardPort}`;
const dashboardUrl =
  env('DASHBOARD_PUBLIC_URL', '').replace(/\/+$/, '') ||
  dashboardInternalUrl;

export const config: ServerConfig = {
  port,
  host,
  domain,
  pass: env('LAVA_PASS', 'youshallnotpass'),
  secure,
  cipherUrl: env('LAVA_CIPHER_URL', 'https://cipher.kikkia.dev/'),
  cipherPassword: env('LAVA_CIPHER_PASSWORD', ''),
  youtubeClientId: env('YOUTUBE_CLIENT_ID', ''),
  youtubeClientSecret: env('YOUTUBE_CLIENT_SECRET', ''),
  spotifyClientId: env('SPOTIFY_CLIENT_ID', ''),
  spotifyClientSecret: env('SPOTIFY_CLIENT_SECRET', ''),
  geniusToken: env('GENIUS_ACCESS_TOKEN', ''),
  dbPath: path.resolve(env('DB_PATH', './database.db')),
  isProduction: env('NODE_ENV', 'production') === 'production',
  dashboardTheme: env('DASHBOARD_THEME', 'dark').toLowerCase(),
  dashboardColorScheme: env('DASHBOARD_COLOR_SCHEME', 'default').toLowerCase(),
  internalUrl: `${protocol}://${host}:${port}`,
  publicUrl: domain === 'localhost' ? `${protocol}://${host}:${port}` : `${publicProtocol}://${domain}`,
  dashboardPort,
  dashboardHost,
  dashboardInternalUrl,
  dashboardUrl,
};