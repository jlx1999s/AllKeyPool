import type { DatabaseSync } from "node:sqlite";
import { offsetFromCursor, pageFromItems, type PaginatedResult } from "./pagination.js";
import type {
  AuditAction,
  AuditActorType,
  AuditLog,
  AuditLogQuery,
  AuditLogRecorder,
  AuditLogStats,
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
    const page = await this.pageRecent(query);
    return page.items;
  }

  async pageRecent(query: AuditLogQuery = {}): Promise<PaginatedResult<AuditLog>> {
    const limit = query.limit ?? 50;
    const offset = offsetFromCursor(query.cursor);
    const filters = buildWhereClause(query);

    const items = this.database
      .prepare(`SELECT * FROM audit_logs ${filters.whereSql} ORDER BY created_at DESC, rowid DESC LIMIT ? OFFSET ?`)
      .all(...filters.params, limit + 1, offset)
      .map((row) => rowToAuditLog(row as unknown as AuditLogRow));

    return pageFromItems(items, limit, offset);
  }

  async getStats(query: AuditLogQuery = {}): Promise<AuditLogStats> {
    const filters = buildWhereClause(query);
    const totalRow = this.database
      .prepare(`SELECT COUNT(*) AS total FROM audit_logs ${filters.whereSql}`)
      .get(...filters.params) as { total: number };
    const outcomeRows = this.database
      .prepare(`SELECT outcome, COUNT(*) AS count FROM audit_logs ${filters.whereSql} GROUP BY outcome`)
      .all(...filters.params) as Array<{ outcome: AuditOutcome; count: number }>;
    const actionRows = this.database
      .prepare(`SELECT action, COUNT(*) AS count FROM audit_logs ${filters.whereSql} GROUP BY action`)
      .all(...filters.params) as Array<{ action: AuditAction; count: number }>;
    const byOutcome: Record<AuditOutcome, number> = {
      success: 0,
      error: 0
    };
    const byAction: Partial<Record<AuditAction, number>> = {};

    for (const row of outcomeRows) byOutcome[row.outcome] = row.count;
    for (const row of actionRows) byAction[row.action] = row.count;

    return {
      total: totalRow.total,
      byOutcome,
      byAction
    };
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
