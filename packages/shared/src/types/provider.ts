import type { ApiKeyRecord } from "./api-key.js";

export interface ProviderRequest {
  model?: string;
  body: unknown;
  headers?: Record<string, string>;
}

export interface ProviderRequestContext {
  requestId: string;
  key: ApiKeyRecord;
}

export interface ProviderResponse {
  statusCode: number;
  headers: Record<string, string>;
  body: unknown;
}

export interface ProviderHealthResult {
  status: "healthy" | "unhealthy";
  message?: string;
}

export interface ProviderError {
  provider: string;
  statusCode?: number;
  code: string;
  message: string;
  retryable: boolean;
  rateLimited: boolean;
  authenticationFailed: boolean;
}

export interface ProviderAdapter {
  readonly name: string;
  send(request: ProviderRequest, context: ProviderRequestContext): Promise<ProviderResponse>;
  checkHealth(key: ApiKeyRecord): Promise<ProviderHealthResult>;
  normalizeError(error: unknown): ProviderError;
}

