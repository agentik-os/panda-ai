import Anthropic from "@anthropic-ai/sdk";
import type { ModelResponse, ModelUsage } from "@agentik-os/shared";

export interface AnthropicConfig {
  apiKey: string;
  baseURL?: string;
}

export class AnthropicProvider {
  private client: Anthropic;

  constructor(config: AnthropicConfig) {
    this.client = new Anthropic({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
    });
  }

  async chat(
    messages: Array<{ role: "user" | "assistant"; content: string }>,
    model: string,
    systemPrompt?: string,
    temperature = 0.7,
    maxTokens = 4096
  ): Promise<ModelResponse> {
    const response = await this.client.messages.create({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    const firstBlock = response.content[0];
    const content = firstBlock?.type === "text" ? firstBlock.text : "";

    const usage: ModelUsage = {
      promptTokens: response.usage.input_tokens,
      completionTokens: response.usage.output_tokens,
      totalTokens: response.usage.input_tokens + response.usage.output_tokens,
    };

    return {
      content,
      usage,
      model: response.model,
      finishReason: response.stop_reason || "stop",
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
    const stream = await this.client.messages.stream({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemPrompt,
      messages: messages.map((msg) => ({
        role: msg.role,
        content: msg.content,
      })),
    });

    let fullContent = "";

    for await (const chunk of stream) {
      if (
        chunk.type === "content_block_delta" &&
        chunk.delta.type === "text_delta"
      ) {
        const text = chunk.delta.text;
        fullContent += text;
        onChunk?.(text);
      }
    }

    const finalMessage = await stream.finalMessage();

    const usage: ModelUsage = {
      promptTokens: finalMessage.usage.input_tokens,
      completionTokens: finalMessage.usage.output_tokens,
      totalTokens:
        finalMessage.usage.input_tokens + finalMessage.usage.output_tokens,
    };

    return {
      content: fullContent,
      usage,
      model: finalMessage.model,
      finishReason: finalMessage.stop_reason || "stop",
    };
  }
}
