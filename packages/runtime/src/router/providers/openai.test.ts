import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpenAIProvider } from "./openai";

// Mock the OpenAI SDK
vi.mock("openai", () => {
  const OpenAIMock = vi.fn(function (this: any) {
    this.chat = {
      completions: {
        create: vi.fn(),
      },
    };
  });
  return {
    default: OpenAIMock,
  };
});

describe("OpenAIProvider", () => {
  let provider: OpenAIProvider;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OpenAIProvider({
      apiKey: "test-key",
    });
    // Access the mocked client
    mockClient = (provider as any).client;
  });

  describe("Constructor", () => {
    it("should create provider with config", () => {
      const testProvider = new OpenAIProvider({
        apiKey: "test-key",
      });

      expect(testProvider).toBeInstanceOf(OpenAIProvider);
    });

    it("should accept custom baseURL", () => {
      const testProvider = new OpenAIProvider({
        apiKey: "test-key",
        baseURL: "https://custom-openai-api.com",
      });

      expect(testProvider).toBeInstanceOf(OpenAIProvider);
    });
  });

  describe("chat()", () => {
    it("should successfully call chat API and return formatted response", async () => {
      // Mock API response
      const mockResponse = {
        id: "chatcmpl-123",
        object: "chat.completion",
        created: 1677652288,
        model: "gpt-4o",
        choices: [
          {
            index: 0,
            message: {
              role: "assistant",
              content: "Hello! How can I assist you today?",
            },
            finish_reason: "stop",
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
        ],
        "gpt-4o"
      );

      expect(result).toEqual({
        content: "Hello! How can I assist you today?",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        model: "gpt-4o",
        finishReason: "stop",
      });

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith({
        model: "gpt-4o",
        messages: [
          { role: "system", content: "You are helpful" },
          { role: "user", content: "Hello" },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      });
    });

    it("should handle custom temperature and maxTokens", async () => {
      const mockResponse = {
        choices: [
          {
            message: { role: "assistant", content: "Response" },
            finish_reason: "stop",
          },
        ],
        model: "gpt-4o-mini",
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      await provider.chat(
        [{ role: "user", content: "Test" }],
        "gpt-4o-mini",
        0.3,
        1024
      );

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.3,
          max_tokens: 1024,
        })
      );
    });

    it("should throw error when no completion choice returned", async () => {
      const mockResponse = {
        choices: [],
        model: "gpt-4o",
        usage: { prompt_tokens: 5, completion_tokens: 0, total_tokens: 5 },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      await expect(
        provider.chat([{ role: "user", content: "Test" }], "gpt-4o")
      ).rejects.toThrow("No completion choice returned from OpenAI");
    });

    it("should handle null message content", async () => {
      const mockResponse = {
        choices: [
          {
            message: { role: "assistant", content: null },
            finish_reason: "length",
          },
        ],
        model: "gpt-4o",
        usage: { prompt_tokens: 5, completion_tokens: 10, total_tokens: 15 },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "gpt-4o"
      );

      expect(result.content).toBe("");
    });

    it("should handle missing usage data", async () => {
      const mockResponse = {
        choices: [
          {
            message: { role: "assistant", content: "Response" },
            finish_reason: "stop",
          },
        ],
        model: "gpt-4o",
        usage: undefined,
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "gpt-4o"
      );

      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it("should default finish_reason to 'stop' if missing", async () => {
      const mockResponse = {
        choices: [
          {
            message: { role: "assistant", content: "Response" },
            finish_reason: null,
          },
        ],
        model: "gpt-4o",
        usage: { prompt_tokens: 5, completion_tokens: 5, total_tokens: 10 },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "gpt-4o"
      );

      expect(result.finishReason).toBe("stop");
    });
  });

  describe("chatStreaming()", () => {
    it("should successfully stream chat and return final response", async () => {
      const mockChunks = [
        {
          choices: [
            {
              delta: { content: "Hello" },
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            {
              delta: { content: " " },
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            {
              delta: { content: "World!" },
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            {
              delta: {},
              finish_reason: "stop",
            },
          ],
        },
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const onChunk = vi.fn();
      const result = await provider.chatStreaming(
        [{ role: "user", content: "Hello" }],
        "gpt-4o",
        onChunk
      );

      expect(result).toEqual({
        content: "Hello World!",
        usage: {
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
        },
        model: "gpt-4o",
        finishReason: "stop",
      });

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, "Hello");
      expect(onChunk).toHaveBeenNthCalledWith(2, " ");
      expect(onChunk).toHaveBeenNthCalledWith(3, "World!");
    });

    it("should handle streaming without onChunk callback", async () => {
      const mockChunks = [
        {
          choices: [
            {
              delta: { content: "Response" },
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            {
              delta: {},
              finish_reason: "stop",
            },
          ],
        },
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gpt-4o"
      );

      expect(result.content).toBe("Response");
    });

    it("should handle chunks without delta content", async () => {
      const mockChunks = [
        {
          choices: [
            {
              delta: {},
              finish_reason: null,
            },
          ],
        },
        {
          choices: [
            {
              delta: { content: "Hello" },
              finish_reason: null,
            },
          ],
        },
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gpt-4o"
      );

      expect(result.content).toBe("Hello");
    });

    it("should default finishReason to 'stop' if never set", async () => {
      const mockChunks = [
        {
          choices: [
            {
              delta: { content: "Response" },
              finish_reason: null,
            },
          ],
        },
      ];

      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          for (const chunk of mockChunks) {
            yield chunk;
          }
        },
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gpt-4o"
      );

      expect(result.finishReason).toBe("stop");
    });

    it("should handle empty stream", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {},
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gpt-4o"
      );

      expect(result.content).toBe("");
      expect(result.finishReason).toBe("stop");
    });

    it("should pass custom temperature and maxTokens", async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {},
      };

      mockClient.chat.completions.create.mockResolvedValue(mockStream);

      await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gpt-4o-mini",
        undefined,
        0.2,
        512
      );

      expect(mockClient.chat.completions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          temperature: 0.2,
          max_tokens: 512,
          stream: true,
        })
      );
    });
  });
});
