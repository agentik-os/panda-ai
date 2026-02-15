/**
 * State Diff Calculator
 *
 * Deep comparison of agent states before/after replay.
 * Identifies what changed: different model output, different tokens used, different cost, etc.
 *
 * Step 113: Deep object comparison with path tracking
 */

// ============================================================================
// Types
// ============================================================================

export type DiffType = "added" | "removed" | "changed" | "unchanged";

export interface DiffEntry {
  /** Path to the changed property (e.g., "data.messages[0].content") */
  path: string;

  /** Type of change */
  type: DiffType;

  /** Original value */
  oldValue: unknown;

  /** New value */
  newValue: unknown;

  /** Human-readable description */
  description?: string;
}

export interface StateDiff {
  /** All changes found */
  changes: DiffEntry[];

  /** Summary statistics */
  summary: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
    total: number;
  };

  /** Whether states are identical */
  isIdentical: boolean;
}

// ============================================================================
// State Diff Calculator
// ============================================================================

export class StateDiffCalculator {
  /**
   * Calculate deep diff between two states
   *
   * @param original - Original state
   * @param replayed - Replayed state
   * @param options - Diff options
   * @returns Detailed diff with all changes
   *
   * @example
   * ```ts
   * const diff = calculator.diff(originalState, replayedState);
   *
   * console.log(`Changes: ${diff.changes.length}`);
   * console.log(`Identical: ${diff.isIdentical}`);
   *
   * diff.changes.forEach(change => {
   *   console.log(`${change.path}: ${change.oldValue} → ${change.newValue}`);
   * });
   * ```
   */
  diff(
    original: unknown,
    replayed: unknown,
    options: { ignorePaths?: string[]; maxDepth?: number } = {},
  ): StateDiff {
    const changes: DiffEntry[] = [];
    const { ignorePaths = [], maxDepth = 10 } = options;

    // Perform deep comparison
    this.compareValues(original, replayed, "", changes, ignorePaths, 0, maxDepth);

    // Calculate summary
    const summary = {
      added: changes.filter((c) => c.type === "added").length,
      removed: changes.filter((c) => c.type === "removed").length,
      changed: changes.filter((c) => c.type === "changed").length,
      unchanged: changes.filter((c) => c.type === "unchanged").length,
      total: changes.length,
    };

    const isIdentical = summary.added === 0 && summary.removed === 0 && summary.changed === 0;

    return {
      changes,
      summary,
      isIdentical,
    };
  }

  /**
   * Get only significant changes (excludes unchanged and metadata)
   *
   * @param diff - Full diff result
   * @returns Filtered changes
   */
  getSignificantChanges(diff: StateDiff): DiffEntry[] {
    return diff.changes.filter(
      (change) =>
        change.type !== "unchanged" &&
        !change.path.includes("timestamp") &&
        !change.path.includes("_id") &&
        !change.path.includes("replayed"),
    );
  }

