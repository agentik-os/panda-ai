import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { chatCommand } from "../../src/commands/chat";
import type { Agent } from "@agentik-os/shared";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    yellow: (str: string) => str,
    red: (str: string) => str,
    dim: (str: string) => str,
  },
}));

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
  writeFileSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

vi.mock("crypto", () => ({
  randomUUID: vi.fn(),
}));

// Mock ChatInterface
const mockChatStart = vi.fn();
const mockChatInterface = vi.fn(() => ({
  start: mockChatStart,
}));

vi.mock("../../src/ui/chat-interface.js", () => ({
  ChatInterface: mockChatInterface,
}));

describe("Chat Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  const mockAgents: Agent[] = [
    {
      id: "agent-1",
      name: "TestAgent1",
      description: "First test agent",
      systemPrompt: "You are a helpful assistant",
      model: "claude-sonnet-4.5",
      temperature: 0.7,
      maxTokens: 4096,
      active: true,
      channels: ["cli"],
      skills: [],
      createdAt: new Date("2024-01-15T00:00:00.000Z") as any,
      updatedAt: new Date("2024-01-15T00:00:00.000Z") as any,
    },
    {
      id: "agent-2",
      name: "TestAgent2",
      description: "Second test agent",
      systemPrompt: "You are a helpful assistant",
      model: "gpt-5",
      temperature: 0.5,
      maxTokens: 2048,
      active: true,
      channels: ["cli"],
      skills: [],
      createdAt: new Date("2024-01-16T00:00:00.000Z") as any,
      updatedAt: new Date("2024-01-16T00:00:00.000Z") as any,
    },
  ];

  beforeEach(async () => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.HOME = "/tmp/test-home";

    // Default mocks
    (existsSync as any).mockReturnValue(true);
    (readFileSync as any).mockReturnValue(JSON.stringify({ agents: mockAgents }));
    (writeFileSync as any).mockImplementation(() => {});
    (mkdirSync as any).mockImplementation(() => {});

    // Mock crypto.randomUUID
    const crypto = await import("crypto");
    (crypto.randomUUID as any).mockReturnValue("mock-uuid-123");

    // Mock ChatInterface
    mockChatStart.mockResolvedValue(undefined);
    mockChatInterface.mockClear();
    mockChatStart.mockClear();

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    delete process.env.HOME;
  });

  describe("Empty State", () => {
    it("should show message when no agents file exists", async () => {
      (existsSync as any).mockReturnValue(false);

      await chatCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda agent create"));
    });

    it("should show message when agents array is empty", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [] }));

      await chatCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
    });

    it("should handle corrupted JSON gracefully", async () => {
      (readFileSync as any).mockReturnValue("invalid json {{{");

      await chatCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading agents"),
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
    });
  });

  describe("Agent Selection", () => {
    it("should find agent by exact name match", async () => {
      await chatCommand("TestAgent1");

      expect(mockChatInterface).toHaveBeenCalled();
      const chatOptions = mockChatInterface.mock.calls[0]![0];
      expect(chatOptions.agent.name).toBe("TestAgent1");
    });

    it("should find agent by partial name match (case insensitive)", async () => {
      await chatCommand("testagent1");

      expect(mockChatInterface).toHaveBeenCalled();
      const chatOptions = mockChatInterface.mock.calls[0]![0];
      expect(chatOptions.agent.name).toBe("TestAgent1");
    });

    it("should find agent by ID prefix", async () => {
      await chatCommand("agent-1");

      expect(mockChatInterface).toHaveBeenCalled();
      const chatOptions = mockChatInterface.mock.calls[0]![0];
      expect(chatOptions.agent.id).toBe("agent-1");
    });

    it("should show error when agent not found", async () => {
      await chatCommand("NonexistentAgent");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Agent not found: NonexistentAgent")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Available agents:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("TestAgent1"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("TestAgent2"));
      expect(mockChatInterface).not.toHaveBeenCalled();
    });

    it("should use single agent automatically when only one exists", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [mockAgents[0]] }));

      await chatCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Using agent: TestAgent1")
      );
      expect(mockChatInterface).toHaveBeenCalled();
    });

    it("should prompt for selection when multiple agents exist and none specified", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any).mockResolvedValue({ agentId: "agent-2" });

      await chatCommand();

      expect(inquirer.default.prompt).toHaveBeenCalledWith([
        expect.objectContaining({
          type: "list",
          name: "agentId",
          message: "Select an agent to chat with:",
        }),
      ]);
      expect(mockChatInterface).toHaveBeenCalled();
      const chatOptions = mockChatInterface.mock.calls[0]![0];
      expect(chatOptions.agent.name).toBe("TestAgent2");
    });

    it("should include agent model in selection choices", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any).mockResolvedValue({ agentId: "agent-1" });

      await chatCommand();

      const promptCall = (inquirer.default.prompt as any).mock.calls[0]![0][0];
      expect(promptCall.choices).toEqual([
        { name: "TestAgent1 (claude-sonnet-4.5)", value: "agent-1" },
        { name: "TestAgent2 (gpt-5)", value: "agent-2" },
      ]);
    });
  });

  describe("Chat Interface", () => {
    it("should create ChatInterface with correct agent", async () => {
      await chatCommand("TestAgent1");

      expect(mockChatInterface).toHaveBeenCalledWith(
        expect.objectContaining({
          agent: expect.objectContaining({
            name: "TestAgent1",
            model: "claude-sonnet-4.5",
          }),
        })
      );
    });

    it("should start the chat interface", async () => {
      await chatCommand("TestAgent1");

      expect(mockChatStart).toHaveBeenCalled();
    });

    it("should provide onMessage callback", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      expect(chatOptions.onMessage).toBeDefined();
      expect(typeof chatOptions.onMessage).toBe("function");
    });

    it("should provide onExit callback", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      expect(chatOptions.onExit).toBeDefined();
      expect(typeof chatOptions.onExit).toBe("function");
    });
  });

  describe("Mock Response Generation", () => {
    it("should generate greeting response for hello", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("Hello");

      expect(response).toContain("Hello!");
      expect(response).toContain("TestAgent1");
    });

    it("should generate greeting response for hi", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("Hi there");

      expect(response).toContain("Hello!");
      expect(response).toContain("TestAgent1");
    });

    it("should generate help response", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("Can you help me?");

      expect(response).toContain("help");
      expect(response).toContain("assist");
    });

    it("should generate name response", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("What is your name?");

      expect(response).toContain("TestAgent1");
      expect(response).toContain("First test agent");
    });

    it("should generate model info response", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("What model are you using?");

      expect(response).toContain("claude-sonnet-4.5");
      expect(response).toContain("0.7");
    });

    it("should generate thank you response", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("Thank you");

      expect(response).toContain("welcome");
    });

    it("should generate goodbye response", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("Goodbye");

      expect(response).toContain("Goodbye");
      expect(response).toContain("nice chatting");
    });

    it("should generate default response for unknown message", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("Random message");

      expect(response).toContain("Random message");
      expect(response).toContain("demo response");
    });

    it("should be case insensitive for keyword matching", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      const response = await chatOptions.onMessage("HELLO");

      expect(response).toContain("Hello!");
    });
  });

  describe("Conversation Saving", () => {
    it("should save conversation on exit", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      chatOptions.onExit();

      expect(writeFileSync).toHaveBeenCalled();
      const savedPath = (writeFileSync as any).mock.calls[0]![0];
      expect(savedPath).toContain("conversations");
      expect(savedPath).toContain("mock-uuid-123.json");
    });

    it("should save conversation with correct structure", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      await chatOptions.onMessage("Hello");
      chatOptions.onExit();

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0]![1]);
      expect(savedData).toMatchObject({
        id: "mock-uuid-123",
        agentId: "agent-1",
        agentName: "TestAgent1",
        channel: "cli",
        userId: "cli_user",
      });
      expect(savedData.messages).toHaveLength(2); // user + assistant
      expect(savedData.startedAt).toBeDefined();
      expect(savedData.updatedAt).toBeDefined();
    });

    it("should save user messages correctly", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      await chatOptions.onMessage("Test message");
      chatOptions.onExit();

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0]![1]);
      const userMessage = savedData.messages.find((m: any) => m.role === "user");

      expect(userMessage).toMatchObject({
        role: "user",
        content: "Test message",
      });
      expect(userMessage.id).toBeDefined();
      expect(userMessage.timestamp).toBeDefined();
    });

    it("should save assistant messages correctly", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      await chatOptions.onMessage("Hello");
      chatOptions.onExit();

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0]![1]);
      const assistantMessage = savedData.messages.find((m: any) => m.role === "assistant");

      expect(assistantMessage).toMatchObject({
        role: "assistant",
        model: "claude-sonnet-4.5",
      });
      expect(assistantMessage.content).toContain("Hello!");
      expect(assistantMessage.id).toBeDefined();
      expect(assistantMessage.timestamp).toBeDefined();
    });

    it("should create conversations directory if it doesn't exist", async () => {
      (existsSync as any).mockImplementation((path: string) => {
        return !path.includes("conversations");
      });

      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      chatOptions.onExit();

      expect(mkdirSync).toHaveBeenCalledWith(
        expect.stringContaining("conversations"),
        { recursive: true }
      );
    });

    it("should handle save errors gracefully", async () => {
      (writeFileSync as any).mockImplementation(() => {
        throw new Error("Write failed");
      });

      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      chatOptions.onExit();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Failed to save conversation"),
        "Write failed"
      );
    });

    it("should show saved conversation ID on exit", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      chatOptions.onExit();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Conversation saved: mock-uuid-123")
      );
    });

    it("should save multiple messages in conversation", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      await chatOptions.onMessage("First message");
      await chatOptions.onMessage("Second message");
      await chatOptions.onMessage("Third message");
      chatOptions.onExit();

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0]![1]);
      expect(savedData.messages).toHaveLength(6); // 3 user + 3 assistant
    });

    it("should update conversation timestamp on each message", async () => {
      await chatCommand("TestAgent1");

      const chatOptions = mockChatInterface.mock.calls[0]![0];
      await chatOptions.onMessage("Message 1");
      await chatOptions.onMessage("Message 2");
      chatOptions.onExit();

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0]![1]);
      // updatedAt should be after startedAt
      const startedAt = new Date(savedData.startedAt).getTime();
      const updatedAt = new Date(savedData.updatedAt).getTime();
      expect(updatedAt).toBeGreaterThanOrEqual(startedAt);
    });
  });

  describe("Edge Cases", () => {
    it("should handle agent selection returning null", async () => {
      const inquirer = await import("inquirer");
      (inquirer.default.prompt as any).mockResolvedValue({ agentId: "nonexistent" });

      await chatCommand();

      // Should not crash, just return early
      expect(mockChatInterface).not.toHaveBeenCalled();
    });

    it("should handle undefined agents property", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({}));

      await chatCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
    });

    it("should handle partial agent name match", async () => {
      await chatCommand("Agent1");

      expect(mockChatInterface).toHaveBeenCalled();
      const chatOptions = mockChatInterface.mock.calls[0]![0];
      expect(chatOptions.agent.name).toBe("TestAgent1");
    });
  });
});
