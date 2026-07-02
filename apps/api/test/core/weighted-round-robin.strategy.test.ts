import type { ApiKeyRecord } from "@keypool/shared";
import { describe, expect, it } from "vitest";
import { WeightedRoundRobinStrategy } from "../../src/core/scheduler/strategies/weighted-round-robin.strategy.js";

function key(id: string, weight: number, status: ApiKeyRecord["status"] = "healthy"): ApiKeyRecord {
  return {
    id,
    provider: "openai",
    pool: "text_generation",
    value: "secret",
    weight,
    status,
    failureCount: 0
  };
}

describe("WeightedRoundRobinStrategy", () => {
  it("selects keys according to configured weights", async () => {
    const strategy = new WeightedRoundRobinStrategy();
    const keys = [key("key-1", 2), key("key-2", 1)];
    const context = { requestId: "req-1", pool: "text_generation" };

    await expect(strategy.selectKey(context, keys)).resolves.toMatchObject({ id: "key-1" });
    await expect(strategy.selectKey(context, keys)).resolves.toMatchObject({ id: "key-1" });
    await expect(strategy.selectKey(context, keys)).resolves.toMatchObject({ id: "key-2" });
    await expect(strategy.selectKey(context, keys)).resolves.toMatchObject({ id: "key-1" });
  });

  it("skips disabled keys before applying weights", async () => {
    const strategy = new WeightedRoundRobinStrategy();
    const keys = [key("key-1", 10, "disabled"), key("key-2", 1)];

    await expect(strategy.selectKey({ requestId: "req-1", pool: "text_generation" }, keys))
      .resolves.toMatchObject({ id: "key-2" });
  });
});

