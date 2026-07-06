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

export interface AuditLogRecorder {
  record(entry: Omit<AuditLog, "id" | "createdAt">): Promise<AuditLog>;
  listRecent(limit?: number): Promise<AuditLog[]>;
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

  async listRecent(limit = 50): Promise<AuditLog[]> {
    return this.entries.slice(0, limit);
  }
}
