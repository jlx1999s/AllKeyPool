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
  onAttemptSuccess?: (event: ProviderAttemptSuccessEvent) => void;
  onKeyExhausted?: (event: ProviderKeyExhaustedEvent) => void;
  /**
   * Optional sink that receives one entry per attempt, in order. Distinct
   * from `onAttemptSuccess` / `onAttemptFailure` in that the sink captures
   * both success and failure into a single ordered buffer that survives
   * the executor returning, so callers (e.g. /_demo/chat) can render the
   * full retry chain of a single logical request.
   */
  attemptSink?: (entry: ProviderAttemptSinkEntry) => void;
}

export interface ProviderExecuteOptions {
  adapter: ProviderAdapter;
  request: ProviderRequest;
  schedulingContext: SchedulingContext;
  strategy: string;
  /**
   * Per-attempt ordered sink for this call. Overrides / shadows the
   * executor-level `attemptSink` for this specific call. Entries are
   * pushed in the order attempts happen (success or failure), so callers
   * like /_demo/chat can render the full retry chain.
   */
  attemptSink?: (entry: ProviderAttemptSinkEntry) => void;
}

export interface ProviderAttemptFailureEvent {
  providerError: ProviderError;
  keyId: string;
  attempt: number;
  latencyMs: number;
}

export interface ProviderAttemptSuccessEvent {
  keyId: string;
  attempt: number;
  latencyMs: number;
}

export interface ProviderKeyExhaustedEvent {
  error: unknown;
  attemptedKeyIds: string[];
}

export interface ProviderAttemptSinkEntry {
  attempt: number;
  keyId: string;
  outcome: "success" | "error";
  statusCode?: number;
  errorCode?: string;
  latencyMs: number;
}

export class ProviderRequestFailedError extends Error {
  constructor(readonly providerError: ProviderError) {
    super(providerError.message);
  }
}

export class ProviderRequestExecutor {
  constructor(private readonly options: ProviderRequestExecutorOptions) {}

  async execute(options: ProviderExecuteOptions): Promise<ProviderResponse> {
    // Pre-existing excludedKeyIds from the caller (e.g. /_demo/chat sticky
    // session) must be preserved across attempts — we add to that set rather
    // than replacing it, so the caller's intent (e.g. "force this key")
    // is honored on every retry inside this call.
    const callerExcluded = new Set(options.schedulingContext.excludedKeyIds ?? []);
    const attemptedKeyIds: string[] = [];
    let lastProviderError: ProviderError | undefined;
    const sink = options.attemptSink ?? this.options.attemptSink;

    for (let attempt = 1; attempt <= this.options.retryPolicy.maxAttempts; attempt += 1) {
      const mergedExcluded = new Set(callerExcluded);
      for (const id of attemptedKeyIds) {
        mergedExcluded.add(id);
      }
      const selected = await this.options.scheduler.selectKey(
        {
          ...options.schedulingContext,
          excludedKeyIds: Array.from(mergedExcluded)
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

      const startedAt = Date.now();

      try {
        const response = await options.adapter.send(options.request, {
          requestId: options.schedulingContext.requestId,
          key: selected.key
        });

        const latencyMs = Date.now() - startedAt;

        this.options.onAttemptSuccess?.({
          keyId: selected.key.id,
          attempt,
          latencyMs
        });
        sink?.({
          attempt,
          keyId: selected.key.id,
          outcome: "success",
          statusCode: response.statusCode,
          latencyMs
        });

        return response;
      } catch (error) {
        const providerError = options.adapter.normalizeError(error);
        lastProviderError = providerError;
        const latencyMs = Date.now() - startedAt;

        this.options.onAttemptFailure?.({
          providerError,
          keyId: selected.key.id,
          attempt,
          latencyMs
        });
        const sinkEntry: ProviderAttemptSinkEntry = {
          attempt,
          keyId: selected.key.id,
          outcome: "error",
          errorCode: providerError.code,
          latencyMs
        };
        if (providerError.statusCode !== undefined) {
          sinkEntry.statusCode = providerError.statusCode;
        }
        sink?.(sinkEntry);

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

