export interface ProviderPreset {
  id: string;
  label: string;
  provider: string;
  providerType: "openai";
  baseUrl: string;
  pool: string;
  model: string;
  keyIdPrefix: string;
}

export const providerPresets: ProviderPreset[] = [
  {
    id: "openai-compatible",
    label: "OpenAI Compatible",
    provider: "openai",
    providerType: "openai",
    baseUrl: "https://api.openai.com/v1",
    pool: "text_generation",
    model: "gpt-4.1-mini",
    keyIdPrefix: "openai"
  },
  {
    id: "minimax-official",
    label: "MiniMax Official",
    provider: "minimax",
    providerType: "openai",
    baseUrl: "https://api.minimax.io/v1",
    pool: "text_generation",
    model: "MiniMax-M3",
    keyIdPrefix: "minimax"
  }
];

export function findProviderPreset(id: string): ProviderPreset | undefined {
  return providerPresets.find((preset) => preset.id === id);
}
