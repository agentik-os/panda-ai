import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listDreamsCommand } from "../../src/commands/dreams/list";
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

describe("Dreams List Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockSchedules = [
    {
      agentId: "agent-1",
      agentName: "Financial Advisor",
      enabled: true,
      frequency: "daily" as const,
      time: "02:00",
      lastRun: new Date("2024-01-15T02:00:00.000Z"),
      nextRun: new Date("2024-01-16T02:00:00.000Z"),
    },
    {
      agentId: "agent-2",
      agentName: "Data Analyst",
      enabled: false,
      frequency: "weekly" as const,
      time: "03:00",
    },
    {
      agentId: "agent-3",
      agentName: "VeryLongAgentNameThatExceedsColumnWidth",
      enabled: true,
      frequency: "custom" as const,
      time: "04:30",
      lastRun: new Date("2024-01-14T04:30:00.000Z"),
      nextRun: new Date("2024-01-21T04:30:00.000Z"),
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
        schedules: mockSchedules,
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
    it("should show message when no schedules file exists", async () => {
      (existsSync as any).mockReturnValue(false);

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream schedules configured"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dreams schedule <agent-id>")
      );
    });

    it("should show message when schedules array is empty", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ schedules: [] }));

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream schedules configured"));
    });

    it("should handle corrupted JSON gracefully", async () => {
      (readFileSync as any).mockReturnValue("invalid json {{{");

      await listDreamsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading dream schedules"),
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream schedules configured"));
    });

    it("should handle undefined schedules property", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({}));

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream schedules configured"));
    });
  });

  describe("Table Display", () => {
    it("should display schedules in table format", async () => {
      await listDreamsCommand();

      // Header
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Dream Schedules (3)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("AGENT"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("FREQUENCY"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("TIME"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("LAST RUN"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("NEXT RUN"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("STATUS"));

      // Schedule rows
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Financial Advisor"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Data Analyst"));
    });

    it("should show total count in footer", async () => {
      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Total: 3 schedules")
      );
    });

    it("should show singular 'schedule' for one result", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ schedules: [mockSchedules[0]] })
      );

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 1 schedule (1 enabled)"));
    });

    it("should show enabled count", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("2 enabled");
    });

    it("should truncate long agent names", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Agent name column width is 20, substring to 19
      expect(allLogs).toContain("VeryLongAgentNameTh");
    });

    it("should show help text in footer", async () => {
      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Manage schedules with:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dreams schedule")
      );
    });
  });

  describe("Data Formatting", () => {
    it("should format dates correctly", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Dates are locale-dependent, just check format exists
      expect(allLogs).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it("should show 'Never' for missing dates", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // agent-2 has no lastRun/nextRun
      expect(allLogs).toContain("Never");
    });

    it("should display frequency types", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("daily");
      expect(allLogs).toContain("weekly");
      expect(allLogs).toContain("custom");
    });

    it("should display time values", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("02:00");
      expect(allLogs).toContain("03:00");
      expect(allLogs).toContain("04:30");
    });

    it("should show Enabled status for active schedules", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Enabled");
    });

    it("should show Disabled status for inactive schedules", async () => {
      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Disabled");
    });
  });

  describe("Edge Cases", () => {
    it("should handle schedule with zero agents", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({
          schedules: [],
        })
      );

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream schedules"));
    });

    it("should handle very short agent name", async () => {
      const shortNameSchedule = { ...mockSchedules[0], agentName: "A" };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ schedules: [shortNameSchedule] })
      );

      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("A");
    });

    it("should handle agent name exactly at truncation limit", async () => {
      // Agent name width is 20, truncation at 19
      const exactLengthName = "X".repeat(19);
      const exactNameSchedule = { ...mockSchedules[0], agentName: exactLengthName };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ schedules: [exactNameSchedule] })
      );

      await listDreamsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain(exactLengthName);
    });

    it("should handle many schedules", async () => {
      const manySchedules = Array.from({ length: 50 }, (_, i) => ({
        agentId: `agent-${i}`,
        agentName: `Agent ${i}`,
        enabled: i % 2 === 0,
        frequency: "daily" as const,
        time: "02:00",
      }));

      (readFileSync as any).mockReturnValue(
        JSON.stringify({ schedules: manySchedules })
      );

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 50 schedules"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("25 enabled"));
    });

    it("should handle all schedules disabled", async () => {
      const disabledSchedules = mockSchedules.map((s) => ({ ...s, enabled: false }));
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ schedules: disabledSchedules })
      );

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("0 enabled"));
    });

    it("should handle all schedules enabled", async () => {
      const enabledSchedules = mockSchedules.map((s) => ({ ...s, enabled: true }));
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ schedules: enabledSchedules })
      );

      await listDreamsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("3 enabled"));
    });

    it("should handle readFileSync throwing error", async () => {
      (readFileSync as any).mockImplementation(() => {
        throw new Error("Permission denied");
      });

      await listDreamsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading dream schedules"),
        "Permission denied"
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No dream schedules"));
    });
  });

  describe("Column Alignment", () => {
    it("should pad columns correctly", async () => {
      await listDreamsCommand();

      // Check that separator line exists
      const separatorCall = consoleLogSpy.mock.calls.find((call) =>
        call[0].includes("---")
      );
      expect(separatorCall).toBeDefined();
    });
  });
});
