import OpenAI from "openai";
import type { ModelResponse, ModelUsage } from "@agentik-os/shared";

export interface OpenAIConfig {
  apiKey: string;
  baseURL?: string;
}

export class OpenAIProvider {
  private client: OpenAI;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async chat(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    model: string,
    temperature = 0.7,
    maxTokens = 4096
  ): Promise<ModelResponse> {
    const response = await this.client.chat.completions.create({
      model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature,
      max_tokens: maxTokens,
    });

    const choice = response.choices[0];
    if (!choice) {
      throw new Error("No completion choice returned from OpenAI");
    }

    const content = choice.message.content || "";

    const usage: ModelUsage = {
      promptTokens: response.usage?.prompt_tokens || 0,
      completionTokens: response.usage?.completion_tokens || 0,
      totalTokens: response.usage?.total_tokens || 0,
    };

    return {
      content,
      usage,
      model: response.model,
      finishReason: choice.finish_reason || "stop",
    };
  }

  async chatStreaming(
    messages: Array<{ role: "user" | "assistant" | "system"; content: string }>,
    model: string,
    onChunk?: (text: string) => void,
    temperature = 0.7,
    maxTokens = 4096
  ): Promise<ModelResponse> {
    const stream = await this.client.chat.completions.create({
      model,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
      temperature,
      max_tokens: maxTokens,
      stream: true,
    });

    let fullContent = "";
    let finishReason = "stop";

    for await (const chunk of stream) {
      const delta = chunk.choices[0]?.delta;
      if (delta?.content) {
        fullContent += delta.content;
        onChunk?.(delta.content);
      }
      if (chunk.choices[0]?.finish_reason) {
        finishReason = chunk.choices[0].finish_reason;
      }
    }

    // Note: Streaming doesn't provide usage stats in OpenAI API
    // Would need to estimate or make a second call
    const usage: ModelUsage = {
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };

    return {
      content: fullContent,
      usage,
      model,
      finishReason,
    };
  }
}
