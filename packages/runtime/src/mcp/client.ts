/**
 * MCP (Model Context Protocol) Client
 * Connects to MCP servers and manages tool discovery
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface MCPServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export class MCPClient {
  private clients: Map<string, Client> = new Map();
  private tools: Map<string, Tool> = new Map();

  /**
   * Connect to an MCP server
   */
  async connect(config: MCPServerConfig): Promise<void> {
    const transport = new StdioClientTransport({
      command: config.command,
      args: config.args || [],
      env: config.env,
    });

    const client = new Client(
      {
        name: "agentik-os",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    await client.connect(transport);

    // Store client
    this.clients.set(config.name, client);

    // Discover tools
    const response = await client.listTools();

    for (const tool of response.tools) {
      // Prefix tool name with server name to avoid conflicts
      const toolName = `${config.name}__${tool.name}`;
      this.tools.set(toolName, tool);
    }
  }

  /**
   * Disconnect from an MCP server
   */
  async disconnect(serverName: string): Promise<void> {
    const client = this.clients.get(serverName);
    if (client) {
      await client.close();
      this.clients.delete(serverName);

      // Remove tools from this server
      for (const [toolName] of this.tools) {
        if (toolName.startsWith(`${serverName}__`)) {
          this.tools.delete(toolName);
        }
      }
    }
  }

  /**
   * Get all available tools from all connected servers
   */
  getTools(): Tool[] {
    return Array.from(this.tools.values());
  }

  /**
   * Get a specific tool by name
   */
  getTool(toolName: string): Tool | undefined {
    return this.tools.get(toolName);
  }

  /**
   * Execute a tool on the appropriate MCP server
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>
  ): Promise<unknown> {
    // Extract server name from tool name (format: serverName__toolName)
    const [serverName, actualToolName] = toolName.split("__");

    if (!serverName || !actualToolName) {
      throw new Error(`Invalid tool name format: ${toolName}`);
    }

    const client = this.clients.get(serverName);
    if (!client) {
      throw new Error(`MCP server not connected: ${serverName}`);
    }

    const response = await client.callTool({
      name: actualToolName,
      arguments: args,
    });

    return response.content;
  }

  /**
   * Disconnect from all MCP servers
   */
  async disconnectAll(): Promise<void> {
    const promises = Array.from(this.clients.keys()).map((name) =>
      this.disconnect(name)
    );
    await Promise.all(promises);
  }

  /**
   * Get list of connected MCP servers
   */
  getConnectedServers(): string[] {
    return Array.from(this.clients.keys());
  }
}

// Singleton instance
let mcpClient: MCPClient | null = null;

export function getMCPClient(): MCPClient {
  if (!mcpClient) {
    mcpClient = new MCPClient();
  }
  return mcpClient;
}
