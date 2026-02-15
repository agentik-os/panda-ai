/**
 * Replay Engine Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { ReplayEngine } from "./replay-engine";
import type { ConvexAdapter, TimelineEvent } from "../storage/convex-adapter";

// Mock ConvexAdapter
const createMockAdapter = (): ConvexAdapter => {
  return {
    replayFromEvent: vi.fn(),
  } as unknown as ConvexAdapter;
};

// Mock ModelRouter
const createMockRouter = () => {
  return {
    route: vi.fn().mockResolvedValue({
      inputTokens: 100,
      outputTokens: 200,
      model: "claude-sonnet-4-5",
    }),
  };
};

describe("ReplayEngine", () => {
  let adapter: ConvexAdapter;
  let router: ReturnType<typeof createMockRouter>;
  let engine: ReplayEngine;

  beforeEach(() => {
    adapter = createMockAdapter();
    router = createMockRouter();
    engine = new ReplayEngine(adapter, router as any);
  });

  describe("replay", () => {
    it("should replay events with override parameters", async () => {
      // Setup mock data
      const originalEvents: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: {
            messages: [{ role: "user", content: "Hello" }],
            model: "claude-opus-4",
            temperature: 0.7,
          },
          cost: 0.05,
        },
      ];

      vi.mocked(adapter.replayFromEvent).mockResolvedValue({
        events: originalEvents,
        totalCost: 0.05,
        duration: 1000,
        startState: {},
        endState: {},
      });

      // Execute replay with model override
      const result = await engine.replay("evt_1", {
        model: "claude-sonnet-4-5",
        temperature: 0.3,
      });

      // Verify
      expect(result.originalCost).toBe(0.05);
      expect(result.replayedEvents).toHaveLength(1);
      expect(result.params.model).toBe("claude-sonnet-4-5");
      expect(result.params.temperature).toBe(0.3);
      expect(router.route).toHaveBeenCalled();
    });

    it("should calculate cost savings", async () => {
      const originalEvents: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: {},
          cost: 0.1, // Expensive
        },
      ];

      vi.mocked(adapter.replayFromEvent).mockResolvedValue({
        events: originalEvents,
        totalCost: 0.1,
        duration: 1000,
        startState: {},
        endState: {},
      });

      router.route.mockResolvedValue({
        inputTokens: 50,
        outputTokens: 100,
        model: "claude-haiku-4-5",
      });

      const result = await engine.replay("evt_1", {
        model: "claude-haiku-4-5",
      });

      expect(result.costSavings).toBeGreaterThan(0); // Should save money
      expect(result.costSavingsPercent).toBeGreaterThan(0);
    });

    it("should stop at specified event ID", async () => {
      const originalEvents: TimelineEvent[] = [
        { id: "evt_1", agentId: "agent_123", eventType: "msg", timestamp: Date.now(), data: {}, cost: 0.01 },
        { id: "evt_2", agentId: "agent_123", eventType: "msg", timestamp: Date.now(), data: {}, cost: 0.01 },
        { id: "evt_3", agentId: "agent_123", eventType: "msg", timestamp: Date.now(), data: {}, cost: 0.01 },
      ];

      vi.mocked(adapter.replayFromEvent).mockResolvedValue({
        events: originalEvents,
        totalCost: 0.03,
        duration: 1000,
        startState: {},
        endState: {},
      });

      const result = await engine.replay("evt_1", {
        stopAtEventId: "evt_2",
      });

      expect(result.replayedEvents.length).toBeLessThan(3); // Should stop early
    });
  });

  describe("compare", () => {
    it("should identify differences between original and replayed events", () => {
      const original: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { output: "Hello from Opus" },
          cost: 0.05,
        },
      ];

      const replayed: TimelineEvent[] = [
        {
          id: "replay-evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { output: "Hello from Sonnet" }, // Different output
          cost: 0.01,
        },
      ];

      const comparison = engine.compare(original, replayed);

      expect(comparison.diff.size).toBeGreaterThan(0); // Should have differences
      expect(comparison.cost.savings).toBeGreaterThan(0); // Should save money
    });

    it("should handle identical events", () => {
      const events: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { output: "Same output" },
          cost: 0.02,
        },
      ];

      const comparison = engine.compare(events, events);

      expect(comparison.diff.size).toBe(0); // No differences
      expect(comparison.cost.savings).toBe(0); // Same cost
    });
  });

  describe("batchReplay", () => {
    it("should replay multiple events", async () => {
      const mockEvents: TimelineEvent[] = [
        { id: "evt_1", agentId: "agent_123", eventType: "msg", timestamp: Date.now(), data: {}, cost: 0.01 },
      ];

      vi.mocked(adapter.replayFromEvent).mockResolvedValue({
        events: mockEvents,
        totalCost: 0.01,
        duration: 100,
        startState: {},
        endState: {},
      });

      const results = await engine.batchReplay(["evt_1", "evt_2", "evt_3"]);

      expect(results).toHaveLength(3);
      expect(adapter.replayFromEvent).toHaveBeenCalledTimes(3);
    });

    it("should continue on error", async () => {
      vi.mocked(adapter.replayFromEvent)
        .mockResolvedValueOnce({
          events: [{ id: "evt_1", agentId: "agent_123", eventType: "msg", timestamp: Date.now(), data: {}, cost: 0.01 }],
          totalCost: 0.01,
          duration: 100,
          startState: {},
          endState: {},
        })
        .mockRejectedValueOnce(new Error("Event not found"))
        .mockResolvedValueOnce({
          events: [{ id: "evt_3", agentId: "agent_123", eventType: "msg", timestamp: Date.now(), data: {}, cost: 0.01 }],
          totalCost: 0.01,
          duration: 100,
          startState: {},
          endState: {},
        });

      const results = await engine.batchReplay(["evt_1", "evt_2", "evt_3"]);

      expect(results).toHaveLength(2); // Should skip failed event
    });
  });
});
