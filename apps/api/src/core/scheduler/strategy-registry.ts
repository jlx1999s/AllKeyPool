import type { SchedulingStrategy } from "@keypool/shared";
import { RoundRobinStrategy } from "./strategies/round-robin.strategy.js";
import { WeightedRoundRobinStrategy } from "./strategies/weighted-round-robin.strategy.js";

export function createDefaultSchedulingStrategies(): SchedulingStrategy[] {
  return [
    new RoundRobinStrategy(),
    new WeightedRoundRobinStrategy()
  ];
}

