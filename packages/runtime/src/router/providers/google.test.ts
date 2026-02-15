import { describe, it, expect, vi, beforeEach } from "vitest";
import { GoogleProvider } from "./google";

// Mock google-auth-library
const mockGetClient = vi.fn();
const mockGetAccessToken = vi.fn();

vi.mock("google-auth-library", () => {
  const GoogleAuthMock = vi.fn(function (this: any) {
    this.getClient = mockGetClient;
  });
  return {
    GoogleAuth: GoogleAuthMock,
  };
});

// Mock global fetch
global.fetch = vi.fn();

describe("GoogleProvider", () => {
  let provider: GoogleProvider;

  beforeEach(() => {
    vi.clearAllMocks();

    // Setup default auth mocks
    mockGetAccessToken.mockResolvedValue({ token: "test-access-token" });
    mockGetClient.mockResolvedValue({
      getAccessToken: mockGetAccessToken,
    });

    provider = new GoogleProvider({
      projectId: "test-project",
      location: "us-central1",
    });
  });

  describe("Constructor", () => {
    it("should create provider with config", () => {
      const testProvider = new GoogleProvider({
        projectId: "my-project",
        location: "us-central1",
      });

      expect(testProvider).toBeInstanceOf(GoogleProvider);
    });

    it("should use environment variable for projectId if not provided", () => {
      process.env.GOOGLE_CLOUD_PROJECT = "env-project";

      const testProvider = new GoogleProvider({});

      expect(testProvider).toBeInstanceOf(GoogleProvider);

      delete process.env.GOOGLE_CLOUD_PROJECT;
    });

    it("should throw error if projectId is not provided", () => {
      delete process.env.GOOGLE_CLOUD_PROJECT;

      expect(() => new GoogleProvider({})).toThrow(
        "Google Cloud project ID is required"
      );
    });

    it("should accept custom location", () => {
      const testProvider = new GoogleProvider({
        projectId: "test-project",
        location: "europe-west1",
      });

      expect(testProvider).toBeInstanceOf(GoogleProvider);
    });
  });

  describe("chat()", () => {
    it("should successfully call Gemini API and return formatted response", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [{ text: "Hello! How can I help you today?" }],
              },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 10,
            candidatesTokenCount: 20,
            totalTokenCount: 30,
          },
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Hello" }],
        "gemini-2.0-flash-exp",
        "You are helpful"
      );

      expect(result).toEqual({
        content: "Hello! How can I help you today?",
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
        model: "gemini-2.0-flash-exp",
        finishReason: "STOP",
      });

      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining("us-central1-aiplatform.googleapis.com"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer test-access-token",
            "Content-Type": "application/json",
          }),
        })
      );
    });

    it("should handle custom temperature and maxTokens", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: "Response" }] },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 10,
            totalTokenCount: 15,
          },
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await provider.chat(
        [{ role: "user", content: "Test" }],
        "gemini-pro",
        undefined,
        0.3,
        1024
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.generationConfig).toEqual({
        temperature: 0.3,
        maxOutputTokens: 1024,
      });
    });

    it("should format messages with system prompt", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: "Response" }] },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 5,
            totalTokenCount: 10,
          },
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await provider.chat(
        [
          { role: "user", content: "First message" },
          { role: "assistant", content: "First response" },
          { role: "user", content: "Second message" },
        ],
        "gemini-pro",
        "You are a helpful assistant"
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.contents).toHaveLength(4);
      expect(body.contents[0]).toEqual({
        role: "user",
        parts: [
          {
            text: expect.stringContaining("System: You are a helpful assistant"),
          },
        ],
      });
      expect(body.contents[1].role).toBe("user");
      expect(body.contents[2].role).toBe("model");
      expect(body.contents[3].role).toBe("user");
    });

    it("should handle empty response content", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [] },
              finishReason: "STOP",
            },
          ],
          usageMetadata: {
            promptTokenCount: 5,
            candidatesTokenCount: 0,
            totalTokenCount: 5,
          },
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "gemini-pro"
      );

      expect(result.content).toBe("");
    });

    it("should handle missing usage metadata", async () => {
      const mockResponse = {
        ok: true,
        json: async () => ({
          candidates: [
            {
              content: { parts: [{ text: "Response" }] },
              finishReason: "STOP",
            },
          ],
        }),
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      const result = await provider.chat(
        [{ role: "user", content: "Test" }],
        "gemini-pro"
      );

      expect(result.usage).toEqual({
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      });
    });

    it("should throw error on API failure", async () => {
      const mockResponse = {
        ok: false,
        status: 400,
        text: async () => "Bad Request",
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(
        provider.chat([{ role: "user", content: "Test" }], "gemini-pro")
      ).rejects.toThrow("Google API error: 400 Bad Request");
    });

    it("should throw error if access token is not available", async () => {
      mockGetAccessToken.mockResolvedValue({ token: null });

      await expect(
        provider.chat([{ role: "user", content: "Test" }], "gemini-pro")
      ).rejects.toThrow("Failed to obtain Google Cloud access token");
    });
  });

  describe("chatStreaming()", () => {
    it("should successfully stream chat and return final response", async () => {
      const mockChunks = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Hello"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":" "}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"World!"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":""}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":10,"candidatesTokenCount":15,"totalTokenCount":25}}\n\n',
      ];

      const mockStream = {
        body: {
          getReader: () => {
            let index = 0;
            return {
              read: async () => {
                if (index < mockChunks.length) {
                  const chunk = mockChunks[index++];
                  return {
                    done: false,
                    value: new TextEncoder().encode(chunk),
                  };
                }
                return { done: true, value: undefined };
              },
              releaseLock: vi.fn(),
            };
          },
        },
        ok: true,
      };

      (global.fetch as any).mockResolvedValue(mockStream);

      const onChunk = vi.fn();
      const result = await provider.chatStreaming(
        [{ role: "user", content: "Hello" }],
        "gemini-2.0-flash-exp",
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
        model: "gemini-2.0-flash-exp",
        finishReason: "STOP",
      });

      expect(onChunk).toHaveBeenCalledTimes(3);
      expect(onChunk).toHaveBeenNthCalledWith(1, "Hello");
      expect(onChunk).toHaveBeenNthCalledWith(2, " ");
      expect(onChunk).toHaveBeenNthCalledWith(3, "World!");
    });

    it("should handle streaming without onChunk callback", async () => {
      const mockChunks = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Response"}]}}]}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":""}]},"finishReason":"STOP"}],"usageMetadata":{"promptTokenCount":5,"candidatesTokenCount":8,"totalTokenCount":13}}\n\n',
      ];

      const mockStream = {
        body: {
          getReader: () => {
            let index = 0;
            return {
              read: async () => {
                if (index < mockChunks.length) {
                  const chunk = mockChunks[index++];
                  return {
                    done: false,
                    value: new TextEncoder().encode(chunk),
                  };
                }
                return { done: true, value: undefined };
              },
              releaseLock: vi.fn(),
            };
          },
        },
        ok: true,
      };

      (global.fetch as any).mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gemini-pro"
      );

      expect(result.content).toBe("Response");
    });

    it("should handle malformed JSON chunks", async () => {
      const mockChunks = [
        'data: {"candidates":[{"content":{"parts":[{"text":"Valid"}]}}]}\n\n',
        'data: {invalid json}\n\n',
        'data: {"candidates":[{"content":{"parts":[{"text":"Content"}]}}]}\n\n',
        'data: [DONE]\n\n',
      ];

      const mockStream = {
        body: {
          getReader: () => {
            let index = 0;
            return {
              read: async () => {
                if (index < mockChunks.length) {
                  const chunk = mockChunks[index++];
                  return {
                    done: false,
                    value: new TextEncoder().encode(chunk),
                  };
                }
                return { done: true, value: undefined };
              },
              releaseLock: vi.fn(),
            };
          },
        },
        ok: true,
      };

      (global.fetch as any).mockResolvedValue(mockStream);

      const result = await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gemini-pro"
      );

      expect(result.content).toBe("ValidContent");
    });

    it("should throw error if response body is null", async () => {
      const mockStream = {
        body: null,
        ok: true,
      };

      (global.fetch as any).mockResolvedValue(mockStream);

      await expect(
        provider.chatStreaming(
          [{ role: "user", content: "Test" }],
          "gemini-pro"
        )
      ).rejects.toThrow("Response body is null");
    });

    it("should throw error on API failure", async () => {
      const mockResponse = {
        ok: false,
        status: 500,
        text: async () => "Internal Server Error",
      };

      (global.fetch as any).mockResolvedValue(mockResponse);

      await expect(
        provider.chatStreaming(
          [{ role: "user", content: "Test" }],
          "gemini-pro"
        )
      ).rejects.toThrow("Google API error: 500 Internal Server Error");
    });

    it("should pass custom temperature and maxTokens", async () => {
      const mockStream = {
        body: {
          getReader: () => ({
            read: async () => ({ done: true, value: undefined }),
            releaseLock: vi.fn(),
          }),
        },
        ok: true,
      };

      (global.fetch as any).mockResolvedValue(mockStream);

      await provider.chatStreaming(
        [{ role: "user", content: "Test" }],
        "gemini-pro",
        undefined,
        undefined,
        0.2,
        512
      );

      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);

      expect(body.generationConfig).toEqual({
        temperature: 0.2,
        maxOutputTokens: 512,
      });
    });
  });
});
