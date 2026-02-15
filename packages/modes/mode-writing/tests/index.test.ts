import { describe, it, expect } from 'vitest';
import { writingModeConfig, WRITING_MODE_AGENTS } from '../src/index';

describe('Writing Mode', () => {
  it('should have creative temperature', () => {
    expect(writingModeConfig.temperature).toBeGreaterThan(0.5);
  });

  it('should have 3 agents', () => {
    expect(WRITING_MODE_AGENTS).toHaveLength(3);
  });

  it('should include Content Writer', () => {
    const writer = WRITING_MODE_AGENTS.find(a => a.role === 'content-writer');
    expect(writer).toBeDefined();
  });
});
