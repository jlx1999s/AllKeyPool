import type { ApiKeyRecord } from "@keypool/shared";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { OpenAIAdapter } from "../../providers/openai/openai.adapter.js";
import { findProviderPreset, providerPresets } from "../../providers/provider-presets.js";
import { renderAdminPanelHtml } from "../views/admin-panel.view.js";

const upsertKeyRequestSchema = z.object({
  presetId: z.string().min(1).optional(),
  provider: z.string().min(1).optional(),
  providerType: z.literal("openai").optional(),
  baseUrl: z.string().url().optional(),
  pool: z.string().min(1).optional(),
  model: z.string().min(1).optional(),
  id: z.string().min(1),
  value: z.string().min(1),
  weight: z.coerce.number().int().positive().default(1),
  rpmLimit: z.coerce.number().int().positive().optional(),
  dailyRequestLimit: z.coerce.number().int().positive().optional()
});

type UpsertKeyRequest = z.infer<typeof upsertKeyRequestSchema>;

interface ResolvedUpsertKeyRequest {
  provider: string;
  providerType: "openai";
  baseUrl: string;
  pool: string;
  model: string;
  id: string;
  value: string;
  weight: number;
  rpmLimit?: number;
  dailyRequestLimit?: number;
}

const keyStatusSchema = z.object({
  status: z.enum(["healthy", "degraded", "cooling_down", "disabled"])
});

const chatTestSchema = z.object({
  model: z.string().min(1),
  content: z.string().min(1)
});

const usageQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50)
});

const healthEventsQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(200).default(50)
});

const keyUsageQuerySchema = z.object({
  limit: z.coerce.number().int().positive().max(256).default(64)
});

