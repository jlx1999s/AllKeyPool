import type {
  ProviderAdapter,
  ProviderError,
  ProviderRequest,
  ProviderResponse,
  SchedulingContext
} from "@keypool/shared";
import type { SchedulerService } from "../scheduler/scheduler.js";
import type { RetryPolicy } from "../retry/retry-policy.js";

export interface ProviderRequestExecutorOptions {
  scheduler: SchedulerService;
  retryPolicy: RetryPolicy;
  onAttemptFailure?: (event: ProviderAttemptFailureEvent) => void;
  onKeyExhausted?: (event: ProviderKeyExhaustedEvent) => void;
}

export interface ProviderExecuteOptions {
  adapter: ProviderAdapter;
  request: ProviderRequest;
  schedulingContext: SchedulingContext;
  strategy: string;
}

export interface ProviderAttemptFailureEvent {
  providerError: ProviderError;
  keyId: string;
  attempt: number;
}

export interface ProviderKeyExhaustedEvent {
  error: unknown;
  attemptedKeyIds: string[];
}

export class ProviderRequestFailedError extends Error {
  constructor(readonly providerError: ProviderError) {
    super(providerError.message);
  }
}

export class ProviderRequestExecutor {
  constructor(private readonly options: ProviderRequestExecutorOptions) {}

  async execute(options: ProviderExecuteOptions): Promise<ProviderResponse> {
    const attemptedKeyIds: string[] = [];
    let lastProviderError: ProviderError | undefined;

    for (let attempt = 1; attempt <= this.options.retryPolicy.maxAttempts; attempt += 1) {
      const selected = await this.options.scheduler.selectKey(
        {
          ...options.schedulingContext,
          excludedKeyIds: attemptedKeyIds
        },
        options.strategy
      ).catch((error: unknown) => {
        this.options.onKeyExhausted?.({
          error,
          attemptedKeyIds
        });

        return undefined;
      });

      if (!selected) {
        break;
      }

      attemptedKeyIds.push(selected.key.id);

      try {
        return await options.adapter.send(options.request, {
          requestId: options.schedulingContext.requestId,
          key: selected.key
        });
      } catch (error) {
        const providerError = options.adapter.normalizeError(error);
        lastProviderError = providerError;

        this.options.onAttemptFailure?.({
          providerError,
          keyId: selected.key.id,
          attempt
        });

        if (!this.options.retryPolicy.shouldRetry(providerError, attempt)) {
          break;
        }
      }
    }

    throw new ProviderRequestFailedError(lastProviderError ?? {
      provider: options.schedulingContext.provider ?? "unknown",
      code: "provider_error",
      message: "Provider request failed",
      retryable: false,
      rateLimited: false,
      authenticationFailed: false
    });
  }
}

