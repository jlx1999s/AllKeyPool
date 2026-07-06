import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import type { KeyPoolConfig } from "../../src/config/schema.js";
import type { FastifyInstance } from "fastify";

const originalFakeProvider = process.env.KEYPOOL_FAKE_PROVIDER;

afterEach(() => {
  if (originalFakeProvider === undefined) {
    delete process.env.KEYPOOL_FAKE_PROVIDER;
  } else {
    process.env.KEYPOOL_FAKE_PROVIDER = originalFakeProvider;
  }
});

function buildConfig(): KeyPoolConfig {
  return {
    server: { host: "127.0.0.1", port: 0 },
    providers: {
      ok: {
        type: "openai",
        baseUrl: "https://example.invalid/v1",
        keys: [
          { id: "ok-a", value: "v-a", weight: 1 },
          { id: "ok-b", value: "v-b", weight: 1 },
          { id: "ok-c", value: "v-c", weight: 1 }
        ]
      },
      rl: {
        type: "openai",
        baseUrl: "https://example.invalid/v1",
        keys: [
          { id: "rl-1", value: "v-1", weight: 1, script: "periodic(period=2, rate_limited)" },
          { id: "rl-2", value: "v-2", weight: 1 },
          { id: "rl-3", value: "v-3", weight: 1 }
        ]
      }
    },
    pools: {
      ok_pool: { strategy: "round_robin", providers: [{ provider: "ok", models: ["fake-ok"] }] },
      rl_pool: { strategy: "round_robin", providers: [{ provider: "rl", models: ["fake-rl"] }] }
    },
    tasks: {},
    retry: { maxAttempts: 3, retryOn: [429, 500, 502, 503, 504] }
  };
}

function enableFakeMode(): void {
  process.env.KEYPOOL_FAKE_PROVIDER = "1";
}

interface DemoResponseBody {
  sessionId: string;
  model: string;
  pool: string;
  provider: string;
  totalDurationMs: number;
  results: Array<{
    turn: number;
    requestId: string;
    status: number;
    keyId: string;
    servedBy: string;
    latencyMs: number;
    attempt: number;
    attempts: Array<{ attempt: number; keyId: string; outcome: "success" | "error"; statusCode?: number; errorCode?: string; latencyMs: number }>;
    error?: { code: string; message: string };
    responseText: string;
  }>;
  summary: {
    total: number;
    success: number;
    failed: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    distinctKeys: number;
    distinctKeyIds: string[];
  };
}

async function boot(): Promise<FastifyInstance> {
  enableFakeMode();
  return buildApp({ config: buildConfig() });
}

async function postDemo(app: FastifyInstance, payload: Record<string, unknown>): Promise<{ statusCode: number; body: DemoResponseBody }> {
  const response = await app.inject({
    method: "POST",
    url: "/_demo/chat",
    headers: { "x-admin-token": "keypool-admin-dev", "content-type": "application/json" },
    payload
  });
  return {
    statusCode: response.statusCode,
    body: response.json() as DemoResponseBody
  };
}

