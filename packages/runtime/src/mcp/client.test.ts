import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { MCPClient, getMCPClient } from "./client.js";

describe("MCPClient", () => {
  let client: MCPClient;

  beforeEach(() => {
    client = new MCPClient();
  });

  afterEach(async () => {
    await client.disconnectAll();
  });

  describe("initialization", () => {
    it("should create an instance", () => {
      expect(client).toBeInstanceOf(MCPClient);
    });

    it("should start with no connected servers", () => {
      expect(client.getConnectedServers()).toEqual([]);
    });

    it("should start with no tools", () => {
      expect(client.getTools()).toEqual([]);
    });
  });

  describe("singleton", () => {
    it("should return the same instance", () => {
      const instance1 = getMCPClient();
      const instance2 = getMCPClient();
      expect(instance1).toBe(instance2);
    });
  });

  describe("connect", () => {
    it("should reject invalid server config", async () => {
      await expect(
        client.connect({
          name: "invalid",
          command: "nonexistent-command-12345",
        })
      ).rejects.toThrow();
    });
  });

  describe("getTools", () => {
    it("should return empty array when no servers connected", () => {
      expect(client.getTools()).toEqual([]);
    });
  });

  describe("getTool", () => {
    it("should return undefined for non-existent tool", () => {
      expect(client.getTool("nonexistent")).toBeUndefined();
    });
  });

  describe("executeTool", () => {
    it("should reject execution when server not connected", async () => {
      await expect(
        client.executeTool("test__tool", {})
      ).rejects.toThrow(/not connected/);
    });

    it("should reject invalid tool name format", async () => {
      await expect(
        client.executeTool("invalid-format", {})
      ).rejects.toThrow(/Invalid tool name format/);
    });
  });

  describe("disconnect", () => {
    it("should handle disconnect of non-existent server", async () => {
      await expect(client.disconnect("nonexistent")).resolves.toBeUndefined();
    });
  });

  describe("disconnectAll", () => {
    it("should disconnect all servers", async () => {
      await client.disconnectAll();
      expect(client.getConnectedServers()).toEqual([]);
    });
  });
});
