import { describe, it, expect } from 'vitest';
import {
  assertSkillSuccess,
  assertSkillError,
  assertSkillOutput,
  assertSkillMetadata,
  assertExecutionTime,
} from '../src/testing/assertions.js';
import type { SkillOutput } from '../src/types.js';

describe('assertions', () => {
  describe('assertSkillSuccess', () => {
    it('should not throw when skill succeeded', () => {
      const result: SkillOutput = { success: true };
      expect(() => assertSkillSuccess(result)).not.toThrow();
    });

    it('should throw when skill failed', () => {
      const result: SkillOutput = { success: false };
      expect(() => assertSkillSuccess(result)).toThrow(
        'Expected skill to succeed, but it failed'
      );
    });

    it('should include error message in thrown error', () => {
      const result: SkillOutput = { success: false, error: 'API timeout' };
      expect(() => assertSkillSuccess(result)).toThrow(
        'Expected skill to succeed, but it failed: API timeout'
      );
    });

    it('should support custom error message', () => {
      const result: SkillOutput = { success: false };
      expect(() =>
        assertSkillSuccess(result, 'Custom error message')
      ).toThrow('Custom error message');
    });
  });

  describe('assertSkillError', () => {
    it('should not throw when skill failed', () => {
      const result: SkillOutput = { success: false, error: 'Some error' };
      expect(() => assertSkillError(result)).not.toThrow();
    });

    it('should throw when skill succeeded', () => {
      const result: SkillOutput = { success: true };
      expect(() => assertSkillError(result)).toThrow(
        'Expected skill to fail, but it succeeded'
      );
    });

    it('should verify error message contains expected substring', () => {
      const result: SkillOutput = {
        success: false,
        error: 'API timeout after 5 seconds',
      };
      expect(() => assertSkillError(result, 'timeout')).not.toThrow();
    });

    it('should throw when error message does not match', () => {
      const result: SkillOutput = { success: false, error: 'Different error' };
      expect(() => assertSkillError(result, 'timeout')).toThrow(
        'Expected error to contain "timeout", got "Different error"'
      );
    });

    it('should work without expectedError parameter', () => {
      const result: SkillOutput = { success: false, error: 'Any error' };
      expect(() => assertSkillError(result)).not.toThrow();
    });
  });

  describe('assertSkillOutput', () => {
    it('should not throw when all fields match', () => {
      const result: SkillOutput = {
        success: true,
        data: 'result',
        count: 5,
      };
      expect(() =>
        assertSkillOutput(result, { success: true, data: 'result', count: 5 })
      ).not.toThrow();
    });

    it('should throw when field value does not match', () => {
      const result: SkillOutput = { success: true, data: 'actual' };
      expect(() =>
        assertSkillOutput(result, { data: 'expected' })
      ).toThrow('Expected output.data to be "expected", got "actual"');
    });

    it('should compare primitives correctly', () => {
      const result: SkillOutput = {
        success: true,
        count: 5,
        message: 'test',
      };
      expect(() =>
        assertSkillOutput(result, { count: 5, message: 'test' })
      ).not.toThrow();
    });

    it('should detect incorrect primitives', () => {
      const result: SkillOutput = {
        success: true,
        count: 5,
      };
      expect(() =>
        assertSkillOutput(result, { count: 10 })
      ).toThrow('Expected output.count to be 10, got 5');
    });
  });

  describe('assertSkillMetadata', () => {
    it('should not throw when all fields match', () => {
      const metadata = {
        id: 'skill-1',
        name: 'Test Skill',
        version: '1.0.0',
      };
      expect(() =>
        assertSkillMetadata(metadata, {
          id: 'skill-1',
          name: 'Test Skill',
          version: '1.0.0',
        })
      ).not.toThrow();
    });

    it('should throw when field value does not match', () => {
      const metadata = { id: 'skill-1', name: 'Test' };
      expect(() =>
        assertSkillMetadata(metadata, { name: 'Expected' })
      ).toThrow('Expected metadata.name to be "Expected", got "Test"');
    });

    it('should compare arrays correctly', () => {
      const metadata = {
        tags: ['search', 'api'],
        permissions: ['network:http'],
      };
      expect(() =>
        assertSkillMetadata(metadata, {
          tags: ['search', 'api'],
          permissions: ['network:http'],
        })
      ).not.toThrow();
    });

    it('should throw when array content differs', () => {
      const metadata = { tags: ['search', 'api'] };
      expect(() =>
        assertSkillMetadata(metadata, { tags: ['search', 'different'] })
      ).toThrow(
        'Expected metadata.tags to be ["search","different"], got ["search","api"]'
      );
    });

    it('should throw when expected array but got non-array', () => {
      const metadata = { tags: 'not-array' };
      expect(() =>
        assertSkillMetadata(metadata, { tags: [] })
      ).toThrow('Expected metadata.tags to be an array');
    });
  });

  describe('assertExecutionTime', () => {
    it('should not throw when execution is within time limit', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        return 'result';
      };

      const result = await assertExecutionTime(fn, 100);
      expect(result).toBe('result');
    });

    it('should throw when execution exceeds time limit', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return 'result';
      };

      await expect(assertExecutionTime(fn, 50)).rejects.toThrow(
        /Execution took \d+ms, exceeding limit of 50ms/
      );
    });

    it('should return the function result', async () => {
      const fn = async () => ({ data: 'test' });
      const result = await assertExecutionTime(fn, 100);
      expect(result).toEqual({ data: 'test' });
    });

    it('should handle synchronous functions wrapped in async', async () => {
      const fn = async () => 42;
      const result = await assertExecutionTime(fn, 100);
      expect(result).toBe(42);
    });

    it('should measure actual execution time', async () => {
      const fn = async () => {
        await new Promise((resolve) => setTimeout(resolve, 20));
        return 'done';
      };

      // Should pass with generous limit
      await expect(assertExecutionTime(fn, 100)).resolves.toBe('done');

      // Should fail with tight limit
      await expect(assertExecutionTime(fn, 10)).rejects.toThrow(/exceeding limit/);
    });
  });
});
