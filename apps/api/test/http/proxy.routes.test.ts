import { describe, expect, it, vi } from "vitest";
import { buildApp } from "../../src/app.js";
import type { KeyPoolConfig } from "../../src/config/schema.js";

function config(): KeyPoolConfig {
  return {
    server: {
      host: "127.0.0.1",
      port: 0
    },
    providers: {
      openai: {
        type: "openai",
        baseUrl: "https://api.openai.test/v1",
        keys: [
          {
            id: "openai-key-1",
            value: "secret-key",
            weight: 1
          }
        ]
      }
    },
    pools: {
      text_generation: {
        strategy: "round_robin",
        providers: [
          {
            provider: "openai",
            models: ["gpt-4.1-mini"]
          }
        ]
      }
    },
    tasks: {},
    retry: {
      maxAttempts: 3,
      retryOn: [429, 500, 502, 503, 504]
    }
  };
}

function configWithTwoKeys(): KeyPoolConfig {
  const value = config();
  const openaiProvider = value.providers.openai;

  if (!openaiProvider) {
    throw new Error("Test config is missing openai provider");
  }

  openaiProvider.keys.push({
    id: "openai-key-2",
    value: "backup-key",
    weight: 1
  });

  return value;
}

describe("POST /v1/chat/completions", () => {
  it("routes OpenAI-compatible chat requests through the selected provider key", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({
      id: "chatcmpl_test",
      object: "chat.completion",
      choices: []
    }), {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    }));
    vi.stubGlobal("fetch", fetchFn);
    const app = await buildApp({ config: config() });

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: "hello"
          }
        ]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: "chatcmpl_test",
      object: "chat.completion"
    });
    expect(fetchFn).toHaveBeenCalledWith("https://api.openai.test/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({
        authorization: "Bearer secret-key"
      })
    }));

    await app.close();
    vi.unstubAllGlobals();
  });

  it("returns a stable error when no pool supports the requested model", async () => {
    const app = await buildApp({ config: config() });

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "unknown-model",
        messages: [
          {
            role: "user",
            content: "hello"
          }
        ]
      }
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toMatchObject({
      error: {
        code: "request_error",
        message: "No configured provider pool supports model: unknown-model"
      }
    });

    await app.close();
  });

  it("retries retryable provider errors with another key", async () => {
    const fetchFn = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        error: {
          message: "Rate limit exceeded"
        }
      }), {
        status: 429,
        headers: {
          "content-type": "application/json"
        }
      }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: "chatcmpl_retry_success",
        choices: []
      }), {
        status: 200,
        headers: {
          "content-type": "application/json"
        }
      }));
    vi.stubGlobal("fetch", fetchFn);
    const app = await buildApp({ config: configWithTwoKeys() });

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: "hello"
          }
        ]
      }
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      id: "chatcmpl_retry_success"
    });
    expect(fetchFn).toHaveBeenCalledTimes(2);
    expect(fetchFn).toHaveBeenNthCalledWith(1, "https://api.openai.test/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({
        authorization: "Bearer secret-key"
      })
    }));
    expect(fetchFn).toHaveBeenNthCalledWith(2, "https://api.openai.test/v1/chat/completions", expect.objectContaining({
      headers: expect.objectContaining({
        authorization: "Bearer backup-key"
      })
    }));

    await app.close();
    vi.unstubAllGlobals();
  });

  it("returns the provider error when retryable attempts exhaust available keys", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({
      error: {
        message: "Rate limit exceeded"
      }
    }), {
      status: 429,
      headers: {
        "content-type": "application/json"
      }
    }));
    vi.stubGlobal("fetch", fetchFn);
    const app = await buildApp({ config: config() });

    const response = await app.inject({
      method: "POST",
      url: "/v1/chat/completions",
      payload: {
        model: "gpt-4.1-mini",
        messages: [
          {
            role: "user",
            content: "hello"
          }
        ]
      }
    });

    expect(response.statusCode).toBe(429);
    expect(response.json()).toMatchObject({
      error: {
        code: "rate_limited",
        message: "Rate limit exceeded",
        provider: "openai",
        retryable: true
      }
    });
    expect(fetchFn).toHaveBeenCalledTimes(1);

    await app.close();
    vi.unstubAllGlobals();
  });
});
