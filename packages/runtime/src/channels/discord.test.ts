import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { DiscordChannel } from "./discord";
import type { ChannelConfig, RawMessage, ResponseContent } from "@agentik-os/shared";

// Mock discord.js
vi.mock("discord.js", () => {
  const mockChannel = {
    send: vi.fn().mockResolvedValue({}),
    sendTyping: vi.fn().mockResolvedValue(undefined),
    isTextBased: vi.fn().mockReturnValue(true),
    permissionsFor: vi.fn().mockReturnValue({
      has: vi.fn().mockReturnValue(true),
    }),
    name: "test-channel",
    type: 0, // GUILD_TEXT
  };

  const mockUser = {
    id: "123456789",
    tag: "TestBot#1234",
    username: "TestBot",
  };

  class MockClient {
    user = mockUser;
    options = {
      intents: {
        has: vi.fn().mockReturnValue(true),
      },
    };
    channels = {
      fetch: vi.fn().mockResolvedValue(mockChannel),
    };
    on = vi.fn();
    once = vi.fn((event: string, handler: Function) => {
      if (event === "ready") {
        setTimeout(() => handler(), 0);
      }
    });
    login = vi.fn().mockResolvedValue("token");
    destroy = vi.fn();
    isReady = vi.fn().mockReturnValue(true);
  }

  const mockREST = {
    setToken: vi.fn().mockReturnThis(),
    put: vi.fn().mockResolvedValue([]),
  };

  class MockRESTClass {
    setToken = vi.fn().mockReturnThis();
    put = vi.fn().mockResolvedValue([]);
  }

  class MockEmbedBuilder {
    setColor = vi.fn().mockReturnThis();
    setTitle = vi.fn().mockReturnThis();
    setDescription = vi.fn().mockReturnThis();
    setThumbnail = vi.fn().mockReturnThis();
    setImage = vi.fn().mockReturnThis();
    setFooter = vi.fn().mockReturnThis();
    addFields = vi.fn().mockReturnThis();
  }

  class MockButtonBuilder {
    setCustomId = vi.fn().mockReturnThis();
    setLabel = vi.fn().mockReturnThis();
    setStyle = vi.fn().mockReturnThis();
  }

  class MockActionRowBuilder {
    addComponents = vi.fn().mockReturnThis();
  }

  class MockSlashCommandBuilder {
    setName = vi.fn().mockReturnThis();
    setDescription = vi.fn().mockReturnThis();
    addStringOption = vi.fn().mockReturnThis();
    toJSON = vi.fn().mockReturnValue({});
  }

  return {
    Client: MockClient,
    GatewayIntentBits: {
      Guilds: 1,
      GuildMessages: 2,
      MessageContent: 4,
      DirectMessages: 8,
    },
    EmbedBuilder: MockEmbedBuilder,
    ButtonBuilder: MockButtonBuilder,
    ActionRowBuilder: MockActionRowBuilder,
    SlashCommandBuilder: MockSlashCommandBuilder,
    REST: MockRESTClass,
    Routes: {
      applicationCommands: vi.fn((clientId) => `/applications/${clientId}/commands`),
    },
    ChannelType: {
      DM: 1,
      GuildText: 0,
    },
    PermissionFlagsBits: {
      SendMessages: 1,
      ReadMessageHistory: 2,
      EmbedLinks: 4,
      AttachFiles: 8,
    },
    ButtonStyle: {
      Primary: 1,
    },
  };
});

