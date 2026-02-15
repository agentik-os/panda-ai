import { Ollama } from "ollama";
import type { ModelResponse, ModelUsage } from "@agentik-os/shared";

export interface OllamaConfig {
  host?: string; // e.g., "http://localhost:11434"
}

export class OllamaProvider {
  private client: Ollama;

  constructor(config: OllamaConfig = {}) {
    this.client = new Ollama({
      host: config.host || process.env.OLLAMA_HOST || "http://localhost:11434",
    });
  }

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    model: string, // e.g., "llama3.1", "mixtral", "codellama"
    systemPrompt?: string,
    temperature = 0.7,
    maxTokens = 4096
  ): Promise<ModelResponse> {
    const ollamaMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    const response = await this.client.chat({
      model,
      messages: ollamaMessages,
      options: {
        temperature,
        num_predict: maxTokens,
      },
      ...(systemPrompt && { system: systemPrompt }),
    });

    const usage: ModelUsage = {
      promptTokens: response.prompt_eval_count || 0,
      completionTokens: response.eval_count || 0,
      totalTokens: (response.prompt_eval_count || 0) + (response.eval_count || 0),
    };

    return {
      content: response.message.content,
      usage,
      model,
      finishReason: response.done ? "stop" : "length",
    };
  }

  async chatStreaming(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    model: string,
    systemPrompt?: string,
    onChunk?: (text: string) => void,
    temperature = 0.7,
    maxTokens = 4096
  ): Promise<ModelResponse> {
    const ollamaMessages = messages.map((msg) => ({
      role: msg.role,
      content: msg.content,
    }));

    let fullContent = "";
    let promptTokens = 0;
    let completionTokens = 0;
    let finishReason = "stop";

    const stream = await this.client.chat({
      model,
      messages: ollamaMessages,
      options: {
        temperature,
        num_predict: maxTokens,
      },
      ...(systemPrompt && { system: systemPrompt }),
      stream: true,
    });

    for await (const chunk of stream) {
      if (chunk.message?.content) {
        const text = chunk.message.content;
        fullContent += text;
        onChunk?.(text);
      }

      // Capture token counts from final chunk
      if (chunk.done) {
        promptTokens = chunk.prompt_eval_count || 0;
        completionTokens = chunk.eval_count || 0;
        finishReason = chunk.done ? "stop" : "length";
      }
    }

    const usage: ModelUsage = {
      promptTokens,
      completionTokens,
      totalTokens: promptTokens + completionTokens,
    };

    return {
      content: fullContent,
      usage,
      model,
      finishReason,
    };
  }

  /**
   * List available models on the Ollama instance
   */
  async listModels(): Promise<string[]> {
    const response = await this.client.list();
    return response.models.map((model) => model.name);
  }

  /**
   * Pull a model from Ollama registry
   */
  async pullModel(model: string): Promise<void> {
    await this.client.pull({ model });
  }

  /**
   * Check if a model is available locally
   */
  async hasModel(model: string): Promise<boolean> {
    const models = await this.listModels();
    return models.includes(model);
  }
}
