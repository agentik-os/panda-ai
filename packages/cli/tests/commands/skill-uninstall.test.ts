import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { uninstallSkillCommand } from "../../src/commands/skill/uninstall";
import type { InstalledSkill } from "@agentik-os/shared";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    red: (str: string) => str,
    yellow: (str: string) => str,
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

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Mock SkillInstaller - define everything inside factory due to hoisting
vi.mock("@agentik-os/runtime", async (importOriginal) => {
  const { vi } = await import("vitest");

  const mockGetSkill = vi.fn();
  const mockListInstalled = vi.fn();
  const mockGetAgentsUsingSkill = vi.fn();
  const mockRemoveFromAgent = vi.fn();
  const mockUninstall = vi.fn();

  class MockSkillInstaller {
    getSkill = mockGetSkill;
    listInstalled = mockListInstalled;
    getAgentsUsingSkill = mockGetAgentsUsingSkill;
    removeFromAgent = mockRemoveFromAgent;
    uninstall = mockUninstall;
  }

  // Store mocks globally so tests can access them
  (globalThis as any).__mockSkillInstaller = {
    mockGetSkill,
    mockListInstalled,
    mockGetAgentsUsingSkill,
    mockRemoveFromAgent,
    mockUninstall,
  };

  return {
    SkillInstaller: MockSkillInstaller,
  };
});

// Helper to access mocks stored in globalThis
function getMocks() {
  return (globalThis as any).__mockSkillInstaller;
}

