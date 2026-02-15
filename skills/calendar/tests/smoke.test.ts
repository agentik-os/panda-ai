/**
 * Smoke Tests for Google Calendar Skill
 * Minimal validation of foundation components
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GoogleCalendarSkill } from '../src/index.js';
import { OAuth2Manager } from '../src/auth.js';

describe('GoogleCalendarSkill - Smoke Tests', () => {
  let skill: GoogleCalendarSkill;

  beforeEach(() => {
    skill = new GoogleCalendarSkill({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
      defaultCalendar: 'primary',
      timeZone: 'America/Los_Angeles',
      enableRateLimit: false, // Disable for tests
    });
  });

  describe('Skill Metadata', () => {
    it('should have correct id', () => {
      expect(skill.id).toBe('google-calendar');
    });

    it('should have correct name', () => {
      expect(skill.name).toBe('Google Calendar');
    });

    it('should have version', () => {
      expect(skill.version).toBe('1.0.0');
    });

    it('should have author', () => {
      expect(skill.author).toBe('Agentik OS');
    });

    it('should have description', () => {
      expect(skill.description).toContain('Google Calendar');
      expect(skill.description).toContain('OAuth2');
    });
  });

  describe('Permissions', () => {
    it('should have required permissions', () => {
      expect(skill.permissions).toBeDefined();
      expect(skill.permissions).toBeInstanceOf(Array);
      expect(skill.permissions.length).toBeGreaterThan(0);
    });

    it('should include network permissions', () => {
      expect(skill.permissions).toContain('network:https:www.googleapis.com');
      expect(skill.permissions).toContain('network:https:oauth2.googleapis.com');
    });

    it('should include API permissions', () => {
      expect(skill.permissions).toContain('api:google:calendar');
    });

    it('should include filesystem permissions', () => {
      const hasReadPerm = skill.permissions.some(p => p.startsWith('fs:read'));
      const hasWritePerm = skill.permissions.some(p => p.startsWith('fs:write'));
      expect(hasReadPerm).toBe(true);
      expect(hasWritePerm).toBe(true);
    });
  });

  describe('Tags', () => {
    it('should have relevant tags', () => {
      expect(skill.tags).toContain('calendar');
      expect(skill.tags).toContain('google');
      expect(skill.tags).toContain('scheduling');
      expect(skill.tags).toContain('oauth2');
    });
  });

  describe('SkillBase Integration', () => {
    it('should extend SkillBase correctly', () => {
      expect(typeof skill.execute).toBe('function');
      expect(typeof skill.log).toBe('function');
    });

    it('should have execute method', () => {
      expect(skill.execute).toBeDefined();
      expect(skill.execute.constructor.name).toBe('AsyncFunction');
    });
  });

  describe('Rate Limiting', () => {
    it('should have rate limit config', () => {
      const skillWithRateLimit = new GoogleCalendarSkill({
        clientId: 'test',
        clientSecret: 'test',
        redirectUri: 'http://localhost:3000',
        enableRateLimit: true,
      });

      expect(skillWithRateLimit).toBeDefined();
    });
  });

  describe('Configuration', () => {
    it('should accept minimal config', () => {
      const minimalSkill = new GoogleCalendarSkill({
        clientId: 'test',
        clientSecret: 'test',
        redirectUri: 'http://localhost:3000',
      });

      expect(minimalSkill).toBeDefined();
      expect(minimalSkill.id).toBe('google-calendar');
    });

    it('should accept full config', () => {
      const fullSkill = new GoogleCalendarSkill({
        clientId: 'test',
        clientSecret: 'test',
        redirectUri: 'http://localhost:3000',
        defaultCalendar: 'custom@example.com',
        timeZone: 'UTC',
        enableRateLimit: true,
      });

      expect(fullSkill).toBeDefined();
    });
  });
});

describe('OAuth2Manager - Smoke Tests', () => {
  let oauth: OAuth2Manager;

  beforeEach(() => {
    oauth = new OAuth2Manager({
      clientId: 'test-client-id',
      clientSecret: 'test-client-secret',
      redirectUri: 'http://localhost:3000/callback',
    });
  });

  describe('Initialization', () => {
    it('should instantiate correctly', () => {
      expect(oauth).toBeDefined();
      expect(oauth).toBeInstanceOf(OAuth2Manager);
    });

    it('should have getAuthUrl method', () => {
      expect(typeof oauth.getAuthUrl).toBe('function');
    });

    it('should generate auth URL', () => {
      const url = oauth.getAuthUrl(['https://www.googleapis.com/auth/calendar']);
      expect(url).toContain('https://accounts.google.com/o/oauth2');
      expect(url).toContain('client_id=test-client-id');
      expect(url).toContain('access_type=offline');
    });
  });

  describe('Token Management', () => {
    it('should have getToken method', () => {
      expect(typeof oauth.getToken).toBe('function');
    });

    it('should have refreshAccessToken method', () => {
      expect(typeof oauth.refreshAccessToken).toBe('function');
    });

    it('should have setCredentials method', () => {
      expect(typeof oauth.setCredentials).toBe('function');
    });

    it('should have getCredentials method', () => {
      expect(typeof oauth.getCredentials).toBe('function');
    });

    it('should have ensureValidToken method', () => {
      expect(typeof oauth.ensureValidToken).toBe('function');
    });

    it('should have isTokenExpired method', () => {
      expect(typeof oauth.isTokenExpired).toBe('function');
    });
  });

  describe('Client', () => {
    it('should have getClient method', () => {
      expect(typeof oauth.getClient).toBe('function');
    });

    it('should return OAuth2 client', () => {
      const client = oauth.getClient();
      expect(client).toBeDefined();
    });
  });

  describe('Revocation', () => {
    it('should have revoke method', () => {
      expect(typeof oauth.revoke).toBe('function');
    });
  });
});
