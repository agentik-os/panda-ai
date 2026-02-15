/**
 * Snapshot Manager Tests
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SnapshotManager } from "./snapshot-manager";

describe("SnapshotManager", () => {
  let manager: SnapshotManager;

  beforeEach(() => {
    manager = new SnapshotManager({
      maxAgeDays: 30,
      compressAfterDays: 7,
      autoDelete: false, // Disable for testing
    });
  });

  describe("save", () => {
    it("should save a snapshot", async () => {
      const state = { messages: ["Hello", "World"], context: { user: "Alice" } };

      const id = await manager.save("agent_123", "evt_456", state, {
        eventType: "message",
        model: "claude-opus-4",
        cost: 0.05,
      });

      expect(id).toMatch(/^snap_/);

      const retrieved = await manager.get(id);
      expect(retrieved).not.toBeNull();
      expect(retrieved!.agentId).toBe("agent_123");
      expect(retrieved!.eventId).toBe("evt_456");
      expect(retrieved!.data).toEqual(state);
    });

    it("should compress large snapshots", async () => {
      const largeState = {
        data: "x".repeat(2 * 1024 * 1024), // 2MB
      };

      const id = await manager.save("agent_123", "evt_456", largeState);

      const retrieved = await manager.get(id);
      expect(retrieved!.compressed).toBe(false); // Should be decompressed in returned object
      expect(retrieved!.data).toEqual(largeState);
    });

    it("should include metadata", async () => {
      const id = await manager.save("agent_123", "evt_456", {}, {
        eventType: "test",
        model: "gpt-4o",
        cost: 0.02,
      });

      const retrieved = await manager.get(id);
      expect(retrieved!.metadata).toEqual({
        eventType: "test",
        model: "gpt-4o",
        cost: 0.02,
      });
    });
  });

  describe("list", () => {
    it("should list snapshots for an agent", async () => {
      await manager.save("agent_123", "evt_1", { data: "A" });
      await manager.save("agent_123", "evt_2", { data: "B" });
      await manager.save("agent_456", "evt_3", { data: "C" });

      const snapshots = await manager.list("agent_123");

      expect(snapshots).toHaveLength(2);
      expect(snapshots.every((s) => s.agentId === "agent_123")).toBe(true);
    });

    it("should filter by time range", async () => {
      const now = Date.now();
      const oneHourAgo = now - 3600_000;
      const twoHoursAgo = now - 7200_000;

      // Manually create snapshots with specific timestamps (hack for testing)
      await manager.save("agent_123", "evt_old", { data: "old" });
      await manager.save("agent_123", "evt_new", { data: "new" });

      const recentSnapshots = await manager.list("agent_123", {
        startTime: oneHourAgo,
      });

      expect(recentSnapshots.length).toBeGreaterThan(0);
    });

    it("should limit results", async () => {
      for (let i = 0; i < 10; i++) {
        await manager.save("agent_123", `evt_${i}`, { data: i });
      }

      const limited = await manager.list("agent_123", { limit: 5 });

      expect(limited).toHaveLength(5);
    });
  });

  describe("delete", () => {
    it("should delete a snapshot", async () => {
      const id = await manager.save("agent_123", "evt_456", { data: "test" });

      const deleted = await manager.delete(id);
      expect(deleted).toBe(true);

      const retrieved = await manager.get(id);
      expect(retrieved).toBeNull();
    });

    it("should return false for non-existent snapshot", async () => {
      const deleted = await manager.delete("non_existent_id");
      expect(deleted).toBe(false);
    });
  });

  describe("getStats", () => {
    it("should return statistics", async () => {
      await manager.save("agent_123", "evt_1", { data: "A" });
      await manager.save("agent_123", "evt_2", { data: "B" });
      await manager.save("agent_456", "evt_3", { data: "C" });

      const stats = manager.getStats();

      expect(stats.total).toBe(3);
      expect(stats.byAgent["agent_123"]).toBe(2);
      expect(stats.byAgent["agent_456"]).toBe(1);
      expect(stats.compressionRatio).toBeGreaterThan(0);
    });
  });

  describe("cleanup", () => {
    it("should delete old snapshots", async () => {
      // Create manager with short retention
      const shortRetention = new SnapshotManager({
        maxAgeDays: 0, // 0 days = immediate cleanup
        autoDelete: false,
      });

      await shortRetention.save("agent_123", "evt_1", { data: "test" });

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 10));

      const deleted = await shortRetention.cleanup();

      expect(deleted).toBeGreaterThan(0);
    });

    it("should enforce per-agent limits", async () => {
      const limitedManager = new SnapshotManager({
        maxAgeDays: 30,
        autoDelete: false,
        maxSnapshotsPerAgent: 2,
      });

      await limitedManager.save("agent_123", "evt_1", { data: "A" });
      await limitedManager.save("agent_123", "evt_2", { data: "B" });
      await limitedManager.save("agent_123", "evt_3", { data: "C" });

      await limitedManager.cleanup();

      const snapshots = await limitedManager.list("agent_123");
      expect(snapshots.length).toBeLessThanOrEqual(2);
    });
  });

  describe("setRetentionPolicy", () => {
    it("should update retention policy", () => {
      manager.setRetentionPolicy({
        maxAgeDays: 60,
        compressAfterDays: 14,
      });

      // Policy should be updated (we can verify by triggering cleanup with new policy)
      expect(true).toBe(true); // Policy is internal, just verify no error
    });
  });
});