describe("POST /_demo/chat", () => {
  it("requires admin auth", async () => {
    const app = await boot();
    const response = await app.inject({
      method: "POST",
      url: "/_demo/chat",
      payload: { model: "fake-ok", prompt: "hi" }
    });
    expect(response.statusCode).toBe(401);
    await app.close();
  });

  it("rejects unknown model with 503", async () => {
    const app = await boot();
    const r = await app.inject({
      method: "POST",
      url: "/_demo/chat",
      headers: { "x-admin-token": "keypool-admin-dev", "content-type": "application/json" },
      payload: { model: "no-such-model", prompt: "hi" }
    });
    expect(r.statusCode).toBe(503);
    expect(r.json()).toMatchObject({ error: { code: "no_pool" } });
    await app.close();
  });

  it("single-shot returns 1 result with attempt chain", async () => {
    const app = await boot();
    const { statusCode, body } = await postDemo(app, {
      model: "fake-ok",
      prompt: "hello"
    });

    expect(statusCode).toBe(200);
    expect(body.results).toHaveLength(1);
    expect(body.results[0]).toMatchObject({
      turn: 1,
      status: 200,
      keyId: expect.stringMatching(/^ok-[abc]$/),
      servedBy: expect.any(String),
      attempt: 1
    });
    expect(body.results[0]?.attempts).toHaveLength(1);
    expect(body.results[0]?.attempts[0]).toMatchObject({ outcome: "success", statusCode: 200 });
    expect(body.results[0]?.responseText).toContain("[fake:");
    expect(body.summary).toMatchObject({ total: 1, success: 1, failed: 0, distinctKeys: 1 });
    expect(body.sessionId).toBeDefined();
    await app.close();
  });

  it("load mode repeats N times and tracks summary metrics", async () => {
    const app = await boot();
    const { statusCode, body } = await postDemo(app, {
      model: "fake-ok",
      prompt: "ping",
      count: 6,
      intervalMs: 0
    });

    expect(statusCode).toBe(200);
    expect(body.results).toHaveLength(6);
    expect(body.summary.total).toBe(6);
    expect(body.summary.success).toBe(6);
    expect(body.summary.failed).toBe(0);
    // round_robin over 3 keys × 6 calls = each key hit twice
    expect(body.summary.distinctKeys).toBe(3);
    expect(body.summary.distinctKeyIds.sort()).toEqual(["ok-a", "ok-b", "ok-c"]);
    expect(body.summary.avgLatencyMs).toBeGreaterThanOrEqual(0);
    expect(body.summary.p50LatencyMs).toBeGreaterThanOrEqual(0);
    expect(body.summary.p95LatencyMs).toBeGreaterThanOrEqual(body.summary.p50LatencyMs);
    await app.close();
  });

  it("multi-turn preserves key-pin behavior when sessionId is supplied", async () => {
    const app = await boot();
    const { body } = await postDemo(app, {
      model: "fake-ok",
      sessionId: "stuck-1",
      turns: ["one", "two", "three"]
    });

    expect(body.results).toHaveLength(3);
    // sticky session forces all 3 turns to the same key
    const keys = new Set(body.results.map((r) => r.keyId));
    expect(keys.size).toBe(1);
    expect(body.summary.distinctKeys).toBe(1);
    expect(body.summary.distinctKeyIds).toHaveLength(1);
    await app.close();
  });

  it("exposes the full retry chain when a 429 fires mid-load", async () => {
    const app = await boot();
    const { body } = await postDemo(app, {
      model: "fake-rl",
      prompt: "ping",
      count: 4,
      intervalMs: 0
    });

    // rl-1 returns 429 on every 2nd call, executor retries → all 4 must end 200
    expect(body.summary.failed).toBe(0);
    expect(body.summary.success).toBe(4);

    // at least one turn should have attempt.length > 1 (a retry happened)
    const retried = body.results.filter((r) => r.attempts.length > 1);
    expect(retried.length).toBeGreaterThan(0);

    // the failed attempt entry should be a 429 rate_limited
    const firstRetry = retried[0];
    expect(firstRetry).toBeDefined();
    const failedAttempt = firstRetry!.attempts.find((a) => a.outcome === "error");
    expect(failedAttempt).toMatchObject({ statusCode: 429, errorCode: "rate_limited" });

    // the final attempt should be a success (and a different key from the failed one)
    const lastAttempt = firstRetry!.attempts.at(-1);
    expect(lastAttempt).toMatchObject({ outcome: "success", statusCode: 200 });
    await app.close();
  });

  it("summary p50 / p95 / avg reflect actual latencies", async () => {
    const app = await boot();
    const { body } = await postDemo(app, {
      model: "fake-ok",
      prompt: "tick",
      count: 5
    });

    const latencies = body.results.map((r) => r.latencyMs).sort((a, b) => a - b);
    const expectedAvg = Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
    expect(body.summary.avgLatencyMs).toBe(expectedAvg);
    expect(body.summary.p50LatencyMs).toBe(latencies[Math.floor(latencies.length * 0.5)] ?? 0);
    expect(body.summary.p95LatencyMs).toBe(latencies[Math.floor(latencies.length * 0.95)] ?? 0);
    await app.close();
  });
});
