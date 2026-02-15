import type { Message } from "@agentik-os/shared";

export interface Tool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export function resolveTools(_message: Message, _agentId: string): Tool[] {
  // Stub implementation for Phase 0
  // Phase 1 will integrate with MCP servers
  return [];
}
