import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { scheduleDreamCommand } from "../../src/commands/dreams/schedule";

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

// Store the last created spinner instance
let lastSpinnerInstance: any;

vi.mock("ora", () => ({
  default: vi.fn((message?: string) => {
    lastSpinnerInstance = {
      start: vi.fn().mockReturnThis(),
      succeed: vi.fn().mockReturnThis(),
      fail: vi.fn().mockReturnThis(),
      text: "",
    };
    return lastSpinnerInstance;
  }),
}));

describe("Dreams Schedule Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe("Validation", () => {
    it("should error when no agent ID provided", async () => {
      await expect(scheduleDreamCommand()).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent ID required")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dreams schedule <agent-id>")
      );
    });
  });

  describe("Disable Schedule", () => {
    it("should disable dream schedule when --disable is true", async () => {
      await scheduleDreamCommand("agent-123", { disable: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream sessions disabled for this agent")
      );
    });

    it("should show spinner during disable", async () => {
      await scheduleDreamCommand("agent-123", { disable: true });

      expect(lastSpinnerInstance.start).toHaveBeenCalled();
      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Dream schedule disabled");
    });

    it("should show agent ID when disabling", async () => {
      await scheduleDreamCommand("agent-123", { disable: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream Session Scheduler")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent: agent-123")
      );
    });
  });

  describe("Schedule with Defaults", () => {
    it("should schedule with default time and frequency", async () => {
      await scheduleDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream sessions scheduled successfully")
      );
    });

    it("should use 02:00 as default time", async () => {
      await scheduleDreamCommand("agent-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Time: 02:00");
    });

    it("should use daily as default frequency", async () => {
      await scheduleDreamCommand("agent-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Frequency: daily");
    });

    it("should show schedule in header", async () => {
      await scheduleDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Schedule: daily at 02:00")
      );
    });
  });

  describe("Schedule with Custom Options", () => {
    it("should schedule with custom time", async () => {
      await scheduleDreamCommand("agent-123", { time: "18:30" });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Time: 18:30");
    });

    it("should schedule with weekly frequency", async () => {
      await scheduleDreamCommand("agent-123", { frequency: "weekly" });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Frequency: weekly");
    });

    it("should schedule with custom frequency", async () => {
      await scheduleDreamCommand("agent-123", { frequency: "custom" });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Frequency: custom");
    });

    it("should schedule with both custom time and frequency", async () => {
      await scheduleDreamCommand("agent-123", { time: "09:15", frequency: "weekly" });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Time: 09:15");
      expect(allLogs).toContain("Frequency: weekly");
    });
  });

  describe("Output Messages", () => {
    it("should show header", async () => {
      await scheduleDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream Session Scheduler")
      );
    });

    it("should show agent ID", async () => {
      await scheduleDreamCommand("agent-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent: agent-456")
      );
    });

    it("should show success message", async () => {
      await scheduleDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream sessions scheduled successfully")
      );
    });

    it("should show help text about autonomous processing", async () => {
      await scheduleDreamCommand("agent-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("The agent will autonomously process tasks during dream sessions");
    });

    it("should show help text about morning reports", async () => {
      await scheduleDreamCommand("agent-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Morning reports will be sent via email/Telegram");
    });

    it("should show command to view dream reports", async () => {
      await scheduleDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dreams view agent-123")
      );
    });
  });

  describe("Spinner Behavior", () => {
    it("should show spinner during configuration", async () => {
      await scheduleDreamCommand("agent-123");

      expect(lastSpinnerInstance.start).toHaveBeenCalled();
    });

    it("should succeed spinner after configuration", async () => {
      await scheduleDreamCommand("agent-123");

      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Dream schedule configured");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long agent ID", async () => {
      const longAgentId = "agent-" + "x".repeat(100);
      await scheduleDreamCommand(longAgentId);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Agent: ${longAgentId}`)
      );
    });

    it("should handle special characters in agent ID", async () => {
      await scheduleDreamCommand("agent-123_test-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent: agent-123_test-456")
      );
    });

    it("should handle early morning time", async () => {
      await scheduleDreamCommand("agent-123", { time: "00:00" });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Time: 00:00");
    });

    it("should handle late evening time", async () => {
      await scheduleDreamCommand("agent-123", { time: "23:59" });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Time: 23:59");
    });
  });
});
