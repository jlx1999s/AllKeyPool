import type { DatabaseSync } from "node:sqlite";
import type { UsageOutcome, UsageRecord, UsageRecordQuery, UsageRecorder } from "./usage-recorder.js";

interface UsageRecordRow {
  id: string;
  request_id: string;
  route: string;
  model: string | null;
  pool: string | null;
  provider: string | null;
  key_id: string | null;
  status_code: number;
  outcome: UsageOutcome;
  error_code: string | null;
  latency_ms: number;
  created_at: string;
}

export class SqliteUsageRecorder implements UsageRecorder {
  constructor(private readonly database: DatabaseSync) {}

  async record(record: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord> {
    const usageRecord: UsageRecord = {
      ...record,
      id: createRecordId("usage"),
      createdAt: new Date()
    };

    this.database.prepare(`
      INSERT INTO usage_records (
        id, request_id, route, model, pool, provider, key_id, status_code,
        outcome, error_code, latency_ms, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      usageRecord.id,
      usageRecord.requestId,
      usageRecord.route,
      usageRecord.model ?? null,
      usageRecord.pool ?? null,
      usageRecord.provider ?? null,
      usageRecord.keyId ?? null,
      usageRecord.statusCode,
      usageRecord.outcome,
      usageRecord.errorCode ?? null,
      usageRecord.latencyMs,
      usageRecord.createdAt.toISOString()
    );

    return usageRecord;
  }

  async listRecent(query: UsageRecordQuery = {}): Promise<UsageRecord[]> {
    const limit = query.limit ?? 50;
    const filters = buildWhereClause(query);

    return this.database
      .prepare(`SELECT * FROM usage_records ${filters.whereSql} ORDER BY created_at DESC, id DESC LIMIT ?`)
      .all(...filters.params, limit)
      .map((row) => rowToUsageRecord(row as unknown as UsageRecordRow));
  }
}

function buildWhereClause(query: UsageRecordQuery): {
  whereSql: string;
  params: string[];
} {
  const clauses: string[] = [];
  const params: string[] = [];

  addFilter(clauses, params, "route", query.route);
  addFilter(clauses, params, "model", query.model);
  addFilter(clauses, params, "pool", query.pool);
  addFilter(clauses, params, "provider", query.provider);
  addFilter(clauses, params, "key_id", query.keyId);
  addFilter(clauses, params, "outcome", query.outcome);
  addFilter(clauses, params, "error_code", query.errorCode);

  return {
    whereSql: clauses.length === 0 ? "" : `WHERE ${clauses.join(" AND ")}`,
    params
  };
}

function addFilter(clauses: string[], params: string[], column: string, value: string | undefined): void {
  if (value === undefined) return;
  clauses.push(`${column} = ?`);
  params.push(value);
}

function rowToUsageRecord(row: UsageRecordRow): UsageRecord {
  const record: UsageRecord = {
    id: row.id,
    requestId: row.request_id,
    route: row.route,
    statusCode: row.status_code,
    outcome: row.outcome,
    latencyMs: row.latency_ms,
    createdAt: new Date(row.created_at)
  };

  if (row.model !== null) record.model = row.model;
  if (row.pool !== null) record.pool = row.pool;
  if (row.provider !== null) record.provider = row.provider;
  if (row.key_id !== null) record.keyId = row.key_id;
  if (row.error_code !== null) record.errorCode = row.error_code;

  return record;
}

function createRecordId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
