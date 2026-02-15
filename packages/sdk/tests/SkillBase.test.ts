import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SkillBase } from '../src/SkillBase.js';
import type { SkillInput, SkillOutput, SkillContext, LogLevel } from '../src/types.js';

// Test skill implementation
class TestSkill extends SkillBase<SkillInput, SkillOutput> {
  id = 'test-skill';
  name = 'Test Skill';
  description = 'A skill for testing';
  version = '1.0.0';

  async execute(input: SkillInput): Promise<SkillOutput> {
    return { success: true };
  }
}

// Test skill with config schema
class ValidatedSkill extends SkillBase<SkillInput, SkillOutput> {
  id = 'validated-skill';
  name = 'Validated Skill';
  description = 'A skill with config validation';
  version = '1.0.0';

  configSchema = {
    apiKey: {
      type: 'string' as const,
      required: true,
      description: 'API key',
    },
    timeout: {
      type: 'number' as const,
      required: false,
      description: 'Timeout in ms',
      min: 0,
      max: 60000,
    },
    mode: {
      type: 'string' as const,
      enum: ['production', 'development', 'test'],
      description: 'Environment mode',
    },
    pattern: {
      type: 'string' as const,
      pattern: '^[a-z]+$',
      description: 'Lowercase letters only',
    },
  };

  async execute(input: SkillInput): Promise<SkillOutput> {
    return { success: true };
  }
}

