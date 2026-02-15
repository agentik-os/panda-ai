/**
 * Shared Memory Manager - Enable memory sharing across stacked OS Modes
 * Step-088: Implement Mode Stacking with Shared Memory
 */

export interface MemoryEntry {
  id: string;
  category: string;
  modeId: string;
  data: unknown;
  timestamp: Date;
  metadata: Record<string, unknown>;
}

export interface MemoryQuery {
  category?: string;
  modeId?: string;
  after?: Date;
  before?: Date;
  limit?: number;
}

export class SharedMemoryManager {
  private memory: Map<string, MemoryEntry>;
  private categoryIndex: Map<string, Set<string>>; // category -> entry IDs
  private modeIndex: Map<string, Set<string>>; // modeId -> entry IDs
  private categoryOwners: Map<string, Set<string>>; // category -> modeIds that registered it

  constructor() {
    this.memory = new Map();
    this.categoryIndex = new Map();
    this.modeIndex = new Map();
    this.categoryOwners = new Map();
  }

  /**
   * Register a memory category for a mode
   */
  registerCategory(category: string, modeId: string): void {
    if (!this.categoryOwners.has(category)) {
      this.categoryOwners.set(category, new Set());
    }
    this.categoryOwners.get(category)!.add(modeId);
  }

  /**
   * Unregister a memory category for a mode
   */
  unregisterCategory(category: string, modeId: string): void {
    const owners = this.categoryOwners.get(category);
    if (owners) {
      owners.delete(modeId);
      if (owners.size === 0) {
        this.categoryOwners.delete(category);
      }
    }
  }

  /**
   * Store a memory entry
   */
  store(entry: Omit<MemoryEntry, "id" | "timestamp">): string {
    const id = this.generateId();
    const fullEntry: MemoryEntry = {
      ...entry,
      id,
      timestamp: new Date(),
    };

    this.memory.set(id, fullEntry);

    // Update indexes
    if (!this.categoryIndex.has(entry.category)) {
      this.categoryIndex.set(entry.category, new Set());
    }
    this.categoryIndex.get(entry.category)!.add(id);

    if (!this.modeIndex.has(entry.modeId)) {
      this.modeIndex.set(entry.modeId, new Set());
    }
    this.modeIndex.get(entry.modeId)!.add(id);

    return id;
  }

  /**
   * Retrieve memory entries by query
   */
  query(query: MemoryQuery = {}): MemoryEntry[] {
    let results: MemoryEntry[] = [];

    // Filter by category
    if (query.category) {
      const ids = this.categoryIndex.get(query.category);
      if (!ids) return [];
      results = Array.from(ids).map((id) => this.memory.get(id)!);
    }
    // Filter by mode
    else if (query.modeId) {
      const ids = this.modeIndex.get(query.modeId);
      if (!ids) return [];
      results = Array.from(ids).map((id) => this.memory.get(id)!);
    }
    // Get all
    else {
      results = Array.from(this.memory.values());
    }

    // Apply time filters
    if (query.after) {
      results = results.filter((entry) => entry.timestamp >= query.after!);
    }
    if (query.before) {
      results = results.filter((entry) => entry.timestamp <= query.before!);
    }

    // Sort by timestamp (newest first)
    results.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

    // Apply limit
    if (query.limit && query.limit > 0) {
      results = results.slice(0, query.limit);
    }

    return results;
  }

  /**
   * Get a specific memory entry by ID
   */
  get(id: string): MemoryEntry | null {
    return this.memory.get(id) || null;
  }

  /**
   * Update a memory entry
   */
  update(id: string, updates: Partial<Omit<MemoryEntry, "id" | "timestamp">>): boolean {
    const entry = this.memory.get(id);
    if (!entry) return false;

    // If category changed, update category index
    if (updates.category && updates.category !== entry.category) {
      const oldCategoryIds = this.categoryIndex.get(entry.category);
      oldCategoryIds?.delete(id);

      if (!this.categoryIndex.has(updates.category)) {
        this.categoryIndex.set(updates.category, new Set());
      }
      this.categoryIndex.get(updates.category)!.add(id);
    }

    // If modeId changed, update mode index
    if (updates.modeId && updates.modeId !== entry.modeId) {
      const oldModeIds = this.modeIndex.get(entry.modeId);
      oldModeIds?.delete(id);

      if (!this.modeIndex.has(updates.modeId)) {
        this.modeIndex.set(updates.modeId, new Set());
      }
      this.modeIndex.get(updates.modeId)!.add(id);
    }

    // Update entry
    Object.assign(entry, updates);
    return true;
  }

