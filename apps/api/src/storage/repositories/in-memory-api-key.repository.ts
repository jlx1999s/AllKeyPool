import type { ApiKeyRecord } from "@keypool/shared";
import type { KeyPoolConfig } from "../../config/schema.js";
import type { ApiKeyRepository, FindApiKeysOptions } from "./api-key.repository.js";

export class InMemoryApiKeyRepository implements ApiKeyRepository {
  private readonly keys = new Map<string, ApiKeyRecord>();

  constructor(keys: ApiKeyRecord[]) {
    for (const key of keys) {
      this.keys.set(key.id, key);
    }
  }

  async list(): Promise<ApiKeyRecord[]> {
    return Array.from(this.keys.values());
  }

  async upsert(key: ApiKeyRecord): Promise<void> {
    this.keys.set(key.id, key);
  }

  async delete(id: string): Promise<boolean> {
    return this.keys.delete(id);
  }

  async findByPool(pool: string, options: FindApiKeysOptions = {}): Promise<ApiKeyRecord[]> {
    return Array.from(this.keys.values()).filter((key) => {
      if (key.pool !== pool) {
        return false;
      }

      if (options.provider && key.provider !== options.provider) {
        return false;
      }

      return true;
    });
  }

  async findById(id: string): Promise<ApiKeyRecord | undefined> {
    return this.keys.get(id);
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    const key = this.keys.get(id);

    if (!key) {
      return;
    }

    this.keys.set(id, {
      ...key,
      lastUsedAt: usedAt
    });
  }

  async recordFailure(id: string): Promise<ApiKeyRecord | undefined> {
    const key = this.keys.get(id);

    if (!key) {
      return undefined;
    }

    const updatedKey: ApiKeyRecord = {
      ...key,
      failureCount: key.failureCount + 1
    };

    this.keys.set(id, updatedKey);

    return updatedKey;
  }

  async resetFailures(id: string): Promise<ApiKeyRecord | undefined> {
    const key = this.keys.get(id);

    if (!key) {
      return undefined;
    }

    const { coolingDownUntil: _coolingDownUntil, ...keyWithoutCooldown } = key;
    const updatedKey: ApiKeyRecord = {
      ...keyWithoutCooldown,
      failureCount: 0,
      status: key.status === "degraded" ? "healthy" : key.status
    };

    this.keys.set(id, updatedKey);

    return updatedKey;
  }

  async startCoolingDown(id: string, until: Date): Promise<ApiKeyRecord | undefined> {
    const key = this.keys.get(id);

    if (!key) {
      return undefined;
    }

    const updatedKey: ApiKeyRecord = {
      ...key,
      status: "cooling_down",
      coolingDownUntil: until
    };

    this.keys.set(id, updatedKey);

    return updatedKey;
  }

  async releaseExpiredCooldowns(now: Date): Promise<ApiKeyRecord[]> {
    const releasedKeys: ApiKeyRecord[] = [];

    for (const key of this.keys.values()) {
      if (key.status !== "cooling_down" || !key.coolingDownUntil || key.coolingDownUntil > now) {
        continue;
      }

      const { coolingDownUntil: _coolingDownUntil, ...keyWithoutCooldown } = key;
      const releasedKey: ApiKeyRecord = {
        ...keyWithoutCooldown,
        status: "degraded"
      };

      this.keys.set(key.id, releasedKey);
      releasedKeys.push(releasedKey);
    }

    return releasedKeys;
  }

  async updateStatus(id: string, status: ApiKeyRecord["status"]): Promise<boolean> {
    const key = this.keys.get(id);

    if (!key) {
      return false;
    }

    const { coolingDownUntil: _coolingDownUntil, ...keyWithoutCooldown } = key;
    const baseKey = status === "cooling_down" ? key : keyWithoutCooldown;
    this.keys.set(id, {
      ...baseKey,
      status
    });

    return true;
  }
}

export function createInMemoryApiKeyRepository(config: KeyPoolConfig): InMemoryApiKeyRepository {
  const keys: ApiKeyRecord[] = [];

  for (const [poolName, pool] of Object.entries(config.pools)) {
    for (const poolProvider of pool.providers) {
      const provider = config.providers[poolProvider.provider];

      if (!provider) {
        continue;
      }

      for (const providerKey of provider.keys) {
        const key: ApiKeyRecord = {
          id: providerKey.id,
          provider: poolProvider.provider,
          pool: poolName,
          value: providerKey.value,
          weight: providerKey.weight,
          status: "healthy",
          failureCount: 0
        };

        if (providerKey.rpm !== undefined) {
          key.rpmLimit = providerKey.rpm;
        }

        if (providerKey.dailyRequests !== undefined) {
          key.dailyRequestLimit = providerKey.dailyRequests;
        }

        const scriptSpec = providerKey.script ?? provider.script;
        if (scriptSpec) {
          key.metadata = { ...(key.metadata ?? {}), scriptSpec };
        }

        keys.push(key);
      }
    }
  }

  return new InMemoryApiKeyRepository(keys);
}
