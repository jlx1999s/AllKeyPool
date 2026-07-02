import { describe, expect, it, vi } from "vitest";
import { OpenAIAdapter } from "../../src/providers/openai/openai.adapter.js";

describe("OpenAIAdapter", () => {
  it("sends chat completion requests with the selected key", async () => {
    const fetchFn = vi.fn(async () => new Response(JSON.stringify({
      id: "chatcmpl_test",
      choices: []
    }), {
      status: 200,
      headers: {
        "content-type": "application/json"
      }
    }));
    const adapter = new OpenAIAdapter({
      name: "openai",
      baseUrl: "https://api.openai.com/v1/",
      fetchFn
    });

    const response = await adapter.send({
      body: {
        model: "gpt-4.1-mini",
        messages: [{ role: "user", content: "hello" }]
      }
    }, {
      requestId: "req-1",
      key: {
        id: "key-1",
        provider: "openai",
        pool: "text_generation",
        value: "secret-key",
        weight: 1,
        status: "healthy",
        failureCount: 0
      }
    });

    expect(fetchFn).toHaveBeenCalledWith("https://api.openai.com/v1/chat/completions", expect.objectContaining({
      method: "POST",
      headers: expect.objectContaining({
        authorization: "Bearer secret-key",
        "content-type": "application/json",
        "x-request-id": "req-1"
      })
    }));
    expect(response).toMatchObject({
      statusCode: 200,
      body: {
        id: "chatcmpl_test",
        choices: []
      }
    });
  });

  it("normalizes rate limit errors", async () => {
    const adapter = new OpenAIAdapter({
      name: "openai",
      baseUrl: "https://api.openai.com/v1",
      fetchFn: vi.fn(async () => new Response(JSON.stringify({
        error: {
          message: "Rate limit exceeded"
        }
      }), {
        status: 429,
        headers: {
          "content-type": "application/json"
        }
      }))
    });

    let caught: unknown;

    try {
      await adapter.send({
        body: {
          model: "gpt-4.1-mini",
          messages: []
        }
      }, {
        requestId: "req-1",
        key: {
          id: "key-1",
          provider: "openai",
          pool: "text_generation",
          value: "secret-key",
          weight: 1,
          status: "healthy",
          failureCount: 0
        }
      });
    } catch (error) {
      caught = error;
    }

    expect(adapter.normalizeError(caught)).toEqual({
      provider: "openai",
      statusCode: 429,
      code: "rate_limited",
      message: "Rate limit exceeded",
      retryable: true,
      rateLimited: true,
      authenticationFailed: false
    });
  });
});

