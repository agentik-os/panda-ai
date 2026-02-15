import { describe, it, expect } from 'vitest';
import {
  supportModeConfig,
  SUPPORT_MODE_SYSTEM_PROMPT,
  SUPPORT_MODE_AGENTS,
  type SupportAgent,
} from '../src/index';

describe('Support Mode', () => {
  describe('Configuration', () => {
    it('should export supportModeConfig with correct structure', () => {
      expect(supportModeConfig).toBeDefined();
      expect(supportModeConfig.systemPrompt).toBe(SUPPORT_MODE_SYSTEM_PROMPT);
      expect(supportModeConfig.agents).toBe(SUPPORT_MODE_AGENTS);
      expect(supportModeConfig.recommendedSkills).toBeDefined();
      expect(supportModeConfig.temperature).toBeDefined();
      expect(supportModeConfig.maxTokens).toBeDefined();
    });

    it('should have balanced temperature for empathy and precision', () => {
      expect(supportModeConfig.temperature).toBe(0.5);
    });

    it('should have standard token limit', () => {
      expect(supportModeConfig.maxTokens).toBe(4096);
    });
  });

  describe('System Prompt', () => {
    it('should define role as support expert', () => {
      expect(SUPPORT_MODE_SYSTEM_PROMPT).toContain('support expert');
    });

    it('should emphasize empathy', () => {
      expect(SUPPORT_MODE_SYSTEM_PROMPT).toContain('empathy');
    });

    it('should mention troubleshooting', () => {
      expect(SUPPORT_MODE_SYSTEM_PROMPT).toContain('troubleshooting');
    });

    it('should mention customer satisfaction', () => {
      expect(SUPPORT_MODE_SYSTEM_PROMPT).toContain('satisfaction');
    });
  });

  describe('Agents', () => {
    it('should export 2 agents', () => {
      expect(SUPPORT_MODE_AGENTS).toHaveLength(2);
    });

    it('should have Support Agent', () => {
      const agent = SUPPORT_MODE_AGENTS.find((a: SupportAgent) => a.name === 'Support Agent');
      expect(agent).toBeDefined();
      expect(agent?.role).toBe('support-agent');
      expect(agent?.systemPrompt).toContain('customer inquiries');
      expect(agent?.systemPrompt).toContain('empathy');
    });

    it('should have Troubleshooter agent', () => {
      const troubleshooter = SUPPORT_MODE_AGENTS.find((a: SupportAgent) => a.name === 'Troubleshooter');
      expect(troubleshooter).toBeDefined();
      expect(troubleshooter?.role).toBe('troubleshooter');
      expect(troubleshooter?.systemPrompt).toContain('root cause');
    });

    it('Support Agent should use Haiku for fast responses', () => {
      const agent = SUPPORT_MODE_AGENTS.find((a: SupportAgent) => a.name === 'Support Agent');
      expect(agent?.defaultModel).toContain('haiku');
    });

    it('Troubleshooter should use Sonnet for complex analysis', () => {
      const troubleshooter = SUPPORT_MODE_AGENTS.find((a: SupportAgent) => a.name === 'Troubleshooter');
      expect(troubleshooter?.defaultModel).toContain('sonnet');
    });
  });

  describe('Recommended Skills', () => {
    it('should include web-search for research', () => {
      expect(supportModeConfig.recommendedSkills).toContain('web-search');
    });

    it('should include file-operations for logs', () => {
      expect(supportModeConfig.recommendedSkills).toContain('file-operations');
    });
  });
});
