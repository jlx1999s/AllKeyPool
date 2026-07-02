import Fastify, { type FastifyInstance } from "fastify";
import type { KeyPoolConfig } from "./config/schema.js";
import { registerErrorHandler } from "./http/middleware/error-handler.js";
import { registerRequestId } from "./http/middleware/request-id.js";
import { registerHealthRoutes } from "./http/routes/health.routes.js";
import { redactSecrets } from "./security/secret-redaction.js";

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

  app.decorate("config", options.config);

  registerRequestId(app);
  registerErrorHandler(app);
  await registerHealthRoutes(app);

  return app;
}

declare module "fastify" {
  interface FastifyInstance {
    config: KeyPoolConfig;
  }
}
