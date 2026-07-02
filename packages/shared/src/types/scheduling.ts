import type { ApiKeyRecord } from "./api-key.js";

export interface SchedulingContext {
  requestId: string;
  pool: string;
  provider?: string;
  model?: string;
  task?: string;
  excludedKeyIds?: string[];
}

export interface SchedulingStrategy {
  readonly name: string;
  selectKey(context: SchedulingContext, keys: ApiKeyRecord[]): Promise<ApiKeyRecord>;
}

export interface SchedulingResult {
  key: ApiKeyRecord;
  strategy: string;
}
