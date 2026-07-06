import type { ApiKeyRecord } from "@keypool/shared";
import type { FastifyInstance } from "fastify";
import { OpenAIAdapter } from "../providers/openai/openai.adapter.js";

export interface RuntimeKeyConfig {
  providerType: "openai";
  baseUrl: string;
  model: string;
}

export function runtimeConfigFromKey(key: ApiKeyRecord): RuntimeKeyConfig | undefined {
  const value = key.metadata?.runtimeConfig;
  if (!isRuntimeKeyConfig(value)) {
    return undefined;
  }

  return value;
}

export async function restoreRuntimeConfigFromKeys(app: FastifyInstance): Promise<void> {
  const keys = await app.apiKeyRepository.list();

  for (const key of keys) {
    const runtimeConfig = runtimeConfigFromKey(key);
    if (!runtimeConfig) {
      continue;
    }

    upsertRuntimeProviderConfig(app, {
      provider: key.provider,
      providerType: runtimeConfig.providerType,
      baseUrl: runtimeConfig.baseUrl
    });
    upsertRuntimePoolConfig(app, {
      pool: key.pool,
      provider: key.provider,
      model: runtimeConfig.model
    });

    if (!app.providerRegistry.has(key.provider)) {
      app.providerRegistry.register(new OpenAIAdapter({
        name: key.provider,
        baseUrl: runtimeConfig.baseUrl
      }));
    }
  }
}

export function upsertRuntimeProviderConfig(
  app: FastifyInstance,
  input: { provider: string; providerType: "openai"; baseUrl: string }
): void {
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

export function upsertRuntimePoolConfig(
  app: FastifyInstance,
  input: { pool: string; provider: string; model: string }
): void {
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

function isRuntimeKeyConfig(value: unknown): value is RuntimeKeyConfig {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  return candidate.providerType === "openai"
    && typeof candidate.baseUrl === "string"
    && typeof candidate.model === "string";
}
