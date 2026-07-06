import type { ApiKeyRecord } from "@keypool/shared";
import type { ApiKeyRepository } from "../../storage/repositories/api-key.repository.js";

export interface KeyHealthServiceOptions {
  apiKeyRepository: ApiKeyRepository;
  coolingDownFailureThreshold?: number;
  coolingDownMs?: number;
}

export interface KeyFailureResult {
  key?: ApiKeyRecord;
  previousStatus?: ApiKeyRecord["status"];
  statusChanged: boolean;
}

export interface KeyRecoveryResult {
  key?: ApiKeyRecord;
  previousStatus?: ApiKeyRecord["status"];
  statusChanged: boolean;
}

export class KeyHealthService {
  private readonly coolingDownFailureThreshold: number;
  private readonly coolingDownMs: number;

  constructor(private readonly options: KeyHealthServiceOptions) {
    this.coolingDownFailureThreshold = options.coolingDownFailureThreshold ?? 3;
    this.coolingDownMs = options.coolingDownMs ?? 60_000;
  }

  async recordFailure(keyId: string, now = new Date()): Promise<KeyFailureResult> {
    const failedKey = await this.options.apiKeyRepository.recordFailure(keyId);

    if (!failedKey) {
      return {
        statusChanged: false
      };
    }

    const previousStatus = failedKey.status;
    const nextStatus = failedKey.failureCount >= this.coolingDownFailureThreshold
      ? "cooling_down"
      : "degraded";

    if (nextStatus === "cooling_down") {
      await this.options.apiKeyRepository.startCoolingDown(
        keyId,
        new Date(now.getTime() + this.coolingDownMs)
      );
    } else if (previousStatus !== nextStatus) {
      await this.options.apiKeyRepository.updateStatus(keyId, nextStatus);
    }

    const key = await this.options.apiKeyRepository.findById(keyId);

    return {
      ...(key === undefined ? {} : { key }),
      previousStatus,
      statusChanged: previousStatus !== nextStatus
    };
  }

  async recordSuccess(keyId: string): Promise<KeyRecoveryResult> {
    const previousKey = await this.options.apiKeyRepository.findById(keyId);
    const recoveredKey = await this.options.apiKeyRepository.resetFailures(keyId);

    if (!previousKey || !recoveredKey) {
      return {
        statusChanged: false
      };
    }

    return {
      key: recoveredKey,
      previousStatus: previousKey.status,
      statusChanged: previousKey.status !== recoveredKey.status || previousKey.failureCount !== 0
    };
  }
}
