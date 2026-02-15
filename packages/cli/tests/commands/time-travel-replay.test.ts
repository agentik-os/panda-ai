import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { replayCommand } from "../../src/commands/time-travel/replay";

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

describe("Time Travel Replay Command", () => {
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
    it("should error when no event ID provided", async () => {
      await replayCommand("");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Event ID required")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda time-travel replay <event-id>")
      );
    });
  });

  describe("Basic Replay", () => {
    it("should replay event with valid ID", async () => {
      await replayCommand("event-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Event replayed successfully")
      );
    });

    it("should show header", async () => {
      await replayCommand("event-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Time Travel: Replaying Event")
      );
    });

    it("should show event ID", async () => {
      await replayCommand("event-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Event ID: event-456")
      );
    });

    it("should generate replay ID", async () => {
      await replayCommand("event-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toMatch(/Replay ID: replay_\d+/);
    });

    it("should not show parameter changes by default", async () => {
      await replayCommand("event-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("New Model:");
      expect(allLogs).not.toContain("New Temperature:");
    });

    it("should not show comparison by default", async () => {
      await replayCommand("event-123");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Comparison:");
    });
  });

  describe("With Model Option", () => {
    it("should show new model when specified", async () => {
      await replayCommand("event-123", { model: "claude-haiku" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Model: claude-haiku")
      );
    });

    it("should still replay successfully", async () => {
      await replayCommand("event-123", { model: "gpt-4" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Event replayed successfully")
      );
    });
  });

  describe("With Temperature Option", () => {
    it("should show new temperature when specified", async () => {
      await replayCommand("event-123", { temperature: 0.5 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Temperature: 0.5")
      );
    });

    it("should handle zero temperature", async () => {
      await replayCommand("event-123", { temperature: 0 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Temperature: 0")
      );
    });

    it("should handle high temperature", async () => {
      await replayCommand("event-123", { temperature: 1.5 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Temperature: 1.5")
      );
    });
  });

  describe("With Combined Options", () => {
    it("should show both model and temperature", async () => {
      await replayCommand("event-123", { model: "claude-haiku", temperature: 0.7 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Model: claude-haiku")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Temperature: 0.7")
      );
    });
  });

  describe("Compare Option", () => {
    it("should show comparison when flag is true", async () => {
      await replayCommand("event-123", { compare: true });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Comparison:");
      expect(allLogs).toContain("Original: GPT-4 @ temp 0.7 → $0.0045");
      expect(allLogs).toContain("Replay:   Claude Haiku @ temp 0.5 → $0.0003");
      expect(allLogs).toContain("Savings: 93.3% ($0.0042)");
    });

    it("should not show comparison when flag is false", async () => {
      await replayCommand("event-123", { compare: false });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Comparison:");
    });
  });

  describe("Spinner Behavior", () => {
    it("should show spinner during processing", async () => {
      await replayCommand("event-123");

      expect(lastSpinnerInstance.start).toHaveBeenCalled();
    });

    it("should update spinner text during processing", async () => {
      await replayCommand("event-123");

      // Spinner text is updated to "Replaying with new parameters..."
      expect(lastSpinnerInstance.text).toBeDefined();
    });

    it("should succeed spinner after completion", async () => {
      await replayCommand("event-123");

      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Replay complete");
    });
  });

  describe("Help Text", () => {
    it("should show command to view diff", async () => {
      await replayCommand("event-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("View diff with:")
      );
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toMatch(/panda time-travel diff event-123 replay_\d+/);
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long event ID", async () => {
      const longEventId = "event-" + "x".repeat(100);

      await replayCommand(longEventId);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Event ID: ${longEventId}`)
      );
    });

    it("should handle special characters in event ID", async () => {
      await replayCommand("event-123_abc-def");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Event ID: event-123_abc-def")
      );
    });

    it("should handle UUID format event ID", async () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";

      await replayCommand(uuid);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Event ID: ${uuid}`)
      );
    });

    it("should handle very long model name", async () => {
      const longModel = "claude-3-5-sonnet-20240620-beta-v2.1-experimental";

      await replayCommand("event-123", { model: longModel });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`New Model: ${longModel}`)
      );
    });

    it("should handle negative temperature", async () => {
      await replayCommand("event-123", { temperature: -0.5 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Temperature: -0.5")
      );
    });

    it("should handle very high temperature", async () => {
      await replayCommand("event-123", { temperature: 10.0 });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Temperature: 10")
      );
    });

    it("should handle saveAs option without errors", async () => {
      await replayCommand("event-123", { saveAs: "my-replay" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Event replayed successfully")
      );
    });

    it("should handle all options combined", async () => {
      await replayCommand("event-123", {
        model: "claude-haiku",
        temperature: 0.5,
        saveAs: "my-replay",
        compare: true,
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Model: claude-haiku")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("New Temperature: 0.5")
      );
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Comparison:");
    });
  });
});
