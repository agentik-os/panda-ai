/**
 * SDK Type Definitions
 * @packageDocumentation
 */

/**
 * Base input interface for all skills
 */
export interface SkillInput {
  /** Agent that called this skill */
  agentId?: string;

  /** User who triggered this skill execution */
  userId?: string;

  /** Conversation/session ID */
  conversationId?: string;

  /** Previous skill outputs in execution chain */
  context?: Record<string, unknown>;

  /** Custom fields */
  [key: string]: unknown;
}

/**
 * Base output interface for all skills
 */
export interface SkillOutput {
  /** Whether skill execution succeeded */
  success: boolean;

  /** Error message if execution failed */
  error?: string;

  /** Custom fields */
  [key: string]: unknown;
}

/**
 * Configuration field schema
 */
export interface ConfigField {
  /** Field data type */
  type: "string" | "number" | "boolean" | "object" | "array";

  /** Whether field is required */
  required?: boolean;

  /** Human-readable description */
  description?: string;

  /** Default value */
  default?: unknown;

  /** Whether field contains sensitive data (API keys, passwords) */
  sensitive?: boolean;

  /** Validation pattern (for strings) */
  pattern?: string;

  /** Minimum value (for numbers) */
  min?: number;

  /** Maximum value (for numbers) */
  max?: number;

  /** Allowed values (enum) */
  enum?: unknown[];
}

/**
 * Skill metadata
 */
export interface SkillMetadata {
  /** Unique skill identifier */
  id: string;

  /** Human-readable name */
  name: string;

  /** Short description */
  description: string;

  /** Semantic version */
  version: string;

  /** Author name or organization */
  author?: string;

  /** Required permissions */
  permissions?: string[];

  /** Configuration schema */
  configSchema?: Record<string, ConfigField>;

  /** Tags for discovery */
  tags?: string[];
}

/**
 * Skill execution context
 */
export interface SkillContext {
  /** Agent executing this skill */
  agentId: string;

  /** User who triggered execution */
  userId?: string;

  /** Conversation/session ID */
  conversationId?: string;

  /** Skill configuration */
  config: Record<string, unknown>;

  /** Logger instance */
  log: (level: LogLevel, message: string, data?: Record<string, unknown>) => void;
}

/**
 * Log levels
 */
export type LogLevel = "info" | "warn" | "error" | "debug" | "success";
