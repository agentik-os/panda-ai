import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { existsSync } from "fs";
import { unlink } from "fs/promises";
import { join } from "path";
import { homedir } from "os";
import {
  loadMCPServers,
  saveMCPServers,
  addMCPServer,
  removeMCPServer,
  autoDiscoverServers,
} from "./registry.js";
import type { MCPServerConfig } from "./client.js";

const TEST_CONFIG_DIR = join(homedir(), ".agentik-os", "mcp");
const TEST_CONFIG_FILE = join(TEST_CONFIG_DIR, "servers.json");

describe("MCP Registry", () => {
  afterEach(async () => {
    // Clean up test files
    if (existsSync(TEST_CONFIG_FILE)) {
      await unlink(TEST_CONFIG_FILE);
    }
  });

  describe("loadMCPServers", () => {
    it("should return default servers when config doesn't exist", async () => {
      const servers = await loadMCPServers();
      expect(servers.length).toBeGreaterThan(0);
      expect(servers.some((s) => s.name === "filesystem")).toBe(true);
    });

    it("should load saved servers", async () => {
      const testServers: MCPServerConfig[] = [
        {
          name: "test-server",
          command: "test-command",
          args: ["arg1"],
        },
      ];

      await saveMCPServers(testServers);
      const loaded = await loadMCPServers();

      expect(loaded).toEqual(testServers);
    });
  });

  describe("saveMCPServers", () => {
    it("should save servers to config file", async () => {
      const testServers: MCPServerConfig[] = [
        {
          name: "test-server",
          command: "test-command",
        },
      ];

      await saveMCPServers(testServers);
      expect(existsSync(TEST_CONFIG_FILE)).toBe(true);
    });

    it("should overwrite existing config", async () => {
      const servers1: MCPServerConfig[] = [
        { name: "server1", command: "cmd1" },
      ];
      const servers2: MCPServerConfig[] = [
        { name: "server2", command: "cmd2" },
      ];

      await saveMCPServers(servers1);
      await saveMCPServers(servers2);

      const loaded = await loadMCPServers();
      expect(loaded).toEqual(servers2);
    });
  });

  describe("addMCPServer", () => {
    it("should add a new server", async () => {
      const newServer: MCPServerConfig = {
        name: "new-server",
        command: "new-command",
      };

      await addMCPServer(newServer);
      const servers = await loadMCPServers();

      expect(servers.some((s) => s.name === "new-server")).toBe(true);
    });

    it("should reject duplicate server names", async () => {
      const server: MCPServerConfig = {
        name: "duplicate",
        command: "cmd",
      };

      await addMCPServer(server);
      await expect(addMCPServer(server)).rejects.toThrow(/already exists/);
    });
  });

  describe("removeMCPServer", () => {
    it("should remove an existing server", async () => {
      const server: MCPServerConfig = {
        name: "to-remove",
        command: "cmd",
      };

      await addMCPServer(server);
      await removeMCPServer("to-remove");

      const servers = await loadMCPServers();
      expect(servers.some((s) => s.name === "to-remove")).toBe(false);
    });

    it("should reject removal of non-existent server", async () => {
      await expect(removeMCPServer("nonexistent")).rejects.toThrow(/not found/);
    });
  });

  describe("autoDiscoverServers", () => {
    it("should return at least default servers", async () => {
      const servers = await autoDiscoverServers();
      expect(servers.length).toBeGreaterThan(0);
    });

    it("should merge with existing config", async () => {
      const customServer: MCPServerConfig = {
        name: "custom",
        command: "custom-cmd",
      };

      await saveMCPServers([customServer]);
      const discovered = await autoDiscoverServers();

      expect(discovered.some((s) => s.name === "custom")).toBe(true);
    });
  });
});
