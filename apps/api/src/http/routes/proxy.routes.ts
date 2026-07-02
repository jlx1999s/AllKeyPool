import type { ProviderError } from "@keypool/shared";
import type { FastifyInstance, FastifyReply } from "fastify";
import { z } from "zod";
import { ProviderRequestFailedError } from "../../core/provider-executor/provider-request-executor.js";

const chatCompletionRequestSchema = z.object({
  model: z.string().min(1),
  messages: z.array(z.unknown()).min(1)
}).passthrough();

export async function registerProxyRoutes(app: FastifyInstance): Promise<void> {
  app.post("/v1/chat/completions", async (request, reply) => {
    const body = chatCompletionRequestSchema.parse(request.body);
    const route = resolveChatCompletionRoute(app, body.model);
    const adapter = app.providerRegistry.get(route.providerName);

    try {
      const providerResponse = await app.providerRequestExecutor.execute({
        adapter,
        request: {
          model: body.model,
          body
        },
        schedulingContext: {
          requestId: request.id,
          pool: route.poolName,
          provider: route.providerName,
          model: body.model
        },
        strategy: route.strategy
      });

      for (const [header, value] of Object.entries(providerResponse.headers)) {
        if (shouldForwardHeader(header)) {
          reply.header(header, value);
        }
      }

      return reply.status(providerResponse.statusCode).send(providerResponse.body);
    } catch (error) {
      if (!(error instanceof ProviderRequestFailedError)) {
        throw error;
      }

      return sendProviderError(reply, error.providerError, request.id);
    }
  });
}

function sendProviderError(
  reply: FastifyReply,
  providerError: ProviderError,
  requestId: string
) {
  const statusCode = providerError.authenticationFailed ? 502 : providerError.statusCode ?? 502;

  return reply.status(statusCode).send({
    error: {
      code: providerError.code,
      message: providerError.message,
      provider: providerError.provider,
      retryable: providerError.retryable,
      requestId
    }
  });
}

interface ChatCompletionRoute {
  poolName: string;
  providerName: string;
  strategy: "round_robin" | "weighted_round_robin";
}

function resolveChatCompletionRoute(app: FastifyInstance, model: string): ChatCompletionRoute {
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

  throw createHttpError(503, `No configured provider pool supports model: ${model}`);
}

function shouldForwardHeader(header: string): boolean {
  const normalized = header.toLowerCase();

  return normalized !== "content-length" && normalized !== "transfer-encoding";
}

function createHttpError(statusCode: number, message: string): Error & { statusCode: number } {
  const error = new Error(message) as Error & { statusCode: number };
  error.statusCode = statusCode;
  return error;
}
