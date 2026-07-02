import type { ProviderAdapter } from "@keypool/shared";

export class ProviderRegistry {
  private readonly providers = new Map<string, ProviderAdapter>();

  register(adapter: ProviderAdapter): void {
    if (this.providers.has(adapter.name)) {
      throw new Error(`Provider adapter already registered: ${adapter.name}`);
    }

    this.providers.set(adapter.name, adapter);
  }

  get(name: string): ProviderAdapter {
    const adapter = this.providers.get(name);

    if (!adapter) {
      throw new Error(`Provider adapter not found: ${name}`);
    }

    return adapter;
  }

  has(name: string): boolean {
    return this.providers.has(name);
  }

  list(): ProviderAdapter[] {
    return Array.from(this.providers.values());
  }
}

