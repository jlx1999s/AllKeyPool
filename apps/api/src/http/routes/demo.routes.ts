import { randomUUID } from "node:crypto";
import type { ProviderError, ProviderRequestContext, ProviderResponse, SchedulingContext } from "@keypool/shared";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import {
  ProviderRequestExecutor,
  ProviderRequestFailedError,
  type ProviderAttemptSinkEntry
} from "../../core/provider-executor/provider-request-executor.js";

/**
 * Demo Runner endpoint. Drives the scheduler / retry / quota machinery the
 * same way a real client would, but renders the full per-attempt trail
 * (which key, which status, which error, how long) into a single response
 * payload so a human can SEE the scheduling decisions without grepping
 * logs.
 *
 * Modes:
 *   - "single":  one turn
 *   - "multi":   N turns, in order
 *   - "load":    same prompt repeated N times with optional interval
 *
 * Optional `sessionId` pins every turn to the same key (sticky session
 * simulation) so users can verify what "session affinity" would feel like
 * before the official sticky strategy is implemented.
 */

const demoRequestSchema = z.object({
  model: z.string().min(1),
  // Three ways to describe the messages:
  // 1) `messages`: full OpenAI-shaped array (highest precedence)
  messages: z.array(z.object({
    role: z.enum(["system", "user", "assistant"]),
    content: z.string().min(1)
  })).optional(),
  // 2) `turns`: shorthand, one element = one user turn; auto-wrapped into messages
  turns: z.array(z.string().min(1)).optional(),
  // 3) `prompt` / `count` / `intervalMs`: load-test shorthand
  prompt: z.string().min(1).optional(),
  count: z.coerce.number().int().min(1).max(500).default(1),
  intervalMs: z.coerce.number().int().min(0).max(10_000).default(0),
  // Optional sticky session: every turn sticks to the first key picked
  sessionId: z.string().min(1).optional(),
  // Optional strategy override (else use the pool's default)
  strategy: z.enum(["round_robin", "weighted_round_robin"]).optional()
});

interface DemoAttemptView {
  attempt: number;
  keyId: string;
  outcome: "success" | "error";
  statusCode?: number;
  errorCode?: string;
  latencyMs: number;
}

interface DemoTurnResult {
  turn: number;
  requestId: string;
  status: number;
  provider: string;
  pool: string;
  keyId: string;
  servedBy: string;
  latencyMs: number;
  attempt: number;
  attempts: DemoAttemptView[];
  error?: { code: string; message: string };
  responseText: string;
}

interface DemoResponse {
  sessionId: string;
  model: string;
  pool: string;
  provider: string;
  startedAt: string;
  totalDurationMs: number;
  results: DemoTurnResult[];
  summary: {
    total: number;
    success: number;
    failed: number;
    avgLatencyMs: number;
    p50LatencyMs: number;
    p95LatencyMs: number;
    distinctKeys: number;
    distinctKeyIds: string[];
  };
}

export async function registerDemoRoutes(app: FastifyInstance): Promise<void> {
  // demo routes reuse the admin token — same model as /admin/api/*.
  // We add the same preHandler so the token check is centralized.
  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/_demo/")) {
      return;
    }

    if (!app.adminAuth.verifyRequest(request)) {
      return reply.status(401).send({
        error: {
          code: "admin_unauthorized",
          message: "Admin token is required for /_demo/*"
        }
      });
    }
  });

  app.post("/_demo/chat", async (request, reply) => {
    const body = demoRequestSchema.parse(request.body);
    const sessionId = body.sessionId ?? randomUUID();
    const messages = resolveMessages(body);

    // `turns` is a multi-turn shorthand: each turn becomes one request.
    // Unless the caller explicitly set `count`, expand it to match.
    const effectiveCount = body.count > 1 || !body.turns || body.turns.length <= 1
      ? body.count
      : body.turns.length;

    const route = findRouteForModel(app, body.model);
    if (!route) {
      return reply.status(503).send({
        error: {
          code: "no_pool",
          message: `No configured provider pool supports model: ${body.model}`
        }
      });
    }

    const startedAtIso = new Date().toISOString();
    const startedAtMs = Date.now();

    // sticky: same sessionId -> same keyId. Only pin when the caller asked
    // for a session — otherwise each turn re-enters normal scheduling.
    const stickySession = Boolean(body.sessionId);
    let pinnedKeyId: string | undefined;

    const results: DemoTurnResult[] = [];
    const distinctKeyIds = new Set<string>();

    for (let i = 0; i < effectiveCount; i += 1) {
      const turnNumber = i + 1;
      const requestId = randomUUID();
      const turnStartedAt = Date.now();

      const attempts: ProviderAttemptSinkEntry[] = [];

      const stickyExcluded: string[] = [];
      if (pinnedKeyId) {
        // exclude every other key in this pool, force the sticky pick
        const poolKeys = await app.apiKeyRepository.findByPool(route.poolName, {
          provider: route.providerName
        });
        for (const k of poolKeys) {
          if (k.id !== pinnedKeyId) {
            stickyExcluded.push(k.id);
          }
        }
      }

      const schedulingContext: SchedulingContext = {
        requestId,
        pool: route.poolName,
        provider: route.providerName,
        model: body.model,
        excludedKeyIds: stickyExcluded
      };

      const strategy = body.strategy ?? route.strategy;

      try {
        const response = await app.providerRequestExecutor.execute({
          adapter: app.providerRegistry.get(route.providerName),
          request: { model: body.model, body: { model: body.model, messages } },
          schedulingContext,
          strategy,
          attemptSink: (entry) => {
            attempts.push(entry);
          }
        });

        const winningKeyId = attempts.at(-1)?.keyId ?? "unknown";
        if (stickySession && !pinnedKeyId) {
          pinnedKeyId = winningKeyId;
        }
        distinctKeyIds.add(winningKeyId);

        results.push({
          turn: turnNumber,
          requestId,
          status: response.statusCode,
          provider: route.providerName,
          pool: route.poolName,
          keyId: winningKeyId,
          servedBy: keyTagOf(winningKeyId),
          latencyMs: Date.now() - turnStartedAt,
          attempt: attempts.length,
          attempts: attempts.map(toAttemptView),
          responseText: extractText(response)
        });
      } catch (error) {
        const providerError = extractProviderError(error);
        const lastAttempt = attempts.at(-1);
        const winningKeyId = lastAttempt?.keyId ?? "unknown";
        distinctKeyIds.add(winningKeyId);

        results.push({
          turn: turnNumber,
          requestId,
          status: providerError ? statusForError(providerError) : 502,
          provider: route.providerName,
          pool: route.poolName,
          keyId: winningKeyId,
          servedBy: keyTagOf(winningKeyId),
          latencyMs: Date.now() - turnStartedAt,
          attempt: attempts.length,
          attempts: attempts.map(toAttemptView),
          error: providerError
            ? { code: providerError.code, message: providerError.message }
            : { code: "internal_error", message: error instanceof Error ? error.message : "Unknown error" },
          responseText: ""
        });
      }

      if (body.intervalMs > 0 && i < effectiveCount - 1) {
        await new Promise<void>((resolve) => setTimeout(resolve, body.intervalMs));
      }
    }

    const totalDurationMs = Date.now() - startedAtMs;
    const summary = computeSummary(results);

    const response: DemoResponse = {
      sessionId,
      model: body.model,
      pool: route.poolName,
      provider: route.providerName,
      startedAt: startedAtIso,
      totalDurationMs,
      results,
      summary
    };

    return reply.status(200).send(response);
  });
}

