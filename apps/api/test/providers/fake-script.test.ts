import { describe, expect, it } from "vitest";
import {
  burstRateLimit,
  periodic,
  probability,
  rateLimitedOutcome,
  sequence,
  serverErrorOutcome
} from "../../src/providers/fake/fake-script.js";

const fakeCtx = (keyId = "k") => ({ keyId, now: () => new Date() });

describe("fake-script strategies", () => {
  it("sequence consumes outcomes in order then returns undefined", () => {
    const s = sequence([rateLimitedOutcome(), rateLimitedOutcome()]);

    expect(s.next(fakeCtx())?.code).toBe("rate_limited");
    expect(s.next(fakeCtx())?.code).toBe("rate_limited");
    expect(s.next(fakeCtx())).toBeUndefined();
    expect(s.next(fakeCtx())).toBeUndefined();
  });

  it("periodic fires on the Nth call only", () => {
    const s = periodic({ period: 3, outcome: rateLimitedOutcome() });

    expect(s.next(fakeCtx())).toBeUndefined();
    expect(s.next(fakeCtx())).toBeUndefined();
    expect(s.next(fakeCtx())?.code).toBe("rate_limited");
    expect(s.next(fakeCtx())).toBeUndefined();
    expect(s.next(fakeCtx())).toBeUndefined();
    expect(s.next(fakeCtx())?.code).toBe("rate_limited");
  });

  it("burst allows N calls per window then rate-limits", () => {
    let nowMs = 1_000_000_000;
    const now = () => new Date(nowMs);
    const s = burstRateLimit({ windowMs: 1000, allowedBeforeBurst: 2, outcome: rateLimitedOutcome() });

    expect(s.next({ keyId: "k", now })?.code).toBeUndefined();
    expect(s.next({ keyId: "k", now })?.code).toBeUndefined();
    expect(s.next({ keyId: "k", now })?.code).toBe("rate_limited");
    expect(s.next({ keyId: "k", now })?.code).toBe("rate_limited");

    nowMs += 1500;
    expect(s.next({ keyId: "k", now })).toBeUndefined();
    expect(s.next({ keyId: "k", now })).toBeUndefined();
    expect(s.next({ keyId: "k", now })?.code).toBe("rate_limited");
  });

  it("probability with seed 0.5 hovers around 50% over many calls", () => {
    const s = probability({ p: 0.5, outcome: serverErrorOutcome(), seed: 1234 });

    let hits = 0;
    for (let i = 0; i < 1000; i += 1) {
      if (s.next(fakeCtx())) {
        hits += 1;
      }
    }

    expect(hits).toBeGreaterThan(400);
    expect(hits).toBeLessThan(600);
  });

  it("probability with p=0 never fires", () => {
    const s = probability({ p: 0, outcome: rateLimitedOutcome() });
    for (let i = 0; i < 10; i += 1) {
      expect(s.next(fakeCtx())).toBeUndefined();
    }
  });
});
