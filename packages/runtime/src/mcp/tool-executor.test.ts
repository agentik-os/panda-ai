import { describe, it, expect, beforeEach } from "vitest";
import { Tool } from "@modelcontextprotocol/sdk/types.js";
import {
  convertMCPToolsToModelFormat,
  executeToolCall,
  getAvailableTools,
  isToolAvailable,
  getToolDetails,
} from "./tool-executor.js";

describe("Tool Executor", () => {
  describe("convertMCPToolsToModelFormat", () => {
    it("should convert MCP tools to model format", () => {
      const mcpTools: Tool[] = [
        {
          name: "test-tool",
          description: "A test tool",
          inputSchema: {
            type: "object",
            properties: {
              param1: { type: "string" },
            },
          },
        },
      ];

      const converted = convertMCPToolsToModelFormat(mcpTools);

      expect(converted).toEqual([
        {
          name: "test-tool",
          description: "A test tool",
          input_schema: {
            type: "object",
            properties: {
              param1: { type: "string" },
            },
          },
        },
      ]);
    });

    it("should handle tools with missing description", () => {
      const mcpTools: Tool[] = [
        {
          name: "no-desc-tool",
          inputSchema: { type: "object", properties: {} },
        } as Tool,
      ];

      const converted = convertMCPToolsToModelFormat(mcpTools);

      expect(converted[0].description).toBe("");
    });

    it("should handle tools with missing input schema", () => {
      const mcpTools: Tool[] = [
        {
          name: "no-schema-tool",
          description: "Test",
        } as Tool,
      ];

      const converted = convertMCPToolsToModelFormat(mcpTools);

      expect(converted[0].input_schema).toEqual({
        type: "object",
        properties: {},
      });
    });
  });

  describe("executeToolCall", () => {
    it("should reject tool call when server not connected", async () => {
      const result = await executeToolCall({
        name: "nonexistent__tool",
        arguments: {},
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain("not connected");
    });

    it("should reject invalid tool name format", async () => {
      const result = await executeToolCall({
        name: "invalid-format",
        arguments: {},
      });

      expect(result.error).toBeDefined();
      expect(result.error).toContain("Invalid tool name format");
    });
  });

  describe("getAvailableTools", () => {
    it("should return empty array when no servers connected", () => {
      const tools = getAvailableTools();
      expect(tools).toEqual([]);
    });
  });

  describe("isToolAvailable", () => {
    it("should return false for non-existent tool", () => {
      expect(isToolAvailable("nonexistent__tool")).toBe(false);
    });
  });

  describe("getToolDetails", () => {
    it("should return undefined for non-existent tool", () => {
      expect(getToolDetails("nonexistent__tool")).toBeUndefined();
    });
  });
});
