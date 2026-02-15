import { describe, it, expect } from 'vitest';
import {
  marketingModeConfig,
  MARKETING_MODE_SYSTEM_PROMPT,
  MARKETING_MODE_AGENTS,
  type MarketingAgent,
} from '../src/index';

describe('Marketing Mode', () => {
  describe('Configuration', () => {
    it('should export marketingModeConfig with correct structure', () => {
      expect(marketingModeConfig).toBeDefined();
      expect(marketingModeConfig.systemPrompt).toBe(MARKETING_MODE_SYSTEM_PROMPT);
      expect(marketingModeConfig.agents).toBe(MARKETING_MODE_AGENTS);
      expect(marketingModeConfig.recommendedSkills).toBeDefined();
      expect(marketingModeConfig.temperature).toBeDefined();
      expect(marketingModeConfig.maxTokens).toBeDefined();
    });

    it('should have balanced temperature for strategy', () => {
      expect(marketingModeConfig.temperature).toBe(0.6);
    });

    it('should have standard token limit', () => {
      expect(marketingModeConfig.maxTokens).toBe(4096);
    });
  });

  describe('System Prompt', () => {
    it('should define role as marketing strategist', () => {
      expect(MARKETING_MODE_SYSTEM_PROMPT).toContain('marketing strategist');
    });

    it('should mention growth and campaigns', () => {
      expect(MARKETING_MODE_SYSTEM_PROMPT).toContain('growth');
      expect(MARKETING_MODE_SYSTEM_PROMPT).toContain('campaigns');
    });

    it('should mention SEO', () => {
      expect(MARKETING_MODE_SYSTEM_PROMPT).toContain('SEO');
    });

    it('should emphasize data-driven approach', () => {
      expect(MARKETING_MODE_SYSTEM_PROMPT).toContain('data-driven');
    });
  });

  describe('Agents', () => {
    it('should export 3 agents', () => {
      expect(MARKETING_MODE_AGENTS).toHaveLength(3);
    });

    it('should have Campaign Manager agent', () => {
      const manager = MARKETING_MODE_AGENTS.find((a: MarketingAgent) => a.name === 'Campaign Manager');
      expect(manager).toBeDefined();
      expect(manager?.role).toBe('campaign-manager');
      expect(manager?.systemPrompt).toContain('campaign');
    });

    it('should have SEO Specialist agent', () => {
      const seo = MARKETING_MODE_AGENTS.find((a: MarketingAgent) => a.name === 'SEO Specialist');
      expect(seo).toBeDefined();
      expect(seo?.role).toBe('seo-specialist');
      expect(seo?.systemPrompt).toContain('SEO');
    });

    it('should have Content Marketer agent', () => {
      const content = MARKETING_MODE_AGENTS.find((a: MarketingAgent) => a.name === 'Content Marketer');
      expect(content).toBeDefined();
      expect(content?.role).toBe('content-marketer');
      expect(content?.systemPrompt).toContain('content');
    });

    it('all agents should have default models', () => {
      MARKETING_MODE_AGENTS.forEach((agent: MarketingAgent) => {
        expect(agent.defaultModel).toBeDefined();
        expect(agent.defaultModel).toMatch(/^claude-(sonnet|haiku|opus)/);
      });
    });
  });

  describe('Recommended Skills', () => {
    it('should include web-search for research', () => {
      expect(marketingModeConfig.recommendedSkills).toContain('web-search');
    });

    it('should include analytics-tracking', () => {
      expect(marketingModeConfig.recommendedSkills).toContain('analytics-tracking');
    });

    it('should include social-content', () => {
      expect(marketingModeConfig.recommendedSkills).toContain('social-content');
    });

    it('should include seo-audit', () => {
      expect(marketingModeConfig.recommendedSkills).toContain('seo-audit');
    });
  });
});
