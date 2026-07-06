import type {
  ApiKeyRecord,
  ProviderAdapter,
  ProviderError,
  ProviderHealthResult,
  ProviderRequest,
  ProviderRequestContext,
  ProviderResponse
} from "@keypool/shared";
import { alwaysOk, type FakeOutcome, type FakeScript } from "./fake-script.js";

export interface FakeOpenAIAdapterOptions {
  name: string;
  /** extra latency added to every send, ms */
  baseLatencyMs?: number;
  /** random ± jitter applied on top of baseLatencyMs, ms */
  latencyJitterMs?: number;
  /**
   * Resolves the script for a given key. The default returns the shared
   * `alwaysOk` script so the adapter is functional with no configuration.
   */
  resolveScript?: (key: ApiKeyRecord) => FakeScript | undefined;
  /** injected clock for tests; defaults to `() => new Date()` */
  now?: () => Date;
  /** injected RNG for latency jitter; defaults to Math.random */
  random?: () => number;
}

export class FakeProviderHttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly body: unknown
  ) {
    super(`Fake provider returned HTTP ${statusCode}`);
  }
}

/**
 * A ProviderAdapter that talks to no one. Every send:
 *  1. resolves a FakeScript for the key
 *  2. asks the script for the next outcome
 *  3. if the outcome is an error, throws FakeProviderHttpError; otherwise
 *     returns a deterministic OpenAI-shaped response.
 *
 * The response body includes a `servedBy` field derived from the keyId so
 * callers can verify which key handled the request — this is the main
 * observability hook for "show me the scheduling".
 */
export class FakeOpenAIAdapter implements ProviderAdapter {
  readonly name: string;

  private readonly baseLatencyMs: number;
  private readonly latencyJitterMs: number;
  private readonly resolveScript: (key: ApiKeyRecord) => FakeScript | undefined;
  private readonly now: () => Date;
  private readonly random: () => number;

  /** last outcome per key, kept for debugging / assertions */
  private readonly lastOutcome = new Map<string, FakeOutcome>();

  constructor(options: FakeOpenAIAdapterOptions) {
    this.name = options.name;
    this.baseLatencyMs = options.baseLatencyMs ?? 0;
    this.latencyJitterMs = options.latencyJitterMs ?? 0;
    this.resolveScript = options.resolveScript ?? (() => alwaysOk);
    this.now = options.now ?? (() => new Date());
    this.random = options.random ?? Math.random;
  }

  /** exposed for tests / admin: peek at the last outcome of a key */
  getLastOutcome(keyId: string): FakeOutcome | undefined {
    return this.lastOutcome.get(keyId);
  }

  async send(request: ProviderRequest, context: ProviderRequestContext): Promise<ProviderResponse> {
    const outcome = this.nextOutcome(context.key);

    const delay = this.baseLatencyMs + (this.latencyJitterMs > 0
      ? Math.floor(this.random() * this.latencyJitterMs)
      : 0);
    const totalDelay = delay + (outcome.latencyMs ?? 0);

    if (totalDelay > 0) {
      await sleep(totalDelay, this.now);
    }

    if (outcome.kind !== "ok") {
      throw new FakeProviderHttpError(outcome.statusCode, {
        error: {
          code: outcome.code,
          message: outcome.message
        }
      });
    }

    const userMessage = extractLastUserMessage(request.body);
    const completion = buildFakeCompletion(userMessage, context.key, context.requestId);

    return {
      statusCode: 200,
      headers: {
        "content-type": "application/json",
        "x-keypool-fake": "1"
      },
      body: completion
    };
  }

  async checkHealth(_key: ApiKeyRecord): Promise<ProviderHealthResult> {
    return { status: "healthy" };
  }

  normalizeError(error: unknown): ProviderError {
    if (error instanceof FakeProviderHttpError) {
      const statusCode = error.statusCode;
      const body = error.body as { error?: { code?: string; message?: string } } | undefined;
      const code = body?.error?.code ?? providerErrorCodeForStatus(statusCode);
      const message = body?.error?.message ?? error.message;

      return {
        provider: this.name,
        statusCode,
        code,
        message,
        retryable: isRetryableStatus(statusCode),
        rateLimited: statusCode === 429,
        authenticationFailed: statusCode === 401 || statusCode === 403
      };
    }

    return {
      provider: this.name,
      code: "network_error",
      message: error instanceof Error ? error.message : "Unknown fake provider error",
      retryable: true,
      rateLimited: false,
      authenticationFailed: false
    };
  }

  private nextOutcome(key: ApiKeyRecord): FakeOutcome {
    const script = this.resolveScript(key) ?? alwaysOk;
    const outcome = script.next({
      keyId: key.id,
      now: this.now
    }) ?? defaultOk();

    this.lastOutcome.set(key.id, outcome);

    return outcome;
  }
}

function defaultOk(): FakeOutcome {
  return {
    kind: "ok",
    statusCode: 200,
    code: "ok",
    message: "ok",
    retryable: false,
    rateLimited: false,
    authenticationFailed: false
  };
}

function sleep(ms: number, now: () => Date): Promise<void> {
  return new Promise((resolve) => {
    const start = now().getTime();
    const tick = (): void => {
      if (now().getTime() - start >= ms) {
        resolve();
        return;
      }

      setTimeout(tick, Math.min(25, ms));
    };
    tick();
  });
}

function extractLastUserMessage(body: unknown): string {
  if (!body || typeof body !== "object") {
    return "";
  }

  const messages = (body as { messages?: unknown }).messages;
  if (!Array.isArray(messages) || messages.length === 0) {
    return "";
  }

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    if (message && typeof message === "object" && (message as { role?: unknown }).role === "user") {
      const content = (message as { content?: unknown }).content;
      if (typeof content === "string") {
        return content;
      }
    }
  }

  return "";
}

function buildFakeCompletion(userMessage: string, key: ApiKeyRecord, requestId: string): unknown {
  const keyTag = keyTagOf(key.id);
  const echoed = userMessage.length > 0 ? userMessage : "(empty)";
  return {
    id: `fake-${requestId}`,
    object: "chat.completion",
    created: Math.floor(Date.now() / 1000),
    model: "fake-model",
    servedBy: keyTag,
    keyId: key.id,
    choices: [
      {
        index: 0,
        message: {
          role: "assistant",
          content: `[fake:${keyTag}] ${echoed}`
        },
        finish_reason: "stop"
      }
    ],
    usage: {
      prompt_tokens: userMessage.length,
      completion_tokens: 8,
      total_tokens: userMessage.length + 8
    }
  };
}

function keyTagOf(id: string): string {
  if (id.length <= 4) {
    return id;
  }

  return id.slice(-4);
}

function providerErrorCodeForStatus(statusCode: number): string {
  if (statusCode === 429) {
    return "rate_limited";
  }

  if (statusCode === 401 || statusCode === 403) {
    return "authentication_failed";
  }

  if (statusCode >= 500) {
    return "provider_server_error";
  }

  return "provider_request_error";
}

function isRetryableStatus(statusCode: number): boolean {
  return statusCode === 429 || statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504;
}
