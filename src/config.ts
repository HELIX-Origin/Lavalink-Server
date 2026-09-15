import path from 'node:path';
import fs from 'node:fs';
import * as yaml from 'js-yaml';

export interface ServerConfig {
  port: number;
  host: string;
  domain: string;
  lavalinkHost: string;
  lavalinkPort: number;
  lavalinkPass: string;
  adminKey: string;
  youtubeApiKey: string;
  youtubeApiSecret: string;
  dbPath: string;
  isProduction: boolean;
  keepAliveEnabled: boolean;
  keepAliveIntervalMs: number;
}

interface LavalinkYamlConfig {
  server?: {
    port?: number;
    address?: string;
  };
}

function loadLavalinkConfig(): LavalinkYamlConfig {
  const configPath = path.resolve(process.cwd(), 'application.yml');
  if (fs.existsSync(configPath)) {
    const content = fs.readFileSync(configPath, 'utf-8');
    return yaml.load(content) as LavalinkYamlConfig;
  }
  return {};
}

function resolveHostDomain(): string {
  if (process.env.PUBLIC_URL) {
    try {
      return new URL(process.env.PUBLIC_URL).hostname;
    } catch {
      return process.env.PUBLIC_URL;
    }
  }
  if (process.env.DOMAIN) {
    return process.env.DOMAIN;
  }
  if (process.env.HOST && process.env.HOST !== '0.0.0.0') {
    return process.env.HOST;
  }
  return 'localhost';
}

function resolveHostPort(lavaConfig: LavalinkYamlConfig): number {
  if (process.env.DASHBOARD_PORT || process.env.PORT || process.env.SERVER_PORT) {
    const portStr = process.env.DASHBOARD_PORT || process.env.PORT || process.env.SERVER_PORT!;
    const parsed = parseInt(portStr, 10);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 65535) {
      return parsed;
    }
  }
  if (lavaConfig.server?.port) {
    return lavaConfig.server.port + 1;
  }
  return 2333;
}

function resolveLavalinkHost(lavaConfig: LavalinkYamlConfig): string {
  if (lavaConfig.server?.address) {
    return lavaConfig.server.address.split('||')[0].trim();
  }
  return '127.0.0.1';
}

function resolveLavalinkPort(lavaConfig: LavalinkYamlConfig): number {
  if (lavaConfig.server?.port) {
    return lavaConfig.server.port;
  }
  return 2333;
}

const lavaConfig = loadLavalinkConfig();
const lavaPass = process.env.LAVA_PASS || 'youshallnotpass';

export const config: ServerConfig = {
  port: resolveHostPort(lavaConfig),
  host: '0.0.0.0',
  domain: resolveHostDomain(),
  lavalinkHost: resolveLavalinkHost(lavaConfig),
  lavalinkPort: resolveLavalinkPort(lavaConfig),
  lavalinkPass: lavaPass,
  adminKey: process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || lavaPass,
  youtubeApiKey: (process.env.YOUTUBE_CLIENT_ID || '').trim(),
  youtubeApiSecret: (process.env.YOUTUBE_CLIENT_SECRET || '').trim(),
  dbPath: process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'lavalink.sqlite'),
  isProduction: process.env.NODE_ENV === 'production',
  keepAliveEnabled: process.env.KEEP_ALIVE_ENABLED?.toLowerCase() !== 'false',
  keepAliveIntervalMs: Number.parseInt(
    process.env.KEEP_ALIVE_INTERVAL_MS || String(5 * 60 * 1000), // Default 5 minutes
    10
  )
};