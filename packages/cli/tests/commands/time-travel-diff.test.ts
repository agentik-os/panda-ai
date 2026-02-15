import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { diffCommand } from "../../src/commands/time-travel/diff";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    red: (str: string) => str,
    green: (str: string) => str,
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

describe("Time Travel Diff Command", () => {
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
    it("should error when no before ID provided", async () => {
      await diffCommand("", "after-123");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Two event IDs required")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda time-travel diff <before-id> <after-id>")
      );
    });

    it("should error when no after ID provided", async () => {
      await diffCommand("before-123", "");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Two event IDs required")
      );
    });

    it("should error when both IDs missing", async () => {
      await diffCommand("", "");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Two event IDs required")
      );
    });
  });

  describe("Header Display", () => {
    it("should show header", async () => {
      await diffCommand("before-123", "after-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Time Travel: Event Diff")
      );
    });

    it("should show before ID", async () => {
      await diffCommand("before-123", "after-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Before: before-123")
      );
    });

    it("should show after ID", async () => {
      await diffCommand("before-123", "after-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("After:  after-456")
      );
    });
  });

  describe("Diff Output", () => {
    it("should show comparison results header", async () => {
      await diffCommand("before-123", "after-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Comparison Results")
      );
    });

    it("should show model comparison", async () => {
      await diffCommand("before-123", "after-456");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Model:");
      expect(allLogs).toContain("GPT-4");
      expect(allLogs).toContain("Claude Haiku");
    });

    it("should show temperature comparison", async () => {
      await diffCommand("before-123", "after-456");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Temperature:");
      expect(allLogs).toContain("0.7");
      expect(allLogs).toContain("0.5");
    });

    it("should show cost comparison with savings", async () => {
      await diffCommand("before-123", "after-456");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Cost:");
      expect(allLogs).toContain("$0.0045");
      expect(allLogs).toContain("$0.0003");
      expect(allLogs).toContain("Savings: 93.3%");
    });

    it("should show response length comparison", async () => {
      await diffCommand("before-123", "after-456");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Response Length:");
      expect(allLogs).toContain("Original: 487 tokens");
      expect(allLogs).toContain("Replay:   492 tokens");
    });

    it("should show response similarity metrics", async () => {
      await diffCommand("before-123", "after-456");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Response Similarity:");
      expect(allLogs).toContain("94.2% semantic similarity");
      expect(allLogs).toContain("Task completion: Equal");
    });
  });

  describe("Spinner Behavior", () => {
    it("should show spinner during processing", async () => {
      await diffCommand("before-123", "after-456");

      expect(lastSpinnerInstance.start).toHaveBeenCalled();
    });

    it("should update spinner text during processing", async () => {
      await diffCommand("before-123", "after-456");

      // Spinner text is updated to "Computing diff..."
      expect(lastSpinnerInstance.text).toBeDefined();
    });

    it("should succeed spinner after completion", async () => {
      await diffCommand("before-123", "after-456");

      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Diff computed");
    });
  });

  describe("Help Text", () => {
    it("should show command to open dashboard", async () => {
      await diffCommand("before-123", "after-456");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Open side-by-side diff in dashboard:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dashboard --time-travel before-123,after-456")
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long event IDs", async () => {
      const longBeforeId = "event-" + "x".repeat(100);
      const longAfterId = "event-" + "y".repeat(100);

      await diffCommand(longBeforeId, longAfterId);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Before: ${longBeforeId}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`After:  ${longAfterId}`)
      );
    });

    it("should handle special characters in event IDs", async () => {
      await diffCommand("event-123_abc-def", "event-456_xyz-uvw");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Before: event-123_abc-def")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("After:  event-456_xyz-uvw")
      );
    });

    it("should handle UUID format event IDs", async () => {
      const uuid1 = "550e8400-e29b-41d4-a716-446655440000";
      const uuid2 = "660f9511-f3ac-52e5-b827-557766551111";

      await diffCommand(uuid1, uuid2);

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Before: ${uuid1}`)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`After:  ${uuid2}`)
      );
    });

    it("should handle same event ID for before and after", async () => {
      await diffCommand("event-123", "event-123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Before: event-123")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("After:  event-123")
      );
    });
  });
});
