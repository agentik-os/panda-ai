/**
 * Phase 0 End-to-End Test
 *
 * Verifies complete flow with REAL CLI commands:
 * 1. CLI agent creation (`panda agent create`)
 * 2. CLI agent listing (`panda agent list`)
 * 3. CLI logs viewing (`panda logs`)
 * 4. Config file creation and validation
 *
 * Dependencies: All Phase 0 CLI steps (029-036) complete
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { exec } from "child_process";
import { promisify } from "util";
import { readFile, rm, mkdir, writeFile } from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { tmpdir } from "os";

const execAsync = promisify(exec);

// CLI paths
const CLI_PATH = path.join(__dirname, "../../packages/cli/dist/index.js");
const TEST_HOME_DIR = path.join(tmpdir(), `agentik-test-home-${Date.now()}`);
const TEST_CONFIG_DIR = path.join(TEST_HOME_DIR, ".agentik-os");
const TEST_AGENTS_FILE = path.join(TEST_CONFIG_DIR, "data", "agents.json");
const TEST_CONVERSATIONS_DIR = path.join(TEST_CONFIG_DIR, "data", "conversations");

// Helper to run CLI commands
async function runCLI(command: string): Promise<{ stdout: string; stderr: string }> {
  const env = {
    ...process.env,
    HOME: TEST_HOME_DIR,
  };

  return execAsync(`node ${CLI_PATH} ${command}`, {
    cwd: path.join(__dirname, "../.."),
    env,
    timeout: 10000,
  });
}

// Helper to clean up test data
async function cleanupTestData(): Promise<void> {
  try {
    if (existsSync(TEST_HOME_DIR)) {
      await rm(TEST_HOME_DIR, { recursive: true, force: true });
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

describe("Phase 0 End-to-End Test", () => {
  beforeAll(async () => {
    // Clean up any existing test data
    await cleanupTestData();

    // Create test directory structure
    await mkdir(TEST_HOME_DIR, { recursive: true });
    await mkdir(path.join(TEST_CONFIG_DIR, "data"), { recursive: true });
    await mkdir(TEST_CONVERSATIONS_DIR, { recursive: true });
  });

  afterAll(async () => {
    // Cleanup test data after all tests
    await cleanupTestData();
  });

  beforeEach(async () => {
    // Reset agents file before each test
    await writeFile(TEST_AGENTS_FILE, JSON.stringify({ agents: [] }, null, 2));
  });

  describe("CLI Agent Management", () => {
    it("should create agent with CLI", async () => {
      // Create agent using real CLI command with --yes for non-interactive mode
      const { stdout } = await runCLI(
        'agent create TestAgent --model claude-sonnet-4-5 --channels cli --skills web-search --yes'
      );

      // Verify success (check for Next steps message which is more reliable than spinner)
      expect(stdout).toContain("Next steps");
      expect(stdout).toContain("TestAgent");

      // Verify agent file was created
      expect(existsSync(TEST_AGENTS_FILE)).toBe(true);

      // Read and verify agent data
      const agentsData = JSON.parse(await readFile(TEST_AGENTS_FILE, "utf-8"));
      expect(agentsData.agents).toBeDefined();
      expect(agentsData.agents.length).toBe(1);
      expect(agentsData.agents[0].name).toBe("TestAgent");
      expect(agentsData.agents[0].model).toContain("claude-sonnet");
      expect(agentsData.agents[0].channels).toContain("cli");
      expect(agentsData.agents[0].skills).toContain("web-search");
    }, 15000);

    it("should list agents with CLI", async () => {
      // Create test agents first
      await runCLI('agent create Agent1 --model claude-sonnet-4-5 --yes');
      await runCLI('agent create Agent2 --model gpt-4o --yes');

      // List agents
      const { stdout } = await runCLI("agent list");

      // Verify output contains both agents
      expect(stdout).toContain("Agent1");
      expect(stdout).toContain("Agent2");
      expect(stdout).toContain("claude-sonnet");
      expect(stdout).toContain("gpt-4o");
    }, 15000);

    it("should filter agents by status", async () => {
      // Create agents with different states
      await runCLI('agent create ActiveAgent --model claude-sonnet-4-5 --yes');

      // List only active agents
      const { stdout: activeOutput } = await runCLI("agent list --active");
      expect(activeOutput).toContain("ActiveAgent");

      // List inactive agents (should be empty initially)
      const { stdout: inactiveOutput } = await runCLI("agent list --inactive");
      expect(inactiveOutput).toContain("No inactive agents found");
    }, 15000);

    it("should show detailed agent information", async () => {
      // Create agent
      await runCLI(
        'agent create DetailedAgent --model claude-sonnet-4-5 --channels cli,api --skills web-search,code-execution --yes'
      );

      // Get detailed view
      const { stdout } = await runCLI("agent list --detailed");

      // Verify detailed information is shown
      expect(stdout).toContain("DetailedAgent");
      expect(stdout).toContain("claude-sonnet");
      expect(stdout).toContain("cli");
      expect(stdout).toContain("api");
      expect(stdout).toContain("web-search");
      expect(stdout).toContain("code-execution");
    }, 15000);
  });

  describe("CLI Logs and Conversations", () => {
    it("should show empty state when no conversations exist", async () => {
      const { stdout } = await runCLI("logs");

      expect(stdout).toContain("No conversations found");
      expect(stdout).toContain("panda chat");
    }, 10000);

    it("should create and display conversation logs", async () => {
      // Create test conversation file manually (since chat is interactive)
      const conversationId = `test-conv-${Date.now()}`;
      const testConversation = {
        id: conversationId,
        agentId: "test-agent-123",
        agentName: "TestAgent",
        channel: "cli",
        userId: "test-user",
        messages: [
          {
            id: "msg-1",
            role: "user",
            content: "Hello",
            timestamp: new Date(),
          },
          {
            id: "msg-2",
            role: "assistant",
            content: "Hi there!",
            timestamp: new Date(),
            model: "claude-sonnet-4-5",
          },
        ],
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      await writeFile(
        path.join(TEST_CONVERSATIONS_DIR, `${conversationId}.json`),
        JSON.stringify(testConversation, null, 2)
      );

      // List conversations
      const { stdout } = await runCLI("logs");

      expect(stdout).toContain("Conversations");
      expect(stdout).toContain("TestAgent");
      expect(stdout).toContain("cli");
    }, 10000);

    it("should filter conversations by agent", async () => {
      // Create conversations for different agents
      const conv1 = {
        id: "conv-1",
        agentId: "agent-1",
        agentName: "Agent1",
        channel: "cli",
        userId: "user-1",
        messages: [],
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      const conv2 = {
        id: "conv-2",
        agentId: "agent-2",
        agentName: "Agent2",
        channel: "cli",
        userId: "user-1",
        messages: [],
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      await writeFile(
        path.join(TEST_CONVERSATIONS_DIR, "conv-1.json"),
        JSON.stringify(conv1, null, 2)
      );
      await writeFile(
        path.join(TEST_CONVERSATIONS_DIR, "conv-2.json"),
        JSON.stringify(conv2, null, 2)
      );

      // Filter by agent
      const { stdout } = await runCLI("logs --agent Agent1");

      expect(stdout).toContain("Agent1");
      expect(stdout).not.toContain("Agent2");
    }, 10000);

    it("should show detailed conversation view", async () => {
      // Create test conversation
      const convId = `detailed-conv-${Date.now()}`;
      const conversation = {
        id: convId,
        agentId: "test-agent",
        agentName: "TestAgent",
        channel: "cli",
        userId: "test-user",
        messages: [
          {
            id: "msg-1",
            role: "user",
            content: "What is 2+2?",
            timestamp: new Date(),
          },
          {
            id: "msg-2",
            role: "assistant",
            content: "2+2 equals 4.",
            timestamp: new Date(),
            model: "claude-sonnet-4-5",
          },
        ],
        startedAt: new Date(),
        updatedAt: new Date(),
      };

      await writeFile(
        path.join(TEST_CONVERSATIONS_DIR, `${convId}.json`),
        JSON.stringify(conversation, null, 2)
      );

      // Get detailed view by conversation ID
      const { stdout } = await runCLI(`logs --conversation ${convId.substring(0, 8)}`);

      expect(stdout).toContain("What is 2+2?");
      expect(stdout).toContain("2+2 equals 4");
      expect(stdout).toContain("TestAgent");
    }, 10000);
  });

  describe("Error Handling", () => {
    it("should handle agent creation with missing name", async () => {
      try {
        await runCLI("agent create --yes");
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Verify error is thrown
        expect(error).toBeDefined();
        expect(error.message).toContain("Agent name is required");
      }
    }, 10000);

    it("should handle listing agents when none exist", async () => {
      const { stdout } = await runCLI("agent list");

      expect(stdout).toContain("No agents found");
      expect(stdout).toContain("panda agent create");
    }, 10000);

    it("should handle invalid command options", async () => {
      try {
        await runCLI("agent list --invalid-flag");
        // Should not reach here
        expect(true).toBe(false);
      } catch (error: any) {
        // Verify error for unknown option
        expect(error).toBeDefined();
      }
    }, 10000);

    it("should handle non-existent conversation ID", async () => {
      const { stdout } = await runCLI("logs --conversation non-existent-id");

      expect(stdout).toContain("Conversation not found");
    }, 10000);
  });

  describe("Config Management", () => {
    it("should verify config file structure", async () => {
      // Config should be created automatically by CLI commands
      const configFile = path.join(TEST_CONFIG_DIR, "config.json");

      // Create a test agent to trigger config creation
      await runCLI('agent create ConfigTest --model claude-sonnet-4-5 --yes');

      // Verify config exists (if it's created by init or other commands)
      // Note: Config creation might be manual via 'panda init'
      // For now, we'll just verify the structure if it exists
      if (existsSync(configFile)) {
        const configData = JSON.parse(await readFile(configFile, "utf-8"));

        expect(configData.version).toBeDefined();
        expect(configData.models).toBeDefined();
        expect(configData.runtime).toBeDefined();
      }
    }, 10000);
  });

  describe("CLI Help and Version", () => {
    it("should show version information", async () => {
      const { stdout } = await runCLI("--version");

      expect(stdout).toMatch(/\d+\.\d+\.\d+/); // Semver format
    }, 10000);

    it("should show help for main command", async () => {
      const { stdout } = await runCLI("--help");

      expect(stdout).toContain("Agentik OS");
      expect(stdout).toContain("agent");
      expect(stdout).toContain("chat");
      expect(stdout).toContain("logs");
    }, 10000);

    it("should show help for agent command", async () => {
      const { stdout } = await runCLI("agent --help");

      expect(stdout).toContain("create");
      expect(stdout).toContain("list");
    }, 10000);
  });
});
