import type { ApiKeyRecord } from "@keypool/shared";

export interface QuotaManager {
  isEligible(key: ApiKeyRecord, now?: Date): boolean;
  recordRequest(key: ApiKeyRecord, now?: Date): void;
}

export class InMemoryQuotaManager implements QuotaManager {
  private readonly requestWindows = new Map<string, RequestWindow>();

  isEligible(key: ApiKeyRecord, now = new Date()): boolean {
    if (!key.rpmLimit) {
      return true;
    }

    const window = this.getCurrentWindow(key.id, now);

    return window.count < key.rpmLimit;
  }

  recordRequest(key: ApiKeyRecord, now = new Date()): void {
    if (!key.rpmLimit) {
      return;
    }

    const window = this.getCurrentWindow(key.id, now);
    window.count += 1;
    this.requestWindows.set(key.id, window);
  }

  private getCurrentWindow(keyId: string, now: Date): RequestWindow {
    const windowStartMs = getMinuteWindowStartMs(now);
    const existing = this.requestWindows.get(keyId);

    if (existing && existing.windowStartMs === windowStartMs) {
      return existing;
    }

    const nextWindow = {
      windowStartMs,
      count: 0
    };
    this.requestWindows.set(keyId, nextWindow);

    return nextWindow;
  }
}

interface RequestWindow {
  windowStartMs: number;
  count: number;
}

function getMinuteWindowStartMs(now: Date): number {
  return Math.floor(now.getTime() / 60_000) * 60_000;
}

