/**
 * Integration Tests for Message Pipeline
 *
 * Tests the complete message flow from normalization → routing → memory
 */

import { describe, it, expect, beforeEach } from "vitest";
import { normalizeMessage } from "../../src/pipeline/normalize";
import { routeMessage } from "../../src/pipeline/route";
import type { Message } from "@agentik-os/shared";

describe("Message Pipeline Integration", () => {
  const routingConfig = {
    defaultAgentId: "default-agent",
    channelAgents: {
      telegram: "telegram-bot",
      discord: "discord-bot",
      web: "web-assistant",
    },
  };

  describe("End-to-End Message Flow", () => {
    it("should process CLI message through complete pipeline", () => {
      // ARRANGE: Raw message from CLI
      const rawMessage = {
        channel: "cli" as const,
        channelMessageId: "cli_001",
        userId: "user_123",
        content: "Hello, how are you?",
      };

      // ACT: Normalize message
      const normalized = normalizeMessage(rawMessage);

      // ASSERT: Message is properly normalized
      expect(normalized.id).toMatch(/^msg_\d+_/);
      expect(normalized.channel).toBe("cli");
      expect(normalized.userId).toBe("user_123");
      expect(normalized.content).toBe("Hello, how are you?");
      expect(normalized.agentId).toBe("default");
      expect(normalized.timestamp).toBeInstanceOf(Date);

      // ACT: Route message to agent
      const targetAgent = routeMessage(normalized, routingConfig);

      // ASSERT: Routed to default agent
      expect(targetAgent).toBe("default-agent");
    });

    it("should process Telegram message with @mention", () => {
      // ARRANGE: Telegram message with agent mention
      const rawMessage = {
        channel: "telegram" as const,
        channelMessageId: "tg_456",
        userId: "telegram_user_789",
        content: "@nova explain quantum computing",
      };

      // ACT: Normalize
      const normalized = normalizeMessage(rawMessage);

      // ASSERT: Normalized correctly
      expect(normalized.channel).toBe("telegram");
      expect(normalized.content).toBe("@nova explain quantum computing");

      // ACT: Route
      const targetAgent = routeMessage(normalized, routingConfig);

      // ASSERT: Routed to mentioned agent (not channel-specific bot)
      expect(targetAgent).toBe("nova");
    });

    it("should process Web message with attachments", () => {
      // ARRANGE: Web message with image attachment
      const rawMessage = {
        channel: "web" as const,
        channelMessageId: "web_789",
        userId: "web_user_456",
        content: "Check out this diagram",
        attachments: [
          {
            id: "att_001",
            type: "image",
            url: "https://example.com/diagram.png",
            filename: "diagram.png",
            mimeType: "image/png",
            size: 2048,
          },
        ],
        metadata: {
          ip: "192.168.1.1",
          userAgent: "Mozilla/5.0",
        },
      };

      // ACT: Normalize
      const normalized = normalizeMessage(rawMessage);

      // ASSERT: Attachments preserved
      expect(normalized.attachments).toHaveLength(1);
      expect(normalized.attachments?.[0].url).toBe(
        "https://example.com/diagram.png"
      );
      expect(normalized.metadata?.ip).toBe("192.168.1.1");

      // ACT: Route
      const targetAgent = routeMessage(normalized, routingConfig);

      // ASSERT: Routed to web assistant
      expect(targetAgent).toBe("web-assistant");
    });

    it("should handle Discord message without channel-specific agent", () => {
      // ARRANGE: Discord message
      const rawMessage = {
        channel: "discord" as const,
        channelMessageId: "discord_123",
        userId: "discord_user_999",
        content: "Hello from Discord!",
      };

      // ACT: Normalize
      const normalized = normalizeMessage(rawMessage);

      // ACT: Route
      const targetAgent = routeMessage(normalized, routingConfig);

      // ASSERT: Routed to channel-specific bot
      expect(targetAgent).toBe("discord-bot");
    });

    it("should handle API message with explicit agent assignment", () => {
      // ARRANGE: API message with pre-assigned agent
      const rawMessage = {
        channel: "api" as const,
        channelMessageId: "api_555",
        userId: "api_client_1",
        agentId: "customer-support-agent",
        content: "I need help with my order",
        metadata: {
          orderId: "ORDER-12345",
          priority: "high",
        },
      };

      // ACT: Normalize
      const normalized = normalizeMessage(rawMessage);

      // ASSERT: Agent preserved
      expect(normalized.agentId).toBe("customer-support-agent");

      // ACT: Route
      const targetAgent = routeMessage(normalized, routingConfig);

      // ASSERT: Uses pre-assigned agent
      expect(targetAgent).toBe("customer-support-agent");
    });
  });

  describe("Edge Cases and Error Handling", () => {
    it("should handle empty content gracefully", () => {
      const rawMessage = {
        channel: "cli" as const,
        channelMessageId: "cli_empty",
        userId: "user_1",
        content: "",
      };

      const normalized = normalizeMessage(rawMessage);
      const targetAgent = routeMessage(normalized, routingConfig);

      expect(normalized.content).toBe("");
      expect(targetAgent).toBe("default-agent");
    });

    it("should filter out invalid attachments", () => {
      const rawMessage = {
        channel: "web" as const,
        channelMessageId: "web_001",
        userId: "user_1",
        content: "Message with mixed attachments",
        attachments: [
          { type: "file", mimeType: "application/pdf", url: "https://example.com/valid.pdf" },
          "invalid_string",
          null,
          undefined,
          { type: "missing_mimetype" },
          { url: "att_2" }, // missing type and mimeType
        ],
      };

      const normalized = normalizeMessage(rawMessage);

      expect(normalized.attachments).toHaveLength(1);
      expect(normalized.attachments?.[0].type).toBe("file");
      expect(normalized.attachments?.[0].mimeType).toBe("application/pdf");
    });

    it("should handle multiple @mentions (use first one)", () => {
      const rawMessage = {
        channel: "telegram" as const,
        channelMessageId: "tg_multi",
        userId: "user_1",
        content: "@nova @ralph help me",
      };

      const normalized = normalizeMessage(rawMessage);
      const targetAgent = routeMessage(normalized, routingConfig);

      // Should route to first mentioned agent
      expect(targetAgent).toBe("nova");
    });

    it("should handle unknown channel type", () => {
      const rawMessage = {
        channel: "unknown" as any,
        channelMessageId: "unknown_001",
        userId: "user_1",
        content: "Test from unknown channel",
      };

      const normalized = normalizeMessage(rawMessage);
      const targetAgent = routeMessage(normalized, routingConfig);

      // Should fallback to default agent
      expect(targetAgent).toBe("default-agent");
    });
  });

  describe("Message ID Generation", () => {
    it("should generate unique IDs for each message", () => {
      const rawMessage = {
        channel: "cli" as const,
        channelMessageId: "cli_001",
        userId: "user_1",
        content: "Test",
      };

      const msg1 = normalizeMessage(rawMessage);
      const msg2 = normalizeMessage(rawMessage);

      expect(msg1.id).not.toBe(msg2.id);
      expect(msg1.id).toMatch(/^msg_\d+_/);
      expect(msg2.id).toMatch(/^msg_\d+_/);
    });
  });

  describe("Metadata Preservation", () => {
    it("should preserve custom metadata through pipeline", () => {
      const rawMessage = {
        channel: "api" as const,
        channelMessageId: "api_001",
        userId: "user_1",
        content: "Test",
        metadata: {
          customField: "value",
          nested: {
            data: true,
          },
        },
      };

      const normalized = normalizeMessage(rawMessage);

      expect(normalized.metadata?.customField).toBe("value");
      expect(normalized.metadata?.nested).toEqual({ data: true });
    });
  });
});
