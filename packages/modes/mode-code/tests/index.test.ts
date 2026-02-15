import { describe, it, expect } from 'vitest';
import {
  codeModeConfig,
  CODE_MODE_SYSTEM_PROMPT,
  CODE_MODE_AGENTS,
  CODE_MODE_SKILLS,
  CODE_MODE_WORKFLOWS
} from '../src/index';

describe('Code Mode', () => {
  describe('Configuration', () => {
    it('should export valid config', () => {
      expect(codeModeConfig).toBeDefined();
      expect(codeModeConfig.systemPrompt).toBe(CODE_MODE_SYSTEM_PROMPT);
      expect(codeModeConfig.temperature).toBe(0.3);
      expect(codeModeConfig.maxTokens).toBe(4096);
    });

    it('should have low temperature for precise code analysis', () => {
      expect(codeModeConfig.temperature).toBeLessThanOrEqual(0.5);
    });

    it('should have sufficient token limit', () => {
      expect(codeModeConfig.maxTokens).toBeGreaterThanOrEqual(4096);
    });
  });

  describe('System Prompt', () => {
    it('should mention key capabilities', () => {
      expect(CODE_MODE_SYSTEM_PROMPT).toContain('code review');
      expect(CODE_MODE_SYSTEM_PROMPT).toContain('debugging');
      expect(CODE_MODE_SYSTEM_PROMPT).toContain('testing');
    });

    it('should reference security checks', () => {
      expect(CODE_MODE_SYSTEM_PROMPT).toContain('Security');
      expect(CODE_MODE_SYSTEM_PROMPT).toContain('XSS');
      expect(CODE_MODE_SYSTEM_PROMPT).toContain('SQL injection');
    });

    it('should emphasize code examples', () => {
      expect(CODE_MODE_SYSTEM_PROMPT).toContain('code examples');
    });
  });

  describe('Agents', () => {
    it('should have 3 specialized agents', () => {
      expect(CODE_MODE_AGENTS).toHaveLength(3);
    });

    it('should include Code Reviewer agent', () => {
      const reviewer = CODE_MODE_AGENTS.find(a => a.role === 'code-reviewer');
      expect(reviewer).toBeDefined();
      expect(reviewer?.name).toBe('Code Reviewer');
      expect(reviewer?.systemPrompt).toContain('code reviewer');
    });

    it('should include Bug Hunter agent', () => {
      const bugHunter = CODE_MODE_AGENTS.find(a => a.role === 'bug-hunter');
      expect(bugHunter).toBeDefined();
      expect(bugHunter?.name).toBe('Bug Hunter');
      expect(bugHunter?.systemPrompt).toContain('debugging');
    });

    it('should include Test Engineer agent', () => {
      const testEngineer = CODE_MODE_AGENTS.find(a => a.role === 'test-engineer');
      expect(testEngineer).toBeDefined();
      expect(testEngineer?.name).toBe('Test Engineer');
      expect(testEngineer?.systemPrompt).toContain('test');
    });

    it('should use appropriate models', () => {
      const reviewer = CODE_MODE_AGENTS.find(a => a.role === 'code-reviewer');
      expect(reviewer?.defaultModel).toMatch(/claude-(sonnet|opus)/);
    });
  });

  describe('Skills', () => {
    it('should recommend essential code skills', () => {
      expect(CODE_MODE_SKILLS).toContain('file-operations');
      expect(CODE_MODE_SKILLS).toContain('web-search');
    });

    it('should have at least 3 skills', () => {
      expect(CODE_MODE_SKILLS.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Workflows', () => {
    it('should include Code Review workflow', () => {
      const workflow = CODE_MODE_WORKFLOWS.find(w => w.name === 'Code Review');
      expect(workflow).toBeDefined();
      expect(workflow?.steps.length).toBeGreaterThan(3);
    });

    it('should include Debug workflow', () => {
      const workflow = CODE_MODE_WORKFLOWS.find(w => w.name.includes('Debug'));
      expect(workflow).toBeDefined();
      expect(workflow?.steps.length).toBeGreaterThan(3);
    });

    it('should include TDD workflow', () => {
      const workflow = CODE_MODE_WORKFLOWS.find(w => w.name.includes('Feature'));
      expect(workflow).toBeDefined();
      expect(workflow?.steps).toContain(expect.stringContaining('test'));
    });

    it('should provide time estimates', () => {
      CODE_MODE_WORKFLOWS.forEach(workflow => {
        expect(workflow.estimatedTime).toBeDefined();
        expect(workflow.estimatedTime).toMatch(/\d+/);
      });
    });
  });
});
