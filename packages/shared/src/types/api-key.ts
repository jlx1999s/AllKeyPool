export type ApiKeyStatus = "healthy" | "degraded" | "cooling_down" | "disabled";

export interface ApiKeyRecord {
  id: string;
  provider: string;
  pool: string;
  value: string;
  weight: number;
  status: ApiKeyStatus;
  rpmLimit?: number;
  dailyRequestLimit?: number;
  lastUsedAt?: Date;
  coolingDownUntil?: Date;
  failureCount: number;
  metadata?: Record<string, unknown>;
}
