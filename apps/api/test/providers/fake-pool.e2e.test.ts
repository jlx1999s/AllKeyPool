import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import type { KeyPoolConfig } from "../../src/config/schema.js";
import type { FastifyInstance } from "fastify";

function buildFakeConfig(): KeyPoolConfig {
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
      weighted: {
        type: "openai",
        baseUrl: "https://example.invalid/v1",
        keys: [
          { id: "w-light", value: "v-l", weight: 1 },
          { id: "w-medium", value: "v-m", weight: 5 },
          { id: "w-heavy", value: "v-h", weight: 10 }
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
      },
      rpm: {
        type: "openai",
        baseUrl: "https://example.invalid/v1",
        keys: [
          { id: "rpm-tight", value: "v-t", weight: 1, rpm: 2 },
          { id: "rpm-loose", value: "v-lo", weight: 1, rpm: 100 }
        ]
      }
    },
    pools: {
      ok_pool: { strategy: "round_robin", providers: [{ provider: "ok", models: ["fake-ok"] }] },
      weighted_pool: { strategy: "weighted_round_robin", providers: [{ provider: "weighted", models: ["fake-w"] }] },
      rl_pool: { strategy: "round_robin", providers: [{ provider: "rl", models: ["fake-rl"] }] },
      rpm_pool: { strategy: "round_robin", providers: [{ provider: "rpm", models: ["fake-rpm"] }] }
    },
    tasks: {},
    retry: { maxAttempts: 4, retryOn: [429, 500, 502, 503, 504] }
  };
}

async function bootApp(config: KeyPoolConfig): Promise<FastifyInstance> {
  return buildApp({ config });
}

async function sendChat(app: FastifyInstance, model: string): Promise<{ statusCode: number; body: { servedBy?: string; keyId?: string; error?: { code?: string } } }> {
  const response = await app.inject({
    method: "POST",
    url: "/v1/chat/completions",
    payload: { model, messages: [{ role: "user", content: "ping" }] }
  });

  return {
    statusCode: response.statusCode,
    body: response.json() as { servedBy?: string; keyId?: string; error?: { code?: string } }
  };
}

const originalFakeProvider = process.env.KEYPOOL_FAKE_PROVIDER;

afterEach(() => {
  if (originalFakeProvider === undefined) {
    delete process.env.KEYPOOL_FAKE_PROVIDER;
  } else {
    process.env.KEYPOOL_FAKE_PROVIDER = originalFakeProvider;
  }
});

function enableFakeMode(): void {
  process.env.KEYPOOL_FAKE_PROVIDER = "1";
}

describe("fake provider pool e2e", () => {
  it("round_robin serves all 3 ok keys roughly evenly", async () => {
    enableFakeMode();
    const app = await bootApp(buildFakeConfig());

    const hits = new Map<string, number>();
    for (let i = 0; i < 9; i += 1) {
      const r = await sendChat(app, "fake-ok");
      expect(r.statusCode).toBe(200);
      const id = r.body.keyId;
      expect(id).toBeDefined();
      hits.set(id as string, (hits.get(id as string) ?? 0) + 1);
    }

    expect(hits.size).toBe(3);
    for (const count of hits.values()) {
      expect(count).toBe(3);
    }

    await app.close();
  });

  it("weighted_round_robin favors the high-weight key", async () => {
    enableFakeMode();
    const app = await bootApp(buildFakeConfig());

    const hits = new Map<string, number>();
    for (let i = 0; i < 16; i += 1) {
      const r = await sendChat(app, "fake-w");
      expect(r.statusCode).toBe(200);
      hits.set(r.body.keyId as string, (hits.get(r.body.keyId as string) ?? 0) + 1);
    }

    const heavy = hits.get("w-heavy") ?? 0;
    const medium = hits.get("w-medium") ?? 0;
    const light = hits.get("w-light") ?? 0;

    expect(heavy).toBeGreaterThan(medium);
    expect(medium).toBeGreaterThan(light);

    await app.close();
  });

  it("periodic 429 on rl-1 makes the executor retry to another key", async () => {
    enableFakeMode();
    const app = await bootApp(buildFakeConfig());

    // rl-1 has periodic(period=2, rate_limited) — every 2nd call returns 429.
    // The executor should retry with rl-2/rl-3, so all client responses are 200.
    // What we verify: rl-1 actually gets used (round_robin hits it within 4
    // calls) and the timeline shows the key being touched. The 429 itself
    // is recorded as a health event by the executor's onAttemptFailure hook,
    // not as a usage entry, so we don't assert error count here.
    for (let i = 0; i < 6; i += 1) {
      const r = await sendChat(app, "fake-rl");
      expect(r.statusCode).toBe(200);
    }

    const rl1Usage = await app.inject({
      method: "GET",
      url: "/admin/api/keys/rl-1/usage",
      headers: { "x-admin-token": "keypool-admin-dev" }
    });
    expect(rl1Usage.statusCode).toBe(200);
    const usage = rl1Usage.json() as {
      summary: { total: number; error: number; success: number };
      entries: Array<{ outcome: string; statusCode?: number }>;
    };

    expect(usage.summary.total).toBeGreaterThan(0);

    // The 429 paths bubble up as health events (provider_attempt_failed /
    // key_exhausted), so we can verify those landed in the recorder.
    const events = await app.inject({
      method: "GET",
      url: "/admin/api/health-events?limit=50",
      headers: { "x-admin-token": "keypool-admin-dev" }
    });
    expect(events.statusCode).toBe(200);
    const eventsBody = events.json() as { events: Array<{ type: string; keyId?: string; code?: string }> };
    const rl1Health = eventsBody.events.filter((e) => e.keyId === "rl-1");
    expect(rl1Health.length).toBeGreaterThan(0);

    await app.close();
  });

  it("QuotaManager skips a key whose RPM is exhausted", async () => {
    enableFakeMode();
    const app = await bootApp(buildFakeConfig());

    // rpm-tight has rpm=2; the first 2 requests should hit it, the rest
    // should be steered to rpm-loose by the quota manager.
    const hits = new Map<string, number>();
    for (let i = 0; i < 6; i += 1) {
      const r = await sendChat(app, "fake-rpm");
      expect(r.statusCode).toBe(200);
      hits.set(r.body.keyId as string, (hits.get(r.body.keyId as string) ?? 0) + 1);
    }

    expect(hits.get("rpm-tight")).toBeLessThanOrEqual(2);
    expect(hits.get("rpm-loose") ?? 0).toBeGreaterThan(0);

    await app.close();
  });

  it("admin state endpoint exposes per-key usage summary", async () => {
    enableFakeMode();
    const app = await bootApp(buildFakeConfig());

    for (let i = 0; i < 3; i += 1) {
      await sendChat(app, "fake-ok");
    }

    const state = await app.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: { "x-admin-token": "keypool-admin-dev" }
    });

    expect(state.statusCode).toBe(200);
    const body = state.json() as { fakeProvider: boolean; keys: Array<{ id: string; usage: { total: number } }> };
    expect(body.fakeProvider).toBe(true);

    const totals = body.keys.filter((k) => k.id.startsWith("ok-")).map((k) => k.usage.total);
    expect(totals.reduce((a, b) => a + b, 0)).toBe(3);

    await app.close();
  });
});
