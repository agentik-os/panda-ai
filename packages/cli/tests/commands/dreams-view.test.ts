import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { viewDreamsCommand } from "../../src/commands/dreams/view";
import { readFileSync, existsSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => {
  // Create a single chainable mock that all methods return
  const mockFn: any = (str: string) => str;
  mockFn.cyan = mockFn;
  mockFn.green = mockFn;
  mockFn.yellow = mockFn;
  mockFn.red = mockFn;
  mockFn.gray = mockFn;
  mockFn.blue = mockFn;
  mockFn.magenta = mockFn;
  mockFn.white = mockFn;
  mockFn.bold = mockFn;
  mockFn.dim = mockFn;
  return {
    default: mockFn,
  };
});

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe("Dreams View Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockExecutions = [
    {
      id: "exec-1",
      agentId: "agent-1",
      agentName: "Financial Advisor",
      startTime: new Date("2024-01-15T02:00:00.000Z"),
      endTime: new Date("2024-01-15T02:30:00.000Z"),
      status: "completed" as const,
      messagesProcessed: 25,
      tokenCount: 15000,
      cost: 0.45,
      summary: "Analyzed market trends and generated portfolio recommendations",
    },
    {
      id: "exec-2",
      agentId: "agent-2",
      agentName: "Data Analyst",
      startTime: new Date("2024-01-15T03:00:00.000Z"),
      endTime: new Date("2024-01-15T03:45:00.000Z"),
      status: "stopped" as const,
      messagesProcessed: 10,
      tokenCount: 8000,
      cost: 0.24,
      summary: "Interrupted by user while processing data",
    },
    {
      id: "exec-3",
      agentId: "agent-1",
      agentName: "Financial Advisor",
      startTime: new Date("2024-01-16T02:00:00.000Z"),
      endTime: new Date("2024-01-16T02:15:00.000Z"),
      status: "failed" as const,
      messagesProcessed: 5,
      tokenCount: 3000,
      cost: 0.09,
      summary: "API rate limit exceeded",
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
        executions: mockExecutions,
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
    it("should show message when no history file exists", async () => {
      (existsSync as any).mockReturnValue(false);

      await viewDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream executions found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dreams trigger <agent-id>")
      );
    });

    it("should show message when executions array is empty", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ executions: [] }));

      await viewDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream executions found"));
    });

    it("should show agent ID when filtering with no results", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ executions: mockExecutions }));

      await viewDreamsCommand("agent-999");

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream executions found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("For agent: agent-999"));
    });

    it("should handle corrupted JSON gracefully", async () => {
      (readFileSync as any).mockReturnValue("invalid json {{{");

      await viewDreamsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading dream history"),
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream executions found"));
    });

    it("should handle undefined executions property", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({}));

      await viewDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream executions found"));
    });
  });

  describe("Display Execution", () => {
    it("should display execution header", async () => {
      await viewDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Dream Execution History"));
    });

    it("should display agent name", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Financial Advisor");
      expect(allLogs).toContain("Data Analyst");
    });

    it("should display agent ID", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Agent ID: agent-1");
      expect(allLogs).toContain("Agent ID: agent-2");
    });

    it("should display execution ID", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Execution ID: exec-1");
      expect(allLogs).toContain("Execution ID: exec-2");
      expect(allLogs).toContain("Execution ID: exec-3");
    });

    it("should display status", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Status: completed");
      expect(allLogs).toContain("Status: stopped");
      expect(allLogs).toContain("Status: failed");
    });

    it("should display start time", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Started:");
    });

    it("should display end time", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Ended:");
    });

    it("should calculate and display duration", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // exec-1: 30 minutes
      expect(allLogs).toContain("Duration: 30.0 minutes");
      // exec-2: 45 minutes
      expect(allLogs).toContain("Duration: 45.0 minutes");
      // exec-3: 15 minutes
      expect(allLogs).toContain("Duration: 15.0 minutes");
    });

    it("should display messages processed", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Messages processed: 25");
      expect(allLogs).toContain("Messages processed: 10");
      expect(allLogs).toContain("Messages processed: 5");
    });

    it("should display token count", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Tokens used: 15000");
      expect(allLogs).toContain("Tokens used: 8000");
      expect(allLogs).toContain("Tokens used: 3000");
    });

    it("should display cost with 2 decimal places", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Cost: $0.45");
      expect(allLogs).toContain("Cost: $0.24");
      expect(allLogs).toContain("Cost: $0.09");
    });

    it("should display summary", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Summary: Analyzed market trends and generated portfolio recommendations");
      expect(allLogs).toContain("Summary: Interrupted by user while processing data");
      expect(allLogs).toContain("Summary: API rate limit exceeded");
    });

    it("should show separator between executions", async () => {
      await viewDreamsCommand();

      const separatorCalls = consoleLogSpy.mock.calls.filter((call) =>
        call[0].includes("---")
      );
      // 3 executions = 3 separators
      expect(separatorCalls.length).toBe(3);
    });

    it("should show total count in footer", async () => {
      await viewDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 3 executions"));
    });

    it("should show singular 'execution' for one result", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ executions: [mockExecutions[0]] })
      );

      await viewDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 1 execution"));
    });
  });

  describe("Agent Filtering", () => {
    it("should filter executions by agent ID", async () => {
      await viewDreamsCommand("agent-1");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Should show agent-1 executions (exec-1 and exec-3)
      expect(allLogs).toContain("exec-1");
      expect(allLogs).toContain("exec-3");
      // Should not show agent-2 executions
      expect(allLogs).not.toContain("exec-2");
      expect(allLogs).not.toContain("Data Analyst");
    });

    it("should show only matching executions", async () => {
      await viewDreamsCommand("agent-2");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Data Analyst");
      expect(allLogs).not.toContain("Financial Advisor");
    });

    it("should show all executions when no filter provided", async () => {
      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Financial Advisor");
      expect(allLogs).toContain("Data Analyst");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long summary", async () => {
      const longSummaryExecution = {
        ...mockExecutions[0],
        summary: "A".repeat(500),
      };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ executions: [longSummaryExecution] })
      );

      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("A".repeat(500));
    });

    it("should handle zero messages processed", async () => {
      const zeroMessagesExecution = {
        ...mockExecutions[0],
        messagesProcessed: 0,
      };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ executions: [zeroMessagesExecution] })
      );

      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Messages processed: 0");
    });

    it("should handle zero cost", async () => {
      const zeroCostExecution = {
        ...mockExecutions[0],
        cost: 0,
      };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ executions: [zeroCostExecution] })
      );

      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Cost: $0.00");
    });

    it("should handle large cost", async () => {
      const largeCostExecution = {
        ...mockExecutions[0],
        cost: 999.99,
      };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ executions: [largeCostExecution] })
      );

      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Cost: $999.99");
    });

    it("should handle very short duration", async () => {
      const shortDurationExecution = {
        ...mockExecutions[0],
        startTime: new Date("2024-01-15T02:00:00.000Z"),
        endTime: new Date("2024-01-15T02:00:30.000Z"), // 30 seconds = 0.5 minutes
      };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ executions: [shortDurationExecution] })
      );

      await viewDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Duration: 0.5 minutes");
    });

    it("should handle readFileSync throwing error", async () => {
      (readFileSync as any).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      await viewDreamsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading dream history"),
        "Permission denied"
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream executions found"));
    });

    it("should handle many executions", async () => {
      const manyExecutions = Array.from({ length: 50 }, (_, i) => ({
        id: `exec-${i}`,
        agentId: "agent-1",
        agentName: "Test Agent",
        startTime: new Date("2024-01-15T02:00:00.000Z"),
        endTime: new Date("2024-01-15T02:30:00.000Z"),
        status: "completed" as const,
        messagesProcessed: 10,
        tokenCount: 5000,
        cost: 0.15,
        summary: "Test execution",
      }));

      (readFileSync as any).mockReturnValue(
        JSON.stringify({ executions: manyExecutions })
      );

      await viewDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 50 executions"));
    });
  });
});
