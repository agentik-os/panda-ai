import { describe, it, expect } from 'vitest';
import {
  wellnessModeConfig,
  WELLNESS_MODE_SYSTEM_PROMPT,
  WELLNESS_MODE_AGENTS,
  type WellnessAgent,
} from '../src/index';

describe('Wellness Mode', () => {
  describe('Configuration', () => {
    it('should export wellnessModeConfig with correct structure', () => {
      expect(wellnessModeConfig).toBeDefined();
      expect(wellnessModeConfig.systemPrompt).toBe(WELLNESS_MODE_SYSTEM_PROMPT);
      expect(wellnessModeConfig.agents).toBe(WELLNESS_MODE_AGENTS);
      expect(wellnessModeConfig.recommendedSkills).toBeDefined();
      expect(wellnessModeConfig.temperature).toBeDefined();
      expect(wellnessModeConfig.maxTokens).toBeDefined();
    });

    it('should have balanced temperature for empathy', () => {
      expect(wellnessModeConfig.temperature).toBe(0.5);
    });

    it('should have standard token limit', () => {
      expect(wellnessModeConfig.maxTokens).toBe(4096);
    });
  });

  describe('System Prompt', () => {
    it('should define role as wellness coach', () => {
      expect(WELLNESS_MODE_SYSTEM_PROMPT).toContain('wellness coach');
    });

    it('should mention holistic health', () => {
      expect(WELLNESS_MODE_SYSTEM_PROMPT).toContain('holistic health');
    });

    it('should emphasize evidence-based advice', () => {
      expect(WELLNESS_MODE_SYSTEM_PROMPT).toContain('Evidence-based');
    });

    it('should mention recommending professional help', () => {
      expect(WELLNESS_MODE_SYSTEM_PROMPT).toContain('professional help');
    });
  });

  describe('Agents', () => {
    it('should export 2 agents', () => {
      expect(WELLNESS_MODE_AGENTS).toHaveLength(2);
    });

    it('should have Health Coach agent', () => {
      const coach = WELLNESS_MODE_AGENTS.find((a: WellnessAgent) => a.name === 'Health Coach');
      expect(coach).toBeDefined();
      expect(coach?.role).toBe('health-coach');
      expect(coach?.systemPrompt).toContain('health advice');
    });

    it('should have Habit Coach agent', () => {
      const habit = WELLNESS_MODE_AGENTS.find((a: WellnessAgent) => a.name === 'Habit Coach');
      expect(habit).toBeDefined();
      expect(habit?.role).toBe('habit-coach');
      expect(habit?.systemPrompt).toContain('habits');
    });

    it('Health Coach should use Sonnet for comprehensive advice', () => {
      const coach = WELLNESS_MODE_AGENTS.find((a: WellnessAgent) => a.name === 'Health Coach');
      expect(coach?.defaultModel).toContain('sonnet');
    });

    it('Habit Coach should use Haiku for quick check-ins', () => {
      const habit = WELLNESS_MODE_AGENTS.find((a: WellnessAgent) => a.name === 'Habit Coach');
      expect(habit?.defaultModel).toContain('haiku');
    });
  });

  describe('Recommended Skills', () => {
    it('should include web-search for research', () => {
      expect(wellnessModeConfig.recommendedSkills).toContain('web-search');
    });
  });
});
