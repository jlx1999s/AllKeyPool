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

export interface HealthEventRecorder {
  record(event: Omit<HealthEvent, "id" | "createdAt">): Promise<HealthEvent>;
  listRecent(limit?: number): Promise<HealthEvent[]>;
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

  async listRecent(limit = 50): Promise<HealthEvent[]> {
    return this.events.slice(0, limit);
  }
}
