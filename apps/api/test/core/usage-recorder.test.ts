import { describe, expect, it } from "vitest";
import { InMemoryUsageRecorder } from "../../src/core/usage/usage-recorder.js";

function entry(overrides: Partial<Parameters<InMemoryUsageRecorder["record"]>[0]> = {}) {
  return {
    requestId: "r1",
    keyId: "k1",
    provider: "fake",
    pool: "p",
    strategy: "round_robin",
    outcome: "success" as const,
    latencyMs: 12,
    at: new Date().toISOString(),
    ...overrides
  };
}

describe("InMemoryUsageRecorder", () => {
  it("records entries and exposes newest-first recent()", () => {
    const rec = new InMemoryUsageRecorder();
    rec.record(entry({ requestId: "r1", at: "2026-07-06T10:00:00.000Z" }));
    rec.record(entry({ requestId: "r2", at: "2026-07-06T10:00:01.000Z" }));
    rec.record(entry({ requestId: "r3", at: "2026-07-06T10:00:02.000Z" }));

    const recent = rec.recent("k1");
    expect(recent.map((e) => e.requestId)).toEqual(["r3", "r2", "r1"]);
  });

  it("respects capacity and evicts oldest", () => {
    const rec = new InMemoryUsageRecorder({ capacity: 3 });
    for (let i = 0; i < 5; i += 1) {
      rec.record(entry({ requestId: `r${i}` }));
    }

    expect(rec.recent("k1").map((e) => e.requestId)).toEqual(["r4", "r3", "r2"]);
  });

  it("summarizes success and error counts", () => {
    const rec = new InMemoryUsageRecorder();
    rec.record(entry({ outcome: "success" }));
    rec.record(entry({ outcome: "success" }));
    rec.record(entry({ outcome: "error", errorCode: "rate_limited" }));

    expect(rec.summary("k1")).toMatchObject({
      total: 3,
      success: 2,
      error: 1,
      lastUsedAt: expect.any(String)
    });
  });

  it("snapshot returns one summary per recorded key", () => {
    const rec = new InMemoryUsageRecorder();
    rec.record(entry({ keyId: "k1" }));
    rec.record(entry({ keyId: "k2" }));

    const snap = rec.snapshot();
    expect(Object.keys(snap).sort()).toEqual(["k1", "k2"]);
    expect(snap.k1?.total).toBe(1);
    expect(snap.k2?.total).toBe(1);
  });
});
