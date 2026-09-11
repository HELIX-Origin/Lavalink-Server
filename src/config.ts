import path from 'node:path';

export interface ServerConfig {
  port: number;
  host: string;
  domain: string;
  lavalinkHost: string;
  lavalinkPort: number;
  lavalinkPass: string;
  adminKey: string;
  youtubeApiKey: string;
  dbPath: string;
  isProduction: boolean;
  keepAliveEnabled: boolean;
  keepAliveIntervalMs: number;
}

function resolveHostDomain(): string {
  if (process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME) {
    return process.env.HEROKU_APP_DEFAULT_DOMAIN_NAME;
  }
  if (process.env.HEROKU_APP_NAME) {
    return `${process.env.HEROKU_APP_NAME}.herokuapp.com`;
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  if (process.env.HOST && process.env.HOST !== '0.0.0.0') {
    return process.env.HOST;
  }
  return 'localhost';
}

function resolveHostPort(): number {
  const portStr = process.env.PORT || process.env.SERVER_PORT;
  if (portStr) {
    const parsed = parseInt(portStr, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      return parsed;
    }
  }
  return 2333;
}

const lavaPass = process.env.LAVA_PASS || 'youshallnotpass';

export const config: ServerConfig = {
  port: resolveHostPort(),
  host: '0.0.0.0',
  domain: resolveHostDomain(),
  lavalinkHost: '127.0.0.1',
  lavalinkPort: 23333,
  lavalinkPass: lavaPass,
  adminKey: process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || lavaPass,
  youtubeApiKey: (process.env.YOUTUBE_API_KEY || '').trim(),
  dbPath: process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'lavalink.sqlite'),
  isProduction: process.env.NODE_ENV === 'production',
  keepAliveEnabled: process.env.KEEP_ALIVE_ENABLED?.toLowerCase() !== 'false',
  keepAliveIntervalMs: Number.parseInt(
    process.env.KEEP_ALIVE_INTERVAL_MS || String(5 * 60 * 1000), // Default 5 minutes (Heroku Eco Dyno sleep threshold is 30m)
    10
  )
};

