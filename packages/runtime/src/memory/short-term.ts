import type { Message, Memory } from "@agentik-os/shared";

export class ShortTermMemory {
  private messages: Map<string, Message[]> = new Map();
  private readonly maxMessages = 10;

  add(agentId: string, message: Message): void {
    const messages = this.messages.get(agentId) || [];
    messages.push(message);

    // Keep only last N messages
    if (messages.length > this.maxMessages) {
      messages.shift();
    }

    this.messages.set(agentId, messages);
  }

  get(agentId: string): Message[] {
    return this.messages.get(agentId) || [];
  }

  clear(agentId: string): void {
    this.messages.delete(agentId);
  }

  toMemories(agentId: string): Memory[] {
    const messages = this.get(agentId);
    return messages.map((msg, index) => ({
      id: `short_${msg.id}`,
      agentId,
      userId: msg.userId,
      tier: "short-term" as const,
      content: msg.content,
      importance: 100 - index * 10, // Recent = higher importance
      accessCount: 0,
      lastAccessed: new Date(),
      createdAt: msg.timestamp,
      expiresAt: new Date(Date.now() + 1000 * 60 * 10), // 10 min
      metadata: {
        channel: msg.channel,
        originalMessageId: msg.id,
      },
    }));
  }
}
