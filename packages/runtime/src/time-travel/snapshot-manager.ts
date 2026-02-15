/**
 * Snapshot Manager
 *
 * Manages state snapshots for time-travel debugging.
 * Handles retention policies, compression, and cleanup.
 *
 * Step 114: Snapshot storage with configurable retention and compression
 */

import { gzip, gunzip } from "node:zlib";
import { promisify } from "node:util";

const gzipAsync = promisify(gzip);
const gunzipAsync = promisify(gunzip);

// ============================================================================
// Types
// ============================================================================

export interface Snapshot {
  /** Unique snapshot ID */
  id: string;

  /** Agent ID */
  agentId: string;

  /** Timeline event ID this snapshot is for */
  eventId: string;

  /** Snapshot timestamp */
  timestamp: number;

  /** State data (compressed if size > threshold) */
  data: unknown;

  /** Whether data is compressed */
  compressed: boolean;

  /** Original size in bytes */
  size: number;

  /** Compressed size in bytes (if compressed) */
  compressedSize?: number;

  /** Metadata */
  metadata?: {
    eventType?: string;
    model?: string;
    cost?: number;
  };
}

export interface SnapshotRetentionPolicy {
  /** Maximum age in days (default: 30) */
  maxAgeDays: number;

  /** Compress snapshots older than X days (default: 7) */
  compressAfterDays: number;

  /** Delete snapshots older than maxAgeDays automatically */
  autoDelete: boolean;

  /** Maximum number of snapshots per agent (default: unlimited) */
  maxSnapshotsPerAgent?: number;
}

export interface SnapshotStats {
  /** Total snapshots */
  total: number;

  /** Total size in bytes (uncompressed) */
  totalSize: number;

  /** Total compressed size */
  totalCompressedSize: number;

  /** Compression ratio */
  compressionRatio: number;

  /** Snapshots by agent */
  byAgent: Record<string, number>;

  /** Oldest snapshot timestamp */
  oldest: number;

  /** Newest snapshot timestamp */
  newest: number;
}

// ============================================================================
// Snapshot Manager
// ============================================================================

export class SnapshotManager {
  private snapshots = new Map<string, Snapshot>();
  private policy: SnapshotRetentionPolicy;

  constructor(policy?: Partial<SnapshotRetentionPolicy>) {
    this.policy = {
      maxAgeDays: policy?.maxAgeDays ?? 30,
      compressAfterDays: policy?.compressAfterDays ?? 7,
      autoDelete: policy?.autoDelete ?? true,
      maxSnapshotsPerAgent: policy?.maxSnapshotsPerAgent,
    };
  }

  /**
   * Save a state snapshot
   *
   * @param agentId - Agent ID
   * @param eventId - Timeline event ID
   * @param state - State to snapshot
   * @param metadata - Optional metadata
   * @returns Snapshot ID
   *
   * @example
   * ```ts
   * const snapshotId = await manager.save(
   *   "agent_123",
   *   "evt_456",
   *   { messages: [...], context: {...} },
   *   { eventType: "message", model: "claude-opus-4", cost: 0.05 }
   * );
   * ```
   */
  async save(
    agentId: string,
    eventId: string,
    state: unknown,
    metadata?: Snapshot["metadata"],
  ): Promise<string> {
    const id = this.generateId();
    const timestamp = Date.now();

    // Serialize state
    const serialized = JSON.stringify(state);
    const size = Buffer.byteLength(serialized, "utf8");

    // Determine if we should compress
    const shouldCompress = this.shouldCompress(timestamp, size);

    let data: unknown = state;
    let compressed = false;
    let compressedSize: number | undefined;

    if (shouldCompress) {
      const buffer = Buffer.from(serialized, "utf8");
      const compressedBuffer = await gzipAsync(buffer);
      data = compressedBuffer.toString("base64");
      compressed = true;
      compressedSize = compressedBuffer.length;
    }

    const snapshot: Snapshot = {
      id,
      agentId,
      eventId,
      timestamp,
      data,
      compressed,
      size,
      compressedSize,
      metadata,
    };

    this.snapshots.set(id, snapshot);

    // Enforce retention policy
    if (this.policy.autoDelete) {
      await this.cleanup();
    }

    return id;
  }

  /**
   * Retrieve a snapshot by ID
   *
   * @param id - Snapshot ID
   * @returns Snapshot with decompressed data, or null if not found
   */
  async get(id: string): Promise<Snapshot | null> {
    const snapshot = this.snapshots.get(id);
    if (!snapshot) return null;

    // Decompress if needed
    if (snapshot.compressed) {
      const buffer = Buffer.from(snapshot.data as string, "base64");
      const decompressed = await gunzipAsync(buffer);
      const data = JSON.parse(decompressed.toString("utf8"));

      return {
        ...snapshot,
        data,
        compressed: false, // Mark as decompressed in returned object
      };
    }

    return snapshot;
  }

