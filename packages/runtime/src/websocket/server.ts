/**
 * WebSocket Real-Time Updates - Server
 *
 * WebSocket server for real-time updates to dashboard clients.
 * Supports per-agent, per-user, and per-budget subscriptions.
 */

import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "node:crypto";
import type {
  WebSocketMessage,
  WebSocketChannel,
  WebSocketServerConfig,
  ClientMessage,
  ConnectionEstablishedPayload,
  SubscriptionConfirmedPayload,
} from "./types";
import { DEFAULT_WS_CONFIG } from "./types";

/**
 * Connected client information
 */
interface ConnectedClient {
  ws: WebSocket;
  clientId: string;
  userId?: string;
  channels: Set<WebSocketChannel>;
  lastPing: number;
  isAlive: boolean;
}

/**
 * WebSocket server singleton
 */
export class AgentikWebSocketServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private channelSubscribers: Map<WebSocketChannel, Set<string>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private config: WebSocketServerConfig;

  constructor(config: Partial<WebSocketServerConfig> = {}) {
    this.config = { ...DEFAULT_WS_CONFIG, ...config };
  }

  /**
   * Start WebSocket server
   */
  public start(): void {
    if (this.wss) {
      console.warn("[WebSocket] Server already running");
      return;
    }

    this.wss = new WebSocketServer({
      port: this.config.port,
      path: this.config.path,
      perMessageDeflate: this.config.enableCompression,
      maxPayload: 100 * 1024, // 100KB max message size
    });

    this.wss.on("connection", (ws: WebSocket, req) => {
      this.handleConnection(ws, req);
    });

    this.wss.on("error", (error) => {
      console.error("[WebSocket] Server error:", error);
    });

    // Start heartbeat
    this.startHeartbeat();

    console.log(
      `[WebSocket] Server started on port ${this.config.port} path ${this.config.path}`
    );
  }

  /**
   * Stop WebSocket server
   */
  public stop(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }

    // Close all client connections
    for (const client of this.clients.values()) {
      client.ws.close(1000, "Server shutting down");
    }
    this.clients.clear();
    this.channelSubscribers.clear();

    if (this.wss) {
      this.wss.close(() => {
        console.log("[WebSocket] Server stopped");
      });
      this.wss = null;
    }
  }

  /**
   * Handle new WebSocket connection
   */
  private handleConnection(ws: WebSocket, req: any): void {
    const clientId = randomUUID();

    // Check connection limit
    if (this.clients.size >= this.config.maxConnections) {
      console.warn("[WebSocket] Max connections reached, rejecting client");
      ws.close(1008, "Server at capacity");
      return;
    }

    // CORS check
    const origin = req.headers.origin;
    if (origin && !this.isOriginAllowed(origin)) {
      console.warn(`[WebSocket] Rejected connection from origin: ${origin}`);
      ws.close(1008, "Origin not allowed");
      return;
    }

    const client: ConnectedClient = {
      ws,
      clientId,
      channels: new Set(),
      lastPing: Date.now(),
      isAlive: true,
    };

    this.clients.set(clientId, client);

    console.log(
      `[WebSocket] Client connected: ${clientId} (${this.clients.size} total)`
    );

    // Handle messages
    ws.on("message", (data: Buffer) => {
      this.handleMessage(clientId, data);
    });

    // Handle pong (heartbeat response)
    ws.on("pong", () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.isAlive = true;
        client.lastPing = Date.now();
      }
    });

    // Handle close
    ws.on("close", () => {
      this.handleDisconnect(clientId);
    });

    // Handle error
    ws.on("error", (error) => {
      console.error(`[WebSocket] Client ${clientId} error:`, error);
      this.handleDisconnect(clientId);
    });

    // Send connection established message
    this.sendToClient(clientId, {
      type: "connection:established",
      channel: "system",
      payload: {
        clientId,
        channels: Array.from(client.channels),
        timestamp: Date.now(),
      } as ConnectionEstablishedPayload,
      timestamp: Date.now(),
      messageId: randomUUID(),
    });
  }

  /**
   * Handle client message
   */
  private handleMessage(clientId: string, data: Buffer): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      const message: ClientMessage = JSON.parse(data.toString());

      switch (message.type) {
        case "subscribe":
          if (message.channels) {
            this.handleSubscribe(clientId, message.channels);
          }
          break;

        case "unsubscribe":
          if (message.channels) {
            this.handleUnsubscribe(clientId, message.channels);
          }
          break;

        case "ping":
          client.lastPing = Date.now();
          client.isAlive = true;
          break;

        default:
          console.warn(
            `[WebSocket] Unknown message type from ${clientId}:`,
            message.type
          );
      }
    } catch (error) {
      console.error(`[WebSocket] Failed to parse message from ${clientId}:`, error);
    }
  }

  /**
   * Handle client subscription request
   */
  private handleSubscribe(
    clientId: string,
    channels: WebSocketChannel[]
  ): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    for (const channel of channels) {
      // Add channel to client's subscriptions
      client.channels.add(channel);

      // Add client to channel subscribers
      if (!this.channelSubscribers.has(channel)) {
        this.channelSubscribers.set(channel, new Set());
      }
      this.channelSubscribers.get(channel)!.add(clientId);

      // Send confirmation
      this.sendToClient(clientId, {
        type: "subscription:confirmed",
        channel,
        payload: {
          channel,
          timestamp: Date.now(),
        } as SubscriptionConfirmedPayload,
        timestamp: Date.now(),
        messageId: randomUUID(),
      });

      console.log(`[WebSocket] Client ${clientId} subscribed to ${channel}`);
    }
  }

  /**
   * Handle client unsubscribe request
   */
  private handleUnsubscribe(
    clientId: string,
    channels: WebSocketChannel[]
  ): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    for (const channel of channels) {
      // Remove channel from client's subscriptions
      client.channels.delete(channel);

      // Remove client from channel subscribers
      const subscribers = this.channelSubscribers.get(channel);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(channel);
        }
      }

      console.log(`[WebSocket] Client ${clientId} unsubscribed from ${channel}`);
    }
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(clientId: string): void {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all channel subscriptions
    for (const channel of client.channels) {
      const subscribers = this.channelSubscribers.get(channel);
      if (subscribers) {
        subscribers.delete(clientId);
        if (subscribers.size === 0) {
          this.channelSubscribers.delete(channel);
        }
      }
    }

    this.clients.delete(clientId);
    console.log(
      `[WebSocket] Client disconnected: ${clientId} (${this.clients.size} remaining)`
    );
  }

  /**
   * Send message to specific client
   */
  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      client.ws.send(JSON.stringify(message));
    } catch (error) {
      console.error(`[WebSocket] Failed to send to client ${clientId}:`, error);
    }
  }

  /**
   * Broadcast message to channel subscribers
   *
   * Public method used by event publishers
   */
  public broadcastToChannel(
    channel: WebSocketChannel,
    message: WebSocketMessage
  ): void {
    const subscribers = this.channelSubscribers.get(channel);
    if (!subscribers || subscribers.size === 0) {
      return; // No subscribers for this channel
    }

    let sent = 0;
    for (const clientId of subscribers) {
      this.sendToClient(clientId, message);
      sent++;
    }

    console.log(
      `[WebSocket] Broadcast to ${channel}: ${sent} clients, event: ${message.type}`
    );
  }

  /**
   * Broadcast message to all connected clients
   */
  public broadcastToAll(message: WebSocketMessage): void {
    let sent = 0;
    for (const [clientId, client] of this.clients) {
      if (client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, message);
        sent++;
      }
    }

    console.log(
      `[WebSocket] Broadcast to all: ${sent} clients, event: ${message.type}`
    );
  }

  /**
   * Start heartbeat interval to detect dead connections
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      const now = Date.now();

      for (const [clientId, client] of this.clients) {
        // Check if client is alive
        if (!client.isAlive) {
          console.log(`[WebSocket] Terminating dead client: ${clientId}`);
          client.ws.terminate();
          this.handleDisconnect(clientId);
          continue;
        }

        // Check connection timeout
        if (now - client.lastPing > this.config.connectionTimeout) {
          console.log(`[WebSocket] Client ${clientId} timed out`);
          client.ws.close(1000, "Connection timeout");
          this.handleDisconnect(clientId);
          continue;
        }

        // Send ping
        client.isAlive = false;
        client.ws.ping();
      }
    }, this.config.heartbeatInterval);
  }

  /**
   * Check if origin is allowed (CORS)
   */
  private isOriginAllowed(origin: string): boolean {
    for (const allowed of this.config.corsOrigins) {
      if (allowed === "*") return true;
      if (allowed.includes("*")) {
        // Wildcard support (e.g., "https://*.agentik-os.com")
        const regex = new RegExp(
          "^" + allowed.replace(/\./g, "\\.").replace(/\*/g, ".*") + "$"
        );
        if (regex.test(origin)) return true;
      } else if (origin === allowed) {
        return true;
      }
    }
    return false;
  }

  /**
   * Get server statistics
   */
  public getStats() {
    return {
      totalClients: this.clients.size,
      totalChannels: this.channelSubscribers.size,
      config: this.config,
      uptime: this.wss ? Date.now() - this.wss.options.port! : 0,
    };
  }
}

/**
 * Singleton instance
 */
let wsServer: AgentikWebSocketServer | null = null;

/**
 * Get or create WebSocket server instance
 */
export function getWebSocketServer(
  config?: Partial<WebSocketServerConfig>
): AgentikWebSocketServer {
  if (!wsServer) {
    wsServer = new AgentikWebSocketServer(config);
  }
  return wsServer;
}

/**
 * Start WebSocket server (called on runtime startup)
 */
export function startWebSocketServer(
  config?: Partial<WebSocketServerConfig>
): void {
  const server = getWebSocketServer(config);
  server.start();
}

/**
 * Stop WebSocket server (called on runtime shutdown)
 */
export function stopWebSocketServer(): void {
  if (wsServer) {
    wsServer.stop();
    wsServer = null;
  }
}
