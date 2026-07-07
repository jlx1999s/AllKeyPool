import type { DatabaseSync } from "node:sqlite";
import { offsetFromCursor, pageFromItems, type PaginatedResult } from "./pagination.js";
import type { UsageOutcome, UsageRecord, UsageRecordQuery, UsageRecorder, UsageRecordStats } from "./usage-recorder.js";

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
    const page = await this.pageRecent(query);
    return page.items;
  }

  async pageRecent(query: UsageRecordQuery = {}): Promise<PaginatedResult<UsageRecord>> {
    const limit = query.limit ?? 50;
    const offset = offsetFromCursor(query.cursor);
    const filters = buildWhereClause(query);

    const items = this.database
      .prepare(`SELECT * FROM usage_records ${filters.whereSql} ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`)
      .all(...filters.params, limit + 1, offset)
      .map((row) => rowToUsageRecord(row as unknown as UsageRecordRow));

    return pageFromItems(items, limit, offset);
  }

  async getStats(query: UsageRecordQuery = {}): Promise<UsageRecordStats> {
    const filters = buildWhereClause(query);
    const row = this.database
      .prepare(`
        SELECT
          COUNT(*) AS total,
          SUM(CASE WHEN outcome = 'success' THEN 1 ELSE 0 END) AS success,
          SUM(CASE WHEN outcome = 'error' THEN 1 ELSE 0 END) AS error,
          COALESCE(ROUND(AVG(latency_ms)), 0) AS avg_latency_ms
        FROM usage_records
        ${filters.whereSql}
      `)
      .get(...filters.params) as {
        total: number;
        success: number | null;
        error: number | null;
        avg_latency_ms: number;
      };

    return {
      total: row.total,
      success: row.success ?? 0,
      error: row.error ?? 0,
      avgLatencyMs: row.avg_latency_ms
    };
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
