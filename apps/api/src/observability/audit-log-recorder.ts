export type AuditActorType = "admin" | "system";

export interface AuditActor {
  type: AuditActorType;
  id: string;
}

export type AuditAction =
  | "key_created"
  | "key_updated"
  | "key_status_changed"
  | "key_deleted";

export type AuditOutcome = "success" | "error";

export interface AuditLog {
  id: string;
  action: AuditAction;
  actor: AuditActor;
  targetType: string;
  targetId?: string;
  outcome: AuditOutcome;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface AuditLogQuery {
  limit?: number;
  action?: AuditAction;
  actorType?: AuditActorType;
  actorId?: string;
  targetType?: string;
  targetId?: string;
  outcome?: AuditOutcome;
}

export interface AuditLogRecorder {
  record(entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
  listRecent(query?: AuditLogQuery): Promise<AuditLog[]>;
}

export class InMemoryAuditLogRecorder implements AuditLogRecorder {
  private readonly entries: AuditLog[] = [];
  private sequence = 0;

  constructor(private readonly maxEntries = 500) {}

  async record(entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog> {
    this.sequence += 1;

    const auditLog: AuditLog = {
      ...entry,
      id: `audit-${this.sequence}`,
      createdAt: new Date()
    };

    this.entries.unshift(auditLog);

    if (this.entries.length > this.maxEntries) {
      this.entries.length = this.maxEntries;
    }

    return auditLog;
  }

  async listRecent(query: AuditLogQuery = {}): Promise<AuditLog[]> {
    const limit = query.limit ?? 50;
    return this.entries
      .filter((entry) => matchesAuditLogQuery(entry, query))
      .slice(0, limit);
  }
}

function matchesAuditLogQuery(entry: AuditLog, query: AuditLogQuery): boolean {
  if (query.action !== undefined && entry.action !== query.action) return false;
  if (query.actorType !== undefined && entry.actor.type !== query.actorType) return false;
  if (query.actorId !== undefined && entry.actor.id !== query.actorId) return false;
  if (query.targetType !== undefined && entry.targetType !== query.targetType) return false;
  if (query.targetId !== undefined && entry.targetId !== query.targetId) return false;
  if (query.outcome !== undefined && entry.outcome !== query.outcome) return false;
  return true;
}