  /**
   * Delete a memory entry
   */
  delete(id: string): boolean {
    const entry = this.memory.get(id);
    if (!entry) return false;

    // Remove from indexes
    this.categoryIndex.get(entry.category)?.delete(id);
    this.modeIndex.get(entry.modeId)?.delete(id);

    // Remove entry
    return this.memory.delete(id);
  }

  /**
   * Get all categories
   */
  getCategories(): string[] {
    return Array.from(this.categoryIndex.keys());
  }

  /**
   * Get modes that own a category
   */
  getCategoryOwners(category: string): string[] {
    const owners = this.categoryOwners.get(category);
    return owners ? Array.from(owners) : [];
  }

  /**
   * Check if a mode has access to a category
   */
  hasAccess(modeId: string, category: string): boolean {
    const owners = this.categoryOwners.get(category);
    return owners?.has(modeId) || false;
  }

  /**
   * Get memory statistics
   */
  getStats(): {
    totalEntries: number;
    categoryCounts: Record<string, number>;
    modeCounts: Record<string, number>;
    oldestEntry: Date | null;
    newestEntry: Date | null;
  } {
    const entries = Array.from(this.memory.values());

    const categoryCounts: Record<string, number> = {};
    for (const [category, ids] of this.categoryIndex.entries()) {
      categoryCounts[category] = ids.size;
    }

    const modeCounts: Record<string, number> = {};
    for (const [modeId, ids] of this.modeIndex.entries()) {
      modeCounts[modeId] = ids.size;
    }

    const timestamps = entries.map((e) => e.timestamp.getTime());

    return {
      totalEntries: this.memory.size,
      categoryCounts,
      modeCounts,
      oldestEntry: timestamps.length > 0 ? new Date(Math.min(...timestamps)) : null,
      newestEntry: timestamps.length > 0 ? new Date(Math.max(...timestamps)) : null,
    };
  }

  /**
   * Clear all memory
   */
  clear(): void {
    this.memory.clear();
    this.categoryIndex.clear();
    this.modeIndex.clear();
    this.categoryOwners.clear();
  }

  /**
   * Clear memory for a specific mode
   */
  clearForMode(modeId: string): void {
    const ids = this.modeIndex.get(modeId);
    if (!ids) return;

    for (const id of ids) {
      const entry = this.memory.get(id);
      if (entry) {
        this.categoryIndex.get(entry.category)?.delete(id);
        this.memory.delete(id);
      }
    }

    this.modeIndex.delete(modeId);
  }

  /**
   * Clear memory for a specific category
   */
  clearCategory(category: string): void {
    const ids = this.categoryIndex.get(category);
    if (!ids) return;

    for (const id of ids) {
      const entry = this.memory.get(id);
      if (entry) {
        this.modeIndex.get(entry.modeId)?.delete(id);
        this.memory.delete(id);
      }
    }

    this.categoryIndex.delete(category);
  }

  /**
   * Generate unique ID for memory entry
   */
  private generateId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  /**
   * Export memory to JSON
   */
  export(): {
    entries: MemoryEntry[];
    categories: string[];
    categoryOwners: Record<string, string[]>;
  } {
    return {
      entries: Array.from(this.memory.values()),
      categories: this.getCategories(),
      categoryOwners: Object.fromEntries(
        Array.from(this.categoryOwners.entries()).map(([cat, owners]) => [
          cat,
          Array.from(owners),
        ])
      ),
    };
  }

  /**
   * Import memory from JSON
   */
  import(data: {
    entries: MemoryEntry[];
    categoryOwners: Record<string, string[]>;
  }): void {
    this.clear();

    // Import category owners
    for (const [category, owners] of Object.entries(data.categoryOwners)) {
      this.categoryOwners.set(category, new Set(owners));
    }

    // Import entries
    for (const entry of data.entries) {
      this.memory.set(entry.id, entry);

      // Rebuild indexes
      if (!this.categoryIndex.has(entry.category)) {
        this.categoryIndex.set(entry.category, new Set());
      }
      this.categoryIndex.get(entry.category)!.add(entry.id);

      if (!this.modeIndex.has(entry.modeId)) {
        this.modeIndex.set(entry.modeId, new Set());
      }
      this.modeIndex.get(entry.modeId)!.add(entry.id);
    }
  }
}
