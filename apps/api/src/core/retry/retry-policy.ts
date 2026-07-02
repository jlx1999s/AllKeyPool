import type { ProviderError } from "@keypool/shared";

export interface RetryPolicyOptions {
  maxAttempts: number;
}

export class RetryPolicy {
  constructor(private readonly options: RetryPolicyOptions) {}

  shouldRetry(providerError: ProviderError, attempt: number): boolean {
    return providerError.retryable && attempt < this.options.maxAttempts;
  }

  get maxAttempts(): number {
    return this.options.maxAttempts;
  }
}

