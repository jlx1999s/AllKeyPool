import type { FastifyInstance } from "fastify";

export function registerErrorHandler(app: FastifyInstance): void {
  app.setErrorHandler((error, request, reply) => {
    const normalizedError = normalizeError(error);
    const statusCode = normalizedError.statusCode && normalizedError.statusCode >= 400
      ? normalizedError.statusCode
      : 500;
    const logPayload = { err: error };

    if (statusCode >= 500) {
      request.log.error(logPayload, "Request failed");
    } else {
      request.log.warn(logPayload, "Request failed");
    }

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
