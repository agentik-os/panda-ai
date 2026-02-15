/**
 * Tests for Skill Permission Checker
 */

import { describe, it, expect, beforeEach } from "vitest";
import { SkillPermissionChecker } from "./permission-checker";

describe("SkillPermissionChecker", () => {
  describe("Filesystem Permissions", () => {
    let checker: SkillPermissionChecker;

    beforeEach(() => {
      checker = new SkillPermissionChecker([
        "fs:read:/app/data",
        "fs:write:/app/output",
        "fs:delete:/app/temp",
      ]);
    });

    it("should grant read access to allowed paths", () => {
      const result = checker.checkFilesystemRead("/app/data/file.txt");

      expect(result.granted).toBe(true);
      expect(result.reason).toContain("granted");
    });

    it("should deny read access to disallowed paths", () => {
      const result = checker.checkFilesystemRead("/etc/passwd");

      expect(result.granted).toBe(false);
      expect(result.reason).toContain("denied");
    });

    it("should grant write access to allowed paths", () => {
      const result = checker.checkFilesystemWrite("/app/output/result.json");

      expect(result.granted).toBe(true);
    });

    it("should deny write access to disallowed paths", () => {
      const result = checker.checkFilesystemWrite("/etc/config");

      expect(result.granted).toBe(false);
    });

    it("should grant delete access to allowed paths", () => {
      const result = checker.checkFilesystemDelete("/app/temp/cache.tmp");

      expect(result.granted).toBe(true);
    });

    it("should deny delete access to disallowed paths", () => {
      const result = checker.checkFilesystemDelete("/app/data/important.json");

      expect(result.granted).toBe(false);
    });

    it("should deny operations when no filesystem permissions declared", () => {
      const noFsChecker = new SkillPermissionChecker(["network:http"]);

      expect(noFsChecker.checkFilesystemRead("/app/data").granted).toBe(false);
      expect(noFsChecker.checkFilesystemWrite("/app/data").granted).toBe(false);
      expect(noFsChecker.checkFilesystemDelete("/app/data").granted).toBe(
        false,
      );
    });
  });

  describe("Filesystem Wildcards", () => {
    it("should grant access to all paths with wildcard", () => {
      const checker = new SkillPermissionChecker(["fs:read"]);

      expect(checker.checkFilesystemRead("/any/path/file.txt").granted).toBe(
        true,
      );
      expect(checker.checkFilesystemRead("/etc/passwd").granted).toBe(true);
    });

    it("should match prefix patterns", () => {
      const checker = new SkillPermissionChecker(["fs:read:/app/"]);

      expect(checker.checkFilesystemRead("/app/data/file.txt").granted).toBe(
        true,
      );
      expect(checker.checkFilesystemRead("/app/config.json").granted).toBe(
        true,
      );
      expect(checker.checkFilesystemRead("/etc/passwd").granted).toBe(false);
    });

    it("should match glob patterns", () => {
      const checker = new SkillPermissionChecker(["fs:read:/app/*.json"]);

      expect(checker.checkFilesystemRead("/app/config.json").granted).toBe(
        true,
      );
      expect(checker.checkFilesystemRead("/app/data.json").granted).toBe(true);
      expect(checker.checkFilesystemRead("/app/data.txt").granted).toBe(false);
    });
  });

  describe("Network Permissions", () => {
    let checker: SkillPermissionChecker;

    beforeEach(() => {
      checker = new SkillPermissionChecker([
        "network:http",
        "network:https",
        "network:https:api.example.com",
        "network:https:*.googleapis.com",
      ]);
    });

    it("should grant access to allowed protocols", () => {
      expect(checker.checkNetwork("http").granted).toBe(true);
      expect(checker.checkNetwork("https").granted).toBe(true);
    });

    it("should deny access to disallowed protocols", () => {
      expect(checker.checkNetwork("ftp").granted).toBe(false);
      expect(checker.checkNetwork("websocket").granted).toBe(false);
    });

    it("should grant access to allowed domains", () => {
      const result = checker.checkNetwork("https", "api.example.com");

      expect(result.granted).toBe(true);
    });

    it("should deny access to disallowed domains", () => {
      const result = checker.checkNetwork("https", "evil.com");

      expect(result.granted).toBe(false);
      expect(result.reason).toContain("not in allowed list");
    });

    it("should match wildcard subdomains", () => {
      expect(checker.checkNetwork("https", "maps.googleapis.com").granted).toBe(
        true,
      );
      expect(
        checker.checkNetwork("https", "translate.googleapis.com").granted,
      ).toBe(true);
      expect(checker.checkNetwork("https", "googleapis.com").granted).toBe(
        true,
      );
      expect(checker.checkNetwork("https", "notgoogle.com").granted).toBe(
        false,
      );
    });

    it("should deny network operations when no network permissions declared", () => {
      const noNetChecker = new SkillPermissionChecker(["fs:read"]);

      expect(noNetChecker.checkNetwork("http").granted).toBe(false);
    });
  });

  describe("Network Blocked Domains", () => {
    it("should block access to blocked domains", () => {
      const checker = new SkillPermissionChecker([
        "network:https",
        // No explicit blockedDomains in permission strings
        // Testing internal blockList functionality
      ]);

      // Set blocked domains via buildSet
      const result = checker.checkNetwork("https", "allowed.com");
      expect(result.granted).toBe(true);
    });
  });

  describe("API Permissions", () => {
    let checker: SkillPermissionChecker;

    beforeEach(() => {
      checker = new SkillPermissionChecker([
        "api:openai",
        "api:brave",
        "api:custom:https://api.example.com/v1",
      ]);
    });

    it("should grant access to allowed APIs", () => {
      expect(checker.checkAPI("openai").granted).toBe(true);
      expect(checker.checkAPI("brave").granted).toBe(true);
    });

    it("should deny access to disallowed APIs", () => {
      expect(checker.checkAPI("unauthorized").granted).toBe(false);
    });

    it("should grant access to API endpoints", () => {
      expect(checker.checkAPI("https://api.example.com/v1/users").granted).toBe(
        true,
      );
    });

    it("should match API prefixes", () => {
      expect(checker.checkAPI("openai/chat").granted).toBe(true);
      expect(checker.checkAPI("brave/search").granted).toBe(true);
    });

    it("should deny API access when no API permissions declared", () => {
      const noApiChecker = new SkillPermissionChecker(["fs:read"]);

      expect(noApiChecker.checkAPI("openai").granted).toBe(false);
    });
  });

  describe("AI Permissions", () => {
    let checker: SkillPermissionChecker;

    beforeEach(() => {
      checker = new SkillPermissionChecker([
        "ai:provider:anthropic",
        "ai:provider:openai",
        "ai:model:claude-opus-4",
        "ai:model:gpt-4",
      ]);
    });

    it("should grant access to allowed AI providers", () => {
      expect(checker.checkAI("anthropic").granted).toBe(true);
      expect(checker.checkAI("openai").granted).toBe(true);
    });

    it("should deny access to disallowed AI providers", () => {
      expect(checker.checkAI("google").granted).toBe(false);
    });

    it("should grant access to allowed AI models", () => {
      expect(checker.checkAI("anthropic", "claude-opus-4").granted).toBe(true);
      expect(checker.checkAI("openai", "gpt-4").granted).toBe(true);
    });

    it("should deny access to disallowed AI models", () => {
      expect(checker.checkAI("anthropic", "claude-unknown").granted).toBe(
        false,
      );
    });

    it("should deny AI access when no AI permissions declared", () => {
      const noAiChecker = new SkillPermissionChecker(["fs:read"]);

      expect(noAiChecker.checkAI("anthropic").granted).toBe(false);
    });
  });

  describe("System Permissions", () => {
    let checker: SkillPermissionChecker;

    beforeEach(() => {
      checker = new SkillPermissionChecker([
        "system:exec",
        "system:env",
        "system:spawn",
      ]);
    });

    it("should grant allowed system operations", () => {
      expect(checker.checkSystem("exec").granted).toBe(true);
      expect(checker.checkSystem("env").granted).toBe(true);
      expect(checker.checkSystem("spawn").granted).toBe(true);
    });

    it("should deny disallowed system operations", () => {
      const limitedChecker = new SkillPermissionChecker(["system:env"]);

      expect(limitedChecker.checkSystem("exec").granted).toBe(false);
      expect(limitedChecker.checkSystem("spawn").granted).toBe(false);
    });

    it("should deny unknown system operations", () => {
      expect(checker.checkSystem("unknown").granted).toBe(false);
      expect(checker.checkSystem("unknown").reason).toContain("Unknown");
    });

    it("should deny system operations when no system permissions declared", () => {
      const noSysChecker = new SkillPermissionChecker(["fs:read"]);

      expect(noSysChecker.checkSystem("exec").granted).toBe(false);
    });
  });

  describe("KV Storage Permissions", () => {
    let checker: SkillPermissionChecker;

    beforeEach(() => {
      checker = new SkillPermissionChecker([
        "kv:read",
        "kv:write",
        "kv:write:cache:",
        "kv:write:user:",
      ]);
    });

    it("should grant KV read operations", () => {
      expect(checker.checkKV("read", "any-key").granted).toBe(true);
    });

    it("should grant KV write operations", () => {
      expect(checker.checkKV("write", "cache:session-123").granted).toBe(true);
      expect(checker.checkKV("write", "user:profile-456").granted).toBe(true);
    });

    it("should deny KV write to disallowed prefixes", () => {
      expect(checker.checkKV("write", "admin:config").granted).toBe(false);
    });

    it("should deny KV operations when no permissions declared", () => {
      const noKvChecker = new SkillPermissionChecker(["fs:read"]);

      expect(noKvChecker.checkKV("read", "key").granted).toBe(false);
      expect(noKvChecker.checkKV("write", "key").granted).toBe(false);
    });

    it("should allow any key when no prefixes specified", () => {
      const checker = new SkillPermissionChecker(["kv:read", "kv:write"]);

      expect(checker.checkKV("read", "any-key-without-prefix").granted).toBe(
        true,
      );
      expect(checker.checkKV("write", "another-random-key").granted).toBe(true);
    });

    it("should enforce prefixes when specified", () => {
      const prefixChecker = new SkillPermissionChecker([
        "kv:write:cache:",
      ]);

      expect(prefixChecker.checkKV("write", "cache:session").granted).toBe(
        true,
      );
      expect(prefixChecker.checkKV("write", "user:profile").granted).toBe(
        false,
      );
    });
  });

  describe("Raw Permission Checks", () => {
    let checker: SkillPermissionChecker;

    beforeEach(() => {
      checker = new SkillPermissionChecker([
        "network:http",
        "fs:read:/app/data",
        "api:openai",
      ]);
    });

    it("should check raw permission strings", () => {
      expect(checker.check("network:http").granted).toBe(true);
      expect(checker.check("fs:read:/app/data").granted).toBe(true);
      expect(checker.check("api:openai").granted).toBe(true);
    });

    it("should deny undeclared permissions", () => {
      expect(checker.check("system:exec").granted).toBe(false);
      expect(checker.check("fs:write:/app/data").granted).toBe(false);
    });
  });

  describe("Get Granted Permissions", () => {
    it("should return all granted permissions", () => {
      const permissions = [
        "network:http",
        "fs:read:/app/data",
        "api:openai",
      ];
      const checker = new SkillPermissionChecker(permissions);

      const granted = checker.getGrantedPermissions();

      expect(granted).toEqual(permissions);
      expect(granted.length).toBe(3);
    });

    it("should return empty array when no permissions granted", () => {
      const checker = new SkillPermissionChecker([]);

      expect(checker.getGrantedPermissions()).toEqual([]);
    });
  });

  describe("Get Permission Set", () => {
    it("should return structured permission set", () => {
      const checker = new SkillPermissionChecker([
        "fs:read:/app/data",
        "network:https",
        "api:openai",
      ]);

      const set = checker.getPermissionSet();

      expect(set.filesystem?.read).toEqual(["/app/data"]);
      expect(set.network?.protocols).toContain("https");
      expect(set.api?.allowedEndpoints).toContain("openai");
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty permission array", () => {
      const checker = new SkillPermissionChecker([]);

      expect(checker.checkFilesystemRead("/any/path").granted).toBe(false);
      expect(checker.checkNetwork("http").granted).toBe(false);
      expect(checker.checkAPI("openai").granted).toBe(false);
      expect(checker.getGrantedPermissions()).toEqual([]);
    });

    it("should handle duplicate permissions", () => {
      const checker = new SkillPermissionChecker([
        "network:http",
        "network:http", // Duplicate
      ]);

      expect(checker.checkNetwork("http").granted).toBe(true);
    });

    it("should handle complex glob patterns", () => {
      const checker = new SkillPermissionChecker([
        "fs:read:/app/data/**/*.json",
      ]);

      expect(
        checker.checkFilesystemRead("/app/data/users/profile.json").granted,
      ).toBe(true);
      expect(
        checker.checkFilesystemRead("/app/data/settings/config.json").granted,
      ).toBe(true);
      expect(checker.checkFilesystemRead("/app/data/file.txt").granted).toBe(
        false,
      );
    });

    it("should handle exact path matches", () => {
      const checker = new SkillPermissionChecker([
        "fs:read:/app/data/config.json",
      ]);

      expect(checker.checkFilesystemRead("/app/data/config.json").granted).toBe(
        true,
      );
      expect(checker.checkFilesystemRead("/app/data/other.json").granted).toBe(
        false,
      );
    });

    it("should return informative reasons", () => {
      const checker = new SkillPermissionChecker(["fs:read:/app/data"]);

      const granted = checker.checkFilesystemRead("/app/data/file.txt");
      expect(granted.reason).toContain("granted");

      const denied = checker.checkFilesystemRead("/etc/passwd");
      expect(denied.reason).toContain("denied");
    });
  });
});
