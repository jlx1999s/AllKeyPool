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
    expect(adminResponse.body).toContain("KeyPool Console");
    expect(adminResponse.body).toContain("usage-events-body");
    expect(adminResponse.body).toContain("health-events-body");
    expect(adminResponse.body).toContain("usage-event-provider-filter");
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

    const stateResponse = await app.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: adminHeaders
    });
    const presetsResponse = await app.inject({
      method: "GET",
      url: "/admin/api/provider-presets",
      headers: adminHeaders
    });

    expect(stateResponse.statusCode).toBe(200);
    expect(presetsResponse.statusCode).toBe(200);
    const expectedPresets = expect.arrayContaining([
      expect.objectContaining({
        id: "minimax-official",
        provider: "minimax",
        providerType: "openai",
        baseUrl: "https://api.minimax.io/v1",
        pool: "text_generation",
        model: "MiniMax-M3",
        keyIdPrefix: "minimax"
      })
    ]);
    expect(stateResponse.json().presets).toEqual(expectedPresets);
    expect(presetsResponse.json().presets).toEqual(expectedPresets);

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
    const healthEventsResponse = await app.inject({
      method: "GET",
      url: "/admin/api/health-events",
      headers: adminHeaders
    });
    expect(healthEventsResponse.statusCode).toBe(200);
    expect(healthEventsResponse.json().events).toEqual([
      expect.objectContaining({
        type: "key_status_changed",
        level: "warn",
        keyId: "openai-prod-1",
        code: "disabled",
        message: "Key status changed to disabled"
      })
    ]);

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
      ],
      healthEvents: [
        {
          type: "key_status_changed",
          keyId: "openai-prod-1"
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

    const auditResponse = await app.inject({
      method: "GET",
      url: "/admin/api/audit-logs?limit=10",
      headers: adminHeaders
    });
    expect(auditResponse.statusCode).toBe(200);
    expect(auditResponse.json().auditLogs).toEqual([
      expect.objectContaining({
        action: "key_deleted",
        targetType: "api_key",
        targetId: "openai-prod-1",
        outcome: "success",
        metadata: expect.objectContaining({
          provider: "openai",
          pool: "text_generation",
          status: "healthy"
        })
      }),
      expect.objectContaining({
        action: "key_status_changed",
        targetId: "openai-prod-1",
        outcome: "success",
        metadata: expect.objectContaining({
          previousStatus: "disabled",
          status: "healthy"
        })
      }),
      expect.objectContaining({
        action: "key_status_changed",
        targetId: "openai-prod-1",
        outcome: "success",
        metadata: expect.objectContaining({
          previousStatus: "healthy",
          status: "disabled"
        })
      }),
      expect.objectContaining({
        action: "key_created",
        targetId: "openai-prod-1",
        outcome: "success",
        metadata: expect.objectContaining({
          provider: "openai",
          pool: "text_generation",
          model: "gpt-4.1-mini"
        })
      })
    ]);
    expect(JSON.stringify(auditResponse.json())).not.toContain("sk-test-secret");

    const filteredAuditResponse = await app.inject({
      method: "GET",
      url: "/admin/api/audit-logs?action=key_status_changed&outcome=success&targetId=openai-prod-1&limit=5",
      headers: adminHeaders
    });
    expect(filteredAuditResponse.statusCode).toBe(200);
    expect(filteredAuditResponse.json().auditLogs).toEqual([
      expect.objectContaining({
        action: "key_status_changed",
        targetId: "openai-prod-1",
        outcome: "success",
        metadata: expect.objectContaining({
          previousStatus: "disabled",
          status: "healthy"
        })
      }),
      expect.objectContaining({
        action: "key_status_changed",
        targetId: "openai-prod-1",
        outcome: "success",
        metadata: expect.objectContaining({
          previousStatus: "healthy",
          status: "disabled"
        })
      })
    ]);

    state = (await app.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: adminHeaders
    })).json();
    expect(state.keys).toEqual([]);
    expect(state.auditLogs).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: "key_deleted",
        targetId: "openai-prod-1"
      })
    ]));

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

  it("adds a MiniMax runtime key from preset id only", async () => {
    const app = await buildApp({ config: config() });

    const addResponse = await app.inject({
      method: "POST",
      url: "/admin/api/keys",
      headers: adminHeaders,
      payload: {
        presetId: "minimax-official",
        id: "minimax-prod-2",
        value: "sk-minimax-preset-secret",
        weight: 3
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
          id: "minimax-prod-2",
          provider: "minimax",
          pool: "text_generation",
          weight: 3,
          valuePreview: "sk-m...cret"
        }
      ]
    });

    await app.close();
  });

  it("rejects unknown provider presets", async () => {
    const app = await buildApp({ config: config() });

    const response = await app.inject({
      method: "POST",
      url: "/admin/api/keys",
      headers: adminHeaders,
      payload: {
        presetId: "not-a-provider",
        id: "unknown-prod-1",
        value: "sk-unknown-secret"
      }
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      error: {
        code: "unknown_provider_preset",
        message: "Unknown provider preset: not-a-provider"
      }
    });

    await app.close();
  });
});
