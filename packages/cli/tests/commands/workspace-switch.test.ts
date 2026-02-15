import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { switchWorkspaceCommand } from "../../src/commands/workspace/switch";
import { readFileSync, writeFileSync, existsSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    red: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
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

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe("Workspace Switch Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  const mockWorkspaces = [
    {
      id: "ws-1",
      name: "Production",
      description: "Production workspace",
      agentCount: 5,
      createdAt: new Date("2024-01-15T00:00:00.000Z"),
      isDefault: true,
    },
    {
      id: "ws-2",
      name: "Development",
      description: "Development workspace",
      agentCount: 2,
      createdAt: new Date("2024-01-16T00:00:00.000Z"),
      isDefault: false,
    },
    {
      id: "ws-3",
      name: "Testing",
      description: "Testing workspace",
      agentCount: 0,
      createdAt: new Date("2024-01-17T00:00:00.000Z"),
      isDefault: false,
    },
  ];

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    process.env.HOME = "/tmp/test-home";

    // Default mocks - workspaces file exists, Production is active
    (existsSync as any).mockReturnValue(true);
    (readFileSync as any).mockImplementation((path: string) => {
      if (path.includes("workspaces.json")) {
        return JSON.stringify({ workspaces: mockWorkspaces });
      }
      if (path.includes("active-workspace.json")) {
        return JSON.stringify({ activeWorkspace: "ws-1" }); // Production is active
      }
      return "{}";
    });
    (writeFileSync as any).mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    delete process.env.HOME;
  });

  describe("Validation", () => {
    it("should error when no name provided", async () => {
      await expect(switchWorkspaceCommand()).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace name required")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace switch <name>")
      );
    });

    it("should show usage help when no name", async () => {
      await expect(switchWorkspaceCommand()).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("List available workspaces with:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace list")
      );
    });
  });

  describe("Workspace Not Found", () => {
    it("should error when workspace doesn't exist", async () => {
      await switchWorkspaceCommand("NonExistent");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace not found: NonExistent")
      );
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Already Active Workspace", () => {
    it("should warn when switching to already active workspace", async () => {
      await switchWorkspaceCommand("Production");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Already in workspace:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Production")
      );
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Successful Switch", () => {
    it("should switch to different workspace", async () => {
      await switchWorkspaceCommand("Development");

      expect(writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Switched to workspace: Development")
      );
    });

    it("should show switch header", async () => {
      await switchWorkspaceCommand("Development");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Switching Workspace")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Target: Development")
      );
    });

    it("should save new active workspace ID", async () => {
      await switchWorkspaceCommand("Development");

      const savedData = (writeFileSync as any).mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed.activeWorkspace).toBe("ws-2");
    });

    it("should complete spinner with success", async () => {
      await switchWorkspaceCommand("Development");

      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Workspace switched");
    });

    it("should show help text after switch", async () => {
      await switchWorkspaceCommand("Development");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("All subsequent commands will use this workspace context")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda agent list")
      );
    });
  });

  describe("Spinner Progress", () => {
    it("should update spinner text during switch", async () => {
      await switchWorkspaceCommand("Development");

      // Initial spinner message is passed to ora()
      expect(lastSpinnerInstance.start).toHaveBeenCalled();

      // Spinner text is updated during process
      expect(lastSpinnerInstance.text).toBeDefined();
    });
  });

  describe("Edge Cases", () => {
    it("should handle missing workspaces file", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        return !path.includes("workspaces.json");
      });

      await switchWorkspaceCommand("Development");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace not found: Development")
      );
    });

    it("should handle corrupted workspaces file", async () => {
      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return "invalid json {{{";
        }
        if (path.includes("active-workspace.json")) {
          return JSON.stringify({ activeWorkspace: "ws-1" });
        }
        return "{}";
      });

      await switchWorkspaceCommand("Development");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading workspaces"),
        expect.any(String)
      );
      // Empty workspaces array means workspace not found
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace not found: Development")
      );
    });

    it("should handle missing active workspace file", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        return !path.includes("active-workspace.json");
      });

      // Should allow switch when no active workspace is set
      await switchWorkspaceCommand("Development");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Switched to workspace: Development")
      );
    });

    it("should handle corrupted active workspace file", async () => {
      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return JSON.stringify({ workspaces: mockWorkspaces });
        }
        if (path.includes("active-workspace.json")) {
          return "invalid json";
        }
        return "{}";
      });

      // Should allow switch when active workspace can't be loaded
      await switchWorkspaceCommand("Development");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Switched to workspace: Development")
      );
    });

    it("should handle very long workspace name", async () => {
      const longWorkspace = {
        ...mockWorkspaces[2],
        name: "VeryLongWorkspaceNameThatExceedsNormalLimits",
      };
      const workspacesWithLong = [...mockWorkspaces.slice(0, 2), longWorkspace];

      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return JSON.stringify({ workspaces: workspacesWithLong });
        }
        if (path.includes("active-workspace.json")) {
          return JSON.stringify({ activeWorkspace: "ws-1" });
        }
        return "{}";
      });

      await switchWorkspaceCommand("VeryLongWorkspaceNameThatExceedsNormalLimits");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Switched to workspace: VeryLongWorkspaceNameThatExceedsNormalLimits")
      );
    });

    it("should handle workspace with special characters", async () => {
      const specialWorkspace = {
        ...mockWorkspaces[2],
        name: "Test-Workspace_123",
      };
      const workspacesWithSpecial = [...mockWorkspaces.slice(0, 2), specialWorkspace];

      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return JSON.stringify({ workspaces: workspacesWithSpecial });
        }
        if (path.includes("active-workspace.json")) {
          return JSON.stringify({ activeWorkspace: "ws-1" });
        }
        return "{}";
      });

      await switchWorkspaceCommand("Test-Workspace_123");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Switched to workspace: Test-Workspace_123")
      );
    });

    it("should handle readFileSync throwing error", async () => {
      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          throw new Error("Permission denied");
        }
        return "{}";
      });

      await switchWorkspaceCommand("Development");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading workspaces"),
        "Permission denied"
      );
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace not found: Development")
      );
    });
  });
});
