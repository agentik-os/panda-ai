/**
 * MCP (Model Context Protocol) Integration
 * Export all MCP functionality
 */

export { MCPClient, getMCPClient, type MCPServerConfig } from "./client.js";
export {
  loadMCPServers,
  saveMCPServers,
  addMCPServer,
  removeMCPServer,
  discoverClaudeCodeServers,
  autoDiscoverServers,
  type MCPServerRegistry,
} from "./registry.js";
export {
  executeToolCall,
  executeToolCalls,
  getAvailableTools,
  isToolAvailable,
  getToolDetails,
  convertMCPToolsToModelFormat,
  type ToolCall,
  type ToolResult,
} from "./tool-executor.js";
