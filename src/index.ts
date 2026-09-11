import { config } from './config.js';
import { initDatabase, logSystemEvent } from './db.js';
import { LavalinkSupervisor } from './supervisor.js';
import { createProxyServer } from './proxy.js';
import { startKeepAlive, stopKeepAlive } from './keepAlive.js';
import { loadSavedOAuthToken, initiateDeviceFlow } from './youtubeOAuth.js';

async function main(): Promise<void> {
  console.log('==================================================');
  console.log('🔊 Lavalink v4 Cloud Audio Server & Dashboard');
  console.log(`🌐 Resolved Host Domain: ${config.domain}`);
  console.log(`🔌 Gateway Port:         ${config.port}`);
  console.log(`📍 Internal Node Port:   ${config.lavalinkHost}:${config.lavalinkPort}`);
  console.log(`💾 SQLite Persistence:   ${config.dbPath}`);
  console.log(`⚡ Mode:                 ${config.isProduction ? 'production' : 'development'}`);
  console.log('==================================================');

  if (!config.youtubeApiKey) {
    console.error('======================================================================');
    console.error('❌ [Fatal] YOUTUBE_API_KEY is required (YouTube OAuth Client ID).');
    console.error('It must be an OAuth Client ID of app type "TVs and Limited Input devices";');
    console.error('the YouTube authorization URL cannot be issued without it,');
    console.error('so the YouTube plugin cannot authenticate and Lavalink playback fails.');
    console.error('Set YOUTUBE_API_KEY in your environment (e.g. .env or Heroku config vars) and restart.');
    console.error('======================================================================');
    process.exit(1);
  }

  // 1. Initialize SQLite Database & Load In-Live Memory State
  initDatabase();
  const token = await loadSavedOAuthToken();
  if (!token) {
    console.log('[YouTube OAuth] No refresh token configured. Initiating OAuth device grant...');
    initiateDeviceFlow().catch((err) => {
      console.warn('[YouTube OAuth] Device flow notice:', err.message);
    });
  }

  logSystemEvent('info', 'Lavalink TypeScript gateway initialized', {
    domain: config.domain,
    port: config.port
  });

  // 2. Start Lavalink Java Supervisor
  const supervisor = new LavalinkSupervisor();
  await supervisor.start();

  // 3. Start Public Gateway Server (Dashboard + Audio Proxy)
  const { server } = createProxyServer({
    onRestart: async () => {
      await supervisor.restart();
    }
  });

  server.listen(config.port, config.host, () => {
    console.log(`[Gateway] Server listening on http://${config.host}:${config.port}`);
    console.log(`[Gateway] Dashboard available at http://${config.domain}:${config.port}/`);

    // Start background keep-alive pinger
    startKeepAlive();
  });

  // 4. Graceful Shutdown Handlers
  let isShuttingDown = false;
  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Gateway] Received ${signal}. Shutting down gracefully...`);
    logSystemEvent('info', `Server shutting down via ${signal}`);

    stopKeepAlive();

    server.close(() => {
      console.log('[Gateway] HTTP server closed.');
    });

    await supervisor.stop();
    console.log('[Gateway] Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

main().catch((err) => {
  console.error('[Fatal] Failed to start server:', err);
  process.exit(1);
});
