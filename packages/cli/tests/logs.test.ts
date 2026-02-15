import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockHomeDir, createMockConversation } from "./setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * Logs Command Tests
 *
 * Tests the `panda logs` command including:
 * - Display logic (list and detailed views)
 * - Filtering (by agent, channel, conversation ID)
 * - Limiting results
 * - Empty state handling
 * - Formatting (dates, timestamps, messages)
 * - Error handling (corrupted files)
 */

describe("Logs Command", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;
  let conversationsDir: string;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    conversationsDir = path.join(
      homeSetup.homeDir,
      ".agentik-os",
      "data",
      "conversations"
    );
  });

  afterEach(() => {
    homeSetup.cleanup();
  });

  describe("Empty State", () => {
    it("should display helpful message when no conversations exist", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand();

      console.log = originalLog;

      // Verify empty state message
      expect(logs.some((log) => log.includes("No conversations found"))).toBe(true);
      expect(logs.some((log) => log.includes("panda chat"))).toBe(true);
    });
  });

  describe("List View Mode", () => {
    beforeEach(() => {
      fs.mkdirSync(conversationsDir, { recursive: true });

      // Create test conversations
      const conv1 = createMockConversation({
        agentName: "Agent1",
        channel: "cli",
        messages: [
          {
            id: "msg1",
            role: "user",
            content: "Hello",
            timestamp: new Date("2024-01-01T10:00:00Z"),
          },
          {
            id: "msg2",
            role: "assistant",
            content: "Hi there!",
            timestamp: new Date("2024-01-01T10:00:05Z"),
          },
        ],
        updatedAt: new Date("2024-01-01T10:00:05Z"),
      });

      const conv2 = createMockConversation({
        agentName: "Agent2",
        channel: "telegram",
        messages: [
          {
            id: "msg3",
            role: "user",
            content: "Test",
            timestamp: new Date("2024-01-02T10:00:00Z"),
          },
        ],
        updatedAt: new Date("2024-01-02T10:00:00Z"),
      });

      fs.writeFileSync(
        path.join(conversationsDir, `${conv1.id}.json`),
        JSON.stringify(conv1, null, 2)
      );

      fs.writeFileSync(
        path.join(conversationsDir, `${conv2.id}.json`),
        JSON.stringify(conv2, null, 2)
      );
    });

    it("should display conversations in list format", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand();

      console.log = originalLog;

      // Verify header row
      expect(
        logs.some((log) => log.includes("ID") && log.includes("AGENT"))
      ).toBe(true);
      expect(
        logs.some(
          (log) => log.includes("CHANNEL") && log.includes("MESSAGES")
        )
      ).toBe(true);

      // Verify conversation rows
      expect(logs.some((log) => log.includes("Agent1"))).toBe(true);
      expect(logs.some((log) => log.includes("Agent2"))).toBe(true);
      expect(logs.some((log) => log.includes("cli"))).toBe(true);
      expect(logs.some((log) => log.includes("telegram"))).toBe(true);

      // Verify counts
      expect(logs.some((log) => log.includes("Total: 2 conversation"))).toBe(
        true
      );
    });

    it("should sort conversations by most recent first", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand();

      console.log = originalLog;

      // Find indices of agent names in output
      const agent1Index = logs.findIndex((log) => log.includes("Agent1"));
      const agent2Index = logs.findIndex((log) => log.includes("Agent2"));

      // Agent2 (more recent) should come before Agent1
      expect(agent2Index).toBeLessThan(agent1Index);
    });

    it("should display message counts correctly", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand();

      console.log = originalLog;

      // Agent1 has 2 messages, Agent2 has 1
      expect(logs.some((log) => log.includes("Agent1") && log.includes("2"))).toBe(
        true
      );
      expect(logs.some((log) => log.includes("Agent2") && log.includes("1"))).toBe(
        true
      );
    });

    it("should format relative dates correctly", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand();

      console.log = originalLog;

      // Should contain relative date formatting (exact format depends on current time)
      expect(logs.some((log) => log.match(/ago|just now|\d{1,2}\/\d{1,2}\/\d{4}/))).toBe(
        true
      );
    });
  });

  describe("Filtering", () => {
    beforeEach(() => {
      fs.mkdirSync(conversationsDir, { recursive: true });

      const conv1 = createMockConversation({
        agentId: "agent-1-uuid",
        agentName: "Agent1",
        channel: "cli",
      });

      const conv2 = createMockConversation({
        agentId: "agent-2-uuid",
        agentName: "Agent2",
        channel: "telegram",
      });

      const conv3 = createMockConversation({
        agentId: "agent-1-uuid",
        agentName: "Agent1",
        channel: "api",
      });

      fs.writeFileSync(
        path.join(conversationsDir, `${conv1.id}.json`),
        JSON.stringify(conv1, null, 2)
      );
      fs.writeFileSync(
        path.join(conversationsDir, `${conv2.id}.json`),
        JSON.stringify(conv2, null, 2)
      );
      fs.writeFileSync(
        path.join(conversationsDir, `${conv3.id}.json`),
        JSON.stringify(conv3, null, 2)
      );
    });

    it("should filter by agent name", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ agent: "Agent1" });

      console.log = originalLog;

      // Should show Agent1 conversations (2), not Agent2
      expect(logs.some((log) => log.includes("Agent1"))).toBe(true);
      expect(logs.some((log) => log.includes("Agent2"))).toBe(false);
      expect(logs.some((log) => log.includes("Total: 2 conversation"))).toBe(
        true
      );
    });

    it("should filter by agent ID prefix", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ agent: "agent-2" });

      console.log = originalLog;

      expect(logs.some((log) => log.includes("Agent2"))).toBe(true);
      expect(logs.some((log) => log.includes("Agent1"))).toBe(false);
    });

    it("should filter by channel", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ channel: "telegram" });

      console.log = originalLog;

      expect(logs.some((log) => log.includes("telegram"))).toBe(true);
      expect(logs.some((log) => log.includes("cli"))).toBe(false);
      expect(logs.some((log) => log.includes("api"))).toBe(false);
      expect(logs.some((log) => log.includes("Total: 1 conversation"))).toBe(
        true
      );
    });

    it("should show warning when no conversations match filter", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ agent: "NonExistentAgent" });

      console.log = originalLog;

      expect(
        logs.some((log) =>
          log.includes("No conversations found for agent: NonExistentAgent")
        )
      ).toBe(true);
    });

    it("should show warning when no conversations match channel filter", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ channel: "webhook" });

      console.log = originalLog;

      expect(
        logs.some((log) =>
          log.includes("No conversations found for channel: webhook")
        )
      ).toBe(true);
    });
  });

  describe("Limiting Results", () => {
    beforeEach(() => {
      fs.mkdirSync(conversationsDir, { recursive: true });

      for (let i = 1; i <= 10; i++) {
        const conv = createMockConversation({
          agentName: `Agent${i}`,
          updatedAt: new Date(`2024-01-${String(i).padStart(2, "0")}T10:00:00Z`),
        });

        fs.writeFileSync(
          path.join(conversationsDir, `${conv.id}.json`),
          JSON.stringify(conv, null, 2)
        );
      }
    });

    it("should limit results to specified number", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ limit: 3 });

      console.log = originalLog;

      // Should show exactly 3 conversations
      expect(logs.some((log) => log.includes("Total: 3 conversation"))).toBe(
        true
      );

      // Should show most recent 3 (Agent10, Agent9, Agent8)
      expect(logs.some((log) => /\bAgent10\b/.test(log))).toBe(true);
      expect(logs.some((log) => /\bAgent9\b/.test(log))).toBe(true);
      expect(logs.some((log) => /\bAgent8\b/.test(log))).toBe(true);
      expect(logs.some((log) => /\bAgent1\b/.test(log))).toBe(false);
    });
  });

  describe("Detailed View Mode", () => {
    beforeEach(() => {
      fs.mkdirSync(conversationsDir, { recursive: true });

      const conv = createMockConversation({
        agentName: "DetailedAgent",
        channel: "cli",
        messages: [
          {
            id: "msg1",
            role: "user",
            content: "What is AI?",
            timestamp: new Date("2024-01-01T10:00:00Z"),
          },
          {
            id: "msg2",
            role: "assistant",
            content: "AI stands for Artificial Intelligence...",
            timestamp: new Date("2024-01-01T10:00:05Z"),
            model: "claude-sonnet-4.5",
            tokens: 42,
          },
        ],
      });

      fs.writeFileSync(
        path.join(conversationsDir, `${conv.id}.json`),
        JSON.stringify(conv, null, 2)
      );
    });

    it("should display full conversation when --detailed flag used", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ detailed: true });

      console.log = originalLog;

      // Verify detailed fields shown
      expect(logs.some((log) => log.includes("DetailedAgent"))).toBe(true);
      expect(logs.some((log) => log.includes("What is AI?"))).toBe(true);
      expect(
        logs.some((log) => log.includes("AI stands for Artificial Intelligence"))
      ).toBe(true);
      expect(logs.some((log) => log.includes("claude-sonnet-4.5"))).toBe(true);
      expect(logs.some((log) => log.includes("42 tokens"))).toBe(true);
    });

    it("should show user and assistant labels in detailed view", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ detailed: true });

      console.log = originalLog;

      // Should show role labels (exact formatting depends on chalk)
      expect(logs.some((log) => log.includes("You"))).toBe(true);
      expect(logs.some((log) => log.includes("DetailedAgent"))).toBe(true);
    });
  });

  describe("Specific Conversation View", () => {
    beforeEach(() => {
      fs.mkdirSync(conversationsDir, { recursive: true });

      const conv = createMockConversation({
        id: "specific-conv-uuid",
        agentName: "SpecificAgent",
        messages: [
          {
            id: "msg1",
            role: "user",
            content: "Specific question",
            timestamp: new Date(),
          },
        ],
      });

      fs.writeFileSync(
        path.join(conversationsDir, `${conv.id}.json`),
        JSON.stringify(conv, null, 2)
      );
    });

    it("should display specific conversation when --conversation flag used", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ conversation: "specific-conv" });

      console.log = originalLog;

      // Should show detailed view of this conversation
      expect(logs.some((log) => log.includes("SpecificAgent"))).toBe(true);
      expect(logs.some((log) => log.includes("Specific question"))).toBe(true);
    });

    it("should show warning when conversation ID not found", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand({ conversation: "nonexistent-uuid" });

      console.log = originalLog;

      expect(
        logs.some((log) =>
          log.includes("Conversation not found: nonexistent-uuid")
        )
      ).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should handle corrupted conversation files gracefully", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      fs.mkdirSync(conversationsDir, { recursive: true });

      // Create corrupted JSON
      fs.writeFileSync(
        path.join(conversationsDir, "corrupted.json"),
        "{ invalid json }"
      );

      // Create valid conversation
      const valid = createMockConversation({ agentName: "ValidAgent" });
      fs.writeFileSync(
        path.join(conversationsDir, `${valid.id}.json`),
        JSON.stringify(valid, null, 2)
      );

      const logs: string[] = [];
      const originalLog = console.log;
      const originalWarn = console.warn;
      console.log = (...args: any[]) => logs.push(args.join(" "));
      console.warn = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand();

      console.log = originalLog;
      console.warn = originalWarn;

      // Should warn about corrupted file
      expect(logs.some((log) => log.includes("Skipped corrupted file"))).toBe(
        true
      );

      // But still show valid conversation
      expect(logs.some((log) => log.includes("ValidAgent"))).toBe(true);
    });

    it("should skip non-JSON files in conversations directory", async () => {
      const { logsCommand } = await import("../src/commands/logs.js");

      fs.mkdirSync(conversationsDir, { recursive: true });

      // Create non-JSON file
      fs.writeFileSync(path.join(conversationsDir, "README.txt"), "Not a conversation");

      // Create valid conversation
      const valid = createMockConversation({ agentName: "ValidAgent" });
      fs.writeFileSync(
        path.join(conversationsDir, `${valid.id}.json`),
        JSON.stringify(valid, null, 2)
      );

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await logsCommand();

      console.log = originalLog;

      // Should show only JSON conversations (1)
      expect(logs.some((log) => log.includes("Total: 1 conversation"))).toBe(
        true
      );
    });
  });
});
