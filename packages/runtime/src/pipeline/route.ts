import type { Message } from "@agentik-os/shared";

export interface RouteConfig {
  defaultAgentId: string;
  channelAgents?: Record<string, string>;
}

export function routeMessage(message: Message, config: RouteConfig): string {
  // 1. Check if agent is explicitly set
  if (message.agentId && message.agentId !== "default") {
    return message.agentId;
  }

  // 2. Check for @mentions in content
  const mentionedAgent = extractMention(message.content);
  if (mentionedAgent) {
    return mentionedAgent;
  }

  // 3. Check channel-specific routing
  const channelAgent = config.channelAgents?.[message.channel];
  if (channelAgent) {
    return channelAgent;
  }

  // 4. Fallback to default agent
  return config.defaultAgentId;
}

function extractMention(content: string): string | null {
  // Match @agentName or @agent-name
  const mentionRegex = /@([a-zA-Z0-9_-]+)/;
  const match = content.match(mentionRegex);
  return match?.[1] ?? null;
}

export function removeMention(content: string): string {
  // Remove @mentions from the beginning of the content
  return content.replace(/^@[a-zA-Z0-9_-]+\s*/, "").trim();
}
