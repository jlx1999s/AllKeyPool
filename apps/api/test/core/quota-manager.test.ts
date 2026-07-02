import type { ApiKeyRecord } from "@keypool/shared";
import { describe, expect, it } from "vitest";
import { InMemoryQuotaManager } from "../../src/core/quota/quota-manager.js";

function key(rpmLimit?: number): ApiKeyRecord {
  const record: ApiKeyRecord = {
    id: "key-1",
    provider: "openai",
    pool: "text_generation",
    value: "secret",
    weight: 1,
    status: "healthy",
    failureCount: 0
  };

  if (rpmLimit !== undefined) {
    record.rpmLimit = rpmLimit;
  }

  return record;
}

describe("InMemoryQuotaManager", () => {
  it("allows keys without rpm limits", () => {
    const quotaManager = new InMemoryQuotaManager();

    expect(quotaManager.isEligible(key())).toBe(true);
  });

  it("blocks keys that exceed rpm limit inside the same minute", () => {
    const quotaManager = new InMemoryQuotaManager();
    const limitedKey = key(1);
    const now = new Date("2026-07-02T08:00:10.000Z");

    expect(quotaManager.isEligible(limitedKey, now)).toBe(true);

    quotaManager.recordRequest(limitedKey, now);

    expect(quotaManager.isEligible(limitedKey, now)).toBe(false);
  });

  it("resets request count in the next minute window", () => {
    const quotaManager = new InMemoryQuotaManager();
    const limitedKey = key(1);

    quotaManager.recordRequest(limitedKey, new Date("2026-07-02T08:00:10.000Z"));

    expect(quotaManager.isEligible(limitedKey, new Date("2026-07-02T08:01:00.000Z"))).toBe(true);
  });
});
