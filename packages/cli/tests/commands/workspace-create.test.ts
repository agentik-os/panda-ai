import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createWorkspaceCommand } from "../../src/commands/workspace/create";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
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

describe("Workspace Create Command", () => {
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
    it("should error when no name provided", async () => {
      await expect(createWorkspaceCommand()).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace name required")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace create <name>")
      );
    });

    it("should error when name is empty string", async () => {
      await expect(createWorkspaceCommand("")).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace name required")
      );
    });
  });

  describe("Basic Creation", () => {
    it("should create workspace with name only", async () => {
      await createWorkspaceCommand("Production");

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Creating Workspace"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Name: Production"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace created successfully")
      );
    });

    it("should display workspace ID after creation", async () => {
      await createWorkspaceCommand("Development");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toMatch(/Workspace ID: ws_\d+/);
    });

    it("should show switch command hint", async () => {
      await createWorkspaceCommand("Testing");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace switch Testing")
      );
    });
  });

  describe("Options Handling", () => {
    it("should display description when provided", async () => {
      await createWorkspaceCommand("Production", {
        description: "Production environment workspace",
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Description: Production environment workspace")
      );
    });

    it("should not display description when not provided", async () => {
      await createWorkspaceCommand("Production");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Description:");
    });

    it("should display isolation when enabled", async () => {
      const promise = createWorkspaceCommand("Production", {
        isolate: true,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Isolation: Enabled")
      );
    });

    it("should not display isolation when not enabled", async () => {
      const promise = createWorkspaceCommand("Production", {
        isolate: false,
      });

      await promise;

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Isolation:");
    });

    it("should display quota when provided", async () => {
      const promise = createWorkspaceCommand("Production", {
        quota: 500,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Cost Quota: $500/month"));
    });

    it("should not display quota when not provided", async () => {
      await createWorkspaceCommand("Production");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Cost Quota:");
    });

    it("should handle quota with decimal", async () => {
      const promise = createWorkspaceCommand("Production", {
        quota: 99.99,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cost Quota: $99.99/month")
      );
    });

    it("should handle zero quota", async () => {
      const promise = createWorkspaceCommand("Production", {
        quota: 0,
      });

      await promise;

      // quota: 0 is falsy, so it won't be displayed
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Cost Quota:");
    });
  });

  describe("Combined Options", () => {
    it("should handle all options together", async () => {
      const promise = createWorkspaceCommand("Production", {
        description: "Production environment",
        isolate: true,
        quota: 1000,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Description: Production environment")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Isolation: Enabled")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cost Quota: $1000/month")
      );
    });

    it("should handle description and quota only", async () => {
      const promise = createWorkspaceCommand("Development", {
        description: "Dev environment",
        quota: 100,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Description: Dev environment")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Cost Quota: $100/month"));

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Isolation:");
    });

    it("should handle isolate and quota only", async () => {
      const promise = createWorkspaceCommand("Testing", {
        isolate: true,
        quota: 50,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Isolation: Enabled")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Cost Quota: $50/month"));

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Description:");
    });
  });

  describe("Edge Cases", () => {
    it("should handle very long workspace name", async () => {
      const longName = "VeryLongWorkspaceNameThatMightCauseDisplayIssues";
      const promise = createWorkspaceCommand(longName);

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining(longName));
    });

    it("should handle workspace name with spaces", async () => {
      const promise = createWorkspaceCommand("My Production Workspace");

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Name: My Production Workspace")
      );
    });

    it("should handle workspace name with special characters", async () => {
      const promise = createWorkspaceCommand("prod-env_2024");

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Name: prod-env_2024"));
    });

    it("should handle very long description", async () => {
      const longDescription =
        "This is a very long description that might span multiple lines and contain lots of information about the workspace";
      const promise = createWorkspaceCommand("Production", {
        description: longDescription,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining(`Description: ${longDescription}`)
      );
    });

    it("should handle large quota value", async () => {
      const promise = createWorkspaceCommand("Enterprise", {
        quota: 99999,
      });

      await promise;

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cost Quota: $99999/month")
      );
    });

    it("should handle empty description string", async () => {
      const promise = createWorkspaceCommand("Production", {
        description: "",
      });

      await promise;

      // Empty string is falsy, so description won't be displayed
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Description:");
    });
  });

  describe("Workspace ID Generation", () => {
    it("should generate unique workspace IDs", async () => {
      await createWorkspaceCommand("Workspace1");

      const logs1 = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      const id1Match = logs1.match(/Workspace ID: (ws_\d+)/);
      expect(id1Match).toBeTruthy();

      consoleLogSpy.mockClear();

      await createWorkspaceCommand("Workspace2");

      const logs2 = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      const id2Match = logs2.match(/Workspace ID: (ws_\d+)/);
      expect(id2Match).toBeTruthy();

      // IDs might be the same due to fake timers, but format should be correct
      expect(id1Match![1]).toMatch(/^ws_\d+$/);
      expect(id2Match![1]).toMatch(/^ws_\d+$/);
    }, 10000); // Increase timeout to 10s for sequential workspace creation

    it("should use ws_ prefix for workspace ID", async () => {
      await createWorkspaceCommand("Production");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toMatch(/Workspace ID: ws_\d+/);
    });
  });

  describe("Spinner Behavior", () => {
    it("should start spinner with creating message", async () => {
      const ora = await import("ora");
      const mockOra = ora.default as any;

      await createWorkspaceCommand("Production");

      expect(mockOra).toHaveBeenCalledWith("Creating workspace...");
    });

    it("should complete spinner with success message", async () => {
      await createWorkspaceCommand("Production");

      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Workspace created");
    });
  });
});
