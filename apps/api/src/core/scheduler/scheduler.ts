import type { SchedulingContext, SchedulingResult, SchedulingStrategy } from "@keypool/shared";
import type { QuotaManager } from "../quota/quota-manager.js";
import type { ApiKeyRepository } from "../../storage/repositories/api-key.repository.js";

export class SchedulerService {
  private readonly strategies: Map<string, SchedulingStrategy>;

  constructor(
    private readonly apiKeyRepository: ApiKeyRepository,
    strategies: SchedulingStrategy[],
    private readonly quotaManager?: QuotaManager
  ) {
    this.strategies = new Map(strategies.map((strategy) => [strategy.name, strategy]));
  }

  async selectKey(context: SchedulingContext, strategyName = "round_robin"): Promise<SchedulingResult> {
    const strategy = this.strategies.get(strategyName);

    if (!strategy) {
      throw new Error(`Unknown scheduling strategy: ${strategyName}`);
    }

    await this.apiKeyRepository.releaseExpiredCooldowns(new Date());

    const keys = await this.apiKeyRepository.findByPool(
      context.pool,
      context.provider ? { provider: context.provider } : {}
    );
    const excludedKeyIds = new Set(context.excludedKeyIds ?? []);
    const candidateKeys = keys.filter((key) => {
      if (excludedKeyIds.has(key.id)) {
        return false;
      }

      return this.quotaManager?.isEligible(key) ?? true;
    });
    const key = await strategy.selectKey(context, candidateKeys);

    await this.apiKeyRepository.markUsed(key.id, new Date());
    this.quotaManager?.recordRequest(key);

    return {
      key,
      strategy: strategy.name
    };
  }
}
