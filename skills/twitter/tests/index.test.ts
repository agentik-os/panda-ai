/**
 * Twitter Skill Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { TwitterSkill } from '../src/index.js';
import type { TwitterConfig } from '../src/types.js';

describe('TwitterSkill', () => {
  let skill: TwitterSkill;
  const mockConfig: TwitterConfig = {
    apiKey: 'test-api-key',
    apiSecret: 'test-api-secret',
    accessToken: 'test-access-token',
    accessTokenSecret: 'test-access-token-secret',
    bearerToken: 'test-bearer-token',
  };

  beforeEach(() => {
    skill = new TwitterSkill(mockConfig);
  });

  it('should create a skill instance', () => {
    expect(skill).toBeDefined();
    expect(skill.id).toBe('twitter');
    expect(skill.name).toBe('Twitter/X API');
    expect(skill.version).toBe('1.0.0');
  });

  it('should have correct permissions', () => {
    expect(skill.permissions).toContain('network:https:api.twitter.com');
    expect(skill.permissions).toContain('api:twitter');
  });

  it('should have correct tags', () => {
    expect(skill.tags).toContain('twitter');
    expect(skill.tags).toContain('social-media');
  });

  describe('validate', () => {
    it('should validate correct input', async () => {
      const input = {
        action: 'postTweet' as const,
        params: { text: 'Hello world' },
      };
      const result = await skill.validate(input);
      expect(result).toBe(true);
    });

    it('should reject invalid input', async () => {
      const input = {} as any;
      const result = await skill.validate(input);
      expect(result).toBe(false);
    });

    it('should reject input without action', async () => {
      const input = { params: {} } as any;
      const result = await skill.validate(input);
      expect(result).toBe(false);
    });

    it('should reject input without params', async () => {
      const input = { action: 'postTweet' } as any;
      const result = await skill.validate(input);
      expect(result).toBe(false);
    });
  });

  describe('getRemainingRequests', () => {
    it('should return initial rate limit', () => {
      const remaining = skill.getRemainingRequests();
      expect(remaining).toBe(100);
    });
  });
});