function resolveMessages(body: z.infer<typeof demoRequestSchema>): Array<{ role: "system" | "user" | "assistant"; content: string }> {
  if (body.messages && body.messages.length > 0) {
    return body.messages;
  }
  if (body.turns && body.turns.length > 0) {
    return body.turns.map((content) => ({ role: "user" as const, content }));
  }
  if (body.prompt) {
    return [{ role: "user", content: body.prompt }];
  }
  // last-resort fallback so a "load" call with no prompt still produces something
  return [{ role: "user", content: "ping" }];
}

function findRouteForModel(app: FastifyInstance, model: string): {
  poolName: string;
  providerName: string;
  strategy: "round_robin" | "weighted_round_robin";
} | undefined {
  for (const [poolName, pool] of Object.entries(app.config.pools)) {
    for (const poolProvider of pool.providers) {
      if (!app.providerRegistry.has(poolProvider.provider)) {
        continue;
      }
      if (poolProvider.models.length > 0 && !poolProvider.models.includes(model)) {
        continue;
      }
      return {
        poolName,
        providerName: poolProvider.provider,
        strategy: pool.strategy
      };
    }
  }
  return undefined;
}

function toAttemptView(entry: ProviderAttemptSinkEntry): DemoAttemptView {
  const view: DemoAttemptView = {
    attempt: entry.attempt,
    keyId: entry.keyId,
    outcome: entry.outcome,
    latencyMs: entry.latencyMs
  };
  if (entry.statusCode !== undefined) {
    view.statusCode = entry.statusCode;
  }
  if (entry.errorCode !== undefined) {
    view.errorCode = entry.errorCode;
  }
  return view;
}

function extractProviderError(error: unknown): ProviderError | undefined {
  if (error instanceof ProviderRequestFailedError) {
    return error.providerError;
  }
  if (error && typeof error === "object" && "provider" in error && "code" in error) {
    return error as ProviderError;
  }
  return undefined;
}

function statusForError(providerError: ProviderError): number {
  if (providerError.authenticationFailed) {
    return 502;
  }
  return providerError.statusCode ?? 502;
}

function extractText(response: ProviderResponse): string {
  const body = response.body;
  if (!body || typeof body !== "object") {
    return "";
  }
  const choices = (body as { choices?: unknown }).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    return "";
  }
  const first = choices[0];
  if (!first || typeof first !== "object") {
    return "";
  }
  const message = (first as { message?: unknown }).message;
  if (!message || typeof message !== "object") {
    return "";
  }
  const content = (message as { content?: unknown }).content;
  return typeof content === "string" ? content : "";
}

function keyTagOf(id: string): string {
  if (id.length <= 4) {
    return id;
  }
  return id.slice(-4);
}

function computeSummary(results: DemoTurnResult[]): DemoResponse["summary"] {
  const total = results.length;
  const success = results.filter((r) => r.status >= 200 && r.status < 400).length;
  const failed = total - success;
  const latencies = results.map((r) => r.latencyMs).sort((a, b) => a - b);
  const avg = latencies.length === 0
    ? 0
    : Math.round(latencies.reduce((a, b) => a + b, 0) / latencies.length);
  const p50 = percentile(latencies, 0.5);
  const p95 = percentile(latencies, 0.95);
  const distinctKeyIds = Array.from(new Set(results.map((r) => r.keyId).filter((k) => k !== "unknown")));

  return {
    total,
    success,
    failed,
    avgLatencyMs: avg,
    p50LatencyMs: p50,
    p95LatencyMs: p95,
    distinctKeys: distinctKeyIds.length,
    distinctKeyIds
  };
}

function percentile(sorted: number[], p: number): number {
  if (sorted.length === 0) {
    return 0;
  }
  const idx = Math.min(sorted.length - 1, Math.floor(p * sorted.length));
  return sorted[idx] ?? 0;
}
