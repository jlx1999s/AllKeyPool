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

export interface HealthEventQuery {
  limit?: number;
  type?: HealthEventType;
  level?: HealthEventLevel;
  requestId?: string;
  provider?: string;
  keyId?: string;
  code?: string;
}

export interface HealthEventRecorder {
  record(event: Omit<HealthEvent, "id" | "createdAt">): Promise<HealthEvent>;
  listRecent(query?: HealthEventQuery): Promise<HealthEvent[]>;
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
    const limit = query.limit ?? 50;
    return this.events
      .filter((event) => matchesHealthEventQuery(event, query))
      .slice(0, limit);
  }
}

function matchesHealthEventQuery(event: HealthEvent, query: HealthEventQuery): boolean {
  if (query.type !== undefined && event.type !== query.type) return false;
  if (query.level !== undefined && event.level !== query.level) return false;
  if (query.requestId !== undefined && event.requestId !== query.requestId) return false;
  if (query.provider !== undefined && event.provider !== query.provider) return false;
  if (query.keyId !== undefined && event.keyId !== query.keyId) return false;
  if (query.code !== undefined && event.code !== query.code) return false;
  return true;
}
