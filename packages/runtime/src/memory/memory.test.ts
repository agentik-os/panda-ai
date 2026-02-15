import { describe, it, expect, beforeEach } from "vitest";
import { ShortTermMemory } from "./short-term";
import { SessionMemory } from "./session";
import type { Message } from "@agentik-os/shared";

const createMessage = (id: string, content: string, userId = "user_1"): Message => ({
  id,
  channel: "cli",
  channelMessageId: `cli_${id}`,
  userId,
  agentId: "test-agent",
  content,
  metadata: {},
  timestamp: new Date(),
});

describe("ShortTermMemory", () => {
  let memory: ShortTermMemory;

  beforeEach(() => {
    memory = new ShortTermMemory();
  });

  it("should store and retrieve messages", () => {
    const msg = createMessage("msg_1", "Hello");
    memory.add("agent_1", msg);

    const messages = memory.get("agent_1");
    expect(messages).toHaveLength(1);
    expect(messages[0].content).toBe("Hello");
  });

  it("should limit to max messages", () => {
    for (let i = 0; i < 15; i++) {
      memory.add("agent_1", createMessage(`msg_${i}`, `Message ${i}`));
    }

    const messages = memory.get("agent_1");
    expect(messages).toHaveLength(10);
    expect(messages[0].id).toBe("msg_5"); // First 5 should be dropped
  });

  it("should convert to Memory objects", () => {
    memory.add("agent_1", createMessage("msg_1", "First"));
    memory.add("agent_1", createMessage("msg_2", "Second"));

    const memories = memory.toMemories("agent_1");
    expect(memories).toHaveLength(2);
    expect(memories[0].tier).toBe("short-term");
    expect(memories[0].importance).toBeGreaterThan(memories[1].importance);
  });
});

describe("SessionMemory", () => {
  let memory: SessionMemory;

  beforeEach(() => {
    memory = new SessionMemory();
  });

  it("should store messages per user session", () => {
    memory.add("agent_1", "user_1", createMessage("msg_1", "Hello", "user_1"));
    memory.add("agent_1", "user_2", createMessage("msg_2", "Hi", "user_2"));

    const user1Messages = memory.get("agent_1", "user_1");
    const user2Messages = memory.get("agent_1", "user_2");

    expect(user1Messages).toHaveLength(1);
    expect(user2Messages).toHaveLength(1);
    expect(user1Messages[0].content).toBe("Hello");
    expect(user2Messages[0].content).toBe("Hi");
  });

  it("should convert to Memory objects with session tier", () => {
    memory.add("agent_1", "user_1", createMessage("msg_1", "Session message"));

    const memories = memory.toMemories("agent_1", "user_1");
    expect(memories).toHaveLength(1);
    expect(memories[0].tier).toBe("session");
    expect(memories[0].userId).toBe("user_1");
  });
});
