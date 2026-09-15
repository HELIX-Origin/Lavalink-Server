import { spawn, ChildProcess } from 'node:child_process';
import http from 'node:http';
import { config } from './config.js';
import { setCachedStatus, setCachedStats, setCachedInfo, appendRecentLog } from './redis.js';
import { logSystemEvent, saveMetricSnapshot } from './db.js';
import { loadSavedOAuthToken, saveYouTubeRefreshToken } from './youtube-oauth.js';

export class LavalinkSupervisor {
  private process: ChildProcess | null = null;
  private isShuttingDown = false;
  private pollInterval: NodeJS.Timeout | null = null;
  private restartCount = 0;
  private maxRestarts = 10;

  constructor() {}

  public async start(): Promise<void> {
    if (this.process) return;

    this.isShuttingDown = false;
    await setCachedStatus('starting');
    logSystemEvent('info', 'Lavalink supervisor starting Java process', {
      port: config.port,
      address: config.host
    });

    const javaArgs = [
      '-Xmx512M',
      '-Djdk.tls.client.protocols=TLSv1.2,TLSv1.3',
      '-Dspring.profiles.active=prod',
      `-Dserver.port=${config.port}`,
      `-Dserver.address=${config.host}`,
      '-jar',
      'Lavalink.jar'
    ];

    console.log(`[Supervisor] Spawning: java ${javaArgs.join(' ')}`);

    this.process = spawn('java', javaArgs, {
      cwd: process.cwd(),
      stdio: ['ignore', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PORT: String(config.port),
        SERVER_PORT: String(config.port)
      }
    });

    this.process.stdout?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      process.stdout.write(text);

      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        appendRecentLog(line.trim()).catch(() => {});
        if (line.includes('Lavalink is ready to accept connections')) {
          setCachedStatus('online').catch(() => {});
          logSystemEvent('info', 'Lavalink is ready to accept connections');
          this.restartCount = 0;
        }

        // Intercept native YouTube plugin OAuth events from Java stdout
        if (line.includes('OAUTH INTEGRATION:')) {
          // Plugin logs: "OAUTH INTEGRATION: Token retrieved successfully. Store your refresh token as this can be reused. (TOKEN)"
          const tokenMatch = line.match(/Store your refresh token as this can be reused\.\s*\(([^)\s]+)\)/i);
          if (tokenMatch && tokenMatch[1]) {
            const token = tokenMatch[1];
            console.log('\n======================================================================');
            console.log('✅ [YouTube OAuth] REFRESH TOKEN RETRIEVED FROM LAVALINK!');
            console.log('----------------------------------------------------------------------');
            console.log('📋 Copy this token to your environment variables (e.g. .env):');
            console.log(`YOUTUBE_REFRESH_TOKEN=${token}`);
            console.log('======================================================================\n');
            saveYouTubeRefreshToken(token).catch(() => {});
          }
        }
      }
    });

    this.process.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString();
      process.stderr.write(text);
      const lines = text.split('\n').filter(Boolean);
      for (const line of lines) {
        appendRecentLog(`[ERR] ${line.trim()}`).catch(() => {});
      }
    });

    this.process.on('error', (err) => {
      console.error('[Supervisor] Failed to spawn Lavalink Java process:', err);
      logSystemEvent('error', `Process spawn error: ${err.message}`);
    });

    this.process.on('close', async (code, signal) => {
      console.warn(`[Supervisor] Lavalink process closed with code ${code}, signal ${signal}`);
      this.process = null;

      if (!this.isShuttingDown) {
        await setCachedStatus('restarting');
        logSystemEvent('warn', `Process closed unexpectedly (code ${code})`, { code, signal });

        if (this.restartCount < this.maxRestarts) {
          this.restartCount++;
          const backoffMs = Math.min(1000 * Math.pow(2, this.restartCount), 30000);
          console.log(`[Supervisor] Restarting in ${backoffMs}ms (attempt ${this.restartCount}/${this.maxRestarts})...`);
          setTimeout(() => {
            this.start().catch((e) => console.error('[Supervisor] Restart failed:', e));
          }, backoffMs);
        } else {
          console.error('[Supervisor] Maximum restart limit reached. Service offline.');
          await setCachedStatus('offline');
          logSystemEvent('error', 'Maximum restart limit reached');
        }
      } else {
        await setCachedStatus('offline');
      }
    });

    // Start background stats poller
    this.startStatsPoller();
  }

  private startStatsPoller(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);

    let lastSnapshotTime = 0;

    this.pollInterval = setInterval(async () => {
      if (!this.process || this.isShuttingDown) return;

      try {
        const stats = await this.fetchLavalinkApi('/v4/stats');
        if (stats && typeof stats === 'object') {
          await setCachedStats(stats as Record<string, unknown>);
          await setCachedStatus('online');

          // Save SQLite snapshot every 60 seconds
          const now = Date.now();
          if (now - lastSnapshotTime >= 60000) {
            lastSnapshotTime = now;
            const memory = (stats as any).memory || {};
            const cpu = (stats as any).cpu || {};
            saveMetricSnapshot({
              timestamp: now,
              players: (stats as any).players || 0,
              playingPlayers: (stats as any).playingPlayers || 0,
              uptimeSeconds: Math.floor(((stats as any).uptime || 0) / 1000),
              jvmMemoryUsedMb: Math.round(((memory.used || 0) / (1024 * 1024)) * 10) / 10,
              jvmMemoryAllocatedMb: Math.round(((memory.allocated || 0) / (1024 * 1024)) * 10) / 10,
              cpuSystemLoad: Math.round((cpu.systemLoad || 0) * 100) / 100,
              cpuLavalinkLoad: Math.round((cpu.lavalinkLoad || 0) * 100) / 100
            });
          }
        }
      } catch {
        // Stats call may fail while server is booting or shutting down
      }
    }, 5000);
  }

  private fetchLavalinkApi(pathName: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: config.host,
          port: config.port,
          path: pathName,
          method: 'GET',
          headers: {
            Authorization: config.pass,
            Accept: 'application/json'
          },
          timeout: 3000
        },
        (res) => {
          let data = '';
          res.on('data', (c) => (data += c));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch {
                resolve(data);
              }
            } else {
              reject(new Error(`HTTP ${res.statusCode}`));
            }
          });
        }
      );

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Request timeout'));
      });
      req.end();
    });
  }

  public async stop(): Promise<void> {
    this.isShuttingDown = true;
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }

    if (this.process) {
      console.log('[Supervisor] Terminating Lavalink Java process...');
      this.process.kill('SIGTERM');

      const proc = this.process;
      const killTimer = setTimeout(() => {
        try {
          proc.kill('SIGKILL');
        } catch {}
      }, 5000);

      await new Promise<void>((resolve) => {
        proc.once('close', () => {
          clearTimeout(killTimer);
          resolve();
        });
      });
      this.process = null;
    }

    await setCachedStatus('offline');
    logSystemEvent('info', 'Lavalink supervisor stopped');
  }

  public async restart(): Promise<void> {
    console.log('[Supervisor] Restarting Lavalink supervisor...');
    logSystemEvent('info', 'Lavalink supervisor restart triggered');
    await this.stop();
    await this.start();
  }
}
