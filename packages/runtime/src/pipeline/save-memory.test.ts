import { describe, it, expect, vi, beforeEach } from "vitest";
import { saveMemory } from "./save-memory";
import type { Message } from "@agentik-os/shared";
import type { MemoryLoader } from "./load-memory";

describe("saveMemory", () => {
  let mockLoader: MemoryLoader;
  const agentId = "agent_1";
  const userId = "user_1";

  const mockUserMessage: Message = {
    id: "msg_1",
    channel: "cli",
    channelMessageId: "cli_msg_1",
    userId: "user_1",
    agentId: "agent_1",
    content: "Test user message",
    timestamp: new Date("2026-02-14T08:00:00Z"),
  };

  beforeEach(() => {
    mockLoader = {
      saveMessage: vi.fn(),
      loadContext: vi.fn(),
    } as any;
  });

  it("should save both user message and assistant response", async () => {
    const assistantResponse = "Test assistant response";

    await saveMemory(mockLoader, agentId, userId, mockUserMessage, assistantResponse);

    expect(mockLoader.saveMessage).toHaveBeenCalledTimes(2);
  });

  it("should save user message first", async () => {
    const assistantResponse = "Test assistant response";

    await saveMemory(mockLoader, agentId, userId, mockUserMessage, assistantResponse);

    const firstCall = vi.mocked(mockLoader.saveMessage).mock.calls[0];
    expect(firstCall[0]).toBe(agentId);
    expect(firstCall[1]).toBe(userId);
    expect(firstCall[2]).toEqual(mockUserMessage);
  });

  it("should create and save assistant response message", async () => {
    const assistantResponse = "Test assistant response";

    await saveMemory(mockLoader, agentId, userId, mockUserMessage, assistantResponse);

    const secondCall = vi.mocked(mockLoader.saveMessage).mock.calls[1];
    expect(secondCall[0]).toBe(agentId);
    expect(secondCall[1]).toBe(userId);

    const responseMessage = secondCall[2];
    expect(responseMessage).toMatchObject({
      id: expect.stringContaining("resp_"),
      channel: "cli",
      channelMessageId: "cli_msg_1_resp",
      userId: agentId, // Assistant is the userId
      agentId,
      content: assistantResponse,
      metadata: { isAssistantResponse: true },
      timestamp: expect.any(Date),
    });
  });

  it("should use original message channel", async () => {
    const telegramMessage: Message = {
      ...mockUserMessage,
      channel: "telegram",
      channelMessageId: "tg_123",
    };

    await saveMemory(mockLoader, agentId, userId, telegramMessage, "Response");

    const secondCall = vi.mocked(mockLoader.saveMessage).mock.calls[1];
    expect(secondCall[2].channel).toBe("telegram");
  });

  it("should append _resp to channel message ID", async () => {
    const messageWithCustomId: Message = {
      ...mockUserMessage,
      channelMessageId: "custom_message_id",
    };

    await saveMemory(mockLoader, agentId, userId, messageWithCustomId, "Response");

    const secondCall = vi.mocked(mockLoader.saveMessage).mock.calls[1];
    expect(secondCall[2].channelMessageId).toBe("custom_message_id_resp");
  });

  it("should mark response with isAssistantResponse metadata", async () => {
    await saveMemory(mockLoader, agentId, userId, mockUserMessage, "Response");

    const secondCall = vi.mocked(mockLoader.saveMessage).mock.calls[1];
    expect(secondCall[2].metadata).toEqual({ isAssistantResponse: true });
  });

  it("should handle empty assistant response", async () => {
    await saveMemory(mockLoader, agentId, userId, mockUserMessage, "");

    const secondCall = vi.mocked(mockLoader.saveMessage).mock.calls[1];
    expect(secondCall[2].content).toBe("");
  });

  it("should handle long assistant response", async () => {
    const longResponse = "A".repeat(10000);

    await saveMemory(mockLoader, agentId, userId, mockUserMessage, longResponse);

    const secondCall = vi.mocked(mockLoader.saveMessage).mock.calls[1];
    expect(secondCall[2].content).toBe(longResponse);
    expect(secondCall[2].content.length).toBe(10000);
  });

  it("should generate unique response IDs", async () => {
    await saveMemory(mockLoader, agentId, userId, mockUserMessage, "Response 1");
    await new Promise((resolve) => setTimeout(resolve, 2)); // Small delay
    await saveMemory(mockLoader, agentId, userId, mockUserMessage, "Response 2");

    const firstResponseCall = vi.mocked(mockLoader.saveMessage).mock.calls[1];
    const secondResponseCall = vi.mocked(mockLoader.saveMessage).mock.calls[3];

    expect(firstResponseCall[2].id).not.toBe(secondResponseCall[2].id);
  });

  it("should preserve agentId in both saves", async () => {
    const customAgentId = "custom_agent_123";

    await saveMemory(
      mockLoader,
      customAgentId,
      userId,
      mockUserMessage,
      "Response"
    );

    expect(vi.mocked(mockLoader.saveMessage).mock.calls[0][0]).toBe(
      customAgentId
    );
    expect(vi.mocked(mockLoader.saveMessage).mock.calls[1][0]).toBe(
      customAgentId
    );
  });

  it("should preserve userId in both saves", async () => {
    const customUserId = "custom_user_456";

    await saveMemory(
      mockLoader,
      agentId,
      customUserId,
      mockUserMessage,
      "Response"
    );

    expect(vi.mocked(mockLoader.saveMessage).mock.calls[0][1]).toBe(
      customUserId
    );
    expect(vi.mocked(mockLoader.saveMessage).mock.calls[1][1]).toBe(
      customUserId
    );
  });

  it("should complete without errors", async () => {
    await expect(
      saveMemory(mockLoader, agentId, userId, mockUserMessage, "Response")
    ).resolves.toBeUndefined();
  });
});
