import { mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname } from "node:path";
import type { DatabaseSync } from "node:sqlite";

const require = createRequire(import.meta.url);
const { DatabaseSync: RuntimeDatabaseSync } = require("node:sqlite") as {
  DatabaseSync: new (path: string) => DatabaseSync;
};

export interface SqliteConnectionOptions {
  path: string;
}

export function openSqliteDatabase(options: SqliteConnectionOptions): DatabaseSync {
  if (options.path !== ":memory:") {
    mkdirSync(dirname(options.path), { recursive: true });
  }

  const database = new RuntimeDatabaseSync(options.path);
  database.exec("PRAGMA foreign_keys = ON;");
  database.exec("PRAGMA journal_mode = WAL;");
  database.exec("PRAGMA busy_timeout = 5000;");
  migrate(database);
  return database;
}

function migrate(database: DatabaseSync): void {
  database.exec(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      provider TEXT NOT NULL,
      pool TEXT NOT NULL,
      value TEXT NOT NULL,
      weight INTEGER NOT NULL,
      status TEXT NOT NULL,
      rpm_limit INTEGER,
      daily_request_limit INTEGER,
      last_used_at TEXT,
      cooling_down_until TEXT,
      failure_count INTEGER NOT NULL DEFAULT 0,
      metadata_json TEXT,
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_api_keys_pool_provider
      ON api_keys(pool, provider);

    CREATE TABLE IF NOT EXISTS usage_records (
      id TEXT PRIMARY KEY,
      request_id TEXT NOT NULL,
      route TEXT NOT NULL,
      model TEXT,
      pool TEXT,
      provider TEXT,
      key_id TEXT,
      status_code INTEGER NOT NULL,
      outcome TEXT NOT NULL,
      error_code TEXT,
      latency_ms INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_usage_records_created_at
      ON usage_records(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_usage_records_key_id_created_at
      ON usage_records(key_id, created_at DESC);

    CREATE TABLE IF NOT EXISTS health_events (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      level TEXT NOT NULL,
      request_id TEXT,
      provider TEXT,
      key_id TEXT,
      status_code INTEGER,
      code TEXT,
      message TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_health_events_created_at
      ON health_events(created_at DESC);

    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY,
      action TEXT NOT NULL,
      actor_type TEXT NOT NULL,
      actor_id TEXT NOT NULL,
      target_type TEXT NOT NULL,
      target_id TEXT,
      outcome TEXT NOT NULL,
      message TEXT NOT NULL,
      metadata_json TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at
      ON audit_logs(created_at DESC);

    CREATE INDEX IF NOT EXISTS idx_audit_logs_target
      ON audit_logs(target_type, target_id, created_at DESC);
  `);
}
