import { describe, it, expect, vi, beforeEach } from "vitest";
import { OllamaProvider } from "./ollama";

// Mock the Ollama SDK
vi.mock("ollama", () => {
  const OllamaMock = vi.fn(function (this: any) {
    this.chat = vi.fn();
    this.list = vi.fn();
    this.pull = vi.fn();
  });
  return {
    Ollama: OllamaMock,
  };
});

describe("OllamaProvider", () => {
  let provider: OllamaProvider;
  let mockClient: any;

  beforeEach(() => {
    vi.clearAllMocks();
    provider = new OllamaProvider({
      host: "http://localhost:11434",
    });
    // Access the mocked client
    mockClient = (provider as any).client;
  });

  describe("Constructor", () => {
    it("should create provider with config", () => {
      const testProvider = new OllamaProvider({
        host: "http://localhost:11434",
      });

      expect(testProvider).toBeInstanceOf(OllamaProvider);
    });

    it("should use default host if not provided", () => {
      const testProvider = new OllamaProvider({});

      expect(testProvider).toBeInstanceOf(OllamaProvider);
    });

    it("should use environment variable for host if not provided", () => {
      process.env.OLLAMA_HOST = "http://custom-host:11434";

      const testProvider = new OllamaProvider({});

      expect(testProvider).toBeInstanceOf(OllamaProvider);

      delete process.env.OLLAMA_HOST;
    });
  });

  describe("chat()", () => {
    it("should successfully call Ollama chat API and return formatted response", async () => {
      const mockResponse = {
        message: {
          role: "assistant",
          content: "Hello! How can I help you today?",
        },
        done: true,
        prompt_eval_count: 10,
        eval_count: 20,
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Hello" }],
        "llama3.1",
        "You are helpful"
      );

      expect(result).toEqual({
        content: "Hello! How can I help you today?",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        model: "llama3.1",
        finishReason: "stop",
      });

      expect(mockClient.chat).toHaveBeenCalledWith({
        model: "llama3.1",
        messages: [{ role: "user", content: "Hello" }],
        options: {
          temperature: 0.7,
          num_predict: 4096,
        },
        system: "You are helpful",
      });
    });

    it("should handle custom temperature and maxTokens", async () => {
      const mockResponse = {
        message: { role: "assistant", content: "Response" },
        done: true,
        prompt_eval_count: 5,
        eval_count: 10,
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      await provider.chat(
        [{ role: "user", content: "Test" }],
        "mixtral",
        undefined,
        0.3,
        1024
      );

      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            temperature: 0.3,
            num_predict: 1024,
          },
        })
      );
    });

    it("should omit system prompt if not provided", async () => {
      const mockResponse = {
        message: { role: "assistant", content: "Response" },
        done: true,
        prompt_eval_count: 5,
        eval_count: 5,
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      await provider.chat(
        [{ role: "user", content: "Test" }],
        "codellama"
      );

      const callArg = mockClient.chat.mock.calls[0][0];
      expect(callArg).not.toHaveProperty("system");
    });

    it("should handle missing token counts", async () => {
      const mockResponse = {
        message: { role: "assistant", content: "Response" },
        done: true,
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "llama3.1"
      );

      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it("should handle done=false as finish reason", async () => {
      const mockResponse = {
        message: { role: "assistant", content: "Incomplete" },
        done: false,
        prompt_eval_count: 5,
        eval_count: 5,
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "llama3.1"
      );

      expect(result.finishReason).toBe("length");
    });

    it("should convert message format correctly", async () => {
      const mockResponse = {
        message: { role: "assistant", content: "Response" },
        done: true,
        prompt_eval_count: 15,
        eval_count: 20,
      };

      mockClient.chat.mockResolvedValue(mockResponse);

      await provider.chat(
        [
          { role: "user", content: "First message" },
          { role: "assistant", content: "First response" },
          { role: "user", content: "Second message" },
        ],
        "llama3.1"
      );

      const messages = mockClient.chat.mock.calls[0][0].messages;
      expect(messages).toHaveLength(3);
      expect(messages[0]).toEqual({ role: "user", content: "First message" });
      expect(messages[1]).toEqual({
        role: "assistant",
        content: "First response",
      });
      expect(messages[2]).toEqual({ role: "user", content: "Second message" });
    });
  });

  describe("chatStreaming()", () => {
    it("should successfully stream chat and return final response", async () => {
      const mockChunks = [
        {
          message: { content: "Hello" },
          done: false,
        },
        {
          message: { content: " " },
          done: false,
        },
        {
          message: { content: "World!" },
          done: false,
        },
        {
          message: { content: "" },
          done: true,
          prompt_eval_count: 10,
          eval_count: 15,
        },
      ];

      const mockAsyncIterator = async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      };

      mockClient.chat.mockReturnValue(mockAsyncIterator());

      const onChunk = vi.fn();
      const result = await provider.chatStreaming(
        [{ role: "user", content: "Hello" }],
        "llama3.1",
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
        model: "llama3.1",
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
          message: { content: "Response" },
          done: false,
        },
        {
          message: { content: "" },
          done: true,
          prompt_eval_count: 5,
          eval_count: 8,
        },
      ];

      const mockAsyncIterator = async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      };

      mockClient.chat.mockReturnValue(mockAsyncIterator());

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "mixtral"
      );

      expect(result.content).toBe("Response");
    });

    it("should skip chunks without message content", async () => {
      const mockChunks = [
        {
          message: { content: "Hello" },
          done: false,
        },
        {
          message: {},
          done: false,
        },
        {
          message: { content: "World" },
          done: false,
        },
        {
          done: true,
          prompt_eval_count: 5,
          eval_count: 10,
        },
      ];

      const mockAsyncIterator = async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      };

      mockClient.chat.mockReturnValue(mockAsyncIterator());

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "llama3.1"
      );

      expect(result.content).toBe("HelloWorld");
    });

    it("should capture token counts from final chunk", async () => {
      const mockChunks = [
        {
          message: { content: "Response" },
          done: false,
        },
        {
          message: { content: "" },
          done: true,
          prompt_eval_count: 25,
          eval_count: 30,
        },
      ];

      const mockAsyncIterator = async function* () {
        for (const chunk of mockChunks) {
          yield chunk;
        }
      };

      mockClient.chat.mockReturnValue(mockAsyncIterator());

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "llama3.1"
      );

      expect(result.usage.promptTokens).toBe(25);
      expect(result.usage.completionTokens).toBe(30);
      expect(result.finishReason).toBe("stop");
    });

    it("should handle empty stream", async () => {
      const mockAsyncIterator = async function* () {};

      mockClient.chat.mockReturnValue(mockAsyncIterator());

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "llama3.1"
      );

      expect(result.content).toBe("");
      expect(result.finishReason).toBe("stop");
    });

    it("should pass custom temperature and maxTokens", async () => {
      const mockAsyncIterator = async function* () {};

      mockClient.chat.mockReturnValue(mockAsyncIterator());

      await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "mixtral",
        "You are helpful",
        undefined,
        0.2,
        512
      );

      expect(mockClient.chat).toHaveBeenCalledWith(
        expect.objectContaining({
          options: {
            temperature: 0.2,
            num_predict: 512,
          },
          stream: true,
        })
      );
    });
  });

  describe("listModels()", () => {
    it("should list available models", async () => {
      const mockResponse = {
        models: [
          { name: "llama3.1:latest" },
          { name: "mixtral:latest" },
          { name: "codellama:7b" },
        ],
      };

      mockClient.list.mockResolvedValue(mockResponse);

      const models = await provider.listModels();

      expect(models).toEqual([
        "llama3.1:latest",
        "mixtral:latest",
        "codellama:7b",
      ]);
      expect(mockClient.list).toHaveBeenCalled();
    });

    it("should return empty array if no models", async () => {
      const mockResponse = {
        models: [],
      };

      mockClient.list.mockResolvedValue(mockResponse);

      const models = await provider.listModels();

      expect(models).toEqual([]);
    });
  });

  describe("pullModel()", () => {
    it("should pull a model", async () => {
      mockClient.pull.mockResolvedValue({ status: "success" });

      await provider.pullModel("llama3.1");

      expect(mockClient.pull).toHaveBeenCalledWith({ model: "llama3.1" });
    });
  });

  describe("hasModel()", () => {
    it("should return true if model exists", async () => {
      const mockResponse = {
        models: [{ name: "llama3.1:latest" }, { name: "mixtral:latest" }],
      };

      mockClient.list.mockResolvedValue(mockResponse);

      const hasModel = await provider.hasModel("llama3.1:latest");

      expect(hasModel).toBe(true);
    });

    it("should return false if model does not exist", async () => {
      const mockResponse = {
        models: [{ name: "llama3.1:latest" }],
      };

      mockClient.list.mockResolvedValue(mockResponse);

      const hasModel = await provider.hasModel("codellama:7b");

      expect(hasModel).toBe(false);
    });

    it("should return false if no models available", async () => {
      const mockResponse = {
        models: [],
      };

      mockClient.list.mockResolvedValue(mockResponse);

      const hasModel = await provider.hasModel("llama3.1");

      expect(hasModel).toBe(false);
    });
  });
});
