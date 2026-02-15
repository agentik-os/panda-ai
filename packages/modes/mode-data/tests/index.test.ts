import { describe, it, expect } from 'vitest';
import {
  dataModeConfig,
  DATA_MODE_SYSTEM_PROMPT,
  DATA_MODE_AGENTS,
  type DataAgent,
} from '../src/index';

describe('Data Mode', () => {
  describe('Configuration', () => {
    it('should export dataModeConfig with correct structure', () => {
      expect(dataModeConfig).toBeDefined();
      expect(dataModeConfig.systemPrompt).toBe(DATA_MODE_SYSTEM_PROMPT);
      expect(dataModeConfig.agents).toBe(DATA_MODE_AGENTS);
      expect(dataModeConfig.recommendedSkills).toBeDefined();
      expect(dataModeConfig.temperature).toBeDefined();
      expect(dataModeConfig.maxTokens).toBeDefined();
    });

    it('should have appropriate temperature for analytical tasks', () => {
      expect(dataModeConfig.temperature).toBe(0.3);
    });

    it('should have large token limit for datasets', () => {
      expect(dataModeConfig.maxTokens).toBe(8192);
    });
  });

  describe('System Prompt', () => {
    it('should define role as data scientist', () => {
      expect(DATA_MODE_SYSTEM_PROMPT).toContain('data scientist');
    });

    it('should mention statistical analysis', () => {
      expect(DATA_MODE_SYSTEM_PROMPT).toContain('statistical analysis');
    });

    it('should mention machine learning', () => {
      expect(DATA_MODE_SYSTEM_PROMPT).toContain('machine learning');
    });

    it('should mention data visualization', () => {
      expect(DATA_MODE_SYSTEM_PROMPT).toContain('visualization');
    });

    it('should emphasize data-driven decisions', () => {
      expect(DATA_MODE_SYSTEM_PROMPT).toContain('data-driven');
    });
  });

  describe('Agents', () => {
    it('should export 3 agents', () => {
      expect(DATA_MODE_AGENTS).toHaveLength(3);
    });

    it('should have Data Analyst agent', () => {
      const analyst = DATA_MODE_AGENTS.find((a: DataAgent) => a.name === 'Data Analyst');
      expect(analyst).toBeDefined();
      expect(analyst?.role).toBe('data-analyst');
      expect(analyst?.systemPrompt).toContain('exploratory data analysis');
    });

    it('should have Visualization Specialist agent', () => {
      const viz = DATA_MODE_AGENTS.find((a: DataAgent) => a.name === 'Visualization Specialist');
      expect(viz).toBeDefined();
      expect(viz?.role).toBe('visualization-specialist');
      expect(viz?.systemPrompt).toContain('visualization');
    });

    it('should have ML Engineer agent', () => {
      const ml = DATA_MODE_AGENTS.find((a: DataAgent) => a.name === 'ML Engineer');
      expect(ml).toBeDefined();
      expect(ml?.role).toBe('ml-engineer');
      expect(ml?.systemPrompt).toContain('machine learning');
    });

    it('all agents should have default models', () => {
      DATA_MODE_AGENTS.forEach((agent: DataAgent) => {
        expect(agent.defaultModel).toBeDefined();
        expect(agent.defaultModel).toMatch(/^claude-(sonnet|haiku|opus)/);
      });
    });
  });

  describe('Recommended Skills', () => {
    it('should include file-operations for dataset access', () => {
      expect(dataModeConfig.recommendedSkills).toContain('file-operations');
    });

    it('should include web-search for research', () => {
      expect(dataModeConfig.recommendedSkills).toContain('web-search');
    });

    it('should include sql-query for database access', () => {
      expect(dataModeConfig.recommendedSkills).toContain('sql-query');
    });

    it('should include python-exec for analysis', () => {
      expect(dataModeConfig.recommendedSkills).toContain('python-exec');
    });
  });
});
