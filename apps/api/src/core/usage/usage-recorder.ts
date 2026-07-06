/**
 * Per-key request timeline. Each call records one entry; old entries are
 * evicted past `capacity` (default 64). Storage is process-local — this
 * is dev/demo observability, not a metrics store.
 *
 * Why a separate type rather than reusing ProviderError: we want a single
 * record shape that covers both success and failure, and the success path
 * currently has no structured event to attach to.
 */
export interface KeyUsageEntry {
  requestId: string;
  keyId: string;
  provider: string;
  pool: string;
  strategy: string;
  outcome: "success" | "error";
  statusCode?: number;
  errorCode?: string;
  latencyMs: number;
  at: string;
}

export interface UsageRecorder {
  record(entry: KeyUsageEntry): void;
  /** returns at most `limit` most-recent entries for the key, newest first */
  recent(keyId: string, limit?: number): KeyUsageEntry[];
  /** count of successful + failed requests in the recorded window */
  summary(keyId: string): {
    total: number;
    success: number;
    error: number;
    lastUsedAt?: string;
  };
  /** snapshot across all keys — useful for /admin/api/state */
  snapshot(): Record<string, ReturnType<UsageRecorder["summary"]>>;
}

export class InMemoryUsageRecorder implements UsageRecorder {
  private readonly capacity: number;
  private readonly entries = new Map<string, KeyUsageEntry[]>();

  constructor(options: { capacity?: number } = {}) {
    this.capacity = options.capacity ?? 64;
  }

  record(entry: KeyUsageEntry): void {
    const list = this.entries.get(entry.keyId) ?? [];
    list.push(entry);

    if (list.length > this.capacity) {
      list.splice(0, list.length - this.capacity);
    }

    this.entries.set(entry.keyId, list);
  }

  recent(keyId: string, limit = this.capacity): KeyUsageEntry[] {
    const list = this.entries.get(keyId) ?? [];
    const end = list.length;
    const start = Math.max(0, end - limit);

    return list.slice(start, end).reverse();
  }

  summary(keyId: string): {
    total: number;
    success: number;
    error: number;
    lastUsedAt?: string;
  } {
    const list = this.entries.get(keyId) ?? [];
    const total = list.length;
    let success = 0;
    let error = 0;
    let lastUsedAt: string | undefined;

    for (const entry of list) {
      if (entry.outcome === "success") {
        success += 1;
      } else {
        error += 1;
      }
    }

    if (list.length > 0) {
      lastUsedAt = list[list.length - 1]?.at;
    }

    return {
      total,
      success,
      error,
      ...(lastUsedAt !== undefined ? { lastUsedAt } : {})
    };
  }

  snapshot(): Record<string, ReturnType<UsageRecorder["summary"]>> {
    const result: Record<string, ReturnType<UsageRecorder["summary"]>> = {};

    for (const keyId of this.entries.keys()) {
      result[keyId] = this.summary(keyId);
    }

    return result;
  }
}