export async function registerAdminRoutes(app: FastifyInstance): Promise<void> {
  app.get("/", async (_request, reply) => reply.redirect("/admin"));
  app.get("/dev", async (_request, reply) => reply.redirect("/admin"));
  app.get("/favicon.ico", async (_request, reply) => reply.status(204).send());
  app.get("/apple-touch-icon.png", async (_request, reply) => reply.status(204).send());
  app.get("/apple-touch-icon-precomposed.png", async (_request, reply) => reply.status(204).send());

  app.get("/admin", async (_request, reply) => {
    return reply.type("text/html; charset=utf-8").send(renderAdminPanelHtml({
      usingDevToken: app.adminAuth.usingDevToken
    }));
  });

  app.addHook("preHandler", async (request, reply) => {
    if (!request.url.startsWith("/admin/api/")) {
      return;
    }

    if (!app.adminAuth.verifyRequest(request)) {
      return reply.status(401).send({
        error: {
          code: "admin_unauthorized",
          message: "Admin token is required"
        }
      });
    }
  });

  app.get("/admin/api/session", async (request) => ({
    ok: true,
    usingDevToken: app.adminAuth.usingDevToken,
    authenticated: app.adminAuth.verifyRequest(request)
  }));

  app.get("/admin/api/provider-presets", async () => ({
    presets: providerPresets
  }));

  app.get("/admin/api/usage", async (request) => {
    const query = usageQuerySchema.parse(request.query);
    return {
      usage: await app.usageRecorder.listRecent(query.limit)
    };
  });

  app.get("/admin/api/health-events", async (request) => {
    const query = healthEventsQuerySchema.parse(request.query);
    return {
      events: await app.healthEventRecorder.listRecent(query.limit)
    };
  });

  app.get("/admin/api/state", async () => {
    const keys = await app.apiKeyRepository.list();
    const recentUsage = await app.usageRecorder.listRecent(500);
    const recentHealthEvents = await app.healthEventRecorder.listRecent(20);
    const usageSnapshot = buildUsageSnapshot(recentUsage);

    return {
      server: app.config.server,
      retry: app.config.retry,
      auth: {
        enabled: app.adminAuth.enabled,
        usingDevToken: app.adminAuth.usingDevToken
      },
      fakeProvider: app.fakeProvider,
      providers: app.providerRegistry.list().map((provider) => provider.name),
      presets: providerPresets,
      pools: Object.entries(app.config.pools).map(([name, pool]) => ({
        name,
        strategy: pool.strategy,
        providers: pool.providers
      })),
      tasks: app.config.tasks,
      keys: keys.map(redactKey).map((key) => ({
        ...key,
        usage: usageSnapshot[key.id] ?? { total: 0, success: 0, error: 0 }
      })),
      usage: recentUsage.slice(0, 20),
      healthEvents: recentHealthEvents
    };
  });

  app.get("/admin/api/keys/:id/usage", async (request, reply) => {
    const keyId = getKeyId(request);
    const key = await app.apiKeyRepository.findById(keyId);

    if (!key) {
      return reply.status(404).send({
        error: {
          code: "key_not_found",
          message: `API key not found: ${keyId}`
        }
      });
    }

    const query = keyUsageQuerySchema.parse(request.query);
    const recentUsage = await app.usageRecorder.listRecent(500);
    const entries = recentUsage.filter((entry) => entry.keyId === keyId).slice(0, query.limit);

    return {
      keyId,
      summary: usageSnapshotFromEntries(entries),
      entries
    };
  });

  app.post("/admin/api/keys", async (request, reply) => {
    const parsedBody = upsertKeyRequestSchema.parse(request.body);
    const resolvedBody = resolveUpsertKeyRequest(parsedBody);

    if (!resolvedBody.ok) {
      return reply.status(400).send({
        error: {
          code: resolvedBody.code,
          message: resolvedBody.message
        }
      });
    }

    const body = resolvedBody.value;

    if (!app.providerRegistry.has(body.provider)) {
      app.providerRegistry.register(new OpenAIAdapter({
        name: body.provider,
        baseUrl: body.baseUrl
      }));
    }

    upsertRuntimeProviderConfig(app, body);
    upsertRuntimePoolConfig(app, body);
    await app.apiKeyRepository.upsert(toApiKeyRecord(body));

    return reply.status(201).send({
      ok: true
    });
  });

  app.patch("/admin/api/keys/:id/status", async (request, reply) => {
    const keyId = getKeyId(request);
    const body = keyStatusSchema.parse(request.body);
    const updated = await app.apiKeyRepository.updateStatus(keyId, body.status);

    if (!updated) {
      return reply.status(404).send({
        error: {
          code: "key_not_found",
          message: `API key not found: ${keyId}`
        }
      });
    }

    await app.healthEventRecorder.record({
      type: "key_status_changed",
      level: body.status === "disabled" ? "warn" : "info",
      keyId,
      code: body.status,
      message: `Key status changed to ${body.status}`
    });

    return {
      ok: true
    };
  });

  app.delete("/admin/api/keys/:id", async (request, reply) => {
    const keyId = getKeyId(request);
    const deleted = await app.apiKeyRepository.delete(keyId);

    if (!deleted) {
      return reply.status(404).send({
        error: {
          code: "key_not_found",
          message: `API key not found: ${keyId}`
        }
      });
    }

    return {
      ok: true
    };
  });

  app.post("/admin/api/test/health", async () => ({
    ok: true,
    health: {
      status: "ok",
      version: "0.1.0"
    }
  }));

  app.post("/admin/api/test/chat", async (request, reply) => {
    const body = chatTestSchema.parse(request.body);
    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: body.model,
        messages: [
          {
            role: "user",
            content: body.content
          }
        ]
      }
    });

    return reply.status(response.statusCode).send({
      statusCode: response.statusCode,
      body: parseJson(response.body)
    });
  });
}

function resolveUpsertKeyRequest(input: UpsertKeyRequest): {
  ok: true;
  value: ResolvedUpsertKeyRequest;
} | {
  ok: false;
  code: string;
  message: string;
} {
  const preset = input.presetId === undefined ? undefined : findProviderPreset(input.presetId);

  if (input.presetId !== undefined && preset === undefined) {
    return {
      ok: false,
      code: "unknown_provider_preset",
      message: `Unknown provider preset: ${input.presetId}`
    };
  }

  const provider = input.provider ?? preset?.provider;
  const providerType = input.providerType ?? preset?.providerType ?? "openai";
  const baseUrl = input.baseUrl ?? preset?.baseUrl;
  const pool = input.pool ?? preset?.pool;
  const model = input.model ?? preset?.model ?? "gpt-4.1-mini";
  const missingFields: string[] = [];

  if (provider === undefined) missingFields.push("provider");
  if (baseUrl === undefined) missingFields.push("baseUrl");
  if (pool === undefined) missingFields.push("pool");

  if (provider === undefined || baseUrl === undefined || pool === undefined) {
    return {
      ok: false,
      code: "incomplete_key_configuration",
      message: `Missing required key configuration fields: ${missingFields.join(", ")}`
    };
  }

  const resolved: ResolvedUpsertKeyRequest = {
    provider,
    providerType,
    baseUrl,
    pool,
    model,
    id: input.id,
    value: input.value,
    weight: input.weight
  };

  if (input.rpmLimit !== undefined) resolved.rpmLimit = input.rpmLimit;
  if (input.dailyRequestLimit !== undefined) resolved.dailyRequestLimit = input.dailyRequestLimit;

  return { ok: true, value: resolved };
}

