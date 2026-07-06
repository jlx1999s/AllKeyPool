import { describe, expect, it } from "vitest";
import { createInMemoryApiKeyRepository, InMemoryApiKeyRepository } from "../../src/storage/repositories/in-memory-api-key.repository.js";

describe("InMemoryApiKeyRepository", () => {
  it("finds keys by pool and provider", async () => {
    const repository = new InMemoryApiKeyRepository([
      {
        id: "key-1",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "healthy",
        failureCount: 0
      },
      {
        id: "key-2",
        provider: "openai",
        pool: "image_generation",
        value: "secret",
        weight: 1,
        status: "healthy",
        failureCount: 0
      }
    ]);

    await expect(repository.findByPool("text_generation", { provider: "openai" }))
      .resolves.toHaveLength(1);
  });

  it("creates key records from config pools", async () => {
    const repository = createInMemoryApiKeyRepository({
      server: {
        host: "127.0.0.1",
        port: 3000
      },
      providers: {
        openai: {
          type: "openai",
          baseUrl: "https://api.openai.com/v1",
          keys: [
            {
              id: "openai-key",
              value: "secret",
              weight: 2,
              rpm: 100,
              dailyRequests: 1000
            }
          ]
        }
      },
      pools: {
        text_generation: {
          strategy: "weighted_round_robin",
          providers: [
            {
              provider: "openai",
              models: ["gpt-4.1-mini"]
            }
          ]
        }
      },
      tasks: {},
      retry: {
        maxAttempts: 3,
        retryOn: [429, 500, 502, 503, 504]
      }
    });

    await expect(repository.findByPool("text_generation")).resolves.toEqual([
      expect.objectContaining({
        id: "openai-key",
        provider: "openai",
        pool: "text_generation",
        weight: 2,
        rpmLimit: 100,
        dailyRequestLimit: 1000
      })
    ]);
  });

  it("records and resets key failures", async () => {
    const repository = new InMemoryApiKeyRepository([
      {
        id: "key-1",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "degraded",
        failureCount: 2
      }
    ]);

    await expect(repository.recordFailure("key-1")).resolves.toMatchObject({
      id: "key-1",
      failureCount: 3,
      status: "degraded"
    });
    await expect(repository.resetFailures("key-1")).resolves.toMatchObject({
      id: "key-1",
      failureCount: 0,
      status: "healthy"
    });
  });

  it("releases expired cooling down keys as degraded", async () => {
    const repository = new InMemoryApiKeyRepository([
      {
        id: "key-1",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "cooling_down",
        coolingDownUntil: new Date("2026-01-01T00:00:00.000Z"),
        failureCount: 3
      },
      {
        id: "key-2",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "cooling_down",
        coolingDownUntil: new Date("2026-01-01T00:01:00.000Z"),
        failureCount: 3
      }
    ]);

    const releasedKeys = await repository.releaseExpiredCooldowns(new Date("2026-01-01T00:00:30.000Z"));

    expect(releasedKeys).toEqual([
        expect.objectContaining({
          id: "key-1",
          status: "degraded"
        })
      ]);
    expect(releasedKeys[0]).not.toHaveProperty("coolingDownUntil");
    await expect(repository.findById("key-2")).resolves.toMatchObject({
      id: "key-2",
      status: "cooling_down",
      coolingDownUntil: new Date("2026-01-01T00:01:00.000Z")
    });
  });
});