describe('SkillBase', () => {
  describe('Constructor', () => {
    it('should create skill instance without config', () => {
      const skill = new TestSkill();
      expect(skill).toBeInstanceOf(SkillBase);
      expect(skill.id).toBe('test-skill');
      expect(skill.name).toBe('Test Skill');
    });

    it('should create skill instance with config', () => {
      const config = { apiKey: 'test-key', option: 'value' };
      const skill = new TestSkill(config);
      expect((skill as any).config).toEqual(config);
    });

    it('should have empty config by default', () => {
      const skill = new TestSkill();
      expect((skill as any).config).toEqual({});
    });
  });

  describe('Metadata', () => {
    it('should return correct metadata', () => {
      const skill = new TestSkill();
      const metadata = skill.getMetadata();

      expect(metadata).toEqual({
        id: 'test-skill',
        name: 'Test Skill',
        description: 'A skill for testing',
        version: '1.0.0',
        author: undefined,
        permissions: [],
        configSchema: {},
        tags: [],
      });
    });

    it('should include optional metadata when provided', () => {
      const skill = new TestSkill();
      skill.author = 'Test Author';
      skill.permissions = ['network:http'];
      skill.tags = ['test', 'example'];
      skill.configSchema = { key: { type: 'string', description: 'Key' } };

      const metadata = skill.getMetadata();
      expect(metadata.author).toBe('Test Author');
      expect(metadata.permissions).toEqual(['network:http']);
      expect(metadata.tags).toEqual(['test', 'example']);
      expect(metadata.configSchema).toEqual({ key: { type: 'string', description: 'Key' } });
    });
  });

  describe('setContext', () => {
    it('should set context and config', () => {
      const skill = new TestSkill();
      const context: SkillContext = {
        agentId: 'agent-123',
        conversationId: 'conv-456',
        config: { apiKey: 'context-key' },
        log: vi.fn(),
      };

      skill.setContext(context);
      expect((skill as any).context).toEqual(context);
      expect((skill as any).config).toEqual({ apiKey: 'context-key' });
    });

    it('should override constructor config with context config', () => {
      const skill = new TestSkill({ initialKey: 'initial' });
      const context: SkillContext = {
        agentId: 'agent-123',
        conversationId: 'conv-456',
        config: { contextKey: 'context' },
        log: vi.fn(),
      };

      skill.setContext(context);
      expect((skill as any).config).toEqual({ contextKey: 'context' });
    });
  });

  describe('log', () => {
    it('should call context.log when context is set', () => {
      const skill = new TestSkill();
      const mockLog = vi.fn();
      const context: SkillContext = {
        agentId: 'agent-123',
        conversationId: 'conv-456',
        config: {},
        log: mockLog,
      };

      skill.setContext(context);
      (skill as any).log('info', 'Test message', { key: 'value' });

      expect(mockLog).toHaveBeenCalledWith('info', 'Test message', { key: 'value' });
    });

    it('should fallback to console.log when no context', () => {
      const skill = new TestSkill();
      const consoleSpy = vi.spyOn(console, 'log');

      (skill as any).log('error', 'Error message', { error: 'details' });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[ERROR] Error message',
        { error: 'details' }
      );

      consoleSpy.mockRestore();
    });

    it('should handle log without data', () => {
      const skill = new TestSkill();
      const mockLog = vi.fn();
      const context: SkillContext = {
        agentId: 'agent-123',
        conversationId: 'conv-456',
        config: {},
        log: mockLog,
      };

      skill.setContext(context);
      (skill as any).log('info', 'Simple message');

      expect(mockLog).toHaveBeenCalledWith('info', 'Simple message', undefined);
    });
  });

  describe('validateConfig', () => {
    describe('Required fields', () => {
      it('should throw error when required field is missing', () => {
        const skill = new ValidatedSkill({});
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'apiKey' is required"
        );
      });

      it('should throw error when required field is null', () => {
        const skill = new ValidatedSkill({ apiKey: null });
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'apiKey' is required"
        );
      });

      it('should not throw when required field is provided', () => {
        const skill = new ValidatedSkill({ apiKey: 'test-key' });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });

      it('should allow optional fields to be missing', () => {
        const skill = new ValidatedSkill({ apiKey: 'test-key' });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });
    });

    describe('Type validation', () => {
      it('should throw error when type is wrong', () => {
        const skill = new ValidatedSkill({ apiKey: 123 });
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'apiKey' must be string, got number"
        );
      });

      it('should validate number type', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', timeout: '5000' });
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'timeout' must be number, got string"
        );
      });

      it('should allow correct types', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', timeout: 5000 });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });
    });

    describe('Enum validation', () => {
      it('should throw error when value not in enum', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', mode: 'invalid' });
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'mode' must be one of: production, development, test"
        );
      });

      it('should allow valid enum values', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', mode: 'production' });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });
    });

    describe('Pattern validation', () => {
      it('should throw error when pattern does not match', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', pattern: 'ABC123' });
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'pattern' does not match pattern: ^[a-z]+$"
        );
      });

      it('should allow values matching pattern', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', pattern: 'abc' });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });
    });

    describe('Number range validation', () => {
      it('should throw error when number is below min', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', timeout: -1 });
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'timeout' must be >= 0"
        );
      });

      it('should throw error when number is above max', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', timeout: 70000 });
        expect(() => (skill as any).validateConfig()).toThrow(
          "Config field 'timeout' must be <= 60000"
        );
      });

      it('should allow numbers within range', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', timeout: 30000 });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });

      it('should allow min boundary value', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', timeout: 0 });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });

      it('should allow max boundary value', () => {
        const skill = new ValidatedSkill({ apiKey: 'key', timeout: 60000 });
        expect(() => (skill as any).validateConfig()).not.toThrow();
      });
    });

    it('should not validate when no configSchema', () => {
      const skill = new TestSkill({ anyKey: 'anyValue' });
      expect(() => (skill as any).validateConfig()).not.toThrow();
    });

    it('should allow undefined/null for optional fields', () => {
      const skill = new ValidatedSkill({
        apiKey: 'key',
        timeout: undefined,
        mode: null,
      });
      expect(() => (skill as any).validateConfig()).not.toThrow();
    });
  });

  describe('execute', () => {
    it('should be an abstract method that must be implemented', async () => {
      const skill = new TestSkill();
      const result = await skill.execute({ action: 'test' });
      expect(result).toEqual({ success: true });
    });
  });
});
