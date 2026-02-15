import { describe, it, expect } from 'vitest';
import type {
  SkillInput,
  SkillOutput,
  ConfigField,
  SkillMetadata,
  SkillContext,
  LogLevel,
} from '../src/types.js';

describe('types', () => {
  describe('SkillInput', () => {
    it('should allow basic input object', () => {
      const input: SkillInput = {};
      expect(input).toBeDefined();
    });

    it('should allow optional standard fields', () => {
      const input: SkillInput = {
        agentId: 'agent-1',
        userId: 'user-1',
        conversationId: 'conv-1',
        context: { previousResult: 'data' },
      };

      expect(input.agentId).toBe('agent-1');
      expect(input.userId).toBe('user-1');
      expect(input.conversationId).toBe('conv-1');
      expect(input.context).toEqual({ previousResult: 'data' });
    });

    it('should allow custom fields', () => {
      const input: SkillInput = {
        customField: 'value',
        nested: { key: 'value' },
        array: [1, 2, 3],
      };

      expect(input.customField).toBe('value');
      expect(input.nested).toEqual({ key: 'value' });
      expect(input.array).toEqual([1, 2, 3]);
    });
  });

  describe('SkillOutput', () => {
    it('should require success field', () => {
      const output: SkillOutput = { success: true };
      expect(output.success).toBe(true);
    });

    it('should allow error field', () => {
      const output: SkillOutput = {
        success: false,
        error: 'Something went wrong',
      };

      expect(output.error).toBe('Something went wrong');
    });

    it('should allow custom fields', () => {
      const output: SkillOutput = {
        success: true,
        data: { result: 'value' },
        count: 42,
      };

      expect(output.data).toEqual({ result: 'value' });
      expect(output.count).toBe(42);
    });
  });

  describe('ConfigField', () => {
    it('should support string type', () => {
      const field: ConfigField = {
        type: 'string',
        required: true,
        description: 'API key',
      };

      expect(field.type).toBe('string');
    });

    it('should support number type with min/max', () => {
      const field: ConfigField = {
        type: 'number',
        min: 0,
        max: 100,
        description: 'Percentage',
      };

      expect(field.type).toBe('number');
      expect(field.min).toBe(0);
      expect(field.max).toBe(100);
    });

    it('should support enum values', () => {
      const field: ConfigField = {
        type: 'string',
        enum: ['production', 'development', 'test'],
        description: 'Environment',
      };

      expect(field.enum).toEqual(['production', 'development', 'test']);
    });

    it('should support pattern validation', () => {
      const field: ConfigField = {
        type: 'string',
        pattern: '^[a-z]+$',
        description: 'Lowercase only',
      };

      expect(field.pattern).toBe('^[a-z]+$');
    });

    it('should support sensitive flag', () => {
      const field: ConfigField = {
        type: 'string',
        sensitive: true,
        description: 'API secret',
      };

      expect(field.sensitive).toBe(true);
    });

    it('should support default value', () => {
      const field: ConfigField = {
        type: 'number',
        default: 10,
        description: 'Retry count',
      };

      expect(field.default).toBe(10);
    });

    it('should support all data types', () => {
      const types: ConfigField['type'][] = [
        'string',
        'number',
        'boolean',
        'object',
        'array',
      ];

      types.forEach((type) => {
        const field: ConfigField = { type, description: 'Test' };
        expect(field.type).toBe(type);
      });
    });
  });

  describe('SkillMetadata', () => {
    it('should require core fields', () => {
      const metadata: SkillMetadata = {
        id: 'my-skill',
        name: 'My Skill',
        description: 'Does something useful',
        version: '1.0.0',
      };

      expect(metadata.id).toBe('my-skill');
      expect(metadata.name).toBe('My Skill');
      expect(metadata.version).toBe('1.0.0');
    });

    it('should support optional author', () => {
      const metadata: SkillMetadata = {
        id: 'skill',
        name: 'Skill',
        description: 'Test',
        version: '1.0.0',
        author: 'John Doe',
      };

      expect(metadata.author).toBe('John Doe');
    });

    it('should support permissions array', () => {
      const metadata: SkillMetadata = {
        id: 'skill',
        name: 'Skill',
        description: 'Test',
        version: '1.0.0',
        permissions: ['network:http', 'filesystem:read'],
      };

      expect(metadata.permissions).toEqual(['network:http', 'filesystem:read']);
    });

    it('should support config schema', () => {
      const metadata: SkillMetadata = {
        id: 'skill',
        name: 'Skill',
        description: 'Test',
        version: '1.0.0',
        configSchema: {
          apiKey: { type: 'string', required: true, description: 'Key' },
          timeout: { type: 'number', description: 'Timeout' },
        },
      };

      expect(metadata.configSchema).toBeDefined();
      expect(metadata.configSchema?.apiKey).toBeDefined();
      expect(metadata.configSchema?.timeout).toBeDefined();
    });

    it('should support tags', () => {
      const metadata: SkillMetadata = {
        id: 'skill',
        name: 'Skill',
        description: 'Test',
        version: '1.0.0',
        tags: ['search', 'api', 'data'],
      };

      expect(metadata.tags).toEqual(['search', 'api', 'data']);
    });
  });

  describe('SkillContext', () => {
    it('should require core fields', () => {
      const context: SkillContext = {
        agentId: 'agent-1',
        config: {},
        log: () => {},
      };

      expect(context.agentId).toBe('agent-1');
      expect(context.config).toEqual({});
      expect(typeof context.log).toBe('function');
    });

    it('should support optional userId and conversationId', () => {
      const context: SkillContext = {
        agentId: 'agent-1',
        userId: 'user-1',
        conversationId: 'conv-1',
        config: {},
        log: () => {},
      };

      expect(context.userId).toBe('user-1');
      expect(context.conversationId).toBe('conv-1');
    });

    it('should support config object', () => {
      const context: SkillContext = {
        agentId: 'agent-1',
        config: { apiKey: 'test', timeout: 5000 },
        log: () => {},
      };

      expect(context.config.apiKey).toBe('test');
      expect(context.config.timeout).toBe(5000);
    });

    it('should support log function with all parameters', () => {
      const logs: Array<{ level: LogLevel; message: string; data?: any }> = [];

      const context: SkillContext = {
        agentId: 'agent-1',
        config: {},
        log: (level, message, data) => {
          logs.push({ level, message, data });
        },
      };

      context.log('info', 'Test message');
      context.log('error', 'Error message', { code: 500 });

      expect(logs).toHaveLength(2);
      expect(logs[0]).toEqual({ level: 'info', message: 'Test message' });
      expect(logs[1]).toEqual({
        level: 'error',
        message: 'Error message',
        data: { code: 500 },
      });
    });
  });

  describe('LogLevel', () => {
    it('should support all log levels', () => {
      const levels: LogLevel[] = ['info', 'warn', 'error', 'debug', 'success'];

      levels.forEach((level) => {
        const log: LogLevel = level;
        expect(log).toBe(level);
      });
    });
  });
});
