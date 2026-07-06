import Fastify, { type FastifyInstance } from "fastify";
import type { KeyPoolConfig } from "./config/schema.js";
import { ProviderRequestExecutor } from "./core/provider-executor/provider-request-executor.js";
import { InMemoryQuotaManager, type QuotaManager } from "./core/quota/quota-manager.js";
import { RetryPolicy } from "./core/retry/retry-policy.js";
import { SchedulerService } from "./core/scheduler/scheduler.js";
import { createDefaultSchedulingStrategies } from "./core/scheduler/strategy-registry.js";
import { InMemoryUsageRecorder, type UsageRecorder } from "./core/usage/usage-recorder.js";
import { registerErrorHandler } from "./http/middleware/error-handler.js";
import { registerRequestId } from "./http/middleware/request-id.js";
import { registerHealthRoutes } from "./http/routes/health.routes.js";
import { registerAdminRoutes } from "./http/routes/admin.routes.js";
import { registerProxyRoutes } from "./http/routes/proxy.routes.js";
import { registerDemoRoutes } from "./http/routes/demo.routes.js";
import { ProviderRegistry } from "./providers/provider-registry.js";
import { registerConfiguredProviders } from "./providers/register-configured-providers.js";
import { createAdminAuth, type AdminAuth } from "./security/admin-auth.js";
import { redactSecrets } from "./security/secret-redaction.js";
import type { ApiKeyRepository } from "./storage/repositories/api-key.repository.js";
import { createInMemoryApiKeyRepository } from "./storage/repositories/in-memory-api-key.repository.js";

export interface BuildAppOptions {
  config: KeyPoolConfig;
}

function isFakeProviderEnabled(): boolean {
  return process.env.KEYPOOL_FAKE_PROVIDER === "1"
    || process.env.KEYPOOL_FAKE_PROVIDER === "true";
}

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const fakeProvider = isFakeProviderEnabled();
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
  const usageRecorder = new InMemoryUsageRecorder();
  const providerRequestExecutor = new ProviderRequestExecutor({
    scheduler,
    retryPolicy,
    onAttemptFailure(event) {
      const failureEntry: import("./core/usage/usage-recorder.js").KeyUsageEntry = {
        requestId: "internal",
        keyId: event.keyId,
        provider: event.providerError.provider,
        pool: "unknown",
        strategy: "unknown",
        outcome: "error",
        errorCode: event.providerError.code,
        latencyMs: event.latencyMs,
        at: new Date().toISOString()
      };
      if (event.providerError.statusCode !== undefined) {
        failureEntry.statusCode = event.providerError.statusCode;
      }
      usageRecorder.record(failureEntry);

      app.log.warn({
        provider: event.providerError.provider,
        code: event.providerError.code,
        statusCode: event.providerError.statusCode,
        retryable: event.providerError.retryable,
        rateLimited: event.providerError.rateLimited,
        keyId: event.keyId,
        attempt: event.attempt,
        latencyMs: event.latencyMs
      }, "Provider request failed");
    },
    onAttemptSuccess(event) {
      // Note: we don't have access to the pool/strategy/model here without
      // changing the executor signature, so we leave those as 'unknown' for
      // now. The keyId and latency are the bits the admin UI needs most.
      const successEntry: import("./core/usage/usage-recorder.js").KeyUsageEntry = {
        requestId: "internal",
        keyId: event.keyId,
        provider: "unknown",
        pool: "unknown",
        strategy: "unknown",
        outcome: "success",
        latencyMs: event.latencyMs,
        at: new Date().toISOString()
      };
      usageRecorder.record(successEntry);

      app.log.debug({
        keyId: event.keyId,
        attempt: event.attempt,
        latencyMs: event.latencyMs
      }, "Provider request succeeded");
    },
    onKeyExhausted(event) {
      app.log.warn({
        err: event.error,
        attemptedKeyIds: event.attemptedKeyIds
      }, "No additional eligible API keys");
    }
  });
  const providerRegistry = new ProviderRegistry();
  registerConfiguredProviders(providerRegistry, options.config, { fakeProvider });
  const adminAuth = createAdminAuth();

  app.decorate("config", options.config);
  app.decorate("apiKeyRepository", apiKeyRepository);
  app.decorate("quotaManager", quotaManager);
  app.decorate("scheduler", scheduler);
  app.decorate("retryPolicy", retryPolicy);
  app.decorate("usageRecorder", usageRecorder);
  app.decorate("providerRequestExecutor", providerRequestExecutor);
  app.decorate("providerRegistry", providerRegistry);
  app.decorate("adminAuth", adminAuth);
  app.decorate("fakeProvider", fakeProvider);

  registerRequestId(app);
  registerErrorHandler(app);
  await registerAdminRoutes(app);
  await registerDemoRoutes(app);
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
    usageRecorder: UsageRecorder;
    providerRequestExecutor: ProviderRequestExecutor;
    providerRegistry: ProviderRegistry;
    adminAuth: AdminAuth;
    fakeProvider: boolean;
  }
}
