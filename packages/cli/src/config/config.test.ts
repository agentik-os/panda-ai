import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync, unlinkSync, rmdirSync } from "fs";
import { join } from "path";
import {
  loadConfig,
  saveConfig,
  validateConfig,
  migrateConfig,
  configExists,
  resetConfig,
  updateConfig,
  ConfigValidationError,
} from "./config.js";
import { getDefaultConfig } from "./schema.js";

describe("Config Module", () => {
  const originalHome = process.env.HOME;
  let testHome: string;

  beforeEach(() => {
    // Create unique temp HOME for each test
    testHome = join(process.cwd(), `.test-home-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    process.env.HOME = testHome;
  });

  afterEach(() => {
    // Clean up test config
    const configDir = join(testHome, ".agentik-os");
    const configFile = join(configDir, "config.json");

    if (existsSync(configFile)) {
      unlinkSync(configFile);
    }
    if (existsSync(configDir)) {
      try {
        rmdirSync(configDir);
      } catch (e) {
        // Directory might not be empty, ignore
      }
    }

    // Restore original HOME
    process.env.HOME = originalHome;
  });

  describe("getDefaultConfig", () => {
    it("should return valid default configuration", () => {
      const config = getDefaultConfig();

      expect(config).toBeDefined();
      expect(config.version).toBe("1.0.0");
      expect(config.runtime).toBeDefined();
      expect(config.models).toBeDefined();
      expect(config.router).toBeDefined();
      expect(config.memory).toBeDefined();
      expect(config.security).toBeDefined();
      expect(config.dashboard).toBeDefined();
    });

    it("should have all required model providers", () => {
      const config = getDefaultConfig();

      expect(config.models.anthropic).toBeDefined();
      expect(config.models.openai).toBeDefined();
      expect(config.models.google).toBeDefined();
      expect(config.models.ollama).toBeDefined();
    });
  });

  describe("validateConfig", () => {
    it("should validate correct configuration", () => {
      const config = getDefaultConfig();
      expect(() => validateConfig(config)).not.toThrow();
    });

    it("should throw on invalid configuration", () => {
      const invalid = {
        version: "1.0.0",
        runtime: {
          port: "not a number", // Invalid: should be number
          host: "localhost",
        },
      };

      expect(() => validateConfig(invalid)).toThrow(ConfigValidationError);
    });

    it("should throw on missing required fields", () => {
      const incomplete = {
        version: "1.0.0",
        // Missing runtime, models, etc.
      };

      expect(() => validateConfig(incomplete)).toThrow(ConfigValidationError);
    });
  });

  describe("migrateConfig", () => {
    it("should add version to config without version", () => {
      const configWithoutVersion = {
        runtime: { port: 3000, host: "localhost", dataDir: "~/.agentik-os/data" },
      };

      const migrated = migrateConfig(configWithoutVersion);
      expect(migrated.version).toBe("1.0.0");
    });

    it("should preserve existing version", () => {
      const configWithVersion = {
        version: "1.0.0",
        runtime: { port: 3000, host: "localhost", dataDir: "~/.agentik-os/data" },
      };

      const migrated = migrateConfig(configWithVersion);
      expect(migrated.version).toBe("1.0.0");
    });
  });

  describe("configExists", () => {
    it("should return false when config does not exist", () => {
      expect(configExists()).toBe(false);
    });

    it("should return true when config exists", () => {
      const config = getDefaultConfig();
      saveConfig(config);
      expect(configExists()).toBe(true);
    });
  });

  describe("saveConfig and loadConfig", () => {
    it("should save and load config successfully", () => {
      const config = getDefaultConfig();
      config.runtime.port = 4000;

      saveConfig(config);
      const loaded = loadConfig();

      expect(loaded.runtime.port).toBe(4000);
    });

    it("should create default config if file does not exist", () => {
      const loaded = loadConfig();

      expect(loaded).toBeDefined();
      expect(loaded.version).toBe("1.0.0");
    });

    it("should validate config before saving", () => {
      const invalid: any = {
        version: "1.0.0",
        runtime: {
          port: -1, // Invalid: port must be > 0
        },
      };

      expect(() => saveConfig(invalid)).toThrow(ConfigValidationError);
    });
  });

  describe("resetConfig", () => {
    it("should reset config to defaults", () => {
      // Save custom config
      const config = getDefaultConfig();
      config.runtime.port = 5000;
      saveConfig(config);

      // Reset
      const reset = resetConfig();

      expect(reset.runtime.port).toBe(3000); // Default value
    });
  });

  describe("updateConfig", () => {
    it("should update specific config values", () => {
      // Create initial config
      const config = getDefaultConfig();
      saveConfig(config);

      // Update runtime port
      const updated = updateConfig({
        runtime: {
          port: 8080,
          host: "0.0.0.0",
          dataDir: "~/.agentik-os/data",
        },
      });

      expect(updated.runtime.port).toBe(8080);
      expect(updated.runtime.host).toBe("0.0.0.0");

      // Verify persisted
      const loaded = loadConfig();
      expect(loaded.runtime.port).toBe(8080);
    });
  });
});
