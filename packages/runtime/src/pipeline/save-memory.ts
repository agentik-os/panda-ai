import type { Message } from "@agentik-os/shared";
import { MemoryLoader } from "./load-memory";

export async function saveMemory(
  loader: MemoryLoader,
  agentId: string,
  userId: string,
  userMessage: Message,
  assistantResponse: string
): Promise<void> {
  // Save user message
  loader.saveMessage(agentId, userId, userMessage);

  // Save assistant response as a message
  const responseMessage: Message = {
    id: `resp_${Date.now()}`,
    channel: userMessage.channel,
    channelMessageId: `${userMessage.channelMessageId}_resp`,
    userId: agentId, // Assistant is the "user" of this message
    agentId,
    content: assistantResponse,
    metadata: { isAssistantResponse: true },
    timestamp: new Date(),
  };

  loader.saveMessage(agentId, userId, responseMessage);
}
