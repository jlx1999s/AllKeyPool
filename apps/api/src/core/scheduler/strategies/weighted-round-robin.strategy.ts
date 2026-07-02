import type { ApiKeyRecord, SchedulingContext, SchedulingStrategy } from "@keypool/shared";
import { getEligibleKeys } from "../key-eligibility.js";

export class WeightedRoundRobinStrategy implements SchedulingStrategy {
  readonly name = "weighted_round_robin";

  private readonly cursors = new Map<string, number>();

  async selectKey(context: SchedulingContext, keys: ApiKeyRecord[]): Promise<ApiKeyRecord> {
    const weightedKeys = expandWeightedKeys(getEligibleKeys(keys));

    if (weightedKeys.length === 0) {
      throw new Error(`No eligible API keys for pool: ${context.pool}`);
    }

    const cursor = this.cursors.get(context.pool) ?? 0;
    const selectedKey = weightedKeys[cursor % weightedKeys.length];

    if (!selectedKey) {
      throw new Error(`No eligible API keys for pool: ${context.pool}`);
    }

    this.cursors.set(context.pool, cursor + 1);

    return selectedKey;
  }
}

function expandWeightedKeys(keys: ApiKeyRecord[]): ApiKeyRecord[] {
  return keys.flatMap((key) => Array.from({ length: Math.max(1, key.weight) }, () => key));
}

