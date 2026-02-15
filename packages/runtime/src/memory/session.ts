import type { Message, Memory } from "@agentik-os/shared";

export class SessionMemory {
  private sessions: Map<string, Message[]> = new Map();

  private getSessionKey(agentId: string, userId: string): string {
    return `${agentId}:${userId}`;
  }

  add(agentId: string, userId: string, message: Message): void {
    const key = this.getSessionKey(agentId, userId);
    const messages = this.sessions.get(key) || [];
    messages.push(message);
    this.sessions.set(key, messages);
  }

  get(agentId: string, userId: string): Message[] {
    const key = this.getSessionKey(agentId, userId);
    return this.sessions.get(key) || [];
  }

  clear(agentId: string, userId: string): void {
    const key = this.getSessionKey(agentId, userId);
    this.sessions.delete(key);
  }

  toMemories(agentId: string, userId: string): Memory[] {
    const messages = this.get(agentId, userId);
    return messages.map((msg) => ({
      id: `session_${msg.id}`,
      agentId,
      userId,
      tier: "session" as const,
      content: msg.content,
      importance: 70,
      accessCount: 0,
      lastAccessed: new Date(),
      createdAt: msg.timestamp,
      expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24), // 24h
      metadata: {
        channel: msg.channel,
        originalMessageId: msg.id,
      },
    }));
  }
}
