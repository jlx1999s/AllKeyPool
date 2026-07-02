import type { ApiKeyRecord, SchedulingContext, SchedulingStrategy } from "@keypool/shared";

export class RoundRobinStrategy implements SchedulingStrategy {
  readonly name = "round_robin";

  private readonly cursors = new Map<string, number>();

  async selectKey(context: SchedulingContext, keys: ApiKeyRecord[]): Promise<ApiKeyRecord> {
    const eligibleKeys = keys.filter((key) => key.status !== "disabled" && key.status !== "cooling_down");

    if (eligibleKeys.length === 0) {
      throw new Error(`No eligible API keys for pool: ${context.pool}`);
    }

    const cursor = this.cursors.get(context.pool) ?? 0;
    const selectedKey = eligibleKeys[cursor % eligibleKeys.length];

    if (!selectedKey) {
      throw new Error(`No eligible API keys for pool: ${context.pool}`);
    }

    this.cursors.set(context.pool, cursor + 1);

    return selectedKey;
  }
}
