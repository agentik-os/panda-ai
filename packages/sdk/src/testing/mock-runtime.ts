/**
 * Mock Runtime for Skill Testing
 * Step-130: Provides mock context and input factories
 */

import type { SkillContext, SkillInput, LogLevel } from "../types.js";

/**
 * Options for creating a mock context
 */
export interface MockContextOptions {
  agentId?: string;
  userId?: string;
  conversationId?: string;
  config?: Record<string, unknown>;
  captureLog?: boolean;
}

/**
 * Mock context with captured log messages
 */
export interface MockContext extends SkillContext {
  logs: Array<{ level: LogLevel; message: string; data?: Record<string, unknown> }>;
}

/**
 * Create a mock SkillContext for testing
 *
 * @param options - Optional overrides
 * @returns Mock context with log capture
 *
 * @example
 * ```typescript
 * const ctx = createMockContext({ agentId: "test-agent" });
 * skill.setContext(ctx);
 * await skill.execute(input);
 * expect(ctx.logs).toHaveLength(2);
 * ```
 */
export function createMockContext(options: MockContextOptions = {}): MockContext {
  const logs: MockContext["logs"] = [];

  return {
    agentId: options.agentId ?? "test-agent",
    userId: options.userId ?? "test-user",
    conversationId: options.conversationId ?? "test-conversation",
    config: options.config ?? {},
    log: (level: LogLevel, message: string, data?: Record<string, unknown>) => {
      logs.push({ level, message, data });
    },
    logs,
  };
}

/**
 * Create a mock SkillInput for testing
 *
 * @param overrides - Fields to include in the input
 * @returns Mock input object
 *
 * @example
 * ```typescript
 * const input = createMockInput({ query: "test" });
 * const result = await skill.execute(input);
 * ```
 */
export function createMockInput<T extends SkillInput>(
  overrides: Partial<T> & Record<string, unknown> = {}
): T {
  return {
    agentId: "test-agent",
    userId: "test-user",
    conversationId: "test-conversation",
    ...overrides,
  } as T;
}
