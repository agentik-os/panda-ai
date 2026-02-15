/**
 * MCP Server Registry
 * Manages MCP server configurations and auto-discovery
 */

import { existsSync } from "fs";
import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { MCPServerConfig } from "./client.js";

const MCP_CONFIG_DIR = join(homedir(), ".agentik-os", "mcp");
const MCP_CONFIG_FILE = join(MCP_CONFIG_DIR, "servers.json");

export interface MCPServerRegistry {
  servers: MCPServerConfig[];
  lastUpdated: string;
}

/**
 * Load MCP server configurations
 */
export async function loadMCPServers(): Promise<MCPServerConfig[]> {
  if (!existsSync(MCP_CONFIG_FILE)) {
    return getDefaultServers();
  }

  try {
    const data = await readFile(MCP_CONFIG_FILE, "utf-8");
    const registry: MCPServerRegistry = JSON.parse(data);
    return registry.servers;
  } catch (error) {
    console.warn("Failed to load MCP servers, using defaults:", error);
    return getDefaultServers();
  }
}

/**
 * Save MCP server configurations
 */
export async function saveMCPServers(
  servers: MCPServerConfig[]
): Promise<void> {
  const registry: MCPServerRegistry = {
    servers,
    lastUpdated: new Date().toISOString(),
  };

  // Ensure directory exists
  const { mkdir } = await import("fs/promises");
  await mkdir(MCP_CONFIG_DIR, { recursive: true });

  await writeFile(MCP_CONFIG_FILE, JSON.stringify(registry, null, 2));
}

/**
 * Add a new MCP server
 */
export async function addMCPServer(
  config: MCPServerConfig
): Promise<void> {
  const servers = await loadMCPServers();

  // Check if server already exists
  if (servers.some((s) => s.name === config.name)) {
    throw new Error(`MCP server already exists: ${config.name}`);
  }

  servers.push(config);
  await saveMCPServers(servers);
}

/**
 * Remove an MCP server
 */
export async function removeMCPServer(name: string): Promise<void> {
  const servers = await loadMCPServers();
  const filtered = servers.filter((s) => s.name !== name);

  if (filtered.length === servers.length) {
    throw new Error(`MCP server not found: ${name}`);
  }

  await saveMCPServers(filtered);
}

/**
 * Get default MCP servers (common tools)
 */
function getDefaultServers(): MCPServerConfig[] {
  return [
    {
      name: "filesystem",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-filesystem", process.cwd()],
    },
    {
      name: "fetch",
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-fetch"],
    },
  ];
}

/**
 * Discover MCP servers from Claude Code config
 * Reads ~/.claude.json to find MCP servers configured in Claude Code
 */
export async function discoverClaudeCodeServers(): Promise<MCPServerConfig[]> {
  const claudeConfigPath = join(homedir(), ".claude.json");

  if (!existsSync(claudeConfigPath)) {
    return [];
  }

  try {
    const data = await readFile(claudeConfigPath, "utf-8");
    const config = JSON.parse(data);

    if (!config.mcpServers || typeof config.mcpServers !== "object") {
      return [];
    }

    const servers: MCPServerConfig[] = [];

    for (const [name, serverConfig] of Object.entries(config.mcpServers)) {
      const cfg = serverConfig as {
        command?: string;
        args?: string[];
        env?: Record<string, string>;
      };

      if (cfg.command) {
        servers.push({
          name,
          command: cfg.command,
          args: cfg.args,
          env: cfg.env,
        });
      }
    }

    return servers;
  } catch (error) {
    console.warn("Failed to discover Claude Code MCP servers:", error);
    return [];
  }
}

/**
 * Auto-discover and merge MCP servers from Claude Code config
 */
export async function autoDiscoverServers(): Promise<MCPServerConfig[]> {
  const [existingServers, claudeServers] = await Promise.all([
    loadMCPServers(),
    discoverClaudeCodeServers(),
  ]);

  // Merge servers, prioritizing existing config
  const serverMap = new Map<string, MCPServerConfig>();

  for (const server of existingServers) {
    serverMap.set(server.name, server);
  }

  for (const server of claudeServers) {
    if (!serverMap.has(server.name)) {
      serverMap.set(server.name, server);
    }
  }

  return Array.from(serverMap.values());
}
