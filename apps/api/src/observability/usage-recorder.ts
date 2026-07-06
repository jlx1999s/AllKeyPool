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

export interface UsageRecorder {
  record(record: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord>;
  listRecent(limit?: number): Promise<UsageRecord[]>;
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

  async listRecent(limit = 50): Promise<UsageRecord[]> {
    return this.records.slice(0, limit);
  }
}
