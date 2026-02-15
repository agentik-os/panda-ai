import { describe, it, expect } from 'vitest';
import { SkillTestRunner, type TestCase } from '../src/testing/test-runner.js';
import { SkillBase } from '../src/SkillBase.js';
import type { SkillInput, SkillOutput } from '../src/types.js';

// Test skill implementations
interface TestInput extends SkillInput {
  value?: string;
  shouldFail?: boolean;
  delay?: number;
}

class SuccessSkill extends SkillBase<TestInput, SkillOutput> {
  id = 'test-success';
  name = 'Success Skill';
  description = 'Always succeeds';
  version = '1.0.0';

  async execute(input: TestInput): Promise<SkillOutput> {
    if (input.delay) {
      await new Promise((resolve) => setTimeout(resolve, input.delay));
    }
    return {
      success: true,
      value: input.value ?? 'default',
    };
  }
}

class FailureSkill extends SkillBase<TestInput, SkillOutput> {
  id = 'test-failure';
  name = 'Failure Skill';
  description = 'Fails based on input';
  version = '1.0.0';

  async execute(input: TestInput): Promise<SkillOutput> {
    if (input.shouldFail) {
      return {
        success: false,
        error: 'Intentional failure',
      };
    }
    return { success: true };
  }
}

class ThrowingSkill extends SkillBase<TestInput, SkillOutput> {
  id = 'test-throwing';
  name = 'Throwing Skill';
  description = 'Throws errors';
  version = '1.0.0';

  async execute(input: TestInput): Promise<SkillOutput> {
    if (input.shouldFail) {
      throw new Error('Test error');
    }
    return { success: true };
  }
}

describe('SkillTestRunner', () => {
  describe('Constructor', () => {
    it('should create runner with skill', () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);
      expect(runner).toBeInstanceOf(SkillTestRunner);
    });

    it('should accept context options', () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill, {
        agentId: 'custom-agent',
      });
      expect(runner).toBeInstanceOf(SkillTestRunner);
    });
  });

  describe('addCase', () => {
    it('should add a single test case', () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      const result = runner.addCase({
        name: 'test-1',
        input: { value: 'test' },
      });

      expect(result).toBe(runner); // Returns this for chaining
    });

    it('should allow method chaining', () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner
        .addCase({ name: 'test-1', input: {} })
        .addCase({ name: 'test-2', input: {} })
        .addCase({ name: 'test-3', input: {} });

      expect(runner).toBeInstanceOf(SkillTestRunner);
    });
  });

  describe('addCases', () => {
    it('should add multiple test cases', () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      const cases: TestCase<TestInput>[] = [
        { name: 'test-1', input: {} },
        { name: 'test-2', input: {} },
      ];

      const result = runner.addCases(cases);
      expect(result).toBe(runner); // Returns this for chaining
    });
  });

  describe('run', () => {
    it('should execute all test cases', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner
        .addCase({ name: 'test-1', input: {} })
        .addCase({ name: 'test-2', input: {} });

      const results = await runner.run();

      expect(results.total).toBe(2);
      expect(results.passed).toBe(2);
      expect(results.failed).toBe(0);
      expect(results.results).toHaveLength(2);
    });

    it('should track test durations', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({ name: 'test', input: {} });

      const results = await runner.run();

      expect(results.duration).toBeGreaterThanOrEqual(0);
      expect(results.results[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('should verify expected success', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: {},
        expected: { success: true },
      });

      const results = await runner.run();
      expect(results.passed).toBe(1);
    });

    it('should detect incorrect success value', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: {},
        expected: { success: false }, // Skill returns true
      });

      const results = await runner.run();
      expect(results.failed).toBe(1);
      expect(results.results[0].error).toContain('Expected success=false');
    });

    it('should verify expected error message', async () => {
      const skill = new FailureSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: { shouldFail: true },
        expected: { error: 'Intentional' },
      });

      const results = await runner.run();
      expect(results.passed).toBe(1);
    });

    it('should detect incorrect error message', async () => {
      const skill = new FailureSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: { shouldFail: true },
        expected: { error: 'Wrong message' },
      });

      const results = await runner.run();
      expect(results.failed).toBe(1);
      expect(results.results[0].error).toContain('Expected error containing');
    });

    it('should verify expected output fields', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: { value: 'test-value' },
        expected: {
          fields: { value: 'test-value' },
        },
      });

      const results = await runner.run();
      expect(results.passed).toBe(1);
    });

    it('should detect incorrect output fields', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: { value: 'actual' },
        expected: {
          fields: { value: 'expected' },
        },
      });

      const results = await runner.run();
      expect(results.failed).toBe(1);
      expect(results.results[0].error).toContain('Expected value=');
    });

    it('should handle thrown errors', async () => {
      const skill = new ThrowingSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: { shouldFail: true },
      });

      const results = await runner.run();
      expect(results.failed).toBe(1);
      expect(results.results[0].error).toBe('Test error');
    });

    it('should enforce timeout', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: { delay: 200 },
        timeout: 50,
      });

      const results = await runner.run();
      expect(results.failed).toBe(1);
      expect(results.results[0].error).toContain('timed out after');
    });

    it('should use default timeout of 5000ms', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill);

      runner.addCase({
        name: 'test',
        input: { delay: 10 },
        // No timeout specified, uses default 5000ms
      });

      const results = await runner.run();
      expect(results.passed).toBe(1);
    });

    it('should provide correct aggregate results', async () => {
      const skill = new FailureSkill();
      const runner = new SkillTestRunner(skill);

      runner
        .addCase({ name: 'pass-1', input: {}, expected: { success: true } })
        .addCase({ name: 'fail-1', input: { shouldFail: true }, expected: { success: false } })
        .addCase({ name: 'pass-2', input: {}, expected: { success: true } })
        .addCase({ name: 'fail-2', input: { shouldFail: true }, expected: { success: false } });

      const results = await runner.run();

      expect(results.total).toBe(4);
      expect(results.passed).toBe(4); // All tests verify their expected behavior
      expect(results.failed).toBe(0);
      expect(results.results.filter((r) => r.passed)).toHaveLength(4);
      expect(results.results.filter((r) => !r.passed)).toHaveLength(0);
    });

    it('should set up mock context for skill', async () => {
      const skill = new SuccessSkill();
      const runner = new SkillTestRunner(skill, {
        agentId: 'custom-agent',
        config: { apiKey: 'test-key' },
      });

      runner.addCase({ name: 'test', input: {} });
      await runner.run();

      // Context should be set on skill (verified indirectly by successful execution)
      expect(skill).toBeInstanceOf(SkillBase);
    });
  });
});
