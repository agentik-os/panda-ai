// Import from channel.ts to avoid duplication
import type { ChannelType, Attachment } from "./channel";

// Re-export for convenience
export type { ChannelType, Attachment };

export interface Message {
  id: string;
  channel: ChannelType;
  channelMessageId: string;
  userId: string;
  agentId: string;
  content: string;
  attachments?: Attachment[];
  metadata: Record<string, unknown>;
  timestamp: Date;
}

export interface MessageContext {
  messages: Message[];
  agentId: string;
  userId: string;
}
