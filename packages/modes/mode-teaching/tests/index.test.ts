import { describe, it, expect } from 'vitest';
import {
  teachingModeConfig,
  TEACHING_MODE_SYSTEM_PROMPT,
  TEACHING_MODE_AGENTS,
  type TeachingAgent,
} from '../src/index';

describe('Teaching Mode', () => {
  describe('Configuration', () => {
    it('should export teachingModeConfig with correct structure', () => {
      expect(teachingModeConfig).toBeDefined();
      expect(teachingModeConfig.systemPrompt).toBe(TEACHING_MODE_SYSTEM_PROMPT);
      expect(teachingModeConfig.agents).toBe(TEACHING_MODE_AGENTS);
      expect(teachingModeConfig.recommendedSkills).toBeDefined();
      expect(teachingModeConfig.temperature).toBeDefined();
      expect(teachingModeConfig.maxTokens).toBeDefined();
    });

    it('should have balanced temperature for clarity', () => {
      expect(teachingModeConfig.temperature).toBe(0.5);
    });

    it('should have standard token limit', () => {
      expect(teachingModeConfig.maxTokens).toBe(4096);
    });
  });

  describe('System Prompt', () => {
    it('should define role as expert educator', () => {
      expect(TEACHING_MODE_SYSTEM_PROMPT).toContain('expert educator');
    });

    it('should mention curriculum design', () => {
      expect(TEACHING_MODE_SYSTEM_PROMPT).toContain('curriculum design');
    });

    it('should mention Bloom\'s Taxonomy', () => {
      expect(TEACHING_MODE_SYSTEM_PROMPT).toContain('Bloom\'s Taxonomy');
    });

    it('should emphasize learning objectives', () => {
      expect(TEACHING_MODE_SYSTEM_PROMPT).toContain('learning objectives');
    });
  });

  describe('Agents', () => {
    it('should export 2 agents', () => {
      expect(TEACHING_MODE_AGENTS).toHaveLength(2);
    });

    it('should have Curriculum Designer agent', () => {
      const designer = TEACHING_MODE_AGENTS.find((a: TeachingAgent) => a.name === 'Curriculum Designer');
      expect(designer).toBeDefined();
      expect(designer?.role).toBe('curriculum-designer');
      expect(designer?.systemPrompt).toContain('learning paths');
    });

    it('should have Tutor agent', () => {
      const tutor = TEACHING_MODE_AGENTS.find((a: TeachingAgent) => a.name === 'Tutor');
      expect(tutor).toBeDefined();
      expect(tutor?.role).toBe('tutor');
      expect(tutor?.systemPrompt).toContain('instruction');
    });

    it('all agents should have default models', () => {
      TEACHING_MODE_AGENTS.forEach((agent: TeachingAgent) => {
        expect(agent.defaultModel).toBeDefined();
        expect(agent.defaultModel).toMatch(/^claude-(sonnet|haiku|opus)/);
      });
    });
  });

  describe('Recommended Skills', () => {
    it('should include web-search for research', () => {
      expect(teachingModeConfig.recommendedSkills).toContain('web-search');
    });

    it('should include file-operations for materials', () => {
      expect(teachingModeConfig.recommendedSkills).toContain('file-operations');
    });
  });
});
