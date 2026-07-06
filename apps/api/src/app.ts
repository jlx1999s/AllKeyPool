import Fastify, { type FastifyInstance } from "fastify";
import type { KeyPoolConfig } from "./config/schema.js";
import { KeyHealthService } from "./core/health/key-health.service.js";
import { ProviderRequestExecutor } from "./core/provider-executor/provider-request-executor.js";
import { InMemoryQuotaManager, type QuotaManager } from "./core/quota/quota-manager.js";
import { RetryPolicy } from "./core/retry/retry-policy.js";
import { SchedulerService } from "./core/scheduler/scheduler.js";
import { createDefaultSchedulingStrategies } from "./core/scheduler/strategy-registry.js";
import { InMemoryHealthEventRecorder, type HealthEventRecorder } from "./observability/health-event-recorder.js";
import { InMemoryUsageRecorder, type UsageRecorder } from "./observability/usage-recorder.js";
import { registerErrorHandler } from "./http/middleware/error-handler.js";
import { registerRequestId } from "./http/middleware/request-id.js";
import { registerHealthRoutes } from "./http/routes/health.routes.js";
import { registerAdminRoutes } from "./http/routes/admin.routes.js";
import { registerDemoRoutes } from "./http/routes/demo.routes.js";
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
  const healthEventRecorder = new InMemoryHealthEventRecorder();
  const usageRecorder = new InMemoryUsageRecorder();
  const keyHealthService = new KeyHealthService({
    apiKeyRepository,
    coolingDownFailureThreshold: 3
  });
  const scheduler = new SchedulerService(apiKeyRepository, createDefaultSchedulingStrategies(), quotaManager);
  const retryPolicy = new RetryPolicy({
    maxAttempts: options.config.retry.maxAttempts
  });
  const providerRequestExecutor = new ProviderRequestExecutor({
    scheduler,
    retryPolicy,
    async onAttemptFailure(event) {
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
      // Note: usage recording for the final failure happens in the proxy
      // route's catch block (single entry per logical request). The
      // onAttemptFailure hook stays focused on observability + health.
      await healthEventRecorder.record({
        type: "provider_attempt_failed",
        level: event.providerError.authenticationFailed ? "error" : "warn",
        provider: event.providerError.provider,
        keyId: event.keyId,
        requestId: event.requestId,
        ...(event.providerError.statusCode === undefined ? {} : { statusCode: event.providerError.statusCode }),
        code: event.providerError.code,
        message: event.providerError.message,
        metadata: {
          attempt: event.attempt,
          retryable: event.providerError.retryable,
          rateLimited: event.providerError.rateLimited
        }
      });
      const failureResult = await keyHealthService.recordFailure(event.keyId);

      if (failureResult.statusChanged && failureResult.key) {
        const eventType = failureResult.key.status === "cooling_down"
          ? "key_cooling_down"
          : "key_degraded";
        await healthEventRecorder.record({
          type: eventType,
          level: failureResult.key.status === "cooling_down" ? "error" : "warn",
          requestId: event.requestId,
          provider: failureResult.key.provider,
          keyId: event.keyId,
          code: failureResult.key.status,
          message: `Key marked ${failureResult.key.status} after ${failureResult.key.failureCount} consecutive failure(s)`,
          metadata: {
            previousStatus: failureResult.previousStatus,
            failureCount: failureResult.key.failureCount
          }
        });
      }
    },
    async onAttemptSuccess(event) {
      app.log.debug({
        keyId: event.keyId,
        attempt: event.attempt,
        latencyMs: event.latencyMs
      }, "Provider request succeeded");

      await usageRecorder.record({
        requestId: event.requestId,
        route: "chat.completions",
        pool: event.pool,
        ...(event.model === undefined ? {} : { model: event.model }),
        ...(event.provider === undefined ? {} : { provider: event.provider }),
        keyId: event.keyId,
        statusCode: event.statusCode,
        outcome: "success",
        latencyMs: event.latencyMs
      });
      const recoveryResult = await keyHealthService.recordSuccess(event.keyId);

      if (recoveryResult.statusChanged && recoveryResult.key) {
        await healthEventRecorder.record({
          type: "key_recovered",
          level: "info",
          requestId: event.requestId,
          provider: recoveryResult.key.provider,
          keyId: event.keyId,
          code: recoveryResult.key.status,
          message: "Key recovered after successful provider request",
          metadata: {
            previousStatus: recoveryResult.previousStatus,
            failureCount: recoveryResult.key.failureCount
          }
        });
      }

      await healthEventRecorder.record({
        type: "provider_attempt_succeeded",
        level: "info",
        requestId: event.requestId,
        ...(event.provider === undefined ? {} : { provider: event.provider }),
        keyId: event.keyId,
        statusCode: event.statusCode,
        message: "Provider request succeeded",
        metadata: {
          attempt: event.attempt,
          latencyMs: event.latencyMs
        }
      });
    },
    async onKeyExhausted(event) {
      app.log.warn({
        err: event.error,
        attemptedKeyIds: event.attemptedKeyIds
      }, "No additional eligible API keys");
      await healthEventRecorder.record({
        type: "key_exhausted",
        level: "warn",
        message: "No additional eligible API keys",
        metadata: {
          attemptedKeyIds: event.attemptedKeyIds
        }
      });
    }
  });
  const providerRegistry = new ProviderRegistry();
  registerConfiguredProviders(providerRegistry, options.config, { fakeProvider });
  const adminAuth = createAdminAuth();

  app.decorate("config", options.config);
  app.decorate("apiKeyRepository", apiKeyRepository);
  app.decorate("quotaManager", quotaManager);
  app.decorate("healthEventRecorder", healthEventRecorder);
  app.decorate("usageRecorder", usageRecorder);
  app.decorate("keyHealthService", keyHealthService);
  app.decorate("scheduler", scheduler);
  app.decorate("retryPolicy", retryPolicy);
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
    healthEventRecorder: HealthEventRecorder;
    usageRecorder: UsageRecorder;
    keyHealthService: KeyHealthService;
    scheduler: SchedulerService;
    retryPolicy: RetryPolicy;
    providerRequestExecutor: ProviderRequestExecutor;
    providerRegistry: ProviderRegistry;
    adminAuth: AdminAuth;
    fakeProvider: boolean;
  }
}
