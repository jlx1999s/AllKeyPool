import { describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import type { KeyPoolConfig } from "../../src/config/schema.js";

const testConfig: KeyPoolConfig = {
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

describe("GET /health", () => {
  it("returns service status", async () => {
    const app = await buildApp({ config: testConfig });

    const response = await app.inject({
      method: "GET",
      url: "/health"
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: "ok",
      version: "0.1.0"
    });

    await app.close();
  });
});

