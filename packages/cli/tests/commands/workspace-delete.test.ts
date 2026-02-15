import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { deleteWorkspaceCommand } from "../../src/commands/workspace/delete";
import { readFileSync, writeFileSync, existsSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    red: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    green: (str: string) => str,
    yellow: (str: string) => str,
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

describe("Workspace Delete Command", () => {
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

    // Default mocks - workspaces file exists
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
      await expect(deleteWorkspaceCommand()).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace name required")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace delete <name>")
      );
    });

    it("should error when name is empty string", async () => {
      await expect(deleteWorkspaceCommand("")).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace name required")
      );
    });
  });

  describe("Workspace Not Found", () => {
    it("should error when workspace doesn't exist", async () => {
      await deleteWorkspaceCommand("NonExistent");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace not found: NonExistent")
      );
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Cannot Delete Active Workspace", () => {
    it("should prevent deleting active workspace", async () => {
      await deleteWorkspaceCommand("Production");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cannot delete active workspace")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace switch <name>")
      );
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Cannot Delete Default Workspace", () => {
    it("should prevent deleting default workspace", async () => {
      // Make Production not active so we can test the default check
      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return JSON.stringify({ workspaces: mockWorkspaces });
        }
        if (path.includes("active-workspace.json")) {
          return JSON.stringify({ activeWorkspace: "ws-2" }); // Development is active
        }
        return "{}";
      });

      await deleteWorkspaceCommand("Production");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Cannot delete default workspace")
      );
      expect(writeFileSync).not.toHaveBeenCalled();
    });
  });

  describe("Cannot Delete Workspace with Agents", () => {
    it("should prevent deleting workspace with agents without --force", async () => {
      await deleteWorkspaceCommand("Development");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Workspace "Development" contains 2 agents')
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Use --force to delete anyway")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace delete Development --force")
      );
      expect(writeFileSync).not.toHaveBeenCalled();
    });

    it("should show singular 'agent' for one agent", async () => {
      const workspacesWithOneAgent = [
        ...mockWorkspaces,
        {
          id: "ws-4",
          name: "OneAgent",
          description: "Workspace with one agent",
          agentCount: 1,
          createdAt: new Date(),
          isDefault: false,
        },
      ];

      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return JSON.stringify({ workspaces: workspacesWithOneAgent });
        }
        if (path.includes("active-workspace.json")) {
          return JSON.stringify({ activeWorkspace: "ws-1" });
        }
        return "{}";
      });

      await deleteWorkspaceCommand("OneAgent");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining('Workspace "OneAgent" contains 1 agent')
      );
    });
  });

  describe("Successful Deletion", () => {
    it("should delete empty workspace successfully", async () => {
      await deleteWorkspaceCommand("Testing");

      expect(writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace deleted: Testing")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda workspace list")
      );
    });

    it("should show deletion warnings before deleting", async () => {
      await deleteWorkspaceCommand("Testing");

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Delete Workspace"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("This will permanently delete workspace: Testing")
      );
    });

    it("should not mention agents when deleting empty workspace", async () => {
      await deleteWorkspaceCommand("Testing");

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Should not mention deleting 0 agents
      expect(allLogs).not.toContain("Deleted 0 agents");
    });

    it("should save updated workspaces list", async () => {
      await deleteWorkspaceCommand("Testing");

      expect(writeFileSync).toHaveBeenCalledWith(
        expect.stringContaining("workspaces.json"),
        expect.stringContaining('"workspaces"')
      );

      // Verify the saved data doesn't include the deleted workspace
      const savedData = (writeFileSync as any).mock.calls[0][1];
      const parsed = JSON.parse(savedData);
      expect(parsed.workspaces.find((w: any) => w.name === "Testing")).toBeUndefined();
      expect(parsed.workspaces.length).toBe(2); // Down from 3
    });

    it("should complete spinner with success message", async () => {
      await deleteWorkspaceCommand("Testing");

      expect(lastSpinnerInstance.succeed).toHaveBeenCalledWith("Workspace deleted");
    });
  });

  describe("Force Deletion", () => {
    it("should delete workspace with agents when --force is used", async () => {
      await deleteWorkspaceCommand("Development", { force: true });

      expect(writeFileSync).toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace deleted: Development")
      );
    });

    it("should show agent count when force deleting workspace with agents", async () => {
      await deleteWorkspaceCommand("Development", { force: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("This will also delete 2 agents")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Deleted 2 agents"));
    });

    it("should show singular 'agent' when force deleting one agent", async () => {
      const workspacesWithOneAgent = [
        ...mockWorkspaces,
        {
          id: "ws-4",
          name: "OneAgent",
          description: "Workspace with one agent",
          agentCount: 1,
          createdAt: new Date(),
          isDefault: false,
        },
      ];

      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return JSON.stringify({ workspaces: workspacesWithOneAgent });
        }
        if (path.includes("active-workspace.json")) {
          return JSON.stringify({ activeWorkspace: "ws-1" });
        }
        return "{}";
      });

      await deleteWorkspaceCommand("OneAgent", { force: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("This will also delete 1 agent")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Deleted 1 agent"));
    });
  });

  describe("Edge Cases", () => {
    it("should handle corrupted workspaces file", async () => {
      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return "invalid json {{{";
        }
        return "{}";
      });

      await deleteWorkspaceCommand("Testing");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading workspaces"),
        expect.any(String)
      );
      // Empty workspaces array means workspace not found
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace not found: Testing")
      );
    });

    it("should handle missing workspaces file", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        return !path.includes("workspaces.json");
      });

      await deleteWorkspaceCommand("Testing");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace not found: Testing")
      );
    });

    it("should handle missing active workspace file", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        return !path.includes("active-workspace.json");
      });

      // Should allow deleting any workspace if no active workspace is set
      await deleteWorkspaceCommand("Testing");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace deleted: Testing")
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

      // Should allow deleting if active workspace can't be loaded
      await deleteWorkspaceCommand("Testing");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace deleted: Testing")
      );
    });

    it("should handle very long workspace name", async () => {
      const longWorkspace = {
        ...mockWorkspaces[2],
        name: "VeryLongWorkspaceNameThatMightCauseDisplayIssues",
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

      await deleteWorkspaceCommand("VeryLongWorkspaceNameThatMightCauseDisplayIssues");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Workspace deleted: VeryLongWorkspaceNameThatMightCauseDisplayIssues")
      );
    });

    it("should handle workspace with many agents", async () => {
      const manyAgentsWorkspace = {
        ...mockWorkspaces[2],
        name: "ManyAgents",
        agentCount: 999,
      };
      const workspacesWithMany = [...mockWorkspaces.slice(0, 2), manyAgentsWorkspace];

      (readFileSync as any).mockImplementation((path: string) => {
        if (path.includes("workspaces.json")) {
          return JSON.stringify({ workspaces: workspacesWithMany });
        }
        if (path.includes("active-workspace.json")) {
          return JSON.stringify({ activeWorkspace: "ws-1" });
        }
        return "{}";
      });

      await deleteWorkspaceCommand("ManyAgents", { force: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("This will also delete 999 agents")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Deleted 999 agents"));
    });
  });
});
