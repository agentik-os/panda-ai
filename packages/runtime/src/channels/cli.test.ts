import { describe, it, expect, beforeEach, vi } from "vitest";
import { CLIChannel } from "./cli";
import type { ChannelConfig, RawMessage, ResponseContent } from "@agentik-os/shared";

describe("CLIChannel", () => {
  let channel: CLIChannel;

  beforeEach(() => {
    channel = new CLIChannel();
  });

  describe("ChannelAdapter interface", () => {
    it("should have name 'cli'", () => {
      expect(channel.name).toBe("cli");
    });

    it("should implement isConnected", () => {
      expect(channel.isConnected()).toBe(false);
    });

    it("should connect successfully", async () => {
      const config: ChannelConfig = {
        type: "cli",
        options: {
          userId: "test_user",
          defaultAgentId: "test_agent",
        },
        enabled: true,
      };

      await channel.connect(config);
      expect(channel.isConnected()).toBe(true);
    });

    it("should disconnect successfully", async () => {
      const config: ChannelConfig = {
        type: "cli",
        options: {},
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
      // Handler is registered internally, we'll test it via sendMessage
    });
  });

  describe("send method", () => {
    it("should format and display text response", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Hello from the agent!",
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle rich content", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Here's some structured data:",
        richContent: [
          {
            type: "code_block",
            data: { code: "console.log('test');" },
          },
        ],
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("sendFile method", () => {
    it("should save file to /tmp and display path", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const fileBuffer = Buffer.from("test file content");

      await channel.sendFile("test_user", fileBuffer, "Test file");

      expect(consoleSpy).toHaveBeenCalled();
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      expect(lastCall[0]).toContain("File saved");
      expect(lastCall[0]).toContain("/tmp");
      expect(lastCall[0]).toContain("Test file");

      consoleSpy.mockRestore();
    });
  });

  describe("message formatting", () => {
    it("should format markdown-style text", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "This is **bold** and *italic* and `code`",
      };

      await channel.send("test_user", content);

      // Basic check that formatting was attempted
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("configuration", () => {
    it("should use default userId if not provided", async () => {
      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);
      expect(channel.isConnected()).toBe(true);
    });

    it("should use custom userId from config", async () => {
      const config: ChannelConfig = {
        type: "cli",
        options: {
          userId: "custom_user",
          defaultAgentId: "custom_agent",
        },
        enabled: true,
      };

      await channel.connect(config);
      expect(channel.isConnected()).toBe(true);
    });
  });

  describe("Rich Content Display", () => {
    it("should display code blocks", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Here's some code:",
        richContent: [
          {
            type: "code_block",
            data: { code: "const x = 42;" },
          },
        ],
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should display buttons", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Choose an option:",
        richContent: [
          {
            type: "button",
            data: { text: "Click me" },
          },
        ],
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should display cards", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Here's a card:",
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

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should display card without description", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Card without description:",
        richContent: [
          {
            type: "card",
            data: {
              title: "Just a title",
            },
          },
        ],
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle unknown rich content types gracefully", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Unknown type:",
        richContent: [
          {
            type: "unknown_type" as any,
            data: { foo: "bar" },
          },
        ],
      };

      await channel.send("test_user", content);

      // Should not crash, just ignore unknown types
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle multiple rich content items", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Multiple items:",
        richContent: [
          { type: "code_block", data: { code: "x=1" } },
          { type: "button", data: { text: "OK" } },
          { type: "card", data: { title: "Card" } },
        ],
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Message Formatting", () => {
    it("should format bold text (**text**)", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "This is **bold text**",
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should format italic text (*text*)", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "This is *italic text*",
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should format code blocks (`code`)", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Inline `code` block",
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should format mixed markdown", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "**Bold** *italic* `code` all together",
      };

      await channel.send("test_user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("Command Handling (private methods via reflection)", () => {
    it("should display welcome banner on connect", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      // Banner should have been displayed
      expect(consoleSpy).toHaveBeenCalled();
      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Agentik OS"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should display goodbye message on disconnect", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);
      await channel.disconnect();

      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Goodbye"))).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe("Message Handler", () => {
    it("should invoke message handler when set", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      channel.onMessage(handler);

      const config: ChannelConfig = {
        type: "cli",
        options: { userId: "test_user" },
        enabled: true,
      };

      await channel.connect(config);

      // Access private sendMessage via reflection
      const sendMessage = (channel as any).sendMessage.bind(channel);
      await sendMessage("Hello");

      expect(handler).toHaveBeenCalled();
      const call = handler.mock.calls[0][0] as RawMessage;
      expect(call.content).toBe("Hello");
      expect(call.userId).toBe("test_user");
      expect(call.channel).toBe("cli");
    });

    it("should display error when message handler not set", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      // Don't set a handler
      const sendMessage = (channel as any).sendMessage.bind(channel);
      await sendMessage("Hello");

      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Error") && c.includes("Message handler"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should handle errors from message handler", async () => {
      const handler = vi.fn().mockRejectedValue(new Error("Handler failed"));
      channel.onMessage(handler);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const sendMessage = (channel as any).sendMessage.bind(channel);
      await sendMessage("Hello");

      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Error") && c.includes("Handler failed"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should handle non-Error exceptions from handler", async () => {
      const handler = vi.fn().mockRejectedValue("String error");
      channel.onMessage(handler);

      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const sendMessage = (channel as any).sendMessage.bind(channel);
      await sendMessage("Hello");

      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Unknown error"))).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe("Command Handling", () => {
    it("should handle /help command", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/help");

      expect(handled).toBe(true);
      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Available Commands"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should handle /exit command", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/exit");

      expect(handled).toBe(true);
      expect(channel.isConnected()).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should handle /quit command", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/quit");

      expect(handled).toBe(true);
      expect(channel.isConnected()).toBe(false);

      consoleSpy.mockRestore();
    });

    it("should handle /agent command with argument", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/agent gpt-4");

      expect(handled).toBe(true);
      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Switched to agent") && c.includes("gpt-4"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should handle /agent command without argument (show current)", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: { defaultAgentId: "my-agent" },
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/agent");

      expect(handled).toBe(true);
      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Current agent") && c.includes("my-agent"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should handle /clear command", async () => {
      const consoleClearSpy = vi.spyOn(console, "clear").mockImplementation(() => {});
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/clear");

      expect(handled).toBe(true);
      expect(consoleClearSpy).toHaveBeenCalled();

      consoleClearSpy.mockRestore();
      consoleLogSpy.mockRestore();
    });

    it("should handle unknown command", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/unknown");

      expect(handled).toBe(true);
      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Unknown command") && c.includes("/unknown"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should return false for empty command (just '/')", async () => {
      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/");

      expect(handled).toBe(false);
    });

    it("should handle command with multiple arguments", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/agent foo bar baz");

      expect(handled).toBe(true);
      // Should use first argument as agent name
      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Switched to agent") && c.includes("foo"))).toBe(true);

      consoleSpy.mockRestore();
    });

    it("should handle case-insensitive commands", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const handleCommand = (channel as any).handleCommand.bind(channel);
      const handled = await handleCommand("/HELP");

      expect(handled).toBe(true);
      const calls = consoleSpy.mock.calls.map((c) => c.join(" "));
      expect(calls.some((c) => c.includes("Available Commands"))).toBe(true);

      consoleSpy.mockRestore();
    });
  });

  describe("Edge Cases", () => {
    it("should handle sendFile without caption", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const fileBuffer = Buffer.from("test content");
      await channel.sendFile("user", fileBuffer);

      expect(consoleSpy).toHaveBeenCalled();
      const lastCall = consoleSpy.mock.calls[consoleSpy.mock.calls.length - 1];
      expect(lastCall[0]).toContain("File saved");
      expect(lastCall[0]).toContain("/tmp");

      consoleSpy.mockRestore();
    });

    it("should handle empty rich content array", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "No rich content",
        richContent: [],
      };

      await channel.send("user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle text without any markdown", async () => {
      const consoleSpy = vi.spyOn(console, "log").mockImplementation(() => {});

      const content: ResponseContent = {
        text: "Plain text without formatting",
      };

      await channel.send("user", content);

      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should generate unique message IDs based on timestamp", async () => {
      const handler = vi.fn().mockResolvedValue(undefined);
      channel.onMessage(handler);

      const config: ChannelConfig = {
        type: "cli",
        options: {},
        enabled: true,
      };

      await channel.connect(config);

      const sendMessage = (channel as any).sendMessage.bind(channel);

      await sendMessage("Message 1");
      const id1 = (handler.mock.calls[0][0] as RawMessage).channelMessageId;

      // Wait 1ms to ensure different timestamp
      await new Promise((resolve) => setTimeout(resolve, 1));

      await sendMessage("Message 2");
      const id2 = (handler.mock.calls[1][0] as RawMessage).channelMessageId;

      expect(id1).not.toBe(id2);
      expect(id1).toContain("cli_");
      expect(id2).toContain("cli_");
    });
  });
});
