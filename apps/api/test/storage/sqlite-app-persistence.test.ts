import { mkdtemp, rm } from "node:fs/promises";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { afterEach, describe, expect, it } from "vitest";
import { buildApp } from "../../src/app.js";
import type { KeyPoolConfig } from "../../src/config/schema.js";

const adminHeaders = {
  authorization: "Bearer keypool-admin-dev"
};

let previousStorage: string | undefined;
let previousSqlitePath: string | undefined;
let tempDir: string | undefined;

function config(): KeyPoolConfig {
  return {
    server: {
      host: "127.0.0.1",
      port: 0
    },
    providers: {},
    pools: {},
    tasks: {},
    retry: {
      maxAttempts: 3,
      retryOn: [429, 500, 502, 503, 504]
    }
  };
}

describe("SQLite app persistence", () => {
  afterEach(async () => {
    restoreEnv();
    if (tempDir) {
      await rm(tempDir, { recursive: true, force: true });
      tempDir = undefined;
    }
  });

  it("restores admin-added keys and runtime routing config after restart", async () => {
    const sqlitePath = await enableSqliteStorage();
    const firstApp = await buildApp({ config: config() });

    const addResponse = await firstApp.inject({
      method: "POST",
      url: "/admin/api/keys",
      headers: adminHeaders,
      payload: {
        presetId: "minimax-official",
        id: "minimax-persisted-1",
        value: "sk-persisted-secret"
      }
    });

    expect(addResponse.statusCode).toBe(201);
    await firstApp.close();

    process.env.KEYPOOL_STORAGE = "sqlite";
    process.env.KEYPOOL_SQLITE_PATH = sqlitePath;
    const secondApp = await buildApp({ config: config() });
    const stateResponse = await secondApp.inject({
      method: "GET",
      url: "/admin/api/state",
      headers: adminHeaders
    });

    expect(stateResponse.statusCode).toBe(200);
    expect(stateResponse.json()).toMatchObject({
      storage: {
        kind: "sqlite"
      },
      providers: ["minimax"],
      pools: [
        {
          name: "text_generation",
          providers: [
            {
              provider: "minimax",
              models: ["MiniMax-M3"]
            }
          ]
        }
      ],
      keys: [
        {
          id: "minimax-persisted-1",
          provider: "minimax",
          pool: "text_generation",
          status: "healthy",
          valuePreview: "sk-p...cret"
        }
      ]
    });
    expect(JSON.stringify(stateResponse.json())).not.toContain("sk-persisted-secret");

    await secondApp.close();
  });
});

async function enableSqliteStorage(): Promise<string> {
  previousStorage = process.env.KEYPOOL_STORAGE;
  previousSqlitePath = process.env.KEYPOOL_SQLITE_PATH;
  tempDir = await mkdtemp(join(tmpdir(), "keypool-sqlite-"));
  const sqlitePath = join(tempDir, "keypool.db");
  process.env.KEYPOOL_STORAGE = "sqlite";
  process.env.KEYPOOL_SQLITE_PATH = sqlitePath;
  return sqlitePath;
}

function restoreEnv(): void {
  setOptionalEnv("KEYPOOL_STORAGE", previousStorage);
  setOptionalEnv("KEYPOOL_SQLITE_PATH", previousSqlitePath);
  previousStorage = undefined;
  previousSqlitePath = undefined;
}

function setOptionalEnv(key: string, value: string | undefined): void {
  if (value === undefined) {
    delete process.env[key];
    return;
  }

  process.env[key] = value;
}
