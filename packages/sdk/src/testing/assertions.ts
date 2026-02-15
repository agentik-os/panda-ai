/**
 * Assertion Helpers for Skill Testing
 * Step-130: Common assertions for verifying skill behavior
 */

import type { SkillOutput } from "../types.js";

/**
 * Assert that skill execution succeeded
 *
 * @param result - Skill output to check
 * @param message - Optional custom error message
 * @throws Error if result.success is not true
 */
export function assertSkillSuccess(result: SkillOutput, message?: string): void {
  if (!result.success) {
    throw new Error(
      message ??
        `Expected skill to succeed, but it failed${result.error ? `: ${result.error}` : ""}`
    );
  }
}

/**
 * Assert that skill execution failed
 *
 * @param result - Skill output to check
 * @param expectedError - Optional substring to match in error message
 * @throws Error if result.success is not false
 */
export function assertSkillError(
  result: SkillOutput,
  expectedError?: string
): void {
  if (result.success) {
    throw new Error("Expected skill to fail, but it succeeded");
  }

  if (expectedError && result.error) {
    if (!result.error.includes(expectedError)) {
      throw new Error(
        `Expected error to contain "${expectedError}", got "${result.error}"`
      );
    }
  }
}

/**
 * Assert that skill output contains expected fields
 *
 * @param result - Skill output to check
 * @param expected - Object with expected key-value pairs
 * @throws Error if any expected field doesn't match
 */
export function assertSkillOutput(
  result: SkillOutput,
  expected: Record<string, unknown>
): void {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = (result as Record<string, unknown>)[key];
    if (actualValue !== expectedValue) {
      throw new Error(
        `Expected output.${key} to be ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`
      );
    }
  }
}

/**
 * Assert skill metadata matches expected values
 *
 * @param metadata - Skill metadata object
 * @param expected - Expected metadata fields
 * @throws Error if any expected field doesn't match
 */
export function assertSkillMetadata(
  metadata: Record<string, unknown>,
  expected: Record<string, unknown>
): void {
  for (const [key, expectedValue] of Object.entries(expected)) {
    const actualValue = metadata[key];

    if (Array.isArray(expectedValue)) {
      if (!Array.isArray(actualValue)) {
        throw new Error(`Expected metadata.${key} to be an array`);
      }
      if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
        throw new Error(
          `Expected metadata.${key} to be ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`
        );
      }
    } else if (actualValue !== expectedValue) {
      throw new Error(
        `Expected metadata.${key} to be ${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`
      );
    }
  }
}

/**
 * Assert that skill execution completed within time limit
 *
 * @param executeFn - Async function to time
 * @param maxMs - Maximum allowed milliseconds
 * @returns The result of the function
 * @throws Error if execution exceeds time limit
 */
export async function assertExecutionTime<T>(
  executeFn: () => Promise<T>,
  maxMs: number
): Promise<T> {
  const start = Date.now();
  const result = await executeFn();
  const elapsed = Date.now() - start;

  if (elapsed > maxMs) {
    throw new Error(
      `Execution took ${elapsed}ms, exceeding limit of ${maxMs}ms`
    );
  }

  return result;
}
