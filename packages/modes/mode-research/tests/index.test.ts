import { describe, it, expect } from 'vitest';
import {
  researchModeConfig,
  RESEARCH_MODE_SYSTEM_PROMPT,
  RESEARCH_MODE_AGENTS,
  RESEARCH_MODE_SKILLS,
  RESEARCH_MODE_WORKFLOWS
} from '../src/index';

describe('Research Mode', () => {
  describe('Configuration', () => {
    it('should export valid config', () => {
      expect(researchModeConfig).toBeDefined();
      expect(researchModeConfig.temperature).toBe(0.4);
      expect(researchModeConfig.maxTokens).toBe(8192);
    });

    it('should have large token limit for comprehensive research', () => {
      expect(researchModeConfig.maxTokens).toBeGreaterThanOrEqual(8192);
    });
  });

  describe('System Prompt', () => {
    it('should emphasize research methodology', () => {
      expect(RESEARCH_MODE_SYSTEM_PROMPT).toContain('research');
      expect(RESEARCH_MODE_SYSTEM_PROMPT).toContain('citation');
      expect(RESEARCH_MODE_SYSTEM_PROMPT).toContain('evidence');
    });

    it('should mention fact-checking', () => {
      expect(RESEARCH_MODE_SYSTEM_PROMPT).toContain('fact-checking');
      expect(RESEARCH_MODE_SYSTEM_PROMPT).toContain('sources');
    });
  });

  describe('Agents', () => {
    it('should have 3 research agents', () => {
      expect(RESEARCH_MODE_AGENTS).toHaveLength(3);
    });

    it('should include Literature Reviewer', () => {
      const reviewer = RESEARCH_MODE_AGENTS.find(a => a.role === 'literature-reviewer');
      expect(reviewer).toBeDefined();
      expect(reviewer?.systemPrompt).toContain('literature');
    });

    it('should include Fact Checker', () => {
      const checker = RESEARCH_MODE_AGENTS.find(a => a.role === 'fact-checker');
      expect(checker).toBeDefined();
      expect(checker?.systemPrompt).toContain('fact');
    });

    it('should include Data Analyst', () => {
      const analyst = RESEARCH_MODE_AGENTS.find(a => a.role === 'data-analyst');
      expect(analyst).toBeDefined();
      expect(analyst?.systemPrompt).toContain('statistical');
    });
  });

  describe('Skills', () => {
    it('should include web-search for research', () => {
      expect(RESEARCH_MODE_SKILLS).toContain('web-search');
    });

    it('should include file operations', () => {
      expect(RESEARCH_MODE_SKILLS).toContain('file-operations');
    });
  });

  describe('Workflows', () => {
    it('should include Literature Review workflow', () => {
      const workflow = RESEARCH_MODE_WORKFLOWS.find(w => w.name.includes('Literature'));
      expect(workflow).toBeDefined();
      expect(workflow?.steps.length).toBeGreaterThan(4);
    });

    it('should include Fact-Check workflow', () => {
      const workflow = RESEARCH_MODE_WORKFLOWS.find(w => w.name.includes('Fact'));
      expect(workflow).toBeDefined();
    });

    it('should provide time estimates', () => {
      RESEARCH_MODE_WORKFLOWS.forEach(workflow => {
        expect(workflow.estimatedTime).toBeDefined();
      });
    });
  });
});
