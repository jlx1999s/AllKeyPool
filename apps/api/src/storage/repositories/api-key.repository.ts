import type { ApiKeyRecord } from "@keypool/shared";

export interface FindApiKeysOptions {
  provider?: string;
}

export interface ApiKeyRepository {
  list(): Promise<ApiKeyRecord[]>;
  upsert(key: ApiKeyRecord): Promise<void>;
  delete(id: string): Promise<boolean>;
  findByPool(pool: string, options?: FindApiKeysOptions): Promise<ApiKeyRecord[]>;
  findById(id: string): Promise<ApiKeyRecord | undefined>;
  markUsed(id: string, usedAt: Date): Promise<void>;
  updateStatus(id: string, status: ApiKeyRecord["status"]): Promise<boolean>;
}
