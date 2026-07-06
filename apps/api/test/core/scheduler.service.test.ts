import { describe, expect, it } from "vitest";
import { SchedulerService } from "../../src/core/scheduler/scheduler.js";
import { InMemoryQuotaManager } from "../../src/core/quota/quota-manager.js";
import { RoundRobinStrategy } from "../../src/core/scheduler/strategies/round-robin.strategy.js";
import { WeightedRoundRobinStrategy } from "../../src/core/scheduler/strategies/weighted-round-robin.strategy.js";
import { InMemoryApiKeyRepository } from "../../src/storage/repositories/in-memory-api-key.repository.js";

describe("SchedulerService", () => {
  it("selects a key using the requested strategy and marks it used", async () => {
    const repository = new InMemoryApiKeyRepository([
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
    const scheduler = new SchedulerService(repository, [
      new RoundRobinStrategy(),
      new WeightedRoundRobinStrategy()
    ]);

    const result = await scheduler.selectKey({
      requestId: "req-1",
      pool: "text_generation"
    }, "round_robin");

    expect(result).toMatchObject({
      strategy: "round_robin",
      key: {
        id: "key-1"
      }
    });

    await expect(repository.findById("key-1")).resolves.toMatchObject({
      id: "key-1",
      lastUsedAt: expect.any(Date) as Date
    });
  });

  it("filters keys by provider when provider is present in context", async () => {
    const repository = new InMemoryApiKeyRepository([
      {
        id: "openai-key",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "healthy",
        failureCount: 0
      },
      {
        id: "deepseek-key",
        provider: "deepseek",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "healthy",
        failureCount: 0
      }
    ]);
    const scheduler = new SchedulerService(repository, [new RoundRobinStrategy()]);

    await expect(scheduler.selectKey({
      requestId: "req-1",
      pool: "text_generation",
      provider: "deepseek"
    })).resolves.toMatchObject({
      key: {
        id: "deepseek-key"
      }
    });
  });

  it("fails fast for unknown strategies", async () => {
    const scheduler = new SchedulerService(new InMemoryApiKeyRepository([]), [new RoundRobinStrategy()]);

    await expect(scheduler.selectKey({
      requestId: "req-1",
      pool: "text_generation"
    }, "missing_strategy")).rejects.toThrow("Unknown scheduling strategy: missing_strategy");
  });

  it("skips keys that are over rpm quota", async () => {
    const repository = new InMemoryApiKeyRepository([
      {
        id: "limited-key",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "healthy",
        rpmLimit: 1,
        failureCount: 0
      },
      {
        id: "backup-key",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "healthy",
        rpmLimit: 1,
        failureCount: 0
      }
    ]);
    const quotaManager = new InMemoryQuotaManager();
    const scheduler = new SchedulerService(repository, [new RoundRobinStrategy()], quotaManager);

    await expect(scheduler.selectKey({
      requestId: "req-1",
      pool: "text_generation"
    })).resolves.toMatchObject({
      key: {
        id: "limited-key"
      }
    });
    await expect(scheduler.selectKey({
      requestId: "req-2",
      pool: "text_generation"
    })).resolves.toMatchObject({
      key: {
        id: "backup-key"
      }
    });
  });

  it("releases expired cooling down keys before selecting", async () => {
    const repository = new InMemoryApiKeyRepository([
      {
        id: "cooling-key",
        provider: "openai",
        pool: "text_generation",
        value: "secret",
        weight: 1,
        status: "cooling_down",
        coolingDownUntil: new Date(Date.now() - 1_000),
        failureCount: 3
      }
    ]);
    const scheduler = new SchedulerService(repository, [new RoundRobinStrategy()]);

    const result = await scheduler.selectKey({
      requestId: "req-1",
      pool: "text_generation"
    });

    expect(result).toMatchObject({
      key: {
        id: "cooling-key",
        status: "degraded"
      }
    });
    expect(result.key).not.toHaveProperty("coolingDownUntil");
  });
});