  /**
   * List snapshots for an agent
   *
   * @param agentId - Agent ID
   * @param options - Query options
   * @returns Array of snapshots
   */
  async list(
    agentId: string,
    options?: {
      limit?: number;
      startTime?: number;
      endTime?: number;
    },
  ): Promise<Snapshot[]> {
    let results = Array.from(this.snapshots.values()).filter((s) => s.agentId === agentId);

    // Filter by time range
    if (options?.startTime) {
      results = results.filter((s) => s.timestamp >= options.startTime!);
    }
    if (options?.endTime) {
      results = results.filter((s) => s.timestamp <= options.endTime!);
    }

    // Sort by timestamp descending (newest first)
    results.sort((a, b) => b.timestamp - a.timestamp);

    // Limit
    if (options?.limit) {
      results = results.slice(0, options.limit);
    }

    return results;
  }

  /**
   * Delete a snapshot
   *
   * @param id - Snapshot ID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    return this.snapshots.delete(id);
  }

  /**
   * Get snapshot statistics
   *
   * @returns Statistics about all snapshots
   */
  getStats(): SnapshotStats {
    const snapshots = Array.from(this.snapshots.values());

    const totalSize = snapshots.reduce((sum, s) => sum + s.size, 0);
    const totalCompressedSize = snapshots.reduce((sum, s) => sum + (s.compressedSize || s.size), 0);
    const compressionRatio = totalSize > 0 ? totalCompressedSize / totalSize : 1;

    const byAgent: Record<string, number> = {};
    for (const snapshot of snapshots) {
      byAgent[snapshot.agentId] = (byAgent[snapshot.agentId] || 0) + 1;
    }

    const timestamps = snapshots.map((s) => s.timestamp);
    const oldest = timestamps.length > 0 ? Math.min(...timestamps) : 0;
    const newest = timestamps.length > 0 ? Math.max(...timestamps) : 0;

    return {
      total: snapshots.length,
      totalSize,
      totalCompressedSize,
      compressionRatio,
      byAgent,
      oldest,
      newest,
    };
  }

  /**
   * Clean up old snapshots according to retention policy
   *
   * @returns Number of snapshots deleted
   */
  async cleanup(): Promise<number> {
    const now = Date.now();
    const maxAgeMs = this.policy.maxAgeDays * 24 * 60 * 60 * 1000;
    const cutoffTime = now - maxAgeMs;

    let deletedCount = 0;

    // Delete old snapshots
    for (const [id, snapshot] of this.snapshots.entries()) {
      if (snapshot.timestamp < cutoffTime) {
        this.snapshots.delete(id);
        deletedCount++;
      }
    }

    // Enforce per-agent limits
    if (this.policy.maxSnapshotsPerAgent) {
      const byAgent = new Map<string, Snapshot[]>();

      for (const snapshot of this.snapshots.values()) {
        const agentSnapshots = byAgent.get(snapshot.agentId) || [];
        agentSnapshots.push(snapshot);
        byAgent.set(snapshot.agentId, agentSnapshots);
      }

      for (const [_agentId, agentSnapshots] of byAgent.entries()) {
        if (agentSnapshots.length > this.policy.maxSnapshotsPerAgent) {
          // Sort by timestamp descending, keep newest
          agentSnapshots.sort((a, b) => b.timestamp - a.timestamp);
          const toDelete = agentSnapshots.slice(this.policy.maxSnapshotsPerAgent);

          for (const snapshot of toDelete) {
            this.snapshots.delete(snapshot.id);
            deletedCount++;
          }
        }
      }
    }

    return deletedCount;
  }

  /**
   * Compress old snapshots according to policy
   *
   * @returns Number of snapshots compressed
   */
  async compressOld(): Promise<number> {
    const now = Date.now();
    const compressAfterMs = this.policy.compressAfterDays * 24 * 60 * 60 * 1000;
    const compressTime = now - compressAfterMs;

    let compressedCount = 0;

    for (const [id, snapshot] of this.snapshots.entries()) {
      if (!snapshot.compressed && snapshot.timestamp < compressTime) {
        // Compress this snapshot
        const serialized = JSON.stringify(snapshot.data);
        const buffer = Buffer.from(serialized, "utf8");
        const compressedBuffer = await gzipAsync(buffer);

        const updatedSnapshot: Snapshot = {
          ...snapshot,
          data: compressedBuffer.toString("base64"),
          compressed: true,
          compressedSize: compressedBuffer.length,
        };

        this.snapshots.set(id, updatedSnapshot);
        compressedCount++;
      }
    }

    return compressedCount;
  }

  /**
   * Update retention policy
   *
   * @param policy - New retention policy settings
   */
  setRetentionPolicy(policy: Partial<SnapshotRetentionPolicy>): void {
    this.policy = {
      ...this.policy,
      ...policy,
    };
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Generate unique snapshot ID
   */
  private generateId(): string {
    return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Determine if snapshot should be compressed
   */
  private shouldCompress(timestamp: number, size: number): boolean {
    const now = Date.now();
    const ageMs = now - timestamp;
    const compressAfterMs = this.policy.compressAfterDays * 24 * 60 * 60 * 1000;

    // Compress if older than policy threshold OR larger than 1MB
    return ageMs >= compressAfterMs || size > 1024 * 1024;
  }
}
