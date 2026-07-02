import Fastify, { type FastifyInstance } from "fastify";
import type { KeyPoolConfig } from "./config/schema.js";
import { ProviderRequestExecutor } from "./core/provider-executor/provider-request-executor.js";
import { InMemoryQuotaManager, type QuotaManager } from "./core/quota/quota-manager.js";
import { RetryPolicy } from "./core/retry/retry-policy.js";
import { SchedulerService } from "./core/scheduler/scheduler.js";
import { createDefaultSchedulingStrategies } from "./core/scheduler/strategy-registry.js";
import { registerErrorHandler } from "./http/middleware/error-handler.js";
import { registerRequestId } from "./http/middleware/request-id.js";
import { registerHealthRoutes } from "./http/routes/health.routes.js";
import { registerAdminRoutes } from "./http/routes/admin.routes.js";
import { registerProxyRoutes } from "./http/routes/proxy.routes.js";
import { ProviderRegistry } from "./providers/provider-registry.js";
import { registerConfiguredProviders } from "./providers/register-configured-providers.js";
import { createAdminAuth, type AdminAuth } from "./security/admin-auth.js";
import { redactSecrets } from "./security/secret-redaction.js";
import type { ApiKeyRepository } from "./storage/repositories/api-key.repository.js";
import { createInMemoryApiKeyRepository } from "./storage/repositories/in-memory-api-key.repository.js";

export interface BuildAppOptions {
  config: KeyPoolConfig;
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: {
      level: process.env.LOG_LEVEL ?? "info",
      redact: ["req.headers.authorization", "req.headers.cookie"],
      serializers: {
        req(request) {
          return {
            id: request.id,
            method: request.method,
            url: request.url,
            headers: redactSecrets(request.headers)
          };
        }
      }
    }
  });

  const apiKeyRepository = createInMemoryApiKeyRepository(options.config);
  const quotaManager = new InMemoryQuotaManager();
  const scheduler = new SchedulerService(apiKeyRepository, createDefaultSchedulingStrategies(), quotaManager);
  const retryPolicy = new RetryPolicy({
    maxAttempts: options.config.retry.maxAttempts
  });
  const providerRequestExecutor = new ProviderRequestExecutor({
    scheduler,
    retryPolicy,
    onAttemptFailure(event) {
      app.log.warn({
        provider: event.providerError.provider,
        code: event.providerError.code,
        statusCode: event.providerError.statusCode,
        retryable: event.providerError.retryable,
        rateLimited: event.providerError.rateLimited,
        keyId: event.keyId,
        attempt: event.attempt
      }, "Provider request failed");
    },
    onKeyExhausted(event) {
      app.log.warn({
        err: event.error,
        attemptedKeyIds: event.attemptedKeyIds
      }, "No additional eligible API keys");
    }
  });
  const providerRegistry = new ProviderRegistry();
  registerConfiguredProviders(providerRegistry, options.config);
  const adminAuth = createAdminAuth();

  app.decorate("config", options.config);
  app.decorate("apiKeyRepository", apiKeyRepository);
  app.decorate("quotaManager", quotaManager);
  app.decorate("scheduler", scheduler);
  app.decorate("retryPolicy", retryPolicy);
  app.decorate("providerRequestExecutor", providerRequestExecutor);
  app.decorate("providerRegistry", providerRegistry);
  app.decorate("adminAuth", adminAuth);

  registerRequestId(app);
  registerErrorHandler(app);
  await registerAdminRoutes(app);
  await registerHealthRoutes(app);
  await registerProxyRoutes(app);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    config: KeyPoolConfig;
    apiKeyRepository: ApiKeyRepository;
    quotaManager: QuotaManager;
    scheduler: SchedulerService;
    retryPolicy: RetryPolicy;
    providerRequestExecutor: ProviderRequestExecutor;
    providerRegistry: ProviderRegistry;
    adminAuth: AdminAuth;
  }
}