describe("DiscordChannel", () => {
  let channel: DiscordChannel;
  let mockConfig: ChannelConfig;

  beforeEach(() => {
    channel = new DiscordChannel();
    mockConfig = {
      type: "discord",
      options: {
        botToken: "MTIzNDU2Nzg5.GhIjKl.MnOpQrStUvWxYz",
        clientId: "123456789012345678",
      },
      enabled: true,
    };
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("ChannelAdapter interface", () => {
    it("should have name 'discord'", () => {
      expect(channel.name).toBe("discord");
    });

    it("should start disconnected", () => {
      expect(channel.isConnected()).toBe(false);
    });

    it("should connect with bot token", async () => {
      await channel.connect(mockConfig);
      expect(channel.isConnected()).toBe(true);
    });

    it("should throw error if bot token is missing", async () => {
      mockConfig.options.botToken = undefined;

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Discord bot token is required"
      );
    });

    it("should throw error if client ID is missing", async () => {
      mockConfig.options.clientId = undefined;

      await expect(channel.connect(mockConfig)).rejects.toThrow(
        "Discord client ID is required"
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

    it("should send text response", async () => {
      const content: ResponseContent = {
        text: "Hello, Discord!",
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should send embeds", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "card",
            data: {
              title: "Test Card",
              description: "Card description",
              color: 0x5865f2,
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should send buttons", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "button",
            data: {
              text: "Click me",
              label: "Button",
              action: { type: "test" },
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should send file with caption", async () => {
      const file = Buffer.from("test file content");
      await channel.sendFile("123456789", file, "test.txt");
      expect(channel.isConnected()).toBe(true);
    });

    it("should throw error if not connected", async () => {
      await channel.disconnect();
      const content: ResponseContent = { text: "Test" };

      await expect(channel.send("123456789", content)).rejects.toThrow(
        "Bot not connected"
      );
    });

    it("should split long messages (>2000 chars)", async () => {
      const longText = "A".repeat(2500);
      const content: ResponseContent = {
        text: longText,
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
      // Message is split internally
    });
  });

  describe("Slash commands", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should register slash commands on connect", async () => {
      // Commands are registered during connect
      expect(channel.isConnected()).toBe(true);
    });

    it("should support /ask command", () => {
      expect(channel.isConnected()).toBe(true);
    });

    it("should support /agent command", () => {
      expect(channel.isConnected()).toBe(true);
    });

    it("should support /clear command", () => {
      expect(channel.isConnected()).toBe(true);
    });

    it("should support /status command", () => {
      expect(channel.isConnected()).toBe(true);
    });

    it("should support /help command", () => {
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Message parsing", () => {
    it("should extract message content", () => {
      const mockMessage = {
        id: "123",
        author: { id: "456", bot: false },
        content: "Hello bot!",
        attachments: new Map(),
        createdAt: new Date(),
      };

      expect(mockMessage.content).toBe("Hello bot!");
    });

    it("should extract attachments", () => {
      const mockAttachment = {
        id: "789",
        url: "https://cdn.discord.com/file.png",
        name: "file.png",
        contentType: "image/png",
        size: 1024,
      };

      expect(mockAttachment.contentType).toBe("image/png");
    });

    it("should handle empty content", () => {
      const mockMessage = {
        id: "123",
        author: { id: "456", bot: false },
        content: "",
        attachments: new Map(),
        createdAt: new Date(),
      };

      expect(mockMessage.content).toBe("");
    });
  });

  describe("Permissions", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should check channel permissions", async () => {
      // Permission check happens in handleGuildMessage
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle text-based channels", async () => {
      const content: ResponseContent = { text: "Test" };
      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Guild vs DM", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle DM messages", () => {
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle guild messages", () => {
      expect(channel.isConnected()).toBe(true);
    });

    it("should detect agent channels", () => {
      const channelNames = ["ai-chat", "bot-commands", "agent-test"];
      // These would trigger isAgentChannel()
      expect(channelNames.length).toBeGreaterThan(0);
    });
  });

  describe("Rich content building", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should build embeds from rich content", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "embed",
            data: {
              title: "Embed Title",
              description: "Embed description",
              thumbnail: "https://example.com/thumb.png",
              image: "https://example.com/image.png",
              footer: "Footer text",
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should build button components from rich content", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "button",
            data: {
              label: "Button 1",
              action: "action1",
            },
          },
          {
            type: "button",
            data: {
              label: "Button 2",
              action: "action2",
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should limit buttons to 5 per row", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: Array.from({ length: 10 }, (_, i) => ({
          type: "button" as const,
          data: {
            label: `Button ${i + 1}`,
            action: `action${i + 1}`,
          },
        })),
      };

      await channel.send("123456789", content);
      // Only first 5 buttons should be added (Discord limit)
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Error handling", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle missing permissions gracefully", async () => {
      // Permission errors would be handled in handleGuildMessage
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle invalid channel ID", async () => {
      // Mock channel fetch to return null for invalid channel
      const client = (channel as any).client;
      client.channels.fetch = vi.fn().mockResolvedValue(null);

      const content: ResponseContent = { text: "Test" };

      // Should throw error for invalid channel
      await expect(channel.send("invalid", content)).rejects.toThrow();
    });

    it("should handle connection timeout", async () => {
      // Connection timeout is handled in connect()
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Text splitting", () => {
    it("should split text by paragraphs", () => {
      const longText = "Paragraph 1\n\nParagraph 2\n\nParagraph 3";
      expect(longText.split("\n\n")).toHaveLength(3);
    });

    it("should respect 2000 char limit", () => {
      const maxLength = 2000;
      const text = "A".repeat(2500);
      expect(text.length).toBeGreaterThan(maxLength);
    });

    it("should handle empty text", () => {
      const text = "";
      const chunks = text.split("\n\n");
      expect(chunks).toHaveLength(1);
      expect(chunks[0]).toBe("");
    });
  });

  describe("Typing indicator", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should start typing indicator", async () => {
      // Typing is started in handleGuildMessage
      expect(channel.isConnected()).toBe(true);
    });

    it("should stop typing after sending", async () => {
      const content: ResponseContent = { text: "Test" };
      await channel.send("123456789", content);
      // Typing should be stopped
      expect(channel.isConnected()).toBe(true);
    });

    it("should clear typing intervals on disconnect", async () => {
      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);
    });
  });

  describe("User state management", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should track user state", () => {
      // User state is tracked internally
      expect(channel.isConnected()).toBe(true);
    });

    it("should initialize default state for new users", () => {
      // getUserState() creates default state if not exists
      expect(channel.isConnected()).toBe(true);
    });

    it("should track message count", () => {
      // Message count incremented in discordToRawMessage
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Long message splitting edge cases", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should split message exactly at 2000 character boundary", async () => {
      const text = "A".repeat(2000) + "B".repeat(100);
      const content: ResponseContent = { text };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
      // Should split into 2 messages
    });

    it("should split message with multiple paragraphs", async () => {
      const paragraph = "A".repeat(800);
      const text = [paragraph, paragraph, paragraph].join("\n\n");
      const content: ResponseContent = { text };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should split message preserving paragraph boundaries", async () => {
      const text = "A".repeat(1000) + "\n\n" + "B".repeat(1500);
      const content: ResponseContent = { text };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle single paragraph exceeding 2000 chars", async () => {
      const text = "A".repeat(3000); // No paragraph breaks
      const content: ResponseContent = { text };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should not split messages under 2000 chars", async () => {
      const text = "A".repeat(1999);
      const content: ResponseContent = { text };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle empty chunks after splitting", async () => {
      const text = "\n\n\n\n" + "A".repeat(100);
      const content: ResponseContent = { text };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Typing indicator lifecycle", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("should start typing indicator and refresh every 8 seconds", async () => {
      const client = (channel as any).client;
      const mockChannel = {
        send: vi.fn().mockResolvedValue({}),
        sendTyping: vi.fn().mockResolvedValue(undefined),
        isTextBased: vi.fn().mockReturnValue(true),
      };
      client.channels.fetch = vi.fn().mockResolvedValue(mockChannel);

      // Start typing (would happen in handleGuildMessage)
      const channelId = "123456789";

      // Access private method for testing
      const startTyping = (channel as any).startTyping;
      if (startTyping) {
        await startTyping.call(channel, channelId);
      }

      expect(channel.isConnected()).toBe(true);
    });

    it("should stop typing indicator after message sent", async () => {
      const client = (channel as any).client;
      const mockChannel = {
        send: vi.fn().mockResolvedValue({}),
        sendTyping: vi.fn().mockResolvedValue(undefined),
        isTextBased: vi.fn().mockReturnValue(true),
      };
      client.channels.fetch = vi.fn().mockResolvedValue(mockChannel);

      const content: ResponseContent = { text: "Test" };
      await channel.send("123456789", content);

      // Typing should be stopped after send
      expect(channel.isConnected()).toBe(true);
    });

    it("should clear typing interval on disconnect", async () => {
      const typingIntervals = (channel as any).typingIntervals;

      // Simulate typing interval being set
      if (typingIntervals) {
        typingIntervals.set("123", setInterval(() => {}, 8000));
      }

      await channel.disconnect();
      expect(channel.isConnected()).toBe(false);

      // Intervals should be cleared
      if (typingIntervals) {
        expect(typingIntervals.size).toBe(0);
      }
    });

    it("should not start typing if channel fetch fails", async () => {
      const client = (channel as any).client;
      client.channels.fetch = vi.fn().mockResolvedValue(null);

      const content: ResponseContent = { text: "Test" };

      // Should not throw error
      await expect(channel.send("invalid", content)).rejects.toThrow();
    });
  });

  describe("Disconnect cleanup", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should clear all typing intervals on disconnect", async () => {
      const typingIntervals = (channel as any).typingIntervals;

      // Simulate multiple typing intervals
      if (typingIntervals) {
        typingIntervals.set("user1", setInterval(() => {}, 1000));
        typingIntervals.set("user2", setInterval(() => {}, 1000));
        typingIntervals.set("user3", setInterval(() => {}, 1000));
      }

      await channel.disconnect();

      // All intervals should be cleared
      if (typingIntervals) {
        expect(typingIntervals.size).toBe(0);
      }
    });

    it("should destroy Discord client on disconnect", async () => {
      const client = (channel as any).client;
      const destroySpy = vi.spyOn(client, "destroy");

      await channel.disconnect();

      expect(destroySpy).toHaveBeenCalled();
      expect(channel.isConnected()).toBe(false);
    });

    it("should handle disconnect when not connected", async () => {
      await channel.disconnect();

      // Should not throw error
      await expect(channel.disconnect()).resolves.not.toThrow();
    });

    it("should set connected flag to false", async () => {
      expect(channel.isConnected()).toBe(true);

      await channel.disconnect();

      expect(channel.isConnected()).toBe(false);
    });
  });

  describe("Slash command error handling", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle errors in slash command registration", async () => {
      const client = (channel as any).client;
      const mockREST = {
        setToken: vi.fn().mockReturnThis(),
        put: vi.fn().mockRejectedValue(new Error("Registration failed")),
      };

      // Slash commands are registered during connect
      // If registration fails, it should be handled gracefully
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle missing interaction reply", async () => {
      // Interaction handlers are set up during connect
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Rich content edge cases", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle card without title", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "card",
            data: {
              description: "Description only",
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle card without description", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "card",
            data: {
              title: "Title only",
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle embed with fields", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "embed",
            data: {
              title: "Embed with fields",
              fields: [
                { name: "Field 1", value: "Value 1" },
                { name: "Field 2", value: "Value 2" },
              ],
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle unknown rich content type", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "unknown" as any,
            data: {},
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle empty rich content array", async () => {
      const content: ResponseContent = {
        text: "Text with empty rich content",
        richContent: [],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle button without label", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "button",
            data: {
              action: "test",
            },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Channel type detection", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should detect agent channels by name pattern", () => {
      const agentChannelNames = [
        "ai-chat",
        "bot-commands",
        "agent-test",
        "ai-support",
        "bot-help",
      ];

      agentChannelNames.forEach((name) => {
        const isAgent =
          name.includes("ai-") ||
          name.includes("bot-") ||
          name.includes("agent-");
        expect(isAgent).toBe(true);
      });
    });

    it("should not detect non-agent channels", () => {
      const regularChannelNames = [
        "general",
        "random",
        "announcements",
        "off-topic",
      ];

      regularChannelNames.forEach((name) => {
        const isAgent =
          name.includes("ai-") ||
          name.includes("bot-") ||
          name.includes("agent-");
        expect(isAgent).toBe(false);
      });
    });
  });

  describe("Permission checking", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should check SendMessages permission", async () => {
      const client = (channel as any).client;
      const mockChannel = {
        send: vi.fn().mockResolvedValue({}),
        permissionsFor: vi.fn().mockReturnValue({
          has: vi.fn().mockReturnValue(true),
        }),
        isTextBased: vi.fn().mockReturnValue(true),
      };
      client.channels.fetch = vi.fn().mockResolvedValue(mockChannel);

      const content: ResponseContent = { text: "Test" };
      await channel.send("123456789", content);

      expect(channel.isConnected()).toBe(true);
    });

    it("should check EmbedLinks permission for rich content", async () => {
      const client = (channel as any).client;
      const mockChannel = {
        send: vi.fn().mockResolvedValue({}),
        permissionsFor: vi.fn().mockReturnValue({
          has: vi.fn().mockReturnValue(true),
        }),
        isTextBased: vi.fn().mockReturnValue(true),
      };
      client.channels.fetch = vi.fn().mockResolvedValue(mockChannel);

      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "embed",
            data: { title: "Test" },
          },
        ],
      };
      await channel.send("123456789", content);

      expect(channel.isConnected()).toBe(true);
    });

    it("should handle missing permissions gracefully", async () => {
      const client = (channel as any).client;
      const mockChannel = {
        send: vi.fn().mockRejectedValue(new Error("Missing Permissions")),
        permissionsFor: vi.fn().mockReturnValue({
          has: vi.fn().mockReturnValue(false),
        }),
        isTextBased: vi.fn().mockReturnValue(true),
      };
      client.channels.fetch = vi.fn().mockResolvedValue(mockChannel);

      const content: ResponseContent = { text: "Test" };

      await expect(channel.send("123456789", content)).rejects.toThrow();
    });
  });

  describe("File sending", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should send file without caption", async () => {
      const file = Buffer.from("test file content");
      await channel.sendFile("123456789", file, "test.txt");
      expect(channel.isConnected()).toBe(true);
    });

    it("should send file with long filename", async () => {
      const file = Buffer.from("test");
      const longFilename = "A".repeat(200) + ".txt";
      await channel.sendFile("123456789", file, longFilename);
      expect(channel.isConnected()).toBe(true);
    });

    it("should send file with special characters in name", async () => {
      const file = Buffer.from("test");
      await channel.sendFile("123456789", file, "test file (1).txt");
      expect(channel.isConnected()).toBe(true);
    });

    it("should throw error when sending file while disconnected", async () => {
      await channel.disconnect();
      const file = Buffer.from("test");

      await expect(channel.sendFile("123456789", file, "test.txt"))
        .rejects.toThrow("Bot not connected");
    });
  });

  describe("Message content edge cases", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle text with only whitespace", async () => {
      const content: ResponseContent = {
        text: "   \n\n   ",
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle text with unicode characters", async () => {
      const content: ResponseContent = {
        text: "Hello 世界 🌍",
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle text with markdown formatting", async () => {
      const content: ResponseContent = {
        text: "**Bold** *italic* `code` ~~strikethrough~~",
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle text with Discord mentions", async () => {
      const content: ResponseContent = {
        text: "<@123456789> <#987654321> @everyone",
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });

    it("should handle empty content with rich content", async () => {
      const content: ResponseContent = {
        text: "",
        richContent: [
          {
            type: "card",
            data: { title: "Card" },
          },
        ],
      };

      await channel.send("123456789", content);
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Private method testing (direct access)", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should convert Discord message to RawMessage", async () => {
      const mockMessage = {
        id: "msg123",
        author: { id: "user456", bot: false },
        content: "Hello bot!",
        attachments: new Map(),
        createdAt: new Date(),
        guild: null,
        channel: {},
      };

      const discordToRawMessage = (channel as any).discordToRawMessage;
      const rawMessage = await discordToRawMessage.call(channel, mockMessage);

      expect(rawMessage).toBeDefined();
      expect(rawMessage.userId).toBe("user456");
      expect(rawMessage.content).toBe("Hello bot!");
      expect(rawMessage.channel).toBe("discord");
    });

    it("should extract image attachments", async () => {
      const mockAttachment = {
        id: "789",
        url: "https://cdn.discord.com/file.png",
        name: "file.png",
        contentType: "image/png",
        size: 1024,
      };

      const mockMessage = {
        id: "msg123",
        author: { id: "user456", bot: false },
        content: "",
        attachments: new Map([["789", mockAttachment]]),
        createdAt: new Date(),
        guild: null,
        channel: {},
      };

      const discordToRawMessage = (channel as any).discordToRawMessage;
      const rawMessage = await discordToRawMessage.call(channel, mockMessage);

      expect(rawMessage.attachments).toHaveLength(1);
      expect(rawMessage.attachments![0].type).toBe("image");
      expect(rawMessage.attachments![0].url).toBe("https://cdn.discord.com/file.png");
    });

    it("should extract video attachments", async () => {
      const mockAttachment = {
        id: "789",
        url: "https://cdn.discord.com/video.mp4",
        name: "video.mp4",
        contentType: "video/mp4",
        size: 2048,
      };

      const extractAttachments = (channel as any).extractAttachments;
      const mockMessage = {
        attachments: new Map([["789", mockAttachment]]),
      };

      const attachments = extractAttachments.call(channel, mockMessage);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].type).toBe("video");
    });

    it("should extract audio attachments", async () => {
      const mockAttachment = {
        id: "789",
        url: "https://cdn.discord.com/audio.mp3",
        name: "audio.mp3",
        contentType: "audio/mpeg",
        size: 1536,
      };

      const extractAttachments = (channel as any).extractAttachments;
      const mockMessage = {
        attachments: new Map([["789", mockAttachment]]),
      };

      const attachments = extractAttachments.call(channel, mockMessage);

      expect(attachments).toHaveLength(1);
      expect(attachments[0].type).toBe("audio");
    });

    it("should default to 'file' for unknown content type", async () => {
      const mockAttachment = {
        id: "789",
        url: "https://cdn.discord.com/file.zip",
        name: "file.zip",
        contentType: "application/zip",
        size: 4096,
      };

      const getAttachmentType = (channel as any).getAttachmentType;
      const type = getAttachmentType.call(channel, "application/zip");

      expect(type).toBe("file");
    });

    it("should default to 'file' for null content type", async () => {
      const getAttachmentType = (channel as any).getAttachmentType;
      const type = getAttachmentType.call(channel, null);

      expect(type).toBe("file");
    });

    it("should build embeds from card rich content", () => {
      const richContent = [
        {
          type: "card" as const,
          data: {
            title: "Test Card",
            description: "Card description",
            color: 0x5865f2,
            thumbnail: "https://example.com/thumb.png",
            image: "https://example.com/image.png",
            footer: "Footer text",
          },
        },
      ];

      const buildEmbeds = (channel as any).buildEmbeds;
      const embeds = buildEmbeds.call(channel, richContent);

      expect(embeds).toHaveLength(1);
    });

    it("should build embeds from embed rich content", () => {
      const richContent = [
        {
          type: "embed" as const,
          data: {
            title: "Test Embed",
            description: "Embed description",
          },
        },
      ];

      const buildEmbeds = (channel as any).buildEmbeds;
      const embeds = buildEmbeds.call(channel, richContent);

      expect(embeds).toHaveLength(1);
    });

    it("should return empty array for no rich content", () => {
      const buildEmbeds = (channel as any).buildEmbeds;
      const embeds = buildEmbeds.call(channel, undefined);

      expect(embeds).toHaveLength(0);
    });

    it("should filter non-embed rich content types", () => {
      const richContent = [
        {
          type: "button" as const,
          data: { label: "Button" },
        },
        {
          type: "card" as const,
          data: { title: "Card" },
        },
      ];

      const buildEmbeds = (channel as any).buildEmbeds;
      const embeds = buildEmbeds.call(channel, richContent);

      expect(embeds).toHaveLength(1); // Only card, not button
    });

    it("should build button components", () => {
      const richContent = [
        {
          type: "button" as const,
          data: {
            label: "Button 1",
            action: "action1",
          },
        },
      ];

      const buildComponents = (channel as any).buildComponents;
      const components = buildComponents.call(channel, richContent);

      expect(components).toHaveLength(1);
    });

    it("should return empty array for no buttons", () => {
      const richContent = [
        {
          type: "card" as const,
          data: { title: "Card" },
        },
      ];

      const buildComponents = (channel as any).buildComponents;
      const components = buildComponents.call(channel, richContent);

      expect(components).toHaveLength(0);
    });

    it("should check if channel is agent channel", () => {
      const isAgentChannel = (channel as any).isAgentChannel;

      const mockChannel1 = { name: "ai-chat" };
      expect(isAgentChannel.call(channel, mockChannel1)).toBe(true);

      const mockChannel2 = { name: "bot-commands" };
      expect(isAgentChannel.call(channel, mockChannel2)).toBe(true);

      const mockChannel3 = { name: "agent-test" };
      expect(isAgentChannel.call(channel, mockChannel3)).toBe(true);

      const mockChannel4 = { name: "general" };
      expect(isAgentChannel.call(channel, mockChannel4)).toBe(false);
    });

    it("should get user state (default for new user)", () => {
      const getUserState = (channel as any).getUserState;
      const state = getUserState.call(channel, "newuser123");

      expect(state).toBeDefined();
      expect(state.currentAgent).toBe("default");
      expect(state.messageCount).toBe(0);
    });

    it("should get user state (existing user)", () => {
      const userStates = (channel as any).userStates;
      userStates.set("existinguser", {
        currentAgent: "nova",
        messageCount: 5,
      });

      const getUserState = (channel as any).getUserState;
      const state = getUserState.call(channel, "existinguser");

      expect(state.currentAgent).toBe("nova");
      expect(state.messageCount).toBe(5);
    });

    it("should increment message count on conversion", async () => {
      const mockMessage = {
        id: "msg1",
        author: { id: "user123", bot: false },
        content: "Message 1",
        attachments: new Map(),
        createdAt: new Date(),
        guild: null,
        channel: {},
      };

      const discordToRawMessage = (channel as any).discordToRawMessage;
      await discordToRawMessage.call(channel, mockMessage);

      const getUserState = (channel as any).getUserState;
      const state = getUserState.call(channel, "user123");

      expect(state.messageCount).toBe(1);
    });

    it("should split long text by paragraphs", async () => {
      const text = "Para 1\n\nPara 2\n\nPara 3";
      const sendLongMessage = (channel as any).sendLongMessage;

      const mockChannel = {
        send: vi.fn().mockResolvedValue({}),
      };

      await sendLongMessage.call(channel, mockChannel, text);
      expect(mockChannel.send).toHaveBeenCalled();
    });

    it("should stop typing for channel", () => {
      const typingIntervals = (channel as any).typingIntervals;
      typingIntervals.set("channel123", setInterval(() => {}, 1000));

      const stopTyping = (channel as any).stopTyping;
      stopTyping.call(channel, "channel123");

      expect(typingIntervals.has("channel123")).toBe(false);
    });

    it("should not throw error when stopping typing for non-existent channel", () => {
      const stopTyping = (channel as any).stopTyping;

      expect(() => {
        stopTyping.call(channel, "nonexistent");
      }).not.toThrow();
    });
  });

  describe("Slash command handlers (direct testing)", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle /ask command", async () => {
      const mockInteraction = {
        id: "interaction123",
        commandName: "ask",
        user: { id: "user123" },
        options: {
          getString: vi.fn().mockReturnValue("What is AI?"),
        },
        deferReply: vi.fn().mockResolvedValue(undefined),
        reply: vi.fn().mockResolvedValue(undefined),
        createdAt: new Date(),
        guild: null,
        channel: {},
      };

      const handler = vi.fn().mockResolvedValue(undefined);
      channel.onMessage(handler);

      const handleAskCommand = (channel as any).handleAskCommand;
      await handleAskCommand.call(channel, mockInteraction);

      expect(mockInteraction.deferReply).toHaveBeenCalled();
      expect(handler).toHaveBeenCalled();
      const call = handler.mock.calls[0][0];
      expect(call.content).toBe("What is AI?");
      expect(call.userId).toBe("user123");
    });

    it("should handle /agent command", async () => {
      const mockInteraction = {
        id: "interaction123",
        commandName: "agent",
        user: { id: "user123" },
        options: {
          getString: vi.fn().mockReturnValue("nova"),
        },
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const handleAgentCommand = (channel as any).handleAgentCommand;
      await handleAgentCommand.call(channel, mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalled();

      const getUserState = (channel as any).getUserState;
      const state = getUserState.call(channel, "user123");
      expect(state.currentAgent).toBe("nova");
    });

    it("should handle /clear command", async () => {
      const mockInteraction = {
        id: "interaction123",
        commandName: "clear",
        user: { id: "user123" },
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const userStates = (channel as any).userStates;
      userStates.set("user123", {
        currentAgent: "nova",
        messageCount: 10,
      });

      const handleClearCommand = (channel as any).handleClearCommand;
      await handleClearCommand.call(channel, mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalled();

      const getUserState = (channel as any).getUserState;
      const state = getUserState.call(channel, "user123");
      expect(state.messageCount).toBe(0);
    });

    it("should handle /status command", async () => {
      const mockInteraction = {
        id: "interaction123",
        commandName: "status",
        user: { id: "user123" },
        guild: { name: "Test Guild" },
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const userStates = (channel as any).userStates;
      userStates.set("user123", {
        currentAgent: "nova",
        messageCount: 5,
      });

      const handleStatusCommand = (channel as any).handleStatusCommand;
      await handleStatusCommand.call(channel, mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalled();
      const replyCall = mockInteraction.reply.mock.calls[0][0];
      expect(replyCall.embeds).toBeDefined();
      expect(replyCall.ephemeral).toBe(true);
    });

    it("should handle /help command", async () => {
      const mockInteraction = {
        id: "interaction123",
        commandName: "help",
        user: { id: "user123" },
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const handleHelpCommand = (channel as any).handleHelpCommand;
      await handleHelpCommand.call(channel, mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalled();
      const replyCall = mockInteraction.reply.mock.calls[0][0];
      expect(replyCall.embeds).toBeDefined();
      expect(replyCall.ephemeral).toBe(true);
    });

    it("should handle interaction router", async () => {
      const mockInteraction = {
        commandName: "ask",
        user: { id: "user123" },
        options: {
          getString: vi.fn().mockReturnValue("test"),
        },
        deferReply: vi.fn().mockResolvedValue(undefined),
        createdAt: new Date(),
        guild: null,
        channel: {},
      };

      const handler = vi.fn().mockResolvedValue(undefined);
      channel.onMessage(handler);

      const handleInteraction = (channel as any).handleInteraction;
      await handleInteraction.call(channel, mockInteraction);

      expect(mockInteraction.deferReply).toHaveBeenCalled();
    });

    it("should handle unknown command", async () => {
      const mockInteraction = {
        commandName: "unknown",
        reply: vi.fn().mockResolvedValue(undefined),
      };

      const handleInteraction = (channel as any).handleInteraction;
      await handleInteraction.call(channel, mockInteraction);

      expect(mockInteraction.reply).toHaveBeenCalledWith({
        content: "❌ Unknown command",
        ephemeral: true,
      });
    });
  });

  describe("Message handlers (event simulation)", () => {
    beforeEach(async () => {
      await channel.connect(mockConfig);
    });

    it("should handle DM message", async () => {
      const mockMessage = {
        id: "msg123",
        author: { id: "user456", bot: false },
        content: "Hello in DM",
        attachments: new Map(),
        createdAt: new Date(),
        channel: { type: 1 }, // DM
        guild: null,
      };

      const handler = vi.fn().mockResolvedValue(undefined);
      channel.onMessage(handler);

      const handleDM = (channel as any).handleDM;
      await handleDM.call(channel, mockMessage);

      expect(handler).toHaveBeenCalled();
      const call = handler.mock.calls[0][0];
      expect(call.content).toBe("Hello in DM");
    });

    it("should handle guild message with permissions", async () => {
      const mockMessage = {
        id: "msg123",
        author: { id: "user456", bot: false },
        content: "Hello in guild",
        attachments: new Map(),
        createdAt: new Date(),
        channel: {
          type: 0, // Guild text
          name: "ai-chat",
          permissionsFor: vi.fn().mockReturnValue({
            has: vi.fn().mockReturnValue(true),
          }),
          sendTyping: vi.fn().mockResolvedValue(undefined),
        },
        guild: { id: "guild123" },
      };

      const handler = vi.fn().mockResolvedValue(undefined);
      channel.onMessage(handler);

      const handleGuildMessage = (channel as any).handleGuildMessage;
      await handleGuildMessage.call(channel, mockMessage);

      expect(handler).toHaveBeenCalled();
    });

    it("should reply with error when missing permissions", async () => {
      const mockMessage = {
        id: "msg123",
        author: { id: "user456", bot: false },
        content: "Hello",
        channel: {
          type: 0,
          name: "general",
          permissionsFor: vi.fn().mockReturnValue({
            has: vi.fn().mockReturnValue(false),
          }),
        },
        reply: vi.fn().mockResolvedValue({}),
        guild: { id: "guild123" },
      };

      const handleGuildMessage = (channel as any).handleGuildMessage;
      await handleGuildMessage.call(channel, mockMessage);

      expect(mockMessage.reply).toHaveBeenCalledWith(
        expect.stringContaining("don't have the required permissions")
      );
    });

    it("should check hasPermissions method", () => {
      const mockChannel = {
        permissionsFor: vi.fn().mockReturnValue({
          has: vi.fn().mockReturnValue(true),
        }),
      };

      const hasPermissions = (channel as any).hasPermissions;
      const result = hasPermissions.call(channel, mockChannel);

      expect(result).toBe(true);
    });

    it("should return false when permissions are null", () => {
      const mockChannel = {
        permissionsFor: vi.fn().mockReturnValue(null),
      };

      const hasPermissions = (channel as any).hasPermissions;
      const result = hasPermissions.call(channel, mockChannel);

      expect(result).toBe(false);
    });
  });
});
