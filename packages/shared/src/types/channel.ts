/**
 * Channel Types - Shared across runtime, dashboard, and CLI
 *
 * Defines the interface for all channel adapters (CLI, API, Telegram, Discord, etc.)
 * and the message format that flows through the system.
 */

export type ChannelType = "cli" | "api" | "telegram" | "discord" | "slack" | "whatsapp" | "webhook" | "web" | "sms" | "teams";

export interface ChannelConfig {
  type: ChannelType;
  /** Channel-specific config (token, webhook URL, port, etc.) */
  options: Record<string, unknown>;
  /** Whether the channel is enabled */
  enabled: boolean;
}

export interface RawMessage {
  channel: ChannelType;
  channelMessageId: string;
  userId: string;
  agentId?: string;
  content: string;
  attachments?: Attachment[];
  metadata?: Record<string, unknown>;
  /** Channel-specific raw data (grammY ctx, Express req, etc.) */
  raw?: unknown;
  timestamp: Date;
}

export interface Attachment {
  type: "image" | "file" | "audio" | "video";
  url?: string;
  buffer?: Buffer;
  mimeType: string;
  filename?: string;
  size?: number;
}

export interface ResponseContent {
  text: string;
  /** Optional structured data (buttons, cards, embeds) */
  richContent?: RichContent[];
  /** Optional metadata for channel-specific rendering */
  metadata?: Record<string, unknown>;
}

export interface RichContent {
  type: "button" | "card" | "embed" | "code_block" | "image";
  data: Record<string, unknown>;
}

/**
 * Channel Adapter Interface
 *
 * All channel implementations (Telegram, Discord, CLI, API, etc.) must implement this interface.
 * The adapter handles bidirectional communication:
 * - Receiving messages from the channel → pipeline
 * - Sending responses from pipeline → channel
 */
export interface ChannelAdapter {
  readonly name: ChannelType;

  /** Initialize connection (bot login, server start, etc.) */
  connect(config: ChannelConfig): Promise<void>;

  /** Graceful shutdown */
  disconnect(): Promise<void>;

  /** Register message handler — called by pipeline */
  onMessage(handler: (msg: RawMessage) => Promise<void>): void;

  /** Send a response to a specific recipient */
  send(to: string, content: ResponseContent): Promise<void>;

  /** Send a file (for channels that support it) */
  sendFile(to: string, file: Buffer, caption?: string): Promise<void>;

  /** Check if the channel is connected */
  isConnected(): boolean;
}
