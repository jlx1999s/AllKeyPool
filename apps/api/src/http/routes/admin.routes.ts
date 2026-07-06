import type { ApiKeyRecord } from "@keypool/shared";
import type { FastifyInstance, FastifyRequest } from "fastify";
import { z } from "zod";
import { OpenAIAdapter } from "../../providers/openai/openai.adapter.js";
import { providerPresets } from "../../providers/provider-presets.js";
import { renderAdminPanelHtml } from "../views/admin-panel.view.js";

const upsertKeySchema = z.object({
  provider: z.string().min(1),
  providerType: z.literal("openai").default("openai"),
  baseUrl: z.string().url(),
  pool: z.string().min(1),
  model: z.string().min(1).default("gpt-4.1-mini"),
  id: z.string().min(1),
  value: z.string().min(1),
  weight: z.coerce.number().int().positive().default(1),
  rpmLimit: z.coerce.number().int().positive().optional(),
  dailyRequestLimit: z.coerce.number().int().positive().optional()
});

const keyStatusSchema = z.object({
  status: z.enum(["healthy", "degraded", "cooling_down", "disabled"])
});

const chatTestSchema = z.object({
  model: z.string().min(1),
  content: z.string().min(1)
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

  app.get("/admin/api/state", async () => {
    const keys = await app.apiKeyRepository.list();
    const usageSnapshot = app.usageRecorder.snapshot();

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
      }))
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

    const parsedLimit = parseLimitQuery(request);
    return {
      keyId,
      summary: app.usageRecorder.summary(keyId),
      entries: app.usageRecorder.recent(keyId, parsedLimit)
    };
  });

  app.post("/admin/api/keys", async (request, reply) => {
    const body = upsertKeySchema.parse(request.body);

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

function getKeyId(request: FastifyRequest): string {
  const params = z.object({
    id: z.string().min(1)
  }).parse(request.params);

  return decodeURIComponent(params.id);
}

function parseLimitQuery(request: FastifyRequest, fallback = 64, max = 256): number {
  const query = request.query as { limit?: unknown } | undefined;
  const raw = query?.limit;

  if (raw === undefined || raw === null || raw === "") {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isFinite(parsed) || parsed < 1) {
    return fallback;
  }

  return Math.min(max, Math.floor(parsed));
}

function toApiKeyRecord(input: z.infer<typeof upsertKeySchema>): ApiKeyRecord {
  const record: ApiKeyRecord = {
    id: input.id,
    provider: input.provider,
    pool: input.pool,
    value: input.value,
    weight: input.weight,
    status: "healthy",
    failureCount: 0
  };

  if (input.rpmLimit !== undefined) {
    record.rpmLimit = input.rpmLimit;
  }

  if (input.dailyRequestLimit !== undefined) {
    record.dailyRequestLimit = input.dailyRequestLimit;
  }

  return record;
}

function redactKey(key: ApiKeyRecord): Omit<ApiKeyRecord, "value"> & { valuePreview: string } {
  const { value, ...safeKey } = key;

  return {
    ...safeKey,
    valuePreview: previewSecret(key.value)
  };
}

function upsertRuntimeProviderConfig(app: FastifyInstance, input: z.infer<typeof upsertKeySchema>): void {
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

function upsertRuntimePoolConfig(app: FastifyInstance, input: z.infer<typeof upsertKeySchema>): void {
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
