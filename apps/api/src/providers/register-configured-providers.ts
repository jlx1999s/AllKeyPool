import type { KeyPoolConfig } from "../config/schema.js";
import { OpenAIAdapter } from "./openai/openai.adapter.js";
import type { ProviderRegistry } from "./provider-registry.js";

export function registerConfiguredProviders(registry: ProviderRegistry, config: KeyPoolConfig): void {
  for (const [name, provider] of Object.entries(config.providers)) {
    if (provider.type === "openai") {
      registry.register(new OpenAIAdapter({
        name,
        baseUrl: provider.baseUrl
      }));
    }
  }
}

