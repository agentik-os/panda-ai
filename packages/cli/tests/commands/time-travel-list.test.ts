import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listEventsCommand } from "../../src/commands/time-travel/list";
import { readFileSync, existsSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    red: (str: string) => str,
    green: (str: string) => str,
    yellow: (str: string) => str,
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    dim: (str: string) => str,
    bold: (str: string) => str,
  },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe("Time Travel List Events Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockSnapshots = [
    {
      id: "snapshot-1",
      agentId: "agent-1",
      agentName: "Finance Agent",
      conversationId: "conv-1",
      timestamp: new Date("2024-01-15T10:00:00.000Z"),
      messageCount: 25,
      modelVersion: "claude-3-5-sonnet",
    },
    {
      id: "snapshot-2",
      agentId: "agent-2",
      agentName: "Data Analyst",
      conversationId: "conv-2",
      timestamp: new Date("2024-01-16T12:00:00.000Z"),
      messageCount: 10,
      modelVersion: "gpt-4",
    },
    {
      id: "snapshot-3",
      agentId: "agent-1",
      agentName: "Finance Agent",
      conversationId: "conv-3",
      timestamp: new Date("2024-01-17T14:00:00.000Z"),
      messageCount: 5,
      modelVersion: "claude-3-5-sonnet",
    },
  ];

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.HOME = "/tmp/test-home";

    // Default mocks
    (existsSync as any).mockReturnValue(true);
    (readFileSync as any).mockReturnValue(
      JSON.stringify({
        snapshots: mockSnapshots,
      })
    );

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete process.env.HOME;
  });

  describe("Empty State", () => {
    it("should show message when no snapshots file exists", async () => {
      (existsSync as any).mockReturnValue(false);

      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversation events found")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda time-travel replay <conversation-id>")
      );
    });

    it("should show message when snapshots array is empty", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ snapshots: [] }));

      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversation events found")
      );
    });

    it("should show message when filtering with no results", async () => {
      await listEventsCommand({ agent: "agent-999" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversation events found")
      );
    });

    it("should handle corrupted JSON gracefully", async () => {
      (readFileSync as any).mockReturnValue("invalid json {{{");

      await listEventsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading snapshots"),
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversation events found")
      );
    });

    it("should handle undefined snapshots property", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({}));

      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversation events found")
      );
    });
  });

  describe("Table Display", () => {
    it("should display table header", async () => {
      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Conversation Events"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("EVENT ID"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("AGENT"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("DATE"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("MODEL"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("MESSAGES"));
    });

    it("should display snapshot rows", async () => {
      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Finance Agent");
      expect(allLogs).toContain("Data Analyst");
    });

    it("should display model versions", async () => {
      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("claude-3-5-sonnet");
      expect(allLogs).toContain("gpt-4");
    });

    it("should display message counts", async () => {
      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("25");
      expect(allLogs).toContain("10");
      expect(allLogs).toContain("5");
    });

    it("should truncate long names to fit columns", async () => {
      const longNameSnapshot = {
        ...mockSnapshots[0],
        agentName: "VeryLongAgentNameThatExceedsColumnWidth",
      };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ snapshots: [longNameSnapshot] })
      );

      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Agent column width is 15, so name should be truncated to 14 chars
      expect(allLogs).toContain("VeryLongAgentN");
    });
  });

  describe("Sorting", () => {
    it("should sort snapshots by timestamp newest first", async () => {
      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // snapshot-3 (Jan 17) should appear before snapshot-2 (Jan 16) before snapshot-1 (Jan 15)
      const snapshot3Index = allLogs.indexOf("snapshot-3");
      const snapshot2Index = allLogs.indexOf("snapshot-2");
      const snapshot1Index = allLogs.indexOf("snapshot-1");

      expect(snapshot3Index).toBeLessThan(snapshot2Index);
      expect(snapshot2Index).toBeLessThan(snapshot1Index);
    });
  });

  describe("Filtering", () => {
    it("should filter snapshots by agent ID", async () => {
      await listEventsCommand({ agent: "agent-1" });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Should show agent-1 snapshots (snapshot-1 and snapshot-3)
      expect(allLogs).toContain("snapshot-1");
      expect(allLogs).toContain("snapshot-3");
      // Should not show agent-2 snapshots
      expect(allLogs).not.toContain("snapshot-2");
      expect(allLogs).not.toContain("Data Analyst");
    });

    it("should show all snapshots when no filter provided", async () => {
      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Finance Agent");
      expect(allLogs).toContain("Data Analyst");
    });
  });

  describe("Limiting Results", () => {
    it("should use default limit of 50", async () => {
      const manySnapshots = Array.from({ length: 60 }, (_, i) => ({
        id: `snapshot-${i}`,
        agentId: "agent-1",
        agentName: "Test Agent",
        conversationId: `conv-${i}`,
        timestamp: new Date(`2024-01-${15 + i % 15}T10:00:00.000Z`),
        messageCount: 10,
        modelVersion: "claude-3-5-sonnet",
      }));

      (readFileSync as any).mockReturnValue(
        JSON.stringify({ snapshots: manySnapshots })
      );

      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Showing 50 of 60 events")
      );
    });

    it("should use custom limit when provided", async () => {
      const manySnapshots = Array.from({ length: 30 }, (_, i) => ({
        id: `snapshot-${i}`,
        agentId: "agent-1",
        agentName: "Test Agent",
        conversationId: `conv-${i}`,
        timestamp: new Date(`2024-01-${15 + i % 15}T10:00:00.000Z`),
        messageCount: 10,
        modelVersion: "claude-3-5-sonnet",
      }));

      (readFileSync as any).mockReturnValue(
        JSON.stringify({ snapshots: manySnapshots })
      );

      await listEventsCommand({ limit: 10 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Showing 10 of 30 events")
      );
    });

    it("should show all when count is less than limit", async () => {
      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Showing 3 of 3 events")
      );
    });
  });

  describe("Footer Messages", () => {
    it("should show count of displayed vs total events", async () => {
      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Showing 3 of 3 events")
      );
    });

    it("should show help text about replay", async () => {
      await listEventsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Replay an event with:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda time-travel replay <event-id>")
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle readFileSync throwing error", async () => {
      (readFileSync as any).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      await listEventsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading snapshots"),
        "Permission denied"
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No conversation events found")
      );
    });

    it("should handle very short agent name", async () => {
      const shortNameSnapshot = { ...mockSnapshots[0], agentName: "AI" };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ snapshots: [shortNameSnapshot] })
      );

      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("AI");
    });

    it("should handle very long model version", async () => {
      const longModelSnapshot = {
        ...mockSnapshots[0],
        modelVersion: "claude-3-5-sonnet-20240620-beta-v2.1-experimental",
      };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ snapshots: [longModelSnapshot] })
      );

      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Model column width is 20, so should be truncated to 19 chars
      expect(allLogs).toContain("claude-3-5-sonnet-2");
    });

    it("should handle zero message count", async () => {
      const zeroMessagesSnapshot = { ...mockSnapshots[0], messageCount: 0 };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ snapshots: [zeroMessagesSnapshot] })
      );

      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("0");
    });

    it("should handle large message count", async () => {
      const largeCountSnapshot = { ...mockSnapshots[0], messageCount: 999999 };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ snapshots: [largeCountSnapshot] })
      );

      await listEventsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("999999");
    });
  });
});
