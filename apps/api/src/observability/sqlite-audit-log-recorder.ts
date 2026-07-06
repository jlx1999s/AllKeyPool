import type { DatabaseSync } from "node:sqlite";
import type {
  AuditAction,
  AuditActorType,
  AuditLog,
  AuditLogQuery,
  AuditLogRecorder,
  AuditOutcome
} from "./audit-log-recorder.js";

interface AuditLogRow {
  id: string;
  action: AuditAction;
  actor_type: AuditActorType;
  actor_id: string;
  target_type: string;
  target_id: string | null;
  outcome: AuditOutcome;
  message: string;
  metadata_json: string | null;
  created_at: string;
}

export class SqliteAuditLogRecorder implements AuditLogRecorder {
  constructor(private readonly database: DatabaseSync) {}

  async record(entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    const auditLog: AuditLog = {
      ...entry,
      id: createRecordId("audit"),
      createdAt: new Date()
    };

    this.database.prepare(`
      INSERT INTO audit_logs (
        id, action, actor_type, actor_id, target_type, target_id,
        outcome, message, metadata_json, created_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      auditLog.id,
      auditLog.action,
      auditLog.actor.type,
      auditLog.actor.id,
      auditLog.targetType,
      auditLog.targetId ?? null,
      auditLog.outcome,
      auditLog.message,
      auditLog.metadata === undefined ? null : JSON.stringify(auditLog.metadata),
      auditLog.createdAt.toISOString()
    );

    return auditLog;
  }

  async listRecent(query: AuditLogQuery = {}): Promise<AuditLog[]> {
    const limit = query.limit ?? 50;
    const filters = buildWhereClause(query);

    return this.database
      .prepare(`SELECT * FROM audit_logs ${filters.whereSql} ORDER BY created_at DESC, rowid DESC LIMIT ?`)
      .all(...filters.params, limit)
      .map((row) => rowToAuditLog(row as unknown as AuditLogRow));
  }
}

function buildWhereClause(query: AuditLogQuery): {
  whereSql: string;
  params: string[];
} {
  const clauses: string[] = [];
  const params: string[] = [];

  addFilter(clauses, params, "action", query.action);
  addFilter(clauses, params, "actor_type", query.actorType);
  addFilter(clauses, params, "actor_id", query.actorId);
  addFilter(clauses, params, "target_type", query.targetType);
  addFilter(clauses, params, "target_id", query.targetId);
  addFilter(clauses, params, "outcome", query.outcome);

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

function rowToAuditLog(row: AuditLogRow): AuditLog {
  const auditLog: AuditLog = {
    id: row.id,
    action: row.action,
    actor: {
      type: row.actor_type,
      id: row.actor_id
    },
    targetType: row.target_type,
    outcome: row.outcome,
    message: row.message,
    createdAt: new Date(row.created_at)
  };

  if (row.target_id !== null) auditLog.targetId = row.target_id;
  if (row.metadata_json !== null) {
    const parsed = JSON.parse(row.metadata_json) as unknown;
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      auditLog.metadata = parsed as Record<string, unknown>;
    }
  }

  return auditLog;
}

function createRecordId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}
