import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listSkillsCommand } from "../../src/commands/skill/list";
import type { InstalledSkill } from "@agentik-os/shared";

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

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: "",
  })),
}));

// Mock SkillInstaller - must define everything inside factory due to hoisting
vi.mock("@agentik-os/runtime", async (importOriginal) => {
  const { vi } = await import("vitest");

  const mockListInstalled = vi.fn();
  const mockGetAgentsUsingSkill = vi.fn();

  class MockSkillInstaller {
    listInstalled = mockListInstalled;
    getAgentsUsingSkill = mockGetAgentsUsingSkill;
  }

  // Store mocks globally so tests can access them
  (globalThis as any).__mockSkillInstaller = {
    mockListInstalled,
    mockGetAgentsUsingSkill,
  };

  return {
    SkillInstaller: MockSkillInstaller,
  };
});

// Helper to access mocks stored in globalThis
function getMocks() {
  return (globalThis as any).__mockSkillInstaller;
}

describe("Skill List Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let mockListInstalled: ReturnType<typeof vi.fn>;
  let mockGetAgentsUsingSkill: ReturnType<typeof vi.fn>;

  const mockSkills: InstalledSkill[] = [
    {
      id: "web-search",
      name: "Web Search",
      version: "1.0.0",
      description: "Search the web for information",
      author: "Agentik OS",
      permissions: ["network", "storage"],
      category: "utility" as const,
      installedAt: new Date("2024-01-15"),
    },
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
    {
      id: "code-gen",
      name: "Code Generator",
      version: "1.5.0",
      description: "Generate code from templates",
      author: "Developer Tools",
      permissions: ["filesystem", "network", "execution"],
      category: "development" as const,
      installedAt: new Date("2024-02-01"),
    },
  ];

  beforeEach(() => {
    // Get mocks from globalThis
    const mocks = getMocks();
    mockListInstalled = mocks.mockListInstalled;
    mockGetAgentsUsingSkill = mocks.mockGetAgentsUsingSkill;

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

  describe("Summary View (Default)", () => {
    it("should list installed skills in summary format", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill
        .mockResolvedValueOnce(["agent-1", "agent-2"]) // web-search used by 2 agents
        .mockResolvedValueOnce(["agent-3"]) // file-ops used by 1 agent
        .mockResolvedValueOnce([]); // code-gen unused

      await listSkillsCommand({});

      expect(mockListInstalled).toHaveBeenCalled();
      expect(mockGetAgentsUsingSkill).toHaveBeenCalledTimes(3);
      expect(mockGetAgentsUsingSkill).toHaveBeenCalledWith("web-search");
      expect(mockGetAgentsUsingSkill).toHaveBeenCalledWith("file-ops");
      expect(mockGetAgentsUsingSkill).toHaveBeenCalledWith("code-gen");

      // Verify skill names shown
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Web Search"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("File Operations"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Code Generator"));
    });

    it("should show permissions summary (first 2 + count)", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({});

      // web-search has 2 permissions: should show both
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Permissions: network, storage")
      );

      // code-gen has 3 permissions: should show "filesystem, network +1 more"
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Permissions: filesystem, network +1 more")
      );
    });

    it("should show agent usage counts with color coding", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill
        .mockResolvedValueOnce(["agent-1", "agent-2"])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce(["agent-3"]);

      await listSkillsCommand({});

      // Used skills should show "Used by: X agent(s)"
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Used by: 2 agent(s)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Used by: 1 agent(s)"));

      // Unused skills should show "Used by: 0 agent(s)"
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Used by: 0 agent(s)"));
    });

    it("should show total count in header", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({});

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Installed Skills (3):"));
    });
  });

  describe("Detailed View (--detailed flag)", () => {
    it("should show full skill details", async () => {
      mockListInstalled.mockResolvedValue([mockSkills[0]]);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1"]);

      await listSkillsCommand({ detailed: true });

      // Verify detailed information is shown
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Web Search") && expect.stringContaining("(v1.0.0)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Description: Search the web for information"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Author: Agentik OS"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Type: undefined"));
    });

    it("should list all permissions individually", async () => {
      mockListInstalled.mockResolvedValue([mockSkills[2]]); // code-gen with 3 permissions
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({ detailed: true });

      // All 3 permissions should be listed
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("network"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("filesystem"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("execution"));
    });

    it("should show usage count in detailed view", async () => {
      mockListInstalled.mockResolvedValue([mockSkills[0]]);
      mockGetAgentsUsingSkill.mockResolvedValue(["agent-1", "agent-2"]);

      await listSkillsCommand({ detailed: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Used by: 2 agent(s)"));
    });

    it("should show installed date", async () => {
      mockListInstalled.mockResolvedValue([mockSkills[0]]);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({ detailed: true });

      // Check for date format (locale-dependent, so just check for "Installed" label)
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Installed"));
    });

    it("should handle skills with no agents using them", async () => {
      mockListInstalled.mockResolvedValue([mockSkills[2]]);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({ detailed: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Used by: 0 agent(s)"));
    });
  });

  describe("Unused Filter (--unused flag)", () => {
    it("should show only skills not used by any agent", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill
        .mockResolvedValueOnce(["agent-1"]) // web-search used
        .mockResolvedValueOnce([]) // file-ops unused
        .mockResolvedValueOnce([]); // code-gen unused

      await listSkillsCommand({ unused: true });

      // Should show file-ops and code-gen, but not web-search
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("File Operations"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Code Generator"));

      // Should not show web-search
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Web Search");
    });

    it("should show count of unused skills in header", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill
        .mockResolvedValueOnce(["agent-1"])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await listSkillsCommand({ unused: true });

      // Header shows filtered count
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Installed Skills (2):"));
    });

    it("should show success message if all skills are in use", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill
        .mockResolvedValueOnce(["agent-1"])
        .mockResolvedValueOnce(["agent-2"])
        .mockResolvedValueOnce(["agent-3"]);

      await listSkillsCommand({ unused: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("✅ All installed skills are in use!"));
    });

    it("should work with --detailed flag", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill
        .mockResolvedValueOnce(["agent-1"])
        .mockResolvedValueOnce([])
        .mockResolvedValueOnce([]);

      await listSkillsCommand({ unused: true, detailed: true });

      // Should show detailed view of only unused skills
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("File Operations"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("File system operations"));
    });
  });

  describe("Empty State", () => {
    it("should show helpful message when no skills installed", async () => {
      mockListInstalled.mockResolvedValue([]);

      await listSkillsCommand({});

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No skills installed"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda skill install"));
    });

    it("should not show empty state if skills exist", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({});

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("No skills installed");
    });
  });

  describe("Error Handling", () => {
    it("should handle listInstalled errors", async () => {
      mockListInstalled.mockRejectedValue(new Error("Failed to read skills directory"));

      await expect(listSkillsCommand({})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        "Error listing skills:",
        "Failed to read skills directory"
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should handle getAgentsUsingSkill errors gracefully", async () => {
      mockListInstalled.mockResolvedValue([mockSkills[0]]);
      mockGetAgentsUsingSkill.mockRejectedValue(new Error("Agent query failed"));

      await expect(listSkillsCommand({})).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith("Error listing skills:", "Agent query failed");
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle skills with empty permissions array", async () => {
      const skillWithNoPerms = {
        ...mockSkills[0],
        permissions: [],
      };
      mockListInstalled.mockResolvedValue([skillWithNoPerms]);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({});

      // Should not show permissions line at all when empty
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).not.toContain("Permissions:");
    });

    it("should handle very long skill names", async () => {
      const longNameSkill = {
        ...mockSkills[0],
        name: "A".repeat(100),
      };
      mockListInstalled.mockResolvedValue([longNameSkill]);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({});

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should handle large number of permissions", async () => {
      const manyPermsSkill = {
        ...mockSkills[0],
        permissions: Array.from({ length: 20 }, (_, i) => `permission-${i}`),
      };
      mockListInstalled.mockResolvedValue([manyPermsSkill]);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({});

      // Summary should show "+18 more"
      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("+18 more");
    });

    it("should handle undefined options", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand(undefined as any);

      expect(consoleLogSpy).toHaveBeenCalled();
    });

    it("should handle empty options object", async () => {
      mockListInstalled.mockResolvedValue(mockSkills);
      mockGetAgentsUsingSkill.mockResolvedValue([]);

      await listSkillsCommand({});

      expect(consoleLogSpy).toHaveBeenCalled();
    });
  });
});
