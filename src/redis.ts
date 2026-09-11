import RedisMock from 'ioredis-mock';

// Initialize embedded in-memory Redis instance for real-time pub/sub and metrics caching
export const redis = new RedisMock();

export const REDIS_KEYS = {
  STATUS: 'lavalink:status',
  INFO: 'lavalink:info',
  STATS: 'lavalink:stats',
  CLIENTS: 'lavalink:clients',
  LOGS: 'lavalink:logs',
  YOUTUBE_REFRESH_TOKEN: 'lavalink:youtube:refresh_token',
  YOUTUBE_OAUTH_STATE: 'lavalink:youtube:oauth_state'
} as const;

export async function setCachedYouTubeToken(token: string): Promise<void> {
  await redis.set(REDIS_KEYS.YOUTUBE_REFRESH_TOKEN, token);
}

export async function getCachedYouTubeToken(): Promise<string | null> {
  return await redis.get(REDIS_KEYS.YOUTUBE_REFRESH_TOKEN);
}

export async function setCachedYouTubeOAuthState(state: Record<string, unknown>): Promise<void> {
  await redis.set(REDIS_KEYS.YOUTUBE_OAUTH_STATE, JSON.stringify(state));
}

export async function getCachedYouTubeOAuthState(): Promise<Record<string, unknown> | null> {
  const data = await redis.get(REDIS_KEYS.YOUTUBE_OAUTH_STATE);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function setCachedStatus(status: 'starting' | 'online' | 'restarting' | 'offline'): Promise<void> {
  await redis.set(REDIS_KEYS.STATUS, status);
}

export async function getCachedStatus(): Promise<string> {
  const status = await redis.get(REDIS_KEYS.STATUS);
  return status || 'starting';
}

export async function setCachedStats(stats: Record<string, unknown>): Promise<void> {
  await redis.set(REDIS_KEYS.STATS, JSON.stringify(stats));
}

export async function getCachedStats(): Promise<Record<string, unknown> | null> {
  const data = await redis.get(REDIS_KEYS.STATS);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function setCachedInfo(info: Record<string, unknown>): Promise<void> {
  await redis.set(REDIS_KEYS.INFO, JSON.stringify(info));
}

export async function getCachedInfo(): Promise<Record<string, unknown> | null> {
  const data = await redis.get(REDIS_KEYS.INFO);
  if (!data) return null;
  try {
    return JSON.parse(data);
  } catch {
    return null;
  }
}

export async function appendRecentLog(logLine: string): Promise<void> {
  await redis.lpush(REDIS_KEYS.LOGS, logLine);
  await redis.ltrim(REDIS_KEYS.LOGS, 0, 99); // Retain last 100 log lines
}

export async function getRecentLogs(limit = 50): Promise<string[]> {
  return await redis.lrange(REDIS_KEYS.LOGS, 0, limit - 1);
}
