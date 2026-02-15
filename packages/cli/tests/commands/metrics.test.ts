import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { exportMetricsCommand, viewMetricsCommand } from "../../src/commands/metrics";
import { existsSync, readFileSync, unlinkSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    green: (str: string) => str,
    yellow: (str: string) => str,
    bold: (str: string) => str,
    dim: (str: string) => str,
  },
}));

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: "",
  })),
}));

describe("Metrics Commands", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    vi.clearAllMocks();
  });

  describe("exportMetricsCommand", () => {
    it("should export metrics in prometheus format by default", async () => {
      await exportMetricsCommand();

      // Verify console outputs
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("📊 Exporting Metrics"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("prometheus"));

      // Verify prometheus format in output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("# HELP agentik_conversations_total"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_conversations_total{agent=\"agent_1\"} 142"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("# HELP agentik_tokens_total"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("# HELP agentik_cost_total"));
    });

    it("should export metrics in json format when specified", async () => {
      await exportMetricsCommand({ format: "json" });

      // Verify format shown
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("json"));

      // Verify JSON structure in output
      const jsonOutputCall = consoleLogSpy.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("timestamp")
      );
      expect(jsonOutputCall).toBeDefined();

      const jsonOutput = jsonOutputCall![0];
      expect(jsonOutput).toContain("timestamp");
      expect(jsonOutput).toContain("metrics");
      expect(jsonOutput).toContain("conversations");
      expect(jsonOutput).toContain("tokens");
      expect(jsonOutput).toContain("cost");
      expect(jsonOutput).toContain("errors");
    });

    it("should export metrics in csv format when specified", async () => {
      await exportMetricsCommand({ format: "csv" });

      // Verify format shown
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("csv"));

      // Verify CSV structure in output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("metric,agent,value,timestamp"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("conversations_total,agent_1,142"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("tokens_total,agent_1,456789"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("cost_total,agent_1,45.67"));
    });

    it("should write metrics to file when output path specified", async () => {
      const testFile = "/tmp/test-metrics-output.txt";

      // Clean up if file exists
      if (existsSync(testFile)) {
        unlinkSync(testFile);
      }

      await exportMetricsCommand({ output: testFile });

      // Verify file was created
      expect(existsSync(testFile)).toBe(true);

      // Verify file contains metrics
      const fileContent = readFileSync(testFile, "utf-8");
      expect(fileContent).toContain("# HELP agentik_conversations_total");
      expect(fileContent).toContain("agentik_conversations_total{agent=\"agent_1\"} 142");

      // Verify console output
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("✅ Metrics exported successfully"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(testFile));

      // Clean up
      unlinkSync(testFile);
    });

    it("should write json metrics to file", async () => {
      const testFile = "/tmp/test-metrics-json.json";

      if (existsSync(testFile)) {
        unlinkSync(testFile);
      }

      await exportMetricsCommand({ format: "json", output: testFile });

      expect(existsSync(testFile)).toBe(true);

      const fileContent = readFileSync(testFile, "utf-8");
      const parsed = JSON.parse(fileContent);

      expect(parsed).toHaveProperty("timestamp");
      expect(parsed).toHaveProperty("metrics");
      expect(parsed.metrics).toHaveProperty("conversations");
      expect(parsed.metrics).toHaveProperty("tokens");
      expect(parsed.metrics).toHaveProperty("cost");
      expect(parsed.metrics).toHaveProperty("errors");

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("json"));

      unlinkSync(testFile);
    });

    it("should write csv metrics to file", async () => {
      const testFile = "/tmp/test-metrics-csv.csv";

      if (existsSync(testFile)) {
        unlinkSync(testFile);
      }

      await exportMetricsCommand({ format: "csv", output: testFile });

      expect(existsSync(testFile)).toBe(true);

      const fileContent = readFileSync(testFile, "utf-8");
      expect(fileContent).toContain("metric,agent,value,timestamp");
      expect(fileContent).toContain("conversations_total,agent_1,142");
      expect(fileContent).toContain("tokens_total,agent_2,234567");

      unlinkSync(testFile);
    });

    it("should complete within reasonable time", async () => {
      const startTime = Date.now();
      await exportMetricsCommand();
      const duration = Date.now() - startTime;

      // Should complete in ~2 seconds (1500ms + 500ms delays)
      expect(duration).toBeGreaterThan(1900);
      expect(duration).toBeLessThan(2500);
    });

    it("should show all metric types in prometheus format", async () => {
      await exportMetricsCommand({ format: "prometheus" });

      // Verify all metric types are present
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_conversations_total"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_tokens_total"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_cost_total"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_latency_seconds"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_errors_total"));
    });

    it("should include histogram metrics in prometheus format", async () => {
      await exportMetricsCommand({ format: "prometheus" });

      // Verify histogram buckets
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_latency_seconds_bucket"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('le="1.0"'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('le="2.0"'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('le="5.0"'));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_latency_seconds_sum"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agentik_latency_seconds_count"));
    });

    it("should include correct metric values in json format", async () => {
      await exportMetricsCommand({ format: "json" });

      const jsonOutputCall = consoleLogSpy.mock.calls.find(
        (call) => typeof call[0] === "string" && call[0].includes("byAgent")
      );
      expect(jsonOutputCall).toBeDefined();

      const jsonOutput = JSON.parse(jsonOutputCall![0]);

      // Verify conversation counts
      expect(jsonOutput.metrics.conversations.total).toBe(229);
      expect(jsonOutput.metrics.conversations.byAgent.agent_1).toBe(142);
      expect(jsonOutput.metrics.conversations.byAgent.agent_2).toBe(87);

      // Verify token counts
      expect(jsonOutput.metrics.tokens.total).toBe(691356);
      expect(jsonOutput.metrics.tokens.byAgent.agent_1).toBe(456789);
      expect(jsonOutput.metrics.tokens.byAgent.agent_2).toBe(234567);

      // Verify costs
      expect(jsonOutput.metrics.cost.total).toBe(69.12);
      expect(jsonOutput.metrics.cost.byAgent.agent_1).toBe(45.67);
      expect(jsonOutput.metrics.cost.byAgent.agent_2).toBe(23.45);

      // Verify errors
      expect(jsonOutput.metrics.errors.total).toBe(3);
      expect(jsonOutput.metrics.errors.byType.timeout).toBe(2);
      expect(jsonOutput.metrics.errors.byType.api_error).toBe(1);
    });

    it("should handle undefined options gracefully", async () => {
      await exportMetricsCommand(undefined);
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("📊 Exporting Metrics"));
    });

    it("should handle empty options object", async () => {
      await exportMetricsCommand({});
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("prometheus"));
    });
  });

  describe("viewMetricsCommand", () => {
    it("should display current metrics", async () => {
      await viewMetricsCommand();

      // Verify title
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("📊 Current Metrics"));
    });

    it("should show agents section", async () => {
      await viewMetricsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("🤖 Agents:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("2 active"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("229 total"));
    });

    it("should show usage section", async () => {
      await viewMetricsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💬 Usage:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("691,356"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("458"));
    });

    it("should show cost section", async () => {
      await viewMetricsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("💰 Cost:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("$2.34"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("$69.12"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("$2.30"));
    });

    it("should show performance section", async () => {
      await viewMetricsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("⚡ Performance:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("1.65s"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("98.7%"));
    });

    it("should show errors section", async () => {
      await viewMetricsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("❌ Errors:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("3 (last 24h)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Timeout"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("API Error"));
    });

    it("should show export instructions", async () => {
      await viewMetricsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Export metrics with:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda metrics export --format prometheus"));
    });

    it("should complete within reasonable time", async () => {
      const startTime = Date.now();
      await viewMetricsCommand();
      const duration = Date.now() - startTime;

      // Should complete in ~1 second (1000ms delay)
      expect(duration).toBeGreaterThan(900);
      expect(duration).toBeLessThan(1500);
    });

    it("should display all sections in correct order", async () => {
      await viewMetricsCommand();

      const calls = consoleLogSpy.mock.calls.map((call) => call[0]);
      const output = calls.join("\n");

      // Verify sections appear in order
      const agentsIndex = output.indexOf("🤖 Agents:");
      const usageIndex = output.indexOf("💬 Usage:");
      const costIndex = output.indexOf("💰 Cost:");
      const perfIndex = output.indexOf("⚡ Performance:");
      const errorsIndex = output.indexOf("❌ Errors:");

      expect(agentsIndex).toBeGreaterThan(-1);
      expect(usageIndex).toBeGreaterThan(agentsIndex);
      expect(costIndex).toBeGreaterThan(usageIndex);
      expect(perfIndex).toBeGreaterThan(costIndex);
      expect(errorsIndex).toBeGreaterThan(perfIndex);
    });
  });

  describe("Integration Tests", () => {
    it("should allow running both commands in sequence", async () => {
      await viewMetricsCommand();
      await exportMetricsCommand();

      // Both commands should complete successfully
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("📊 Current Metrics"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("📊 Exporting Metrics"));
    }, 10000);

    it("should allow exporting in all formats consecutively", async () => {
      await exportMetricsCommand({ format: "prometheus" });
      await exportMetricsCommand({ format: "json" });
      await exportMetricsCommand({ format: "csv" });

      // All exports should complete
      const calls = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(calls).toContain("prometheus");
      expect(calls).toContain("json");
      expect(calls).toContain("csv");
    }, 10000);

    it("should handle concurrent exports to different files", async () => {
      const prometheusFile = "/tmp/test-concurrent-prometheus.txt";
      const jsonFile = "/tmp/test-concurrent-json.json";
      const csvFile = "/tmp/test-concurrent-csv.csv";

      // Clean up
      [prometheusFile, jsonFile, csvFile].forEach((file) => {
        if (existsSync(file)) {
          unlinkSync(file);
        }
      });

      // Run concurrently
      await Promise.all([
        exportMetricsCommand({ format: "prometheus", output: prometheusFile }),
        exportMetricsCommand({ format: "json", output: jsonFile }),
        exportMetricsCommand({ format: "csv", output: csvFile }),
      ]);

      // All files should exist
      expect(existsSync(prometheusFile)).toBe(true);
      expect(existsSync(jsonFile)).toBe(true);
      expect(existsSync(csvFile)).toBe(true);

      // Verify content types
      expect(readFileSync(prometheusFile, "utf-8")).toContain("# HELP agentik_");
      expect(readFileSync(jsonFile, "utf-8")).toContain('"timestamp"');
      expect(readFileSync(csvFile, "utf-8")).toContain("metric,agent,value");

      // Clean up
      unlinkSync(prometheusFile);
      unlinkSync(jsonFile);
      unlinkSync(csvFile);
    }, 10000);
  });

  describe("Error Handling", () => {
    it("should handle invalid output directory gracefully", async () => {
      const invalidPath = "/nonexistent/directory/metrics.txt";

      // Should throw when trying to write to invalid directory
      await expect(exportMetricsCommand({ output: invalidPath })).rejects.toThrow();
    });

    it("should handle concurrent writes to same file", async () => {
      const testFile = "/tmp/test-concurrent-write.txt";

      if (existsSync(testFile)) {
        unlinkSync(testFile);
      }

      // Run concurrent writes to same file
      await Promise.all([
        exportMetricsCommand({ output: testFile }),
        exportMetricsCommand({ output: testFile }),
      ]);

      // File should exist with one of the outputs
      expect(existsSync(testFile)).toBe(true);

      unlinkSync(testFile);
    }, 10000);
  });
});
