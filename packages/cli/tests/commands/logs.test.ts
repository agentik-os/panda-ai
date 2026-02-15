import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { logsCommand } from "../../src/commands/logs";
import { readFileSync, existsSync, readdirSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    yellow: (str: string) => str,
    dim: (str: string) => str,
    red: (str: string) => str,
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    blue: (str: string) => str,
    green: (str: string) => str,
    bold: (str: string) => str,
  },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  readdirSync: vi.fn(),
}));

describe("Logs Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockConversations = [
    {
      id: "conv-123",
      agentId: "agent-1",
      agentName: "Agent1",
      channel: "cli",
      userId: "user-1",
      messages: [
        {
          id: "msg-1",
          role: "user" as const,
          content: "Hello",
          timestamp: new Date("2024-01-15T10:00:00Z"),
        },
        {
          id: "msg-2",
          role: "assistant" as const,
          content: "Hi there!",
          timestamp: new Date("2024-01-15T10:00:05Z"),
          model: "claude-4-5-sonnet",
          tokens: 10,
        },
      ],
      startedAt: new Date("2024-01-15T10:00:00Z"),
      updatedAt: new Date("2024-01-15T10:00:05Z"),
    },
    {
      id: "conv-456",
      agentId: "agent-2",
      agentName: "Agent2",
      channel: "telegram",
      userId: "user-2",
      messages: [
        {
          id: "msg-3",
          role: "user" as const,
          content: "What's the weather?",
          timestamp: new Date("2024-01-14T15:30:00Z"),
        },
        {
          id: "msg-4",
          role: "assistant" as const,
          content: "I don't have access to weather data",
          timestamp: new Date("2024-01-14T15:30:02Z"),
          model: "gpt-5",
        },
      ],
      startedAt: new Date("2024-01-14T15:30:00Z"),
      updatedAt: new Date("2024-01-14T15:30:02Z"),
    },
    {
      id: "conv-789",
      agentId: "agent-1",
      agentName: "Agent1",
      channel: "cli",
      userId: "user-1",
      messages: [
        {
          id: "msg-5",
          role: "user" as const,
          content: "Help me with something",
          timestamp: new Date("2024-01-13T09:00:00Z"),
        },
      ],
      startedAt: new Date("2024-01-13T09:00:00Z"),
      updatedAt: new Date("2024-01-13T09:00:00Z"),
    },
  ];

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.HOME = "/tmp/test-home";

    // Default: conversations directory exists with 3 files
    (existsSync as any).mockReturnValue(true);
    (readdirSync as any).mockReturnValue(["conv-123.json", "conv-456.json", "conv-789.json"]);
    (readFileSync as any).mockImplementation((path: string) => {
      if (path.includes("conv-123.json")) {
        return JSON.stringify(mockConversations[0]);
      }
      if (path.includes("conv-456.json")) {
        return JSON.stringify(mockConversations[1]);
      }
      if (path.includes("conv-789.json")) {
        return JSON.stringify(mockConversations[2]);
      }
      throw new Error("File not found");
    });
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete process.env.HOME;
    vi.clearAllMocks();
  });

  describe("Empty State", () => {
    it("should show message when no conversations exist (directory missing)", async () => {
      (existsSync as any).mockReturnValue(false);

      await logsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No conversations found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda chat"));
    });

    it("should show message when conversations directory is empty", async () => {
      (readdirSync as any).mockReturnValue([]);

      await logsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No conversations found"));
    });
  });

  describe("List All Conversations", () => {
    it("should display all conversations in summary format", async () => {
      await logsCommand();

      // Header
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (3)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("ID"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("AGENT"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("CHANNEL"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("MESSAGES"));

      // Conversations
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agent1"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agent2"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("cli"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("telegram"));

      // Footer
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 3 conversations"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Use --conversation <id>"));
    });

    it("should sort conversations by most recent first", async () => {
      await logsCommand();

      const calls = consoleLogSpy.mock.calls.map((call) => call[0]);
      const output = calls.join("\n");

      // conv-123 (Jan 15) should appear before conv-456 (Jan 14) should appear before conv-789 (Jan 13)
      const conv123Index = output.indexOf("conv-123");
      const conv456Index = output.indexOf("conv-456");
      const conv789Index = output.indexOf("conv-789");

      expect(conv123Index).toBeGreaterThan(-1);
      expect(conv456Index).toBeGreaterThan(conv123Index);
      expect(conv789Index).toBeGreaterThan(conv456Index);
    });
  });

  describe("Filter by Agent", () => {
    it("should filter conversations by agent name", async () => {
      await logsCommand({ agent: "Agent1" });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agent1"));

      // Agent2 should not appear
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Agent2");
    });

    it("should filter conversations by partial agent name", async () => {
      await logsCommand({ agent: "agent1" }); // Lowercase

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
    });

    it("should filter conversations by agent ID", async () => {
      await logsCommand({ agent: "agent-1" });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
    });

    it("should show message when no conversations found for agent", async () => {
      await logsCommand({ agent: "NonexistentAgent" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversations found for agent: NonexistentAgent")
      );
    });
  });

  describe("Filter by Channel", () => {
    it("should filter conversations by channel", async () => {
      await logsCommand({ channel: "cli" });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("cli"));

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("telegram");
    });

    it("should filter conversations by channel (case insensitive)", async () => {
      await logsCommand({ channel: "CLI" });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
    });

    it("should show message when no conversations found for channel", async () => {
      await logsCommand({ channel: "slack" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversations found for channel: slack")
      );
    });
  });

  describe("Filter by Conversation ID", () => {
    it("should display specific conversation in detailed format", async () => {
      await logsCommand({ conversation: "conv-123" });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversation: Agent1"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("ID: conv-123"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Channel: cli"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Messages: 2"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Hello"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Hi there!"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("10 tokens"));
    });

    it("should match conversation by partial ID", async () => {
      await logsCommand({ conversation: "conv-1" });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("conv-123"));
    });

    it("should show message when conversation not found", async () => {
      await logsCommand({ conversation: "nonexistent" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Conversation not found: nonexistent")
      );
    });
  });

  describe("Limit Results", () => {
    it("should limit number of conversations displayed", async () => {
      await logsCommand({ limit: 2 });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 2 conversations"));
    });

    it("should apply limit after filtering", async () => {
      await logsCommand({ agent: "Agent1", limit: 1 });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (1)"));
    });
  });

  describe("Detailed View", () => {
    it("should display conversations in detailed format", async () => {
      await logsCommand({ detailed: true });

      // Should show message content for all conversations
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Hello"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Hi there!"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("What's the weather?"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Help me with something"));
    });

    it("should show model information in detailed view", async () => {
      await logsCommand({ detailed: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("claude-4-5-sonnet"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("gpt-5"));
    });

    it("should show tokens when available", async () => {
      await logsCommand({ detailed: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("10 tokens"));
    });

    it("should show user and assistant messages differently", async () => {
      await logsCommand({ conversation: "conv-123" });

      // User message should show "You:"
      const calls = consoleLogSpy.mock.calls.map((call) => call[0]);
      const userRoleLine = calls.find((line) => typeof line === "string" && line.includes("You:"));
      expect(userRoleLine).toBeDefined();

      // Assistant message shows agent name (with model in parentheses if available)
      const assistantRoleLine = calls.find((line) => typeof line === "string" && line.includes("Agent1"));
      expect(assistantRoleLine).toBeDefined();
    });
  });

  describe("Error Handling", () => {
    it("should handle corrupted JSON files gracefully", async () => {
      (readdirSync as any).mockReturnValue(["conv-123.json", "corrupted.json", "conv-456.json"]);
      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("corrupted.json")) {
          return "invalid json {{{";
        }
        if (path.includes("conv-123.json")) {
          return JSON.stringify(mockConversations[0]);
        }
        if (path.includes("conv-456.json")) {
          return JSON.stringify(mockConversations[1]);
        }
        throw new Error("File not found");
      });

      await logsCommand();

      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Skipped corrupted file corrupted.json"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
    });

    it("should handle non-JSON files in directory", async () => {
      (readdirSync as any).mockReturnValue(["conv-123.json", "readme.txt", "conv-456.json"]);

      await logsCommand();

      // Should skip .txt file without warning
      expect(consoleWarnSpy).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (2)"));
    });

    it("should handle directory read error", async () => {
      (readdirSync as any).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      await logsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading conversations:"),
        "Permission denied"
      );
    });
  });

  describe("Date Formatting", () => {
    it("should format recent dates as relative time", async () => {
      const now = new Date();
      const recentConv = {
        ...mockConversations[0],
        id: "recent-conv",
        updatedAt: new Date(now.getTime() - 5 * 60 * 1000), // 5 minutes ago
      };

      (readdirSync as any).mockReturnValue(["recent-conv.json"]);
      (readFileSync as any).mockReturnValue(JSON.stringify(recentConv));

      await logsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("5m ago"));
    });

    it("should show 'just now' for very recent conversations", async () => {
      const now = new Date();
      const veryRecentConv = {
        ...mockConversations[0],
        id: "very-recent-conv",
        updatedAt: new Date(now.getTime() - 30 * 1000), // 30 seconds ago
      };

      (readdirSync as any).mockReturnValue(["very-recent-conv.json"]);
      (readFileSync as any).mockReturnValue(JSON.stringify(veryRecentConv));

      await logsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("just now"));
    });
  });

  describe("Combined Filters", () => {
    it("should apply multiple filters together", async () => {
      await logsCommand({ agent: "Agent1", channel: "cli", limit: 1 });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Conversations (1)"));
    });
  });

  describe("Footer Messages", () => {
    it("should show singular 'conversation' for one result", async () => {
      await logsCommand({ limit: 1 });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 1 conversation"));
    });

    it("should show plural 'conversations' for multiple results", async () => {
      await logsCommand({ limit: 2 });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 2 conversations"));
    });

    it("should show help hints in footer", async () => {
      await logsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Use --conversation <id>"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Use --detailed"));
    });
  });
});
