/**
 * Tests for Budget Checker
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  checkBudget,
  recordCostAgainstBudget,
  shouldAlert,
  enforceLimit,
  isPaused,
  formatBudgetStatus,
  type BudgetStatus,
} from "./budget-checker";
import type { Id } from "../../../../convex/_generated/dataModel";

// Mock Convex client
const mockQuery = vi.fn();
const mockMutation = vi.fn();

vi.mock("../convex-client", () => ({
  getConvexClient: () => ({
    query: mockQuery,
    mutation: mockMutation,
  }),
}));

vi.mock("../../../convex/_generated/api", () => ({
  api: {
    budgets: {
      getByAgent: "budgets:getByAgent",
      recordCost: "budgets:recordCost",
      reset: "budgets:reset",
    },
  },
}));

describe("Budget Checker", () => {
  const mockAgentId = "agent123" as Id<"agents">;
  const mockBudgetId = "budget123" as Id<"budgets">;

  beforeEach(() => {
    mockQuery.mockClear();
    mockMutation.mockClear();
  });

  describe("checkBudget", () => {
    it("should return hasBudget=false when no budget configured", async () => {
      mockQuery.mockResolvedValue(null);

      const status = await checkBudget(mockAgentId);

      expect(status.hasBudget).toBe(false);
      expect(status.exceeded).toBe(false);
      expect(status.shouldAlert).toBe(false);
    });

    it("should return budget status when budget exists", async () => {
      mockQuery.mockResolvedValue({
        _id: mockBudgetId,
        agentId: mockAgentId,
        limitAmount: 10.0,
        currentSpend: 5.0,
        isPaused: false,
        enforcementAction: "warn",
      });

      const status = await checkBudget(mockAgentId);

      expect(status.hasBudget).toBe(true);
      expect(status.exceeded).toBe(false);
      expect(status.currentSpend).toBe(5.0);
      expect(status.limitAmount).toBe(10.0);
      expect(status.percentUsed).toBe(50);
      expect(status.isPaused).toBe(false);
    });

    it("should detect exceeded budget", async () => {
      mockQuery.mockResolvedValue({
        _id: mockBudgetId,
        agentId: mockAgentId,
        limitAmount: 10.0,
        currentSpend: 12.0,
        isPaused: true,
        enforcementAction: "pause",
      });

      const status = await checkBudget(mockAgentId);

      expect(status.exceeded).toBe(true);
      expect(status.percentUsed).toBe(120);
      expect(status.isPaused).toBe(true);
    });
  });

  describe("recordCostAgainstBudget", () => {
    it("should record cost and return status", async () => {
      mockMutation.mockResolvedValue({
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      });

      const status = await recordCostAgainstBudget(mockAgentId, 2.5);

      expect(status.hasBudget).toBe(true);
      expect(status.shouldAlert).toBe(true);
      expect(status.threshold).toBe(75);
      expect(status.currentSpend).toBe(7.5);
      expect(status.percentUsed).toBe(75);
    });

    it("should handle no budget configured", async () => {
      mockMutation.mockRejectedValue(new Error("Budget not found"));

      const status = await recordCostAgainstBudget(mockAgentId, 1.0);

      expect(status.hasBudget).toBe(false);
      expect(status.exceeded).toBe(false);
    });

    it("should detect budget exceeded", async () => {
      mockMutation.mockResolvedValue({
        exceeded: true,
        shouldAlert: true,
        threshold: 100,
        currentSpend: 10.5,
        limitAmount: 10.0,
        percentUsed: 105,
      });

      const status = await recordCostAgainstBudget(mockAgentId, 5.5);

      expect(status.exceeded).toBe(true);
      expect(status.threshold).toBe(100);
      expect(status.isPaused).toBe(true);
    });
  });

  describe("shouldAlert", () => {
    it("should return false when no budget configured", async () => {
      mockQuery.mockResolvedValue(null);

      const result = await shouldAlert(mockAgentId, 5.0, 0);

      expect(result.shouldAlert).toBe(false);
    });

    it("should return true when threshold crossed", async () => {
      mockQuery.mockResolvedValue({
        limitAmount: 10.0,
        thresholds: [50, 75, 90, 100],
      });

      const result = await shouldAlert(mockAgentId, 7.5, 50);

      expect(result.shouldAlert).toBe(true);
      expect(result.threshold).toBe(75);
    });

    it("should return false when threshold not crossed", async () => {
      mockQuery.mockResolvedValue({
        limitAmount: 10.0,
        thresholds: [50, 75, 90, 100],
      });

      const result = await shouldAlert(mockAgentId, 4.0, 0);

      expect(result.shouldAlert).toBe(false);
    });

    it("should not re-alert for same threshold", async () => {
      mockQuery.mockResolvedValue({
        limitAmount: 10.0,
        thresholds: [50, 75, 90, 100],
      });

      const result = await shouldAlert(mockAgentId, 7.6, 75);

      expect(result.shouldAlert).toBe(false);
    });

    it("should return highest threshold crossed", async () => {
      mockQuery.mockResolvedValue({
        limitAmount: 10.0,
        thresholds: [50, 75, 90, 100],
      });

      const result = await shouldAlert(mockAgentId, 9.5, 0);

      expect(result.shouldAlert).toBe(true);
      expect(result.threshold).toBe(90);
    });
  });

  describe("enforceLimit", () => {
    it("should allow execution when no budget", () => {
      const status: BudgetStatus = {
        hasBudget: false,
        exceeded: false,
        shouldAlert: false,
      };

      expect(() => enforceLimit(mockAgentId, status)).not.toThrow();
    });

    it("should allow execution when budget not exceeded", () => {
      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: false,
        currentSpend: 5.0,
        limitAmount: 10.0,
        percentUsed: 50,
      };

      expect(() => enforceLimit(mockAgentId, status)).not.toThrow();
    });

    it("should warn but allow when enforcementAction is warn", () => {
      const consoleSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: true,
        shouldAlert: true,
        enforcementAction: "warn",
        currentSpend: 11.0,
        limitAmount: 10.0,
        percentUsed: 110,
      };

      expect(() => enforceLimit(mockAgentId, status)).not.toThrow();
      expect(consoleSpy).toHaveBeenCalled();

      consoleSpy.mockRestore();
    });

    it("should throw when enforcementAction is pause", () => {
      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: true,
        shouldAlert: true,
        enforcementAction: "pause",
        currentSpend: 11.0,
        limitAmount: 10.0,
        percentUsed: 110,
      };

      expect(() => enforceLimit(mockAgentId, status)).toThrow("paused");
    });

    it("should throw when enforcementAction is block", () => {
      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: true,
        shouldAlert: true,
        enforcementAction: "block",
        currentSpend: 11.0,
        limitAmount: 10.0,
        percentUsed: 110,
      };

      expect(() => enforceLimit(mockAgentId, status)).toThrow("blocked");
    });
  });

  describe("isPaused", () => {
    it("should return false when no budget", async () => {
      mockQuery.mockResolvedValue(null);

      const paused = await isPaused(mockAgentId);

      expect(paused).toBe(false);
    });

    it("should return false when not paused", async () => {
      mockQuery.mockResolvedValue({
        isPaused: false,
      });

      const paused = await isPaused(mockAgentId);

      expect(paused).toBe(false);
    });

    it("should return true when paused", async () => {
      mockQuery.mockResolvedValue({
        isPaused: true,
      });

      const paused = await isPaused(mockAgentId);

      expect(paused).toBe(true);
    });
  });

  describe("formatBudgetStatus", () => {
    it("should format no budget message", () => {
      const status: BudgetStatus = {
        hasBudget: false,
        exceeded: false,
        shouldAlert: false,
      };

      const message = formatBudgetStatus(status);

      expect(message).toBe("No budget configured");
    });

    it("should format OK status", () => {
      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: false,
        currentSpend: 3.0,
        limitAmount: 10.0,
        percentUsed: 30,
      };

      const message = formatBudgetStatus(status);

      expect(message).toContain("✅ Budget OK");
      expect(message).toContain("$3.0000");
      expect(message).toContain("$10.0000");
      expect(message).toContain("30.0%");
    });

    it("should format warning status", () => {
      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: false,
        currentSpend: 8.0,
        limitAmount: 10.0,
        percentUsed: 80,
      };

      const message = formatBudgetStatus(status);

      expect(message).toContain("⚠️ Budget warning");
      expect(message).toContain("80.0%");
    });

    it("should format exceeded status", () => {
      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: true,
        shouldAlert: true,
        currentSpend: 12.0,
        limitAmount: 10.0,
        percentUsed: 120,
      };

      const message = formatBudgetStatus(status);

      expect(message).toContain("⚠️ Budget exceeded");
      expect(message).toContain("$12.0000");
      expect(message).toContain("120.0%");
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero budget limit", async () => {
      mockQuery.mockResolvedValue({
        limitAmount: 0,
        currentSpend: 0,
        isPaused: false,
      });

      const status = await checkBudget(mockAgentId);

      expect(status.percentUsed).toBeNaN(); // 0/0 = NaN
    });

    it("should handle negative costs", async () => {
      mockMutation.mockResolvedValue({
        exceeded: false,
        shouldAlert: false,
        currentSpend: -1.0,
        limitAmount: 10.0,
        percentUsed: -10,
      });

      const status = await recordCostAgainstBudget(mockAgentId, -1.0);

      expect(status.currentSpend).toBe(-1.0);
    });

    it("should handle very small budgets", async () => {
      mockQuery.mockResolvedValue({
        limitAmount: 0.0001,
        currentSpend: 0.00005,
        isPaused: false,
      });

      const status = await checkBudget(mockAgentId);

      expect(status.percentUsed).toBe(50);
    });

    it("should handle very large budgets", async () => {
      mockQuery.mockResolvedValue({
        limitAmount: 1000000,
        currentSpend: 500000,
        isPaused: false,
      });

      const status = await checkBudget(mockAgentId);

      expect(status.percentUsed).toBe(50);
    });
  });
});
