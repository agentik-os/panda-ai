import { describe, it, expect } from "vitest";
import { resolveTools } from "./tool-resolution";
import type { Message } from "@agentik-os/shared";

describe("resolveTools", () => {
  const mockMessage: Message = {
    id: "msg_1",
    channel: "cli",
    channelMessageId: "cli_msg_1",
    userId: "user_1",
    agentId: "agent_1",
    content: "Test message",
    timestamp: new Date("2026-02-14T08:00:00Z"),
  };

  const agentId = "agent_1";

  it("should return empty array (stub implementation)", () => {
    const tools = resolveTools(mockMessage, agentId);

    expect(tools).toEqual([]);
  });

  it("should return array type", () => {
    const tools = resolveTools(mockMessage, agentId);

    expect(Array.isArray(tools)).toBe(true);
  });

  it("should handle different message types", () => {
    const telegramMessage: Message = {
      ...mockMessage,
      channel: "telegram",
    };

    const tools = resolveTools(telegramMessage, agentId);

    expect(tools).toEqual([]);
  });

  it("should handle different agent IDs", () => {
    const tools = resolveTools(mockMessage, "different_agent_123");

    expect(tools).toEqual([]);
  });

  it("should handle message with metadata", () => {
    const messageWithMetadata: Message = {
      ...mockMessage,
      metadata: {
        someKey: "someValue",
        needsTools: true,
      },
    };

    const tools = resolveTools(messageWithMetadata, agentId);

    expect(tools).toEqual([]);
  });

  it("should handle message with attachments metadata", () => {
    const messageWithAttachments: Message = {
      ...mockMessage,
      metadata: {
        attachments: [
          { type: "image", url: "https://example.com/image.png" },
        ],
      },
    };

    const tools = resolveTools(messageWithAttachments, agentId);

    expect(tools).toEqual([]);
  });

  it("should handle long message content", () => {
    const longMessage: Message = {
      ...mockMessage,
      content: "A".repeat(10000),
    };

    const tools = resolveTools(longMessage, agentId);

    expect(tools).toEqual([]);
  });

  it("should handle message with special characters", () => {
    const specialMessage: Message = {
      ...mockMessage,
      content: "Test with @mentions, #hashtags, and emojis 🔧🛠️",
    };

    const tools = resolveTools(specialMessage, agentId);

    expect(tools).toEqual([]);
  });

  it("should be synchronous", () => {
    const result = resolveTools(mockMessage, agentId);

    expect(result).toBeDefined();
    expect(result).not.toBeInstanceOf(Promise);
  });

  it("should not throw errors", () => {
    expect(() => resolveTools(mockMessage, agentId)).not.toThrow();
  });

  describe("Phase 0 stub behavior", () => {
    it("should always return empty array regardless of input", () => {
      const messages: Message[] = [
        mockMessage,
        { ...mockMessage, content: "Use web search tool" },
        { ...mockMessage, content: "Execute code" },
        { ...mockMessage, content: "Read file" },
      ];

      messages.forEach((msg) => {
        expect(resolveTools(msg, agentId)).toEqual([]);
      });
    });

    it("should ignore message content that looks like tool requests", () => {
      const toolRequestMessage: Message = {
        ...mockMessage,
        content: "Please search the web for latest news",
      };

      const tools = resolveTools(toolRequestMessage, agentId);

      expect(tools).toEqual([]);
    });

    it("should ignore agent-specific tool configurations", () => {
      const specialAgentId = "agent_with_tools";

      const tools = resolveTools(mockMessage, specialAgentId);

      expect(tools).toEqual([]);
    });
  });

  describe("Future Phase 1 expectations", () => {
    it("should have Tool[] return type for future MCP integration", () => {
      const tools = resolveTools(mockMessage, agentId);

      // Type checking (compile-time verification)
      const _typeCheck: typeof tools extends Array<any> ? true : never = true;
      expect(_typeCheck).toBe(true);
    });

    it("should accept Message and agentId parameters for future use", () => {
      // This test documents the expected signature for Phase 1
      expect(() => {
        resolveTools(mockMessage, agentId);
      }).not.toThrow();
    });
  });
});
