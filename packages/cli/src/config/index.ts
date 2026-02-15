/**
 * Configuration module for Agentik OS CLI
 */

export {
  loadConfig,
  saveConfig,
  validateConfig,
  migrateConfig,
  getConfigPath,
  configExists,
  resetConfig,
  updateConfig,
  ConfigValidationError,
  ConfigMigrationError,
} from "./config.js";

export { ConfigSchema, getDefaultConfig, type Config } from "./schema.js";
