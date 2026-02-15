import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { triggerDreamCommand } from "../../src/commands/dreams/trigger";

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

describe("Dreams Trigger Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  describe("Validation", () => {
    it("should error when no agent ID provided", async () => {
      await triggerDreamCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent ID required")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dreams trigger <agent-id>")
      );
    });

    it("should error when agent ID includes nonexistent", async () => {
      await triggerDreamCommand("nonexistent-agent");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent ID required")
      );
    });
  });

  describe("Basic Trigger", () => {
    it("should trigger dream session with valid agent ID", async () => {
      await triggerDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream session triggered successfully")
      );
    });

    it("should show header", async () => {
      await triggerDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Triggering Dream Session")
      );
    });

    it("should show agent ID", async () => {
      await triggerDreamCommand("agent-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent: agent-456")
      );
    });

    it("should not show mode messages by default", async () => {
      await triggerDreamCommand("agent-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Mode: Dry Run");
      expect(allLogs).not.toContain("Mode: Force");
    });
  });

  describe("Dry Run Mode", () => {
    it("should show dry run mode message", async () => {
      await triggerDreamCommand("agent-123", { dryRun: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Mode: Dry Run (simulation only)")
      );
    });

    it("should still trigger successfully in dry run", async () => {
      await triggerDreamCommand("agent-123", { dryRun: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream session triggered successfully")
      );
    });
  });

  describe("Force Mode", () => {
    it("should show force mode message", async () => {
      await triggerDreamCommand("agent-123", { force: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Mode: Force (skip approval threshold)")
      );
    });

    it("should still trigger successfully in force mode", async () => {
      await triggerDreamCommand("agent-123", { force: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream session triggered successfully")
      );
    });
  });

  describe("Combined Modes", () => {
    it("should show both mode messages when both flags set", async () => {
      await triggerDreamCommand("agent-123", { dryRun: true, force: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Mode: Dry Run (simulation only)")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Mode: Force (skip approval threshold)")
      );
    });
  });

  describe("Output Messages", () => {
    it("should show success message", async () => {
      await triggerDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream session triggered successfully")
      );
    });

    it("should show help text about processing tasks", async () => {
      await triggerDreamCommand("agent-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("The agent will process scheduled tasks during the next dream cycle");
    });

    it("should show help text about morning report", async () => {
      await triggerDreamCommand("agent-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Morning report will be sent via email/Telegram");
    });

    it("should show command to view dream reports", async () => {
      await triggerDreamCommand("agent-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dreams view agent-123")
      );
    });
  });

  describe("Spinner Behavior", () => {
    it("should show spinner during trigger", async () => {
      await triggerDreamCommand("agent-123");

      expect(lastSpinnerInstance.start).toHaveBeenCalled();
    });

    it("should succeed spinner after trigger", async () => {
      await triggerDreamCommand("agent-123");

      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Dream session scheduled");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long agent ID", async () => {
      const longAgentId = "agent-" + "x".repeat(100);
      await triggerDreamCommand(longAgentId);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Agent: ${longAgentId}`)
      );
    });

    it("should handle special characters in agent ID", async () => {
      await triggerDreamCommand("agent-123_test-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent: agent-123_test-456")
      );
    });

    it("should handle agent ID with UUID format", async () => {
      await triggerDreamCommand("agent-550e8400-e29b-41d4-a716-446655440000");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Dream session triggered successfully")
      );
    });

    it("should handle empty string agent ID same as undefined", async () => {
      await triggerDreamCommand("");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent ID required")
      );
    });
  });
});
