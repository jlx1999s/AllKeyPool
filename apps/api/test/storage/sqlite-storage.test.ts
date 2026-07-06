import { describe, expect, it } from "vitest";
import { openSqliteDatabase } from "../../src/storage/sqlite/sqlite-connection.js";
import { createSqliteApiKeyRepository } from "../../src/storage/repositories/sqlite-api-key.repository.js";
import { SqliteHealthEventRecorder } from "../../src/observability/sqlite-health-event-recorder.js";
import { SqliteUsageRecorder } from "../../src/observability/sqlite-usage-recorder.js";

function emptyConfig() {
  return {
    server: {
      host: "127.0.0.1",
      port: 0
    },
    providers: {},
    pools: {},
    tasks: {},
    retry: {
      maxAttempts: 3,
      retryOn: [429, 500, 502, 503, 504]
    }
  };
}

describe("SQLite storage", () => {
  it("persists API key state and cooldown recovery", async () => {
    const database = openSqliteDatabase({ path: ":memory:" });
    const repository = await createSqliteApiKeyRepository(database, emptyConfig());

    await repository.upsert({
      id: "key-1",
      provider: "openai",
      pool: "text_generation",
      value: "secret",
      weight: 2,
      status: "healthy",
      rpmLimit: 60,
      failureCount: 0,
      metadata: {
        runtimeConfig: {
          providerType: "openai",
          baseUrl: "https://api.openai.test/v1",
          model: "gpt-4.1-mini"
        }
      }
    });
    await repository.recordFailure("key-1");
    await repository.startCoolingDown("key-1", new Date("2026-01-01T00:00:00.000Z"));

    await expect(repository.findById("key-1")).resolves.toMatchObject({
      id: "key-1",
      provider: "openai",
      pool: "text_generation",
      weight: 2,
      rpmLimit: 60,
      status: "cooling_down",
      failureCount: 1,
      coolingDownUntil: new Date("2026-01-01T00:00:00.000Z"),
      metadata: {
        runtimeConfig: {
          baseUrl: "https://api.openai.test/v1"
        }
      }
    });

    const releasedKeys = await repository.releaseExpiredCooldowns(new Date("2026-01-01T00:00:01.000Z"));
    expect(releasedKeys).toEqual([
      expect.objectContaining({
        id: "key-1",
        status: "degraded"
      })
    ]);
    expect(releasedKeys[0]).not.toHaveProperty("coolingDownUntil");

    database.close();
  });

  it("persists usage records and health events", async () => {
    const database = openSqliteDatabase({ path: ":memory:" });
    const usageRecorder = new SqliteUsageRecorder(database);
    const healthEventRecorder = new SqliteHealthEventRecorder(database);

    await usageRecorder.record({
      requestId: "req-1",
      route: "chat.completions",
      model: "gpt-4.1-mini",
      pool: "text_generation",
      provider: "openai",
      keyId: "key-1",
      statusCode: 200,
      outcome: "success",
      latencyMs: 12
    });
    await healthEventRecorder.record({
      type: "provider_attempt_succeeded",
      level: "info",
      requestId: "req-1",
      provider: "openai",
      keyId: "key-1",
      statusCode: 200,
      message: "Provider request succeeded",
      metadata: {
        attempt: 1
      }
    });

    await expect(usageRecorder.listRecent()).resolves.toEqual([
      expect.objectContaining({
        requestId: "req-1",
        keyId: "key-1",
        outcome: "success",
        createdAt: expect.any(Date) as Date
      })
    ]);
    await expect(healthEventRecorder.listRecent()).resolves.toEqual([
      expect.objectContaining({
        type: "provider_attempt_succeeded",
        keyId: "key-1",
        metadata: {
          attempt: 1
        },
        createdAt: expect.any(Date) as Date
      })
    ]);

    database.close();
  });
});
