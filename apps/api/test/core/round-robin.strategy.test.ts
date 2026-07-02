import type { ApiKeyRecord } from "@keypool/shared";
import { describe, expect, it } from "vitest";
import { RoundRobinStrategy } from "../../src/core/scheduler/strategies/round-robin.strategy.js";

function key(id: string, status: ApiKeyRecord["status"] = "healthy"): ApiKeyRecord {
  return {
    id,
    provider: "openai",
    value: "secret",
    weight: 1,
    status,
    failureCount: 0
  };
}

describe("RoundRobinStrategy", () => {
  it("selects eligible keys in stable order", async () => {
    const strategy = new RoundRobinStrategy();
    const keys = [key("key-1"), key("key-2")];
    const context = { requestId: "req-1", pool: "text_generation" };

    await expect(strategy.selectKey(context, keys)).resolves.toMatchObject({ id: "key-1" });
    await expect(strategy.selectKey(context, keys)).resolves.toMatchObject({ id: "key-2" });
    await expect(strategy.selectKey(context, keys)).resolves.toMatchObject({ id: "key-1" });
  });

  it("skips disabled and cooling keys", async () => {
    const strategy = new RoundRobinStrategy();
    const keys = [key("key-1", "disabled"), key("key-2", "cooling_down"), key("key-3")];

    await expect(strategy.selectKey({ requestId: "req-1", pool: "text_generation" }, keys))
      .resolves.toMatchObject({ id: "key-3" });
  });
});

