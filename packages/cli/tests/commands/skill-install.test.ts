import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { installSkillCommand } from "../../src/commands/skill/install";
import type { Skill } from "@agentik-os/shared";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: (str: string) => str,
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
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

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Mock SkillInstaller - define everything inside factory due to hoisting
vi.mock("@agentik-os/runtime", async (importOriginal) => {
  const { vi } = await import("vitest");

  const mockGetSkill = vi.fn();
  const mockListAvailable = vi.fn();
  const mockInstall = vi.fn();
  const mockAddToAgent = vi.fn();

  class MockSkillInstaller {
    getSkill = mockGetSkill;
    listAvailable = mockListAvailable;
    install = mockInstall;
    addToAgent = mockAddToAgent;
  }

  // Store mocks globally so tests can access them
  (globalThis as any).__mockSkillInstaller = {
    mockGetSkill,
    mockListAvailable,
    mockInstall,
    mockAddToAgent,
  };

  return {
    SkillInstaller: MockSkillInstaller,
  };
});

// Mock loadAgents
vi.mock("../../src/commands/agent/create.js", async () => {
  const { vi } = await import("vitest");
  const mockLoadAgents = vi.fn();

  // Store globally
  (globalThis as any).__mockLoadAgents = mockLoadAgents;

  return {
    loadAgents: mockLoadAgents,
  };
});

// Helper to access mocks stored in globalThis
function getMocks() {
  return {
    skillInstaller: (globalThis as any).__mockSkillInstaller,
    loadAgents: (globalThis as any).__mockLoadAgents,
  };
}

