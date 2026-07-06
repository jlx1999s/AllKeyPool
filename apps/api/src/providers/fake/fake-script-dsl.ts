import type { FakeOutcome, FakeScript } from "./fake-script.js";
import {
  burstRateLimit,
  periodic,
  probability,
  rateLimitedOutcome,
  sequence,
  serverErrorOutcome
} from "./fake-script.js";

/**
 * Parse a single scripted-outcome spec. Examples:
 *   "ok"
 *   "rate_limited"
 *   "server_error"
 *   "429"
 *   "500"
 */
function parseOutcome(spec: string): FakeOutcome | undefined {
  const normalized = spec.trim().toLowerCase();

  if (normalized === "ok" || normalized === "200") {
    return undefined;
  }

  if (normalized === "rate_limited" || normalized === "429") {
    return rateLimitedOutcome();
  }

  if (normalized === "server_error" || normalized === "500") {
    return serverErrorOutcome();
  }

  if (normalized === "504" || normalized === "timeout") {
    return {
      kind: "timeout",
      statusCode: 504,
      code: "timeout",
      message: "Fake provider timed out",
      retryable: true,
      rateLimited: false,
      authenticationFailed: false
    };
  }

  throw new Error(`Unknown fake script outcome: ${spec}`);
}

/**
 * Build a FakeScript from a YAML-friendly string spec. Supported forms:
 *
 *   - "ok"                         — always ok
 *   - "sequence(ok, ok, 429, ok)"  — scripted list, consumed in order
 *   - "periodic(period=3, rate_limited)"
 *   - "burst(windowMs=1000, allowed=2, outcome=rate_limited)"
 *   - "probability(p=0.1, outcome=server_error)"
 *
 * Whitespace inside is flexible; outcome names are case-insensitive.
 */
export function buildScriptFromSpec(spec: string | undefined | null): FakeScript {
  if (!spec || spec.trim() === "" || spec.trim().toLowerCase() === "ok") {
    return { next: () => undefined };
  }

  const head = headOf(spec);
  const body = bodyOf(spec);

  switch (head) {
    case "sequence":
      return sequence(parseArgList(body).map(parseOutcome));
    case "periodic": {
      const args = parseNamedArgs(body);
      const period = Number(args.period);
      const outcome = parseOutcome(args.outcome ?? "rate_limited");

      if (!Number.isFinite(period) || period < 1) {
        throw new Error(`periodic requires period >= 1, got: ${args.period}`);
      }
      if (!outcome) {
        throw new Error(`periodic requires an outcome, got: ${args.outcome}`);
      }

      return periodic({ period, outcome });
    }
    case "burst": {
      const args = parseNamedArgs(body);
      const windowMs = Number(args.windowMs ?? args.window ?? 1000);
      const allowedBeforeBurst = Number(args.allowed ?? args.allowedBeforeBurst ?? args.limit ?? 1);
      const outcome = parseOutcome(args.outcome ?? "rate_limited");

      if (!Number.isFinite(windowMs) || windowMs < 1) {
        throw new Error(`burst requires windowMs >= 1, got: ${args.windowMs ?? args.window}`);
      }
      if (!Number.isFinite(allowedBeforeBurst) || allowedBeforeBurst < 0) {
        throw new Error(`burst requires allowed >= 0, got: ${args.allowed ?? args.allowedBeforeBurst}`);
      }
      if (!outcome) {
        throw new Error(`burst requires an outcome, got: ${args.outcome}`);
      }

      return burstRateLimit({ windowMs, allowedBeforeBurst, outcome });
    }
    case "probability": {
      const args = parseNamedArgs(body);
      const p = Number(args.p ?? args.probability ?? 0);
      const outcome = parseOutcome(args.outcome ?? "server_error");
      const seed = args.seed !== undefined ? Number(args.seed) : undefined;

      if (!Number.isFinite(p) || p < 0 || p > 1) {
        throw new Error(`probability requires 0 <= p <= 1, got: ${args.p ?? args.probability}`);
      }
      if (!outcome) {
        throw new Error(`probability requires an outcome, got: ${args.outcome}`);
      }

      const options: { p: number; outcome: FakeOutcome; seed?: number } = { p, outcome };
      if (seed !== undefined) {
        options.seed = seed;
      }
      return probability(options);
    }
    default:
      throw new Error(`Unknown fake script directive: ${head}`);
  }
}

function headOf(spec: string): string {
  const open = spec.indexOf("(");

  if (open < 0) {
    return spec.trim().toLowerCase();
  }

  return spec.slice(0, open).trim().toLowerCase();
}

function bodyOf(spec: string): string {
  const open = spec.indexOf("(");
  const close = spec.lastIndexOf(")");

  if (open < 0 || close <= open) {
    return "";
  }

  return spec.slice(open + 1, close);
}

function parseArgList(body: string): string[] {
  return splitTopLevel(body, ",").map((entry) => entry.trim()).filter((entry) => entry.length > 0);
}

function parseNamedArgs(body: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const part of splitTopLevel(body, ",")) {
    const trimmed = part.trim();

    if (trimmed.length === 0) {
      continue;
    }

    const eq = trimmed.indexOf("=");

    if (eq < 0) {
      result[trimmed] = "true";
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    const value = trimmed.slice(eq + 1).trim();
    result[key] = value;
  }

  return result;
}

function splitTopLevel(input: string, separator: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;

  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];

    if (char === "(") {
      depth += 1;
    } else if (char === ")") {
      depth -= 1;
    } else if (char === separator && depth === 0) {
      parts.push(input.slice(start, i));
      start = i + 1;
    }
  }

  parts.push(input.slice(start));

  return parts;
}
