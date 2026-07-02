import { randomUUID } from "node:crypto";
import type { FastifyInstance } from "fastify";

export function registerRequestId(app: FastifyInstance): void {
  app.addHook("onRequest", async (request, reply) => {
    const requestId = request.headers["x-request-id"];
    const id = Array.isArray(requestId) ? requestId[0] : requestId;

    request.id = id ?? randomUUID();
    reply.header("x-request-id", request.id);
  });
}

