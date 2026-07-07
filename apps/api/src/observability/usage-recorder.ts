import { offsetFromCursor, pageFromItems, type PageQuery, type PaginatedResult } from "./pagination.js";

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

export interface UsageRecordQuery extends PageQuery {
  route?: string;
  model?: string;
  pool?: string;
  provider?: string;
  keyId?: string;
  outcome?: UsageOutcome;
  errorCode?: string;
}

export interface UsageRecordStats {
  total: number;
  success: number;
  error: number;
  avgLatencyMs: number;
}

export interface UsageRecorder {
  record(record: Omit<UsageRecord, "id" | "createdAt">): Promise<UsageRecord>;
  listRecent(query?: UsageRecordQuery): Promise<UsageRecord[]>;
  pageRecent(query?: UsageRecordQuery): Promise<PaginatedResult<UsageRecord>>;
  getStats(query?: UsageRecordQuery): Promise<UsageRecordStats>;
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
    const page = await this.pageRecent(query);
    return page.items;
  }

  async pageRecent(query: UsageRecordQuery = {}): Promise<PaginatedResult<UsageRecord>> {
    const limit = query.limit ?? 50;
    const offset = offsetFromCursor(query.cursor);
    const items = this.records
      .filter((record) => matchesUsageRecordQuery(record, query))
      .slice(offset, offset + limit + 1);
    return pageFromItems(items, limit, offset);
  }

  async getStats(query: UsageRecordQuery = {}): Promise<UsageRecordStats> {
    const records = this.records.filter((record) => matchesUsageRecordQuery(record, query));
    const success = records.filter((record) => record.outcome === "success").length;
    const error = records.filter((record) => record.outcome === "error").length;
    const totalLatency = records.reduce((sum, record) => sum + record.latencyMs, 0);

    return {
      total: records.length,
      success,
      error,
      avgLatencyMs: records.length > 0 ? Math.round(totalLatency / records.length) : 0
    };
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
