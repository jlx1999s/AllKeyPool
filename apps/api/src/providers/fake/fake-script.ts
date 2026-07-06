export type FakeOutcomeKind = "ok" | "rate_limited" | "server_error" | "auth_failed" | "client_error" | "timeout";

export interface FakeOutcome {
  kind: FakeOutcomeKind;
  statusCode: number;
  code: string;
  message: string;
  retryable: boolean;
  rateLimited: boolean;
  authenticationFailed: boolean;
  /** extra latency in ms, applied on top of base latency */
  latencyMs?: number;
}

export interface FakeScriptContext {
  /** the keyId this script belongs to (for logging/debugging) */
  keyId: string;
  /** wall clock for time-windowed strategies (burst limiter) */
  now: () => Date;
}

export interface FakeScript {
  /**
   * Returns the outcome for the next call, or `undefined` to fall through
   * to the default (an `ok` response). The script is stateful — it can keep
   * internal counters / window timestamps.
   */
  next(ctx: FakeScriptContext): FakeOutcome | undefined;
}

/** shorthand outcome constructors ---------------------------------------- */

export function okOutcome(extra: Partial<FakeOutcome> = {}): FakeOutcome {
  return {
    kind: "ok",
    statusCode: 200,
    code: "ok",
    message: "ok",
    retryable: false,
    rateLimited: false,
    authenticationFailed: false,
    ...extra
  };
}

export function rateLimitedOutcome(extra: Partial<FakeOutcome> = {}): FakeOutcome {
  return {
    kind: "rate_limited",
    statusCode: 429,
    code: "rate_limited",
    message: "Rate limit reached for fake provider",
    retryable: true,
    rateLimited: true,
    authenticationFailed: false,
    ...extra
  };
}

export function serverErrorOutcome(extra: Partial<FakeOutcome> = {}): FakeOutcome {
  return {
    kind: "server_error",
    statusCode: 500,
    code: "provider_server_error",
    message: "Fake provider server error",
    retryable: true,
    rateLimited: false,
    authenticationFailed: false,
    ...extra
  };
}

export function authFailedOutcome(extra: Partial<FakeOutcome> = {}): FakeOutcome {
  return {
    kind: "auth_failed",
    statusCode: 401,
    code: "authentication_failed",
    message: "Fake provider auth failed",
    retryable: false,
    rateLimited: false,
    authenticationFailed: true,
    ...extra
  };
}

export function timeoutOutcome(extra: Partial<FakeOutcome> = {}): FakeOutcome {
  return {
    kind: "timeout",
    statusCode: 504,
    code: "timeout",
    message: "Fake provider timed out",
    retryable: true,
    rateLimited: false,
    authenticationFailed: false,
    ...extra
  };
}

/** script builders ------------------------------------------------------- */

/**
 * Scripted sequence: consume outcomes from a list in order. When the list
 * is exhausted, return `undefined` so the adapter uses its default (ok).
 *
 * Example: `sequence(["ok", "ok", "rate_limited", "ok"])`
 */
export function sequence(outcomes: ReadonlyArray<FakeOutcome | undefined>): FakeScript {
  let index = 0;
  return {
    next() {
      if (index >= outcomes.length) {
        return undefined;
      }

      const outcome = outcomes[index];
      index += 1;

      return outcome;
    }
  };
}

/**
 * Periodic injection: every `period`-th call (1-indexed) returns the chosen
 * outcome; the rest are `undefined` (default ok).
 *
 * Example: `periodic({ period: 3, outcome: rateLimitedOutcome() })`
 */
export function periodic(options: { period: number; outcome: FakeOutcome }): FakeScript {
  let call = 0;
  return {
    next() {
      call += 1;

      if (call % options.period === 0) {
        return options.outcome;
      }

      return undefined;
    }
  };
}

/**
 * Burst rate-limit: within a sliding `windowMs` window, the first
 * `allowedBeforeBurst` calls are ok; further calls return the rate-limit
 * outcome until the window slides past. The window slides forward only
 * when a new call arrives after `windowMs` has elapsed since the window
 * started — i.e. it's a fixed window, not a true sliding window. That's
 * intentional: it mirrors the InMemoryQuotaManager behavior.
 */
export function burstRateLimit(options: {
  windowMs: number;
  allowedBeforeBurst: number;
  outcome?: FakeOutcome;
}): FakeScript {
  let windowStart: number | undefined;
  let count = 0;
  const outcome = options.outcome ?? rateLimitedOutcome();
  return {
    next(ctx) {
      const nowMs = ctx.now().getTime();

      if (windowStart === undefined || nowMs - windowStart >= options.windowMs) {
        windowStart = nowMs;
        count = 0;
      }

      count += 1;

      if (count > options.allowedBeforeBurst) {
        return outcome;
      }

      return undefined;
    }
  };
}

/**
 * Probability injection: each call, return `outcome` with probability `p`,
 * otherwise undefined (default ok). Useful for "1-in-10 returns 500" style
 * chaos testing.
 */
export function probability(options: { p: number; outcome: FakeOutcome; seed?: number }): FakeScript {
  let state = options.seed ?? Date.now();
  return {
    next() {
      // xorshift32 for deterministic-ish randomness when a seed is given
      state ^= state << 13;
      state ^= state >>> 17;
      state ^= state << 5;
      state >>>= 0;
      const r = state / 0x1_0000_0000;

      return r < options.p ? options.outcome : undefined;
    }
  };
}

/**
 * Always-ok script — the default when no script is configured. Used so
 * adapter callers don't have to special-case `undefined`.
 */
export const alwaysOk: FakeScript = {
  next: () => undefined
};
