import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import type { KeyPoolConfig } from "../../src/config/schema.js";

const adminHeaders = {
  authorization: "Bearer keypool-admin-dev"
};

function config(): KeyPoolConfig {
  return {
    server: {
      host: "127.0.0.1",
      port: 0
    },
    providers: {},
    pools: {},
    tasks: {},
    retry: {
      maxAttempts: 3,
      retryOn: [429, 500, 502, 503, 504]
    }
  };
}

describe("admin routes", () => {
  it("serves the admin console and redirects the legacy dev panel", async () => {
    const app = await buildApp({ config: config() });

    const adminResponse = await app.inject({
      method: "GET",
      url: "/admin"
    });
    const devResponse = await app.inject({
      method: "GET",
      url: "/dev"
    });

    expect(adminResponse.statusCode).toBe(200);
    expect(adminResponse.headers["content-type"]).toContain("text/html");
    expect(adminResponse.body).toContain("KeyPool Admin Console");
    expect(devResponse.statusCode).toBe(302);
    expect(devResponse.headers.location).toBe("/admin");

    await app.close();
  });

  it("protects admin APIs with an admin token", async () => {
    const app = await buildApp({ config: config() });

    const response = await app.inject({
      method: "GET",
      url: "/admin/api/state"
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toMatchObject({
      error: {
        code: "admin_unauthorized"
      }
    });

    await app.close();
  });

  it("exposes provider presets including the official MiniMax preset", async () => {
    const app = await buildApp({ config: config() });

    const response = await app.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: adminHeaders
    });

    expect(response.statusCode).toBe(200);
    expect(response.json().presets).toEqual(expect.arrayContaining([
      expect.objectContaining({
        id: "minimax-official",
        provider: "minimax",
        providerType: "openai",
        baseUrl: "https://api.minimax.io/v1",
        pool: "text_generation",
        model: "MiniMax-M3",
        keyIdPrefix: "minimax"
      })
    ]));

    await app.close();
  });

  it("adds, disables, enables, and deletes runtime key configuration", async () => {
    const app = await buildApp({ config: config() });

    const addResponse = await app.inject({
      method: "POST",
      url: "/admin/api/keys",
      headers: adminHeaders,
      payload: {
        provider: "openai",
        providerType: "openai",
        baseUrl: "https://api.openai.test/v1",
        pool: "text_generation",
        model: "gpt-4.1-mini",
        id: "openai-prod-1",
        value: "sk-test-secret",
        weight: 2,
        rpmLimit: 10
      }
    });

    expect(addResponse.statusCode).toBe(201);

    const disabledResponse = await app.inject({
      method: "PATCH",
      url: "/admin/api/keys/openai-prod-1/status",
      headers: adminHeaders,
      payload: {
        status: "disabled"
      }
    });
    expect(disabledResponse.statusCode).toBe(200);

    let state = (await app.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: adminHeaders
    })).json();

    expect(state).toMatchObject({
      providers: ["openai"],
      pools: [
        {
          name: "text_generation",
          strategy: "round_robin",
          providers: [
            {
              provider: "openai",
              models: ["gpt-4.1-mini"]
            }
          ]
        }
      ],
      keys: [
        {
          id: "openai-prod-1",
          provider: "openai",
          pool: "text_generation",
          status: "disabled",
          weight: 2,
          rpmLimit: 10,
          valuePreview: "sk-t...cret"
        }
      ]
    });
    expect(JSON.stringify(state)).not.toContain("sk-test-secret");

    const enabledResponse = await app.inject({
      method: "PATCH",
      url: "/admin/api/keys/openai-prod-1/status",
      headers: adminHeaders,
      payload: {
        status: "healthy"
      }
    });
    expect(enabledResponse.statusCode).toBe(200);

    const deleteResponse = await app.inject({
      method: "DELETE",
      url: "/admin/api/keys/openai-prod-1",
      headers: adminHeaders
    });
    expect(deleteResponse.statusCode).toBe(200);

    state = (await app.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: adminHeaders
    })).json();
    expect(state.keys).toEqual([]);

    await app.close();
  });

  it("adds a MiniMax OpenAI-compatible runtime key from preset values", async () => {
    const app = await buildApp({ config: config() });

    const addResponse = await app.inject({
      method: "POST",
      url: "/admin/api/keys",
      headers: adminHeaders,
      payload: {
        provider: "minimax",
        providerType: "openai",
        baseUrl: "https://api.minimax.io/v1",
        pool: "text_generation",
        model: "MiniMax-M3",
        id: "minimax-prod-1",
        value: "sk-minimax-test-secret",
        weight: 1,
        rpmLimit: 30
      }
    });

    expect(addResponse.statusCode).toBe(201);

    const state = (await app.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: adminHeaders
    })).json();

    expect(state).toMatchObject({
      providers: ["minimax"],
      pools: [
        {
          name: "text_generation",
          providers: [
            {
              provider: "minimax",
              models: ["MiniMax-M3"]
            }
          ]
        }
      ],
      keys: [
        {
          id: "minimax-prod-1",
          provider: "minimax",
          pool: "text_generation",
          status: "healthy",
          rpmLimit: 30,
          valuePreview: "sk-m...cret"
        }
      ]
    });
    expect(JSON.stringify(state)).not.toContain("sk-minimax-test-secret");

    await app.close();
  });
});
