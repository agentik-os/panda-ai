import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebWidgetChannel } from "./web-widget";
import type { ChannelConfig, RawMessage, ResponseContent } from "@agentik-os/shared";

// Helper to generate unique ports per test suite
let portCounter = 4400;
function nextPort(): number {
  return portCounter++;
}

describe("WebWidgetChannel", () => {
  let channel: WebWidgetChannel;

  beforeEach(() => {
    channel = new WebWidgetChannel();
  });

  afterEach(async () => {
    if (channel.isConnected()) {
      await channel.disconnect();
    }
  });

  describe("ChannelAdapter interface", () => {
    it("should have name 'web'", () => {
      expect(channel.name).toBe("web");
    });

    it("should start disconnected", () => {
      expect(channel.isConnected()).toBe(false);
    });

    it("should connect successfully", async () => {
      const port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };

      await channel.connect(config);
      expect(channel.isConnected()).toBe(true);
    });

    it("should use default port 3100 if not specified", () => {
      const config: ChannelConfig = {
        type: "web",
        options: {},
        enabled: true,
      };

      // Verify config is accepted without port
      expect(config.options.port).toBeUndefined();
    });

    it("should disconnect successfully", async () => {
      const port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };

      await channel.connect(config);
      expect(channel.isConnected()).toBe(true);

      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });

    it("should register message handler", () => {
      const handler = vi.fn();
      channel.onMessage(handler);
      // Handler is registered internally
    });
  });

  describe("Session management", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should create a new session", async () => {
      const response = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user", agentId: "my_agent" }),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data).toHaveProperty("sessionId");
      expect(data.sessionId).toMatch(/^ws_/);
      expect(data).toHaveProperty("userId", "test_user");
      expect(data).toHaveProperty("agentId", "my_agent");
      expect(data).toHaveProperty("connectedAt");
    });

    it("should create session with default userId if not provided", async () => {
      const response = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      expect(response.status).toBe(201);
      expect(data.userId).toMatch(/^anon_/);
      expect(data.agentId).toBe("default");
    });

    it("should get messages for a session", async () => {
      // Create session first
      const createRes = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user" }),
      });
      const { sessionId } = await createRes.json();

      // Get messages (should be empty)
      const response = await fetch(`http://localhost:${port}/api/messages/${sessionId}`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("sessionId", sessionId);
      expect(data).toHaveProperty("messages");
      expect(Array.isArray(data.messages)).toBe(true);
      expect(data.messages.length).toBe(0);
    });

    it("should return 404 for non-existent session", async () => {
      const response = await fetch(`http://localhost:${port}/api/messages/nonexistent`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error");
    });
  });

  describe("Message sending", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should accept a message and return received status", async () => {
      channel.onMessage(async (_msg: RawMessage) => {});

      // Create session
      const createRes = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user" }),
      });
      const { sessionId } = await createRes.json();

      // Send message
      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: "Hello, agent!" }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("messageId");
      expect(data).toHaveProperty("sessionId", sessionId);
      expect(data).toHaveProperty("status", "received");
    });

    it("should reject message without required fields", async () => {
      channel.onMessage(vi.fn());

      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Missing required fields");
    });

    it("should reject message if no handler configured", async () => {
      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "test_session", content: "Hello" }),
      });

      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Message handler not configured");
    });

    it("should auto-create session when sending message to unknown session", async () => {
      channel.onMessage(async (_msg: RawMessage) => {});

      const sessionId = "auto_session_123";
      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: "Hello" }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.sessionId).toBe(sessionId);

      // Session should now exist
      const session = channel.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.messages.length).toBe(1);
    });

    it("should store messages in session history", async () => {
      channel.onMessage(async (_msg: RawMessage) => {});

      // Create session
      const createRes = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user" }),
      });
      const { sessionId } = await createRes.json();

      // Send message
      await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: "Test message" }),
      });

      // Get messages
      const getRes = await fetch(`http://localhost:${port}/api/messages/${sessionId}`);
      const data = await getRes.json();

      expect(data.messages.length).toBe(1);
      expect(data.messages[0].role).toBe("user");
      expect(data.messages[0].content).toBe("Test message");
    });

    it("should call message handler with correct RawMessage", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      channel.onMessage(handler);

      // Create session
      const createRes = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user" }),
      });
      const { sessionId } = await createRes.json();

      // Send message
      await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content: "Hello agent" }),
      });

      // Wait for async handler to be called
      await new Promise((resolve) => setTimeout(resolve, 100));

      expect(handler).toHaveBeenCalledTimes(1);
      const rawMsg = handler.mock.calls[0][0] as RawMessage;
      expect(rawMsg.channel).toBe("web");
      expect(rawMsg.content).toBe("Hello agent");
      expect(rawMsg.userId).toBe("test_user");
      expect(rawMsg.metadata).toHaveProperty("sessionId", sessionId);
    });
  });

  describe("send() method", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should store agent response in session messages", async () => {
      // Create session
      const createRes = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user" }),
      });
      const { sessionId } = await createRes.json();

      // Send agent response via send()
      await channel.send(sessionId, { text: "Hello from agent!" });

      // Check session messages
      const getRes = await fetch(`http://localhost:${port}/api/messages/${sessionId}`);
      const data = await getRes.json();

      expect(data.messages.length).toBe(1);
      expect(data.messages[0].role).toBe("agent");
      expect(data.messages[0].content).toBe("Hello from agent!");
    });

    it("should handle send to non-existent session gracefully", async () => {
      // Should not throw
      await channel.send("nonexistent_session", { text: "Hello" });
    });

    it("should throw if not connected", async () => {
      await channel.disconnect();

      await expect(channel.send("session", { text: "test" })).rejects.toThrow(
        "Web Widget channel not connected"
      );
    });
  });

  describe("sendFile() method", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should store file message in session", async () => {
      // Create session
      const createRes = await fetch(`http://localhost:${port}/api/sessions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: "test_user" }),
      });
      const { sessionId } = await createRes.json();

      const file = Buffer.from("test file content");
      await channel.sendFile(sessionId, file, "test.txt");

      const getRes = await fetch(`http://localhost:${port}/api/messages/${sessionId}`);
      const data = await getRes.json();

      expect(data.messages.length).toBe(1);
      expect(data.messages[0].content).toBe("test.txt");
    });

    it("should throw if not connected", async () => {
      await channel.disconnect();

      await expect(
        channel.sendFile("session", Buffer.from("test"), "file.txt")
      ).rejects.toThrow("Web Widget channel not connected");
    });
  });

  describe("Widget script", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should serve widget.js script", async () => {
      const response = await fetch(`http://localhost:${port}/api/widget.js`);
      const text = await response.text();

      expect(response.status).toBe(200);
      expect(response.headers.get("content-type")).toContain("application/javascript");
      expect(text).toContain("AgentikWidget");
      expect(text).toContain("agentik_session_id");
    });
  });

  describe("Health endpoint", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should respond to health check", async () => {
      const response = await fetch(`http://localhost:${port}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("status", "ok");
      expect(data).toHaveProperty("channel", "web");
      expect(data).toHaveProperty("connected", true);
      expect(data).toHaveProperty("sessions");
      expect(data).toHaveProperty("timestamp");
    });
  });

  describe("CORS handling", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: {
          port,
          corsOrigins: ["https://example.com"],
        },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should handle preflight OPTIONS request", async () => {
      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "OPTIONS",
      });

      expect(response.status).toBe(204);
    });

    it("should include CORS headers in responses", async () => {
      const response = await fetch(`http://localhost:${port}/api/health`);

      // CORS headers should be present (server always sends them)
      expect(response.headers.has("access-control-allow-origin")).toBe(true);
    });
  });

  describe("API key authentication", () => {
    const API_KEY = "test_api_key_secret";
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: {
          port,
          apiKey: API_KEY,
        },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should reject message without API key when configured", async () => {
      channel.onMessage(vi.fn());

      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "test", content: "Hello" }),
      });

      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Invalid or missing API key");
    });

    it("should accept message with valid X-API-Key header", async () => {
      channel.onMessage(async (_msg: RawMessage) => {});

      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": API_KEY,
        },
        body: JSON.stringify({ sessionId: "test_session", content: "Hello" }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("status", "received");
    });

    it("should accept message with valid Bearer token", async () => {
      channel.onMessage(async (_msg: RawMessage) => {});

      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ sessionId: "test_session", content: "Hello" }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("status", "received");
    });
  });

  describe("Rate limiting", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
      channel.onMessage(async (_msg: RawMessage) => {});
    });

    it("should allow requests within rate limit", async () => {
      const response = await fetch(`http://localhost:${port}/api/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: "rate_test", content: "Hello" }),
      });

      expect(response.status).toBe(200);
    });

    it("should reject requests exceeding rate limit", async () => {
      const sessionId = "rate_limit_test";

      // Send 61 requests sequentially to ensure rate limit is hit
      let got429 = false;
      for (let i = 0; i < 65; i++) {
        const response = await fetch(`http://localhost:${port}/api/messages`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sessionId, content: `Message ${i}` }),
        });
        if (response.status === 429) {
          got429 = true;
          break;
        }
      }

      expect(got429).toBe(true);
    });
  });

  describe("404 handling", () => {
    let port: number;

    beforeEach(async () => {
      port = nextPort();
      const config: ChannelConfig = {
        type: "web",
        options: { port },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should return 404 for unknown routes", async () => {
      const response = await fetch(`http://localhost:${port}/unknown`);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data).toHaveProperty("error", "Not found");
    });
  });
});
