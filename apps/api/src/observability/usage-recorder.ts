export type UsageOutcome = "success" | "error";

export interface UsageRecord {
  id: string;
  requestId: string;
  route: string;
  model?: string;
  pool?: string;
  provider?: string;
  keyId?: string;
  statusCode: number;
  outcome: UsageOutcome;
  errorCode?: string;
  latencyMs: number;
  createdAt: Date;
}

export interface UsageRecordQuery {
  limit?: number;
  route?: string;
  model?: string;
  pool?: string;
  provider?: string;
  keyId?: string;
  outcome?: UsageOutcome;
  errorCode?: string;
}

export interface UsageRecorder {
  record(record: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord>;
  listRecent(query?: UsageRecordQuery): Promise<UsageRecord[]>;
}

export class InMemoryUsageRecorder implements UsageRecorder {
  private readonly records: UsageRecord[] = [];
  private sequence = 0;

  constructor(private readonly maxRecords = 500) {}

  async record(record: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord> {
    this.sequence += 1;

    const usageRecord: UsageRecord = {
      ...record,
      id: `usage-${this.sequence}`,
      createdAt: new Date()
    };

    this.records.unshift(usageRecord);

    if (this.records.length > this.maxRecords) {
      this.records.length = this.maxRecords;
    }

    return usageRecord;
  }

  async listRecent(query: UsageRecordQuery = {}): Promise<UsageRecord[]> {
    const limit = query.limit ?? 50;
    return this.records
      .filter((record) => matchesUsageRecordQuery(record, query))
      .slice(0, limit);
  }
}

function matchesUsageRecordQuery(record: UsageRecord, query: UsageRecordQuery): boolean {
  if (query.route !== undefined && record.route !== query.route) return false;
  if (query.model !== undefined && record.model !== query.model) return false;
  if (query.pool !== undefined && record.pool !== query.pool) return false;
  if (query.provider !== undefined && record.provider !== query.provider) return false;
  if (query.keyId !== undefined && record.keyId !== query.keyId) return false;
  if (query.outcome !== undefined && record.outcome !== query.outcome) return false;
  if (query.errorCode !== undefined && record.errorCode !== query.errorCode) return false;
  return true;
}
