import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockHomeDir } from "./setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Agent Create Command Tests
 *
 * Tests the `panda agent create` wizard flow including:
 * - Non-interactive mode (--yes flag with args)
 * - Interactive wizard prompts
 * - Agent validation
 * - File creation
 * - Default values
 */

// Mock inquirer for user input simulation
vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Mock ora for spinner (suppress output)
vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
  })),
}));

describe("Agent Create Command", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;

  beforeEach(() => {
    homeSetup = mockHomeDir();
  });

  afterEach(() => {
    homeSetup.cleanup();
    vi.clearAllMocks();
  });

  describe("Non-Interactive Mode (--yes flag)", () => {
    it("should create agent with CLI args and --yes flag", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");
      const inquirer = await import("inquirer");

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");

      // Create agent with minimal required arg (name)
      await createAgentCommand("TestAgent", {
        yes: true,
        description: "Test agent description",
        systemPrompt: "You are a helpful assistant",
        model: "claude-sonnet-4.5",
      });

      // Verify file created
      expect(fs.existsSync(agentsFile)).toBe(true);

      // Verify agent data
      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents).toHaveLength(1);
      expect(data.agents[0]).toMatchObject({
        name: "TestAgent",
        description: "Test agent description",
        systemPrompt: "You are a helpful assistant",
        model: "claude-sonnet-4.5",
        active: true,
        channels: ["cli"],
        skills: [],
      });

      // Verify defaults applied
      expect(data.agents[0].temperature).toBe(0.7);
      expect(data.agents[0].maxTokens).toBe(4096);

      // Should NOT have prompted user
      expect(inquirer.default.prompt).not.toHaveBeenCalled();
    });

    it("should apply defaults when optional args omitted", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");

      // Create agent with only name and --yes
      await createAgentCommand("MinimalAgent", {
        yes: true,
      });

      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents[0]).toMatchObject({
        name: "MinimalAgent",
        description: "AI agent: MinimalAgent", // Default description
        systemPrompt: "You are MinimalAgent, a helpful AI assistant.", // Default prompt
        model: "claude-sonnet-4.5", // Default model
        temperature: 0.7,
        maxTokens: 4096,
        active: true,
        channels: ["cli"],
        skills: [],
      });
    });

    it("should parse comma-separated channels", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");

      await createAgentCommand("MultiChannelAgent", {
        yes: true,
        channels: "cli, telegram, api",
      });

      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents[0].channels).toEqual(["cli", "telegram", "api"]);
    });

    it("should parse comma-separated skills", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");

      await createAgentCommand("SkilledAgent", {
        yes: true,
        skills: "web_search, code_execution, file_operations",
      });

      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents[0].skills).toEqual([
        "web_search",
        "code_execution",
        "file_operations",
      ]);
    });

    it("should exit with error if name not provided in non-interactive mode", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      // Mock process.exit to prevent actual exit
      const exitSpy = vi.spyOn(process, "exit").mockImplementation((() => {
        throw new Error("process.exit called");
      }) as any);

      try {
        await createAgentCommand(undefined, { yes: true });
        expect.fail("Should have exited");
      } catch (error) {
        expect((error as Error).message).toBe("process.exit called");
      }

      expect(exitSpy).toHaveBeenCalledWith(1);
      exitSpy.mockRestore();
    });
  });

  describe("Interactive Wizard Mode", () => {
    it("should prompt for all fields when no args provided", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");
      const inquirer = await import("inquirer");

      const mockPrompt = vi.mocked(inquirer.default.prompt);

      // Mock all wizard prompts
      mockPrompt
        .mockResolvedValueOnce({
          name: "WizardAgent",
          description: "Created via wizard",
          systemPrompt: "You are a wizard-created agent",
        })
        .mockResolvedValueOnce({
          model: "claude-sonnet-4.5",
          temperature: 0.8,
          maxTokens: 8192,
        })
        .mockResolvedValueOnce({
          channels: ["cli", "telegram"],
        })
        .mockResolvedValueOnce({
          skills: ["web_search"],
        })
        .mockResolvedValueOnce({
          confirm: true,
        });

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");

      await createAgentCommand();

      // Verify prompts were called
      expect(mockPrompt).toHaveBeenCalledTimes(5);

      // Verify agent created with wizard values
      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents[0]).toMatchObject({
        name: "WizardAgent",
        description: "Created via wizard",
        systemPrompt: "You are a wizard-created agent",
        model: "claude-sonnet-4.5",
        temperature: 0.8,
        maxTokens: 8192,
        channels: ["cli", "telegram"],
        skills: ["web_search"],
      });
    });

    it("should skip name prompt if name provided as arg", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");
      const inquirer = await import("inquirer");

      const mockPrompt = vi.mocked(inquirer.default.prompt);

      // Mock prompts AFTER name (description, systemPrompt, model, channels, skills, confirm)
      mockPrompt
        .mockResolvedValueOnce({
          description: "Partial wizard",
          systemPrompt: "You are helpful",
        })
        .mockResolvedValueOnce({
          model: "claude-sonnet-4.5",
          temperature: 0.7,
          maxTokens: 4096,
        })
        .mockResolvedValueOnce({
          channels: ["cli"],
        })
        .mockResolvedValueOnce({
          skills: [],
        })
        .mockResolvedValueOnce({
          confirm: true,
        });

      await createAgentCommand("PartialWizardAgent");

      // Should have prompted for all fields EXCEPT name
      expect(mockPrompt).toHaveBeenCalledTimes(5);

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");
      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents[0].name).toBe("PartialWizardAgent");
    });

    it("should exit without creating agent if user declines confirmation", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");
      const inquirer = await import("inquirer");

      const mockPrompt = vi.mocked(inquirer.default.prompt);

      mockPrompt
        .mockResolvedValueOnce({
          name: "DeclinedAgent",
          description: "This will be declined",
          systemPrompt: "You are helpful",
        })
        .mockResolvedValueOnce({
          model: "claude-sonnet-4.5",
          temperature: 0.7,
          maxTokens: 4096,
        })
        .mockResolvedValueOnce({
          channels: ["cli"],
        })
        .mockResolvedValueOnce({
          skills: [],
        })
        .mockResolvedValueOnce({
          confirm: false, // User declines
        });

      await createAgentCommand();

      // Verify agent NOT created
      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");
      expect(fs.existsSync(agentsFile)).toBe(false);
    });
  });

  describe("File Operations", () => {
    it("should create data directory if not exists", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      expect(fs.existsSync(dataDir)).toBe(false);

      await createAgentCommand("TestAgent", { yes: true });

      expect(fs.existsSync(dataDir)).toBe(true);
    });

    it("should append to existing agents file", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      const agentsFile = path.join(dataDir, "agents.json");

      // Create first agent
      await createAgentCommand("Agent1", { yes: true });

      let data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents).toHaveLength(1);

      // Create second agent
      await createAgentCommand("Agent2", { yes: true });

      data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents).toHaveLength(2);
      expect(data.agents[0].name).toBe("Agent1");
      expect(data.agents[1].name).toBe("Agent2");
    });

    it("should generate unique ID for each agent", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      await createAgentCommand("Agent1", { yes: true });
      await createAgentCommand("Agent2", { yes: true });

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");
      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));

      expect(data.agents[0].id).toBeDefined();
      expect(data.agents[1].id).toBeDefined();
      expect(data.agents[0].id).not.toBe(data.agents[1].id);

      // Should be UUIDs
      expect(data.agents[0].id).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/
      );
    });

    it("should set createdAt and updatedAt timestamps", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      const before = new Date();
      await createAgentCommand("TimestampAgent", { yes: true });
      const after = new Date();

      const agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");
      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));

      const createdAt = new Date(data.agents[0].createdAt);
      const updatedAt = new Date(data.agents[0].updatedAt);

      expect(createdAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(createdAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
      expect(updatedAt.getTime()).toBeLessThanOrEqual(after.getTime());
      expect(createdAt.getTime()).toBe(updatedAt.getTime()); // Should be same on creation
    });
  });

  describe("Agent Data Validation", () => {
    it("should handle corrupted agents file gracefully", async () => {
      const { createAgentCommand } = await import("../src/commands/agent/create.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      const agentsFile = path.join(dataDir, "agents.json");

      // Create corrupted JSON
      fs.mkdirSync(dataDir, { recursive: true });
      fs.writeFileSync(agentsFile, "{ invalid json }");

      // Should still create agent (starts fresh)
      await createAgentCommand("RecoveryAgent", { yes: true });

      const data = JSON.parse(fs.readFileSync(agentsFile, "utf-8"));
      expect(data.agents).toHaveLength(1);
      expect(data.agents[0].name).toBe("RecoveryAgent");
    });
  });
});