function getKeyId(request: FastifyRequest): string {
  const params = z.object({
    id: z.string().min(1)
  }).parse(request.params);

  return decodeURIComponent(params.id);
}

function toApiKeyRecord(input: ResolvedUpsertKeyRequest): ApiKeyRecord {
  const record: ApiKeyRecord = {
    id: input.id,
    provider: input.provider,
    pool: input.pool,
    value: input.value,
    weight: input.weight,
    status: "healthy",
    failureCount: 0
  };

  if (input.rpmLimit !== undefined) record.rpmLimit = input.rpmLimit;
  if (input.dailyRequestLimit !== undefined) record.dailyRequestLimit = input.dailyRequestLimit;

  return record;
}

function redactKey(key: ApiKeyRecord): Omit<ApiKeyRecord, "value"> & { valuePreview: string } {
  const { value, ...safeKey } = key;
  return {
    ...safeKey,
    valuePreview: previewSecret(key.value)
  };
}

function upsertRuntimeProviderConfig(app: FastifyInstance, input: ResolvedUpsertKeyRequest): void {
  const provider = app.config.providers[input.provider];

  if (provider) {
    return;
  }

  app.config.providers[input.provider] = {
    type: input.providerType,
    baseUrl: input.baseUrl,
    keys: []
  };
}

function upsertRuntimePoolConfig(app: FastifyInstance, input: ResolvedUpsertKeyRequest): void {
  const pool = app.config.pools[input.pool];

  if (!pool) {
    app.config.pools[input.pool] = {
      strategy: "round_robin",
      providers: [
        {
          provider: input.provider,
          models: [input.model]
        }
      ]
    };
    return;
  }

  const poolProvider = pool.providers.find((provider) => provider.provider === input.provider);

  if (!poolProvider) {
    pool.providers.push({
      provider: input.provider,
      models: [input.model]
    });
    return;
  }

  if (!poolProvider.models.includes(input.model)) {
    poolProvider.models.push(input.model);
  }
}

function previewSecret(value: string): string {
  if (value.length <= 8) {
    return "[REDACTED]";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function parseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return input;
  }
}

interface UsageSummary {
  total: number;
  success: number;
  error: number;
  lastUsedAt?: string;
}

interface KeyUsageEntryLike {
  keyId?: string;
  outcome: string;
  createdAt: Date;
}

function buildUsageSnapshot(entries: ReadonlyArray<KeyUsageEntryLike>): Record<string, UsageSummary> {
  const result: Record<string, UsageSummary> = {};
  for (const entry of entries) {
    if (!entry.keyId) continue;
    const existing = result[entry.keyId] ?? { total: 0, success: 0, error: 0 };
    existing.total += 1;
    if (entry.outcome === "success") existing.success += 1;
    else existing.error += 1;
    const iso = entry.createdAt.toISOString();
    if (!existing.lastUsedAt || iso > existing.lastUsedAt) {
      existing.lastUsedAt = iso;
    }
    result[entry.keyId] = existing;
  }
  return result;
}

function usageSnapshotFromEntries(entries: ReadonlyArray<KeyUsageEntryLike>): UsageSummary {
  const summary: UsageSummary = { total: entries.length, success: 0, error: 0 };
  for (const entry of entries) {
    if (entry.outcome === "success") summary.success += 1;
    else summary.error += 1;
  }
  if (entries.length > 0) {
    const first = entries[0];
    if (first) {
      summary.lastUsedAt = first.createdAt.toISOString();
    }
  }
  return summary;
}
