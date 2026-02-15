import { describe, it, expect } from "vitest";
import { routeMessage, removeMention } from "./route";
import type { Message } from "@agentik-os/shared";

const createMessage = (
  content: string,
  agentId?: string,
  channel = "cli"
): Message => ({
  id: "msg_1",
  channel: channel as Message["channel"],
  channelMessageId: "test_1",
  userId: "user_1",
  agentId: agentId || "default",
  content,
  metadata: {},
  timestamp: new Date(),
});

describe("routeMessage", () => {
  const config = {
    defaultAgentId: "default-agent",
    channelAgents: {
      telegram: "telegram-bot",
      discord: "discord-bot",
    },
  };

  it("should route to explicitly set agent", () => {
    const message = createMessage("Hello", "explicit-agent");
    const agent = routeMessage(message, config);
    expect(agent).toBe("explicit-agent");
  });

  it("should route to mentioned agent", () => {
    const message = createMessage("@nova help me with this");
    const agent = routeMessage(message, config);
    expect(agent).toBe("nova");
  });

  it("should route to channel-specific agent", () => {
    const message = createMessage("Hello from Telegram", undefined, "telegram");
    const agent = routeMessage(message, config);
    expect(agent).toBe("telegram-bot");
  });

  it("should fallback to default agent", () => {
    const message = createMessage("Generic message");
    const agent = routeMessage(message, config);
    expect(agent).toBe("default-agent");
  });

  it("should prioritize mention over channel routing", () => {
    const message = createMessage("@ralph fix this bug", undefined, "telegram");
    const agent = routeMessage(message, config);
    expect(agent).toBe("ralph");
  });
});

describe("removeMention", () => {
  it("should remove mention from content", () => {
    const content = "@nova help me";
    expect(removeMention(content)).toBe("help me");
  });

  it("should handle content without mention", () => {
    const content = "no mention here";
    expect(removeMention(content)).toBe("no mention here");
  });

  it("should only remove mention at start", () => {
    const content = "hello @nova there";
    expect(removeMention(content)).toBe("hello @nova there");
  });
});
