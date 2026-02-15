/**
 * Parallel Query Engine
 * Step-090: Multi-AI Consensus - Deliberation Engine
 *
 * Executes queries to multiple AI models in parallel for consensus building
 */

import type { ModelResponse, DeliberationResult } from "@agentik-os/shared";
import { AnthropicProvider } from "../router/providers/anthropic";
import { OpenAIProvider } from "../router/providers/openai";
import { GoogleProvider } from "../router/providers/google";
import { OllamaProvider } from "../router/providers/ollama";

export interface ParallelQueryConfig {
  query: string;
  models: string[]; // Array of model identifiers (e.g., ["claude-4-opus", "gpt-4", "gemini-2.0-flash"])
  systemPrompt?: string;
  temperature?: number;
  timeout?: number; // Optional timeout for each query (ms)
}

export interface ProviderConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  googleProjectId?: string;
  googleLocation?: string;
  ollamaBaseURL?: string;
}

export class ParallelQueryEngine {
  private providers: Map<string, any>;

  constructor(config: ProviderConfig) {
    this.providers = new Map();

    // Initialize providers based on available config
    if (config.anthropicApiKey) {
      this.providers.set("anthropic", new AnthropicProvider({ apiKey: config.anthropicApiKey }));
    }
    if (config.openaiApiKey) {
      this.providers.set("openai", new OpenAIProvider({ apiKey: config.openaiApiKey }));
    }
    if (config.googleProjectId && config.googleLocation) {
      this.providers.set("google", new GoogleProvider({
        projectId: config.googleProjectId,
        location: config.googleLocation
      }));
    }
    if (config.ollamaBaseURL) {
      this.providers.set("ollama", new OllamaProvider({ host: config.ollamaBaseURL }));
    }
  }

  /**
   * Execute queries to multiple models in parallel
   */
  async execute(config: ParallelQueryConfig): Promise<DeliberationResult> {
    const startTime = Date.now();

    const queries = config.models.map((modelId) =>
      this.queryModel(modelId, config.query, config.systemPrompt, config.temperature, config.timeout)
    );

    const responses = await Promise.allSettled(queries);

    // Extract successful responses
    const successfulResponses: ModelResponse[] = [];
    const models: string[] = [];

    responses.forEach((result, index) => {
      if (result.status === "fulfilled") {
        successfulResponses.push(result.value);
        models.push(config.models[index]!);
      } else {
        console.warn(`Model ${config.models[index]} query failed:`, result.reason);
      }
    });

    const parallelDuration = Date.now() - startTime;

    return {
      query: config.query,
      models,
      responses: successfulResponses,
      parallelDuration,
      timestamp: new Date(),
    };
  }

  /**
   * Query a single model
   */
  private async queryModel(
    modelId: string,
    query: string,
    systemPrompt?: string,
    temperature = 0.7,
    timeout?: number
  ): Promise<ModelResponse> {
    const provider = this.getProviderForModel(modelId);
    if (!provider) {
      throw new Error(`No provider configured for model: ${modelId}`);
    }

    const queryPromise = provider.chat(
      [{ role: "user" as const, content: query }],
      modelId,
      systemPrompt,
      temperature
    );

    if (timeout) {
      return await this.withTimeout(queryPromise, timeout, modelId);
    }

    return await queryPromise;
  }

  /**
   * Get provider for a specific model
   */
  private getProviderForModel(modelId: string): any {
    // Model ID patterns
    if (modelId.startsWith("claude-")) return this.providers.get("anthropic");
    if (modelId.startsWith("gpt-")) return this.providers.get("openai");
    if (modelId.startsWith("gemini-")) return this.providers.get("google");
    if (modelId.includes("llama") || modelId.includes("mistral") || modelId.includes("phi")) {
      return this.providers.get("ollama");
    }

    throw new Error(`Unknown model provider for: ${modelId}`);
  }

  /**
   * Add timeout to a promise
   */
  private async withTimeout<T>(
    promise: Promise<T>,
    timeout: number,
    modelId: string
  ): Promise<T> {
    return Promise.race([
      promise,
      new Promise<T>((_, reject) =>
        setTimeout(() => reject(new Error(`Query timeout for model: ${modelId}`)), timeout)
      ),
    ]);
  }

  /**
   * Get list of available models from configured providers
   */
  async getAvailableModels(): Promise<string[]> {
    const models: string[] = [];

    if (this.providers.has("anthropic")) {
      models.push("claude-4-opus-20250514", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001");
    }
    if (this.providers.has("openai")) {
      models.push("gpt-5o", "gpt-5o-mini", "gpt-4-turbo");
    }
    if (this.providers.has("google")) {
      models.push("gemini-2.0-flash-exp", "gemini-1.5-pro");
    }
    if (this.providers.has("ollama")) {
      const ollamaProvider = this.providers.get("ollama");
      const ollamaModels = await ollamaProvider.listModels();
      models.push(...ollamaModels);
    }

    return models;
  }
}
