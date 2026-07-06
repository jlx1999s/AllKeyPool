import { describe, expect, it } from "vitest";
import { openSqliteDatabase } from "../../src/storage/sqlite/sqlite-connection.js";
import { createSqliteApiKeyRepository } from "../../src/storage/repositories/sqlite-api-key.repository.js";
import { SqliteAuditLogRecorder } from "../../src/observability/sqlite-audit-log-recorder.js";
import { SqliteHealthEventRecorder } from "../../src/observability/sqlite-health-event-recorder.js";
import { SqliteUsageRecorder } from "../../src/observability/sqlite-usage-recorder.js";
import { AesGcmKeyEncryption } from "../../src/security/key-encryption.js";

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

  it("encrypts API key values at rest when key encryption is configured", async () => {
    const database = openSqliteDatabase({ path: ":memory:" });
    const repository = await createSqliteApiKeyRepository(
      database,
      emptyConfig(),
      new AesGcmKeyEncryption("test-encryption-secret")
    );

    await repository.upsert({
      id: "key-1",
      provider: "openai",
      pool: "text_generation",
      value: "sk-test-secret",
      weight: 1,
      status: "healthy",
      failureCount: 0
    });

    const raw = database.prepare("SELECT value FROM api_keys WHERE id = ?").get("key-1") as { value: string };
    expect(raw.value).not.toBe("sk-test-secret");
    expect(raw.value).toMatch(/^kpenc:v1:/);
    await expect(repository.findById("key-1")).resolves.toMatchObject({
      id: "key-1",
      value: "sk-test-secret"
    });

    database.close();
  });

  it("persists usage records, health events, and audit logs", async () => {
    const database = openSqliteDatabase({ path: ":memory:" });
    const usageRecorder = new SqliteUsageRecorder(database);
    const healthEventRecorder = new SqliteHealthEventRecorder(database);
    const auditLogRecorder = new SqliteAuditLogRecorder(database);

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
    await auditLogRecorder.record({
      action: "key_created",
      actor: {
        type: "admin",
        id: "admin"
      },
      targetType: "api_key",
      targetId: "key-1",
      outcome: "success",
      message: "API key created",
      metadata: {
        provider: "openai",
        pool: "text_generation"
      }
    });
    await auditLogRecorder.record({
      action: "key_deleted",
      actor: {
        type: "admin",
        id: "admin"
      },
      targetType: "api_key",
      targetId: "key-2",
      outcome: "error",
      message: "API key delete failed"
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
    await expect(auditLogRecorder.listRecent()).resolves.toEqual([
      expect.objectContaining({
        action: "key_deleted",
        targetId: "key-2",
        outcome: "error",
        createdAt: expect.any(Date) as Date
      }),
      expect.objectContaining({
        action: "key_created",
        actor: {
          type: "admin",
          id: "admin"
        },
        targetType: "api_key",
        targetId: "key-1",
        outcome: "success",
        metadata: {
          provider: "openai",
          pool: "text_generation"
        },
        createdAt: expect.any(Date) as Date
      })
    ]);
    await expect(auditLogRecorder.listRecent({
      action: "key_created",
      outcome: "success",
      targetId: "key-1"
    })).resolves.toEqual([
      expect.objectContaining({
        action: "key_created",
        targetId: "key-1",
        outcome: "success"
      })
    ]);

    database.close();
  });
});
