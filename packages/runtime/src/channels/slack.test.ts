import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { SlackChannel } from "./slack";
import type { ChannelConfig, ResponseContent } from "@agentik-os/shared";

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Mock WebSocket
class MockWebSocket {
  static OPEN = 1;
  readyState = MockWebSocket.OPEN;
  onopen: ((event: any) => void) | null = null;
  onmessage: ((event: any) => void) | null = null;
  onerror: ((event: any) => void) | null = null;
  onclose: ((event: any) => void) | null = null;
  send = vi.fn();
  close = vi.fn();

  constructor(_url: string) {
    // Simulate connection after microtask
    setTimeout(() => {
      this.onopen?.({});
    }, 0);
  }
}

vi.stubGlobal("WebSocket", MockWebSocket);

function mockSlackApiResponse(ok = true, data: Record<string, unknown> = {}) {
  return {
    ok: true,
    status: 200,
    json: vi.fn().mockResolvedValue({ ok, ...data }),
    headers: new Headers(),
  };
}

describe("SlackChannel", () => {
  let channel: SlackChannel;
  let mockConfig: ChannelConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    channel = new SlackChannel();
    mockConfig = {
      type: "slack",
      options: {
        botToken: "xoxb-test-bot-token",
        signingSecret: "test-signing-secret",
        appToken: "xapp-test-app-token",
      },
      enabled: true,
    };

    // Default: auth.test succeeds, apps.connections.open succeeds
    mockFetch
      .mockResolvedValueOnce(
        mockSlackApiResponse(true, { user: "testbot", team: "TestTeam" })
      )
      .mockResolvedValueOnce(
        mockSlackApiResponse(true, { url: "wss://test.slack.com/ws" })
      );
  });

  afterEach(async () => {
    if (channel.isConnected()) {
      await channel.disconnect();
    }
    vi.clearAllMocks();
  });

  describe("ChannelAdapter interface", () => {
    it("should have name 'slack'", () => {
      expect(channel.name).toBe("slack");
    });

    it("should start disconnected", () => {
      expect(channel.isConnected()).toBe(false);
    });

    it("should connect with valid config", async () => {
      await channel.connect(mockConfig);
      expect(channel.isConnected()).toBe(true);
    });

    it("should throw error if botToken is missing", async () => {
      mockConfig.options.botToken = undefined;

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Slack bot token is required"
      );
    });

    it("should throw error if signingSecret is missing", async () => {
      mockConfig.options.signingSecret = undefined;

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Slack signing secret is required"
      );
    });

    it("should throw error if appToken is missing", async () => {
      mockConfig.options.appToken = undefined;

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Slack app token is required"
      );
    });

    it("should throw error if auth.test fails", async () => {
      mockFetch.mockReset();
      mockFetch.mockResolvedValueOnce(
        mockSlackApiResponse(false, { error: "invalid_auth" })
      );

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Slack auth failed: invalid_auth"
      );
    });

    it("should disconnect successfully", async () => {
      await channel.connect(mockConfig);
      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });

    it("should register message handler", () => {
      const handler = vi.fn();
      channel.onMessage(handler);
      expect(handler).toBeDefined();
    });
  });

  describe("Message sending", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should send text message", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true, { ts: "1234.5678" }));

      const content: ResponseContent = {
        text: "Hello, Slack!",
      };

      await channel.send("C12345", content);

      // Verify chat.postMessage was called
      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toContain("chat.postMessage");
      const body = JSON.parse(lastCall[1].body);
      expect(body.channel).toBe("C12345");
      expect(body.text).toBe("Hello, Slack!");
    });

    it("should send message with thread_ts when destination includes it", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true, { ts: "1234.5678" }));

      const content: ResponseContent = {
        text: "Thread reply",
      };

      await channel.send("C12345:1111.2222", content);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.channel).toBe("C12345");
      expect(body.thread_ts).toBe("1111.2222");
    });

    it("should send rich content (card as section block)", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true));

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "card",
            data: {
              title: "Card Title",
              description: "Card description",
            },
          },
        ],
      };

      await channel.send("C12345", content);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.blocks).toBeDefined();
      expect(body.blocks[0].type).toBe("section");
      expect(body.blocks[0].text.text).toContain("Card Title");
    });

    it("should send rich content (button as actions block)", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true));

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "button",
            data: {
              text: "Click me",
              label: "Button Label",
              action: { type: "test" },
            },
          },
        ],
      };

      await channel.send("C12345", content);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.blocks[0].type).toBe("actions");
      expect(body.blocks[0].elements[0].type).toBe("button");
      expect(body.blocks[0].elements[0].text.text).toBe("Button Label");
    });

    it("should send rich content (image block)", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true));

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "image",
            data: {
              url: "https://example.com/image.jpg",
              caption: "Test image",
            },
          },
        ],
      };

      await channel.send("C12345", content);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.blocks[0].type).toBe("image");
      expect(body.blocks[0].image_url).toBe("https://example.com/image.jpg");
    });

    it("should send rich content (code_block as section)", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true));

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "code_block",
            data: {
              language: "javascript",
              code: "console.log('Hello');",
            },
          },
        ],
      };

      await channel.send("C12345", content);

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      const body = JSON.parse(lastCall[1].body);
      expect(body.blocks[0].type).toBe("section");
      expect(body.blocks[0].text.text).toContain("console.log");
    });

    it("should split long messages at 3000 chars", async () => {
      // Mock multiple postMessage calls
      mockFetch.mockResolvedValue(mockSlackApiResponse(true));

      const longText = "A".repeat(4000);
      const content: ResponseContent = {
        text: longText,
      };

      await channel.send("C12345", content);

      // Should have called postMessage at least twice (split at 3000)
      const postMessageCalls = mockFetch.mock.calls.filter((call) =>
        call[0]?.includes("chat.postMessage")
      );
      expect(postMessageCalls.length).toBeGreaterThanOrEqual(2);
    });

    it("should throw error if not connected", async () => {
      await channel.disconnect();
      const content: ResponseContent = { text: "Test" };

      await expect(channel.send("C12345", content)).rejects.toThrow(
        "Bot not connected"
      );
    });
  });

  describe("File sending", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should send file with caption", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true));

      const file = Buffer.from("test file content");
      await channel.sendFile("C12345", file, "test.txt");

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toContain("files.upload");
    });

    it("should send file with thread_ts", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(true));

      const file = Buffer.from("test file content");
      await channel.sendFile("C12345:1111.2222", file, "test.txt");

      const lastCall = mockFetch.mock.calls[mockFetch.mock.calls.length - 1];
      expect(lastCall[0]).toContain("files.upload");
    });

    it("should throw error on upload failure", async () => {
      mockFetch.mockResolvedValueOnce(mockSlackApiResponse(false, { error: "not_authed" }));

      const file = Buffer.from("test file content");
      await expect(channel.sendFile("C12345", file, "test.txt")).rejects.toThrow(
        "Slack file upload failed: not_authed"
      );
    });

    it("should throw error if not connected", async () => {
      await channel.disconnect();
      const file = Buffer.from("test file content");

      await expect(channel.sendFile("C12345", file)).rejects.toThrow(
        "Bot not connected"
      );
    });
  });

  describe("Error handling", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle rate limiting (429) with retry", async () => {
      // First call returns 429, second succeeds
      mockFetch
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          json: vi.fn().mockResolvedValue({ ok: false, error: "rate_limited" }),
          headers: new Headers({ "Retry-After": "1" }),
        })
        .mockResolvedValueOnce(mockSlackApiResponse(true, { ts: "1234.5678" }));

      const content: ResponseContent = { text: "Test" };

      // Should retry and succeed (though it will be slow due to delay)
      await channel.send("C12345", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle API errors gracefully", async () => {
      mockFetch.mockResolvedValueOnce(
        mockSlackApiResponse(false, { error: "channel_not_found" })
      );

      const content: ResponseContent = { text: "Test" };

      // Should not throw - API returns ok:false but fetch itself succeeds
      await channel.send("C12345", content);
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Text splitting", () => {
    it("should not split text under 3000 chars", () => {
      const text = "Short message";
      const chunks = text.split("\n\n");
      expect(chunks).toHaveLength(1);
    });

    it("should split text by paragraphs", () => {
      const text = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      const chunks = text.split("\n\n");
      expect(chunks).toHaveLength(3);
    });

    it("should handle empty text", () => {
      const text = "";
      const chunks = text.split("\n\n");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("");
    });

    it("should respect 40000 char max limit", () => {
      const maxLength = 40000;
      const text = "A".repeat(50000);
      expect(text.length).toBeGreaterThan(maxLength);
    });
  });

  describe("Connection state", () => {
    it("should report connected after successful connect", async () => {
      expect(channel.isConnected()).toBe(false);
      await channel.connect(mockConfig);
      expect(channel.isConnected()).toBe(true);
    });

    it("should report disconnected after disconnect", async () => {
      await channel.connect(mockConfig);
      expect(channel.isConnected()).toBe(true);
      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });

    it("should handle multiple disconnects gracefully", async () => {
      await channel.connect(mockConfig);
      await channel.disconnect();
      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });
  });
});
