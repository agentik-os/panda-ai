import type { Message, MessageContext } from "@agentik-os/shared";
import { ShortTermMemory } from "../memory/short-term";
import { SessionMemory } from "../memory/session";

export class MemoryLoader {
  constructor(
    private shortTerm: ShortTermMemory,
    private session: SessionMemory
  ) {}

  async loadContext(message: Message, agentId: string): Promise<MessageContext> {
    const shortTermMemories = this.shortTerm.toMemories(agentId);
    const sessionMemories = this.session.toMemories(agentId, message.userId);

    // Combine and convert memories back to message format for context
    const allMemories = [...shortTermMemories, ...sessionMemories];
    const contextMessages = allMemories
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .map((memory) => ({
        id: memory.id,
        channel: (memory.metadata.channel as Message["channel"]) || "cli",
        channelMessageId: memory.metadata.originalMessageId as string,
        userId: memory.userId || message.userId,
        agentId: memory.agentId,
        content: memory.content,
        metadata: {},
        timestamp: memory.createdAt,
      }));

    return {
      messages: contextMessages,
      agentId,
      userId: message.userId,
    };
  }

  saveMessage(agentId: string, userId: string, message: Message): void {
    this.shortTerm.add(agentId, message);
    this.session.add(agentId, userId, message);
  }
}
