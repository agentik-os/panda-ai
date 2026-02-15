export type ModelProvider = "anthropic" | "openai" | "google" | "ollama";

export interface ModelConfig {
  provider: ModelProvider;
  model: string;
  apiKey?: string;
  baseURL?: string;
}

export interface ModelUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface ModelResponse {
  content: string;
  usage: ModelUsage;
  model: string;
  finishReason: string;
}

export interface ComplexityScore {
  score: number; // 0-100
  factors: {
    length: number;
    hasCode: boolean;
    hasAttachments: boolean;
    keywords: string[];
  };
}
