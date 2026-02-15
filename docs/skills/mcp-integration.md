# MCP Integration Guide

**How to wrap Model Context Protocol (MCP) servers as Agentik OS skills**

> **Target Audience:** Developers who want to integrate existing MCP servers into Agentik OS
>
> **Prerequisites:** Read [Development Guide](./development-guide.md), familiarity with MCP
>
> **Estimated Reading Time:** 15 minutes

---

## Table of Contents

1. [Overview](#overview)
2. [MCP Basics](#mcp-basics)
3. [Skills vs. MCP Servers](#skills-vs-mcp-servers)
4. [Wrapping an MCP Server](#wrapping-an-mcp-server)
5. [Authentication Flows](#authentication-flows)
6. [Tool Discovery](#tool-discovery)
7. [Error Handling](#error-handling)
8. [Examples](#examples)
9. [Best Practices](#best-practices)
10. [Marketplace Publishing](#marketplace-publishing)

---

## Overview

### What is MCP?

**Model Context Protocol (MCP)** is an open standard for connecting AI models to external tools and data sources.

**Key Concepts:**
- **MCP Server**: Process that exposes tools via stdio/SSE
- **MCP Client**: Connects to servers, invokes tools
- **Tools**: Functions that servers expose (e.g., `search_web`, `read_file`)
- **Prompts**: Pre-defined prompt templates
- **Resources**: Data sources (files, APIs, databases)

**MCP Ecosystem:**
- **500+ existing MCP servers** (GitHub, Slack, databases, etc.)
- **Open source** by Anthropic
- **Language agnostic** (stdio communication)

### Why Wrap MCP Servers?

**Benefits:**
- ✅ Reuse existing MCP servers (don't rebuild functionality)
- ✅ Access 500+ tools instantly
- ✅ Distribute via Agentik OS marketplace
- ✅ Add Agentik OS features (permissions, caching, UI)
- ✅ Earn revenue (marketplace sales)

**Use Cases:**
- Wrap `@modelcontextprotocol/server-github` as "GitHub Skill"
- Wrap `@modelcontextprotocol/server-slack` as "Slack Skill"
- Wrap custom company MCP server as internal skill

---

## MCP Basics

### MCP Server Structure

```typescript
// Example MCP server (runs as separate process)
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const server = new Server({
  name: "example-server",
  version: "1.0.0",
});

// Define a tool
server.setRequestHandler("tools/list", async () => ({
  tools: [
    {
      name: "search",
      description: "Search for information",
      inputSchema: {
        type: "object",
        properties: {
          query: { type: "string" },
        },
        required: ["query"],
      },
    },
  ],
}));

// Handle tool calls
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "search") {
    const results = await performSearch(args.query);
    return { content: [{ type: "text", text: JSON.stringify(results) }] };
  }
});

// Start server (stdio transport)
const transport = new StdioServerTransport();
await server.connect(transport);
```

### MCP Communication

```
┌──────────────┐                      ┌──────────────┐
│  MCP Client  │                      │  MCP Server  │
│  (Agentik)   │                      │  (External)  │
└──────┬───────┘                      └──────┬───────┘
       │                                     │
       │  1. tools/list                      │
       ├────────────────────────────────────>│
       │                                     │
       │  2. { tools: [...] }                │
       │<────────────────────────────────────┤
       │                                     │
       │  3. tools/call {name, args}         │
       ├────────────────────────────────────>│
       │                                     │
       │  4. { content: [...] }              │
       │<────────────────────────────────────┤
       │                                     │
```

**Transports:**
- **stdio**: Communicate via stdin/stdout (most common)
- **SSE**: Server-Sent Events over HTTP (for web servers)

---

## Skills vs. MCP Servers

### Comparison

| Aspect | Agentik OS Skill | MCP Server |
|--------|------------------|------------|
| **Format** | TypeScript class extending `SkillBase` | Standalone process (any language) |
| **Communication** | Direct method calls | stdio/SSE protocol |
| **Distribution** | npm package + marketplace | Manual install |
| **Permissions** | Declarative + enforced | None |
| **Sandbox** | WASM/gVisor/Kata | None (runs as separate process) |
| **UI Integration** | Dashboard configuration | None |
| **Authentication** | Managed by Agentik OS | Per-server |
| **Caching** | Built-in (KEYVALUE) | Manual |
| **Monetization** | Marketplace (70/30 split) | None |

### When to Wrap an MCP Server

**Wrap when:**
- ✅ MCP server already exists and works well
- ✅ You want marketplace distribution
- ✅ You need Agentik OS features (permissions, caching, UI)
- ✅ You want to monetize

**Build native skill when:**
- ❌ Simple functionality (no need for separate process)
- ❌ Performance critical (avoid IPC overhead)
- ❌ Tight Agentik OS integration needed

---

## Wrapping an MCP Server

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│                    AGENTIK OS SKILL                         │
│  (MCPSkillWrapper extends SkillBase)                       │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  1. Manages MCP server process (spawn/kill)                 │
│  2. Translates skill function calls → MCP tools/call        │
│  3. Caches tool list (KEYVALUE permission)                  │
│  4. Handles authentication (stores in encrypted config)     │
│  5. Provides error handling + retries                       │
│                                                              │
└─────────────────────────┬──────────────────────────────────┘
                          │ stdio/SSE
                          ▼
┌────────────────────────────────────────────────────────────┐
│                    MCP SERVER PROCESS                       │
│  (External, runs as child process)                         │
├────────────────────────────────────────────────────────────┤
│                                                              │
│  - Exposes tools via MCP protocol                           │
│  - Runs independently of Agentik OS                         │
│  - Can be any language (Node.js, Python, Go, etc.)          │
│                                                              │
└────────────────────────────────────────────────────────────┘
```

### Step-by-Step Wrapper Implementation

#### Step 1: Create Skill Scaffold

```bash
panda skill create github-skill --template mcp-wrapper
cd github-skill
pnpm install
```

#### Step 2: Define Skill Metadata

```typescript
// src/index.ts
import { SkillBase, SkillMetadata } from "@agentik-os/sdk";
import { MCPClient } from "@agentik-os/sdk/mcp";

export class GitHubSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "github",
    name: "GitHub",
    version: "1.0.0",
    description: "GitHub integration via MCP",
    author: "Your Name",
    permissions: ["NETWORK", "KEYVALUE"],
  };

  private mcpClient: MCPClient;

  async initialize(): Promise<void> {
    // Spawn MCP server process
    this.mcpClient = new MCPClient({
      command: "npx",
      args: [
        "-y",
        "@modelcontextprotocol/server-github",
      ],
      env: {
        GITHUB_TOKEN: this.getConfig("GITHUB_TOKEN"),
      },
      transport: "stdio",
    });

    await this.mcpClient.connect();

    // Discover tools
    const tools = await this.mcpClient.listTools();
    this.log("info", `Discovered ${tools.length} GitHub tools`);

    // Cache tool list (1 hour)
    await this.setKeyValue("mcp:tools", JSON.stringify(tools), { ttl: 3600 });
  }

  async shutdown(): Promise<void> {
    await this.mcpClient?.disconnect();
  }
}
```

#### Step 3: Auto-Generate Skill Functions

Use the SDK to auto-generate typed functions from MCP tools:

```typescript
import { SkillFunction } from "@agentik-os/sdk";

export class GitHubSkill extends SkillBase {
  // ... metadata and initialize() from above ...

  // Auto-generated from MCP tools
  @SkillFunction({
    name: "createRepository",
    description: "Create a new GitHub repository",
    parameters: {
      name: { type: "string", description: "Repository name", required: true },
      description: { type: "string", description: "Repository description" },
      private: { type: "boolean", description: "Make repository private", default: false },
    },
  })
  async createRepository(args: {
    name: string;
    description?: string;
    private?: boolean;
  }) {
    this.checkPermission("NETWORK");

    const result = await this.mcpClient.callTool("create_repository", args);
    return result.content[0].text;
  }

  @SkillFunction({
    name: "searchRepositories",
    description: "Search GitHub repositories",
    parameters: {
      query: { type: "string", description: "Search query", required: true },
      limit: { type: "number", description: "Max results", default: 10 },
    },
  })
  async searchRepositories(args: { query: string; limit?: number }) {
    this.checkPermission("NETWORK");

    // Check cache first
    const cacheKey = `search:${args.query}:${args.limit}`;
    const cached = await this.getKeyValue(cacheKey);
    if (cached) return JSON.parse(cached);

    // Call MCP tool
    const result = await this.mcpClient.callTool("search_repositories", args);
    const data = JSON.parse(result.content[0].text);

    // Cache for 10 minutes
    await this.setKeyValue(cacheKey, JSON.stringify(data), { ttl: 600 });

    return data;
  }
}
```

#### Step 4: Add Error Handling

```typescript
async callMCPTool(toolName: string, args: any): Promise<any> {
  try {
    const result = await this.mcpClient.callTool(toolName, args);
    return result.content[0].text;
  } catch (error) {
    // Handle MCP-specific errors
    if (error.code === "TOOL_NOT_FOUND") {
      throw new SkillError(
        SkillErrorCode.RESOURCE_NOT_FOUND,
        `Tool '${toolName}' not found. Available tools: ${await this.getAvailableTools()}`,
      );
    }

    if (error.code === "AUTHENTICATION_ERROR") {
      throw new SkillError(
        SkillErrorCode.AUTHENTICATION_ERROR,
        "GitHub authentication failed. Please check your GITHUB_TOKEN in settings.",
      );
    }

    // Generic error
    this.log("error", `MCP tool call failed: ${error.message}`);
    throw error;
  }
}

private async getAvailableTools(): Promise<string> {
  const tools = await this.mcpClient.listTools();
  return tools.map(t => t.name).join(", ");
}
```

---

## Authentication Flows

### OAuth Flow

For MCP servers requiring OAuth (GitHub, Slack, Google):

```typescript
export class GitHubSkill extends SkillBase {
  async initialize(): Promise<void> {
    // Check if user has authenticated
    let token = await this.getStorageValue("oauth_token");

    if (!token) {
      // Start OAuth flow
      token = await this.initiateOAuth();
      await this.setStorageValue("oauth_token", token);
    }

    // Start MCP server with token
    this.mcpClient = new MCPClient({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: token },
    });

    await this.mcpClient.connect();
  }

  private async initiateOAuth(): Promise<string> {
    // Agentik OS handles OAuth flow
    return await this.requestOAuth({
      provider: "github",
      scopes: ["repo", "user"],
      redirectUrl: "https://agentik-os.com/oauth/callback",
    });
  }
}
```

**User Experience:**
1. User installs GitHub skill
2. Skill requests OAuth during initialization
3. Dashboard opens GitHub OAuth page
4. User authorizes
5. Token stored encrypted in STORAGE
6. MCP server started with token

### API Key Flow

For MCP servers using simple API keys:

```typescript
export class WeatherSkill extends SkillBase {
  async initialize(): Promise<void> {
    const apiKey = this.getConfig("API_KEY");
    if (!apiKey) {
      throw new Error(
        "Please configure API_KEY in Dashboard > Skills > Weather > Configuration"
      );
    }

    this.mcpClient = new MCPClient({
      command: "npx",
      args: ["-y", "weather-mcp-server"],
      env: { WEATHER_API_KEY: apiKey },
    });

    await this.mcpClient.connect();
  }
}
```

**Configuration in skill.json:**
```json
{
  "config": {
    "API_KEY": {
      "type": "string",
      "description": "OpenWeather API key (get from https://openweathermap.org/api)",
      "required": true,
      "secret": true
    }
  }
}
```

---

## Tool Discovery

### Listing Available Tools

```typescript
export class MCPWrapperSkill extends SkillBase {
  @SkillFunction({
    name: "listAvailableTools",
    description: "List all tools exposed by this MCP server",
    parameters: {},
  })
  async listAvailableTools(): Promise<Array<{
    name: string;
    description: string;
    parameters: any;
  }>> {
    const tools = await this.mcpClient.listTools();

    return tools.map(tool => ({
      name: tool.name,
      description: tool.description,
      parameters: tool.inputSchema,
    }));
  }
}
```

### Dynamic Function Registration

Auto-register MCP tools as skill functions:

```typescript
export class DynamicMCPSkill extends SkillBase {
  async initialize(): Promise<void> {
    await this.mcpClient.connect();

    // Get all tools from MCP server
    const tools = await this.mcpClient.listTools();

    // Dynamically register each tool as a skill function
    for (const tool of tools) {
      this.registerFunction({
        name: tool.name,
        description: tool.description,
        parameters: this.convertMCPSchemaToSkillParams(tool.inputSchema),
        handler: async (args: any) => {
          return await this.mcpClient.callTool(tool.name, args);
        },
      });
    }

    this.log("info", `Registered ${tools.length} dynamic functions`);
  }

  private convertMCPSchemaToSkillParams(schema: any): any {
    // Convert JSON Schema (MCP) to Skill parameter format
    const params: any = {};

    for (const [name, prop] of Object.entries(schema.properties || {})) {
      params[name] = {
        type: (prop as any).type,
        description: (prop as any).description,
        required: schema.required?.includes(name),
      };
    }

    return params;
  }
}
```

---

## Error Handling

### Common MCP Errors

```typescript
async callToolSafely(toolName: string, args: any): Promise<any> {
  try {
    return await this.mcpClient.callTool(toolName, args);
  } catch (error) {
    switch (error.code) {
      case "CONNECTION_ERROR":
        // MCP server crashed or not responding
        this.log("error", "MCP server connection lost, restarting...");
        await this.mcpClient.disconnect();
        await this.mcpClient.connect();
        return await this.mcpClient.callTool(toolName, args); // Retry

      case "TIMEOUT":
        // Tool took too long
        throw new SkillError(
          SkillErrorCode.TIMEOUT_ERROR,
          `Tool '${toolName}' timed out after 30 seconds`,
        );

      case "INVALID_PARAMS":
        // Wrong parameters
        throw new SkillError(
          SkillErrorCode.INVALID_PARAMETERS,
          `Invalid parameters for tool '${toolName}': ${error.message}`,
        );

      case "RATE_LIMIT":
        // API rate limited
        throw new SkillError(
          SkillErrorCode.RATE_LIMIT_ERROR,
          "Rate limit exceeded. Please try again later.",
        );

      default:
        this.log("error", `Unexpected error: ${error.message}`);
        throw error;
    }
  }
}
```

### Health Checks

Monitor MCP server health:

```typescript
export class MCPWrapperSkill extends SkillBase {
  async healthCheck(): Promise<{ healthy: boolean; details: any }> {
    try {
      // Ping MCP server
      const tools = await this.mcpClient.listTools();

      return {
        healthy: true,
        details: {
          toolCount: tools.length,
          lastCheck: new Date().toISOString(),
        },
      };
    } catch (error) {
      return {
        healthy: false,
        details: {
          error: error.message,
          lastCheck: new Date().toISOString(),
        },
      };
    }
  }
}
```

**Agentik OS calls `healthCheck()` every 5 minutes. If unhealthy for >15 minutes, skill is auto-restarted.**

---

## Examples

### Example 1: GitHub MCP Wrapper

Complete wrapper for `@modelcontextprotocol/server-github`:

```typescript
import { SkillBase, SkillFunction, SkillMetadata } from "@agentik-os/sdk";
import { MCPClient } from "@agentik-os/sdk/mcp";

export class GitHubSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "github",
    name: "GitHub",
    version: "1.0.0",
    description: "GitHub integration powered by MCP",
    author: "Agentik OS",
    permissions: ["NETWORK", "KEYVALUE", "STORAGE"],
  };

  private mcpClient: MCPClient;

  async initialize(): Promise<void> {
    const token = await this.getOAuthToken("github");

    this.mcpClient = new MCPClient({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-github"],
      env: { GITHUB_TOKEN: token },
      transport: "stdio",
    });

    await this.mcpClient.connect();
  }

  @SkillFunction({
    name: "createRepository",
    description: "Create a new GitHub repository",
    parameters: {
      name: { type: "string", required: true },
      description: { type: "string" },
      private: { type: "boolean", default: false },
    },
  })
  async createRepository(args: {
    name: string;
    description?: string;
    private?: boolean;
  }) {
    this.checkPermission("NETWORK");

    const result = await this.mcpClient.callTool("create_repository", {
      name: args.name,
      description: args.description,
      private: args.private,
    });

    return JSON.parse(result.content[0].text);
  }

  @SkillFunction({
    name: "searchCode",
    description: "Search code on GitHub",
    parameters: {
      query: { type: "string", required: true },
      language: { type: "string" },
    },
  })
  async searchCode(args: { query: string; language?: string }) {
    this.checkPermission("NETWORK");

    const cacheKey = `search:code:${args.query}:${args.language}`;
    const cached = await this.getKeyValue(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = await this.mcpClient.callTool("search_code", args);
    const data = JSON.parse(result.content[0].text);

    await this.setKeyValue(cacheKey, JSON.stringify(data), { ttl: 600 });

    return data;
  }

  async shutdown(): Promise<void> {
    await this.mcpClient?.disconnect();
  }
}
```

### Example 2: Slack MCP Wrapper

```typescript
export class SlackSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "slack",
    name: "Slack",
    version: "1.0.0",
    description: "Slack integration via MCP",
    permissions: ["NETWORK", "KEYVALUE"],
  };

  private mcpClient: MCPClient;

  async initialize(): Promise<void> {
    const token = await this.getOAuthToken("slack");

    this.mcpClient = new MCPClient({
      command: "npx",
      args: ["-y", "@modelcontextprotocol/server-slack"],
      env: { SLACK_TOKEN: token },
    });

    await this.mcpClient.connect();
  }

  @SkillFunction({
    name: "sendMessage",
    description: "Send a message to a Slack channel",
    parameters: {
      channel: { type: "string", required: true },
      text: { type: "string", required: true },
    },
  })
  async sendMessage(args: { channel: string; text: string }) {
    this.checkPermission("NETWORK");

    const result = await this.mcpClient.callTool("send_message", {
      channel: args.channel,
      text: args.text,
    });

    return JSON.parse(result.content[0].text);
  }
}
```

### Example 3: Custom Company MCP Wrapper

Wrap your company's internal MCP server:

```typescript
export class CompanyDataSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "company-data",
    name: "Company Data",
    version: "1.0.0",
    description: "Internal company data access",
    permissions: ["NETWORK", "KEYVALUE"],
  };

  private mcpClient: MCPClient;

  async initialize(): Promise<void> {
    this.mcpClient = new MCPClient({
      command: "/opt/company/mcp-server", // Custom binary
      args: ["--database", "production"],
      env: {
        DB_HOST: this.getConfig("DB_HOST"),
        DB_PASSWORD: this.getConfig("DB_PASSWORD"),
      },
    });

    await this.mcpClient.connect();

    // Dynamically register all company tools
    const tools = await this.mcpClient.listTools();
    for (const tool of tools) {
      await this.registerDynamicFunction(tool);
    }
  }

  private async registerDynamicFunction(tool: any) {
    this.registerFunction({
      name: tool.name,
      description: tool.description,
      parameters: this.convertSchema(tool.inputSchema),
      handler: async (args: any) => {
        const result = await this.mcpClient.callTool(tool.name, args);
        return JSON.parse(result.content[0].text);
      },
    });
  }
}
```

---

## Best Practices

### 1. Cache Aggressively

MCP calls have IPC overhead - cache when possible:

```typescript
async callToolWithCache(toolName: string, args: any, ttl = 600) {
  const cacheKey = `mcp:${toolName}:${JSON.stringify(args)}`;

  const cached = await this.getKeyValue(cacheKey);
  if (cached) return JSON.parse(cached);

  const result = await this.mcpClient.callTool(toolName, args);
  await this.setKeyValue(cacheKey, JSON.stringify(result), { ttl });

  return result;
}
```

### 2. Handle Server Crashes

MCP servers can crash - implement auto-restart:

```typescript
async callToolWithRetry(toolName: string, args: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await this.mcpClient.callTool(toolName, args);
    } catch (error) {
      if (error.code === "CONNECTION_ERROR" && i < maxRetries - 1) {
        this.log("warn", `MCP server connection lost, restarting (attempt ${i + 1}/${maxRetries})`);
        await this.mcpClient.disconnect();
        await this.mcpClient.connect();
        continue;
      }
      throw error;
    }
  }
}
```

### 3. Validate MCP Responses

Don't trust MCP server output blindly:

```typescript
async callToolSafely(toolName: string, args: any): Promise<any> {
  const result = await this.mcpClient.callTool(toolName, args);

  // Validate response format
  if (!result.content || !Array.isArray(result.content)) {
    throw new Error("Invalid MCP response format");
  }

  if (result.content.length === 0) {
    throw new Error("Empty MCP response");
  }

  // Validate content type
  const content = result.content[0];
  if (content.type !== "text") {
    throw new Error(`Unexpected content type: ${content.type}`);
  }

  return content.text;
}
```

### 4. Monitor Performance

Log MCP call durations:

```typescript
async callToolWithTiming(toolName: string, args: any) {
  const start = performance.now();

  try {
    const result = await this.mcpClient.callTool(toolName, args);
    const duration = performance.now() - start;

    this.log("debug", `MCP tool '${toolName}' took ${duration.toFixed(2)}ms`);

    if (duration > 5000) {
      this.log("warn", `Slow MCP tool: '${toolName}' took ${duration.toFixed(2)}ms`);
    }

    return result;
  } catch (error) {
    const duration = performance.now() - start;
    this.log("error", `MCP tool '${toolName}' failed after ${duration.toFixed(2)}ms: ${error.message}`);
    throw error;
  }
}
```

---

## Marketplace Publishing

### Requirements

To publish an MCP wrapper skill:

- [ ] **MCP Server**: Public npm package or documented installation
- [ ] **Documentation**: How to install/configure the MCP server
- [ ] **Permissions**: Declare all permissions (including MCP server's needs)
- [ ] **Error Handling**: Handle MCP crashes gracefully
- [ ] **Testing**: Test with real MCP server (not mocks)
- [ ] **License**: Verify MCP server license is compatible

### skill.json

```json
{
  "id": "github-mcp",
  "name": "GitHub (MCP)",
  "version": "1.0.0",
  "description": "GitHub integration powered by Model Context Protocol",
  "author": "Your Name",
  "permissions": ["NETWORK", "KEYVALUE", "STORAGE"],
  "dependencies": {
    "@modelcontextprotocol/sdk": "^1.0.0",
    "@modelcontextprotocol/server-github": "^1.0.0"
  },
  "keywords": ["github", "mcp", "version-control"],
  "categories": ["development"],
  "mcp": {
    "server": "@modelcontextprotocol/server-github",
    "transport": "stdio"
  }
}
```

### README Template

```markdown
# GitHub Skill (MCP-powered)

GitHub integration for Agentik OS using the Model Context Protocol.

## Features

- Create repositories
- Search code
- Manage issues
- ...

## Installation

### Prerequisites

This skill wraps the official MCP GitHub server. No additional setup required - the MCP server is installed automatically.

### Configuration

1. Install skill: `panda skill install github-mcp`
2. Configure GitHub token:
   - Go to Dashboard > Skills > GitHub
   - Click "Configure"
   - Enter your GitHub Personal Access Token
   - Save

### Getting a GitHub Token

1. Go to https://github.com/settings/tokens
2. Click "Generate new token (classic)"
3. Select scopes: `repo`, `user`
4. Copy token and paste in Agentik OS settings

## Usage

Ask your agent:
- "Create a new repository called my-project"
- "Search for TypeScript code related to authentication"
- "List my GitHub repositories"

## Troubleshooting

### "MCP server connection error"

The GitHub MCP server failed to start. Check:
- GitHub token is valid
- Internet connection active
- Run `panda skill logs github-mcp` for details

## Credits

Built on top of [@modelcontextprotocol/server-github](https://github.com/modelcontextprotocol/servers/tree/main/src/github).
```

---

## Next Steps

- **[Development Guide](./development-guide.md)** - Build native skills
- **[Permissions](./permissions.md)** - Permission system deep dive
- **[MCP Documentation](https://modelcontextprotocol.io)** - Official MCP docs

**Start wrapping:** `panda skill create my-mcp-wrapper --template mcp`

---

*Last updated: 2024-02-14*
*Agentik OS MCP Integration v1.0.0*