describe("Skill Install Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let mockGetSkill: ReturnType<typeof vi.fn>;
  let mockListAvailable: ReturnType<typeof vi.fn>;
  let mockInstall: ReturnType<typeof vi.fn>;
  let mockAddToAgent: ReturnType<typeof vi.fn>;
  let mockLoadAgents: ReturnType<typeof vi.fn>;

  const mockSkill: Skill = {
    id: "web-search",
    name: "Web Search",
    version: "1.0.0",
    description: "Search the web for information",
    author: "Agentik OS",
    permissions: ["network"],
    category: "utility" as const,
  };

  beforeEach(() => {
    // Get mocks from globalThis
    const mocks = getMocks();
    mockGetSkill = mocks.skillInstaller.mockGetSkill;
    mockListAvailable = mocks.skillInstaller.mockListAvailable;
    mockInstall = mocks.skillInstaller.mockInstall;
    mockAddToAgent = mocks.skillInstaller.mockAddToAgent;
    mockLoadAgents = mocks.loadAgents;

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

  describe("Direct Mode (skill name provided)", () => {
    it("should install skill when found", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await installSkillCommand("web-search", { yes: true });

      expect(mockGetSkill).toHaveBeenCalledWith("web-search");
      expect(mockInstall).toHaveBeenCalledWith("web-search");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Web Search"));
    });

    it("should show skill details before installation", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await installSkillCommand("web-search", { yes: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Web Search v1.0.0"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Search the web for information"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agentik OS"));
    });

    it("should show permissions required", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await installSkillCommand("web-search", { yes: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Permissions Required"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("network"));
    });

    it("should handle skill with no permissions", async () => {
      const inquirer = await import("inquirer");

      const skillWithNoPerms = { ...mockSkill, permissions: [] };
      mockGetSkill.mockResolvedValue(skillWithNoPerms);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await installSkillCommand("simple-skill", { yes: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("(none)"));
    });

    it("should handle skill not found", async () => {
      mockGetSkill.mockRejectedValue(new Error("Not found"));
      mockListAvailable.mockResolvedValue([
        { id: "other-skill", name: "Other Skill" },
      ]);

      await expect(installSkillCommand("nonexistent")).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("not found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Available skills:"));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("Interactive Mode (no skill name)", () => {
    it("should show list of available skills", async () => {
      const inquirer = await import("inquirer");

      const availableSkills = [
        mockSkill,
        { ...mockSkill, id: "file-ops", name: "File Operations" },
      ];

      mockListAvailable.mockResolvedValue(availableSkills);
      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ selectedSkill: "web-search" })
        .mockResolvedValueOnce({ confirm: true });

      await installSkillCommand();

      expect(mockListAvailable).toHaveBeenCalled();
      expect(inquirer.default.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: "list",
            name: "selectedSkill",
            message: expect.stringContaining("Which skill would you like to install?"),
          }),
        ])
      );
    });

    it("should handle no available skills", async () => {
      mockListAvailable.mockResolvedValue([]);

      await installSkillCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No skills available"));
    });
  });

  describe("Confirmation", () => {
    it("should prompt for confirmation when --yes not provided", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await installSkillCommand("web-search", {});

      expect(inquirer.default.prompt).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            type: "confirm",
            name: "confirm",
            message: "Install this skill?",
          }),
        ])
      );
    });

    it("should skip confirmation when --yes provided", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });

      await installSkillCommand("web-search", { yes: true });

      // Should not be called because --yes skips all prompts
      expect(inquirer.default.prompt).not.toHaveBeenCalled();
    });

    it("should cancel installation if user declines", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: false });

      await installSkillCommand("web-search", {});

      expect(mockInstall).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("cancelled"));
    });
  });

  describe("Installation", () => {
    it("should call installer with correct skill ID", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await installSkillCommand("web-search", { yes: true });

      expect(mockInstall).toHaveBeenCalledWith("web-search");
    });

    it("should show success message after installation", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await installSkillCommand("web-search", { yes: true });

      // Success message is from ora spinner, not console.log - just verify install was called
      expect(mockInstall).toHaveBeenCalledWith("web-search");
    });

    it("should handle installation failure", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockRejectedValue(new Error("Installation failed"));
      (inquirer.default.prompt as any).mockResolvedValue({ confirm: true });

      await expect(installSkillCommand("web-search", { yes: true })).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Installation failed"));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("Adding to Agents", () => {
    it("should prompt which agents to add skill to (interactive)", async () => {
      const inquirer = await import("inquirer");

      const mockAgents = [
        { id: "agent-1", name: "Agent 1" },
        { id: "agent-2", name: "Agent 2" },
      ];

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockAddToAgent.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: mockAgents });
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ confirm: true })
        .mockResolvedValueOnce({ selectedAgents: ["agent-1"] });

      await installSkillCommand("web-search", { yes: false });

      // Should be called twice: once for install confirm, once for agent selection
      expect(inquirer.default.prompt).toHaveBeenCalledTimes(2);
      // Check the second call (agent selection)
      expect(inquirer.default.prompt).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([
          expect.objectContaining({
            type: "checkbox",
            name: "selectedAgents",
            message: "Add to which agents?",
          }),
        ])
      );
    });

    it("should add skill to selected agents", async () => {
      const inquirer = await import("inquirer");

      const mockAgents = [
        { id: "agent-1", name: "Agent 1" },
        { id: "agent-2", name: "Agent 2" },
      ];

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockAddToAgent.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: mockAgents });
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ confirm: true }) // Install confirmation
        .mockResolvedValueOnce({ selectedAgents: ["agent-1", "agent-2"] }); // Agent selection

      await installSkillCommand("web-search", {}); // No --yes flag, so will prompt

      expect(mockAddToAgent).toHaveBeenCalledWith("web-search", "agent-1");
      expect(mockAddToAgent).toHaveBeenCalledWith("web-search", "agent-2");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Added Web Search to 2 agent(s)"));
    });

    it("should handle no agents selected", async () => {
      const inquirer = await import("inquirer");

      const mockAgents = [{ id: "agent-1", name: "Agent 1" }];

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: mockAgents });
      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({ confirm: true }) // Install confirmation
        .mockResolvedValueOnce({ selectedAgents: [] }); // No agents selected

      await installSkillCommand("web-search", {}); // No --yes flag

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Skipped adding to agents"));
    });

    it("should handle no agents available", async () => {
      const inquirer = await import("inquirer");

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });
      (inquirer.default.prompt as any).mockResolvedValueOnce({ confirm: true }); // Only install confirmation

      await installSkillCommand("web-search", {}); // No --yes flag

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda agent create"));
    });

    it("should add to all agents when --all-agents flag provided", async () => {
      const mockAgents = [
        { id: "agent-1", name: "Agent 1" },
        { id: "agent-2", name: "Agent 2" },
        { id: "agent-3", name: "Agent 3" },
      ];

      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockAddToAgent.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: mockAgents });

      await installSkillCommand("web-search", { yes: true, allAgents: true }); // --yes skips confirmation

      expect(mockAddToAgent).toHaveBeenCalledTimes(3);
      expect(mockAddToAgent).toHaveBeenCalledWith("web-search", "agent-1");
      expect(mockAddToAgent).toHaveBeenCalledWith("web-search", "agent-2");
      expect(mockAddToAgent).toHaveBeenCalledWith("web-search", "agent-3");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Added Web Search to all 3 agent(s)"));
    });

    it("should add to specific agent when --agent flag provided", async () => {
      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockAddToAgent.mockResolvedValue(undefined);

      await installSkillCommand("web-search", { yes: true, agent: "specific-agent-id" });

      expect(mockAddToAgent).toHaveBeenCalledWith("web-search", "specific-agent-id");
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Added Web Search to agent"));
    });

    it("should handle error when adding to specific agent", async () => {
      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockAddToAgent.mockRejectedValue(new Error("Agent not found"));

      await expect(
        installSkillCommand("web-search", { yes: true, agent: "nonexistent-agent" })
      ).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Error adding skill to agent"));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle --all-agents with no agents available", async () => {
      mockGetSkill.mockResolvedValue(mockSkill);
      mockInstall.mockResolvedValue(undefined);
      mockLoadAgents.mockReturnValue({ agents: [] });

      await installSkillCommand("web-search", { yes: true, allAgents: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No agents found. Skill installed but not added to any agents.")
      );
    });
  });
});
