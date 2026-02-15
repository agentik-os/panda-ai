import { describe, it, expect, vi, beforeEach } from "vitest";
import { AnthropicProvider } from "./anthropic";
import type Anthropic from "@anthropic-ai/sdk";

// Mock the Anthropic SDK
vi.mock("@anthropic-ai/sdk", () => {
  const AnthropicMock = vi.fn(function (this: any) {
    this.messages = {
      create: vi.fn(),
      stream: vi.fn(),
    };
  });
  return {
    default: AnthropicMock,
  };
});

describe("AnthropicProvider", () => {
  let provider: AnthropicProvider;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new AnthropicProvider({
      apiKey: "test-key",
    });
    // Access the mocked client
    mockClient = (provider as any).client;
  });

  describe("Constructor", () => {
    it("should create provider with config", () => {
      const testProvider = new AnthropicProvider({
        apiKey: "test-key",
      });

      expect(testProvider).toBeInstanceOf(AnthropicProvider);
    });

    it("should accept custom baseURL", () => {
      const testProvider = new AnthropicProvider({
        apiKey: "test-key",
        baseURL: "https://custom-api.com",
      });

      expect(testProvider).toBeInstanceOf(AnthropicProvider);
    });
  });

  describe("chat()", () => {
    it("should successfully call chat API and return formatted response", async () => {
      // Mock API response
      const mockResponse = {
        id: "msg_123",
        type: "message",
        role: "assistant",
        content: [
          {
            type: "text",
            text: "Hello! How can I help you today?",
          },
        ],
        model: "claude-sonnet-4-5-20250929",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Hello" }],
        "claude-sonnet-4-5-20250929",
        "You are a helpful assistant"
      );

      expect(result).toEqual({
        content: "Hello! How can I help you today?",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        model: "claude-sonnet-4-5-20250929",
        finishReason: "end_turn",
      });

      expect(mockClient.messages.create).toHaveBeenCalledWith({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 4096,
        temperature: 0.7,
        system: "You are a helpful assistant",
        messages: [{ role: "user", content: "Hello" }],
      });
    });

    it("should handle custom temperature and maxTokens", async () => {
      const mockResponse = {
        content: [{ type: "text", text: "Response" }],
        model: "claude-haiku-4-5-20251001",
        stop_reason: "end_turn",
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      await provider.chat(
        [{ role: "user", content: "Test" }],
        "claude-haiku-4-5-20251001",
        undefined,
        0.5,
        2048
      );

      expect(mockClient.messages.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.5,
          max_tokens: 2048,
        })
      );
    });

    it("should handle empty content response", async () => {
      const mockResponse = {
        content: [],
        model: "claude-sonnet-4-5-20250929",
        stop_reason: "end_turn",
        usage: { input_tokens: 5, output_tokens: 0 },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "claude-sonnet-4-5-20250929"
      );

      expect(result.content).toBe("");
    });

    it("should handle non-text content blocks", async () => {
      const mockResponse = {
        content: [
          {
            type: "tool_use",
            id: "tool_123",
            name: "calculator",
          },
        ],
        model: "claude-sonnet-4-5-20250929",
        stop_reason: "tool_use",
        usage: { input_tokens: 10, output_tokens: 5 },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Calculate 2+2" }],
        "claude-sonnet-4-5-20250929"
      );

      expect(result.content).toBe("");
      expect(result.finishReason).toBe("tool_use");
    });

    it("should default stop_reason to 'stop' if missing", async () => {
      const mockResponse = {
        content: [{ type: "text", text: "Response" }],
        model: "claude-sonnet-4-5-20250929",
        stop_reason: null,
        usage: { input_tokens: 5, output_tokens: 10 },
      };

      mockClient.messages.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "claude-sonnet-4-5-20250929"
      );

      expect(result.finishReason).toBe("stop");
    });
  });

  describe("chatStreaming()", () => {
    it("should successfully stream chat and return final response", async () => {
      const mockChunks = [
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hello" },
        },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: " " },
        },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "World!" },
        },
      ];

      const mockFinalMessage = {
        model: "claude-sonnet-4-5-20250929",
        stop_reason: "end_turn",
        usage: {
          input_tokens: 10,
          output_tokens: 15,
        },
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
        finalMessage: vi.fn().mockResolvedValue(mockFinalMessage),
      };

      mockClient.messages.stream.mockResolvedValue(mockStream);

      const onChunk = vi.fn();
      const result = await provider.chatStreaming(
        [{ role: "user", content: "Hello" }],
        "claude-sonnet-4-5-20250929",
        "You are helpful",
        onChunk
      );

      expect(result).toEqual({
        content: "Hello World!",
        usage: {
          promptTokens: 10,
          completionTokens: 15,
          totalTokens: 25,
        },
        model: "claude-sonnet-4-5-20250929",
        finishReason: "end_turn",
      });

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, "Hello");
      expect(onChunk).toHaveBeenNthCalledWith(2, " ");
      expect(onChunk).toHaveBeenNthCalledWith(3, "World!");
    });

    it("should handle streaming without onChunk callback", async () => {
      const mockChunks = [
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Response" },
        },
      ];

      const mockFinalMessage = {
        model: "claude-haiku-4-5-20251001",
        stop_reason: "end_turn",
        usage: { input_tokens: 5, output_tokens: 8 },
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
        finalMessage: vi.fn().mockResolvedValue(mockFinalMessage),
      };

      mockClient.messages.stream.mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "claude-haiku-4-5-20251001"
      );

      expect(result.content).toBe("Response");
    });

    it("should skip non-text-delta chunks", async () => {
      const mockChunks = [
        { type: "message_start" },
        {
          type: "content_block_delta",
          delta: { type: "text_delta", text: "Hello" },
        },
        { type: "content_block_stop" },
        {
          type: "content_block_delta",
          delta: { type: "tool_use", id: "tool_123" },
        },
      ];

      const mockFinalMessage = {
        model: "claude-sonnet-4-5-20250929",
        stop_reason: "end_turn",
        usage: { input_tokens: 5, output_tokens: 5 },
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
        finalMessage: vi.fn().mockResolvedValue(mockFinalMessage),
      };

      mockClient.messages.stream.mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "claude-sonnet-4-5-20250929"
      );

      expect(result.content).toBe("Hello");
    });

    it("should default stop_reason to 'stop' if missing", async () => {
      const mockFinalMessage = {
        model: "claude-sonnet-4-5-20250929",
        stop_reason: null,
        usage: { input_tokens: 5, output_tokens: 5 },
      };

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {},
        finalMessage: vi.fn().mockResolvedValue(mockFinalMessage),
      };

      mockClient.messages.stream.mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "claude-sonnet-4-5-20250929"
      );

      expect(result.finishReason).toBe("stop");
    });
  });
});
