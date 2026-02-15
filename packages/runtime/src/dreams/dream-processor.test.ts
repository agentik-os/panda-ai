/**
 * Tests for DreamProcessor
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import { DreamProcessor } from "./dream-processor";
import { ConvexAdapter, type ConversationMessage, type Dream } from "../storage/convex-adapter";

describe("DreamProcessor", () => {
  let mockAdapter: ConvexAdapter;
  let processor: DreamProcessor;

  beforeEach(() => {
    // Mock ConvexAdapter
    mockAdapter = {
      listConversations: vi.fn(),
      saveDream: vi.fn(),
      getDreams: vi.fn(),
    } as any;

    processor = new DreamProcessor({
      convexAdapter: mockAdapter,
      lookbackDays: 7,
      minPatternFrequency: 2,
      minInsightConfidence: 0.6,
    });
  });

  describe("processDream", () => {
    it("should process a dream session successfully", async () => {
      // Setup mock conversations
      const mockConversations: ConversationMessage[] = [
        {
          agentId: "agent-1",
          channel: "cli",
          role: "user",
          content: "I prefer TypeScript over JavaScript",
          timestamp: Date.now() - 1000,
        },
        {
          agentId: "agent-1",
          channel: "cli",
          role: "user",
          content: "I prefer TypeScript over JavaScript",
          timestamp: Date.now() - 2000,
        },
        {
          agentId: "agent-1",
          channel: "cli",
          role: "user",
          content: "I prefer TypeScript over JavaScript",
          timestamp: Date.now() - 3000,
        },
      ];

      vi.mocked(mockAdapter.listConversations).mockResolvedValue(mockConversations);
      vi.mocked(mockAdapter.saveDream).mockResolvedValue("dream-123");

      const session = await processor.processDream("agent-1");

      expect(session.agentId).toBe("agent-1");
      expect(session.conversationCount).toBe(3);
      expect(session.patterns.length).toBeGreaterThan(0);
      expect(session.processingTimeMs).toBeGreaterThan(0);

      expect(mockAdapter.listConversations).toHaveBeenCalledWith({
        agentId: "agent-1",
        limit: 1000,
      });
      expect(mockAdapter.saveDream).toHaveBeenCalled();
    });

    it("should throw error when no conversation history", async () => {
      vi.mocked(mockAdapter.listConversations).mockResolvedValue([]);

      await expect(processor.processDream("agent-1")).rejects.toThrow(
        "No conversation history found",
      );
    });

    it("should handle adapter errors gracefully", async () => {
      vi.mocked(mockAdapter.listConversations).mockRejectedValue(
        new Error("Convex connection failed"),
      );

      await expect(processor.processDream("agent-1")).rejects.toThrow(
        "Failed to fetch conversation history",
      );
    });
  });

  describe("generateMorningReport", () => {
    it("should generate a formatted morning report", async () => {
      const mockDream: Dream = {
        id: "dream-123",
        agentId: "agent-1",
        timestamp: Date.now(),
        insights: ["[high] Test Insight"],
        stateSnapshot: {
          patterns: [],
          insights: [
            {
              type: "optimization",
              title: "High Skill Usage",
              description: "Skill used frequently",
              confidence: 0.9,
              priority: "high",
              actionable: true,
            },
          ],
          conversationCount: 10,
          processingTimeMs: 150,
        },
        approved: false,
      };

      vi.mocked(mockAdapter.getDreams).mockResolvedValue([mockDream]);

      const report = await processor.generateMorningReport("agent-1");

      expect(report).toContain("Morning Insights Report");
      expect(report).toContain("High Skill Usage");
      expect(report).toContain("🔴 High Priority");
    });

    it("should handle no dreams gracefully", async () => {
      vi.mocked(mockAdapter.getDreams).mockResolvedValue([]);

      const report = await processor.generateMorningReport("agent-1");

      expect(report).toContain("No dream sessions available");
    });
  });

  describe("processBatch", () => {
    it("should process multiple agents in parallel", async () => {
      const mockConversations: ConversationMessage[] = [
        {
          agentId: "agent-1",
          channel: "cli",
          role: "user",
          content: "test message",
          timestamp: Date.now(),
        },
      ];

      vi.mocked(mockAdapter.listConversations).mockResolvedValue(mockConversations);
      vi.mocked(mockAdapter.saveDream).mockResolvedValue("dream-123");

      const results = await processor.processBatch(["agent-1", "agent-2", "agent-3"]);

      expect(results.size).toBe(3);
    });

    it("should handle partial failures in batch", async () => {
      vi.mocked(mockAdapter.listConversations)
        .mockResolvedValueOnce([
          {
            agentId: "agent-1",
            channel: "cli",
            role: "user",
            content: "test",
            timestamp: Date.now(),
          },
        ])
        .mockRejectedValueOnce(new Error("Failed"))
        .mockResolvedValueOnce([
          {
            agentId: "agent-3",
            channel: "cli",
            role: "user",
            content: "test",
            timestamp: Date.now(),
          },
        ]);

      vi.mocked(mockAdapter.saveDream).mockResolvedValue("dream-123");

      const results = await processor.processBatch(["agent-1", "agent-2", "agent-3"]);

      expect(results.size).toBe(3);

      const agent2Result = results.get("agent-2");
      expect(agent2Result).toBeInstanceOf(Error);
    });
  });

  describe("getDreamStats", () => {
    it("should calculate dream statistics", async () => {
      const mockDreams: Dream[] = [
        {
          id: "dream-1",
          agentId: "agent-1",
          timestamp: Date.now(),
          insights: ["insight1", "insight2"],
          stateSnapshot: {
            patterns: [{ type: "topic" }, { type: "preference" }],
            insights: [{ type: "optimization" }, { type: "pattern" }],
            conversationCount: 100,
            processingTimeMs: 250,
          },
          approved: false,
        },
        {
          id: "dream-2",
          agentId: "agent-1",
          timestamp: Date.now() - 86400000,
          insights: ["insight3"],
          stateSnapshot: {
            patterns: [{ type: "topic" }],
            insights: [{ type: "recommendation" }],
            conversationCount: 50,
            processingTimeMs: 150,
          },
          approved: false,
        },
      ];

      vi.mocked(mockAdapter.getDreams).mockResolvedValue(mockDreams);

      const stats = await processor.getDreamStats("agent-1");

      expect(stats.totalDreams).toBe(2);
      expect(stats.avgPatternsPerDream).toBe(1.5);
      expect(stats.avgInsightsPerDream).toBe(1.5);
      expect(stats.avgProcessingTimeMs).toBe(200);
      expect(stats.lastDreamTime).toBe(mockDreams[0].timestamp);
    });

    it("should return zero stats when no dreams", async () => {
      vi.mocked(mockAdapter.getDreams).mockResolvedValue([]);

      const stats = await processor.getDreamStats("agent-1");

      expect(stats.totalDreams).toBe(0);
      expect(stats.avgPatternsPerDream).toBe(0);
      expect(stats.lastDreamTime).toBeNull();
    });
  });
});
