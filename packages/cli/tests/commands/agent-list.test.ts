import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { listAgentsCommand } from "../../src/commands/agent/list";
import type { Agent } from "@agentik-os/shared";
import { readFileSync, existsSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    yellow: (str: string) => str,
    red: (str: string) => str,
    green: (str: string) => str,
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    dim: (str: string) => str,
    bold: (str: string) => str,
  },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  existsSync: vi.fn(),
}));

describe("Agent List Command", () => {
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
      channels: ["cli", "telegram"],
      skills: ["web-search"],
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
      active: false,
      channels: ["api", "discord", "slack"],
      skills: [],
      createdAt: new Date("2024-01-16T00:00:00.000Z") as any,
      updatedAt: new Date("2024-01-16T00:00:00.000Z") as any,
    },
    {
      id: "agent-3",
      name: "VeryLongAgentNameThatExceedsTheColumnWidth",
      description: "Agent with long name",
      systemPrompt: "You are a helpful assistant",
      model: "claude-opus-4.6-with-very-long-model-name",
      temperature: 0.8,
      maxTokens: 8192,
      active: true,
      channels: ["cli", "telegram", "api", "discord", "slack", "whatsapp"],
      skills: ["calendar", "email"],
      createdAt: new Date("2024-01-17T00:00:00.000Z") as any,
      updatedAt: new Date("2024-01-17T00:00:00.000Z") as any,
    },
  ];

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    process.env.HOME = "/tmp/test-home";

    // Default mocks
    (existsSync as any).mockReturnValue(true);
    (readFileSync as any).mockReturnValue(JSON.stringify({ agents: mockAgents }));

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

      await listAgentsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("panda agent create"));
    });

    it("should show message when agents array is empty", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [] }));

      await listAgentsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
    });

    it("should handle corrupted JSON gracefully", async () => {
      (readFileSync as any).mockReturnValue("invalid json {{{");

      await listAgentsCommand();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Error loading agents"),
        expect.any(String)
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
    });
  });

  describe("Table View (Default)", () => {
    it("should display agents in table format", async () => {
      await listAgentsCommand();

      // Header
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agents (3)"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("ID"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("NAME"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("MODEL"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("CHANNELS"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("STATUS"));

      // Agent rows
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("TestAgent1"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("TestAgent2"));
    });

    it("should show total count in footer", async () => {
      await listAgentsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 3 agents"));
    });

    it("should show singular 'agent' for one result", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [mockAgents[0]] }));

      await listAgentsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 1 agent"));
    });

    it("should truncate long agent names", async () => {
      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Should not show the full long name, should be truncated with ...
      expect(allLogs).toContain("VeryLongAgentNam...");
    });

    it("should truncate long model names", async () => {
      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Should truncate long model name
      expect(allLogs).toContain("claude-opus-4.6-...");
    });

    it("should show first 3 channels with +count for more", async () => {
      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // agent-3 has 6 channels, should show "cli, telegram, api +3"
      expect(allLogs).toMatch(/cli, telegram, api \+3/);
    });

    it("should show all channels when 3 or less", async () => {
      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // agent-2 has 3 channels, should show all
      expect(allLogs).toContain("api, discord, slack");
    });

    it("should show status colors (Active vs Inactive)", async () => {
      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("Active");
      expect(allLogs).toContain("Inactive");
    });
  });

  describe("Detailed View", () => {
    it("should display agents in detailed format", async () => {
      await listAgentsCommand({ detailed: true });

      // Should show full agent details
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("TestAgent1"));
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("ID: agent-1"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Description: First test agent")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Model: claude-sonnet-4.5")
      );
    });

    it("should show all channels in detailed view", async () => {
      await listAgentsCommand({ detailed: true });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // agent-3 has 6 channels, should show all in detailed view
      expect(allLogs).toContain("Channels: cli, telegram, api, discord, slack, whatsapp");
    });

    it("should show skills when present", async () => {
      await listAgentsCommand({ detailed: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Skills: web-search"));
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skills: calendar, email")
      );
    });

    it("should not show skills line when empty", async () => {
      await listAgentsCommand({ detailed: true });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Find the section for agent-2 (which has no skills)
      // Split by the divider to get individual agent sections
      const agent2Section = allLogs.split("TestAgent2")[1].split("----")[0];
      // Should not contain "Skills:" in agent-2's section
      expect(agent2Section).not.toContain("Skills:");
    });

    it("should show created date", async () => {
      await listAgentsCommand({ detailed: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Created:"));
    });

    it("should separate agents with divider", async () => {
      await listAgentsCommand({ detailed: true });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      // Should have dividers between agents
      expect(allLogs).toMatch(/-{60}/); // 60 dashes
    });
  });

  describe("Active Filter", () => {
    it("should show only active agents when active=true", async () => {
      await listAgentsCommand({ active: true });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("TestAgent1"); // active
      expect(allLogs).toContain("VeryLongAgentNam..."); // active (truncated)
      expect(allLogs).not.toContain("TestAgent2"); // inactive
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agents (2)"));
    });

    it("should show only inactive agents when active=false", async () => {
      await listAgentsCommand({ active: false });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("TestAgent2"); // inactive
      expect(allLogs).not.toContain("TestAgent1"); // active
      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Agents (1)"));
    });

    it("should show message when no active agents found", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ agents: [mockAgents[1]] }) // Only inactive agent
      );

      await listAgentsCommand({ active: true });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No active agents found")
      );
    });

    it("should show message when no inactive agents found", async () => {
      (readFileSync as any).mockReturnValue(
        JSON.stringify({ agents: [mockAgents[0]] }) // Only active agent
      );

      await listAgentsCommand({ active: false });

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("No inactive agents found")
      );
    });
  });

  describe("Combined Options", () => {
    it("should work with detailed + active filter", async () => {
      await listAgentsCommand({ detailed: true, active: true });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("TestAgent1");
      expect(allLogs).toContain("ID: agent-1");
      expect(allLogs).not.toContain("TestAgent2");
    });

    it("should work with detailed + inactive filter", async () => {
      await listAgentsCommand({ detailed: true, active: false });

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("TestAgent2");
      expect(allLogs).toContain("ID: agent-2");
      expect(allLogs).not.toContain("TestAgent1");
    });
  });

  describe("Edge Cases", () => {
    it("should handle agent with no channels", async () => {
      const agentNoChannels = { ...mockAgents[0], channels: [] };
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [agentNoChannels] }));

      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("none");
    });

    it("should handle agents with exactly 3 channels", async () => {
      const agent3Channels = { ...mockAgents[0], channels: ["a", "b", "c"] };
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [agent3Channels] }));

      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("a, b, c");
      expect(allLogs).not.toContain("+");
    });

    it("should handle agents with exactly 4 channels", async () => {
      const agent4Channels = { ...mockAgents[0], channels: ["a", "b", "c", "d"] };
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [agent4Channels] }));

      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("a, b, c +1");
    });

    it("should handle very short agent name", async () => {
      const shortNameAgent = { ...mockAgents[0], name: "A" };
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [shortNameAgent] }));

      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain("A");
    });

    it("should handle agent with name exactly at truncation limit", async () => {
      // Column width is 20, truncation happens at 19 (20-1)
      const exactLengthName = "X".repeat(19);
      const exactNameAgent = { ...mockAgents[0], name: exactLengthName };
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: [exactNameAgent] }));

      await listAgentsCommand();

      const allLogs = consoleLogSpy.mock.calls.map((call) => call[0]).join("\n");
      expect(allLogs).toContain(exactLengthName);
      expect(allLogs).not.toContain("...");
    });

    it("should handle undefined agents property", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({}));

      await listAgentsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("No agents found"));
    });
  });

  describe("Footer Messages", () => {
    it("should show helpful hint about detailed view", async () => {
      await listAgentsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Use --detailed for more information")
      );
    });

    it("should show total count with correct pluralization", async () => {
      (readFileSync as any).mockReturnValue(JSON.stringify({ agents: mockAgents }));

      await listAgentsCommand();

      expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining("Total: 3 agents"));
    });
  });
});
