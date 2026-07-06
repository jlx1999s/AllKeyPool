import type { KeyPoolConfig } from "../config/schema.js";
import { FakeOpenAIAdapter } from "./fake/fake-adapter.js";
import { buildScriptFromSpec } from "./fake/fake-script-dsl.js";
import { OpenAIAdapter } from "./openai/openai.adapter.js";
import type { ProviderRegistry } from "./provider-registry.js";

export interface RegisterProvidersOptions {
  /** when true, register FakeOpenAIAdapter for any provider.type === "openai".
   *  provider-level and key-level `script` fields are honored via the DSL. */
  fakeProvider?: boolean;
}

export function registerConfiguredProviders(
  registry: ProviderRegistry,
  config: KeyPoolConfig,
  options: RegisterProvidersOptions = {}
): void {
  for (const [name, provider] of Object.entries(config.providers)) {
    if (provider.type === "openai") {
      if (options.fakeProvider) {
        const defaultScript = provider.script ? buildScriptFromSpec(provider.script) : undefined;
        const perKeyScript = new Map<string, ReturnType<typeof buildScriptFromSpec>>();

        for (const key of provider.keys) {
          if (key.script) {
            perKeyScript.set(key.id, buildScriptFromSpec(key.script));
          }
        }

        registry.register(new FakeOpenAIAdapter({
          name,
          resolveScript: (key) => perKeyScript.get(key.id) ?? defaultScript
        }));
        continue;
      }

      registry.register(new OpenAIAdapter({
        name,
        baseUrl: provider.baseUrl
      }));
    }
  }
}

