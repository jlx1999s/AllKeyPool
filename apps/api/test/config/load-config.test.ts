import { describe, expect, it, vi } from "vitest";
import { interpolateEnv } from "../../src/config/load-config.js";

describe("interpolateEnv", () => {
  it("replaces environment placeholders", () => {
    vi.stubEnv("OPENAI_API_KEY_1", "test-key");

    expect(interpolateEnv("value: ${OPENAI_API_KEY_1}")).toBe("value: test-key");

    vi.unstubAllEnvs();
  });

  it("throws when an environment variable is missing", () => {
    expect(() => interpolateEnv("value: ${MISSING_KEYPOOL_SECRET}")).toThrow(
      "Missing environment variable: MISSING_KEYPOOL_SECRET"
    );
  });
});

