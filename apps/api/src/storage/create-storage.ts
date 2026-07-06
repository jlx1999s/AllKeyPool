import type { DatabaseSync } from "node:sqlite";
import type { KeyPoolConfig } from "../config/schema.js";
import { InMemoryHealthEventRecorder, type HealthEventRecorder } from "../observability/health-event-recorder.js";
import { SqliteHealthEventRecorder } from "../observability/sqlite-health-event-recorder.js";
import { SqliteUsageRecorder } from "../observability/sqlite-usage-recorder.js";
import { InMemoryUsageRecorder, type UsageRecorder } from "../observability/usage-recorder.js";
import { createKeyEncryptionFromEnv } from "../security/key-encryption.js";
import { openSqliteDatabase } from "./sqlite/sqlite-connection.js";
import type { ApiKeyRepository } from "./repositories/api-key.repository.js";
import { createInMemoryApiKeyRepository } from "./repositories/in-memory-api-key.repository.js";
import { createSqliteApiKeyRepository } from "./repositories/sqlite-api-key.repository.js";

export interface StorageBundle {
  apiKeyRepository: ApiKeyRepository;
  usageRecorder: UsageRecorder;
  healthEventRecorder: HealthEventRecorder;
  kind: "memory" | "sqlite";
  close(): void;
}

export async function createStorage(config: KeyPoolConfig): Promise<StorageBundle> {
  if (getStorageKind() !== "sqlite") {
    return {
      apiKeyRepository: createInMemoryApiKeyRepository(config),
      usageRecorder: new InMemoryUsageRecorder(),
      healthEventRecorder: new InMemoryHealthEventRecorder(),
      kind: "memory",
      close() {}
    };
  }

  const database = openSqliteDatabase({
    path: process.env.KEYPOOL_SQLITE_PATH ?? "data/keypool.db"
  });

  return createSqliteStorageBundle(database, config);
}

export async function createSqliteStorageBundle(
  database: DatabaseSync,
  config: KeyPoolConfig
): Promise<StorageBundle> {
  const keyEncryption = createKeyEncryptionFromEnv();

  return {
    apiKeyRepository: await createSqliteApiKeyRepository(database, config, keyEncryption),
    usageRecorder: new SqliteUsageRecorder(database),
    healthEventRecorder: new SqliteHealthEventRecorder(database),
    kind: "sqlite",
    close() {
      database.close();
    }
  };
}

function getStorageKind(): "memory" | "sqlite" {
  return process.env.KEYPOOL_STORAGE === "sqlite" ? "sqlite" : "memory";
}
