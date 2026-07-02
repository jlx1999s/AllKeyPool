import { existsSync, readFileSync } from "node:fs";
import { dirname, join, parse, resolve } from "node:path";
import YAML from "yaml";
import { keyPoolConfigSchema, type KeyPoolConfig } from "./schema.js";

const ENV_PATTERN = /\$\{([A-Z0-9_]+)\}/gi;

export async function loadConfig(configPath = process.env.KEYPOOL_CONFIG): Promise<KeyPoolConfig> {
  const resolvedPath = configPath
    ? resolve(configPath)
    : findDefaultConfigPath(process.cwd());

  if (!existsSync(resolvedPath)) {
    throw new Error(`KeyPool config file not found: ${resolvedPath}`);
  }

  const rawConfig = readFileSync(resolvedPath, "utf8");
  const interpolatedConfig = interpolateEnv(rawConfig);
  const parsedConfig = YAML.parse(interpolatedConfig) as unknown;

  return keyPoolConfigSchema.parse(parsedConfig);
}

export function interpolateEnv(input: string): string {
  return input.replace(ENV_PATTERN, (_, name: string) => {
    const value = process.env[name];

    if (value === undefined) {
      throw new Error(`Missing environment variable: ${name}`);
    }

    return value;
  });
}

function findDefaultConfigPath(startDirectory: string): string {
  let currentDirectory = resolve(startDirectory);
  const rootDirectory = parse(currentDirectory).root;

  while (true) {
    const candidate = join(currentDirectory, "config", "keypool.yaml");

    if (existsSync(candidate)) {
      return candidate;
    }

    if (currentDirectory === rootDirectory) {
      return resolve(startDirectory, "config", "keypool.yaml");
    }

    currentDirectory = dirname(currentDirectory);
  }
}
