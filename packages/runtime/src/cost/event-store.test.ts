/**
 * Tests for Cost Event Store
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  storeCostEvent,
  cleanupOldEvents,
  removeEventsForAgent,
  type CostEventData,
} from "./event-store";
import type { Id } from "../../../../convex/_generated/dataModel";

// Mock mutation function
const mockMutation = vi.fn();

// Mock the Convex client
vi.mock("../convex-client", () => ({
  getConvexClient: () => ({
    mutation: mockMutation,
  }),
  api: {
    mutations: {
      costs: {
        create: "costs:create",
        cleanup: "costs:cleanup",
        removeForAgent: "costs:removeForAgent",
      },
    },
  },
}));

describe("Cost Event Store", () => {
  beforeEach(() => {
    mockMutation.mockClear();
  });

  describe("storeCostEvent", () => {
    it("should store a cost event to Convex", async () => {
      mockMutation.mockResolvedValue("cost_123");

      const eventData: CostEventData = {
        agentId: "agent_123" as Id<"agents">,
        model: "claude-opus-4",
        provider: "anthropic",
        inputTokens: 1500,
        outputTokens: 800,
        totalTokens: 2300,
        inputCost: 0.045,
        outputCost: 0.12,
        totalCost: 0.165,
        channel: "telegram",
      };

      const result = await storeCostEvent(eventData);

      expect(result).toBe("cost_123");
      expect(mockMutation).toHaveBeenCalledWith("costs:create", {
        agentId: "agent_123",
        conversationId: undefined,
        model: "claude-opus-4",
        provider: "anthropic",
        inputTokens: 1500,
        outputTokens: 800,
        totalTokens: 2300,
        inputCost: 0.045,
        outputCost: 0.12,
        totalCost: 0.165,
        channel: "telegram",
        endpoint: undefined,
        responseTime: undefined,
      });
    });

    it("should store a cost event with all optional fields", async () => {
      mockMutation.mockResolvedValue("cost_456");

      const eventData: CostEventData = {
        agentId: "agent_123" as Id<"agents">,
        conversationId: "conv_789" as Id<"conversations">,
        model: "gpt-4o",
        provider: "openai",
        inputTokens: 2000,
        outputTokens: 1200,
        totalTokens: 3200,
        inputCost: 0.06,
        outputCost: 0.18,
        totalCost: 0.24,
        channel: "cli",
        endpoint: "/api/chat",
        responseTime: 1500,
      };

      const result = await storeCostEvent(eventData);

      expect(result).toBe("cost_456");
      expect(mockMutation).toHaveBeenCalledWith("costs:create", eventData);
    });

    it("should throw an error if Convex mutation fails", async () => {
      mockMutation.mockRejectedValue(new Error("Network error"));

      const eventData: CostEventData = {
        agentId: "agent_123" as Id<"agents">,
        model: "claude-opus-4",
        provider: "anthropic",
        inputTokens: 1500,
        outputTokens: 800,
        totalTokens: 2300,
        inputCost: 0.045,
        outputCost: 0.12,
        totalCost: 0.165,
        channel: "telegram",
      };

      await expect(storeCostEvent(eventData)).rejects.toThrow(
        "Failed to persist cost event to Convex"
      );
    });
  });

  describe("cleanupOldEvents", () => {
    it("should delete old cost events", async () => {
      mockMutation.mockResolvedValue({
        success: true,
        deletedCount: 42,
      });

      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
      const result = await cleanupOldEvents(ninetyDaysAgo);

      expect(result).toBe(42);
      expect(mockMutation).toHaveBeenCalledWith("costs:cleanup", {
        olderThan: ninetyDaysAgo,
      });
    });

    it("should return 0 when no events are deleted", async () => {
      mockMutation.mockResolvedValue({
        success: true,
        deletedCount: 0,
      });

      const result = await cleanupOldEvents(Date.now());

      expect(result).toBe(0);
    });

    it("should throw an error if cleanup fails", async () => {
      mockMutation.mockRejectedValue(new Error("Database error"));

      await expect(cleanupOldEvents(Date.now())).rejects.toThrow(
        "Failed to cleanup cost events from Convex"
      );
    });
  });

  describe("removeEventsForAgent", () => {
    it("should delete all cost events for an agent", async () => {
      mockMutation.mockResolvedValue({
        success: true,
        deletedCount: 15,
      });

      const agentId = "agent_123" as Id<"agents">;
      const result = await removeEventsForAgent(agentId);

      expect(result).toBe(15);
      expect(mockMutation).toHaveBeenCalledWith("costs:removeForAgent", {
        agentId: "agent_123",
      });
    });

    it("should return 0 when agent has no cost events", async () => {
      mockMutation.mockResolvedValue({
        success: true,
        deletedCount: 0,
      });

      const agentId = "agent_empty" as Id<"agents">;
      const result = await removeEventsForAgent(agentId);

      expect(result).toBe(0);
    });

    it("should throw an error if removal fails", async () => {
      mockMutation.mockRejectedValue(new Error("Permission denied"));

      const agentId = "agent_123" as Id<"agents">;

      await expect(removeEventsForAgent(agentId)).rejects.toThrow(
        "Failed to remove agent cost events from Convex"
      );
    });
  });

  describe("Edge Cases", () => {
    it("should handle zero cost events", async () => {
      mockMutation.mockResolvedValue("cost_zero");

      const eventData: CostEventData = {
        agentId: "agent_123" as Id<"agents">,
        model: "claude-haiku-4",
        provider: "anthropic",
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        inputCost: 0,
        outputCost: 0,
        totalCost: 0,
        channel: "cli",
      };

      const result = await storeCostEvent(eventData);

      expect(result).toBe("cost_zero");
    });

    it("should handle large token counts", async () => {
      mockMutation.mockResolvedValue("cost_large");

      const eventData: CostEventData = {
        agentId: "agent_123" as Id<"agents">,
        model: "claude-opus-4",
        provider: "anthropic",
        inputTokens: 150000,
        outputTokens: 50000,
        totalTokens: 200000,
        inputCost: 4.5,
        outputCost: 7.5,
        totalCost: 12.0,
        channel: "api",
      };

      const result = await storeCostEvent(eventData);

      expect(result).toBe("cost_large");
    });

    it("should handle very small fractional costs", async () => {
      mockMutation.mockResolvedValue("cost_micro");

      const eventData: CostEventData = {
        agentId: "agent_123" as Id<"agents">,
        model: "claude-haiku-4",
        provider: "anthropic",
        inputTokens: 100,
        outputTokens: 50,
        totalTokens: 150,
        inputCost: 0.00003,
        outputCost: 0.0000375,
        totalCost: 0.0000675,
        channel: "telegram",
      };

      const result = await storeCostEvent(eventData);

      expect(result).toBe("cost_micro");
    });
  });
});
