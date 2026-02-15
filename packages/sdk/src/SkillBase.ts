/**
 * Base class for all skills
 * @packageDocumentation
 */

import type {
  SkillInput,
  SkillOutput,
  ConfigField,
  SkillContext,
  LogLevel,
} from "./types.js";

/**
 * Abstract base class for creating skills
 *
 * @typeParam TInput - Input type extending SkillInput
 * @typeParam TOutput - Output type extending SkillOutput
 *
 * @example
 * ```typescript
 * class MySkill extends SkillBase<MyInput, MyOutput> {
 *   id = "my-skill";
 *   name = "My Skill";
 *   description = "Does something useful";
 *   version = "1.0.0";
 *
 *   async execute(input: MyInput): Promise<MyOutput> {
 *     // Your logic here
 *     return { success: true, result: "done" };
 *   }
 * }
 * ```
 */
export abstract class SkillBase<
  TInput extends SkillInput = SkillInput,
  TOutput extends SkillOutput = SkillOutput
> {
  // ============================================================================
  // Required Metadata
  // ============================================================================

  /** Unique skill identifier (e.g., "web-search") */
  abstract id: string;

  /** Human-readable skill name */
  abstract name: string;

  /** Short description of what this skill does */
  abstract description: string;

  /** Semantic version (e.g., "1.0.0") */
  abstract version: string;

  // ============================================================================
  // Optional Metadata
  // ============================================================================

  /** Author name or organization */
  author?: string;

  /** Required permissions (e.g., ["network:http", "fs:read:/tmp/*"]) */
  permissions?: string[];

  /** Configuration schema */
  configSchema?: Record<string, ConfigField>;

  /** Tags for discovery (e.g., ["api", "data", "weather"]) */
  tags?: string[];

  // ============================================================================
  // Runtime Context
  // ============================================================================

  /** Skill configuration (set by runtime) */
  protected config: Record<string, unknown> = {};

  /** Execution context (set by runtime) */
  protected context?: SkillContext;

  // ============================================================================
  // Constructor
  // ============================================================================

  /**
   * Create a skill instance
   *
   * @param config - Optional configuration
   */
  constructor(config?: Record<string, unknown>) {
    if (config) {
      this.config = config;
    }
  }

  // ============================================================================
  // Core Methods
  // ============================================================================

  /**
   * Main execution method - implement your skill logic here
   *
   * @param input - Skill input data
   * @returns Promise resolving to skill output
   *
   * @example
   * ```typescript
   * async execute(input: MyInput): Promise<MyOutput> {
   *   // Validate input
   *   if (!input.requiredField) {
   *     throw new Error("requiredField is required");
   *   }
   *
   *   // Your logic
   *   const result = await doSomething(input);
   *
   *   // Return output
   *   return { success: true, result };
   * }
   * ```
   */
  abstract execute(input: TInput): Promise<TOutput>;

  // ============================================================================
  // Lifecycle Hooks (Optional)
  // ============================================================================

  /**
   * Called when skill is installed
   * Use for one-time setup (create directories, download data, etc.)
   */
  async onInstall?(): Promise<void>;

  /**
   * Called when skill is uninstalled
   * Use for cleanup (remove files, close connections, etc.)
   */
  async onUninstall?(): Promise<void>;

  /**
   * Called when skill configuration is updated
   *
   * @param config - New configuration
   */
  async onConfigure?(config: Record<string, unknown>): Promise<void>;

  // ============================================================================
  // Helper Methods
  // ============================================================================

  /**
   * Set execution context (called by runtime)
   *
   * @param context - Execution context
   * @internal
   */
  setContext(context: SkillContext): void {
    this.context = context;
    this.config = context.config;
  }

  /**
   * Log a message
   *
   * @param level - Log level
   * @param message - Log message
   * @param data - Optional structured data
   *
   * @example
   * ```typescript
   * this.log("info", "Processing request", { userId: "123" });
   * this.log("error", "Request failed", { error: err.message });
   * ```
   */
  protected log(
    level: LogLevel,
    message: string,
    data?: Record<string, unknown>
  ): void {
    if (this.context?.log) {
      this.context.log(level, message, data);
    } else {
      // Fallback to console if no logger
      console.log(`[${level.toUpperCase()}] ${message}`, data || "");
    }
  }

  /**
   * Validate configuration against schema
   *
   * @throws Error if configuration is invalid
   *
   * @example
   * ```typescript
   * constructor(config: Record<string, unknown>) {
   *   super(config);
   *   this.validateConfig();
   * }
   * ```
   */
  protected validateConfig(): void {
    if (!this.configSchema) return;

    for (const [key, schema] of Object.entries(this.configSchema)) {
      const value = this.config[key];

      // Check required
      if (schema.required && (value === undefined || value === null)) {
        throw new Error(`Config field '${key}' is required`);
      }

      // Check type
      if (value !== undefined && value !== null) {
        const actualType = Array.isArray(value) ? "array" : typeof value;
        if (actualType !== schema.type) {
          throw new Error(
            `Config field '${key}' must be ${schema.type}, got ${actualType}`
          );
        }

        // Additional validation for strings
        if (schema.type === "string" && typeof value === "string") {
          if (schema.pattern) {
            const regex = new RegExp(schema.pattern);
            if (!regex.test(value)) {
              throw new Error(
                `Config field '${key}' does not match pattern: ${schema.pattern}`
              );
            }
          }

          if (schema.enum && !schema.enum.includes(value)) {
            throw new Error(
              `Config field '${key}' must be one of: ${schema.enum.join(", ")}`
            );
          }
        }

        // Additional validation for numbers
        if (schema.type === "number" && typeof value === "number") {
          if (schema.min !== undefined && value < schema.min) {
            throw new Error(
              `Config field '${key}' must be >= ${schema.min}`
            );
          }

          if (schema.max !== undefined && value > schema.max) {
            throw new Error(
              `Config field '${key}' must be <= ${schema.max}`
            );
          }
        }
      }
    }
  }

  /**
   * Get skill metadata
   *
   * @returns Skill metadata object
   */
  getMetadata() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      version: this.version,
      author: this.author,
      permissions: this.permissions || [],
      configSchema: this.configSchema || {},
      tags: this.tags || [],
    };
  }
}
