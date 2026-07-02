import type { ApiKeyRecord } from "@keypool/shared";

export function getEligibleKeys(keys: ApiKeyRecord[]): ApiKeyRecord[] {
  return keys.filter((key) => key.status !== "disabled" && key.status !== "cooling_down");
}

