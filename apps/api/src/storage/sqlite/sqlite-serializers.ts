import type { ApiKeyRecord } from "@keypool/shared";

export function dateToSql(value: Date | undefined): string | null {
  return value?.toISOString() ?? null;
}

export function sqlToDate(value: unknown): Date | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  return new Date(value);
}

export function jsonToSql(value: Record<string, unknown> | undefined): string | null {
  return value === undefined ? null : JSON.stringify(value);
}

export function sqlToJson(value: unknown): Record<string, unknown> | undefined {
  if (typeof value !== "string" || value.length === 0) {
    return undefined;
  }

  const parsed = JSON.parse(value) as unknown;
  return isRecord(parsed) ? parsed : undefined;
}

export function withOptionalDate<T extends object>(
  target: T,
  key: keyof ApiKeyRecord,
  value: unknown
): T {
  const date = sqlToDate(value);
  return date === undefined ? target : { ...target, [key]: date };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}
