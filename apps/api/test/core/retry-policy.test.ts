import type { ProviderError } from "@keypool/shared";
import { describe, expect, it } from "vitest";
import { RetryPolicy } from "../../src/core/retry/retry-policy.js";

function providerError(retryable: boolean): ProviderError {
  return {
    provider: "openai",
    code: "rate_limited",
    message: "Rate limited",
    retryable,
    rateLimited: retryable,
    authenticationFailed: false
  };
}

describe("RetryPolicy", () => {
  it("retries retryable errors before max attempts", () => {
    const policy = new RetryPolicy({ maxAttempts: 3 });

    expect(policy.shouldRetry(providerError(true), 1)).toBe(true);
    expect(policy.shouldRetry(providerError(true), 3)).toBe(false);
  });

  it("does not retry non-retryable errors", () => {
    const policy = new RetryPolicy({ maxAttempts: 3 });

    expect(policy.shouldRetry(providerError(false), 1)).toBe(false);
  });
});

