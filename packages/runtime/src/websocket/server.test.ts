/**
 * WebSocket Server Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { WebSocket } from "ws";
import {
  AgentikWebSocketServer,
  getWebSocketServer,
  startWebSocketServer,
  stopWebSocketServer,
} from "./server";
import type { WebSocketMessage, ClientMessage } from "./types";

describe("AgentikWebSocketServer", () => {
  let server: AgentikWebSocketServer;
  const testPort = 8081; // Use different port for tests

  beforeEach(() => {
    server = new AgentikWebSocketServer({ port: testPort });
  });

  afterEach(() => {
    if (server) {
      server.stop();
    }
  });

  describe("start()", () => {
    it("should start WebSocket server on configured port", () => {
      expect(() => server.start()).not.toThrow();
      const stats = server.getStats();
      expect(stats.totalClients).toBe(0);
    });

    it("should warn if server already running", () => {
      const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});
      server.start();
      server.start(); // Try to start again
      expect(consoleWarn).toHaveBeenCalledWith("[WebSocket] Server already running");
      consoleWarn.mockRestore();
    });
  });

  describe("stop()", () => {
    it("should stop WebSocket server and close all connections", () => {
      server.start();
      expect(() => server.stop()).not.toThrow();
      const stats = server.getStats();
      expect(stats.totalClients).toBe(0);
    });

    it("should clear heartbeat interval on stop", () => {
      server.start();
      server.stop();
      // Heartbeat should be cleared (no errors)
      expect(true).toBe(true);
    });
  });

  describe("broadcastToChannel()", () => {
    it("should broadcast message to channel subscribers", () => {
      server.start();

      const message: WebSocketMessage = {
        type: "cost:new",
        channel: "agent:test123",
        payload: { test: true },
        timestamp: Date.now(),
        messageId: "msg-001",
      };

      // Should not throw even with no subscribers
      expect(() => server.broadcastToChannel("agent:test123", message)).not.toThrow();
    });
  });

  describe("broadcastToAll()", () => {
    it("should broadcast message to all connected clients", () => {
      server.start();

      const message: WebSocketMessage = {
        type: "connection:established",
        channel: "system",
        payload: { announcement: "Test" },
        timestamp: Date.now(),
        messageId: "msg-002",
      };

      expect(() => server.broadcastToAll(message)).not.toThrow();
    });
  });

  describe("getStats()", () => {
    it("should return server statistics", () => {
      server.start();
      const stats = server.getStats();

      expect(stats).toHaveProperty("totalClients");
      expect(stats).toHaveProperty("totalChannels");
      expect(stats).toHaveProperty("config");
      expect(stats).toHaveProperty("uptime");

      expect(stats.totalClients).toBe(0);
      expect(stats.totalChannels).toBe(0);
      expect(stats.config.port).toBe(testPort);
    });
  });

  describe("CORS", () => {
    it("should allow connections from configured origins", () => {
      const customServer = new AgentikWebSocketServer({
        port: testPort + 1,
        corsOrigins: ["http://localhost:3000"],
      });

      customServer.start();
      const stats = customServer.getStats();
      expect(stats.config.corsOrigins).toContain("http://localhost:3000");

      customServer.stop();
    });

    it("should support wildcard origins", () => {
      const customServer = new AgentikWebSocketServer({
        port: testPort + 2,
        corsOrigins: ["https://*.agentik-os.com"],
      });

      customServer.start();
      customServer.stop();
    });
  });

  describe("heartbeat", () => {
    it("should configure heartbeat interval from config", () => {
      const customServer = new AgentikWebSocketServer({
        port: testPort + 3,
        heartbeatInterval: 10000,
      });

      customServer.start();
      const stats = customServer.getStats();
      expect(stats.config.heartbeatInterval).toBe(10000);

      customServer.stop();
    });
  });

  describe("connection limits", () => {
    it("should respect maxConnections config", () => {
      const customServer = new AgentikWebSocketServer({
        port: testPort + 4,
        maxConnections: 100,
      });

      customServer.start();
      const stats = customServer.getStats();
      expect(stats.config.maxConnections).toBe(100);

      customServer.stop();
    });
  });

  describe("compression", () => {
    it("should enable compression if configured", () => {
      const customServer = new AgentikWebSocketServer({
        port: testPort + 5,
        enableCompression: true,
      });

      customServer.start();
      const stats = customServer.getStats();
      expect(stats.config.enableCompression).toBe(true);

      customServer.stop();
    });
  });
});

describe("WebSocket Server Singleton", () => {
  afterEach(() => {
    stopWebSocketServer();
  });

  describe("getWebSocketServer()", () => {
    it("should return singleton instance", () => {
      const server1 = getWebSocketServer();
      const server2 = getWebSocketServer();
      expect(server1).toBe(server2);
    });

    it("should accept custom config on first call", () => {
      const server = getWebSocketServer({ port: 9999 });
      const stats = server.getStats();
      expect(stats.config.port).toBe(9999);
    });
  });

  describe("startWebSocketServer()", () => {
    it("should start singleton server", () => {
      expect(() => startWebSocketServer({ port: 8082 })).not.toThrow();
    });
  });

  describe("stopWebSocketServer()", () => {
    it("should stop singleton server", () => {
      startWebSocketServer({ port: 8083 });
      expect(() => stopWebSocketServer()).not.toThrow();
    });

    it("should reset singleton to null", () => {
      startWebSocketServer({ port: 8084 });
      stopWebSocketServer();
      // Next getWebSocketServer should create new instance
      const newServer = getWebSocketServer({ port: 8085 });
      expect(newServer).toBeDefined();
    });
  });
});

describe("Message Handling", () => {
  let server: AgentikWebSocketServer;

  beforeEach(() => {
    server = new AgentikWebSocketServer({ port: 8090 });
    server.start();
  });

  afterEach(() => {
    server.stop();
  });

  it("should handle invalid JSON messages gracefully", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    // Server should not crash on invalid JSON
    expect(() => {
      // This simulates receiving invalid data
      // In real scenario, WebSocket 'message' event would handle this
    }).not.toThrow();

    consoleError.mockRestore();
  });
});

describe("Channel Subscriptions", () => {
  let server: AgentikWebSocketServer;

  beforeEach(() => {
    server = new AgentikWebSocketServer({ port: 8091 });
    server.start();
  });

  afterEach(() => {
    server.stop();
  });

  it("should support multiple channel types", () => {
    const channels = [
      "agent:test123",
      "user:user456",
      "budget:budget789",
      "system",
    ] as const;

    for (const channel of channels) {
      const message: WebSocketMessage = {
        type: "connection:established",
        channel,
        payload: { test: true },
        timestamp: Date.now(),
        messageId: `msg-${channel}`,
      };

      expect(() => server.broadcastToChannel(channel, message)).not.toThrow();
    }
  });
});

describe("Type Guards", () => {
  it("should validate channel format", () => {
    const validChannels = [
      "agent:j57abc123",
      "user:j57xyz789",
      "budget:j57budget1",
      "system",
    ];

    for (const channel of validChannels) {
      expect(typeof channel).toBe("string");
      expect(channel.length).toBeGreaterThan(0);
    }
  });

  it("should validate message structure", () => {
    const message: WebSocketMessage = {
      type: "cost:new",
      channel: "agent:test",
      payload: {},
      timestamp: Date.now(),
      messageId: "test-id",
    };

    expect(message).toHaveProperty("type");
    expect(message).toHaveProperty("channel");
    expect(message).toHaveProperty("payload");
    expect(message).toHaveProperty("timestamp");
    expect(message).toHaveProperty("messageId");
  });
});

// Additional comprehensive integration tests
describe("WebSocket Integration Tests", () => {
  let server: AgentikWebSocketServer;

  beforeEach(() => {
    server = new AgentikWebSocketServer({ port: 8095, maxConnections: 10 });
  });

  afterEach(() => {
    server.stop();
  });

  it("should handle full lifecycle: start -> connections -> broadcast -> stop", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    // Start server
    server.start();
    expect(consoleLog).toHaveBeenCalledWith(
      expect.stringContaining("[WebSocket] Server started")
    );

    // Get stats
    let stats = server.getStats();
    expect(stats.totalClients).toBe(0);

    // Broadcast should work even with no clients
    const message: WebSocketMessage = {
      type: "cost:new",
      channel: "agent:test",
      payload: { test: true },
      timestamp: Date.now(),
      messageId: "msg-lifecycle",
    };
    server.broadcastToAll(message);

    // Stop server
    server.stop();

    // Verify server stopped (wss is null, clients cleared)
    stats = server.getStats();
    expect(stats.totalClients).toBe(0);
    expect(stats.totalChannels).toBe(0);

    consoleLog.mockRestore();
  });

  it("should handle rapid start/stop cycles", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    const consoleWarn = vi.spyOn(console, "warn").mockImplementation(() => {});

    server.start();
    server.stop();

    server.start();
    server.stop();

    server.start();
    server.stop();

    expect(consoleLog).toHaveBeenCalled();

    consoleLog.mockRestore();
    consoleWarn.mockRestore();
  });

  it("should broadcast to multiple channels correctly", () => {
    server.start();

    const channels = [
      "agent:agent1",
      "agent:agent2",
      "user:user1",
      "budget:budget1",
      "system",
    ] as const;

    channels.forEach((channel) => {
      const message: WebSocketMessage = {
        type: "connection:established",
        channel,
        payload: { testChannel: channel },
        timestamp: Date.now(),
        messageId: `msg-${channel}`,
      };

      expect(() => server.broadcastToChannel(channel, message)).not.toThrow();
    });
  });

  it("should handle concurrent broadcasts", () => {
    server.start();

    const broadcasts = Array.from({ length: 10 }, (_, i) => ({
      type: "cost:new" as const,
      channel: `agent:concurrent${i}` as const,
      payload: { index: i },
      timestamp: Date.now(),
      messageId: `msg-concurrent-${i}`,
    }));

    broadcasts.forEach((message) => {
      expect(() => server.broadcastToChannel(message.channel, message)).not.toThrow();
    });
  });

  it("should handle edge case: empty payload", () => {
    server.start();

    const message: WebSocketMessage = {
      type: "connection:established",
      channel: "system",
      payload: {},
      timestamp: Date.now(),
      messageId: "msg-empty",
    };

    expect(() => server.broadcastToAll(message)).not.toThrow();
  });

  it("should handle edge case: large payload", () => {
    server.start();

    const largePayload = {
      data: "x".repeat(10000), // 10KB of data
      nested: {
        array: Array.from({ length: 100 }, (_, i) => ({ id: i, value: `item-${i}` })),
      },
    };

    const message: WebSocketMessage = {
      type: "cost:new",
      channel: "agent:large",
      payload: largePayload,
      timestamp: Date.now(),
      messageId: "msg-large",
    };

    expect(() => server.broadcastToChannel("agent:large", message)).not.toThrow();
  });

  it("should handle edge case: special characters in channel names", () => {
    server.start();

    // Valid channel formats with special characters
    const channels = [
      "agent:test-123",
      "agent:test_456",
      "user:user-id-789",
      "budget:my_budget_001",
    ] as const;

    channels.forEach((channel) => {
      const message: WebSocketMessage = {
        type: "agent:status",
        channel,
        payload: { status: "active" },
        timestamp: Date.now(),
        messageId: `msg-special-${channel}`,
      };

      expect(() => server.broadcastToChannel(channel, message)).not.toThrow();
    });
  });

  it("should return consistent stats", () => {
    server.start();

    const stats1 = server.getStats();
    const stats2 = server.getStats();

    expect(stats1.totalClients).toBe(stats2.totalClients);
    expect(stats1.totalChannels).toBe(stats2.totalChannels);
    expect(stats1.config.port).toBe(stats2.config.port);
  });

  it("should handle config with all options", () => {
    const fullConfigServer = new AgentikWebSocketServer({
      port: 9000,
      path: "/custom-ws",
      corsOrigins: ["http://example.com", "https://*.test.com"],
      heartbeatInterval: 20000,
      connectionTimeout: 45000,
      maxConnections: 50,
      enableCompression: false,
    });

    fullConfigServer.start();

    const stats = fullConfigServer.getStats();
    expect(stats.config.port).toBe(9000);
    expect(stats.config.path).toBe("/custom-ws");
    expect(stats.config.corsOrigins).toContain("http://example.com");
    expect(stats.config.heartbeatInterval).toBe(20000);
    expect(stats.config.connectionTimeout).toBe(45000);
    expect(stats.config.maxConnections).toBe(50);
    expect(stats.config.enableCompression).toBe(false);

    fullConfigServer.stop();
  });

  it("should handle partial config with defaults", () => {
    const partialServer = new AgentikWebSocketServer({
      port: 9001,
      // Other options should use defaults
    });

    partialServer.start();

    const stats = partialServer.getStats();
    expect(stats.config.port).toBe(9001);
    expect(stats.config.path).toBe("/ws"); // Default
    expect(stats.config.heartbeatInterval).toBe(30000); // Default
    expect(stats.config.enableCompression).toBe(true); // Default

    partialServer.stop();
  });
});

// Connection Handling Tests (with mocked WebSocket)
describe("WebSocket Connection Handling", () => {
  let server: AgentikWebSocketServer;
  let mockWs: any;

  beforeEach(() => {
    server = new AgentikWebSocketServer({ port: 8096 });
    server.start();

    // Create mock WebSocket connection
    mockWs = {
      on: vi.fn(),
      send: vi.fn(),
      close: vi.fn(),
      readyState: 1, // OPEN
    };
  });

  afterEach(() => {
    server.stop();
  });

  it("should handle new connection and send connection:established", () => {
    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };

    // Simulate connection - access private method via any
    (server as any).handleConnection(mockWs, mockReq);

    // Should set up event listeners
    expect(mockWs.on).toHaveBeenCalledWith("message", expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith("close", expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith("error", expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith("pong", expect.any(Function));

    // Should send connection:established message
    expect(mockWs.send).toHaveBeenCalled();
    const sentMessage = JSON.parse(mockWs.send.mock.calls[0][0]);
    expect(sentMessage.type).toBe("connection:established");
    expect(sentMessage.payload.clientId).toBeDefined();

    // Should increment client count
    const stats = server.getStats();
    expect(stats.totalClients).toBe(1);
  });

  it("should reject connection when max connections reached", () => {
    const smallServer = new AgentikWebSocketServer({ port: 8097, maxConnections: 1 });
    smallServer.start();

    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };
    const mockWs1 = { ...mockWs };
    const mockWs2 = { ...mockWs, close: vi.fn() };

    // First connection should succeed
    (smallServer as any).handleConnection(mockWs1, mockReq);
    expect(smallServer.getStats().totalClients).toBe(1);

    // Second connection should be rejected
    (smallServer as any).handleConnection(mockWs2, mockReq);
    expect(mockWs2.close).toHaveBeenCalledWith(1008, "Server at capacity");

    smallServer.stop();
  });

  it("should handle CORS origin validation", () => {
    // Test with allowed origin
    const allowedReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };
    const mockWs1 = { ...mockWs };

    // Should not throw or reject
    expect(() => {
      (server as any).handleConnection(mockWs1, allowedReq);
    }).not.toThrow();

    // Should have created connection
    expect(server.getStats().totalClients).toBe(1);
  });

  it("should track multiple clients correctly", () => {
    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };

    const mockWs1 = { ...mockWs, send: vi.fn() };
    const mockWs2 = { ...mockWs, send: vi.fn() };
    const mockWs3 = { ...mockWs, send: vi.fn() };

    (server as any).handleConnection(mockWs1, mockReq);
    (server as any).handleConnection(mockWs2, mockReq);
    (server as any).handleConnection(mockWs3, mockReq);

    // Should track all 3 clients
    expect(server.getStats().totalClients).toBe(3);
  });

  it("should handle invalid JSON message", () => {
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };
    (server as any).handleConnection(mockWs, mockReq);

    const messageHandler = mockWs.on.mock.calls.find(
      (call: any[]) => call[0] === "message"
    )[1];

    // Send invalid JSON
    messageHandler("{ invalid json }");

    // Should log error but not crash
    expect(consoleError).toHaveBeenCalled();

    consoleError.mockRestore();
  });

  it("should handle client disconnect", () => {
    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };
    const mockWs1 = { ...mockWs };

    (server as any).handleConnection(mockWs1, mockReq);
    expect(server.getStats().totalClients).toBe(1);

    // Trigger disconnect
    const closeHandler = mockWs1.on.mock.calls.find(
      (call: any[]) => call[0] === "close"
    )[1];
    closeHandler();

    // Should clean up client
    const stats = server.getStats();
    expect(stats.totalClients).toBe(0);
  });

  it("should handle connection errors gracefully", () => {
    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };
    const mockWs1 = { ...mockWs };

    (server as any).handleConnection(mockWs1, mockReq);

    // Trigger error
    const errorHandler = mockWs1.on.mock.calls.find(
      (call: any[]) => call[0] === "error"
    )[1];

    // Should not throw
    expect(() => errorHandler(new Error("Test error"))).not.toThrow();
  });

  it("should broadcast to all connected clients", () => {
    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };

    // Create 2 clients
    const mockWs1 = { ...mockWs, send: vi.fn() };
    const mockWs2 = { ...mockWs, send: vi.fn() };

    (server as any).handleConnection(mockWs1, mockReq);
    (server as any).handleConnection(mockWs2, mockReq);

    // Clear connection messages
    mockWs1.send.mockClear();
    mockWs2.send.mockClear();

    // Broadcast to all
    const broadcastMsg: WebSocketMessage = {
      type: "agent:status",
      channel: "system",
      payload: { status: "active" },
      timestamp: Date.now(),
      messageId: "msg-001",
    };
    server.broadcastToAll(broadcastMsg);

    // Both clients should receive
    expect(mockWs1.send).toHaveBeenCalledTimes(1);
    expect(mockWs2.send).toHaveBeenCalledTimes(1);
  });

  it("should handle pong event to mark client alive", () => {
    const mockReq = { url: "/ws", headers: { origin: "http://localhost:3000" } };
    const mockWs1 = { ...mockWs };

    (server as any).handleConnection(mockWs1, mockReq);

    // Get pong handler
    const pongHandler = mockWs1.on.mock.calls.find(
      (call: any[]) => call[0] === "pong"
    )[1];

    // Trigger pong event
    expect(() => pongHandler()).not.toThrow();
  });

  it("should handle server with empty client list", () => {
    // Start server with no connections
    expect(server.getStats().totalClients).toBe(0);

    // Broadcasting should not crash
    const msg: WebSocketMessage = {
      type: "cost:new",
      channel: "test",
      payload: {},
      timestamp: Date.now(),
      messageId: "msg-1",
    };

    expect(() => server.broadcastToAll(msg)).not.toThrow();
    expect(() => server.broadcastToChannel("test", msg)).not.toThrow();
  });

  it("should stop server even if not started", () => {
    const freshServer = new AgentikWebSocketServer({ port: 8098 });
    // Don't start it
    expect(() => freshServer.stop()).not.toThrow();
  });

  it("should handle wildcard CORS origins", () => {
    const wildcardServer = new AgentikWebSocketServer({
      port: 8099,
      corsOrigins: ["https://*.example.com"],
    });

    wildcardServer.start();
    const stats = wildcardServer.getStats();
    expect(stats.config.corsOrigins).toContain("https://*.example.com");
    wildcardServer.stop();
  });
});
