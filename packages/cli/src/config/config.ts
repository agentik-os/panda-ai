import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { ConfigSchema, getDefaultConfig, type Config } from "./schema.js";
import type { ZodError } from "zod";

// Use process.env.HOME for testability, fall back to os.homedir()
const getConfigDir = () => join(process.env.HOME || homedir(), ".agentik-os");
const getConfigFile = () => join(getConfigDir(), "config.json");

/**
 * Configuration validation error
 */
export class ConfigValidationError extends Error {
  constructor(
    message: string,
    public errors: ZodError
  ) {
    super(message);
    this.name = "ConfigValidationError";
  }
}

/**
 * Configuration migration error
 */
export class ConfigMigrationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConfigMigrationError";
  }
}

/**
 * Load configuration from file
 * Creates default config if file doesn't exist
 */
export function loadConfig(): Config {
  // If config doesn't exist, create default
  if (!existsSync(getConfigFile())) {
    const defaultConfig = getDefaultConfig();
    saveConfig(defaultConfig);
    return defaultConfig;
  }

  try {
    const data = readFileSync(getConfigFile(), "utf-8");
    const parsed = JSON.parse(data);

    // Migrate if needed
    const migrated = migrateConfig(parsed);

    // Validate with Zod
    const result = ConfigSchema.safeParse(migrated);

    if (!result.success) {
      throw new ConfigValidationError(
        "Configuration validation failed",
        result.error
      );
    }

    return result.data;
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }

    if (error instanceof SyntaxError) {
      throw new Error(`Invalid JSON in config file: ${error.message}`);
    }

    throw new Error(
      `Failed to load config: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * Save configuration to file
 */
export function saveConfig(config: Config): void {
  try {
    // Ensure directory exists
    if (!existsSync(getConfigDir())) {
      mkdirSync(getConfigDir(), { recursive: true });
    }

    // Validate before saving
    const result = ConfigSchema.safeParse(config);

    if (!result.success) {
      throw new ConfigValidationError(
        "Configuration validation failed",
        result.error
      );
    }

    // Write with pretty formatting
    const data = JSON.stringify(result.data, null, 2);
    writeFileSync(getConfigFile(), data, "utf-8");
  } catch (error) {
    if (error instanceof ConfigValidationError) {
      throw error;
    }

    throw new Error(
      `Failed to save config: ${error instanceof Error ? error.message : error}`
    );
  }
}

/**
 * Validate configuration without loading from file
 */
export function validateConfig(config: unknown): Config {
  const result = ConfigSchema.safeParse(config);

  if (!result.success) {
    throw new ConfigValidationError(
      "Configuration validation failed",
      result.error
    );
  }

  return result.data;
}

/**
 * Migrate configuration from older versions
 * Handles version changes and schema updates
 */
export function migrateConfig(config: any): any {
  // Get current version or default to 1.0.0
  const version = config.version || "1.0.0";

  // Migration chain
  let migrated = config;

  // Example: Migrate from 1.0.0 to 1.1.0
  if (version === "1.0.0") {
    // Add any new fields with defaults
    migrated = {
      ...migrated,
      // Future migrations would go here
    };
  }

  // Always ensure version is set
  migrated.version = "1.0.0"; // Current version

  return migrated;
}

/**
 * Get config file path
 */
export function getConfigPath(): string {
  return getConfigFile();
}

/**
 * Check if config file exists
 */
export function configExists(): boolean {
  return existsSync(getConfigFile());
}

/**
 * Reset configuration to defaults
 */
export function resetConfig(): Config {
  const defaultConfig = getDefaultConfig();
  saveConfig(defaultConfig);
  return defaultConfig;
}

/**
 * Update specific config values
 * Merges with existing config
 */
export function updateConfig(updates: Partial<Config>): Config {
  const current = loadConfig();
  const updated = {
    ...current,
    ...updates,
  };

  saveConfig(updated);
  return updated;
}
