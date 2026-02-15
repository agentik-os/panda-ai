/**
 * Test Setup for CLI Package
 *
 * Global test setup for Vitest.
 * Runs before all test files.
 */

import { beforeEach, afterEach, vi } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import { randomUUID } from "crypto";
import * as os from "node:os";

// Mock console methods to avoid cluttering test output
beforeEach(() => {
  // Suppress console output during tests (optional)
  // Uncomment if you want silent tests
  // vi.spyOn(console, "log").mockImplementation(() => {});
  // vi.spyOn(console, "error").mockImplementation(() => {});
  // vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  // Restore all mocks after each test
  vi.restoreAllMocks();
});

/**
 * Helper: Create a temporary directory for test isolation
 */
export function createTempDir(prefix: string = "cli-test-"): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), prefix));
}

/**
 * Helper: Clean up temporary directory
 */
export function cleanupTempDir(dir: string): void {
  if (fs.existsSync(dir)) {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

/**
 * Helper: Mock HOME directory for CLI config tests
 */
export function mockHomeDir(): { homeDir: string; cleanup: () => void } {
  const tempHome = createTempDir("cli-home-");
  const originalHome = process.env.HOME;

  process.env.HOME = tempHome;

  return {
    homeDir: tempHome,
    cleanup: () => {
      process.env.HOME = originalHome;
      cleanupTempDir(tempHome);
    },
  };
}

/**
 * Helper: Create mock agent data
 */
export function createMockAgent(overrides: Record<string, unknown> = {}) {
  return {
    id: "test-agent-1",
    name: "Test Agent",
    model: "claude-3-5-sonnet-20241022",
    provider: "anthropic",
    description: "A test agent",
    systemPrompt: "You are a test agent",
    temperature: 0.7,
    maxTokens: 1024,
    channels: ["cli"],
    skills: ["web_search"],
    status: "active",
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...overrides,
  };
}

/**
 * Helper: Create mock conversation data
 */
export function createMockConversation(overrides: Record<string, unknown> = {}) {
  const now = new Date();
  const earlier = new Date(now.getTime() - 10000);

  return {
    id: randomUUID(),
    agentId: "test-agent-1",
    agentName: "TestAgent",
    channel: "cli",
    userId: "cli_user",
    messages: [
      {
        id: randomUUID(),
        role: "user" as const,
        content: "Hello",
        timestamp: earlier,
      },
      {
        id: randomUUID(),
        role: "assistant" as const,
        content: "Hi there!",
        timestamp: now,
      },
    ],
    startedAt: earlier,
    updatedAt: now,
    ...overrides,
  };
}
