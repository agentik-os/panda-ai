import { describe, it, expect } from 'vitest';
import {
  createMockContext,
  createMockInput,
  type MockContextOptions,
} from '../src/testing/mock-runtime.js';
import type { SkillInput, LogLevel } from '../src/types.js';

describe('mock-runtime', () => {
  describe('createMockContext', () => {
    it('should create context with default values', () => {
      const ctx = createMockContext();

      expect(ctx.agentId).toBe('test-agent');
      expect(ctx.userId).toBe('test-user');
      expect(ctx.conversationId).toBe('test-conversation');
      expect(ctx.config).toEqual({});
      expect(ctx.logs).toEqual([]);
      expect(typeof ctx.log).toBe('function');
    });

    it('should override default values with options', () => {
      const options: MockContextOptions = {
        agentId: 'custom-agent',
        userId: 'custom-user',
        conversationId: 'custom-conversation',
        config: { apiKey: 'test-key' },
      };

      const ctx = createMockContext(options);

      expect(ctx.agentId).toBe('custom-agent');
      expect(ctx.userId).toBe('custom-user');
      expect(ctx.conversationId).toBe('custom-conversation');
      expect(ctx.config).toEqual({ apiKey: 'test-key' });
    });

    it('should capture log messages', () => {
      const ctx = createMockContext();

      ctx.log('info', 'Test message');
      ctx.log('error', 'Error message', { code: 500 });

      expect(ctx.logs).toHaveLength(2);
      expect(ctx.logs[0]).toEqual({
        level: 'info',
        message: 'Test message',
        data: undefined,
      });
      expect(ctx.logs[1]).toEqual({
        level: 'error',
        message: 'Error message',
        data: { code: 500 },
      });
    });

    it('should support all log levels', () => {
      const ctx = createMockContext();
      const levels: LogLevel[] = ['info', 'warn', 'error', 'debug', 'success'];

      levels.forEach((level) => {
        ctx.log(level, `${level} message`);
      });

      expect(ctx.logs).toHaveLength(5);
      expect(ctx.logs.map((l) => l.level)).toEqual(levels);
    });

    it('should share logs array between log function and logs property', () => {
      const ctx = createMockContext();

      ctx.log('info', 'Message 1');
      expect(ctx.logs).toHaveLength(1);

      ctx.log('info', 'Message 2');
      expect(ctx.logs).toHaveLength(2);
    });
  });

  describe('createMockInput', () => {
    it('should create input with default values', () => {
      const input = createMockInput();

      expect(input.agentId).toBe('test-agent');
      expect(input.userId).toBe('test-user');
      expect(input.conversationId).toBe('test-conversation');
    });

    it('should merge custom fields with defaults', () => {
      interface CustomInput extends SkillInput {
        query: string;
        limit: number;
      }

      const input = createMockInput<CustomInput>({
        query: 'search term',
        limit: 10,
      });

      expect(input.agentId).toBe('test-agent');
      expect(input.query).toBe('search term');
      expect(input.limit).toBe(10);
    });

    it('should override default values', () => {
      const input = createMockInput({
        agentId: 'custom-agent',
        userId: 'custom-user',
        conversationId: 'custom-conversation',
      });

      expect(input.agentId).toBe('custom-agent');
      expect(input.userId).toBe('custom-user');
      expect(input.conversationId).toBe('custom-conversation');
    });

    it('should support arbitrary custom fields', () => {
      const input = createMockInput({
        customField: 'custom-value',
        nested: { key: 'value' },
        array: [1, 2, 3],
      });

      expect((input as any).customField).toBe('custom-value');
      expect((input as any).nested).toEqual({ key: 'value' });
      expect((input as any).array).toEqual([1, 2, 3]);
    });

    it('should support context field', () => {
      const input = createMockInput({
        context: { previousResult: 'data' },
      });

      expect(input.context).toEqual({ previousResult: 'data' });
    });
  });
});
