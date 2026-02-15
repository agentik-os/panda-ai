import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockHomeDir } from "../setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * CLI E2E Journey: Init → Create Agent → Chat → Deploy
 *
 * Tests the complete developer workflow from project initialization
 * through agent creation, interaction, and deployment.
 *
 * This test validates:
 * 1. `panda init` - Project setup with configuration
 * 2. `panda agent create` - Creating a new agent
 * 3. `panda chat` - Interacting with the agent
 * 4. `panda deploy` - Deploying the agent
 *
 * Target: Complete E2E user journey validation
 */

// Mock all interactive dependencies
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

describe("CLI E2E Journey: Init → Create Agent → Chat → Deploy", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    vi.clearAllMocks();
  });

  afterEach(() => {
    homeSetup.cleanup();
  });

  describe("Complete Developer Workflow", () => {
    it("should complete full journey from init to deploy", async () => {
      const inquirer = await import("inquirer");

      // STEP 1: Initialize project (panda init)
      const { initCommand } = await import("../../src/commands/init.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        overwrite: false,
        useAnthropic: true,
        anthropicApiKey: "sk-ant-test-key",
        useOpenAI: false,
        defaultModel: "claude-sonnet-4",
      });

      await initCommand();

      // Verify configuration created
      const configPath = path.join(homeSetup.homeDir, ".agentik-os", "config.json");
      expect(fs.existsSync(configPath)).toBe(true);

      const config = JSON.parse(fs.readFileSync(configPath, "utf-8"));
      expect(config.providers.anthropic).toBeDefined();
      expect(config.providers.anthropic.apiKey).toBe("sk-ant-test-key");

      // STEP 2: Create an agent (panda agent create)
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "test-assistant",
        description: "A helpful test assistant",
        systemPrompt: "You are a helpful assistant for testing.",
        model: "claude-sonnet-4",
        temperature: 0.7,
        skills: [],
      });

      const createResult = await agentCreateCommand();

      // Verify agent created
      expect(createResult).toContain("test-assistant");
      expect(createResult).toContain("created successfully");

      // STEP 3: Chat with the agent (panda chat)
      const { chatCommand } = await import("../../src/commands/chat.js");

      // Mock chat interaction
      vi.mocked(inquirer.default.prompt)
        .mockResolvedValueOnce({
          agent: "test-assistant",
        })
        .mockResolvedValueOnce({
          message: "Hello, how are you?",
        })
        .mockResolvedValueOnce({
          message: "exit",
        });

      // Mock agent response
      const mockResponse = "I'm doing well! How can I help you today?";
      vi.spyOn(global.console, "log").mockImplementation(() => {});

      // Run chat (will exit after one exchange due to "exit" input)
      await chatCommand({ agent: "test-assistant", message: "Hello, how are you?" });

      // Verify chat was initiated
      expect(inquirer.default.prompt).toHaveBeenCalled();

      // STEP 4: Deploy the agent (panda deploy)
      const { deployCommand } = await import("../../src/commands/deploy.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        agent: "test-assistant",
        environment: "production",
        region: "us-east-1",
        confirm: true,
      });

      const deployResult = await deployCommand();

      // Verify deployment initiated
      expect(deployResult).toContain("test-assistant");
      expect(deployResult).toContain("deploy" || "production");

      // Verify end-to-end state
      expect(fs.existsSync(configPath)).toBe(true);
      expect(config.providers.anthropic.apiKey).toBe("sk-ant-test-key");
    });

    it("should handle errors gracefully in the workflow", async () => {
      const inquirer = await import("inquirer");

      // STEP 1: Init with invalid API key
      const { initCommand } = await import("../../src/commands/init.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        overwrite: false,
        useAnthropic: true,
        anthropicApiKey: "", // Invalid: empty key
        useOpenAI: false,
      });

      await expect(initCommand()).rejects.toThrow();
    });

    it("should support incremental workflow resumption", async () => {
      const inquirer = await import("inquirer");

      // STEP 1: Initialize project
      const { initCommand } = await import("../../src/commands/init.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        overwrite: false,
        useAnthropic: true,
        anthropicApiKey: "sk-ant-test-key",
        useOpenAI: false,
        defaultModel: "claude-sonnet-4",
      });

      await initCommand();

      // STEP 2: Create first agent
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "assistant-1",
        description: "First assistant",
        systemPrompt: "You are assistant 1",
        model: "claude-sonnet-4",
        temperature: 0.7,
        skills: [],
      });

      await agentCreateCommand();

      // STEP 3: Create second agent (resuming workflow)
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "assistant-2",
        description: "Second assistant",
        systemPrompt: "You are assistant 2",
        model: "claude-sonnet-4",
        temperature: 0.7,
        skills: [],
      });

      const result2 = await agentCreateCommand();

      // Verify both agents can be created in same session
      expect(result2).toContain("assistant-2");

      // STEP 4: List agents to verify both exist
      const { agentListCommand } = await import("../../src/commands/agent-list.js");
      const listResult = await agentListCommand();

      expect(listResult).toContain("assistant-1");
      expect(listResult).toContain("assistant-2");
    });
  });

  describe("Configuration Persistence", () => {
    it("should persist config across command invocations", async () => {
      const inquirer = await import("inquirer");

      // Initialize
      const { initCommand } = await import("../../src/commands/init.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        overwrite: false,
        useAnthropic: true,
        anthropicApiKey: "sk-ant-persistent-key",
        useOpenAI: true,
        openaiApiKey: "sk-openai-key",
        defaultModel: "claude-sonnet-4",
      });

      await initCommand();

      // Verify config persisted
      const configPath = path.join(homeSetup.homeDir, ".agentik-os", "config.json");
      const config1 = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      // Create agent using persisted config
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "persistent-agent",
        description: "Agent using persistent config",
        systemPrompt: "You are a persistent agent",
        model: "claude-sonnet-4",
        temperature: 0.7,
        skills: [],
      });

      await agentCreateCommand();

      // Verify config unchanged
      const config2 = JSON.parse(fs.readFileSync(configPath, "utf-8"));

      expect(config2.providers.anthropic.apiKey).toBe(config1.providers.anthropic.apiKey);
      expect(config2.providers.openai.apiKey).toBe(config1.providers.openai.apiKey);
    });
  });

  describe("Error Recovery", () => {
    it("should recover from mid-workflow failures", async () => {
      const inquirer = await import("inquirer");

      // Initialize successfully
      const { initCommand } = await import("../../src/commands/init.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        overwrite: false,
        useAnthropic: true,
        anthropicApiKey: "sk-ant-test-key",
        useOpenAI: false,
        defaultModel: "claude-sonnet-4",
      });

      await initCommand();

      // Fail agent creation (invalid input)
      const { agentCreateCommand } = await import("../../src/commands/agent-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "", // Invalid: empty name
        description: "Test agent",
        systemPrompt: "You are a test agent",
        model: "claude-sonnet-4",
        temperature: 0.7,
        skills: [],
      });

      await expect(agentCreateCommand()).rejects.toThrow();

      // Retry with valid input
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "recovered-agent",
        description: "Agent created after recovery",
        systemPrompt: "You are a recovered agent",
        model: "claude-sonnet-4",
        temperature: 0.7,
        skills: [],
      });

      const result = await agentCreateCommand();

      // Verify recovery successful
      expect(result).toContain("recovered-agent");
    });
  });
});
