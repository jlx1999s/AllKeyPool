import type { DatabaseSync } from "node:sqlite";
import type {
  HealthEvent,
  HealthEventLevel,
  HealthEventQuery,
  HealthEventRecorder,
  HealthEventType
} from "./health-event-recorder.js";

interface HealthEventRow {
  id: string;
  type: HealthEventType;
  level: HealthEventLevel;
  request_id: string | null;
  provider: string | null;
  key_id: string | null;
  status_code: number | null;
  code: string | null;
  message: string;
  metadata_json: string | null;
  created_at: string;
}

export class SqliteHealthEventRecorder implements HealthEventRecorder {
  constructor(private readonly database: DatabaseSync) {}

  async record(event: Omit<HealthEvent, "id" | "createdAt">): Promise<HealthEvent> {
    const healthEvent: HealthEvent = {
      ...event,
      id: createRecordId("health-event"),
      createdAt: new Date()
    };

    this.database.prepare(`
      INSERT INTO health_events (
        id, type, level, request_id, provider, key_id, status_code,
        code, message, metadata_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      healthEvent.id,
      healthEvent.type,
      healthEvent.level,
      healthEvent.requestId ?? null,
      healthEvent.provider ?? null,
      healthEvent.keyId ?? null,
      healthEvent.statusCode ?? null,
      healthEvent.code ?? null,
      healthEvent.message,
      healthEvent.metadata === undefined ? null : JSON.stringify(healthEvent.metadata),
      healthEvent.createdAt.toISOString()
    );

    return healthEvent;
  }

  async listRecent(query: HealthEventQuery = {}): Promise<HealthEvent[]> {
    const limit = query.limit ?? 50;
    const filters = buildWhereClause(query);

    return this.database
      .prepare(`SELECT * FROM health_events ${filters.whereSql} ORDER BY created_at DESC, id DESC LIMIT ?`)
      .all(...filters.params, limit)
      .map((row) => rowToHealthEvent(row as unknown as HealthEventRow));
  }
}

function buildWhereClause(query: HealthEventQuery): {
  whereSql: string;
  params: string[];
} {
  const clauses: string[] = [];
  const params: string[] = [];

  addFilter(clauses, params, "type", query.type);
  addFilter(clauses, params, "level", query.level);
  addFilter(clauses, params, "request_id", query.requestId);
  addFilter(clauses, params, "provider", query.provider);
  addFilter(clauses, params, "key_id", query.keyId);
  addFilter(clauses, params, "code", query.code);

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

function rowToHealthEvent(row: HealthEventRow): HealthEvent {
  const event: HealthEvent = {
    id: row.id,
    type: row.type,
    level: row.level,
    message: row.message,
    createdAt: new Date(row.created_at)
  };

  if (row.request_id !== null) event.requestId = row.request_id;
  if (row.provider !== null) event.provider = row.provider;
  if (row.key_id !== null) event.keyId = row.key_id;
  if (row.status_code !== null) event.statusCode = row.status_code;
  if (row.code !== null) event.code = row.code;
  if (row.metadata_json !== null) {
    const parsed = JSON.parse(row.metadata_json) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      event.metadata = parsed as Record<string, unknown>;
    }
  }

  return event;
}

function createRecordId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
