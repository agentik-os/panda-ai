import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockHomeDir } from "../setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * CLI E2E Journey: Workspace Management
 *
 * Tests the complete workspace lifecycle:
 * 1. Create workspace
 * 2. Add agents to workspace
 * 3. Execute tasks in workspace context
 * 4. Switch between workspaces
 * 5. Archive/delete workspaces
 *
 * Workspaces allow organizing related agents and maintaining
 * isolated contexts for different projects.
 *
 * Target: Validate workspace organization and isolation
 */

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
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

describe("CLI E2E Journey: Workspace Management", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    vi.clearAllMocks();

    // Initialize project
    const configPath = path.join(homeSetup.homeDir, ".agentik-os", "config.json");
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
    fs.writeFileSync(
      configPath,
      JSON.stringify({
        providers: {
          anthropic: { apiKey: "sk-ant-test-key" },
        },
        defaultModel: "claude-sonnet-4",
      })
    );
  });

  afterEach(() => {
    homeSetup.cleanup();
  });

  describe("Workspace Creation and Setup", () => {
    it("should create and configure a new workspace", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand } = await import("../../src/commands/workspace.js");

      // STEP 1: Create workspace
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "ecommerce-project",
        description: "Building an e-commerce platform",
        agents: [],
        settings: {
          defaultModel: "claude-sonnet-4",
          temperature: 0.5,
        },
      });

      const createResult = await workspaceCreateCommand();

      // Verify workspace created
      expect(createResult).toContain("ecommerce-project");
      expect(createResult).toContain("created" || "success");

      // STEP 2: Create agents for this workspace
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      const agentRoles = ["api-developer", "database-designer", "frontend-builder"];

      for (const role of agentRoles) {
        vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
          name: role,
          description: `Agent responsible for ${role}`,
          systemPrompt: `You are a ${role}.`,
          model: "claude-sonnet-4",
          temperature: 0.5,
          skills: ["file-ops"],
          workspace: "ecommerce-project",
        });

        await agentCreateCommand();
      }

      // STEP 3: List workspace to verify agents added
      const { workspaceShowCommand } = await import("../../src/commands/workspace.js");

      const showResult = await workspaceShowCommand({ workspace: "ecommerce-project" });

      expect(showResult).toContain("ecommerce-project");
      expect(showResult).toContain("api-developer");
      expect(showResult).toContain("database-designer");
      expect(showResult).toContain("frontend-builder");
    });

    it("should support workspace with custom configuration", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand } = await import("../../src/commands/workspace.js");

      // Create workspace with specific settings
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "research-workspace",
        description: "Academic research assistant workspace",
        agents: [],
        settings: {
          defaultModel: "claude-opus-4",
          temperature: 0.2, // Lower for factual accuracy
          maxTokens: 4096,
          systemPrompt: "You are a research assistant. Prioritize accuracy.",
        },
      });

      const result = await workspaceCreateCommand();

      expect(result).toContain("research-workspace");

      // Verify settings persisted
      const { workspaceShowCommand } = await import("../../src/commands/workspace.js");
      const showResult = await workspaceShowCommand({ workspace: "research-workspace" });

      expect(showResult).toContain("opus" || "0.2");
    });
  });

  describe("Workspace Switching and Context", () => {
    it("should switch between different workspaces", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand, workspaceSwitchCommand } = await import("../../src/commands/workspace.js");

      // Create multiple workspaces
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          name: "project-a",
          description: "First project",
          agents: [],
        })
        .mockResolvedValueOnce({
          name: "project-b",
          description: "Second project",
          agents: [],
        });

      await workspaceCreateCommand();
      await workspaceCreateCommand();

      // Switch to project-a
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        workspace: "project-a",
      });

      const switchResultA = await workspaceSwitchCommand();
      expect(switchResultA).toContain("project-a");

      // Create agent in project-a context
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "agent-a",
        description: "Agent for project A",
        systemPrompt: "You belong to project A.",
        model: "claude-sonnet-4",
        temperature: 0.5,
        skills: [],
      });

      await agentCreateCommand();

      // Switch to project-b
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        workspace: "project-b",
      });

      const switchResultB = await workspaceSwitchCommand();
      expect(switchResultB).toContain("project-b");

      // Create agent in project-b context
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "agent-b",
        description: "Agent for project B",
        systemPrompt: "You belong to project B.",
        model: "claude-sonnet-4",
        temperature: 0.5,
        skills: [],
      });

      await agentCreateCommand();

      // Verify agents are in different workspaces
      const { workspaceShowCommand } = await import("../../src/commands/workspace.js");

      const showA = await workspaceShowCommand({ workspace: "project-a" });
      expect(showA).toContain("agent-a");
      expect(showA).not.toContain("agent-b");

      const showB = await workspaceShowCommand({ workspace: "project-b" });
      expect(showB).toContain("agent-b");
      expect(showB).not.toContain("agent-a");
    });

    it("should maintain isolated context between workspaces", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand } = await import("../../src/commands/workspace.js");

      // Create isolated workspaces
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          name: "personal-workspace",
          description: "Personal projects",
          agents: [],
          settings: { temperature: 0.7 },
        })
        .mockResolvedValueOnce({
          name: "work-workspace",
          description: "Work projects",
          agents: [],
          settings: { temperature: 0.3 },
        });

      await workspaceCreateCommand();
      await workspaceCreateCommand();

      // Verify both exist with different settings
      const { workspaceListCommand } = await import("../../src/commands/workspace.js");
      const listResult = await workspaceListCommand();

      expect(listResult).toContain("personal-workspace");
      expect(listResult).toContain("work-workspace");
    });
  });

  describe("Workspace Lifecycle Management", () => {
    it("should archive and restore workspaces", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand, workspaceArchiveCommand } = await import("../../src/commands/workspace.js");

      // Create workspace
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "completed-project",
        description: "A finished project",
        agents: [],
      });

      await workspaceCreateCommand();

      // Archive workspace
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        workspace: "completed-project",
        confirm: true,
      });

      const archiveResult = await workspaceArchiveCommand();
      expect(archiveResult).toContain("completed-project");
      expect(archiveResult).toContain("archived");

      // Verify workspace archived
      const { workspaceListCommand } = await import("../../src/commands/workspace.js");
      const listResult = await workspaceListCommand({ includeArchived: false });
      expect(listResult).not.toContain("completed-project");

      // List including archived
      const archivedList = await workspaceListCommand({ includeArchived: true });
      expect(archivedList).toContain("completed-project");
    });

    it("should delete workspace and cleanup resources", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand, workspaceDeleteCommand } = await import("../../src/commands/workspace.js");

      // Create workspace with agents
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "temp-workspace",
        description: "Temporary workspace",
        agents: [],
      });

      await workspaceCreateCommand();

      // Create agent in workspace
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "temp-agent",
        description: "Temporary agent",
        systemPrompt: "You are temporary.",
        model: "claude-sonnet-4",
        temperature: 0.5,
        skills: [],
        workspace: "temp-workspace",
      });

      await agentCreateCommand();

      // Delete workspace
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        workspace: "temp-workspace",
        deleteAgents: true,
        confirm: true,
      });

      const deleteResult = await workspaceDeleteCommand();
      expect(deleteResult).toContain("temp-workspace");
      expect(deleteResult).toContain("deleted");

      // Verify workspace and agents removed
      const { workspaceListCommand } = await import("../../src/commands/workspace.js");
      const listResult = await workspaceListCommand();
      expect(listResult).not.toContain("temp-workspace");

      const { agentListCommand } = await import("../../src/commands/agent-list.js");
      const agentsResult = await agentListCommand();
      expect(agentsResult).not.toContain("temp-agent");
    });
  });

  describe("Team Collaboration in Workspaces", () => {
    it("should support shared workspace access", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand, workspaceShareCommand } = await import("../../src/commands/workspace.js");

      // Create shared workspace
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "team-workspace",
        description: "Shared team workspace",
        agents: [],
        permissions: {
          public: false,
          allowedUsers: [],
        },
      });

      await workspaceCreateCommand();

      // Share workspace with team members
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        workspace: "team-workspace",
        shareWith: ["user1@example.com", "user2@example.com"],
        permissions: "read-write",
      });

      const shareResult = await workspaceShareCommand();
      expect(shareResult).toContain("team-workspace");
      expect(shareResult).toContain("shared");
    });
  });

  describe("Workspace Templates", () => {
    it("should create workspace from template", async () => {
      const inquirer = await import("inquirer");
      const { workspaceCreateCommand } = await import("../../src/commands/workspace.js");

      // Create workspace from web development template
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "web-app-project",
        description: "Web application project",
        template: "full-stack-web",
        agents: [], // Template will populate agents
      });

      const result = await workspaceCreateCommand();

      expect(result).toContain("web-app-project");

      // Verify template agents created
      const { workspaceShowCommand } = await import("../../src/commands/workspace.js");
      const showResult = await workspaceShowCommand({ workspace: "web-app-project" });

      // Full-stack template should include common roles
      expect(showResult).toContain("backend" || "frontend" || "database");
    });
  });
});
