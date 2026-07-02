import type {
  ApiKeyRecord,
  ProviderAdapter,
  ProviderError,
  ProviderHealthResult,
  ProviderRequest,
  ProviderRequestContext,
  ProviderResponse
} from "@keypool/shared";

export type FetchLike = (input: string | URL, init?: RequestInit) => Promise<Response>;

export interface OpenAIAdapterOptions {
  name: string;
  baseUrl: string;
  fetchFn?: FetchLike;
}

export class OpenAIProviderHttpError extends Error {
  constructor(
    readonly statusCode: number,
    readonly body: unknown
  ) {
    super(`OpenAI provider returned HTTP ${statusCode}`);
  }
}

export class OpenAIAdapter implements ProviderAdapter {
  readonly name: string;

  private readonly baseUrl: string;
  private readonly fetchFn: FetchLike;

  constructor(options: OpenAIAdapterOptions) {
    this.name = options.name;
    this.baseUrl = options.baseUrl.replace(/\/+$/, "");
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async send(request: ProviderRequest, context: ProviderRequestContext): Promise<ProviderResponse> {
    const response = await this.fetchFn(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${context.key.value}`,
        "content-type": "application/json",
        "x-request-id": context.requestId,
        ...request.headers
      },
      body: JSON.stringify(request.body)
    });
    const body = await readResponseBody(response);

    if (!response.ok) {
      throw new OpenAIProviderHttpError(response.status, body);
    }

    return {
      statusCode: response.status,
      headers: Object.fromEntries(response.headers.entries()),
      body
    };
  }

  async checkHealth(_key: ApiKeyRecord): Promise<ProviderHealthResult> {
    return {
      status: "healthy"
    };
  }

  normalizeError(error: unknown): ProviderError {
    if (error instanceof OpenAIProviderHttpError) {
      return {
        provider: this.name,
        statusCode: error.statusCode,
        code: getProviderErrorCode(error.statusCode),
        message: extractProviderMessage(error.body) ?? error.message,
        retryable: isRetryableStatus(error.statusCode),
        rateLimited: error.statusCode === 429,
        authenticationFailed: error.statusCode === 401 || error.statusCode === 403
      };
    }

    return {
      provider: this.name,
      code: "network_error",
      message: error instanceof Error ? error.message : "Unknown OpenAI provider error",
      retryable: true,
      rateLimited: false,
      authenticationFailed: false
    };
  }
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json() as Promise<unknown>;
  }

  return response.text();
}

function getProviderErrorCode(statusCode: number): string {
  if (statusCode === 429) {
    return "rate_limited";
  }

  if (statusCode === 401 || statusCode === 403) {
    return "authentication_failed";
  }

  if (statusCode >= 500) {
    return "provider_server_error";
  }

  return "provider_request_error";
}

function isRetryableStatus(statusCode: number): boolean {
  return statusCode === 429 || statusCode === 500 || statusCode === 502 || statusCode === 503 || statusCode === 504;
}

function extractProviderMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object") {
    return undefined;
  }

  const error = "error" in body ? body.error : undefined;

  if (!error || typeof error !== "object") {
    return undefined;
  }

  const message = "message" in error ? error.message : undefined;

  return typeof message === "string" ? message : undefined;
}
