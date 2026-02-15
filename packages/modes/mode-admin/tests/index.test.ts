import { describe, it, expect } from 'vitest';
import {
  adminModeConfig,
  ADMIN_MODE_SYSTEM_PROMPT,
  ADMIN_MODE_AGENTS,
  type AdminAgent,
} from '../src/index';

describe('Admin Mode', () => {
  describe('Configuration', () => {
    it('should export adminModeConfig with correct structure', () => {
      expect(adminModeConfig).toBeDefined();
      expect(adminModeConfig.systemPrompt).toBe(ADMIN_MODE_SYSTEM_PROMPT);
      expect(adminModeConfig.agents).toBe(ADMIN_MODE_AGENTS);
      expect(adminModeConfig.recommendedSkills).toBeDefined();
      expect(adminModeConfig.temperature).toBeDefined();
      expect(adminModeConfig.maxTokens).toBeDefined();
    });

    it('should have low temperature for precision', () => {
      expect(adminModeConfig.temperature).toBe(0.3);
    });

    it('should have standard token limit', () => {
      expect(adminModeConfig.maxTokens).toBe(4096);
    });
  });

  describe('System Prompt', () => {
    it('should define role as system administrator', () => {
      expect(ADMIN_MODE_SYSTEM_PROMPT).toContain('system administrator');
    });

    it('should mention infrastructure and DevOps', () => {
      expect(ADMIN_MODE_SYSTEM_PROMPT).toContain('infrastructure');
      expect(ADMIN_MODE_SYSTEM_PROMPT).toContain('DevOps');
    });

    it('should emphasize security', () => {
      expect(ADMIN_MODE_SYSTEM_PROMPT).toContain('security');
    });
  });

  describe('Agents', () => {
    it('should export 2 agents', () => {
      expect(ADMIN_MODE_AGENTS).toHaveLength(2);
    });

    it('should have SysAdmin agent', () => {
      const sysadmin = ADMIN_MODE_AGENTS.find((a: AdminAgent) => a.name === 'SysAdmin');
      expect(sysadmin).toBeDefined();
      expect(sysadmin?.role).toBe('sysadmin');
      expect(sysadmin?.systemPrompt).toContain('deployment');
    });

    it('should have Security Engineer agent', () => {
      const security = ADMIN_MODE_AGENTS.find((a: AdminAgent) => a.name === 'Security Engineer');
      expect(security).toBeDefined();
      expect(security?.role).toBe('security-engineer');
      expect(security?.systemPrompt).toContain('access control');
    });

    it('all agents should have default models', () => {
      ADMIN_MODE_AGENTS.forEach((agent: AdminAgent) => {
        expect(agent.defaultModel).toBeDefined();
        expect(agent.defaultModel).toMatch(/^claude-(sonnet|haiku|opus)/);
      });
    });
  });

  describe('Recommended Skills', () => {
    it('should include file-operations for config management', () => {
      expect(adminModeConfig.recommendedSkills).toContain('file-operations');
    });

    it('should include web-search for documentation', () => {
      expect(adminModeConfig.recommendedSkills).toContain('web-search');
    });
  });
});
