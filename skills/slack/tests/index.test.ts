/**
 * Slack Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SlackSkill } from '../src/index.js';

// Mock @slack/web-api
vi.mock('@slack/web-api', () => {
  const mockPostMessage = vi.fn();
  const mockCreate = vi.fn();
  const mockList = vi.fn();

  return {
    WebClient: vi.fn(function () {
      return {
        chat: {
          postMessage: mockPostMessage,
        },
        conversations: {
          create: mockCreate,
          list: mockList,
        },
      };
    }),
    __getMocks: () => ({
      mockPostMessage,
      mockCreate,
      mockList,
    }),
  };
});

describe('SlackSkill', () => {
  let skill: SlackSkill;
  const mockConfig = {
    botToken: 'xoxb-test-token',
    signingSecret: 'test-signing-secret',
  };

  beforeEach(() => {
    skill = new SlackSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should have correct id', () => {
      expect(skill.id).toBe('slack');
    });

    it('should have correct name', () => {
      expect(skill.name).toBe('Slack Integration');
    });

    it('should have correct version', () => {
      expect(skill.version).toBe('1.0.0');
    });

    it('should have description', () => {
      expect(skill.description).toContain('Slack');
      expect(skill.description).toContain('messages');
    });
  });

  describe('validate()', () => {
    it('should reject missing action', async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it('should reject missing params', async () => {
      expect(await skill.validate({ action: 'sendMessage' } as any)).toBe(false);
    });

    it('should accept valid sendMessage input', async () => {
      expect(
        await skill.validate({
          action: 'sendMessage',
          params: { channel: 'C123', text: 'Hello' },
        })
      ).toBe(true);
    });

    it('should accept valid createChannel input', async () => {
      expect(
        await skill.validate({
          action: 'createChannel',
          params: { name: 'new-channel' },
        })
      ).toBe(true);
    });

    it('should accept valid listChannels input', async () => {
      expect(
        await skill.validate({
          action: 'listChannels',
          params: {},
        })
      ).toBe(true);
    });
  });

  describe('execute() - sendMessage', () => {
    it('should send message successfully', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockPostMessage } = __getMocks();

      const mockResponse = {
        ok: true,
        channel: 'C123',
        ts: '1234567890.123456',
        message: {
          text: 'Hello Slack!',
        },
      };

      mockPostMessage.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: 'sendMessage',
        params: {
          channel: 'C123',
          text: 'Hello Slack!',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);

      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'C123',
        text: 'Hello Slack!',
      });
    });

    it('should send message in thread', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockPostMessage } = __getMocks();

      mockPostMessage.mockResolvedValue({ ok: true });

      await skill.execute({
        action: 'sendMessage',
        params: {
          channel: 'C123',
          text: 'Reply',
          threadTs: '1234567890.123456',
        },
      });

      expect(mockPostMessage).toHaveBeenCalledWith({
        channel: 'C123',
        text: 'Reply',
        thread_ts: '1234567890.123456',
      });
    });

    it('should handle message send errors', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockPostMessage } = __getMocks();

      mockPostMessage.mockRejectedValue(new Error('channel_not_found'));

      const result = await skill.execute({
        action: 'sendMessage',
        params: {
          channel: 'C999',
          text: 'Test',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('channel_not_found');
    });

    it('should handle rate limit errors', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockPostMessage } = __getMocks();

      mockPostMessage.mockRejectedValue(new Error('rate_limited'));

      const result = await skill.execute({
        action: 'sendMessage',
        params: { channel: 'C123', text: 'Test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('rate_limited');
    });
  });

  describe('execute() - createChannel', () => {
    it('should create public channel successfully', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockCreate } = __getMocks();

      const mockResponse = {
        ok: true,
        channel: {
          id: 'C123NEW',
          name: 'new-channel',
          is_private: false,
        },
      };

      mockCreate.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: 'createChannel',
        params: {
          name: 'new-channel',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse);

      expect(mockCreate).toHaveBeenCalledWith({
        name: 'new-channel',
        is_private: false,
      });
    });

    it('should create private channel successfully', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockCreate } = __getMocks();

      mockCreate.mockResolvedValue({ ok: true });

      await skill.execute({
        action: 'createChannel',
        params: {
          name: 'private-channel',
          isPrivate: true,
        },
      });

      expect(mockCreate).toHaveBeenCalledWith({
        name: 'private-channel',
        is_private: true,
      });
    });

    it('should handle channel creation errors', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue(new Error('name_taken'));

      const result = await skill.execute({
        action: 'createChannel',
        params: {
          name: 'existing-channel',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('name_taken');
    });
  });

  describe('execute() - listChannels', () => {
    it('should list channels successfully', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockList } = __getMocks();

      const mockChannels = [
        { id: 'C123', name: 'general', is_private: false },
        { id: 'C456', name: 'random', is_private: false },
      ];

      mockList.mockResolvedValue({
        ok: true,
        channels: mockChannels,
      });

      const result = await skill.execute({
        action: 'listChannels',
        params: {},
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockChannels);

      expect(mockList).toHaveBeenCalled();
    });

    it('should handle list channels errors', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockList } = __getMocks();

      mockList.mockRejectedValue(new Error('invalid_auth'));

      const result = await skill.execute({
        action: 'listChannels',
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('invalid_auth');
    });
  });

  describe('Error Handling', () => {
    it('should return error for unknown action', async () => {
      const result = await skill.execute({
        action: 'invalidAction' as any,
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
      expect(result.error).toContain('invalidAction');
    });

    it('should handle non-Error exceptions', async () => {
      const { __getMocks } = await import('@slack/web-api');
      const { mockPostMessage } = __getMocks();

      mockPostMessage.mockRejectedValue('String error');

      const result = await skill.execute({
        action: 'sendMessage',
        params: { channel: 'C123', text: 'Test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Configuration', () => {
    it('should initialize with bot token', () => {
      const customSkill = new SlackSkill({
        botToken: 'xoxb-custom-token',
        signingSecret: 'custom-secret',
      });

      expect(customSkill).toBeInstanceOf(SlackSkill);
    });
  });

  describe('Factory Function', () => {
    it('should create skill instance via factory', async () => {
      const { createSlackSkill } = await import('../src/index.js');
      const factorySkill = createSlackSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(SlackSkill);
      expect(factorySkill.id).toBe('slack');
    });
  });
});
