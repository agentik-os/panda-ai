import type { Message } from "@agentik-os/shared";

export interface ResponseMessage {
  channel: Message["channel"];
  channelMessageId: string;
  userId: string;
  content: string;
  metadata?: Record<string, unknown>;
}

export async function sendResponse(
  originalMessage: Message,
  responseContent: string
): Promise<ResponseMessage> {
  // In Phase 1, this will use channel adapters to send via Telegram, Discord, etc.
  // For Phase 0, we just return the response structure

  const response: ResponseMessage = {
    channel: originalMessage.channel,
    channelMessageId: `${originalMessage.channelMessageId}_response`,
    userId: originalMessage.agentId,
    content: responseContent,
    metadata: {
      inReplyTo: originalMessage.id,
    },
  };

  return response;
}
