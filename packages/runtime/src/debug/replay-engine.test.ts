/**
 * Tests for Replay Engine
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReplayEngine } from "./replay-engine.js";
import { EventStore } from "./event-store.js";
import { ConvexAdapter } from "../storage/convex-adapter.js";
import type { AgentEvent, LLMResponseEvent } from "./event-store.js";

// Mock dependencies
vi.mock("../storage/convex-adapter.js");
vi.mock("./event-store.js");

describe("ReplayEngine", () => {
  let replayEngine: ReplayEngine;
  let mockEventStore: EventStore;
  let mockAdapter: ConvexAdapter;

  beforeEach(() => {
    mockAdapter = {
      replayFromEvent: vi.fn().mockResolvedValue({
        events: [],
        totalCost: 0.05,
        duration: 10000,
        startState: {},
        endState: {},
      }),
    } as any;

    mockEventStore = {
      getSessionEvents: vi.fn(),
      getSessionCost: vi.fn(),
    } as any;

    replayEngine = new ReplayEngine(mockEventStore, mockAdapter);
  });

  describe("Basic Replay", () => {
    it("should replay a complete session", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "session.start",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
        },
        {
          id: "evt-2",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-2",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello!",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
        {
          id: "evt-3",
          type: "session.end",
          timestamp: "2024-01-01T00:00:10Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-3",
          version: 1,
          metadata: {},
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.015);

      const result = await replayEngine.replay({ sessionId: "session-1" });

      expect(result.sessionId).toBe("session-1");
      expect(result.totalEvents).toBe(3);
      expect(result.cost.original).toBe(0.015);
      expect(result.finalState.eventCount).toBe(3);
      expect(result.finalState.cost.totalUsd).toBe(0.015);
    });

    it("should replay from a specific event ID", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "session.start",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
        },
        {
          id: "evt-2",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-2",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello!",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
        {
          id: "evt-3",
          type: "session.end",
          timestamp: "2024-01-01T00:00:10Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-3",
          version: 1,
          metadata: {},
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.015);

      const result = await replayEngine.replayFrom("session-1", "evt-2");

      expect(result.totalEvents).toBe(2); // evt-2 and evt-3
      expect(result.timeline.length).toBe(2);
    });

    it("should replay up to a specific event ID", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "session.start",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
        },
        {
          id: "evt-2",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-2",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello!",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
        {
          id: "evt-3",
          type: "session.end",
          timestamp: "2024-01-01T00:00:10Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-3",
          version: 1,
          metadata: {},
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.015);

      const result = await replayEngine.replayTo("session-1", "evt-2");

      expect(result.totalEvents).toBe(2); // evt-1 and evt-2
      expect(result.timeline.length).toBe(2);
    });

    it("should throw error if session has no events", async () => {
      (mockEventStore.getSessionEvents as any).mockResolvedValue([]);

      await expect(
        replayEngine.replay({ sessionId: "session-empty" })
      ).rejects.toThrow("No events found for session session-empty");
    });
  });

  describe("What-If Analysis", () => {
    it("should replay with different model and compare costs", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello!",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.015);

      const comparison = await replayEngine.whatIf("session-1", {
        model: "claude-sonnet-4-5",
      });

      expect(comparison.original.cost.original).toBe(0.015);
      expect(comparison.replayed.cost.replayed).toBeDefined();
      expect(comparison.diff.costDifference).toBeDefined();
      // Sonnet should be cheaper (5x)
      expect(comparison.diff.costDifference).toBeLessThan(0);
    });

    it("should compare multiple scenarios", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello!",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.015);

      const scenarios = [
        { name: "Sonnet", config: { model: "claude-sonnet-4-5" } },
        { name: "Haiku", config: { model: "claude-haiku-4-5" } },
      ];

      const results = await replayEngine.compareScenarios(
        "session-1",
        scenarios
      );

      expect(results).toHaveLength(2);
      expect(results[0]!.name).toBe("Sonnet");
      expect(results[1]!.name).toBe("Haiku");
      expect(results[0]!.costVsOriginal).toBeLessThan(0); // Cheaper
      expect(results[1]!.costVsOriginal).toBeLessThan(
        results[0]!.costVsOriginal
      ); // Even cheaper
    });
  });

  describe("State Reconstruction", () => {
    it("should reconstruct conversation history", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "llm.request",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            prompt: "Hello",
          },
        },
        {
          id: "evt-2",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hi there!",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.015);

      const result = await replayEngine.replay({ sessionId: "session-1" });

      expect(result.finalState.agentState.conversationHistory).toHaveLength(2);
      expect(result.finalState.agentState.conversationHistory[0]).toEqual({
        role: "user",
        content: "Hello",
      });
      expect(result.finalState.agentState.conversationHistory[1]).toEqual({
        role: "assistant",
        content: "Hi there!",
      });
    });

    it("should track cost by model", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Opus response",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
        {
          id: "evt-2",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:10Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-2",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-sonnet-4-5",
            provider: "anthropic",
            response: "Sonnet response",
            inputTokens: 80,
            outputTokens: 40,
            costUsd: 0.003,
            latencyMs: 900,
          },
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.018);

      const result = await replayEngine.replay({ sessionId: "session-1" });

      expect(result.finalState.cost.totalUsd).toBe(0.018);
      expect(result.finalState.cost.byModel["anthropic/claude-opus-4-6"]).toEqual({
        cost: 0.015,
        tokens: 150,
      });
      expect(result.finalState.cost.byModel["anthropic/claude-sonnet-4-5"]).toEqual({
        cost: 0.003,
        tokens: 120,
      });
    });

    it("should track tool calls", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "tool.request",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            toolName: "web_search",
          },
        },
        {
          id: "evt-2",
          type: "tool.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            toolName: "web_search",
            result: { found: true },
          },
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0);

      const result = await replayEngine.replay({ sessionId: "session-1" });

      expect(result.finalState.agentState.toolCalls).toBe(2);
    });

    it("should track decisions", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "agent.decision",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            decision: "Use web search",
            reasoning: "User needs current info",
            confidence: 0.9,
          },
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0);

      const result = await replayEngine.replay({ sessionId: "session-1" });

      expect(result.finalState.agentState.decisions).toHaveLength(1);
      expect(result.finalState.agentState.decisions[0]).toBe("Use web search");
    });

    it("should track errors", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "error.occurred",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
          payload: {
            error: "Network timeout",
            recoverable: true,
          },
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0);

      const result = await replayEngine.replay({ sessionId: "session-1" });

      expect(result.finalState.errors).toHaveLength(1);
      expect(result.finalState.errors[0]!.error).toBe("Network timeout");
    });
  });

  describe("Timeline", () => {
    it("should build timeline with descriptions", async () => {
      const mockEvents: AgentEvent[] = [
        {
          id: "evt-1",
          type: "session.start",
          timestamp: "2024-01-01T00:00:00Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          version: 1,
          metadata: {},
        },
        {
          id: "evt-2",
          type: "llm.response",
          timestamp: "2024-01-01T00:00:05Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-2",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello!",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
        {
          id: "evt-3",
          type: "session.end",
          timestamp: "2024-01-01T00:00:10Z",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-3",
          version: 1,
          metadata: {},
        },
      ];

      (mockEventStore.getSessionEvents as any).mockResolvedValue(mockEvents);
      (mockEventStore.getSessionCost as any).mockResolvedValue(0.015);

      const result = await replayEngine.replay({ sessionId: "session-1" });

      expect(result.timeline).toHaveLength(3);
      expect(result.timeline[0]!.description).toBe("Session started");
      expect(result.timeline[1]!.description).toContain("50 tokens");
      expect(result.timeline[1]!.description).toContain("$0.0150");
      expect(result.timeline[2]!.description).toBe("Session ended");
    });
  });

  describe("Convex Integration", () => {
    it("should use Convex adapter's replay method", async () => {
      const mockReplayResult = {
        events: [{ id: "evt-1" }],
        totalCost: 0.05,
        duration: 10000,
        startState: { foo: "bar" },
        endState: { foo: "baz" },
      };

      (mockAdapter.replayFromEvent as any).mockResolvedValue(mockReplayResult);

      const result = await replayEngine.replayUsingConvex("evt-123");

      expect(mockAdapter.replayFromEvent).toHaveBeenCalledWith("evt-123");
      expect(result).toEqual(mockReplayResult);
    });
  });
});
