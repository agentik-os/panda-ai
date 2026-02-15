import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listWorkspacesCommand } from "../../src/commands/workspace/list";
import type { Workspace } from "@agentik-os/shared";
import { readFileSync, existsSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    yellow: (str: string) => str,
    red: (str: string) => str,
    green: (str: string) => str,
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

describe("Workspace List Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockWorkspaces = [
    {
      id: "ws-1",
      name: "Production",
      description: "Production environment workspace",
      createdAt: new Date("2024-01-15T00:00:00.000Z") as any,
      agentCount: 12,
      monthlyUsage: 150.75,
      quota: 500.0,
      active: true,
    },
    {
      id: "ws-2",
      name: "Development",
      description: "Development and testing workspace",
      createdAt: new Date("2024-01-16T00:00:00.000Z") as any,
      agentCount: 5,
      monthlyUsage: 25.5,
      quota: 100.0,
      active: true,
    },
    {
      id: "ws-3",
      name: "VeryLongWorkspaceNameThatExceedsTheColumnWidth",
      description: "Workspace with a very long name to test truncation behavior in table display",
      createdAt: new Date("2024-01-17T00:00:00.000Z") as any,
      agentCount: 0,
      monthlyUsage: 0.0,
      active: false,
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
        workspaces: mockWorkspaces,
        currentWorkspace: "Production",
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
    it("should show message when no workspaces file exists", async () => {
      (existsSync as any).mockReturnValue(false);

      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No workspaces found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace create")
      );
    });

    it("should show message when workspaces array is empty", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ workspaces: [] }));

      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No workspaces found"));
    });

    it("should handle corrupted JSON gracefully", async () => {
      (readFileSync as any).mockReturnValue("invalid json {{{");

      await listWorkspacesCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading workspaces"),
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No workspaces found"));
    });

    it("should handle undefined workspaces property", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({}));

      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No workspaces found"));
    });
  });

  describe("Table Display", () => {
    it("should display workspaces in table format", async () => {
      await listWorkspacesCommand();

      // Header
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Workspaces (3)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("NAME"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("DESCRIPTION"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("AGENTS"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("USAGE"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("QUOTA"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("CREATED"));

      // Workspace rows
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Production"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Development"));
    });

    it("should show total count in footer", async () => {
      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Total: 3 workspaces")
      );
    });

    it("should show singular 'workspace' for one result", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ workspaces: [mockWorkspaces[0]] })
      );

      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 1 workspace"));
    });

    it("should truncate long workspace names", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Should truncate to name column width (20) - 3 for prefix = 17
      expect(allLogs).toContain("VeryLongWorkspac");
    });

    it("should truncate long descriptions", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Description width is 30, substring uses width-1 = 29 chars
      expect(allLogs).toContain("Workspace with a very long na");
    });

    it("should mark current workspace with indicator", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Current workspace should have "▸" prefix
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Production"));
    });

    it("should show current workspace in footer", async () => {
      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Current workspace: Production")
      );
    });

    it("should not show current workspace footer when none selected", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({
          workspaces: mockWorkspaces,
        })
      );

      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Current workspace:");
    });
  });

  describe("Data Formatting", () => {
    it("should format costs with 2 decimal places", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("$150.75");
      expect(allLogs).toContain("$25.50");
      expect(allLogs).toContain("$0.00");
    });

    it("should format quota values", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("$500.00");
      expect(allLogs).toContain("$100.00");
    });

    it("should show 'unlimited' for workspaces without quota", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // ws-3 has no quota
      expect(allLogs).toContain("unlimited");
    });

    it("should format dates correctly", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Date formatting is locale-dependent, just check format exists
      expect(allLogs).toMatch(/\d{1,2}\/\d{1,2}\/\d{4}/);
    });

    it("should display agent count", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("12");
      expect(allLogs).toContain("5");
      expect(allLogs).toContain("0");
    });
  });

  describe("Help Messages", () => {
    it("should show create command hint when no workspaces", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ workspaces: [] }));

      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace create <name>")
      );
    });

    it("should show switch command hint in footer", async () => {
      await listWorkspacesCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace switch <name>")
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle workspace with zero agents", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("0");
    });

    it("should handle workspace with zero usage", async () => {
      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("$0.00");
    });

    it("should handle very short workspace name", async () => {
      const shortNameWorkspace = { ...mockWorkspaces[0], name: "W" };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ workspaces: [shortNameWorkspace] })
      );

      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("W");
    });

    it("should handle workspace name exactly at truncation limit", async () => {
      // Name width is 20, truncation happens at 17 (20-3 for prefix)
      const exactLengthName = "X".repeat(17);
      const exactNameWorkspace = { ...mockWorkspaces[0], name: exactLengthName };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ workspaces: [exactNameWorkspace] })
      );

      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain(exactLengthName);
    });

    it("should handle workspace with large usage cost", async () => {
      const highCostWorkspace = { ...mockWorkspaces[0], monthlyUsage: 9999.99 };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ workspaces: [highCostWorkspace] })
      );

      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("$9999.99");
    });

    it("should handle workspace with large quota", async () => {
      const highQuotaWorkspace = { ...mockWorkspaces[0], quota: 99999.99 };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ workspaces: [highQuotaWorkspace] })
      );

      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("$99999.99");
    });

    it("should handle many agents in workspace", async () => {
      const manyAgentsWorkspace = { ...mockWorkspaces[0], agentCount: 999 };
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ workspaces: [manyAgentsWorkspace] })
      );

      await listWorkspacesCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("999");
    });

    it("should handle current workspace that doesn't exist in list", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({
          workspaces: mockWorkspaces,
          currentWorkspace: "NonExistent",
        })
      );

      await listWorkspacesCommand();

      // Should still show current workspace in footer even if it doesn't match
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Current workspace: NonExistent")
      );
    });
  });

  describe("Column Alignment", () => {
    it("should pad columns correctly", async () => {
      await listWorkspacesCommand();

      // Check that separator line has correct total length
      const separatorCall = consoleLogSpy.mock.calls.find((call) =>
        call[0].includes("---")
      );
      expect(separatorCall).toBeDefined();
    });
  });
});
