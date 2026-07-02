import type { FastifyInstance } from "fastify";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    request.log.error({ err: error }, "Request failed");

    const normalizedError = normalizeError(error);
    const statusCode = normalizedError.statusCode && normalizedError.statusCode >= 400
      ? normalizedError.statusCode
      : 500;

    void reply.status(statusCode).send({
      error: {
        code: statusCode === 500 ? "internal_server_error" : "request_error",
        message: statusCode === 500 ? "Internal server error" : normalizedError.message,
        requestId: request.id
      }
    });
  });
}

function normalizeError(error: unknown): { message: string; statusCode?: number } {
  if (error instanceof Error) {
    const statusCode = "statusCode" in error && typeof error.statusCode === "number"
      ? error.statusCode
      : undefined;

    return statusCode === undefined
      ? { message: error.message }
      : { message: error.message, statusCode };
  }

  return {
    message: "Unknown error"
  };
}
