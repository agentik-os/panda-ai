/**
 * WebSocket Client for Dashboard
 *
 * Connects to runtime WebSocket server for real-time updates.
 * Handles auto-reconnect, channel subscriptions, and message handling.
 */

import { io, Socket } from "socket.io-client";

/**
 * WebSocket channel types
 */
export type WebSocketChannel =
  | `agent:${string}`
  | `user:${string}`
  | `budget:${string}`
  | "system";

/**
 * WebSocket event types
 */
export type WebSocketEventType =
  | "cost:new"
  | "cost:updated"
  | "budget:alert"
  | "budget:exceeded"
  | "budget:reset"
  | "agent:status"
  | "agent:paused"
  | "agent:resumed"
  | "connection:established"
  | "connection:error"
  | "subscription:confirmed"
  | "subscription:error";

/**
 * WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  channel: WebSocketChannel;
  payload: T;
  timestamp: number;
  messageId: string;
}

/**
 * WebSocket client configuration
 */
export interface WebSocketClientConfig {
  url: string;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  autoConnect?: boolean;
}

/**
 * Message handler callback
 */
export type MessageHandler<T = unknown> = (message: WebSocketMessage<T>) => void;

/**
 * WebSocket Client
 *
 * Manages connection to runtime WebSocket server.
 * Provides subscribe/unsubscribe for channels and message handling.
 */
export class WebSocketClient {
  private socket: Socket | null = null;
  private config: Required<WebSocketClientConfig>;
  private messageHandlers: Map<string, Set<MessageHandler>> = new Map();
  private reconnectAttempts = 0;
  private isConnecting = false;

  constructor(config: WebSocketClientConfig) {
    this.config = {
      url: config.url,
      reconnectionAttempts: config.reconnectionAttempts ?? 10,
      reconnectionDelay: config.reconnectionDelay ?? 3000,
      autoConnect: config.autoConnect ?? true,
    };

    if (this.config.autoConnect) {
      this.connect();
    }
  }

  /**
   * Connect to WebSocket server
   */
  public connect(): void {
    if (this.socket?.connected || this.isConnecting) {
      console.warn("[WebSocket Client] Already connected or connecting");
      return;
    }

    this.isConnecting = true;

    this.socket = io(this.config.url, {
      transports: ["websocket"],
      reconnection: true,
      reconnectionAttempts: this.config.reconnectionAttempts,
      reconnectionDelay: this.config.reconnectionDelay,
    });

    this.setupEventHandlers();
    this.isConnecting = false;
  }

  /**
   * Setup socket event handlers
   */
  private setupEventHandlers(): void {
    if (!this.socket) return;

    this.socket.on("connect", () => {
      console.log("[WebSocket Client] Connected to server");
      this.reconnectAttempts = 0;
      this.resubscribeChannels();
    });

    this.socket.on("disconnect", (reason) => {
      console.log(`[WebSocket Client] Disconnected: ${reason}`);
    });

    this.socket.on("connect_error", (error) => {
      console.error("[WebSocket Client] Connection error:", error);
      this.reconnectAttempts++;

      if (this.reconnectAttempts >= this.config.reconnectionAttempts) {
        console.error("[WebSocket Client] Max reconnection attempts reached");
        this.disconnect();
      }
    });

    // Listen for all WebSocket messages
    this.socket.onAny((_eventName: string, message: WebSocketMessage) => {
      this.handleMessage(message);
    });
  }

  /**
   * Handle incoming WebSocket message
   */
  private handleMessage(message: WebSocketMessage): void {
    // Call handlers for specific event type
    const typeHandlers = this.messageHandlers.get(message.type);
    if (typeHandlers) {
      for (const handler of typeHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error("[WebSocket Client] Handler error:", error);
        }
      }
    }

