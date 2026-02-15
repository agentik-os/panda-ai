import { describe, it, expect } from 'vitest';
import {
  creativeModeConfig,
  CREATIVE_MODE_SYSTEM_PROMPT,
  CREATIVE_MODE_AGENTS,
  type CreativeAgent,
} from '../src/index';

describe('Creative Mode', () => {
  describe('Configuration', () => {
    it('should export creativeModeConfig with correct structure', () => {
      expect(creativeModeConfig).toBeDefined();
      expect(creativeModeConfig.systemPrompt).toBe(CREATIVE_MODE_SYSTEM_PROMPT);
      expect(creativeModeConfig.agents).toBe(CREATIVE_MODE_AGENTS);
      expect(creativeModeConfig.recommendedSkills).toBeDefined();
      expect(creativeModeConfig.temperature).toBeDefined();
      expect(creativeModeConfig.maxTokens).toBeDefined();
    });

    it('should have high temperature for maximum creativity', () => {
      expect(creativeModeConfig.temperature).toBe(0.9);
    });

    it('should have standard token limit', () => {
      expect(creativeModeConfig.maxTokens).toBe(4096);
    });
  });

  describe('System Prompt', () => {
    it('should define role as creative strategist', () => {
      expect(CREATIVE_MODE_SYSTEM_PROMPT).toContain('creative strategist');
    });

    it('should mention brainstorming and ideation', () => {
      expect(CREATIVE_MODE_SYSTEM_PROMPT).toContain('brainstorming');
      expect(CREATIVE_MODE_SYSTEM_PROMPT).toContain('ideation');
    });

    it('should reference creative techniques', () => {
      expect(CREATIVE_MODE_SYSTEM_PROMPT).toContain('SCAMPER');
    });
  });

  describe('Agents', () => {
    it('should export 2 agents', () => {
      expect(CREATIVE_MODE_AGENTS).toHaveLength(2);
    });

    it('should have Creative Director agent', () => {
      const director = CREATIVE_MODE_AGENTS.find((a: CreativeAgent) => a.name === 'Creative Director');
      expect(director).toBeDefined();
      expect(director?.role).toBe('creative-director');
      expect(director?.systemPrompt).toContain('creative ideation');
    });

    it('should have Brand Strategist agent', () => {
      const strategist = CREATIVE_MODE_AGENTS.find((a: CreativeAgent) => a.name === 'Brand Strategist');
      expect(strategist).toBeDefined();
      expect(strategist?.role).toBe('brand-strategist');
      expect(strategist?.systemPrompt).toContain('brand');
    });

    it('all agents should have default models', () => {
      CREATIVE_MODE_AGENTS.forEach((agent: CreativeAgent) => {
        expect(agent.defaultModel).toBeDefined();
        expect(agent.defaultModel).toMatch(/^claude-(sonnet|haiku|opus)/);
      });
    });
  });

  describe('Recommended Skills', () => {
    it('should include web-search for inspiration', () => {
      expect(creativeModeConfig.recommendedSkills).toContain('web-search');
    });
  });
});
