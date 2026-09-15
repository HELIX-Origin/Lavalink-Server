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
  // Internal URLs (with ports)
  lavalinkInternalUrl: string;
  dashboardInternalUrl: string;
  // Public URLs (without ports, for Cloudflare tunnels, reverse proxies, etc.)
  lavalinkPublicUrl: string;
  dashboardPublicUrl: string;
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
    // Replace Spring-style ${VAR:default} with actual env values
    const resolvedContent = content.replace(/\$\{([A-Z_]+):([^}]+)\}/g, (match, envVar, defaultVal) => {
      return process.env[envVar] || defaultVal;
    });
    return yaml.load(resolvedContent) as LavalinkYamlConfig;
  }
  return {};
}

function parseUrl(url: string): { host: string; port: number; protocol: string } | null {
  try {
    const parsed = new URL(url);
    return {
      host: parsed.hostname,
      port: parsed.port ? parseInt(parsed.port, 10) : (parsed.protocol === 'https:' ? 443 : 80),
      protocol: parsed.protocol.replace(':', '')
    };
  } catch {
    return null;
  }
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

function buildInternalUrl(host: string, port: number, secure: boolean): string {
  const protocol = secure ? 'https' : 'http';
  return `${protocol}://${host}:${port}`;
}

function buildPublicUrl(envVar: string, fallback: string): string {
  if (process.env[envVar]) {
    return process.env[envVar]!.replace(/\/$/, '');
  }
  return fallback;
}

// Parse internal URLs to get host/port
const lavaInternalParsed = parseUrl(process.env.LAVA_INTERNAL_URL || 'http://localhost:2333');
const dashboardInternalParsed = parseUrl(process.env.DASHBOARD_INTERNAL_URL || 'http://localhost:2334');

const lavaConfig = loadLavalinkConfig();
const lavalinkPort = lavaInternalParsed?.port || resolveLavalinkPort(lavaConfig);
const dashboardPort = dashboardInternalParsed?.port || resolveHostPort(lavaConfig);
const lavalinkHost = lavaInternalParsed?.host || resolveLavalinkHost(lavaConfig);
const isSecure = process.env.LAVA_SECURE?.toLowerCase() === 'true';

const lavalinkInternalUrl = process.env.LAVA_INTERNAL_URL || buildInternalUrl(lavalinkHost, lavalinkPort, isSecure);
const dashboardInternalUrl = process.env.DASHBOARD_INTERNAL_URL || buildInternalUrl('127.0.0.1', dashboardPort, isSecure);

const lavalinkPublicUrl = buildPublicUrl('LAVA_PUBLIC_URL', lavalinkInternalUrl);
const dashboardPublicUrl = buildPublicUrl('DASHBOARD_PUBLIC_URL', dashboardInternalUrl);

const lavaPass = process.env.LAVA_PASS || 'youshallnotpass';

export const config: ServerConfig = {
  port: dashboardPort,
  host: '0.0.0.0',
  domain: resolveHostDomain(),
  lavalinkHost,
  lavalinkPort,
  lavalinkPass: lavaPass,
  adminKey: process.env.ADMIN_KEY || process.env.ADMIN_PASSWORD || lavaPass,
  youtubeApiKey: (process.env.YOUTUBE_CLIENT_ID || '').trim(),
  youtubeApiSecret: (process.env.YOUTUBE_CLIENT_SECRET || '').trim(),
  dbPath: process.env.DB_PATH || process.env.SQLITE_PATH || path.resolve(process.cwd(), 'data', 'lavalink.sqlite'),
  isProduction: process.env.NODE_ENV === 'production',
  lavalinkInternalUrl,
  dashboardInternalUrl,
  lavalinkPublicUrl,
  dashboardPublicUrl,
};