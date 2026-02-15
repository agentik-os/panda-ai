/**
 * Discord Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DiscordSkill } from '../src/index.js';

// Mock discord.js
vi.mock('discord.js', () => {
  const mockFetch = vi.fn();
  const mockSend = vi.fn();
  const mockGuildsFetch = vi.fn();
  const mockLogin = vi.fn();

  return {
    Client: vi.fn(() => ({
      channels: {
        fetch: mockFetch,
      },
      guilds: {
        fetch: mockGuildsFetch,
      },
      login: mockLogin,
      on: vi.fn((event, callback) => {
        if (event === 'ready') {
          setTimeout(callback, 10);
        }
      }),
    })),
    GatewayIntentBits: {
      Guilds: 1,
      GuildMessages: 2,
      MessageContent: 4,
    },
    __getMocks: () => ({
      mockFetch,
      mockSend,
      mockGuildsFetch,
      mockLogin,
    }),
  };
});

describe('DiscordSkill', () => {
  let skill: DiscordSkill;
  const mockConfig = {
    botToken: 'test-bot-token',
    applicationId: 'test-app-id',
  };

  beforeEach(() => {
    skill = new DiscordSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe('Metadata', () => {
    it('should have correct id', () => {
      expect(skill.id).toBe('discord');
    });

    it('should have correct name', () => {
      expect(skill.name).toBe('Discord Bot');
    });

    it('should have correct version', () => {
      expect(skill.version).toBe('1.0.0');
    });

    it('should have description', () => {
      expect(skill.description).toContain('Discord');
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
          params: { channelId: '123', text: 'Hello' },
        })
      ).toBe(true);
    });

    it('should accept valid getGuild input', async () => {
      expect(
        await skill.validate({
          action: 'getGuild',
          params: { guildId: '456' },
        })
      ).toBe(true);
    });
  });

  describe('execute() - sendMessage', () => {
    it('should send message successfully', async () => {
      const { __getMocks } = await import('discord.js');
      const { mockFetch, mockSend } = __getMocks();

      const mockMessage = {
        id: 'msg123',
        content: 'Hello Discord!',
      };

      mockSend.mockResolvedValue(mockMessage);

      const mockChannel = {
        send: mockSend,
      };

      mockFetch.mockResolvedValue(mockChannel);

      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await skill.execute({
        action: 'sendMessage',
        params: {
          channelId: 'channel123',
          text: 'Hello Discord!',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'msg123', content: 'Hello Discord!' });
    });

    it('should handle channel not found errors', async () => {
      const { __getMocks } = await import('discord.js');
      const { mockFetch } = __getMocks();

      mockFetch.mockResolvedValue(null);

      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await skill.execute({
        action: 'sendMessage',
        params: {
          channelId: 'invalid',
          text: 'Test',
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Channel not found');
    });
  });

  describe('execute() - getGuild', () => {
    it('should get guild successfully', async () => {
      const { __getMocks } = await import('discord.js');
      const { mockGuildsFetch } = __getMocks();

      const mockGuild = {
        id: 'guild123',
        name: 'Test Server',
      };

      mockGuildsFetch.mockResolvedValue(mockGuild);

      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await skill.execute({
        action: 'getGuild',
        params: {
          guildId: 'guild123',
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: 'guild123', name: 'Test Server' });
    });
  });

  describe('Error Handling', () => {
    it('should return error for unknown action', async () => {
      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await skill.execute({
        action: 'invalidAction' as any,
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Unknown action');
    });

    it('should handle non-Error exceptions', async () => {
      const { __getMocks } = await import('discord.js');
      const { mockFetch } = __getMocks();

      mockFetch.mockRejectedValue('String error');

      await new Promise(resolve => setTimeout(resolve, 20));

      const result = await skill.execute({
        action: 'sendMessage',
        params: { channelId: '123', text: 'Test' },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unknown error');
    });
  });

  describe('Factory Function', () => {
    it('should create skill instance via factory', async () => {
      const { createDiscordSkill } = await import('../src/index.js');
      const factorySkill = createDiscordSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(DiscordSkill);
      expect(factorySkill.id).toBe('discord');
    });
  });
});
