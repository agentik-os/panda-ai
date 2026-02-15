import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockHomeDir, createMockAgent } from "./setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Agent List Command Tests
 *
 * Tests the `panda agent list` command including:
 * - Display logic (table format)
 * - Filtering by active status
 * - Detailed view mode
 * - Empty state handling
 * - Formatting (channels, dates, truncation)
 */

describe("Agent List Command", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;
  let agentsFile: string;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    agentsFile = path.join(homeSetup.homeDir, ".agentik-os", "data", "agents.json");
  });

  afterEach(() => {
    homeSetup.cleanup();
  });

  describe("Empty State", () => {
    it("should display helpful message when no agents exist", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand();

      console.log = originalLog;

      // Verify empty state message
      expect(logs.some((log) => log.includes("No agents found"))).toBe(true);
      expect(logs.some((log) => log.includes("panda agent create"))).toBe(true);
    });
  });

  describe("Table Display Mode", () => {
    it("should display agents in table format", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      // Create test agents
      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({ name: "Agent1", model: "claude-sonnet-4.5", active: true }),
        createMockAgent({ name: "Agent2", model: "gpt-4o", active: false }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      // Capture console output
      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand();

      console.log = originalLog;

      // Verify header row
      expect(logs.some((log) => log.includes("ID") && log.includes("NAME"))).toBe(true);
      expect(logs.some((log) => log.includes("MODEL") && log.includes("STATUS"))).toBe(true);

      // Verify agent rows
      expect(logs.some((log) => log.includes("Agent1"))).toBe(true);
      expect(logs.some((log) => log.includes("Agent2"))).toBe(true);
      expect(logs.some((log) => log.includes("claude-sonnet-4.5"))).toBe(true);
      expect(logs.some((log) => log.includes("gpt-4o"))).toBe(true);

      // Verify count footer
      expect(logs.some((log) => log.includes("Total: 2 agents"))).toBe(true);
    });

    it("should truncate long agent names", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({
          name: "ThisIsAVeryLongAgentNameThatExceedsTheColumnWidth",
        }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand();

      console.log = originalLog;

      // Should contain truncated name with "..."
      expect(logs.some((log) => log.includes("ThisIsAVeryLongAgent...") || log.includes("..."))).toBe(
        true
      );
    });

    it("should format channels list correctly", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({ channels: ["cli", "telegram", "api"] }),
        createMockAgent({ channels: [] }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand();

      console.log = originalLog;

      // First agent: should show channels
      expect(logs.some((log) => log.includes("cli, telegram, api"))).toBe(true);

      // Second agent: should show "none" for empty channels
      expect(logs.some((log) => log.includes("none"))).toBe(true);
    });

    it("should truncate channels list if more than 3", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({
          channels: ["cli", "telegram", "api", "webhook", "email"],
        }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand();

      console.log = originalLog;

      // Should show first 3 + count of remaining
      expect(logs.some((log) => log.includes("+2"))).toBe(true);
    });

    it("should display active/inactive status correctly", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({ name: "ActiveAgent", active: true }),
        createMockAgent({ name: "InactiveAgent", active: false }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand();

      console.log = originalLog;

      // Should show status indicators (exact text depends on chalk formatting)
      expect(logs.some((log) => log.includes("Active"))).toBe(true);
      expect(logs.some((log) => log.includes("Inactive"))).toBe(true);
    });
  });

  describe("Filtering", () => {
    beforeEach(() => {
      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({ name: "Active1", active: true }),
        createMockAgent({ name: "Active2", active: true }),
        createMockAgent({ name: "Inactive1", active: false }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));
    });

    it("should filter by active status (active=true)", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand({ active: true });

      console.log = originalLog;

      // Should show only active agents
      expect(logs.some((log) => log.includes("Active1"))).toBe(true);
      expect(logs.some((log) => log.includes("Active2"))).toBe(true);
      expect(logs.some((log) => log.includes("Inactive1"))).toBe(false);

      // Count should be 2
      expect(logs.some((log) => log.includes("Total: 2 agent"))).toBe(true);
    });

    it("should filter by active status (active=false)", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand({ active: false });

      console.log = originalLog;

      // Should show only inactive agents
      expect(logs.some((log) => log.includes("Active1"))).toBe(false);
      expect(logs.some((log) => log.includes("Active2"))).toBe(false);
      expect(logs.some((log) => log.includes("Inactive1"))).toBe(true);

      // Count should be 1
      expect(logs.some((log) => log.includes("Total: 1 agent"))).toBe(true);
    });

    it("should show warning if no agents match filter", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      // Create file with only inactive agents
      const agents = [createMockAgent({ active: false })];
      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand({ active: true });

      console.log = originalLog;

      // Should show warning
      expect(logs.some((log) => log.includes("No active agents found"))).toBe(true);
    });
  });

  describe("Detailed View Mode", () => {
    it("should display agents in detailed format when --detailed flag used", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({
          name: "DetailedAgent",
          description: "A test agent for detailed view",
          model: "claude-sonnet-4.5",
          channels: ["cli", "telegram"],
          skills: ["web_search", "code_execution"],
        }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand({ detailed: true });

      console.log = originalLog;

      // Verify detailed fields shown
      expect(logs.some((log) => log.includes("DetailedAgent"))).toBe(true);
      expect(logs.some((log) => log.includes("A test agent for detailed view"))).toBe(true);
      expect(logs.some((log) => log.includes("claude-sonnet-4.5"))).toBe(true);
      expect(logs.some((log) => log.includes("cli, telegram"))).toBe(true);
      expect(logs.some((log) => log.includes("web_search, code_execution"))).toBe(true);
      expect(logs.some((log) => log.includes("ID:"))).toBe(true);
    });

    it("should show separator between agents in detailed view", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      const agents = [
        createMockAgent({ name: "Agent1" }),
        createMockAgent({ name: "Agent2" }),
      ];

      fs.writeFileSync(agentsFile, JSON.stringify({ agents }, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand({ detailed: true });

      console.log = originalLog;

      // Should have separators (lines of dashes)
      expect(logs.some((log) => log.includes("---"))).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle corrupted agents file gracefully", async () => {
      const { listAgentsCommand } = await import("../src/commands/agent/list.js");

      const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
      fs.mkdirSync(dataDir, { recursive: true });

      // Create corrupted JSON
      fs.writeFileSync(agentsFile, "{ invalid json }");

      const logs: string[] = [];
      const originalLog = console.log;
      const originalError = console.error;
      console.log = (...args: any[]) => logs.push(args.join(" "));
      console.error = (...args: any[]) => logs.push(args.join(" "));

      await listAgentsCommand();

      console.log = originalLog;
      console.error = originalError;

      // Should show empty state (corrupted file treated as no agents)
      expect(logs.some((log) => log.includes("No agents found") || log.includes("Error"))).toBe(
        true
      );
    });
  });
});
