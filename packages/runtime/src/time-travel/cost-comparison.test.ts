/**
 * Cost Comparison Tests
 */

import { describe, it, expect } from "vitest";
import { CostComparator } from "./cost-comparison";
import type { TimelineEvent } from "../storage/convex-adapter";

describe("CostComparator", () => {
  const comparator = new CostComparator();

  describe("compare", () => {
    it("should calculate cost savings", () => {
      const original: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: {
            model: "claude-opus-4",
            inputTokens: 1000,
            outputTokens: 2000,
            inputCost: 0.015,
            outputCost: 0.15,
          },
          cost: 0.165,
        },
      ];

      const replayed: TimelineEvent[] = [
        {
          id: "replay_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: {
            model: "claude-sonnet-4-5",
            inputTokens: 1000,
            outputTokens: 2000,
            inputCost: 0.003,
            outputCost: 0.03,
          },
          cost: 0.033,
        },
      ];

      const comparison = comparator.compare(original, replayed);

      expect(comparison.original.total).toBe(0.165);
      expect(comparison.replayed.total).toBe(0.033);
      expect(comparison.savings).toBeGreaterThan(0);
      expect(comparison.savingsPercent).toBeGreaterThan(0);
    });

    it("should handle increased costs", () => {
      const original: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { model: "claude-haiku-4-5", inputCost: 0.001, outputCost: 0.005 },
          cost: 0.006,
        },
      ];

      const replayed: TimelineEvent[] = [
        {
          id: "replay_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { model: "claude-opus-4", inputCost: 0.015, outputCost: 0.15 },
          cost: 0.165,
        },
      ];

      const comparison = comparator.compare(original, replayed);

      expect(comparison.savings).toBeLessThan(0); // Negative savings = increased cost
    });

    it("should generate recommendations", () => {
      const original: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { model: "claude-opus-4" },
          cost: 0.1,
        },
      ];

      const replayed: TimelineEvent[] = [
        {
          id: "replay_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { model: "claude-sonnet-4-5" },
          cost: 0.02,
        },
      ];

      const comparison = comparator.compare(original, replayed);

      expect(comparison.recommendations.length).toBeGreaterThan(0);
      expect(comparison.recommendations.some((r) => r.includes("saves"))).toBe(true);
    });
  });

  describe("batchCompare", () => {
    it("should compare multiple executions", () => {
      const batch = [
        {
          original: [{ id: "1", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.1 }],
          replayed: [{ id: "2", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.02 }],
        },
        {
          original: [{ id: "3", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.05 }],
          replayed: [{ id: "4", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.01 }],
        },
      ];

      const result = comparator.batchCompare(batch);

      expect(result.comparisons).toHaveLength(2);
      expect(result.totals.originalCost).toBeCloseTo(0.15);
      expect(result.totals.replayedCost).toBeCloseTo(0.03);
      expect(result.totals.savings).toBeCloseTo(0.12);
    });

    it("should identify best and worst savings", () => {
      const batch = [
        {
          original: [{ id: "1", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.1 }],
          replayed: [{ id: "2", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.01 }], // Best savings: 0.09
        },
        {
          original: [{ id: "3", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.05 }],
          replayed: [{ id: "4", agentId: "a", eventType: "m", timestamp: 0, data: {}, cost: 0.04 }], // Worst savings: 0.01
        },
      ];

      const result = comparator.batchCompare(batch);

      expect(result.bestSavings?.savings).toBeCloseTo(0.09);
      expect(result.worstSavings?.savings).toBeCloseTo(0.01);
    });
  });

  describe("format", () => {
    it("should format comparison as readable text", () => {
      const original: TimelineEvent[] = [
        {
          id: "evt_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { model: "claude-opus-4", inputTokens: 100, outputTokens: 200 },
          cost: 0.05,
        },
      ];

      const replayed: TimelineEvent[] = [
        {
          id: "replay_1",
          agentId: "agent_123",
          eventType: "message",
          timestamp: Date.now(),
          data: { model: "claude-sonnet-4-5", inputTokens: 100, outputTokens: 200 },
          cost: 0.01,
        },
      ];

      const comparison = comparator.compare(original, replayed);
      const formatted = comparator.format(comparison);

      expect(formatted).toContain("Cost Comparison");
      expect(formatted).toContain("claude-opus-4");
      expect(formatted).toContain("claude-sonnet-4-5");
      expect(formatted).toContain("Savings");
    });
  });
});
