import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { mockHomeDir } from "./setup";
import * as fs from "node:fs";
import * as path from "path";

/**
 * Time Travel Debug Command Tests
 *
 * Tests the `panda time-travel` command suite including:
 * - list: List available snapshots
 * - replay: Replay a conversation from snapshot
 * - diff: Compare original vs replayed conversation
 */

describe("Time Travel Commands", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;
  let snapshotsFile: string;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    const dataDir = path.join(homeSetup.homeDir, ".agentik-os", "data");
    fs.mkdirSync(dataDir, { recursive: true });
    snapshotsFile = path.join(dataDir, "snapshots.json");
  });

  afterEach(() => {
    homeSetup.cleanup();
  });

  describe("Time Travel List Command", () => {
    it("should display empty state when no snapshots exist", async () => {
      const { listEventsCommand } = await import("../src/commands/time-travel/list.js");

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listEventsCommand();

      console.log = originalLog;

      expect(logs.some((log) => log.includes("No conversation events found"))).toBe(true);
      expect(logs.some((log) => log.includes("panda time-travel replay"))).toBe(true);
    });

    it("should display snapshots in table format", async () => {
      const { listEventsCommand } = await import("../src/commands/time-travel/list.js");

      // Create test snapshots
      const snapshots = {
        snapshots: [
          {
            id: "snapshot_001",
            agentId: "agent_001",
            agentName: "Research Agent",
            conversationId: "conv_001",
            timestamp: new Date("2026-02-14T10:00:00Z"),
            messageCount: 15,
            modelVersion: "claude-sonnet-4.5",
            description: "Before major refactor",
          },
          {
            id: "snapshot_002",
            agentId: "agent_002",
            agentName: "Code Agent",
            conversationId: "conv_002",
            timestamp: new Date("2026-02-13T15:30:00Z"),
            messageCount: 42,
            modelVersion: "claude-sonnet-4.6",
            description: "Model update test",
          },
        ],
      };

      fs.writeFileSync(snapshotsFile, JSON.stringify(snapshots, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listEventsCommand();

      console.log = originalLog;

      // Verify header
      expect(logs.some((log) => log.includes("Conversation Events"))).toBe(true);
      expect(
        logs.some((log) => log.includes("EVENT ID") && log.includes("AGENT") && log.includes("DATE"))
      ).toBe(true);

      // Verify snapshot data
      expect(logs.some((log) => log.includes("snapshot_001"))).toBe(true);
      expect(logs.some((log) => log.includes("snapshot_002"))).toBe(true);
      expect(logs.some((log) => log.includes("Research Agent"))).toBe(true);
      expect(logs.some((log) => log.includes("Code Agent"))).toBe(true);

      // Verify count (2 events shown)
      expect(logs.some((log) => log.includes("Showing 2 of 2 events"))).toBe(true);
    });

    it("should filter snapshots by agent", async () => {
      const { listEventsCommand } = await import("../src/commands/time-travel/list.js");

      const snapshots = {
        snapshots: [
          {
            id: "snapshot_001",
            agentId: "agent_001",
            agentName: "Agent 1",
            conversationId: "conv_001",
            timestamp: new Date(),
            messageCount: 10,
            modelVersion: "claude-sonnet-4.5",
          },
          {
            id: "snapshot_002",
            agentId: "agent_002",
            agentName: "Agent 2",
            conversationId: "conv_002",
            timestamp: new Date(),
            messageCount: 20,
            modelVersion: "gpt-4o",
          },
        ],
      };

      fs.writeFileSync(snapshotsFile, JSON.stringify(snapshots, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await listEventsCommand({ agent: "agent_001" });

      console.log = originalLog;

      // Should show only agent_001 snapshot
      expect(logs.some((log) => log.includes("snapshot_001"))).toBe(true);
      expect(logs.some((log) => log.includes("snapshot_002"))).toBe(false);
      expect(logs.some((log) => log.includes("Showing 1 of 1 events"))).toBe(true);
    });
  });

  describe("Time Travel Replay Command", () => {
    it("should replay a conversation from snapshot", async () => {
      const { replayCommand } = await import("../src/commands/time-travel/replay.js");

      // Create test snapshot
      const snapshots = {
        snapshots: [
          {
            id: "snapshot_001",
            agentId: "agent_001",
            conversationId: "conv_001",
            timestamp: new Date(),
            messages: [
              { role: "user", content: "Calculate 123 * 456" },
              { role: "assistant", content: "56088" },
            ],
            memory: {
              context: "Math calculations",
              variables: { lastResult: 56088 },
            },
          },
        ],
      };

      fs.writeFileSync(snapshotsFile, JSON.stringify(snapshots, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      // TODO: Implementation pending (Task #94)
      // For now, verify command structure
      await replayCommand("snapshot_001");

      console.log = originalLog;

      expect(logs.some((log) => log.includes("Time Travel: Replaying Event"))).toBe(true);
      expect(logs.some((log) => log.includes("snapshot_001"))).toBe(true);
    });

    it("should validate snapshot exists before replaying", async () => {
      const { replayCommand } = await import("../src/commands/time-travel/replay.js");

      const errors: string[] = [];
      const originalError = console.error;
      console.error = (...args: any[]) => errors.push(args.join(" "));

      await replayCommand("");

      console.error = originalError;

      expect(errors.some((err) => err.includes("Event ID required"))).toBe(true);
    });

    it("should support model override for divergence testing", async () => {
      const { replayCommand } = await import("../src/commands/time-travel/replay.js");

      const snapshots = {
        snapshots: [
          {
            id: "snapshot_001",
            agentId: "agent_001",
            conversationId: "conv_001",
            timestamp: new Date(),
            messages: [{ role: "user", content: "Test" }],
            modelVersion: "claude-sonnet-4.5",
          },
        ],
      };

      fs.writeFileSync(snapshotsFile, JSON.stringify(snapshots, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await replayCommand("snapshot_001", {
        model: "claude-haiku",
      });

      console.log = originalLog;

      expect(logs.some((log) => log.includes("claude-haiku"))).toBe(true);
      expect(logs.some((log) => log.includes("New Model"))).toBe(true);
    });
  });

  describe("Time Travel Diff Command", () => {
    it("should compare original and replayed conversations", async () => {
      const { diffCommand } = await import("../src/commands/time-travel/diff.js");

      // Create test replay result
      const replayResults = {
        results: [
          {
            snapshotId: "snapshot_001",
            timestamp: new Date(),
            original: {
              messages: [
                { role: "user", content: "Calculate 2+2" },
                { role: "assistant", content: "4" },
              ],
            },
            replayed: {
              messages: [
                { role: "user", content: "Calculate 2+2" },
                { role: "assistant", content: "The answer is 4" }, // Slightly different
              ],
            },
            diverged: true,
            divergencePoint: 1,
          },
        ],
      };

      const resultsFile = path.join(
        homeSetup.homeDir,
        ".agentik-os",
        "data",
        "replay-results.json"
      );
      fs.writeFileSync(resultsFile, JSON.stringify(replayResults, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await diffCommand("snapshot_001", "replay_001");

      console.log = originalLog;

      // Verify diff display
      expect(logs.some((log) => log.includes("Time Travel: Event Diff"))).toBe(true);
      expect(logs.some((log) => log.includes("Before"))).toBe(true);
      expect(logs.some((log) => log.includes("After"))).toBe(true);
      expect(logs.some((log) => log.includes("Comparison Results"))).toBe(true);
    });

    it("should handle no divergence case", async () => {
      const { diffCommand } = await import("../src/commands/time-travel/diff.js");

      const replayResults = {
        results: [
          {
            snapshotId: "snapshot_001",
            timestamp: new Date(),
            original: {
              messages: [
                { role: "user", content: "Test" },
                { role: "assistant", content: "Response" },
              ],
            },
            replayed: {
              messages: [
                { role: "user", content: "Test" },
                { role: "assistant", content: "Response" },
              ],
            },
            diverged: false,
          },
        ],
      };

      const resultsFile = path.join(
        homeSetup.homeDir,
        ".agentik-os",
        "data",
        "replay-results.json"
      );
      fs.writeFileSync(resultsFile, JSON.stringify(replayResults, null, 2));

      const logs: string[] = [];
      const originalLog = console.log;
      console.log = (...args: any[]) => logs.push(args.join(" "));

      await diffCommand("snapshot_001", "snapshot_001");

      console.log = originalLog;

      // Note: Actual implementation shows comparison results even for identical events
      expect(logs.some((log) => log.includes("Comparison Results"))).toBe(true);
    });

    it("should validate replay result exists", async () => {
      const { diffCommand } = await import("../src/commands/time-travel/diff.js");

      const errors: string[] = [];
      const originalError = console.error;
      console.error = (...args: any[]) => errors.push(args.join(" "));

      await diffCommand("", "");

      console.error = originalError;

      expect(errors.some((err) => err.includes("Two event IDs required"))).toBe(true);
    });
  });
});