  /**
   * Format diff as human-readable text
   *
   * @param diff - Diff result
   * @returns Formatted string
   */
  format(diff: StateDiff): string {
    const lines: string[] = [];

    lines.push(`=== State Diff ===`);
    lines.push(`Identical: ${diff.isIdentical ? "✅ Yes" : "❌ No"}`);
    lines.push(``);
    lines.push(`Summary:`);
    lines.push(`  Added: ${diff.summary.added}`);
    lines.push(`  Removed: ${diff.summary.removed}`);
    lines.push(`  Changed: ${diff.summary.changed}`);
    lines.push(`  Total changes: ${diff.summary.total}`);
    lines.push(``);

    if (diff.changes.length > 0) {
      lines.push(`Changes:`);

      const significantChanges = this.getSignificantChanges(diff);

      for (const change of significantChanges.slice(0, 50)) {
        // Limit to 50 for readability
        const icon = change.type === "added" ? "+" : change.type === "removed" ? "-" : "~";
        const oldVal = this.formatValue(change.oldValue);
        const newVal = this.formatValue(change.newValue);

        lines.push(`  ${icon} ${change.path}`);
        if (change.type === "changed") {
          lines.push(`      ${oldVal} → ${newVal}`);
        } else if (change.type === "added") {
          lines.push(`      + ${newVal}`);
        } else if (change.type === "removed") {
          lines.push(`      - ${oldVal}`);
        }
      }

      if (significantChanges.length > 50) {
        lines.push(`  ... and ${significantChanges.length - 50} more changes`);
      }
    }

    return lines.join("\n");
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Recursively compare two values
   */
  private compareValues(
    oldValue: unknown,
    newValue: unknown,
    path: string,
    changes: DiffEntry[],
    ignorePaths: string[],
    depth: number,
    maxDepth: number,
  ): void {
    // Skip ignored paths
    if (ignorePaths.some((ignorePath) => path.startsWith(ignorePath))) {
      return;
    }

    // Prevent infinite recursion
    if (depth >= maxDepth) {
      return;
    }

    // Handle null/undefined
    if (oldValue === null && newValue === null) {
      return; // Both null, no change
    }
    if (oldValue === undefined && newValue === undefined) {
      return; // Both undefined, no change
    }
    if (oldValue === null || oldValue === undefined) {
      changes.push({
        path,
        type: "added",
        oldValue,
        newValue,
        description: `Value added at ${path}`,
      });
      return;
    }
    if (newValue === null || newValue === undefined) {
      changes.push({
        path,
        type: "removed",
        oldValue,
        newValue,
        description: `Value removed from ${path}`,
      });
      return;
    }

    // Handle primitives
    if (this.isPrimitive(oldValue) && this.isPrimitive(newValue)) {
      if (oldValue !== newValue) {
        changes.push({
          path,
          type: "changed",
          oldValue,
          newValue,
          description: `Value changed at ${path}`,
        });
      }
      return;
    }

    // Handle arrays
    if (Array.isArray(oldValue) && Array.isArray(newValue)) {
      this.compareArrays(oldValue, newValue, path, changes, ignorePaths, depth, maxDepth);
      return;
    }

    // Handle objects
    if (typeof oldValue === "object" && typeof newValue === "object") {
      this.compareObjects(
        oldValue as Record<string, unknown>,
        newValue as Record<string, unknown>,
        path,
        changes,
        ignorePaths,
        depth,
        maxDepth,
      );
      return;
    }

    // Type mismatch
    changes.push({
      path,
      type: "changed",
      oldValue,
      newValue,
      description: `Type changed from ${typeof oldValue} to ${typeof newValue} at ${path}`,
    });
  }

  /**
   * Compare two arrays
   */
  private compareArrays(
    oldArray: unknown[],
    newArray: unknown[],
    path: string,
    changes: DiffEntry[],
    ignorePaths: string[],
    depth: number,
    maxDepth: number,
  ): void {
    const maxLength = Math.max(oldArray.length, newArray.length);

    for (let i = 0; i < maxLength; i++) {
      const itemPath = `${path}[${i}]`;

      if (i >= oldArray.length) {
        // Item added
        changes.push({
          path: itemPath,
          type: "added",
          oldValue: undefined,
          newValue: newArray[i],
          description: `Item added at ${itemPath}`,
        });
      } else if (i >= newArray.length) {
        // Item removed
        changes.push({
          path: itemPath,
          type: "removed",
          oldValue: oldArray[i],
          newValue: undefined,
          description: `Item removed from ${itemPath}`,
        });
      } else {
        // Compare items
        this.compareValues(
          oldArray[i],
          newArray[i],
          itemPath,
          changes,
          ignorePaths,
          depth + 1,
          maxDepth,
        );
      }
    }
  }

  /**
   * Compare two objects
   */
  private compareObjects(
    oldObj: Record<string, unknown>,
    newObj: Record<string, unknown>,
    path: string,
    changes: DiffEntry[],
    ignorePaths: string[],
    depth: number,
    maxDepth: number,
  ): void {
    // Get all unique keys
    const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

    for (const key of allKeys) {
      const propPath = path ? `${path}.${key}` : key;

      if (!(key in oldObj)) {
        // Property added
        changes.push({
          path: propPath,
          type: "added",
          oldValue: undefined,
          newValue: newObj[key],
          description: `Property added: ${propPath}`,
        });
      } else if (!(key in newObj)) {
        // Property removed
        changes.push({
          path: propPath,
          type: "removed",
          oldValue: oldObj[key],
          newValue: undefined,
          description: `Property removed: ${propPath}`,
        });
      } else {
        // Compare property values
        this.compareValues(
          oldObj[key],
          newObj[key],
          propPath,
          changes,
          ignorePaths,
          depth + 1,
          maxDepth,
        );
      }
    }
  }

  /**
   * Check if value is primitive
   */
  private isPrimitive(value: unknown): boolean {
    return (
      value === null ||
      value === undefined ||
      typeof value === "string" ||
      typeof value === "number" ||
      typeof value === "boolean"
    );
  }

  /**
   * Format value for display
   */
  private formatValue(value: unknown): string {
    if (value === null) return "null";
    if (value === undefined) return "undefined";
    if (typeof value === "string") return `"${value.slice(0, 100)}"`;
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return String(value);
    if (Array.isArray(value)) return `Array(${value.length})`;
    if (typeof value === "object") return `Object(${Object.keys(value).length} keys)`;
    return String(value);
  }
}
