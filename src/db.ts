import fs from 'node:fs';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { config } from './config.js';

let db: DatabaseSync | null = null;

export interface MetricSnapshot {
  id?: number;
  timestamp: number;
  players: number;
  playingPlayers: number;
  uptimeSeconds: number;
  jvmMemoryUsedMb: number;
  jvmMemoryAllocatedMb: number;
  cpuSystemLoad: number;
  cpuLavalinkLoad: number;
}

export interface ClientSession {
  id: string;
  clientName: string;
  remoteIp: string;
  connectedAt: number;
  disconnectedAt: number | null;
}

export interface SystemEvent {
  id?: number;
  timestamp: number;
  level: 'info' | 'warn' | 'error';
  message: string;
  metadata?: string;
}

export function initDatabase(): DatabaseSync {
  if (db) return db;

  const dbDir = path.dirname(config.dbPath);
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new DatabaseSync(config.dbPath);

  // Set performant pragmas
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA synchronous = NORMAL;
  `);

  // Create tables
  db.exec(`
    CREATE TABLE IF NOT EXISTS metrics_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      players INTEGER NOT NULL DEFAULT 0,
      playing_players INTEGER NOT NULL DEFAULT 0,
      uptime_seconds INTEGER NOT NULL DEFAULT 0,
      jvm_memory_used_mb REAL NOT NULL DEFAULT 0,
      jvm_memory_allocated_mb REAL NOT NULL DEFAULT 0,
      cpu_system_load REAL NOT NULL DEFAULT 0,
      cpu_lavalink_load REAL NOT NULL DEFAULT 0
    );

    CREATE INDEX IF NOT EXISTS idx_metrics_timestamp ON metrics_history(timestamp);

    CREATE TABLE IF NOT EXISTS client_sessions (
      id TEXT PRIMARY KEY,
      client_name TEXT NOT NULL,
      remote_ip TEXT NOT NULL,
      connected_at INTEGER NOT NULL,
      disconnected_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS system_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      timestamp INTEGER NOT NULL,
      level TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_events_timestamp ON system_events(timestamp);

    CREATE TABLE IF NOT EXISTS system_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at INTEGER NOT NULL
    );
  `);

  return db;
}

export function saveSystemSetting(key: string, value: string): void {
  try {
    const database = initDatabase();
    database.prepare(`
      INSERT INTO system_settings (key, value, updated_at)
      VALUES (?, ?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at
    `).run(key, value, Date.now());
  } catch (err) {
    console.error(`[DB] Failed to save setting "${key}":`, err);
  }
}

export function getSystemSetting(key: string): string | null {
  try {
    const database = initDatabase();
    const row = database.prepare(`
      SELECT value FROM system_settings WHERE key = ?
    `).get(key) as { value: string } | undefined;
    return row?.value ?? null;
  } catch (err) {
    console.error(`[DB] Failed to get setting "${key}":`, err);
    return null;
  }
}

export function saveMetricSnapshot(snapshot: Omit<MetricSnapshot, 'id'>): void {
  try {
    const database = initDatabase();
    database.prepare(`
      INSERT INTO metrics_history (
        timestamp, players, playing_players, uptime_seconds,
        jvm_memory_used_mb, jvm_memory_allocated_mb, cpu_system_load, cpu_lavalink_load
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      snapshot.timestamp,
      snapshot.players,
      snapshot.playingPlayers,
      snapshot.uptimeSeconds,
      snapshot.jvmMemoryUsedMb,
      snapshot.jvmMemoryAllocatedMb,
      snapshot.cpuSystemLoad,
      snapshot.cpuLavalinkLoad
    );

    // Keep metrics table pruned to last 10,000 entries
    database.prepare(`
      DELETE FROM metrics_history WHERE id IN (
        SELECT id FROM metrics_history ORDER BY id DESC LIMIT -1 OFFSET 10000
      )
    `).run();
  } catch (err) {
    console.error('[DB] Failed to save metric snapshot:', err);
  }
}

export function getRecentMetrics(limit = 30): MetricSnapshot[] {
  try {
    const database = initDatabase();
    const rows = database.prepare(`
      SELECT 
        id, timestamp, players, playing_players as playingPlayers,
        uptime_seconds as uptimeSeconds, jvm_memory_used_mb as jvmMemoryUsedMb,
        jvm_memory_allocated_mb as jvmMemoryAllocatedMb,
        cpu_system_load as cpuSystemLoad, cpu_lavalink_load as cpuLavalinkLoad
      FROM metrics_history
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as unknown as MetricSnapshot[];
    return rows.reverse();
  } catch (err) {
    console.error('[DB] Failed to get metrics:', err);
    return [];
  }
}

export function recordClientSessionStart(id: string, clientName: string, remoteIp: string): void {
  try {
    const database = initDatabase();
    database.prepare(`
      INSERT OR REPLACE INTO client_sessions (id, client_name, remote_ip, connected_at, disconnected_at)
      VALUES (?, ?, ?, ?, NULL)
    `).run(id, clientName, remoteIp, Date.now());
  } catch (err) {
    console.error('[DB] Failed to record client start:', err);
  }
}

export function recordClientSessionEnd(id: string): void {
  try {
    const database = initDatabase();
    database.prepare(`
      UPDATE client_sessions SET disconnected_at = ? WHERE id = ?
    `).run(Date.now(), id);
  } catch (err) {
    console.error('[DB] Failed to record client end:', err);
  }
}

export function getActiveClientSessions(): ClientSession[] {
  try {
    const database = initDatabase();
    return database.prepare(`
      SELECT id, client_name as clientName, remote_ip as remoteIp, connected_at as connectedAt, disconnected_at as disconnectedAt
      FROM client_sessions
      WHERE disconnected_at IS NULL
      ORDER BY connected_at DESC
    `).all() as unknown as ClientSession[];
  } catch (err) {
    console.error('[DB] Failed to get active clients:', err);
    return [];
  }
}

export function logSystemEvent(level: 'info' | 'warn' | 'error', message: string, metadata?: Record<string, unknown>): void {
  try {
    const database = initDatabase();
    database.prepare(`
      INSERT INTO system_events (timestamp, level, message, metadata)
      VALUES (?, ?, ?, ?)
    `).run(Date.now(), level, message, metadata ? JSON.stringify(metadata) : null);
  } catch (err) {
    console.error('[DB] Failed to log system event:', err);
  }
}

export function getRecentSystemEvents(limit = 50): SystemEvent[] {
  try {
    const database = initDatabase();
    return database.prepare(`
      SELECT id, timestamp, level, message, metadata
      FROM system_events
      ORDER BY timestamp DESC
      LIMIT ?
    `).all(limit) as unknown as SystemEvent[];
  } catch (err) {
    console.error('[DB] Failed to get system events:', err);
    return [];
  }
}
