import { describe, it, expect, vi, beforeEach } from "vitest";
import { executeModel } from "./execute";
import type { Message, MessageContext, ModelResponse } from "@agentik-os/shared";
import type { ModelSelection } from "../router/selector";
import { AnthropicProvider } from "../router/providers/anthropic";
import { OpenAIProvider } from "../router/providers/openai";

// Mock the provider modules
vi.mock("../router/providers/anthropic");
vi.mock("../router/providers/openai");

describe("executeModel", () => {
  const mockMessage: Message = {
    id: "msg_1",
    content: "Test message",
    userId: "user_1",
    channelId: "cli",
    timestamp: new Date(),
  };

  const mockContext: MessageContext = {
    agentId: "agent_1",
    sessionId: "session_1",
    messages: [
      {
        id: "msg_0",
        content: "Previous message",
        userId: "agent_1",
        channelId: "cli",
        timestamp: new Date(),
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Anthropic provider", () => {
    const modelSelection: ModelSelection = {
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      reason: "balanced",
      complexity: "medium",
    };

    const mockResponse: ModelResponse = {
      content: "Test response",
      model: "claude-sonnet-4-5",
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };

    it("should call Anthropic provider with correct parameters", async () => {
      const chatMock = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(AnthropicProvider).mockImplementation(function(this: any) {
        this.chat = chatMock;
        return this;
      } as any);

      const result = await executeModel(mockMessage, mockContext, modelSelection, {
        anthropicApiKey: "test-key",
        systemPrompt: "You are a helpful assistant",
        temperature: 0.7,
        maxTokens: 1000,
      });

      expect(chatMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          { role: "assistant", content: "Previous message" },
          { role: "user", content: "Test message" },
        ]),
        "claude-sonnet-4-5",
        "You are a helpful assistant",
        0.7,
        1000
      );
      expect(result).toEqual(mockResponse);
    });

    it("should build conversation history correctly", async () => {
      const chatMock = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(AnthropicProvider).mockImplementation(function(this: any) {
        this.chat = chatMock;
        return this;
      } as any);

      const contextWithMultipleMessages: MessageContext = {
        agentId: "agent_1",
        sessionId: "session_1",
        messages: [
          {
            id: "msg_0",
            content: "User message 1",
            userId: "user_1",
            channelId: "cli",
            timestamp: new Date(),
          },
          {
            id: "msg_1",
            content: "Agent response 1",
            userId: "agent_1",
            channelId: "cli",
            timestamp: new Date(),
          },
          {
            id: "msg_2",
            content: "User message 2",
            userId: "user_1",
            channelId: "cli",
            timestamp: new Date(),
          },
        ],
      };

      await executeModel(mockMessage, contextWithMultipleMessages, modelSelection, {
        anthropicApiKey: "test-key",
      });

      expect(chatMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          { role: "user", content: "User message 1" },
          { role: "assistant", content: "Agent response 1" },
          { role: "user", content: "User message 2" },
          { role: "user", content: "Test message" },
        ]),
        expect.any(String),
        undefined,
        undefined,
        undefined
      );
    });

    it("should throw error if API key is missing", async () => {
      await expect(
        executeModel(mockMessage, mockContext, modelSelection, {})
      ).rejects.toThrow("Anthropic API key not configured");
    });

    it("should handle empty context messages", async () => {
      const chatMock = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(AnthropicProvider).mockImplementation(function(this: any) {
        this.chat = chatMock;
        return this;
      } as any);

      const emptyContext: MessageContext = {
        agentId: "agent_1",
        sessionId: "session_1",
        messages: [],
      };

      await executeModel(mockMessage, emptyContext, modelSelection, {
        anthropicApiKey: "test-key",
      });

      expect(chatMock).toHaveBeenCalledWith(
        [{ role: "user", content: "Test message" }],
        expect.any(String),
        undefined,
        undefined,
        undefined
      );
    });
  });

  describe("OpenAI provider", () => {
    const modelSelection: ModelSelection = {
      provider: "openai",
      model: "gpt-4o",
      reason: "high-quality",
      complexity: "high",
    };

    const mockResponse: ModelResponse = {
      content: "Test response",
      model: "gpt-4o",
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };

    it("should call OpenAI provider with correct parameters", async () => {
      const chatMock = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(OpenAIProvider).mockImplementation(function(this: any) {
        this.chat = chatMock;
        return this;
      } as any);

      const result = await executeModel(mockMessage, mockContext, modelSelection, {
        openaiApiKey: "test-key",
        systemPrompt: "You are a helpful assistant",
        temperature: 0.7,
        maxTokens: 1000,
      });

      expect(chatMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          { role: "system", content: "You are a helpful assistant" },
          { role: "assistant", content: "Previous message" },
          { role: "user", content: "Test message" },
        ]),
        "gpt-4o",
        0.7,
        1000
      );
      expect(result).toEqual(mockResponse);
    });

    it("should work without system prompt", async () => {
      const chatMock = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(OpenAIProvider).mockImplementation(function(this: any) {
        this.chat = chatMock;
        return this;
      } as any);

      await executeModel(mockMessage, mockContext, modelSelection, {
        openaiApiKey: "test-key",
      });

      const call = chatMock.mock.calls[0][0];
      expect(call[0].role).not.toBe("system");
      expect(call[0].role).toBe("assistant");
    });

    it("should throw error if API key is missing", async () => {
      await expect(
        executeModel(mockMessage, mockContext, modelSelection, {})
      ).rejects.toThrow("OpenAI API key not configured");
    });
  });

  describe("Unsupported providers", () => {
    it("should throw error for unsupported provider", async () => {
      const modelSelection: ModelSelection = {
        provider: "gemini" as any,
        model: "gemini-2.0-flash-exp",
        reason: "experimental",
        complexity: "medium",
      };

      await expect(
        executeModel(mockMessage, mockContext, modelSelection, {})
      ).rejects.toThrow("Provider gemini not yet implemented");
    });
  });

  describe("Configuration handling", () => {
    const modelSelection: ModelSelection = {
      provider: "anthropic",
      model: "claude-sonnet-4-20250514",
      reason: "balanced",
      complexity: "medium",
    };

    const mockResponse: ModelResponse = {
      content: "Test response",
      model: "claude-sonnet-4-20250514",
      usage: {
        promptTokens: 100,
        completionTokens: 50,
        totalTokens: 150,
      },
    };

    it("should use default values when config is minimal", async () => {
      const chatMock = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(AnthropicProvider).mockImplementation(function(this: any) {
        this.chat = chatMock;
        return this;
      } as any);

      await executeModel(mockMessage, mockContext, modelSelection, {
        anthropicApiKey: "test-key",
      });

      expect(chatMock).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        undefined,
        undefined,
        undefined
      );
    });

    it("should pass all config parameters when provided", async () => {
      const chatMock = vi.fn().mockResolvedValue(mockResponse);
      vi.mocked(AnthropicProvider).mockImplementation(function(this: any) {
        this.chat = chatMock;
        return this;
      } as any);

      await executeModel(mockMessage, mockContext, modelSelection, {
        anthropicApiKey: "test-key",
        systemPrompt: "Custom prompt",
        temperature: 0.9,
        maxTokens: 2000,
      });

      expect(chatMock).toHaveBeenCalledWith(
        expect.any(Array),
        expect.any(String),
        "Custom prompt",
        0.9,
        2000
      );
    });
  });
});
