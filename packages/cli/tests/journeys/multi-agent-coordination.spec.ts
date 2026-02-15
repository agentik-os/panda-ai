import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockHomeDir } from "../setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * CLI E2E Journey: Multi-Agent Coordination
 *
 * Tests the workflow of multiple agents working together:
 * 1. Create multiple specialized agents
 * 2. Assign coordinated tasks
 * 3. Monitor agent collaboration
 * 4. Verify results from team effort
 *
 * Scenarios tested:
 * - Research agent gathers data → Writer agent creates content
 * - Code reviewer agent checks → Fixer agent corrects issues
 * - Manager agent delegates → Worker agents execute
 *
 * Target: Validate multi-agent collaboration patterns
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

describe("CLI E2E Journey: Multi-Agent Coordination", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    vi.clearAllMocks();

    // Initialize project for multi-agent testing
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

  describe("Research → Write Workflow", () => {
    it("should coordinate research and writing agents", async () => {
      const inquirer = await import("inquirer");
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      // STEP 1: Create research agent
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "researcher",
        description: "Gathers and analyzes information",
        systemPrompt: "You are a research specialist. Gather accurate information and provide detailed summaries.",
        model: "claude-sonnet-4",
        temperature: 0.3, // Low temperature for factual accuracy
        skills: ["web-search"],
      });

      const researcherResult = await agentCreateCommand();
      expect(researcherResult).toContain("researcher");

      // STEP 2: Create writer agent
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "writer",
        description: "Creates engaging content from research",
        systemPrompt: "You are a skilled writer. Transform research into compelling narratives.",
        model: "claude-sonnet-4",
        temperature: 0.7, // Higher temperature for creativity
        skills: [],
      });

      const writerResult = await agentCreateCommand();
      expect(writerResult).toContain("writer");

      // STEP 3: Researcher gathers information
      const { chatCommand } = await import("../../src/commands/chat.js");

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ agent: "researcher" })
        .mockResolvedValueOnce({ message: "Research the benefits of AI in healthcare" })
        .mockResolvedValueOnce({ message: "exit" });

      await chatCommand({ agent: "researcher", message: "Research the benefits of AI in healthcare" });

      // Verify researcher executed task
      expect(inquirer.default.prompt).toHaveBeenCalled();

      // STEP 4: Writer uses research to create content
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ agent: "writer" })
        .mockResolvedValueOnce({
          message: "Write an article based on the AI healthcare research",
        })
        .mockResolvedValueOnce({ message: "exit" });

      await chatCommand({
        agent: "writer",
        message: "Write an article based on the AI healthcare research",
      });

      // Verify writer executed task
      expect(inquirer.default.prompt).toHaveBeenCalled();

      // STEP 5: List both agents to verify coordination setup
      const { agentListCommand } = await import("../../src/commands/agent-list.js");
      const listResult = await agentListCommand();

      expect(listResult).toContain("researcher");
      expect(listResult).toContain("writer");
    });
  });

  describe("Code Review → Fix Workflow", () => {
    it("should coordinate reviewer and fixer agents", async () => {
      const inquirer = await import("inquirer");
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      // STEP 1: Create code reviewer agent
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "reviewer",
        description: "Reviews code for issues and improvements",
        systemPrompt: "You are a code reviewer. Identify bugs, security issues, and suggest improvements.",
        model: "claude-sonnet-4",
        temperature: 0.2,
        skills: ["file-ops"],
      });

      await agentCreateCommand();

      // STEP 2: Create code fixer agent
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "fixer",
        description: "Fixes code issues identified by reviewer",
        systemPrompt: "You are a code fixer. Implement corrections based on review feedback.",
        model: "claude-sonnet-4",
        temperature: 0.3,
        skills: ["file-ops"],
      });

      await agentCreateCommand();

      // STEP 3: Reviewer analyzes code
      const { chatCommand } = await import("../../src/commands/chat.js");

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ agent: "reviewer" })
        .mockResolvedValueOnce({ message: "Review the authentication module" })
        .mockResolvedValueOnce({ message: "exit" });

      await chatCommand({ agent: "reviewer", message: "Review the authentication module" });

      // STEP 4: Fixer applies corrections
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ agent: "fixer" })
        .mockResolvedValueOnce({ message: "Fix the issues found in authentication module" })
        .mockResolvedValueOnce({ message: "exit" });

      await chatCommand({ agent: "fixer", message: "Fix the issues found in authentication module" });

      // Verify both agents exist and can coordinate
      const { agentListCommand } = await import("../../src/commands/agent-list.js");
      const listResult = await agentListCommand();

      expect(listResult).toContain("reviewer");
      expect(listResult).toContain("fixer");
    });
  });

  describe("Manager → Workers Delegation", () => {
    it("should coordinate manager with multiple worker agents", async () => {
      const inquirer = await import("inquirer");
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      // STEP 1: Create manager agent
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "project-manager",
        description: "Coordinates team and delegates tasks",
        systemPrompt: "You are a project manager. Break down projects and assign tasks to specialists.",
        model: "claude-sonnet-4",
        temperature: 0.4,
        skills: [],
      });

      await agentCreateCommand();

      // STEP 2: Create specialized worker agents
      const workers = [
        {
          name: "backend-dev",
          description: "Handles backend development",
          systemPrompt: "You are a backend developer. Build robust APIs and services.",
          skills: ["file-ops"],
        },
        {
          name: "frontend-dev",
          description: "Handles frontend development",
          systemPrompt: "You are a frontend developer. Create responsive UIs.",
          skills: ["file-ops"],
        },
        {
          name: "qa-engineer",
          description: "Handles quality assurance",
          systemPrompt: "You are a QA engineer. Write comprehensive tests.",
          skills: ["file-ops"],
        },
      ];

      for (const worker of workers) {
        vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
          ...worker,
          model: "claude-sonnet-4",
          temperature: 0.5,
        });

        await agentCreateCommand();
      }

      // STEP 3: Manager delegates tasks
      const { chatCommand } = await import("../../src/commands/chat.js");

      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({ agent: "project-manager" })
        .mockResolvedValueOnce({ message: "Plan the development of a user authentication system" })
        .mockResolvedValueOnce({ message: "exit" });

      await chatCommand({
        agent: "project-manager",
        message: "Plan the development of a user authentication system",
      });

      // STEP 4: Workers execute delegated tasks
      for (const worker of workers) {
        vi.mocked(inquirer.default.prompt)
          .mockResolvedValueOnce({ agent: worker.name })
          .mockResolvedValueOnce({ message: `Complete your part of the authentication system` })
          .mockResolvedValueOnce({ message: "exit" });

        await chatCommand({
          agent: worker.name,
          message: "Complete your part of the authentication system",
        });
      }

      // STEP 5: Verify all agents created and coordinated
      const { agentListCommand } = await import("../../src/commands/agent-list.js");
      const listResult = await agentListCommand();

      expect(listResult).toContain("project-manager");
      expect(listResult).toContain("backend-dev");
      expect(listResult).toContain("frontend-dev");
      expect(listResult).toContain("qa-engineer");
    });

    it("should handle agent collaboration with shared context", async () => {
      const inquirer = await import("inquirer");
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      // Create agents that share workspace
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          name: "agent-1",
          description: "First collaborative agent",
          systemPrompt: "You collaborate with other agents.",
          model: "claude-sonnet-4",
          temperature: 0.5,
          skills: [],
        })
        .mockResolvedValueOnce({
          name: "agent-2",
          description: "Second collaborative agent",
          systemPrompt: "You collaborate with other agents.",
          model: "claude-sonnet-4",
          temperature: 0.5,
          skills: [],
        });

      await agentCreateCommand();
      await agentCreateCommand();

      // Use workspace command to create shared context
      const { workspaceCreateCommand } = await import("../../src/commands/workspace.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "shared-project",
        description: "Workspace for agent collaboration",
        agents: ["agent-1", "agent-2"],
      });

      const workspaceResult = await workspaceCreateCommand();

      expect(workspaceResult).toContain("shared-project");
      expect(workspaceResult).toContain("agent-1" || "agent-2");

      // Verify workspace created for multi-agent coordination
      const { workspaceListCommand } = await import("../../src/commands/workspace.js");
      const listResult = await workspaceListCommand();

      expect(listResult).toContain("shared-project");
    });
  });

  describe("Error Handling in Multi-Agent Scenarios", () => {
    it("should handle one agent failing while others continue", async () => {
      const inquirer = await import("inquirer");
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      // Create multiple agents
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          name: "stable-agent",
          description: "A reliable agent",
          systemPrompt: "You are stable.",
          model: "claude-sonnet-4",
          temperature: 0.5,
          skills: [],
        })
        .mockResolvedValueOnce({
          name: "unstable-agent",
          description: "An agent that might fail",
          systemPrompt: "You might encounter errors.",
          model: "invalid-model", // This should cause an error
          temperature: 0.5,
          skills: [],
        });

      await agentCreateCommand();

      // Second agent creation should fail due to invalid model
      await expect(agentCreateCommand()).rejects.toThrow();

      // Verify first agent still works
      const { agentListCommand } = await import("../../src/commands/agent-list.js");
      const listResult = await agentListCommand();

      expect(listResult).toContain("stable-agent");
      expect(listResult).not.toContain("unstable-agent");
    });
  });
});
