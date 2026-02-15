import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockHomeDir, createMockAgent } from "./setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Chat Command Tests
 *
 * Tests the `panda chat` command including:
 * - Agent selection (by name, by ID, interactive)
 * - Conversation creation and saving
 * - Mock response generation
 * - Chat interface integration
 * - Error handling
 */

// Mock inquirer for user input simulation
vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

// Store the mock instance globally so we can modify it per test
let mockChatMessage = "Hello";

// Mock ChatInterface
vi.mock("../src/ui/chat-interface.js", () => ({
  ChatInterface: class {
    options: any;
    start: any;

    constructor(options: any) {
      this.options = options;
      this.start = vi.fn().mockImplementation(async () => {
        // Simulate user sending a message and getting a response
        const response = await options.onMessage(mockChatMessage);
        // Simulate exit
        if (options.onExit) {
          options.onExit();
        }
      });
    }
  },
}));

describe("Chat Command", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;
  let agentsFile: string;
  let conversationsDir: string;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");
    conversationsDir = path.join(homeSetup.homeDir, ".agentik-os", "data", "conversations");
    mockChatMessage = "Hello"; // Reset to default
  });

  afterEach(() => {
    homeSetup.cleanup();
    vi.clearAllMocks();
  });

  describe("Agent Selection", () => {
    beforeEach(() => {
      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({ name: "Agent1", id: "agent-1-uuid" }),
        createMockAgent({ name: "Agent2", id: "agent-2-uuid" }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));
    });

    it("should find agent by exact name match", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");
      const { ChatInterface } = await import("../src/ui/chat-interface.js");

      await chatCommand("Agent1");

      // Verify ChatInterface created with correct agent
      // Verify conversation was created for correct agent
      const files = fs.readdirSync(conversationsDir);
      expect(files.length).toBeGreaterThan(0);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );
      expect(convData.agentName).toBe("Agent1");
    });

    it("should find agent by partial name match", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");
      const { ChatInterface } = await import("../src/ui/chat-interface.js");

      await chatCommand("agent2"); // lowercase

      // Verify conversation was created for correct agent
      const files = fs.readdirSync(conversationsDir);
      expect(files.length).toBeGreaterThan(0);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );
      expect(convData.agentName).toBe("Agent2");
    });

    it("should find agent by ID prefix", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");
      const { ChatInterface } = await import("../src/ui/chat-interface.js");

      await chatCommand("agent-1"); // ID prefix

      // Verify conversation was created for correct agent
      const files = fs.readdirSync(conversationsDir);
      expect(files.length).toBeGreaterThan(0);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );
      expect(convData.agentId).toBe("agent-1-uuid");
    });

    it("should show error when agent not found", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await chatCommand("NonExistentAgent");

      console.log = originalLog;

      // Should show error message
      expect(logs.some((log) => log.includes("Agent not found"))).toBe(true);
      expect(logs.some((log) => log.includes("Available agents:"))).toBe(true);
    });

    it("should prompt user to select when no agent specified and multiple available", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");
      const inquirer = await import("inquirer");

      const mockPrompt = inquirer.default.prompt as any;
      mockPrompt.mockResolvedValueOnce({
        agentId: "agent-2-uuid",
      });

      await chatCommand();

      // Should have prompted for selection
      expect(inquirer.default.prompt).toHaveBeenCalled();
    });

    it("should auto-select when only one agent available", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");
      const { ChatInterface } = await import("../src/ui/chat-interface.js");
      const inquirer = await import("inquirer");

      // Create single agent
      const agents = [createMockAgent({ name: "OnlyAgent" })];
      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      await chatCommand();

      // Should NOT prompt (auto-selected)
      expect(inquirer.default.prompt).not.toHaveBeenCalled();

      // Should use the only available agent
      const files = fs.readdirSync(conversationsDir);
      expect(files.length).toBeGreaterThan(0);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );
      expect(convData.agentName).toBe("OnlyAgent");
    });

    it("should show helpful message when no agents exist", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");

      // Empty agents file
      fs.writeFileSync(agentsFile, JSON.stringify({ agents: [] }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await chatCommand();

      console.log = originalLog;

      // Should show empty state
      expect(logs.some((log) => log.includes("No agents found"))).toBe(true);
      expect(logs.some((log) => log.includes("panda agent create"))).toBe(true);
    });
  });

  describe("Conversation Management", () => {
    beforeEach(() => {
      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [createMockAgent({ name: "TestAgent", id: "test-agent-uuid" })];
      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));
    });

    it("should create conversation file with correct structure", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");

      await chatCommand("TestAgent");

      // Verify conversation file created
      expect(fs.existsSync(conversationsDir)).toBe(true);

      const files = fs.readdirSync(conversationsDir);
      expect(files.length).toBe(1);
      expect(files[0]).toMatch(/\.json$/);

      // Verify conversation structure
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );

      expect(convData).toMatchObject({
        agentId: "test-agent-uuid",
        agentName: "TestAgent",
        channel: "cli",
        userId: "cli_user",
      });

      expect(convData.id).toBeDefined();
      expect(convData.messages).toBeInstanceOf(Array);
      expect(convData.startedAt).toBeDefined();
      expect(convData.updatedAt).toBeDefined();
    });

    it("should save user and assistant messages to conversation", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");

      await chatCommand("TestAgent");

      // Get conversation file
      const files = fs.readdirSync(conversationsDir);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );

      // Should have 2 messages (user + assistant)
      expect(convData.messages.length).toBe(2);

      expect(convData.messages[0]).toMatchObject({
        role: "user",
        content: "Hello",
      });

      expect(convData.messages[1]).toMatchObject({
        role: "assistant",
        model: expect.any(String),
      });

      // Both should have IDs and timestamps
      expect(convData.messages[0].id).toBeDefined();
      expect(convData.messages[0].timestamp).toBeDefined();
      expect(convData.messages[1].id).toBeDefined();
      expect(convData.messages[1].timestamp).toBeDefined();
    });

    it("should update conversation updatedAt timestamp", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");

      await chatCommand("TestAgent");

      const files = fs.readdirSync(conversationsDir);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );

      const updatedAt = new Date(convData.updatedAt);
      const startedAt = new Date(convData.startedAt);

      // updatedAt should be >= startedAt (since messages were added)
      expect(updatedAt.getTime()).toBeGreaterThanOrEqual(startedAt.getTime());
    });
  });

  describe("Mock Response Generation", () => {
    beforeEach(() => {
      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({
          name: "TestBot",
          description: "A test assistant",
          model: "claude-sonnet-4.5",
        }),
      ];
      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));
    });

    it("should generate contextual greeting response", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");

      await chatCommand("TestBot");

      const files = fs.readdirSync(conversationsDir);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );

      const assistantMsg = convData.messages.find((m: any) => m.role === "assistant");
      expect(assistantMsg.content).toMatch(/Hello|TestBot/i);
    });

    it("should include agent name in who-are-you response", async () => {
      mockChatMessage = "who are you"; // Change message for this test

      const { chatCommand } = await import("../src/commands/chat.js");
      await chatCommand("TestBot");

      const files = fs.readdirSync(conversationsDir);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );

      const assistantMsg = convData.messages.find((m: any) => m.role === "assistant");
      expect(assistantMsg.content).toMatch(/TestBot/);
      expect(assistantMsg.content).toMatch(/A test assistant/);
    });

    it("should include model info when asked", async () => {
      mockChatMessage = "what model are you using"; // Change message for this test

      const { chatCommand } = await import("../src/commands/chat.js");
      await chatCommand("TestBot");

      const files = fs.readdirSync(conversationsDir);
      const convData = JSON.parse(
        fs.readFileSync(path.join(conversationsDir, files[0]!), "utf-8")
      );

      const assistantMsg = convData.messages.find((m: any) => m.role === "assistant");
      expect(assistantMsg.content).toMatch(/claude-sonnet-4.5/);
    });
  });

  describe("Error Handling", () => {
    it("should warn if conversation save fails", async () => {
      const { chatCommand } = await import("../src/commands/chat.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [createMockAgent({ name: "TestAgent" })];
      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      // Make conversations dir read-only to cause write error
      fs.mkdirSync(conversationsDir, { mode: 0o444 });

      const logs: string[] = [];
      const originalError = console.error;
      console.error = (...args: any[]) => logs.push(args.join(" "));

      await chatCommand("TestAgent");

      console.error = originalError;

      // Should have warned about save failure
      expect(
        logs.some((log) => log.includes("Warning") || log.includes("Failed to save"))
      ).toBe(true);

      // Cleanup: restore permissions
      fs.chmodSync(conversationsDir, 0o755);
    });
  });
});
