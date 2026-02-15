/**
 * Tests for Diff Viewer
 */

import { describe, it, expect } from "vitest";
import { DiffViewer } from "./diff.js";
import type { ReplayResult, ReplayState } from "./replay-engine.js";

describe("DiffViewer", () => {
  describe("compare", () => {
    it("should compare two replay results", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 5,
        finalState: {
          eventCount: 5,
          currentEventId: "evt-5",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [
              { role: "user", content: "Hello" },
              { role: "assistant", content: "Hi there!" },
            ],
            memory: ["User prefers Python"],
            toolCalls: 2,
            decisions: ["Use web search"],
          },
          cost: {
            totalUsd: 0.015,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {
              "anthropic/claude-opus-4-6": { cost: 0.015, tokens: 150 },
            },
          },
          errors: [],
        },
        cost: {
          original: 0.015,
        },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 5,
        finalState: {
          eventCount: 5,
          currentEventId: "evt-5",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [
              { role: "user", content: "Hello" },
              { role: "assistant", content: "Hi there!" },
            ],
            memory: ["User prefers Python"],
            toolCalls: 1, // Different
            decisions: ["Use web search"],
          },
          cost: {
            totalUsd: 0.003, // Different (cheaper)
            inputTokens: 100,
            outputTokens: 50,
            byModel: {
              "anthropic/claude-sonnet-4-5": { cost: 0.003, tokens: 150 },
            },
          },
          errors: [],
        },
        cost: {
          original: 0.015,
          replayed: 0.003,
        },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      expect(diff.summary.totalDifferences).toBeGreaterThan(0);
      expect(diff.costAnalysis.originalCost).toBe(0.015);
      expect(diff.costAnalysis.replayedCost).toBe(0.003);
      expect(diff.costAnalysis.savings).toBe(0.012);
      expect(diff.recommendations.length).toBeGreaterThan(0);
    });

    it("should detect conversation changes", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 2,
        finalState: {
          eventCount: 2,
          currentEventId: "evt-2",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [
              { role: "user", content: "Hello" },
              { role: "assistant", content: "Short reply" },
            ],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.01 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 2,
        finalState: {
          eventCount: 2,
          currentEventId: "evt-2",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [
              { role: "user", content: "Hello" },
              {
                role: "assistant",
                content: "Much longer and more detailed reply with lots of information",
              },
            ],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.01, replayed: 0.01 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const conversationDiffs = diff.differences.filter(
        (d) => d.type === "conversation"
      );
      expect(conversationDiffs.length).toBeGreaterThan(0);

      const messageDiff = conversationDiffs.find((d) => d.field === "message[1]");
      expect(messageDiff).toBeDefined();
      expect(messageDiff!.change).toBe("modified");
      expect(messageDiff!.impact).toBe("high"); // Assistant message = high impact
    });

    it("should detect cost changes", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.015,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.015 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.003, // 5x cheaper
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.015, replayed: 0.003 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const costDiff = diff.differences.find((d) => d.type === "cost");
      expect(costDiff).toBeDefined();
      expect(costDiff!.change).toBe("modified");
      expect(costDiff!.impact).toBe("high"); // >20% change = high impact
      expect(diff.costAnalysis.savings).toBe(0.012);
      expect(diff.recommendations.some((r) => r.includes("save"))).toBe(true);
    });

    it("should detect tool call changes", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 5,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.01 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 2, // More efficient
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.01, replayed: 0.01 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const toolDiff = diff.differences.find((d) => d.type === "tools");
      expect(toolDiff).toBeDefined();
      expect(toolDiff!.change).toBe("modified");
      expect(toolDiff!.impact).toBe("medium"); // >2 difference = medium
      expect(diff.recommendations.some((r) => r.includes("fewer tool calls"))).toBe(
        true
      );
    });

    it("should detect error improvements", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [
            { eventId: "evt-1", error: "Network timeout" },
            { eventId: "evt-2", error: "API error" },
          ],
        },
        cost: { original: 0.01 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [], // No errors!
        },
        cost: { original: 0.01, replayed: 0.01 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const errorDiff = diff.differences.find((d) => d.type === "errors");
      expect(errorDiff).toBeDefined();
      expect(errorDiff!.change).toBe("modified");
      expect(errorDiff!.impact).toBe("high"); // Fewer errors = high positive impact
      expect(errorDiff!.description).toContain("reduced");
      expect(errorDiff!.description).toContain("✅");
      expect(
        diff.recommendations.some((r) => r.includes("reduced errors"))
      ).toBe(true);
    });
  });

  describe("compareStates", () => {
    it("should compare states directly", () => {
      const original: ReplayState = {
        eventCount: 5,
        currentEventId: "evt-5",
        timestamp: "2024-01-01T00:01:00Z",
        agentState: {
          conversationHistory: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi!" },
          ],
          memory: [],
          toolCalls: 2,
          decisions: [],
        },
        cost: {
          totalUsd: 0.015,
          inputTokens: 100,
          outputTokens: 50,
          byModel: {},
        },
        errors: [],
      };

      const replayed: ReplayState = {
        eventCount: 5,
        currentEventId: "evt-5",
        timestamp: "2024-01-01T00:01:00Z",
        agentState: {
          conversationHistory: [
            { role: "user", content: "Hello" },
            { role: "assistant", content: "Hi!" },
          ],
          memory: [],
          toolCalls: 2,
          decisions: [],
        },
        cost: {
          totalUsd: 0.003,
          inputTokens: 100,
          outputTokens: 50,
          byModel: {},
        },
        errors: [],
      };

      const diff = DiffViewer.compareStates(original, replayed);

      expect(diff.costAnalysis.originalCost).toBe(0.015);
      expect(diff.costAnalysis.replayedCost).toBe(0.003);
    });
  });

  describe("getConversationDiff", () => {
    it("should detect added messages", () => {
      const original = [{ role: "user", content: "Hello" }];

      const replayed = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ];

      const diffs = DiffViewer.getConversationDiff(original, replayed);

      expect(diffs).toHaveLength(2);
      expect(diffs[1]!.changes[0]!.type).toBe("added");
      expect(diffs[1]!.similarity).toBe(0);
    });

    it("should detect removed messages", () => {
      const original = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi there!" },
      ];

      const replayed = [{ role: "user", content: "Hello" }];

      const diffs = DiffViewer.getConversationDiff(original, replayed);

      expect(diffs).toHaveLength(2);
      expect(diffs[1]!.changes[0]!.type).toBe("removed");
      expect(diffs[1]!.similarity).toBe(0);
    });

    it("should calculate similarity for modified messages", () => {
      const original = [
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi there friend" },
      ];

      const replayed = [
        { role: "user", content: "Hello world" },
        { role: "assistant", content: "Hi friend" },
      ];

      const diffs = DiffViewer.getConversationDiff(original, replayed);

      expect(diffs).toHaveLength(2);
      expect(diffs[0]!.changes).toHaveLength(0); // Identical
      expect(diffs[1]!.changes.length).toBeGreaterThan(0); // Modified
      expect(diffs[1]!.similarity).toBeGreaterThan(0); // Shares "hi" and "friend"
      expect(diffs[1]!.similarity).toBeLessThan(1); // "there" is missing
    });

    it("should handle identical conversations", () => {
      const original = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" },
      ];

      const replayed = [
        { role: "user", content: "Hello" },
        { role: "assistant", content: "Hi!" },
      ];

      const diffs = DiffViewer.getConversationDiff(original, replayed);

      expect(diffs).toHaveLength(2);
      expect(diffs[0]!.changes).toHaveLength(0);
      expect(diffs[1]!.changes).toHaveLength(0);
      expect(diffs[0]!.similarity).toBe(1);
      expect(diffs[1]!.similarity).toBe(1);
    });
  });

  describe("Recommendations", () => {
    it("should recommend switching to cheaper config", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.015,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.015 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.003,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.015, replayed: 0.003 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const savingsRec = diff.recommendations.find((r) => r.includes("save"));
      expect(savingsRec).toBeDefined();
      expect(savingsRec).toContain("✅");
      expect(savingsRec).toContain("$0.0120");
    });

    it("should warn about more expensive config", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.003,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.003 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.015,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.003, replayed: 0.015 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const costWarning = diff.recommendations.find((r) =>
        r.includes("costs $")
      );
      expect(costWarning).toBeDefined();
      expect(costWarning).toContain("⚠️");
    });

    it("should highlight error reduction", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [{ eventId: "evt-1", error: "Error 1" }],
        },
        cost: { original: 0.01 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.01, replayed: 0.01 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const errorRec = diff.recommendations.find((r) => r.includes("errors"));
      expect(errorRec).toBeDefined();
      expect(errorRec).toContain("✅");
      expect(errorRec).toContain("reduced errors by 1");
    });

    it("should note response length increase", () => {
      const original: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [{ role: "assistant", content: "Hi" }],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.01 },
        timeline: [],
      };

      const replayed: ReplayResult = {
        sessionId: "session-1",
        startTime: "2024-01-01T00:00:00Z",
        endTime: "2024-01-01T00:01:00Z",
        totalEvents: 1,
        finalState: {
          eventCount: 1,
          currentEventId: "evt-1",
          timestamp: "2024-01-01T00:01:00Z",
          agentState: {
            conversationHistory: [
              { role: "assistant", content: "Hi" },
              { role: "assistant", content: "Hello" },
            ],
            memory: [],
            toolCalls: 0,
            decisions: [],
          },
          cost: {
            totalUsd: 0.01,
            inputTokens: 100,
            outputTokens: 50,
            byModel: {},
          },
          errors: [],
        },
        cost: { original: 0.01, replayed: 0.01 },
        timeline: [],
      };

      const diff = DiffViewer.compare(original, replayed);

      const lengthRec = diff.recommendations.find((r) => r.includes("longer"));
      expect(lengthRec).toBeDefined();
      expect(lengthRec).toContain("📝");
    });
  });
});