    // Call handlers for specific channel
    const channelHandlers = this.messageHandlers.get(message.channel);
    if (channelHandlers) {
      for (const handler of channelHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error("[WebSocket Client] Handler error:", error);
        }
      }
    }

    // Call wildcard handlers
    const wildcardHandlers = this.messageHandlers.get("*");
    if (wildcardHandlers) {
      for (const handler of wildcardHandlers) {
        try {
          handler(message);
        } catch (error) {
          console.error("[WebSocket Client] Handler error:", error);
        }
      }
    }
  }

  /**
   * Subscribe to channel
   *
   * Sends subscription request to server and adds local handler.
   */
  public subscribe(
    channel: WebSocketChannel,
    handler: MessageHandler
  ): () => void {
    // Add handler
    if (!this.messageHandlers.has(channel)) {
      this.messageHandlers.set(channel, new Set());
    }
    this.messageHandlers.get(channel)!.add(handler);

    // Send subscription to server
    if (this.socket?.connected) {
      this.socket.emit("subscribe", { channels: [channel] });
    }

    // Return unsubscribe function
    return () => this.unsubscribe(channel, handler);
  }

  /**
   * Subscribe to event type
   *
   * Listen for specific event types regardless of channel.
   */
  public subscribeToEvent(
    eventType: WebSocketEventType,
    handler: MessageHandler
  ): () => void {
    // Add handler for event type
    if (!this.messageHandlers.has(eventType)) {
      this.messageHandlers.set(eventType, new Set());
    }
    this.messageHandlers.get(eventType)!.add(handler);

    // Return unsubscribe function
    return () => this.unsubscribeFromEvent(eventType, handler);
  }

  /**
   * Subscribe to all messages (wildcard)
   */
  public subscribeAll(handler: MessageHandler): () => void {
    if (!this.messageHandlers.has("*")) {
      this.messageHandlers.set("*", new Set());
    }
    this.messageHandlers.get("*")!.add(handler);

    return () => {
      const handlers = this.messageHandlers.get("*");
      if (handlers) {
        handlers.delete(handler);
      }
    };
  }

  /**
   * Unsubscribe from channel
   */
  public unsubscribe(channel: WebSocketChannel, handler: MessageHandler): void {
    const handlers = this.messageHandlers.get(channel);
    if (handlers) {
      handlers.delete(handler);

      // If no more handlers, unsubscribe from server
      if (handlers.size === 0) {
        this.messageHandlers.delete(channel);
        if (this.socket?.connected) {
          this.socket.emit("unsubscribe", { channels: [channel] });
        }
      }
    }
  }

  /**
   * Unsubscribe from event type
   */
  public unsubscribeFromEvent(
    eventType: WebSocketEventType,
    handler: MessageHandler
  ): void {
    const handlers = this.messageHandlers.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.messageHandlers.delete(eventType);
      }
    }
  }

  /**
   * Resubscribe to all channels after reconnect
   */
  private resubscribeChannels(): void {
    if (!this.socket?.connected) return;

    const channels: WebSocketChannel[] = [];
    for (const key of this.messageHandlers.keys()) {
      if (key !== "*" && !key.includes(":")) {
        // Skip event types, only resubscribe channels
        continue;
      }
      if (key.includes(":")) {
        channels.push(key as WebSocketChannel);
      }
    }

    if (channels.length > 0) {
      this.socket.emit("subscribe", { channels });
      console.log(
        `[WebSocket Client] Resubscribed to ${channels.length} channels`
      );
    }
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get connection state
   */
  public getState(): {
    connected: boolean;
    reconnectAttempts: number;
    subscribedChannels: number;
  } {
    return {
      connected: this.isConnected(),
      reconnectAttempts: this.reconnectAttempts,
      subscribedChannels: this.messageHandlers.size,
    };
  }
}

/**
 * Get WebSocket server URL from environment
 */
export function getWebSocketUrl(): string {
  // In development, use localhost
  if (process.env.NODE_ENV === "development") {
    return process.env.NEXT_PUBLIC_WS_URL || "http://localhost:8080";
  }

  // In production, use configured URL
  return process.env.NEXT_PUBLIC_WS_URL || "wss://api.agentik-os.com";
}

/**
 * Create WebSocket client instance
 */
export function createWebSocketClient(
  config?: Partial<WebSocketClientConfig>
): WebSocketClient {
  return new WebSocketClient({
    url: getWebSocketUrl(),
    ...config,
  });
}
