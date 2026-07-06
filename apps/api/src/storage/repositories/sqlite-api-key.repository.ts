import type { ApiKeyRecord, ApiKeyStatus } from "@keypool/shared";
import type { DatabaseSync } from "node:sqlite";
import type { KeyPoolConfig } from "../../config/schema.js";
import { PlainTextKeyEncryption, type KeyEncryption } from "../../security/key-encryption.js";
import { createApiKeyRecordsFromConfig } from "./in-memory-api-key.repository.js";
import type { ApiKeyRepository, FindApiKeysOptions } from "./api-key.repository.js";
import { dateToSql, jsonToSql, sqlToDate, sqlToJson } from "../sqlite/sqlite-serializers.js";

interface ApiKeyRow {
  id: string;
  provider: string;
  pool: string;
  value: string;
  weight: number;
  status: ApiKeyStatus;
  rpm_limit: number | null;
  daily_request_limit: number | null;
  last_used_at: string | null;
  cooling_down_until: string | null;
  failure_count: number;
  metadata_json: string | null;
}

export class SqliteApiKeyRepository implements ApiKeyRepository {
  constructor(
    private readonly database: DatabaseSync,
    private readonly keyEncryption: KeyEncryption = new PlainTextKeyEncryption()
  ) {}

  async list(): Promise<ApiKeyRecord[]> {
    return this.database
      .prepare("SELECT * FROM api_keys ORDER BY id ASC")
      .all()
      .map((row) => this.rowToApiKeyRecord(row as unknown as ApiKeyRow));
  }

  async upsert(key: ApiKeyRecord): Promise<void> {
    this.database.prepare(`
      INSERT INTO api_keys (
        id, provider, pool, value, weight, status, rpm_limit, daily_request_limit,
        last_used_at, cooling_down_until, failure_count, metadata_json, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        provider = excluded.provider,
        pool = excluded.pool,
        value = excluded.value,
        weight = excluded.weight,
        status = excluded.status,
        rpm_limit = excluded.rpm_limit,
        daily_request_limit = excluded.daily_request_limit,
        last_used_at = excluded.last_used_at,
        cooling_down_until = excluded.cooling_down_until,
        failure_count = excluded.failure_count,
        metadata_json = excluded.metadata_json,
        updated_at = excluded.updated_at
    `).run(...this.apiKeyRecordParams(key), new Date().toISOString());
  }

  async delete(id: string): Promise<boolean> {
    const result = this.database.prepare("DELETE FROM api_keys WHERE id = ?").run(id);
    return result.changes > 0;
  }

  async findByPool(pool: string, options: FindApiKeysOptions = {}): Promise<ApiKeyRecord[]> {
    const rows = options.provider
      ? this.database
        .prepare("SELECT * FROM api_keys WHERE pool = ? AND provider = ? ORDER BY id ASC")
        .all(pool, options.provider)
      : this.database
        .prepare("SELECT * FROM api_keys WHERE pool = ? ORDER BY id ASC")
        .all(pool);

    return rows.map((row) => this.rowToApiKeyRecord(row as unknown as ApiKeyRow));
  }

  async findById(id: string): Promise<ApiKeyRecord | undefined> {
    const row = this.database.prepare("SELECT * FROM api_keys WHERE id = ?").get(id);
    return row === undefined ? undefined : this.rowToApiKeyRecord(row as unknown as ApiKeyRow);
  }

  async markUsed(id: string, usedAt: Date): Promise<void> {
    this.database.prepare("UPDATE api_keys SET last_used_at = ?, updated_at = ? WHERE id = ?")
      .run(usedAt.toISOString(), new Date().toISOString(), id);
  }

