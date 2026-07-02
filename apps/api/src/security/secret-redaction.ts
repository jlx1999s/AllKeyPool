const SECRET_HEADER_NAMES = new Set([
  "authorization",
  "cookie",
  "set-cookie",
  "x-api-key",
  "api-key"
]);

export function redactSecrets<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => redactSecrets(item)) as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const redacted: Record<string, unknown> = {};

  for (const [key, nestedValue] of Object.entries(value)) {
    if (SECRET_HEADER_NAMES.has(key.toLowerCase()) || looksSecretLike(key)) {
      redacted[key] = "[REDACTED]";
      continue;
    }

    redacted[key] = redactSecrets(nestedValue);
  }

  return redacted as T;
}

function looksSecretLike(key: string): boolean {
  return /token|secret|password|api.?key/i.test(key);
}

