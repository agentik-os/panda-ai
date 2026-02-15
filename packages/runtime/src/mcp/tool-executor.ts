/**
 * MCP Tool Executor
 * Integrates MCP tools into the agent runtime
 */

import { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getMCPClient } from "./client.js";

export interface ToolCall {
  name: string;
  arguments: Record<string, unknown>;
}

export interface ToolResult {
  name: string;
  content: unknown;
  error?: string;
}

/**
 * Convert MCP tools to a format compatible with AI models
 * Returns tools in the format expected by Anthropic/OpenAI/etc
 */
export function convertMCPToolsToModelFormat(
  tools: Tool[]
): Array<{
  name: string;
  description: string;
  input_schema: object;
}> {
  return tools.map((tool) => ({
    name: tool.name,
    description: tool.description || "",
    input_schema: tool.inputSchema || { type: "object", properties: {} },
  }));
}

/**
 * Execute a tool call from an AI model
 */
export async function executeToolCall(
  toolCall: ToolCall
): Promise<ToolResult> {
  const client = getMCPClient();

  try {
    const content = await client.executeTool(toolCall.name, toolCall.arguments);

    return {
      name: toolCall.name,
      content,
    };
  } catch (error) {
    return {
      name: toolCall.name,
      content: null,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Execute multiple tool calls in parallel
 */
export async function executeToolCalls(
  toolCalls: ToolCall[]
): Promise<ToolResult[]> {
  const promises = toolCalls.map((call) => executeToolCall(call));
  return Promise.all(promises);
}

/**
 * Get all available MCP tools formatted for AI models
 */
export function getAvailableTools(): Array<{
  name: string;
  description: string;
  input_schema: object;
}> {
  const client = getMCPClient();
  const tools = client.getTools();
  return convertMCPToolsToModelFormat(tools);
}

/**
 * Check if a tool is available
 */
export function isToolAvailable(toolName: string): boolean {
  const client = getMCPClient();
  return client.getTool(toolName) !== undefined;
}

/**
 * Get tool details
 */
export function getToolDetails(toolName: string): Tool | undefined {
  const client = getMCPClient();
  return client.getTool(toolName);
}
