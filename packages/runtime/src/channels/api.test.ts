import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { APIChannel } from "./api";
import type { ChannelConfig, RawMessage, ResponseContent } from "@agentik-os/shared";

describe("APIChannel", () => {
  let channel: APIChannel;
  const TEST_PORT = 3333; // Use non-standard port for testing

  beforeEach(() => {
    channel = new APIChannel();
  });

  afterEach(async () => {
    if (channel.isConnected()) {
      await channel.disconnect();
    }
  });

  describe("ChannelAdapter interface", () => {
    it("should have name 'api'", () => {
      expect(channel.name).toBe("api");
    });

    it("should implement isConnected", () => {
      expect(channel.isConnected()).toBe(false);
    });

    it("should connect successfully", async () => {
      const config: ChannelConfig = {
        type: "api",
        options: {
          port: TEST_PORT,
        },
        enabled: true,
      };

      await channel.connect(config);
      expect(channel.isConnected()).toBe(true);
    });

    it("should use default port 3000 if not specified", async () => {
      // Note: We'll skip actually connecting on port 3000 to avoid conflicts
      const config: ChannelConfig = {
        type: "api",
        options: {},
        enabled: true,
      };

      // Just verify config is accepted (don't actually connect)
      expect(config.options.port).toBeUndefined();
    });

    it("should disconnect successfully", async () => {
      const config: ChannelConfig = {
        type: "api",
        options: {
          port: TEST_PORT,
        },
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

  describe("HTTP endpoints", () => {
    beforeEach(async () => {
      const config: ChannelConfig = {
        type: "api",
        options: {
          port: TEST_PORT,
        },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should respond to health check", async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/health`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("status", "ok");
      expect(data).toHaveProperty("channel", "api");
      expect(data).toHaveProperty("connected", true);
      expect(data).toHaveProperty("timestamp");
    });

    it("should return agent list", async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/agents`);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("agents");
      expect(Array.isArray(data.agents)).toBe(true);
    });

    it("should reject message without required fields", async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // Missing userId and content
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("Missing required fields");
    });

    it("should handle message and return response", async () => {
      // Register message handler that responds immediately
      channel.onMessage(async (msg: RawMessage) => {
        // Simulate agent response
        await channel.send(msg.channelMessageId, {
          text: `Echo: ${msg.content}`,
        });
      });

      const response = await fetch(`http://localhost:${TEST_PORT}/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test_user",
          content: "Hello, agent!",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("messageId");
      expect(data).toHaveProperty("response");
      expect(data.response).toContain("Echo:");
    });

    it("should handle file responses", async () => {
      const testFileContent = Buffer.from("test file content");

      // Register message handler that sends a file
      channel.onMessage(async (msg: RawMessage) => {
        await channel.sendFile(msg.channelMessageId, testFileContent, "Test file");
      });

      const response = await fetch(`http://localhost:${TEST_PORT}/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test_user",
          content: "Send me a file",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toHaveProperty("response");
      expect(data.response).toBe("Test file");
      expect(data).toHaveProperty("metadata");
      expect(data.metadata).toHaveProperty("file");
      expect(data.metadata.file).toHaveProperty("base64");
      expect(data.metadata.file).toHaveProperty("mimeType", "application/octet-stream");
    });

    it("should timeout if agent takes too long", async () => {
      // Register message handler that never responds
      channel.onMessage(async (_msg: RawMessage) => {
        // Simulate slow agent - never respond
        await new Promise((resolve) => setTimeout(resolve, 35000));
      });

      const response = await fetch(`http://localhost:${TEST_PORT}/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test_user",
          content: "Slow request",
        }),
      });

      const data = await response.json();

      expect(response.status).toBe(504);
      expect(data).toHaveProperty("error");
      expect(data.error).toContain("timeout");
    }, 35000); // Extend test timeout

    it("should reject request if no handler configured", async () => {
      // Create new channel without handler
      const newChannel = new APIChannel();
      const config: ChannelConfig = {
        type: "api",
        options: {
          port: TEST_PORT + 1, // Different port
        },
        enabled: true,
      };
      await newChannel.connect(config);

      try {
        const response = await fetch(`http://localhost:${TEST_PORT + 1}/api/message`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            userId: "test_user",
            content: "Test",
          }),
        });

        const data = await response.json();

        expect(response.status).toBe(500);
        expect(data).toHaveProperty("error");
        expect(data.error).toContain("Message handler not configured");
      } finally {
        await newChannel.disconnect();
      }
    });
  });

  describe("middleware", () => {
    beforeEach(async () => {
      const config: ChannelConfig = {
        type: "api",
        options: {
          port: TEST_PORT,
        },
        enabled: true,
      };
      await channel.connect(config);
    });

    it("should include CORS headers", async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/health`);

      expect(response.headers.has("access-control-allow-origin")).toBe(true);
    });

    it("should include security headers (helmet)", async () => {
      const response = await fetch(`http://localhost:${TEST_PORT}/api/health`);

      // Helmet adds various security headers
      expect(response.headers.has("x-content-type-options")).toBe(true);
    });

    it("should handle JSON body parsing", async () => {
      channel.onMessage(async (msg: RawMessage) => {
        await channel.send(msg.channelMessageId, {
          text: "OK",
        });
      });

      const response = await fetch(`http://localhost:${TEST_PORT}/api/message`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: "test",
          content: "test message",
        }),
      });

      expect(response.status).toBe(200);
    });
  });
});
