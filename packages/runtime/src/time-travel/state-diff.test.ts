/**
 * State Diff Calculator Tests
 */

import { describe, it, expect } from "vitest";
import { StateDiffCalculator } from "./state-diff";

describe("StateDiffCalculator", () => {
  const calculator = new StateDiffCalculator();

  describe("diff", () => {
    it("should detect identical objects", () => {
      const obj1 = { a: 1, b: "test", c: true };
      const obj2 = { a: 1, b: "test", c: true };

      const diff = calculator.diff(obj1, obj2);

      expect(diff.isIdentical).toBe(true);
      expect(diff.summary.changed).toBe(0);
    });

    it("should detect changed values", () => {
      const obj1 = { value: "old" };
      const obj2 = { value: "new" };

      const diff = calculator.diff(obj1, obj2);

      expect(diff.isIdentical).toBe(false);
      expect(diff.summary.changed).toBeGreaterThan(0);
      expect(diff.changes).toContainEqual(
        expect.objectContaining({
          path: "value",
          type: "changed",
          oldValue: "old",
          newValue: "new",
        }),
      );
    });

    it("should detect added properties", () => {
      const obj1 = { a: 1 };
      const obj2 = { a: 1, b: 2 };

      const diff = calculator.diff(obj1, obj2);

      expect(diff.summary.added).toBe(1);
      expect(diff.changes).toContainEqual(
        expect.objectContaining({
          path: "b",
          type: "added",
          newValue: 2,
        }),
      );
    });

    it("should detect removed properties", () => {
      const obj1 = { a: 1, b: 2 };
      const obj2 = { a: 1 };

      const diff = calculator.diff(obj1, obj2);

      expect(diff.summary.removed).toBe(1);
      expect(diff.changes).toContainEqual(
        expect.objectContaining({
          path: "b",
          type: "removed",
          oldValue: 2,
        }),
      );
    });

    it("should handle nested objects", () => {
      const obj1 = { user: { name: "Alice", age: 30 } };
      const obj2 = { user: { name: "Bob", age: 30 } };

      const diff = calculator.diff(obj1, obj2);

      expect(diff.changes).toContainEqual(
        expect.objectContaining({
          path: "user.name",
          type: "changed",
          oldValue: "Alice",
          newValue: "Bob",
        }),
      );
    });

    it("should handle arrays", () => {
      const obj1 = { items: [1, 2, 3] };
      const obj2 = { items: [1, 2, 4] };

      const diff = calculator.diff(obj1, obj2);

      expect(diff.changes).toContainEqual(
        expect.objectContaining({
          path: "items[2]",
          type: "changed",
          oldValue: 3,
          newValue: 4,
        }),
      );
    });

    it("should respect max depth", () => {
      const obj1 = { a: { b: { c: { d: { e: "deep" } } } } };
      const obj2 = { a: { b: { c: { d: { e: "changed" } } } } };

      const shallowDiff = calculator.diff(obj1, obj2, { maxDepth: 2 });
      const deepDiff = calculator.diff(obj1, obj2, { maxDepth: 10 });

      expect(shallowDiff.changes.length).toBeLessThan(deepDiff.changes.length);
    });

    it("should ignore specified paths", () => {
      const obj1 = { data: "important", timestamp: 1000 };
      const obj2 = { data: "important", timestamp: 2000 };

      const diff = calculator.diff(obj1, obj2, {
        ignorePaths: ["timestamp"],
      });

      const significantChanges = diff.changes.filter((c) => c.path === "data");
      const ignoredChanges = diff.changes.filter((c) => c.path === "timestamp");

      expect(ignoredChanges.length).toBe(0);
    });
  });

  describe("getSignificantChanges", () => {
    it("should filter out unchanged and metadata", () => {
      const obj1 = { data: "test", timestamp: 1000, _id: "abc" };
      const obj2 = { data: "changed", timestamp: 2000, _id: "def" };

      const diff = calculator.diff(obj1, obj2);
      const significant = calculator.getSignificantChanges(diff);

      const hasTimestamp = significant.some((c) => c.path.includes("timestamp"));
      const hasId = significant.some((c) => c.path.includes("_id"));

      expect(hasTimestamp).toBe(false);
      expect(hasId).toBe(false);
    });
  });

  describe("format", () => {
    it("should format diff as readable text", () => {
      const obj1 = { name: "Alice", age: 30 };
      const obj2 = { name: "Bob", age: 30 };

      const diff = calculator.diff(obj1, obj2);
      const formatted = calculator.format(diff);

      expect(formatted).toContain("State Diff");
      expect(formatted).toContain("name");
      expect(formatted).toContain("Alice");
      expect(formatted).toContain("Bob");
    });
  });
});
