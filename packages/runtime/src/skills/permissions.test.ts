/**
 * Tests for Skill Permission System
 */

import { describe, it, expect } from "vitest";
import {
  PermissionCategory,
  FilesystemResource,
  NetworkResource,
  SystemResource,
  parsePermission,
  isValidPermission,
  buildPermissionSet,
  requiresApproval,
  describePermission,
} from "./permissions";

describe("Skill Permissions", () => {
  describe("parsePermission", () => {
    it("should parse category:resource format", () => {
      const result = parsePermission("network:http");

      expect(result.category).toBe("network");
      expect(result.resource).toBe("http");
      expect(result.path).toBeUndefined();
    });

    it("should parse category:resource:path format", () => {
      const result = parsePermission("fs:read:/app/data");

      expect(result.category).toBe("fs");
      expect(result.resource).toBe("read");
      expect(result.path).toBe("/app/data");
    });

    it("should parse category:resource:path with colons in path", () => {
      const result = parsePermission("api:openai:https://api.openai.com/v1");

      expect(result.category).toBe("api");
      expect(result.resource).toBe("openai");
      expect(result.path).toBe("https://api.openai.com/v1");
    });

    it("should throw for invalid format", () => {
      expect(() => parsePermission("invalidformat")).toThrow(
        "Invalid permission format",
      );
    });

    it("should throw for empty string", () => {
      expect(() => parsePermission("")).toThrow("Invalid permission format");
    });
  });

  describe("isValidPermission", () => {
    it("should validate correct permission strings", () => {
      expect(isValidPermission("network:http")).toBe(true);
      expect(isValidPermission("fs:read:/app/data")).toBe(true);
      expect(isValidPermission("api:openai")).toBe(true);
      expect(isValidPermission("kv:write:cache:")).toBe(true);
    });

    it("should reject invalid categories", () => {
      expect(isValidPermission("invalid:http")).toBe(false);
      expect(isValidPermission("xyz:read")).toBe(false);
    });

    it("should reject invalid formats", () => {
      expect(isValidPermission("invalidformat")).toBe(false);
      expect(isValidPermission("network:")).toBe(false); // Empty resource
      expect(isValidPermission(":http")).toBe(false);
    });
  });

  describe("buildPermissionSet", () => {
    it("should build filesystem permissions", () => {
      const perms = [
        "fs:read:/app/data",
        "fs:write:/app/output",
        "fs:delete:/app/temp",
      ];
      const set = buildPermissionSet(perms);

      expect(set.filesystem?.read).toEqual(["/app/data"]);
      expect(set.filesystem?.write).toEqual(["/app/output"]);
      expect(set.filesystem?.delete).toEqual(["/app/temp"]);
    });

    it("should build network permissions", () => {
      const perms = [
        "network:http",
        "network:https",
        "network:https:api.example.com",
      ];
      const set = buildPermissionSet(perms);

      expect(set.network?.protocols).toContain("http");
      expect(set.network?.protocols).toContain("https");
      expect(set.network?.allowedDomains).toContain("api.example.com");
    });

    it("should build system permissions", () => {
      const perms = ["system:exec", "system:env", "system:spawn"];
      const set = buildPermissionSet(perms);

      expect(set.system?.execCommands).toBe(true);
      expect(set.system?.envAccess).toBe(true);
      expect(set.system?.processSpawn).toBe(true);
    });

    it("should build API permissions", () => {
      const perms = ["api:openai", "api:brave:https://api.search.brave.com"];
      const set = buildPermissionSet(perms);

      expect(set.api?.allowedEndpoints).toContain("openai");
      expect(set.api?.allowedEndpoints).toContain(
        "https://api.search.brave.com",
      );
    });

    it("should build AI permissions", () => {
      const perms = [
        "ai:provider:anthropic",
        "ai:provider:openai",
        "ai:model:claude-opus-4",
      ];
      const set = buildPermissionSet(perms);

      expect(set.ai?.providers).toContain("anthropic");
      expect(set.ai?.providers).toContain("openai");
      expect(set.ai?.models).toContain("claude-opus-4");
    });

    it("should build KV permissions", () => {
      const perms = ["kv:read", "kv:write", "kv:write:cache:", "kv:read:user:"];
      const set = buildPermissionSet(perms);

      expect(set.kv?.read).toBe(true);
      expect(set.kv?.write).toBe(true);
      expect(set.kv?.writePrefixes).toContain("cache:");
      expect(set.kv?.readPrefixes).toContain("user:");
    });

    it("should handle wildcards in filesystem permissions", () => {
      const perms = ["fs:read"];
      const set = buildPermissionSet(perms);

      expect(set.filesystem?.read).toEqual(["*"]);
    });

    it("should handle multiple permissions of same type", () => {
      const perms = [
        "fs:read:/app/data",
        "fs:read:/app/config",
        "fs:write:/app/output",
      ];
      const set = buildPermissionSet(perms);

      expect(set.filesystem?.read).toEqual(["/app/data", "/app/config"]);
      expect(set.filesystem?.write).toEqual(["/app/output"]);
    });

    it("should handle empty permission array", () => {
      const set = buildPermissionSet([]);

      expect(set).toEqual({});
    });
  });

  describe("requiresApproval", () => {
    it("should require approval for dangerous filesystem operations", () => {
      expect(requiresApproval("fs:write:/app/data")).toBe(true);
      expect(requiresApproval("fs:delete:/app/temp")).toBe(true);
    });

    it("should require approval for system exec", () => {
      expect(requiresApproval("system:exec")).toBe(true);
      expect(requiresApproval("system:spawn")).toBe(true);
    });

    it("should NOT require approval for safe operations", () => {
      expect(requiresApproval("fs:read:/app/data")).toBe(false);
      expect(requiresApproval("network:http")).toBe(false);
      expect(requiresApproval("api:openai")).toBe(false);
      expect(requiresApproval("kv:read")).toBe(false);
      expect(requiresApproval("system:time")).toBe(false);
    });
  });

  describe("describePermission", () => {
    it("should describe filesystem permissions", () => {
      expect(describePermission("fs:read:/app/data")).toBe(
        "Read files from /app/data",
      );
      expect(describePermission("fs:write:/app/output")).toBe(
        "Write files to /app/output",
      );
      expect(describePermission("fs:delete:/app/temp")).toBe(
        "Delete files from /app/temp",
      );
    });

    it("should describe filesystem permissions without path", () => {
      expect(describePermission("fs:read")).toContain("Read files");
      expect(describePermission("fs:write")).toContain("Write files");
    });

    it("should describe network permissions", () => {
      expect(describePermission("network:http")).toBe("Make HTTP requests");
      expect(describePermission("network:https:api.example.com")).toBe(
        "Make HTTPS requests to api.example.com",
      );
      expect(describePermission("network:websocket")).toBe(
        "Use WebSocket connections",
      );
    });

    it("should describe system permissions", () => {
      expect(describePermission("system:exec")).toBe("Execute system commands");
      expect(describePermission("system:time")).toBe("Access system time");
      expect(describePermission("system:random")).toBe("Generate random numbers");
      expect(describePermission("system:spawn")).toBe("Spawn new processes");
    });

    it("should describe API permissions", () => {
      expect(describePermission("api:openai")).toBe("Access openai API");
      expect(describePermission("api:brave:https://api.search.brave.com")).toBe(
        "Access brave API at https://api.search.brave.com",
      );
    });

    it("should describe AI permissions", () => {
      expect(describePermission("ai:provider:anthropic")).toBe(
        "Use anthropic AI provider",
      );
      expect(describePermission("ai:model:claude-opus-4")).toBe(
        "Use claude-opus-4 AI model",
      );
    });

    it("should describe KV permissions", () => {
      expect(describePermission("kv:read")).toBe("Read from key-value store");
      expect(describePermission("kv:write")).toBe("Write to key-value store");
    });

    it("should provide fallback for unknown permissions", () => {
      const desc = describePermission("unknown:permission:path");
      expect(desc).toBe("unknown:permission:path");
    });
  });

  describe("Permission Categories and Resources", () => {
    it("should have correct PermissionCategory enum values", () => {
      expect(PermissionCategory.FS).toBe("fs");
      expect(PermissionCategory.NETWORK).toBe("network");
      expect(PermissionCategory.SYSTEM).toBe("system");
      expect(PermissionCategory.API).toBe("api");
      expect(PermissionCategory.AI).toBe("ai");
      expect(PermissionCategory.KV).toBe("kv");
    });

    it("should have correct FilesystemResource enum values", () => {
      expect(FilesystemResource.READ).toBe("read");
      expect(FilesystemResource.WRITE).toBe("write");
      expect(FilesystemResource.DELETE).toBe("delete");
    });

    it("should have correct NetworkResource enum values", () => {
      expect(NetworkResource.HTTP).toBe("http");
      expect(NetworkResource.HTTPS).toBe("https");
      expect(NetworkResource.WEBSOCKET).toBe("websocket");
    });

    it("should have correct SystemResource enum values", () => {
      expect(SystemResource.EXEC).toBe("exec");
      expect(SystemResource.TIME).toBe("time");
      expect(SystemResource.RANDOM).toBe("random");
    });
  });

  describe("Edge Cases", () => {
    it("should handle permissions with special characters in paths", () => {
      const perm = "fs:read:/app/data-2024/user_files";
      const result = parsePermission(perm);

      expect(result.category).toBe("fs");
      expect(result.resource).toBe("read");
      expect(result.path).toBe("/app/data-2024/user_files");
    });

    it("should handle permissions with query strings", () => {
      const perm = "api:search:https://api.example.com?key=value";
      const result = parsePermission(perm);

      expect(result.category).toBe("api");
      expect(result.resource).toBe("search");
      expect(result.path).toBe("https://api.example.com?key=value");
    });

    it("should build permission set with mixed permission types", () => {
      const perms = [
        "fs:read:/app/data",
        "network:https",
        "api:openai",
        "kv:write",
        "system:time",
        "ai:provider:anthropic",
      ];
      const set = buildPermissionSet(perms);

      expect(set.filesystem?.read).toBeDefined();
      expect(set.network?.protocols).toBeDefined();
      expect(set.api?.allowedEndpoints).toBeDefined();
      expect(set.kv?.write).toBe(true);
      expect(set.system).toBeDefined();
      expect(set.ai?.providers).toBeDefined();
    });
  });
});