describe("Skill Uninstall Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let mockGetSkill: ReturnType<typeof vi.fn>;
  let mockListInstalled: ReturnType<typeof vi.fn>;
  let mockGetAgentsUsingSkill: ReturnType<typeof vi.fn>;
  let mockRemoveFromAgent: ReturnType<typeof vi.fn>;
  let mockUninstall: ReturnType<typeof vi.fn>;

  const mockSkill: InstalledSkill = {
    id: "web-search",
    name: "Web Search",
    version: "1.0.0",
    description: "Search the web for information",
    author: "Agentik OS",
    permissions: ["network"],
    category: "utility" as const,
    installedAt: new Date("2024-01-15"),
  };

  const mockInstalledSkills: InstalledSkill[] = [
    mockSkill,
    {
      id: "file-ops",
      name: "File Operations",
      version: "2.0.0",
      description: "File system operations",
      author: "Agentik Team",
      permissions: ["filesystem"],
      category: "utility" as const,
      installedAt: new Date("2024-01-20"),
    },
  ];

  beforeEach(() => {
    // Get mocks from globalThis
    const mocks = getMocks();
    mockGetSkill = mocks.mockGetSkill;
    mockListInstalled = mocks.mockListInstalled;
    mockGetAgentsUsingSkill = mocks.mockGetAgentsUsingSkill;
    mockRemoveFromAgent = mocks.mockRemoveFromAgent;
    mockUninstall = mocks.mockUninstall;

    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    // Reset all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
  });

  describe("Successful Uninstallation", () => {
    it("should uninstall skill not in use", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(mockGetSkill).toHaveBeenCalledWith("web-search");
      expect(mockListInstalled).toHaveBeenCalled();
      expect(mockGetAgentsUsingSkill).toHaveBeenCalledWith("web-search");
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("reinstall"));
    });

    it("should uninstall skill in use by agents", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1", "agent-2"]);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(mockRemoveFromAgent).toHaveBeenCalledTimes(2);
      expect(mockRemoveFromAgent).toHaveBeenCalledWith("web-search", "agent-1");
      expect(mockRemoveFromAgent).toHaveBeenCalledWith("web-search", "agent-2");
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });

    it("should show success message after uninstallation", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      // Spinner shows success (not console.log)
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });

    it("should show reinstall instructions", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("You can reinstall it anytime with:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda skill install web-search")
      );
    });
  });

  describe("Force Flag", () => {
    it("should skip confirmation when --force provided", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);

      await uninstallSkillCommand("web-search", { force: true });

      expect(inquirer.default.prompt).not.toHaveBeenCalled();
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });

    it("should skip confirmation even when skill is in use", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1", "agent-2"]);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);

      await uninstallSkillCommand("web-search", { force: true });

      expect(inquirer.default.prompt).not.toHaveBeenCalled();
      expect(mockRemoveFromAgent).toHaveBeenCalledTimes(2);
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });
  });

  describe("Confirmation", () => {
    it("should prompt for confirmation when skill not in use", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(inquirer.default.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: "confirm",
            name: "confirm",
            message: "Uninstall Web Search?",
            default: false,
          }),
        ])
      );
    });

    it("should prompt with warning message when skill in use", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1"]);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(inquirer.default.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: "confirm",
            name: "confirm",
            message: "Remove Web Search from all agents and uninstall?",
          }),
        ])
      );
    });

    it("should cancel uninstallation if user declines", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: false });

      await uninstallSkillCommand("web-search", {});

      expect(mockUninstall).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Uninstallation cancelled")
      );
    });
  });

  describe("Warning for Skills in Use", () => {
    it("should show warning when skill is used by agents", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1", "agent-2"]);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("⚠️  Warning: This skill is used by 2 agent(s):")
      );
    });

    it("should list all agents using the skill", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1", "agent-2", "agent-3"]);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agent-1"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agent-2"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("agent-3"));
    });

    it("should show removal message", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1"]);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Uninstalling will remove it from all agents.")
      );
    });

    it("should not show warning when skill is not in use", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("⚠️  Warning:");
    });
  });

  describe("Agent Removal", () => {
    it("should remove skill from all agents before uninstalling", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1", "agent-2", "agent-3"]);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(mockRemoveFromAgent).toHaveBeenCalledTimes(3);
      expect(mockRemoveFromAgent).toHaveBeenCalledWith("web-search", "agent-1");
      expect(mockRemoveFromAgent).toHaveBeenCalledWith("web-search", "agent-2");
      expect(mockRemoveFromAgent).toHaveBeenCalledWith("web-search", "agent-3");

      // Verify removal happened before uninstall
      const removeFromAgentCalls = (mockRemoveFromAgent as any).mock.invocationCallOrder;
      const uninstallCall = (mockUninstall as any).mock.invocationCallOrder[0];
      removeFromAgentCalls.forEach((order: number) => {
        expect(order).toBeLessThan(uninstallCall);
      });
    });

    it("should not attempt removal when no agents use skill", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(mockRemoveFromAgent).not.toHaveBeenCalled();
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });
  });

  describe("Skill Not Installed Error", () => {
    it("should show error when skill is not installed", async () => {
      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills.filter((s) => s.id !== "web-search"));

      await expect(uninstallSkillCommand("nonexistent", {})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error: Skill 'nonexistent' is not installed")
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should list installed skills when skill not found", async () => {
      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);

      await expect(uninstallSkillCommand("nonexistent", {})).rejects.toThrow("process.exit called");

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Installed skills:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("web-search"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("file-ops"));
    });
  });

  describe("Error Handling", () => {
    it("should handle getSkill errors", async () => {
      mockGetSkill.mockRejectedValue(new Error("Skill registry error"));

      await expect(uninstallSkillCommand("web-search", {})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error uninstalling skill:",
        "Skill registry error"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle listInstalled errors", async () => {
      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockRejectedValue(new Error("Cannot list skills"));

      await expect(uninstallSkillCommand("web-search", {})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error uninstalling skill:",
        "Cannot list skills"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle getAgentsUsingSkill errors", async () => {
      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockRejectedValue(new Error("Agent query failed"));

      await expect(uninstallSkillCommand("web-search", {})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error uninstalling skill:",
        "Agent query failed"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle removeFromAgent errors", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1"]);
      mockRemoveFromAgent.mockRejectedValue(new Error("Removal failed"));
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await expect(uninstallSkillCommand("web-search", {})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error uninstalling skill:", "Removal failed");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle uninstall errors", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockRejectedValue(new Error("Uninstall failed"));
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await expect(uninstallSkillCommand("web-search", {})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error uninstalling skill:", "Uninstall failed");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle undefined options", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", undefined as any);

      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });

    it("should handle empty options object", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(inquirer.default.prompt).toHaveBeenCalled();
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });

    it("should handle very long agent lists", async () => {
      const inquirer = await import("inquirer");

      const manyAgents = Array.from({ length: 100 }, (_, i) => `agent-${i}`);
      mockGetSkill.mockResolvedValue(mockSkill);
      mockListInstalled.mockResolvedValue(mockInstalledSkills);
      mockGetAgentsUsingSkill.mockResolvedValue(manyAgents);
      mockRemoveFromAgent.mockResolvedValue(undefined);
      mockUninstall.mockResolvedValue(undefined);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await uninstallSkillCommand("web-search", {});

      expect(mockRemoveFromAgent).toHaveBeenCalledTimes(100);
      expect(mockUninstall).toHaveBeenCalledWith("web-search");
    });
  });
});
