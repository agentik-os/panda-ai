import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createAgentCommand, loadAgents } from "../../src/commands/agent/create";
import type { Agent } from "@agentik-os/shared";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

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
    blue: (str: string) => str,
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

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("Agent Create Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;

  const mockAgent: Agent = {
    id: "test-agent-id",
    name: "TestAgent",
    description: "Test agent description",
    systemPrompt: "You are a helpful assistant",
    model: "claude-sonnet-4.5",
    temperature: 0.7,
    maxTokens: 4096,
    active: true,
    channels: ["cli"],
    skills: [],
    createdAt: "2024-01-15T00:00:00.000Z" as any,
    updatedAt: "2024-01-15T00:00:00.000Z" as any,
  };

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });

    process.env.HOME = "/tmp/test-home";

    (existsSync as any).mockReturnValue(false);
    (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [] }));
    (writeFileSync as any).mockImplementation(() => {});
    (mkdirSync as any).mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    processExitSpy.mockRestore();
    delete process.env.HOME;
  });

  describe("loadAgents function", () => {
    it("should return empty array when file doesn't exist", () => {
      (existsSync as any).mockReturnValue(false);

      const result = loadAgents();

      expect(result).toEqual({ agents: [] });
    });

    it("should load existing agents from file", () => {
      const mockAgents = { agents: [mockAgent] };

      (existsSync as any).mockReturnValue(true);
      (readFileSync as any).mockReturnValue(JSON.stringify(mockAgents));

      const result = loadAgents();

      expect(result).toEqual(mockAgents);
    });

    it("should handle corrupted JSON gracefully", () => {
      (existsSync as any).mockReturnValue(true);
      (readFileSync as any).mockReturnValue("invalid json {{{");

      const result = loadAgents();

      expect(result).toEqual({ agents: [] });
      expect(consoleWarnSpy).toHaveBeenCalledWith(expect.stringContaining("Failed to load existing agents"));
    });
  });

  describe("Non-Interactive Mode (--yes)", () => {
    it("should create agent with all options provided", async () => {
      await createAgentCommand("MyAgent", {
        yes: true,
        description: "My agent desc",
        systemPrompt: "Be helpful",
        model: "claude-opus-4.6",
        channels: "cli,api",
        skills: "web-search,calendar",
      });

      expect((writeFileSync as any)).toHaveBeenCalled();
      const savedData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(savedData.agents).toHaveLength(1);
      expect(savedData.agents[0].name).toBe("MyAgent");
      expect(savedData.agents[0].description).toBe("My agent desc");
      expect(savedData.agents[0].model).toBe("claude-opus-4.6");
      expect(savedData.agents[0].channels).toEqual(["cli", "api"]);
      expect(savedData.agents[0].skills).toEqual(["web-search", "calendar"]);
    });

    it("should apply defaults when options not provided", async () => {
      await createAgentCommand("DefaultAgent", { yes: true });

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      const agent = savedData.agents[0];

      expect(agent.name).toBe("DefaultAgent");
      expect(agent.description).toBe("AI agent: DefaultAgent");
      expect(agent.systemPrompt).toBe("You are DefaultAgent, a helpful AI assistant.");
      expect(agent.model).toBe("claude-sonnet-4.5");
      expect(agent.channels).toEqual(["cli"]);
      expect(agent.skills).toEqual([]);
      expect(agent.temperature).toBe(0.7);
      expect(agent.maxTokens).toBe(4096);
      expect(agent.active).toBe(true);
    });

    it("should error when name not provided in non-interactive mode", async () => {
      await expect(createAgentCommand(undefined, { yes: true })).rejects.toThrow("process.exit called");

      expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining("Agent name is required"));
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should append to existing agents file", async () => {
      const existingAgent = { ...mockAgent, id: "existing-1" };

      (existsSync as any).mockReturnValue(true);
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ agents: [existingAgent] })
      );

      await createAgentCommand("NewAgent", { yes: true });

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(savedData.agents).toHaveLength(2);
      expect(savedData.agents[0].id).toBe("existing-1");
      expect(savedData.agents[1].name).toBe("NewAgent");
    });

    it("should create data directory if it doesn't exist", async () => {
      (existsSync as any).mockReturnValue(false);

      await createAgentCommand("TestAgent", { yes: true });

      expect((mkdirSync as any)).toHaveBeenCalledWith(
        expect.stringContaining(".agentik-os/data"),
        { recursive: true }
      );
    });

    it("should show summary before saving", async () => {
      await createAgentCommand("SummaryAgent", {
        yes: true,
        description: "Test description",
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agent Summary"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Basic Info"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Model Configuration"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Channels"));
    });

    it("should show next steps after creation", async () => {
      await createAgentCommand("NextStepsAgent", { yes: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Next steps"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda agent list"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda chat"));
    });
  });

  describe("Interactive Mode", () => {
    it("should prompt for all fields when none provided", async () => {
      const inquirer = await import("inquirer");

      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          name: "InteractiveAgent",
          description: "Interactive desc",
          systemPrompt: "You are interactive",
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
          skills: ["web-search"],
        })
        .mockResolvedValueOnce({
          confirm: true,
        });

      await createAgentCommand();

      expect(inquirer.default.prompt).toHaveBeenCalledTimes(5);
    });

    it("should only prompt for missing fields when some provided", async () => {
      const inquirer = await import("inquirer");

      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          description: "Partial desc",
          systemPrompt: "You are partial",
        })
        .mockResolvedValueOnce({
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

      await createAgentCommand("PartialAgent", { model: "claude-opus-4.6" });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Model: claude-opus-4.6 (from option)")
      );
    });

    it("should cancel creation when user declines confirmation", async () => {
      const inquirer = await import("inquirer");

      (inquirer.default.prompt as any)
        .mockResolvedValueOnce({
          name: "CancelAgent",
          description: "Cancel desc",
          systemPrompt: "You are cancel",
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
          confirm: false,
        });

      await createAgentCommand();

      expect((writeFileSync as any)).not.toHaveBeenCalled();
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("cancelled"));
    });

    it("should show skills in summary when provided", async () => {
      await createAgentCommand("SkillAgent", {
        yes: true,
        skills: "web-search,calendar,email",
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Skills:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("web-search"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("calendar"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("email"));
    });
  });

  describe("Error Handling", () => {
    it("should handle file write error", async () => {
      (writeFileSync as any).mockImplementation(() => {
        throw new Error("Write permission denied");
      });

      await expect(
        createAgentCommand("ErrorAgent", { yes: true })
      ).rejects.toThrow("process.exit called");

      expect(processExitSpy).toHaveBeenCalledWith(1);
    });
  });

  describe("CLI Argument Parsing", () => {
    it("should parse channels from comma-separated string", async () => {
      await createAgentCommand("MultiChannelAgent", {
        yes: true,
        channels: "cli, telegram, api, discord",
      });

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(savedData.agents[0].channels).toEqual(["cli", "telegram", "api", "discord"]);
    });

    it("should parse skills from comma-separated string", async () => {
      await createAgentCommand("MultiSkillAgent", {
        yes: true,
        skills: "web-search, calendar , email",
      });

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(savedData.agents[0].skills).toEqual(["web-search", "calendar", "email"]);
    });

    it("should show provided options in console", async () => {
      await createAgentCommand("ShowOptionsAgent", {
        yes: true,
        description: "My description",
        model: "claude-opus-4.6",
        channels: "cli,api",
        skills: "web-search",
        systemPrompt: "Very long system prompt that will be truncated for display",
      });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Description: My description (from option)")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Model: claude-opus-4.6 (from option)")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Channels: cli, api (from option)")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skills: web-search (from option)")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("System Prompt:")
      );
    });
  });

  describe("Agent Properties", () => {
    it("should generate unique ID for each agent", async () => {
      await createAgentCommand("Agent1", { yes: true });
      await createAgentCommand("Agent2", { yes: true });

      const call1 = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      const call2 = JSON.parse((writeFileSync as any).mock.calls[1][1]);

      expect(call1.agents[0].id).toBeDefined();
      expect(call2.agents[0].id).toBeDefined();
      expect(call1.agents[0].id).not.toBe(call2.agents[0].id);
    });

    it("should set createdAt and updatedAt timestamps", async () => {
      await createAgentCommand("TimestampAgent", { yes: true });

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      const agent = savedData.agents[0];

      expect(agent.createdAt).toBeDefined();
      expect(agent.updatedAt).toBeDefined();
      expect(new Date(agent.createdAt).getTime()).toBeCloseTo(
        new Date(agent.updatedAt).getTime(),
        -2
      );
    });

    it("should set active to true by default", async () => {
      await createAgentCommand("ActiveAgent", { yes: true });

      const savedData = JSON.parse((writeFileSync as any).mock.calls[0][1]);
      expect(savedData.agents[0].active).toBe(true);
    });

    it("should show active status in summary", async () => {
      await createAgentCommand("StatusAgent", { yes: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Status:"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Active:"));
    });
  });
});
