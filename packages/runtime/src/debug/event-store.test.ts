/**
 * Tests for Event Store
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { EventStore } from "./event-store.js";
import { ConvexAdapter } from "../storage/convex-adapter.js";

// Mock ConvexAdapter
vi.mock("../storage/convex-adapter.js");

describe("EventStore", () => {
  let eventStore: EventStore;
  let mockAdapter: ConvexAdapter;

  beforeEach(() => {
    mockAdapter = {
      saveEvent: vi.fn().mockResolvedValue("event-123"),
      getEvents: vi.fn().mockResolvedValue([]),
    } as any;

    eventStore = new EventStore({ adapter: mockAdapter });
  });

  describe("Event Creation", () => {
    it("should record session start", async () => {
      const eventId = await eventStore.recordSessionStart(
        "agent-1",
        "session-1",
        { userId: "user-1" }
      );

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "session.start",
        })
      );
    });

    it("should record LLM request", async () => {
      const eventId = await eventStore.recordLLMRequest(
        "agent-1",
        "session-1",
        {
          model: "claude-opus-4-6",
          provider: "anthropic",
          prompt: "Hello",
        }
      );

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "llm.request",
        })
      );
    });

    it("should record LLM response with cost", async () => {
      const eventId = await eventStore.recordLLMResponse(
        "agent-1",
        "session-1",
        {
          model: "claude-opus-4-6",
          provider: "anthropic",
          response: "Hi there!",
          inputTokens: 10,
          outputTokens: 5,
          costUsd: 0.0015,
          latencyMs: 1200,
        },
        "correlation-1"
      );

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "llm.response",
          cost: 0.0015,
        })
      );
    });

    it("should record tool call", async () => {
      const eventId = await eventStore.recordToolCall(
        "agent-1",
        "session-1",
        "tool.request",
        {
          toolName: "fs_read_file",
          arguments: { path: "/file.txt" },
          userApproved: true,
        }
      );

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "tool.request",
        })
      );
    });

    it("should record agent decision", async () => {
      const eventId = await eventStore.recordDecision(
        "agent-1",
        "session-1",
        {
          decision: "Use web search",
          reasoning: "User needs current information",
          confidence: 0.9,
        }
      );

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "agent.decision",
        })
      );
    });

    it("should record memory storage", async () => {
      const eventId = await eventStore.recordMemory("agent-1", "session-1", {
        fact: "User prefers Python",
        importance: 0.8,
      });

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "memory.stored",
        })
      );
    });

    it("should record error", async () => {
      const eventId = await eventStore.recordError("agent-1", "session-1", {
        error: "Network timeout",
        recoverable: true,
      });

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "error.occurred",
        })
      );
    });

    it("should record session end", async () => {
      const eventId = await eventStore.recordSessionEnd(
        "agent-1",
        "session-1",
        { reason: "completed" }
      );

      expect(eventId).toBe("event-123");
      expect(mockAdapter.saveEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
          eventType: "session.end",
        })
      );
    });

    it("should link related events with correlationId", async () => {
      const correlationId = "corr-123";

      await eventStore.recordLLMRequest(
        "agent-1",
        "session-1",
        {
          model: "claude-opus-4-6",
          provider: "anthropic",
          prompt: "Hello",
        },
        correlationId
      );

      await eventStore.recordLLMResponse(
        "agent-1",
        "session-1",
        {
          model: "claude-opus-4-6",
          provider: "anthropic",
          response: "Hi!",
          inputTokens: 10,
          outputTokens: 5,
          costUsd: 0.001,
          latencyMs: 1000,
        },
        correlationId
      );

      expect(mockAdapter.saveEvent).toHaveBeenCalledTimes(2);
      const calls = (mockAdapter.saveEvent as any).mock.calls;
      expect(calls[0][0].data.correlationId).toBe(correlationId);
      expect(calls[1][0].data.correlationId).toBe(correlationId);
    });
  });

  describe("Event Querying", () => {
    it("should query events by session", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "llm.request",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
          payload: {},
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const events = await eventStore.query({ sessionId: "session-1" });

      expect(events).toHaveLength(1);
      expect(events[0].sessionId).toBe("session-1");
    });

    it("should query events by agent", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "llm.request",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
          payload: {},
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const events = await eventStore.query({ agentId: "agent-1" });

      expect(mockAdapter.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          agentId: "agent-1",
        })
      );
    });

    it("should query events by type", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "llm.response",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello",
            inputTokens: 10,
            outputTokens: 5,
            costUsd: 0.001,
            latencyMs: 1000,
          },
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const events = await eventStore.query({ type: "llm.response" });

      expect(events).toHaveLength(1);
      expect(events[0].type).toBe("llm.response");
    });

    it("should query events by multiple types", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "llm.request",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
          payload: {},
        },
        {
          id: "evt-2",
          type: "llm.response",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:01Z",
          version: 1,
          metadata: {},
          payload: {},
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const events = await eventStore.query({
        type: ["llm.request", "llm.response"],
      });

      expect(events).toHaveLength(2);
    });

    it("should query events by time range", async () => {
      await eventStore.getEventsByTimeRange(
        "agent-1",
        "2024-01-01T00:00:00Z",
        "2024-01-02T00:00:00Z"
      );

      expect(mockAdapter.getEvents).toHaveBeenCalledWith(
        expect.objectContaining({
          startTime: Date.parse("2024-01-01T00:00:00Z"),
          endTime: Date.parse("2024-01-02T00:00:00Z"),
        })
      );
    });

    it("should get session events", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "session.start",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const events = await eventStore.getSessionEvents("session-1");

      expect(events).toHaveLength(1);
      expect(events[0].sessionId).toBe("session-1");
    });

    it("should get correlated events", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "llm.request",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
          payload: {},
        },
        {
          id: "evt-2",
          type: "llm.response",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:01Z",
          version: 1,
          metadata: {},
          payload: {},
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const events = await eventStore.getCorrelatedEvents("corr-1");

      expect(events).toHaveLength(2);
      expect(events[0].correlationId).toBe("corr-1");
      expect(events[1].correlationId).toBe("corr-1");
    });
  });

  describe("Cost Calculation", () => {
    it("should calculate session cost", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "llm.response",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1000,
          },
        },
        {
          id: "evt-2",
          type: "llm.response",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-2",
          timestamp: "2024-01-01T00:00:10Z",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Goodbye",
            inputTokens: 80,
            outputTokens: 40,
            costUsd: 0.012,
            latencyMs: 900,
          },
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const cost = await eventStore.getSessionCost("session-1");

      expect(cost).toBe(0.027);
    });
  });

  describe("Statistics", () => {
    it("should calculate agent statistics", async () => {
      const mockEvents = [
        {
          id: "evt-1",
          type: "session.start",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-1",
          timestamp: "2024-01-01T00:00:00Z",
          version: 1,
          metadata: {},
        },
        {
          id: "evt-2",
          type: "llm.response",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-2",
          timestamp: "2024-01-01T00:00:01Z",
          version: 1,
          metadata: {},
          payload: {
            model: "claude-opus-4-6",
            provider: "anthropic",
            response: "Hello",
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.015,
            latencyMs: 1200,
          },
        },
        {
          id: "evt-3",
          type: "session.end",
          sessionId: "session-1",
          agentId: "agent-1",
          correlationId: "corr-3",
          timestamp: "2024-01-01T00:00:10Z",
          version: 1,
          metadata: {},
        },
      ];

      (mockAdapter.getEvents as any).mockResolvedValue(mockEvents);

      const stats = await eventStore.getAgentStats("agent-1");

      expect(stats.totalEvents).toBe(3);
      expect(stats.eventsByType["session.start"]).toBe(1);
      expect(stats.eventsByType["llm.response"]).toBe(1);
      expect(stats.eventsByType["session.end"]).toBe(1);
      expect(stats.totalCost).toBe(0.015);
      expect(stats.avgLatency).toBe(1200);
      expect(stats.sessionCount).toBe(1);
    });
  });
});
