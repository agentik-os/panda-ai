/**
 * Vitest Global Setup
 *
 * This file runs before all tests and sets up the testing environment
 */

import { vi } from 'vitest';

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.ANTHROPIC_API_KEY = 'sk-test-key';
process.env.OPENAI_API_KEY = 'sk-test-key';

// Global test utilities
global.mockDelay = (ms: number) =>
  new Promise(resolve => setTimeout(resolve, ms));

// Mock console methods to reduce noise in tests
const originalConsole = { ...console };

beforeAll(() => {
  global.console = {
    ...console,
    log: vi.fn(), // Silent
    debug: vi.fn(), // Silent
    info: vi.fn(), // Silent
    warn: originalConsole.warn, // Keep warnings
    error: originalConsole.error // Keep errors
  };
});

afterAll(() => {
  global.console = originalConsole;
});

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks();
  vi.clearAllTimers();
});
