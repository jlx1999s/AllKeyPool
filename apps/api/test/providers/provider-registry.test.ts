import type { ProviderAdapter } from "@keypool/shared";
import { describe, expect, it } from "vitest";
import { ProviderRegistry } from "../../src/providers/provider-registry.js";

const adapter: ProviderAdapter = {
  name: "openai",
  async send() {
    return {
      statusCode: 200,
      headers: {},
      body: {}
    };
  },
  async checkHealth() {
    return {
      status: "healthy"
    };
  },
  normalizeError(error) {
    return {
      provider: "openai",
      code: "provider_error",
      message: error instanceof Error ? error.message : "Unknown provider error",
      retryable: false,
      rateLimited: false,
      authenticationFailed: false
    };
  }
};

describe("ProviderRegistry", () => {
  it("registers and returns provider adapters", () => {
    const registry = new ProviderRegistry();

    registry.register(adapter);

    expect(registry.has("openai")).toBe(true);
    expect(registry.get("openai")).toBe(adapter);
    expect(registry.list()).toEqual([adapter]);
  });

  it("rejects duplicate providers", () => {
    const registry = new ProviderRegistry();

    registry.register(adapter);

    expect(() => registry.register(adapter)).toThrow("Provider adapter already registered: openai");
  });
});

