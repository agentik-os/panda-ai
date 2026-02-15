/**
 * Agentik OS SDK
 *
 * Build powerful skills for AI agents with the Agentik OS SDK.
 *
 * @packageDocumentation
 */

// Export base class
export { SkillBase } from "./SkillBase.js";

// Export types
export type {
  SkillInput,
  SkillOutput,
  ConfigField,
  SkillMetadata,
  SkillContext,
  LogLevel,
} from "./types.js";

// Export testing utilities
export {
  createMockContext,
  createMockInput,
} from "./testing/mock-runtime.js";
export {
  assertSkillSuccess,
  assertSkillError,
  assertSkillOutput,
  assertSkillMetadata,
  assertExecutionTime,
} from "./testing/assertions.js";
export {
  SkillTestRunner,
  type TestResults,
  type TestCase,
} from "./testing/test-runner.js";

/**
 * SDK Version
 */
export const SDK_VERSION = "1.0.0";
