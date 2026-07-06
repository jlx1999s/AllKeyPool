import { describe, expect, it } from "vitest";
import { KeyHealthService } from "../../src/core/health/key-health.service.js";
import { InMemoryApiKeyRepository } from "../../src/storage/repositories/in-memory-api-key.repository.js";

function repository(): InMemoryApiKeyRepository {
  return new InMemoryApiKeyRepository([
    {
      id: "key-1",
      provider: "openai",
      pool: "text_generation",
      value: "secret",
      weight: 1,
      status: "healthy",
      failureCount: 0
    }
  ]);
}

describe("KeyHealthService", () => {
  it("degrades keys before cooling them down", async () => {
    const apiKeyRepository = repository();
    const service = new KeyHealthService({
      apiKeyRepository,
      coolingDownFailureThreshold: 3,
      coolingDownMs: 30_000
    });
    const now = new Date("2026-01-01T00:00:00.000Z");

    await expect(service.recordFailure("key-1", now)).resolves.toMatchObject({
      key: {
        id: "key-1",
        failureCount: 1,
        status: "degraded"
      },
      previousStatus: "healthy",
      statusChanged: true
    });
    await expect(service.recordFailure("key-1", now)).resolves.toMatchObject({
      key: {
        failureCount: 2,
        status: "degraded"
      },
      statusChanged: false
    });
    await expect(service.recordFailure("key-1", now)).resolves.toMatchObject({
      key: {
        failureCount: 3,
        status: "cooling_down",
        coolingDownUntil: new Date("2026-01-01T00:00:30.000Z")
      },
      previousStatus: "degraded",
      statusChanged: true
    });
  });

  it("resets degraded keys after a successful request", async () => {
    const apiKeyRepository = repository();
    const service = new KeyHealthService({
      apiKeyRepository,
      coolingDownFailureThreshold: 3
    });

    await service.recordFailure("key-1");

    await expect(service.recordSuccess("key-1")).resolves.toMatchObject({
      key: {
        id: "key-1",
        failureCount: 0,
        status: "healthy"
      },
      previousStatus: "degraded",
      statusChanged: true
    });
  });
});