  async recordFailure(id: string): Promise<ApiKeyRecord | undefined> {
    this.database.prepare(`
      UPDATE api_keys
      SET failure_count = failure_count + 1,
          updated_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id);

    return this.findById(id);
  }

  async resetFailures(id: string): Promise<ApiKeyRecord | undefined> {
    this.database.prepare(`
      UPDATE api_keys
      SET failure_count = 0,
          status = CASE WHEN status = 'degraded' THEN 'healthy' ELSE status END,
          cooling_down_until = NULL,
          updated_at = ?
      WHERE id = ?
    `).run(new Date().toISOString(), id);

    return this.findById(id);
  }

  async startCoolingDown(id: string, until: Date): Promise<ApiKeyRecord | undefined> {
    this.database.prepare(`
      UPDATE api_keys
      SET status = 'cooling_down',
          cooling_down_until = ?,
          updated_at = ?
      WHERE id = ?
    `).run(until.toISOString(), new Date().toISOString(), id);

    return this.findById(id);
  }

  async releaseExpiredCooldowns(now: Date): Promise<ApiKeyRecord[]> {
    const rows = this.database
      .prepare("SELECT * FROM api_keys WHERE status = 'cooling_down' AND cooling_down_until IS NOT NULL AND cooling_down_until <= ?")
      .all(now.toISOString())
      .map((row) => this.rowToApiKeyRecord(row as unknown as ApiKeyRow));

    this.database.prepare(`
      UPDATE api_keys
      SET status = 'degraded',
          cooling_down_until = NULL,
          updated_at = ?
      WHERE status = 'cooling_down'
        AND cooling_down_until IS NOT NULL
        AND cooling_down_until <= ?
    `).run(new Date().toISOString(), now.toISOString());

    return rows.map(({ coolingDownUntil: _coolingDownUntil, ...key }) => ({
      ...key,
      status: "degraded"
    }));
  }

  async updateStatus(id: string, status: ApiKeyRecord["status"]): Promise<boolean> {
    const result = this.database.prepare(`
      UPDATE api_keys
      SET status = ?,
          cooling_down_until = CASE WHEN ? = 'cooling_down' THEN cooling_down_until ELSE NULL END,
          updated_at = ?
      WHERE id = ?
    `).run(status, status, new Date().toISOString(), id);

    return result.changes > 0;
  }

  async seedFromConfig(config: KeyPoolConfig): Promise<void> {
    for (const key of createApiKeyRecordsFromConfig(config)) {
      const existing = await this.findById(key.id);
      if (!existing) {
        await this.upsert(key);
      }
    }
  }

  private apiKeyRecordParams(key: ApiKeyRecord): Array<string | number | null> {
    return [
      key.id,
      key.provider,
      key.pool,
      this.keyEncryption.encrypt(key.value),
      key.weight,
      key.status,
      key.rpmLimit ?? null,
      key.dailyRequestLimit ?? null,
      dateToSql(key.lastUsedAt),
      dateToSql(key.coolingDownUntil),
      key.failureCount,
      jsonToSql(key.metadata)
    ];
  }

  private rowToApiKeyRecord(row: ApiKeyRow): ApiKeyRecord {
    return rowToApiKeyRecord({
      ...row,
      value: this.keyEncryption.decrypt(row.value)
    });
  }
}

export async function createSqliteApiKeyRepository(
  database: DatabaseSync,
  config: KeyPoolConfig,
  keyEncryption?: KeyEncryption
): Promise<SqliteApiKeyRepository> {
  const repository = new SqliteApiKeyRepository(database, keyEncryption);
  await repository.seedFromConfig(config);
  return repository;
}

function rowToApiKeyRecord(row: ApiKeyRow): ApiKeyRecord {
  const key: ApiKeyRecord = {
    id: row.id,
    provider: row.provider,
    pool: row.pool,
    value: row.value,
    weight: row.weight,
    status: row.status,
    failureCount: row.failure_count
  };

  if (row.rpm_limit !== null) key.rpmLimit = row.rpm_limit;
  if (row.daily_request_limit !== null) key.dailyRequestLimit = row.daily_request_limit;
  const lastUsedAt = sqlToDate(row.last_used_at);
  if (lastUsedAt) key.lastUsedAt = lastUsedAt;
  const coolingDownUntil = sqlToDate(row.cooling_down_until);
  if (coolingDownUntil) key.coolingDownUntil = coolingDownUntil;
  const metadata = sqlToJson(row.metadata_json);
  if (metadata) key.metadata = metadata;

  return key;
}
