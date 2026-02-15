import { describe, it, expect } from "vitest";
import { sendResponse } from "./send-response";
import type { Message } from "@agentik-os/shared";

describe("sendResponse", () => {
  const mockMessage: Message = {
    id: "msg_1",
    channel: "cli",
    channelMessageId: "cli_msg_1",
    userId: "user_1",
    agentId: "agent_1",
    content: "Test message",
    timestamp: new Date("2026-02-14T08:00:00Z"),
  };

  it("should create response message with correct structure", async () => {
    const response = await sendResponse(mockMessage, "Test response");

    expect(response).toMatchObject({
      channel: "cli",
      channelMessageId: "cli_msg_1_response",
      userId: "agent_1",
      content: "Test response",
      metadata: {
        inReplyTo: "msg_1",
      },
    });
  });

  it("should use original message channel", async () => {
    const telegramMessage: Message = {
      ...mockMessage,
      channel: "telegram",
    };

    const response = await sendResponse(telegramMessage, "Response");

    expect(response.channel).toBe("telegram");
  });

  it("should append _response to channel message ID", async () => {
    const response = await sendResponse(mockMessage, "Response");

    expect(response.channelMessageId).toBe("cli_msg_1_response");
  });

  it("should use agentId as userId", async () => {
    const customAgentMessage: Message = {
      ...mockMessage,
      agentId: "custom_agent_123",
    };

    const response = await sendResponse(customAgentMessage, "Response");

    expect(response.userId).toBe("custom_agent_123");
  });

  it("should include inReplyTo metadata", async () => {
    const response = await sendResponse(mockMessage, "Response");

    expect(response.metadata).toEqual({
      inReplyTo: "msg_1",
    });
  });

  it("should preserve response content", async () => {
    const responseText = "This is a detailed response with multiple lines.";
    const response = await sendResponse(mockMessage, responseText);

    expect(response.content).toBe(responseText);
  });

  it("should handle empty response content", async () => {
    const response = await sendResponse(mockMessage, "");

    expect(response.content).toBe("");
  });

  it("should handle long response content", async () => {
    const longResponse = "A".repeat(10000);
    const response = await sendResponse(mockMessage, longResponse);

    expect(response.content).toBe(longResponse);
    expect(response.content.length).toBe(10000);
  });

  it("should handle special characters in response", async () => {
    const specialResponse =
      "Test with 🎉 emojis, \n newlines, \t tabs, and \"quotes\"";
    const response = await sendResponse(mockMessage, specialResponse);

    expect(response.content).toBe(specialResponse);
  });

  it("should work with different channel message ID formats", async () => {
    const customMessage: Message = {
      ...mockMessage,
      channelMessageId: "discord_12345_67890",
    };

    const response = await sendResponse(customMessage, "Response");

    expect(response.channelMessageId).toBe("discord_12345_67890_response");
  });

  it("should work with Discord channel", async () => {
    const discordMessage: Message = {
      ...mockMessage,
      channel: "discord",
      channelMessageId: "discord_msg_123",
    };

    const response = await sendResponse(discordMessage, "Discord response");

    expect(response.channel).toBe("discord");
    expect(response.channelMessageId).toBe("discord_msg_123_response");
  });

  it("should work with Telegram channel", async () => {
    const telegramMessage: Message = {
      ...mockMessage,
      channel: "telegram",
      channelMessageId: "tg_msg_456",
    };

    const response = await sendResponse(telegramMessage, "Telegram response");

    expect(response.channel).toBe("telegram");
    expect(response.channelMessageId).toBe("tg_msg_456_response");
  });

  it("should work with API channel", async () => {
    const apiMessage: Message = {
      ...mockMessage,
      channel: "api",
      channelMessageId: "api_request_789",
    };

    const response = await sendResponse(apiMessage, "API response");

    expect(response.channel).toBe("api");
    expect(response.channelMessageId).toBe("api_request_789_response");
  });

  it("should return Promise<ResponseMessage>", async () => {
    const response = await sendResponse(mockMessage, "Response");

    expect(response).toBeDefined();
    expect(typeof response).toBe("object");
    expect(response.channel).toBeDefined();
    expect(response.channelMessageId).toBeDefined();
    expect(response.userId).toBeDefined();
    expect(response.content).toBeDefined();
  });

  it("should not modify original message", async () => {
    const originalChannelMessageId = mockMessage.channelMessageId;
    const originalContent = mockMessage.content;

    await sendResponse(mockMessage, "New response");

    expect(mockMessage.channelMessageId).toBe(originalChannelMessageId);
    expect(mockMessage.content).toBe(originalContent);
  });
});
