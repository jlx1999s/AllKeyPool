import type { ApiKeyRecord } from "@keypool/shared";
import { describe, expect, it } from "vitest";
import { FakeOpenAIAdapter } from "../../src/providers/fake/fake-adapter.js";
import { buildScriptFromSpec } from "../../src/providers/fake/fake-script-dsl.js";
import {
  periodic,
  rateLimitedOutcome,
  sequence
} from "../../src/providers/fake/fake-script.js";

function makeKey(id: string): ApiKeyRecord {
  return {
    id,
    provider: "fake",
    pool: "test",
    value: "secret",
    weight: 1,
    status: "healthy",
    failureCount: 0
  };
}

describe("FakeOpenAIAdapter", () => {
  it("echoes user message and tags response with servedBy + keyId", async () => {
    const adapter = new FakeOpenAIAdapter({ name: "fake" });
    const res = await adapter.send(
      { body: { messages: [{ role: "user", content: "hello world" }] } },
      { requestId: "req-1", key: makeKey("alpha-1") }
    );

    expect(res.statusCode).toBe(200);
    const body = res.body as { servedBy: string; keyId: string; choices: { message: { content: string } }[] };
    expect(body.servedBy).toBe("ha-1");
    expect(body.keyId).toBe("alpha-1");
    expect(body.choices[0]?.message.content).toContain("[fake:ha-1] hello world");
  });

  it("throws on 429 outcome and normalizeError maps it to rate_limited/retryable", async () => {
    const adapter = new FakeOpenAIAdapter({
      name: "fake",
      resolveScript: () => periodic({ period: 1, outcome: rateLimitedOutcome() })
    });

    await expect(
      adapter.send({ body: { messages: [{ role: "user", content: "x" }] } }, { requestId: "r", key: makeKey("k") })
    ).rejects.toMatchObject({ statusCode: 429 });

    const norm = adapter.normalizeError(new Error("ignored"));
    // construct a real adapter error to verify normalization
    const probe = new (await import("../../src/providers/fake/fake-adapter.js")).FakeProviderHttpError(429, {
      error: { code: "rate_limited", message: "stop" }
    });
    expect(adapter.normalizeError(probe)).toMatchObject({
      statusCode: 429,
      code: "rate_limited",
      retryable: true,
      rateLimited: true
    });
    expect(norm.code).toBe("network_error");
  });

  it("checkHealth always returns healthy", async () => {
    const adapter = new FakeOpenAIAdapter({ name: "fake" });
    await expect(adapter.checkHealth(makeKey("k"))).resolves.toEqual({ status: "healthy" });
  });

  it("getLastOutcome reflects the most recent outcome per key", async () => {
    const flakyScript = sequence([rateLimitedOutcome()]);
    const adapter = new FakeOpenAIAdapter({
      name: "fake",
      resolveScript: (key) => (key.id === "flaky" ? flakyScript : undefined)
    });

    await adapter.send({ body: { messages: [{ role: "user", content: "x" }] } }, { requestId: "r1", key: makeKey("flaky") }).catch(() => undefined);
    await adapter.send({ body: { messages: [{ role: "user", content: "x" }] } }, { requestId: "r2", key: makeKey("flaky") });

    expect(adapter.getLastOutcome("flaky")?.code).toBe("ok");
  });
});

describe("buildScriptFromSpec DSL", () => {
  it("parses sequence(ok, 429, 500)", () => {
    const s = buildScriptFromSpec("sequence(ok, 429, 500)");
    expect(s.next({ keyId: "k", now: () => new Date() })).toBeUndefined();
    expect(s.next({ keyId: "k", now: () => new Date() })?.code).toBe("rate_limited");
    expect(s.next({ keyId: "k", now: () => new Date() })?.code).toBe("provider_server_error");
  });

  it("parses periodic(period=3, rate_limited)", () => {
    const s = buildScriptFromSpec("periodic(period=3, rate_limited)");
    expect(s.next({ keyId: "k", now: () => new Date() })).toBeUndefined();
    expect(s.next({ keyId: "k", now: () => new Date() })).toBeUndefined();
    expect(s.next({ keyId: "k", now: () => new Date() })?.code).toBe("rate_limited");
  });

  it("parses burst(windowMs=1000, allowed=2, outcome=rate_limited)", () => {
    const s = buildScriptFromSpec("burst(windowMs=1000, allowed=2, outcome=rate_limited)");
    const ctx = { keyId: "k", now: () => new Date(0) };
    expect(s.next(ctx)).toBeUndefined();
    expect(s.next(ctx)).toBeUndefined();
    expect(s.next(ctx)?.code).toBe("rate_limited");
  });

  it("parses probability(p=0, server_error) and never fires", () => {
    const s = buildScriptFromSpec("probability(p=0, server_error)");
    for (let i = 0; i < 5; i += 1) {
      expect(s.next({ keyId: "k", now: () => new Date() })).toBeUndefined();
    }
  });

  it("returns ok script for null/empty/'ok'", () => {
    for (const spec of [null, undefined, "", "ok"]) {
      const s = buildScriptFromSpec(spec ?? undefined);
      expect(s.next({ keyId: "k", now: () => new Date() })).toBeUndefined();
    }
  });

  it("rejects unknown directives and bad args", () => {
    expect(() => buildScriptFromSpec("nope(1)")).toThrow();
    expect(() => buildScriptFromSpec("periodic(period=0, rate_limited)")).toThrow();
    expect(() => buildScriptFromSpec("probability(p=2, server_error)")).toThrow();
  });
});
