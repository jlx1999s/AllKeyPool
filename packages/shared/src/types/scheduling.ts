import type { ApiKeyRecord } from "./api-key.js";

export interface SchedulingContext {
  requestId: string;
  pool: string;
  provider?: string;
  model?: string;
  task?: string;
}

export interface SchedulingStrategy {
  readonly name: string;
  selectKey(context: SchedulingContext, keys: ApiKeyRecord[]): Promise<ApiKeyRecord>;
}

