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
  onAttemptFailure?: (event: ProviderAttemptFailureEvent) => void | Promise<void>;
  onAttemptSuccess?: (event: ProviderAttemptSuccessEvent) => void | Promise<void>;
  onKeyExhausted?: (event: ProviderKeyExhaustedEvent) => void | Promise<void>;
}

export interface ProviderExecuteOptions {
  adapter: ProviderAdapter;
  request: ProviderRequest;
  schedulingContext: SchedulingContext;
  strategy: string;
}

export interface ProviderAttemptFailureEvent {
  requestId: string;
  pool: string;
  provider?: string;
  model?: string;
  providerError: ProviderError;
  keyId: string;
  attempt: number;
}

export interface ProviderAttemptSuccessEvent {
  requestId: string;
  pool: string;
  provider?: string;
  model?: string;
  keyId: string;
  attempt: number;
  statusCode: number;
  latencyMs: number;
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
        return {
          error,
          attemptedKeyIds
        };
      });

      if ("error" in selected) {
        await this.options.onKeyExhausted?.(selected);
        break;
      }

      attemptedKeyIds.push(selected.key.id);

      try {
        const startedAt = Date.now();
        const response = await options.adapter.send(options.request, {
          requestId: options.schedulingContext.requestId,
          key: selected.key
        });
        await this.options.onAttemptSuccess?.({
          requestId: options.schedulingContext.requestId,
          pool: options.schedulingContext.pool,
          ...(options.schedulingContext.provider === undefined ? {} : { provider: options.schedulingContext.provider }),
          ...(options.schedulingContext.model === undefined ? {} : { model: options.schedulingContext.model }),
          keyId: selected.key.id,
          attempt,
          statusCode: response.statusCode,
          latencyMs: Date.now() - startedAt
        });

        return response;
      } catch (error) {
        const providerError = options.adapter.normalizeError(error);
        lastProviderError = providerError;

        await this.options.onAttemptFailure?.({
          requestId: options.schedulingContext.requestId,
          pool: options.schedulingContext.pool,
          ...(options.schedulingContext.provider === undefined ? {} : { provider: options.schedulingContext.provider }),
          ...(options.schedulingContext.model === undefined ? {} : { model: options.schedulingContext.model }),
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
