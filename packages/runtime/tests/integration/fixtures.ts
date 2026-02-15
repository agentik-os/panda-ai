/**
 * Test Fixtures for Integration Tests
 *
 * Reusable test data for message pipeline integration tests
 */

import type { Message, ChannelType } from "@agentik-os/shared";

export interface TestRawMessage {
  channel: ChannelType;
  channelMessageId: string;
  userId: string;
  agentId?: string;
  content: string;
  attachments?: any[];
  metadata?: Record<string, unknown>;
  timestamp?: Date;
}

/**
 * Create a sample raw message
 */
export function createRawMessage(
  overrides: Partial<TestRawMessage> = {}
): TestRawMessage {
  return {
    channel: "cli",
    channelMessageId: `test_${Date.now()}`,
    userId: "test_user_123",
    content: "Test message",
    ...overrides,
  };
}

/**
 * Create a normalized Message object
 */
export function createMessage(overrides: Partial<Message> = {}): Message {
  return {
    id: `msg_${Date.now()}_test`,
    channel: "cli",
    channelMessageId: `test_${Date.now()}`,
    userId: "test_user_123",
    agentId: "default",
    content: "Test message",
    metadata: {},
    timestamp: new Date(),
    ...overrides,
  };
}

/**
 * Sample messages for different channels
 */
export const sampleMessages = {
  cli: createRawMessage({
    channel: "cli",
    content: "Hello from CLI",
  }),

  telegram: createRawMessage({
    channel: "telegram",
    channelMessageId: "tg_123",
    userId: "telegram_user_456",
    content: "Hello from Telegram",
  }),

  discord: createRawMessage({
    channel: "discord",
    channelMessageId: "discord_789",
    userId: "discord_user_012",
    content: "Hello from Discord",
  }),

  web: createRawMessage({
    channel: "web",
    channelMessageId: "web_345",
    userId: "web_user_678",
    content: "Hello from Web",
    metadata: {
      ip: "192.168.1.1",
      userAgent: "Mozilla/5.0",
    },
  }),

  api: createRawMessage({
    channel: "api",
    channelMessageId: "api_901",
    userId: "api_client_234",
    content: "Hello from API",
  }),

  withAttachments: createRawMessage({
    channel: "web",
    content: "Message with attachments",
    attachments: [
      {
        id: "att_1",
        type: "image",
        url: "https://example.com/image.png",
        filename: "image.png",
        mimeType: "image/png",
        size: 1024,
      },
      {
        id: "att_2",
        type: "file",
        url: "https://example.com/document.pdf",
        filename: "document.pdf",
        mimeType: "application/pdf",
        size: 2048,
      },
    ],
  }),

  withMention: createRawMessage({
    channel: "telegram",
    content: "@nova help me with this task",
  }),

  withExplicitAgent: createRawMessage({
    channel: "api",
    agentId: "custom-agent",
    content: "Message for specific agent",
  }),
};

/**
 * Standard routing configuration for tests
 */
export const defaultRoutingConfig = {
  defaultAgentId: "default-agent",
  channelAgents: {
    telegram: "telegram-bot",
    discord: "discord-bot",
    web: "web-assistant",
  },
};

/**
 * Sample attachments for testing
 */
export const sampleAttachments = {
  valid: [
    {
      id: "att_valid_1",
      type: "image",
      url: "https://example.com/valid.png",
      filename: "valid.png",
      mimeType: "image/png",
      size: 1024,
    },
  ],

  invalid: [
    "invalid_string",
    null,
    undefined,
    { type: "missing_id" },
    { id: "missing_type" },
    { id: "att_1" }, // missing required fields
  ],

  mixed: [
    {
      id: "att_valid",
      type: "file",
      url: "https://example.com/valid.pdf",
    },
    "invalid",
    null,
    { type: "missing_id" },
  ],
};
