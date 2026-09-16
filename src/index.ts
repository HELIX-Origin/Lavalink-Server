import 'dotenv/config';
import { pathToFileURL } from 'node:url';
import { startServer } from './app.js';
import { config } from './config.js';
import { logSystemEvent } from './db.js';

async function main(): Promise<void> {
  console.log('==================================================');
  console.log('🔊 Lavalink v4 Audio Server & Dashboard');
  console.log(`🌐 Public Host:         ${config.publicHost}`);
  console.log(`🔌 Internal Node:       ${config.internalHost}:${config.internalPort}`);
  console.log(`📊 Gateway Port:        ${config.gatewayHost}:${config.gatewayPort}`);
  console.log(`📍 Internal WS:         ${config.internalWsUri}`);
  console.log(`🌍 Public WS:           ${config.publicWsUri}`);
  console.log(`💾 SQLite Persistence:  ${config.dbPath}`);
  console.log(`⚡ Mode:                ${config.isProduction ? 'production' : 'development'}`);
  console.log('==================================================');

  const handle = await startServer({ features: { dashboard: true } });

  handle.server.listen(config.gatewayPort, config.gatewayHost, () => {
    console.log(`[Gateway] Server listening on http://${config.gatewayHost}:${config.gatewayPort}`);
    console.log(`[Gateway] Dashboard:   ${config.publicUrl}/dashboard (or http://${config.gatewayHost}:${config.gatewayPort}/dashboard)`);
    console.log(`[Gateway] Server:      ${config.publicUrl}/server`);
    console.log(`[Gateway] Internal:    ${config.internalUrl} (WS: ${config.internalWsUri})`);
  });

  let isShuttingDown = false;
  const handleShutdown = async (signal: string) => {
    if (isShuttingDown) return;
    isShuttingDown = true;
    console.log(`\n[Gateway] Received ${signal}. Shutting down gracefully...`);
    logSystemEvent('info', `Server shutting down via ${signal}`);

    await handle.stop();
    console.log('[Gateway] Shutdown complete.');
    process.exit(0);
  };

  process.on('SIGINT', () => handleShutdown('SIGINT'));
  process.on('SIGTERM', () => handleShutdown('SIGTERM'));
}

// Only auto-run when invoked directly (node dist/index.js / npm start / tsx src/index.ts).
// When imported as a library, hosts use `startServer` from app.js instead.
const isMainModule =
  !!process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isMainModule) {
  main().catch((err) => {
    console.error('[Fatal] Failed to start server:', err instanceof Error ? err.message : err);
    process.exit(1);
  });
}