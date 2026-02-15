/**
 * Skill Test Runner
 * Step-130: Simple test runner for skill development
 */

import type { SkillBase } from "../SkillBase.js";
import type { SkillInput, SkillOutput } from "../types.js";
import { createMockContext, type MockContextOptions } from "./mock-runtime.js";

/**
 * Test case definition
 */
export interface TestCase<TInput extends SkillInput = SkillInput> {
  name: string;
  input: TInput;
  expected?: {
    success?: boolean;
    error?: string;
    fields?: Record<string, unknown>;
  };
  timeout?: number;
}

/**
 * Result of a single test case
 */
export interface TestResult {
  name: string;
  passed: boolean;
  duration: number;
  error?: string;
}

/**
 * Aggregate test results
 */
export interface TestResults {
  total: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
}

/**
 * Simple test runner for skills
 *
 * @example
 * ```typescript
 * const runner = new SkillTestRunner(new MySkill());
 * runner.addCase({ name: "basic", input: { query: "hello" }, expected: { success: true } });
 * const results = await runner.run();
 * console.log(`${results.passed}/${results.total} passed`);
 * ```
 */
export class SkillTestRunner<
  TInput extends SkillInput = SkillInput,
  TOutput extends SkillOutput = SkillOutput,
> {
  private skill: SkillBase<TInput, TOutput>;
  private cases: TestCase<TInput>[] = [];
  private contextOptions: MockContextOptions;

  constructor(
    skill: SkillBase<TInput, TOutput>,
    contextOptions: MockContextOptions = {}
  ) {
    this.skill = skill;
    this.contextOptions = contextOptions;
  }

  /**
   * Add a test case
   */
  addCase(testCase: TestCase<TInput>): this {
    this.cases.push(testCase);
    return this;
  }

  /**
   * Add multiple test cases
   */
  addCases(testCases: TestCase<TInput>[]): this {
    this.cases.push(...testCases);
    return this;
  }

  /**
   * Run all test cases
   */
  async run(): Promise<TestResults> {
    const startTime = Date.now();
    const results: TestResult[] = [];

    // Set up mock context
    const ctx = createMockContext(this.contextOptions);
    this.skill.setContext(ctx);

    for (const testCase of this.cases) {
      const caseStart = Date.now();
      let passed = true;
      let error: string | undefined;

      try {
        const result = await this.executeWithTimeout(
          testCase.input,
          testCase.timeout ?? 5000
        );

        // Check expected success
        if (testCase.expected?.success !== undefined) {
          if (result.success !== testCase.expected.success) {
            passed = false;
            error = `Expected success=${testCase.expected.success}, got ${result.success}`;
          }
        }

        // Check expected error message
        if (passed && testCase.expected?.error) {
          if (!result.error?.includes(testCase.expected.error)) {
            passed = false;
            error = `Expected error containing "${testCase.expected.error}", got "${result.error ?? "none"}"`;
          }
        }

        // Check expected fields
        if (passed && testCase.expected?.fields) {
          for (const [key, expectedValue] of Object.entries(
            testCase.expected.fields
          )) {
            const actualValue = (result as Record<string, unknown>)[key];
            if (JSON.stringify(actualValue) !== JSON.stringify(expectedValue)) {
              passed = false;
              error = `Expected ${key}=${JSON.stringify(expectedValue)}, got ${JSON.stringify(actualValue)}`;
              break;
            }
          }
        }
      } catch (err) {
        passed = false;
        error = err instanceof Error ? err.message : String(err);
      }

      results.push({
        name: testCase.name,
        passed,
        duration: Date.now() - caseStart,
        error,
      });
    }

    const totalDuration = Date.now() - startTime;

    return {
      total: results.length,
      passed: results.filter((r) => r.passed).length,
      failed: results.filter((r) => !r.passed).length,
      duration: totalDuration,
      results,
    };
  }

  private async executeWithTimeout(
    input: TInput,
    timeoutMs: number
  ): Promise<TOutput> {
    return Promise.race([
      this.skill.execute(input),
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error(`Test timed out after ${timeoutMs}ms`)),
          timeoutMs
        )
      ),
    ]);
  }
}
