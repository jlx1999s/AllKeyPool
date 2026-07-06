import type { ApiKeyRecord, ProviderAdapter, ProviderError } from "@keypool/shared";
import { describe, expect, it, vi } from "vitest";
import {
  ProviderRequestExecutor,
  ProviderRequestFailedError
} from "../../src/core/provider-executor/provider-request-executor.js";
import { RetryPolicy } from "../../src/core/retry/retry-policy.js";
import { SchedulerService } from "../../src/core/scheduler/scheduler.js";
import { RoundRobinStrategy } from "../../src/core/scheduler/strategies/round-robin.strategy.js";
import { InMemoryApiKeyRepository } from "../../src/storage/repositories/in-memory-api-key.repository.js";

function key(id: string, value: string): ApiKeyRecord {
  return {
    id,
    provider: "openai",
    pool: "text_generation",
    value,
    weight: 1,
    status: "healthy",
    failureCount: 0
  };
}

function rateLimitError(): ProviderError {
  return {
    provider: "openai",
    statusCode: 429,
    code: "rate_limited",
    message: "Rate limited",
    retryable: true,
    rateLimited: true,
    authenticationFailed: false
  };
}

describe("ProviderRequestExecutor", () => {
  it("retries retryable provider errors with another eligible key", async () => {
    const scheduler = new SchedulerService(
      new InMemoryApiKeyRepository([key("key-1", "primary"), key("key-2", "backup")]),
      [new RoundRobinStrategy()]
    );
    const adapter: ProviderAdapter = {
      name: "openai",
      send: vi.fn()
        .mockRejectedValueOnce(new Error("rate limit"))
        .mockResolvedValueOnce({
          statusCode: 200,
          headers: {},
          body: {
            ok: true
          }
        }),
      checkHealth: vi.fn(),
      normalizeError: vi.fn(() => rateLimitError())
    };
    const onAttemptFailure = vi.fn();
    const onAttemptSuccess = vi.fn();
    const executor = new ProviderRequestExecutor({
      scheduler,
      retryPolicy: new RetryPolicy({ maxAttempts: 3 }),
      onAttemptFailure,
      onAttemptSuccess
    });

    await expect(executor.execute({
      adapter,
      request: {
        body: {}
      },
      schedulingContext: {
        requestId: "req-1",
        pool: "text_generation",
        provider: "openai"
      },
      strategy: "round_robin"
    })).resolves.toMatchObject({
      statusCode: 200,
      body: {
        ok: true
      }
    });

    expect(adapter.send).toHaveBeenCalledTimes(2);
    expect(onAttemptFailure).toHaveBeenCalledWith(expect.objectContaining({
      keyId: "key-1",
      attempt: 1
    }));
    expect(onAttemptSuccess).toHaveBeenCalledWith(expect.objectContaining({
      requestId: "req-1",
      pool: "text_generation",
      provider: "openai",
      keyId: "key-2",
      attempt: 2,
      statusCode: 200
    }));
  });

  it("throws the last provider error when eligible keys are exhausted", async () => {
    const scheduler = new SchedulerService(
      new InMemoryApiKeyRepository([key("key-1", "primary")]),
      [new RoundRobinStrategy()]
    );
    const adapter: ProviderAdapter = {
      name: "openai",
      send: vi.fn().mockRejectedValue(new Error("rate limit")),
      checkHealth: vi.fn(),
      normalizeError: vi.fn(() => rateLimitError())
    };
    const executor = new ProviderRequestExecutor({
      scheduler,
      retryPolicy: new RetryPolicy({ maxAttempts: 3 })
    });

    let caught: unknown;

    try {
      await executor.execute({
        adapter,
        request: {
          body: {}
        },
        schedulingContext: {
          requestId: "req-1",
          pool: "text_generation",
          provider: "openai"
        },
        strategy: "round_robin"
      });
    } catch (error) {
      caught = error;
    }

    expect(caught).toBeInstanceOf(ProviderRequestFailedError);
    expect(caught).toMatchObject({
      providerError: {
        code: "rate_limited",
        statusCode: 429
      }
    });

    expect(adapter.send).toHaveBeenCalledTimes(1);
  });
});
