import { offsetFromCursor, pageFromItems, type PageQuery, type PaginatedResult } from "./pagination.js";

export type HealthEventLevel = "info" | "warn" | "error";

export type HealthEventType =
  | "provider_attempt_succeeded"
  | "provider_attempt_failed"
  | "key_exhausted"
  | "key_degraded"
  | "key_cooling_down"
  | "key_recovered"
  | "key_status_changed";

export interface HealthEvent {
  id: string;
  type: HealthEventType;
  level: HealthEventLevel;
  requestId?: string;
  provider?: string;
  keyId?: string;
  statusCode?: number;
  code?: string;
  message: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface HealthEventQuery extends PageQuery {
  type?: HealthEventType;
  level?: HealthEventLevel;
  requestId?: string;
  provider?: string;
  keyId?: string;
  code?: string;
  since?: Date;
}

export interface HealthEventStats {
  total: number;
  byLevel: Record<HealthEventLevel, number>;
  byType: Partial<Record<HealthEventType, number>>;
}

export interface HealthEventRecorder {
  record(event: Omit<HealthEvent, "id" | "createdAt">): Promise<HealthEvent>;
  listRecent(query?: HealthEventQuery): Promise<HealthEvent[]>;
  pageRecent(query?: HealthEventQuery): Promise<PaginatedResult<HealthEvent>>;
  getStats(query?: HealthEventQuery): Promise<HealthEventStats>;
}

export class InMemoryHealthEventRecorder implements HealthEventRecorder {
  private readonly events: HealthEvent[] = [];
  private sequence = 0;

  constructor(private readonly maxEvents = 500) {}

  async record(event: Omit<HealthEvent, "id" | "createdAt">): Promise<HealthEvent> {
    this.sequence += 1;

    const healthEvent: HealthEvent = {
      ...event,
      id: `health-event-${this.sequence}`,
      createdAt: new Date()
    };

    this.events.unshift(healthEvent);

    if (this.events.length > this.maxEvents) {
      this.events.length = this.maxEvents;
    }

    return healthEvent;
  }

  async listRecent(query: HealthEventQuery = {}): Promise<HealthEvent[]> {
    const page = await this.pageRecent(query);
    return page.items;
  }

  async pageRecent(query: HealthEventQuery = {}): Promise<PaginatedResult<HealthEvent>> {
    const limit = query.limit ?? 50;
    const offset = offsetFromCursor(query.cursor);
    const items = this.events
      .filter((event) => matchesHealthEventQuery(event, query))
      .slice(offset, offset + limit + 1);
    return pageFromItems(items, limit, offset);
  }

  async getStats(query: HealthEventQuery = {}): Promise<HealthEventStats> {
    const events = this.events.filter((event) => matchesHealthEventQuery(event, query));
    const byLevel: Record<HealthEventLevel, number> = {
      info: 0,
      warn: 0,
      error: 0
    };
    const byType: Partial<Record<HealthEventType, number>> = {};

    for (const event of events) {
      byLevel[event.level] += 1;
      byType[event.type] = (byType[event.type] ?? 0) + 1;
    }

    return {
      total: events.length,
      byLevel,
      byType
    };
  }
}

function matchesHealthEventQuery(event: HealthEvent, query: HealthEventQuery): boolean {
  if (query.type !== undefined && event.type !== query.type) return false;
  if (query.level !== undefined && event.level !== query.level) return false;
  if (query.requestId !== undefined && event.requestId !== query.requestId) return false;
  if (query.provider !== undefined && event.provider !== query.provider) return false;
  if (query.keyId !== undefined && event.keyId !== query.keyId) return false;
  if (query.code !== undefined && event.code !== query.code) return false;
  if (query.since !== undefined && event.createdAt < query.since) return false;
  return true;
}
