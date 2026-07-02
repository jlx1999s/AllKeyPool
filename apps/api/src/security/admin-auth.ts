import { timingSafeEqual } from "node:crypto";
import type { FastifyRequest } from "fastify";

const DEV_ADMIN_TOKEN = "keypool-admin-dev";

export interface AdminAuth {
  readonly enabled: boolean;
  readonly usingDevToken: boolean;
  verifyRequest(request: FastifyRequest): boolean;
}

export function createAdminAuth(): AdminAuth {
  const token = process.env.KEYPOOL_ADMIN_TOKEN ?? DEV_ADMIN_TOKEN;
  const usingDevToken = !process.env.KEYPOOL_ADMIN_TOKEN;

  return {
    enabled: true,
    usingDevToken,
    verifyRequest(request) {
      const providedToken = readAdminToken(request);

      if (!providedToken) {
        return false;
      }

      return safeEqual(providedToken, token);
    }
  };
}

function readAdminToken(request: FastifyRequest): string | undefined {
  const auth = request.headers.authorization;
  const authorization = Array.isArray(auth) ? auth[0] : auth;

  if (authorization?.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  const header = request.headers["x-admin-token"];
  const token = Array.isArray(header) ? header[0] : header;

  return token?.trim();
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

