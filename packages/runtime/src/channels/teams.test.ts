import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { TeamsChannel } from "./teams";
import type { ChannelConfig, ResponseContent } from "@agentik-os/shared";

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

describe("TeamsChannel", () => {
  let channel: TeamsChannel;
  let mockConfig: ChannelConfig;

  // Helper to create a successful token response
  function mockTokenResponse() {
    return {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({
        access_token: "mock-access-token-xyz",
        token_type: "Bearer",
        expires_in: 3600,
      }),
      text: vi.fn().mockResolvedValue(""),
      headers: new Headers(),
    };
  }

  // Helper to create a successful activity response
  function mockActivityResponse() {
    return {
      ok: true,
      status: 200,
      json: vi.fn().mockResolvedValue({ id: "activity-123" }),
      text: vi.fn().mockResolvedValue(""),
      headers: new Headers(),
    };
  }

  beforeEach(() => {
    vi.clearAllMocks();

    channel = new TeamsChannel();
    mockConfig = {
      type: "teams",
      options: {
        appId: "test-app-id-12345",
        appPassword: "test-app-password-secret",
        tenantId: "test-tenant-id",
      },
      enabled: true,
    };

    // Default fetch mock: token request succeeds
    mockFetch.mockResolvedValue(mockTokenResponse());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ChannelAdapter interface", () => {
    it("should have name 'teams'", () => {
      expect(channel.name).toBe("teams");
    });

    it("should start disconnected", () => {
      expect(channel.isConnected()).toBe(false);
    });

    it("should connect with valid credentials", async () => {
      await channel.connect(mockConfig);
      expect(channel.isConnected()).toBe(true);
    });

    it("should acquire OAuth token on connect", async () => {
      await channel.connect(mockConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("login.microsoftonline.com"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/x-www-form-urlencoded",
          }),
        })
      );
    });

    it("should include client_credentials in token request body", async () => {
      await channel.connect(mockConfig);

      const call = mockFetch.mock.calls[0];
      const body = call[1].body as string;

      expect(body).toContain("grant_type=client_credentials");
      expect(body).toContain("client_id=test-app-id-12345");
      expect(body).toContain("client_secret=test-app-password-secret");
    });

    it("should disconnect successfully", async () => {
      await channel.connect(mockConfig);
      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });

    it("should register message handler", () => {
      const handler = vi.fn();
      channel.onMessage(handler);
      // Handler is stored internally
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe("Config validation", () => {
    it("should throw error if appId is missing", async () => {
      mockConfig.options.appId = undefined;

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Microsoft App ID is required"
      );
    });

    it("should throw error if appPassword is missing", async () => {
      mockConfig.options.appPassword = undefined;

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Microsoft App Password is required"
      );
    });

    it("should use default tenantId if not provided", async () => {
      delete mockConfig.options.tenantId;

      await channel.connect(mockConfig);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("botframework.com"),
        expect.any(Object)
      );
    });
  });

  describe("OAuth token acquisition", () => {
    it("should throw on token acquisition failure", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        text: vi.fn().mockResolvedValue("Invalid credentials"),
        headers: new Headers(),
      });

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Failed to acquire Teams token"
      );
    });

    it("should cache token and reuse on subsequent calls", async () => {
      await channel.connect(mockConfig);

      // Reset mock to track subsequent calls
      mockFetch.mockClear();

      // Set up mock for activity send (not token)
      mockFetch.mockResolvedValue(mockActivityResponse());

      // Encode a recipient
      const to = Buffer.from(
        "https://smba.trafficmanager.net/|conv-123"
      ).toString("base64");

      const content: ResponseContent = { text: "Hello" };
      await channel.send(to, content);

      // Should NOT have called token endpoint again (cached)
      const tokenCalls = mockFetch.mock.calls.filter((call) =>
        (call[0] as string).includes("login.microsoftonline.com")
      );
      expect(tokenCalls).toHaveLength(0);
    });
  });

  describe("Message sending", () => {
    let encodedTo: string;

    beforeEach(async () => {
      await channel.connect(mockConfig);
      mockFetch.mockClear();
      mockFetch.mockResolvedValue(mockActivityResponse());

      encodedTo = Buffer.from(
        "https://smba.trafficmanager.net/|conv-456"
      ).toString("base64");
    });

    it("should send text message as activity", async () => {
      const content: ResponseContent = { text: "Hello, Teams!" };

      await channel.send(encodedTo, content);

      // Should have called: typing indicator + message
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v3/conversations/conv-456/activities"),
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer mock-access-token-xyz",
          }),
        })
      );
    });

    it("should send typing indicator before message", async () => {
      const content: ResponseContent = { text: "Hello" };

      await channel.send(encodedTo, content);

      // First call should be typing indicator
      const firstCallBody = JSON.parse(mockFetch.mock.calls[0][1].body as string);
      expect(firstCallBody.type).toBe("typing");
    });

    it("should send rich content as Adaptive Card", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "card",
            data: {
              title: "Test Card",
              description: "A test card description",
            },
          },
        ],
      };

      await channel.send(encodedTo, content);

      // Find the call that sends the adaptive card
      const cardCall = mockFetch.mock.calls.find((call) => {
        const body = JSON.parse(call[1].body as string);
        return body.attachments?.some(
          (a: { contentType: string }) =>
            a.contentType === "application/vnd.microsoft.card.adaptive"
        );
      });

      expect(cardCall).toBeDefined();
      const cardBody = JSON.parse(cardCall![1].body as string);
      const adaptiveCard = cardBody.attachments[0].content;
      expect(adaptiveCard.type).toBe("AdaptiveCard");
      expect(adaptiveCard.body[0].text).toBe("Test Card");
    });

    it("should send buttons as Action.Submit in Adaptive Card", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "button",
            data: {
              label: "Click Me",
              action: { type: "submit", value: "clicked" },
            },
          },
        ],
      };

      await channel.send(encodedTo, content);

      const cardCall = mockFetch.mock.calls.find((call) => {
        const body = JSON.parse(call[1].body as string);
        return body.attachments?.length > 0;
      });

      expect(cardCall).toBeDefined();
      const cardBody = JSON.parse(cardCall![1].body as string);
      const actions = cardBody.attachments[0].content.actions;
      expect(actions).toBeDefined();
      expect(actions[0].type).toBe("Action.Submit");
      expect(actions[0].title).toBe("Click Me");
    });

    it("should send images in Adaptive Card body", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "image",
            data: {
              url: "https://example.com/image.png",
              caption: "Test image",
            },
          },
        ],
      };

      await channel.send(encodedTo, content);

      const cardCall = mockFetch.mock.calls.find((call) => {
        const body = JSON.parse(call[1].body as string);
        return body.attachments?.length > 0;
      });

      expect(cardCall).toBeDefined();
      const cardBody = JSON.parse(cardCall![1].body as string);
      const imageElement = cardBody.attachments[0].content.body.find(
        (e: { type: string }) => e.type === "Image"
      );
      expect(imageElement).toBeDefined();
      expect(imageElement.url).toBe("https://example.com/image.png");
    });

    it("should send file as base64 attachment", async () => {
      const file = Buffer.from("test file content");

      await channel.sendFile(encodedTo, file, "test.txt");

      const fileCall = mockFetch.mock.calls.find((call) => {
        try {
          const body = JSON.parse(call[1].body as string);
          return body.attachments?.some(
            (a: { contentType: string }) =>
              a.contentType === "application/octet-stream"
          );
        } catch {
          return false;
        }
      });

      expect(fileCall).toBeDefined();
    });

    it("should throw error if not connected", async () => {
      await channel.disconnect();
      const content: ResponseContent = { text: "Test" };

      await expect(channel.send(encodedTo, content)).rejects.toThrow(
        "Bot not connected"
      );
    });

    it("should throw error on sendFile if not connected", async () => {
      await channel.disconnect();

      await expect(
        channel.sendFile(encodedTo, Buffer.from("data"), "file.txt")
      ).rejects.toThrow("Bot not connected");
    });

    it("should handle plain conversationId (non-encoded recipient)", async () => {
      const content: ResponseContent = { text: "Hello" };

      // Pass a plain string that is not base64-encoded
      await channel.send("plain-conv-id", content);

      // Should use default serviceUrl
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("smba.trafficmanager.net"),
        expect.any(Object)
      );
    });
  });

  describe("Activity processing", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should convert Bot Framework activity to RawMessage", async () => {
      const handler = vi.fn();
      channel.onMessage(handler);

      const activity = {
        type: "message",
        id: "activity-001",
        text: "Hello from Teams!",
        from: { id: "user-123", name: "Test User" },
        conversation: { id: "conv-789" },
        serviceUrl: "https://smba.trafficmanager.net/",
        timestamp: "2026-02-14T00:00:00Z",
      };

      await channel.processActivity(activity);

      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          channel: "teams",
          channelMessageId: "activity-001",
          userId: "user-123",
          content: "Hello from Teams!",
        })
      );
    });

    it("should ignore non-message activities", async () => {
      const handler = vi.fn();
      channel.onMessage(handler);

      await channel.processActivity({
        type: "conversationUpdate",
        id: "update-001",
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it("should track user message count", async () => {
      const handler = vi.fn();
      channel.onMessage(handler);

      const activity = {
        type: "message",
        id: "msg-1",
        text: "First message",
        from: { id: "user-abc" },
        conversation: { id: "conv-1" },
        serviceUrl: "https://smba.trafficmanager.net/",
      };

      await channel.processActivity(activity);
      await channel.processActivity({ ...activity, id: "msg-2", text: "Second" });

      expect(handler).toHaveBeenCalledTimes(2);
    });

    it("should include metadata with serviceUrl and conversationId", async () => {
      const handler = vi.fn();
      channel.onMessage(handler);

      await channel.processActivity({
        type: "message",
        id: "msg-meta",
        text: "Test",
        from: { id: "user-meta" },
        conversation: { id: "conv-meta" },
        serviceUrl: "https://custom.service.url/",
      });

      const rawMessage = handler.mock.calls[0][0];
      expect(rawMessage.metadata?.serviceUrl).toBe(
        "https://custom.service.url/"
      );
      expect(rawMessage.metadata?.conversationId).toBe("conv-meta");
    });

    it("should extract attachments from activity", async () => {
      const handler = vi.fn();
      channel.onMessage(handler);

      await channel.processActivity({
        type: "message",
        id: "msg-att",
        text: "File here",
        from: { id: "user-att" },
        conversation: { id: "conv-att" },
        serviceUrl: "https://smba.trafficmanager.net/",
        attachments: [
          {
            contentType: "image/png",
            contentUrl: "https://example.com/image.png",
            name: "screenshot.png",
          },
        ],
      });

      const rawMessage = handler.mock.calls[0][0];
      expect(rawMessage.attachments).toHaveLength(1);
      expect(rawMessage.attachments[0].type).toBe("image");
      expect(rawMessage.attachments[0].mimeType).toBe("image/png");
    });
  });

  describe("Typing indicator", () => {
    let encodedTo: string;

    beforeEach(async () => {
      await channel.connect(mockConfig);
      mockFetch.mockClear();
      mockFetch.mockResolvedValue(mockActivityResponse());

      encodedTo = Buffer.from(
        "https://smba.trafficmanager.net/|conv-typing"
      ).toString("base64");
    });

    it("should send typing activity before message", async () => {
      const content: ResponseContent = { text: "Thinking..." };
      await channel.send(encodedTo, content);

      const calls = mockFetch.mock.calls;
      const typingCall = calls.find((call) => {
        try {
          const body = JSON.parse(call[1].body as string);
          return body.type === "typing";
        } catch {
          return false;
        }
      });

      expect(typingCall).toBeDefined();
    });

    it("should not fail if typing indicator fails", async () => {
      // First call (typing) fails, subsequent calls succeed
      mockFetch
        .mockRejectedValueOnce(new Error("Typing failed"))
        .mockResolvedValue(mockActivityResponse());

      const content: ResponseContent = { text: "Hello" };

      // Should not throw even though typing failed
      await expect(
        channel.send(encodedTo, content)
      ).resolves.toBeUndefined();
    });
  });

  describe("Error handling", () => {
    let encodedTo: string;

    beforeEach(async () => {
      await channel.connect(mockConfig);
      mockFetch.mockClear();

      encodedTo = Buffer.from(
        "https://smba.trafficmanager.net/|conv-err"
      ).toString("base64");
    });

    it("should throw on API error response", async () => {
      mockFetch.mockResolvedValue(mockActivityResponse()); // typing OK
      mockFetch
        .mockResolvedValueOnce(mockActivityResponse()) // typing OK
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          text: vi.fn().mockResolvedValue("Internal Server Error"),
          headers: new Headers(),
        });

      const content: ResponseContent = { text: "Test" };

      await expect(channel.send(encodedTo, content)).rejects.toThrow(
        "Failed to send Teams activity"
      );
    });

    it("should retry on 429 rate limit", async () => {
      // Set up: connect already done, now test retry
      mockFetch
        .mockResolvedValueOnce(mockActivityResponse()) // typing OK
        .mockResolvedValueOnce({
          ok: false,
          status: 429,
          text: vi.fn().mockResolvedValue("Rate limited"),
          headers: new Headers([["Retry-After", "0"]]),
        })
        .mockResolvedValueOnce(mockActivityResponse()); // retry succeeds

      const content: ResponseContent = { text: "Retry test" };

      // Should eventually succeed after retry
      await expect(
        channel.send(encodedTo, content)
      ).resolves.toBeUndefined();
    });

    it("should clear typing timers on disconnect", async () => {
      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });
  });

  describe("Adaptive Card building", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
      mockFetch.mockClear();
      mockFetch.mockResolvedValue(mockActivityResponse());
    });

    it("should build card with title and description", async () => {
      const encodedTo = Buffer.from(
        "https://smba.trafficmanager.net/|conv-card"
      ).toString("base64");

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "card",
            data: {
              title: "My Card",
              description: "Card body text",
            },
          },
        ],
      };

      await channel.send(encodedTo, content);

      const cardCall = mockFetch.mock.calls.find((call) => {
        try {
          const body = JSON.parse(call[1].body as string);
          return body.attachments?.some(
            (a: { contentType: string }) =>
              a.contentType === "application/vnd.microsoft.card.adaptive"
          );
        } catch {
          return false;
        }
      });

      expect(cardCall).toBeDefined();
      const body = JSON.parse(cardCall![1].body as string);
      const card = body.attachments[0].content;

      expect(card.version).toBe("1.4");
      expect(card.body).toHaveLength(2);
      expect(card.body[0].type).toBe("TextBlock");
      expect(card.body[0].text).toBe("My Card");
      expect(card.body[0].weight).toBe("Bolder");
      expect(card.body[1].text).toBe("Card body text");
    });

    it("should build embed with title and description", async () => {
      const encodedTo = Buffer.from(
        "https://smba.trafficmanager.net/|conv-embed"
      ).toString("base64");

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "embed",
            data: {
              title: "Embed Title",
              description: "Embed desc",
            },
          },
        ],
      };

      await channel.send(encodedTo, content);

      const cardCall = mockFetch.mock.calls.find((call) => {
        try {
          const body = JSON.parse(call[1].body as string);
          return body.attachments?.length > 0;
        } catch {
          return false;
        }
      });

      expect(cardCall).toBeDefined();
      const body = JSON.parse(cardCall![1].body as string);
      const card = body.attachments[0].content;
      expect(card.body[0].text).toBe("Embed Title");
    });

    it("should build code_block with monospace font", async () => {
      const encodedTo = Buffer.from(
        "https://smba.trafficmanager.net/|conv-code"
      ).toString("base64");

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "code_block",
            data: {
              code: "console.log('hello')",
              language: "typescript",
            },
          },
        ],
      };

      await channel.send(encodedTo, content);

      const cardCall = mockFetch.mock.calls.find((call) => {
        try {
          const body = JSON.parse(call[1].body as string);
          return body.attachments?.length > 0;
        } catch {
          return false;
        }
      });

      expect(cardCall).toBeDefined();
      const body = JSON.parse(cardCall![1].body as string);
      const codeBlock = body.attachments[0].content.body[0];
      expect(codeBlock.fontType).toBe("Monospace");
    });
  });

  describe("Recipient encoding/decoding", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
      mockFetch.mockClear();
      mockFetch.mockResolvedValue(mockActivityResponse());
    });

    it("should encode and decode serviceUrl + conversationId", async () => {
      const content: ResponseContent = { text: "Test" };

      const encoded = Buffer.from(
        "https://custom.service/|my-conversation-id"
      ).toString("base64");

      await channel.send(encoded, content);

      // Should have used the custom service URL
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining(
          "https://custom.service/v3/conversations/my-conversation-id/activities"
        ),
        expect.any(Object)
      );
    });

    it("should encode and decode with replyToId", async () => {
      const content: ResponseContent = { text: "Reply" };

      const encoded = Buffer.from(
        "https://smba.trafficmanager.net/|conv-reply|original-msg-123"
      ).toString("base64");

      await channel.send(encoded, content);

      // Find the message activity (not typing)
      const msgCall = mockFetch.mock.calls.find((call) => {
        try {
          const body = JSON.parse(call[1].body as string);
          return body.type === "message";
        } catch {
          return false;
        }
      });

      expect(msgCall).toBeDefined();
      const body = JSON.parse(msgCall![1].body as string);
      expect(body.replyToId).toBe("original-msg-123");
    });
  });
});
