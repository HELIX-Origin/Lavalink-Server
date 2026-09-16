import type http from 'node:http';
import type { WebSocketServer } from 'ws';
import { existsSync } from 'node:fs';
import { config, configure, buildConfig, type ServerConfig } from './config.js';
import { initDatabase, logSystemEvent } from './db.js';
import { LavalinkSupervisor } from './supervisor.js';
import { createProxyServer } from './server.js';
import {
  loadSavedOAuthToken,
  initiateDeviceFlow,
  waitForDeviceFlow
} from './youtube-oauth.js';

export { config, configure, buildConfig };
export { LavalinkSupervisor };
export { createProxyServer };
export type { ServerConfig };

/**
 * Feature toggles for library embedding. When a feature field is omitted it
 * falls back to the default below — notably `dashboard` is DISABLED when the
 * server is imported as a library so the host project owns the UI.
 */
export interface ServerFeatures {
  dashboard?: boolean;
  supervisor?: boolean;
  youtubeOAuth?: boolean;
}

export interface ServerStartOptions {
  /** Alternate environment source (defaults to `process.env`). */
  env?: NodeJS.ProcessEnv;
  /** Direct configuration overrides applied on top of resolved env. */
  overrides?: Partial<ServerConfig>;
  /** Enable/disable specific subsystems. */
  features?: ServerFeatures;
  /** Custom restart wiring (defaults to restarting the Lavalink supervisor). */
  onRestart?: () => Promise<void>;
}

export interface ServerHandle {
  server: http.Server;
  wss: WebSocketServer;
  supervisor: LavalinkSupervisor;
  config: ServerConfig;
  stop: () => Promise<void>;
}

export class LavalinkConfigError extends Error {}

/**
 * Programmatic entry point for embedding the server as a library.
 *
 * - Loads dotenv only when running standalone (callers control their env here).
 * - Applies overrides + feature toggles to the shared `config` object.
 * - Throws descriptive errors instead of calling `process.exit`.
 * - Returns a handle for listening, inspecting and shutting down.
 */
export async function startServer(inputOptions: ServerStartOptions = {}): Promise<ServerHandle> {
  const envSource = inputOptions.env ?? process.env;
  const features = inputOptions.features ?? {};

  configure(
    {
      ...inputOptions.overrides,
      dashboardEnabled: features.dashboard ?? false,
      supervisorEnabled: features.supervisor ?? true,
      youtubeOAuthEnabled: features.youtubeOAuth ?? true
    },
    envSource
  );

  if (config.youtubeOAuthEnabled && !config.youtubeClientId) {
    throw new LavalinkConfigError(
      'YOUTUBE_CLIENT_ID is required (YouTube OAuth Client ID of app type "TVs and Limited Input ' +
        'devices"). Set it via your environment / .env, pass it in `overrides`, or disable the ' +
        '"youtubeOAuth" feature when embedding.'
    );
  }

  if (config.supervisorEnabled && !existsSync('Lavalink.jar')) {
    throw new LavalinkConfigError(
      'Lavalink.jar was not found in the current working directory (' + process.cwd() + '). ' +
        'As a library host you must provide your own Lavalink v4 JAR — download it from the ' +
        'official Lavalink releases (https://github.com/lavalink-devs/Lavalink/releases) into ' +
        'your project root, or disable the "supervisor" feature and manage the Java process ' +
        'yourself.'
    );
  }

  initDatabase();

  if (config.youtubeOAuthEnabled) {
    const token = await loadSavedOAuthToken();
    if (!token) {
      console.log('[YouTube OAuth] No refresh token configured. Initiating OAuth device grant...');
      await initiateDeviceFlow();
      await waitForDeviceFlow();
      console.log('[YouTube OAuth] Authorization successful!');
    }
  }

  logSystemEvent('info', 'Lavalink TypeScript gateway initialized', {
    internal: config.internalUrl,
    public: config.publicUrl,
    gateway: `${config.gatewayHost}:${config.gatewayPort}`
  });

  const supervisor = new LavalinkSupervisor();
  if (config.supervisorEnabled) {
    await supervisor.start();
  }

  const { server, wss } = createProxyServer({
    onRestart: inputOptions.onRestart ?? (() => supervisor.restart())
  });

  const stop = async (): Promise<void> => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await supervisor.stop();
  };

  return { server, wss, supervisor, config, stop };
}