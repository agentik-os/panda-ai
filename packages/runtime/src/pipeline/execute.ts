import type { Message, MessageContext, ModelResponse } from "@agentik-os/shared";
import type { ModelSelection } from "../router/selector";
import { AnthropicProvider } from "../router/providers/anthropic";
import { OpenAIProvider } from "../router/providers/openai";

export interface ExecuteConfig {
  anthropicApiKey?: string;
  openaiApiKey?: string;
  systemPrompt?: string;
  temperature?: number;
  maxTokens?: number;
}

export async function executeModel(
  message: Message,
  context: MessageContext,
  modelSelection: ModelSelection,
  config: ExecuteConfig
): Promise<ModelResponse> {
  // Build conversation history from context
  const messages = [
    ...context.messages.map((msg) => ({
      role: (msg.userId === message.userId ? "user" : "assistant") as "user" | "assistant",
      content: msg.content,
    })),
    {
      role: "user" as const,
      content: message.content,
    },
  ];

  // Select and call the appropriate provider
  if (modelSelection.provider === "anthropic") {
    if (!config.anthropicApiKey) {
      throw new Error("Anthropic API key not configured");
    }
    const provider = new AnthropicProvider({ apiKey: config.anthropicApiKey });
    return provider.chat(
      messages,
      modelSelection.model,
      config.systemPrompt,
      config.temperature,
      config.maxTokens
    );
  }

  if (modelSelection.provider === "openai") {
    if (!config.openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }
    const provider = new OpenAIProvider({ apiKey: config.openaiApiKey });
    const messagesWithSystem = config.systemPrompt
      ? [{ role: "system" as const, content: config.systemPrompt }, ...messages]
      : messages;
    return provider.chat(
      messagesWithSystem,
      modelSelection.model,
      config.temperature,
      config.maxTokens
    );
  }

  throw new Error(`Provider ${modelSelection.provider} not yet implemented`);
}
