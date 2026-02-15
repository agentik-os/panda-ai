# MCP Protocol Integration - Implementation Plan

**Step:** step-059
**Estimated Hours:** 20h
**Depends On:** step-028 (API Channel Adapter)
**Status:** Planning

---

## Overview

The MCP (Model Context Protocol) integration enables Agentik OS agents to expose tools and resources to LLM models via a standardized protocol. This allows external applications to discover and use agent capabilities, and enables agents to access external tools and context provided by MCP servers.

**MCP is bidirectional:**
- **Agentik as MCP Server** - Exposes agent tools to external clients
- **Agentik as MCP Client** - Consumes tools/resources from external MCP servers

---

## Technical Design

### Libraries

```bash
pnpm add @modelcontextprotocol/sdk
pnpm add -D @types/node
```

**Why MCP SDK:**
- Official Model Context Protocol implementation
- TypeScript native
- Supports both server and client roles
- JSON-RPC 2.0 transport
- stdio, HTTP, and WebSocket transports

**MCP Specification:** https://spec.modelcontextprotocol.io/

---

## MCP Concepts

### 1. Tools

Functions that agents can call to perform actions.

```typescript
interface MCPTool {
  name: string;
  description: string;
  inputSchema: {
    type: "object";
    properties: Record<string, any>;
    required?: string[];
  };
}

// Example: Search tool
{
  name: "search",
  description: "Search the web for information",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query"
      },
      limit: {
        type: "number",
        description: "Max results",
        default: 10
      }
    },
    required: ["query"]
  }
}
```

### 2. Resources

Read-only data that provides context to agents.

```typescript
interface MCPResource {
  uri: string; // e.g., "file:///path/to/file.txt", "db://table/row/123"
  name: string;
  description: string;
  mimeType?: string;
}

// Example: Database resource
{
  uri: "db://users/123",
  name: "User Profile",
  description: "User profile data for user 123",
  mimeType: "application/json"
}
```

### 3. Prompts

Reusable prompt templates.

```typescript
interface MCPPrompt {
  name: string;
  description: string;
  arguments?: {
    name: string;
    description: string;
    required?: boolean;
  }[];
}

// Example: Code review prompt
{
  name: "code_review",
  description: "Review code for quality and security",
  arguments: [
    {
      name: "code",
      description: "Code to review",
      required: true
    },
    {
      name: "language",
      description: "Programming language",
      required: false
    }
  ]
}
```

### 4. Sampling

Agents can request LLM completions (sampling) from the client.

```typescript
interface SamplingRequest {
  messages: {
    role: "user" | "assistant" | "system";
    content: string;
  }[];
  modelPreferences?: {
    hints?: string[]; // Preferred models
    costPriority?: number; // 0-1, lower = prioritize cost
    speedPriority?: number; // 0-1, higher = prioritize speed
  };
  maxTokens?: number;
  temperature?: number;
}
```

---

## Architecture

### Agentik as MCP Server

```
External MCP Client (Claude Desktop, IDEs, etc.)
     ↓
JSON-RPC 2.0 (stdio, HTTP, or WebSocket)
     ↓
MCPServer.handleRequest()
     ↓
Route to: tools.call(), resources.read(), prompts.get()
     ↓
Execute in Agentik runtime
     ↓
Return result to client
```

### Agentik as MCP Client

```
Agentik Agent
     ↓
Needs external capability
     ↓
MCPClient.callTool(externalServer, toolName, args)
     ↓
JSON-RPC 2.0 to external MCP server
     ↓
External server executes tool
     ↓
Result returned to agent
```

---

## Implementation Files

- `packages/runtime/src/mcp/server.ts` - MCP server implementation
- `packages/runtime/src/mcp/client.ts` - MCP client implementation
- `packages/runtime/src/mcp/registry.ts` - Tool/resource registry
- `packages/runtime/src/mcp/transports/` - stdio, HTTP, WebSocket transports
- `packages/runtime/src/channels/mcp.ts` - Channel adapter (wraps MCP server)
- `packages/runtime/src/mcp/mcp.test.ts` - Unit tests

---

## MCP Server Implementation

### Tool Registration

```typescript
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

class AgentikMCPServer {
  private server: Server;
  private tools = new Map<string, MCPToolDefinition>();

  constructor() {
    this.server = new Server(
      {
        name: "agentik-os",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
      }
    );

    this.setupHandlers();
  }

  // Register a tool
  registerTool(definition: MCPToolDefinition) {
    this.tools.set(definition.name, definition);

    this.server.setRequestHandler("tools/list", async () => ({
      tools: Array.from(this.tools.values()).map((tool) => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema,
      })),
    }));
  }

  // Execute tool
  private setupHandlers() {
    this.server.setRequestHandler("tools/call", async (request) => {
      const { name, arguments: args } = request.params;

      const tool = this.tools.get(name);

      if (!tool) {
        throw new Error(`Tool not found: ${name}`);
      }

      // Execute tool
      const result = await tool.execute(args);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(result, null, 2),
          },
        ],
      };
    });
  }

  async start() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.log("MCP server running on stdio");
  }
}
```

### Example Tool Definitions

```typescript
interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: any;
  execute: (args: any) => Promise<any>;
}

// Search tool
const searchTool: MCPToolDefinition = {
  name: "search",
  description: "Search the web for information",
  inputSchema: {
    type: "object",
    properties: {
      query: { type: "string", description: "Search query" },
      limit: { type: "number", description: "Max results", default: 10 },
    },
    required: ["query"],
  },
  execute: async (args) => {
    const results = await performWebSearch(args.query, args.limit);
    return { results };
  },
};

// Database query tool
const dbQueryTool: MCPToolDefinition = {
  name: "db_query",
  description: "Query the Convex database",
  inputSchema: {
    type: "object",
    properties: {
      table: { type: "string", description: "Table name" },
      filter: { type: "object", description: "Filter conditions" },
    },
    required: ["table"],
  },
  execute: async (args) => {
    const data = await ctx.db
      .query(args.table)
      .filter((q) => applyFilter(q, args.filter))
      .collect();
    return { data };
  },
};

// File read tool
const fileReadTool: MCPToolDefinition = {
  name: "file_read",
  description: "Read file contents",
  inputSchema: {
    type: "object",
    properties: {
      path: { type: "string", description: "File path" },
    },
    required: ["path"],
  },
  execute: async (args) => {
    const fs = await import("fs/promises");
    const content = await fs.readFile(args.path, "utf-8");
    return { content };
  },
};
```

---

## Resource Handling

### Resource Registry

```typescript
class ResourceRegistry {
  private resources = new Map<string, MCPResourceDefinition>();

  register(resource: MCPResourceDefinition) {
    this.resources.set(resource.uri, resource);
  }

  async read(uri: string): Promise<string | ArrayBuffer> {
    const resource = this.resources.get(uri);

    if (!resource) {
      throw new Error(`Resource not found: ${uri}`);
    }

    return await resource.read();
  }

  list(): MCPResource[] {
    return Array.from(this.resources.values()).map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
      mimeType: r.mimeType,
    }));
  }
}

interface MCPResourceDefinition {
  uri: string;
  name: string;
  description: string;
  mimeType?: string;
  read: () => Promise<string | ArrayBuffer>;
}

// Example: File system resources
const fileResource: MCPResourceDefinition = {
  uri: "file:///workspace/README.md",
  name: "Project README",
  description: "Main project documentation",
  mimeType: "text/markdown",
  read: async () => {
    const fs = await import("fs/promises");
    return await fs.readFile("/workspace/README.md", "utf-8");
  },
};

// Example: Database resources
const dbResource: MCPResourceDefinition = {
  uri: "db://users/123",
  name: "User Profile",
  description: "User profile data",
  mimeType: "application/json",
  read: async () => {
    const user = await ctx.db.get("123");
    return JSON.stringify(user, null, 2);
  },
};
```

### Resource Request Handler

```typescript
server.setRequestHandler("resources/list", async () => ({
  resources: resourceRegistry.list(),
}));

server.setRequestHandler("resources/read", async (request) => {
  const { uri } = request.params;

  const content = await resourceRegistry.read(uri);

  return {
    contents: [
      {
        uri,
        mimeType: resourceRegistry.get(uri)?.mimeType,
        text: typeof content === "string" ? content : undefined,
        blob: content instanceof ArrayBuffer ? Buffer.from(content).toString("base64") : undefined,
      },
    ],
  };
});
```

---

## MCP Client Implementation

### Connecting to External MCP Servers

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

class AgentikMCPClient {
  private clients = new Map<string, Client>();

  async connectToServer(name: string, command: string, args: string[]) {
    const transport = new StdioClientTransport({
      command,
      args,
    });

    const client = new Client(
      {
        name: "agentik-os-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          sampling: {}, // Request LLM sampling from server
        },
      }
    );

    await client.connect(transport);

    this.clients.set(name, client);

    console.log(`Connected to MCP server: ${name}`);
  }

  async listTools(serverName: string): Promise<MCPTool[]> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    const result = await client.request("tools/list", {});
    return result.tools;
  }

  async callTool(serverName: string, toolName: string, args: any): Promise<any> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    const result = await client.request("tools/call", {
      name: toolName,
      arguments: args,
    });

    return result.content;
  }

  async readResource(serverName: string, uri: string): Promise<any> {
    const client = this.clients.get(serverName);

    if (!client) {
      throw new Error(`Not connected to server: ${serverName}`);
    }

    const result = await client.request("resources/read", {
      uri,
    });

    return result.contents;
  }
}
```

### Example: Using External MCP Servers

```typescript
// Connect to filesystem MCP server
await mcpClient.connectToServer(
  "filesystem",
  "npx",
  ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
);

// List available tools
const tools = await mcpClient.listTools("filesystem");
console.log("Available tools:", tools);

// Call a tool
const result = await mcpClient.callTool("filesystem", "read_file", {
  path: "/workspace/README.md",
});

console.log("File contents:", result);
```

---

## Transports

### 1. stdio (Standard Input/Output)

**Best for:** CLI tools, desktop applications

```typescript
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

const transport = new StdioServerTransport();
await server.connect(transport);
```

**How it works:**
- Server reads from stdin, writes to stdout
- Client spawns server process and pipes stdin/stdout
- Used by Claude Desktop, IDEs

### 2. HTTP (Server-Sent Events)

**Best for:** Web applications, REST APIs

```typescript
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import express from "express";

const app = express();

app.get("/mcp", async (req, res) => {
  const transport = new SSEServerTransport("/messages", res);
  await server.connect(transport);
});

app.post("/messages", async (req, res) => {
  // Handle incoming messages
  await transport.handlePostMessage(req, res);
});

app.listen(3000);
```

### 3. WebSocket

**Best for:** Real-time bidirectional communication

```typescript
import { WebSocketServerTransport } from "@modelcontextprotocol/sdk/server/websocket.js";
import { WebSocketServer } from "ws";

const wss = new WebSocketServer({ port: 8080 });

wss.on("connection", async (ws) => {
  const transport = new WebSocketServerTransport(ws);
  await server.connect(transport);
});
```

---

## Channel Adapter Integration

### MCPChannel Class

```typescript
export class MCPChannel implements ChannelAdapter {
  readonly name = "mcp" as const;

  private server: AgentikMCPServer;
  private client: AgentikMCPClient;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;

  constructor() {
    this.server = new AgentikMCPServer();
    this.client = new AgentikMCPClient();
  }

  async connect(config: ChannelConfig): Promise<void> {
    // Register built-in tools
    this.registerBuiltInTools();

    // Start MCP server
    await this.server.start();

    // Connect to external MCP servers (if configured)
    const externalServers = config.options.externalServers as MCPServerConfig[];

    if (externalServers) {
      for (const server of externalServers) {
        await this.client.connectToServer(server.name, server.command, server.args);
      }
    }

    this.connected = true;
    console.log("✅ MCP channel connected");
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log("👋 MCP channel disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    // MCP server doesn't push messages
    // Responses are returned synchronously via JSON-RPC
    console.log("MCP server responses are synchronous");
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    // Not applicable for MCP
  }

  isConnected(): boolean {
    return this.connected;
  }

  private registerBuiltInTools() {
    // Search tool
    this.server.registerTool(searchTool);

    // Database query tool
    this.server.registerTool(dbQueryTool);

    // File operations
    this.server.registerTool(fileReadTool);
    this.server.registerTool(fileWriteTool);
    this.server.registerTool(fileListTool);

    // Agent operations
    this.server.registerTool({
      name: "run_agent",
      description: "Execute an Agentik agent",
      inputSchema: {
        type: "object",
        properties: {
          agent: { type: "string", description: "Agent name" },
          prompt: { type: "string", description: "User prompt" },
        },
        required: ["agent", "prompt"],
      },
      execute: async (args) => {
        // Execute agent via pipeline
        const result = await this.executeAgent(args.agent, args.prompt);
        return { result };
      },
    });
  }
}
```

---

## Sampling (LLM Requests)

### Server-Side Sampling

Agents can request LLM completions from the MCP client.

```typescript
// In tool execution
server.setRequestHandler("tools/call", async (request) => {
  const { name, arguments: args } = request.params;

  if (name === "complex_task") {
    // Request LLM sampling from client
    const completion = await server.request("sampling/createMessage", {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: "Analyze this data and provide insights...",
          },
        },
      ],
      maxTokens: 1000,
    });

    return {
      content: [
        {
          type: "text",
          text: completion.content.text,
        },
      ],
    };
  }
});
```

### Client-Side Sampling Handler

```typescript
client.setNotificationHandler("notifications/sampling", async (notification) => {
  const { messages, maxTokens } = notification.params;

  // Use Agentik's model router to get completion
  const completion = await modelRouter.complete({
    messages,
    maxTokens,
    model: "claude-sonnet-4.5", // Default model
  });

  return {
    content: {
      type: "text",
      text: completion.text,
    },
  };
});
```

---

## Security Considerations

### Tool Execution Sandboxing

```typescript
// Validate tool arguments
function validateToolArgs(tool: MCPToolDefinition, args: any): void {
  // JSON schema validation
  const ajv = new Ajv();
  const valid = ajv.validate(tool.inputSchema, args);

  if (!valid) {
    throw new Error(`Invalid arguments: ${ajv.errorsText()}`);
  }
}

// Restrict file system access
function isPathAllowed(path: string): boolean {
  const allowedPaths = ["/workspace", "/tmp"];

  return allowedPaths.some((allowed) => path.startsWith(allowed));
}
```

### Rate Limiting

```typescript
class ToolRateLimiter {
  private calls = new Map<string, number[]>();

  checkLimit(toolName: string, maxCallsPerMinute = 60): boolean {
    const now = Date.now();
    const calls = this.calls.get(toolName) || [];

    // Remove calls older than 1 minute
    const recentCalls = calls.filter((time) => now - time < 60000);

    if (recentCalls.length >= maxCallsPerMinute) {
      return false; // Rate limit exceeded
    }

    recentCalls.push(now);
    this.calls.set(toolName, recentCalls);

    return true;
  }
}
```

### Authentication

```typescript
// API key for MCP server access
function validateMCPClient(clientInfo: any): boolean {
  const apiKey = clientInfo.headers?.["x-api-key"];

  return apiKey === process.env.MCP_API_KEY;
}
```

---

## Test Strategy

### Unit Tests (`mcp.test.ts`)

```typescript
describe("MCP Integration", () => {
  describe("MCP Server", () => {
    it("should start MCP server");
    it("should register tools");
    it("should list registered tools");
    it("should execute tool calls");
    it("should validate tool arguments");
    it("should handle tool errors");
    it("should register resources");
    it("should read resources");
    it("should handle sampling requests");
  });

  describe("MCP Client", () => {
    it("should connect to external MCP server");
    it("should list tools from external server");
    it("should call tools on external server");
    it("should read resources from external server");
    it("should handle connection errors");
  });

  describe("Transports", () => {
    it("should work with stdio transport");
    it("should work with HTTP/SSE transport");
    it("should work with WebSocket transport");
  });

  describe("Security", () => {
    it("should validate tool arguments");
    it("should enforce rate limits");
    it("should restrict file system access");
    it("should validate client authentication");
  });
});
```

---

## Use Cases

### 1. Claude Desktop Integration

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "agentik": {
      "command": "panda",
      "args": ["mcp"]
    }
  }
}
```

Now Claude Desktop can:
- List Agentik agents
- Execute agents
- Query Agentik database
- Read Agentik resources

### 2. IDE Integration (VS Code, Cursor)

```json
// settings.json
{
  "mcp.servers": {
    "agentik": {
      "command": "panda mcp"
    }
  }
}
```

Now IDE can:
- Autocomplete with agent knowledge
- Suggest code based on project context
- Execute agent workflows

### 3. External Tool Integration

```typescript
// Connect to filesystem server
await mcpClient.connectToServer(
  "filesystem",
  "npx",
  ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
);

// Connect to GitHub server
await mcpClient.connectToServer(
  "github",
  "npx",
  ["-y", "@modelcontextprotocol/server-github"]
);

// Now agents can read files AND access GitHub
```

---

## Configuration

```typescript
interface MCPConfig {
  server: {
    enabled: boolean;
    transport: "stdio" | "http" | "websocket";
    port?: number; // For HTTP/WebSocket
    tools: {
      enabled: string[]; // Tool names to expose
      rateLimit?: number; // Calls per minute
    };
    resources: {
      enabled: boolean;
      allowedPaths?: string[]; // For file resources
    };
  };
  client: {
    externalServers: {
      name: string;
      command: string;
      args: string[];
    }[];
  };
}
```

---

## Dependencies

**Blocks:**
- External IDE/application integrations
- Advanced agent tool composition
- Multi-agent workflows

**Blocked By:**
- Step-028 (API Channel Adapter) - MUST complete first

---

## Implementation Checklist

- [ ] Install @modelcontextprotocol/sdk
- [ ] Create `AgentikMCPServer` class
- [ ] Implement tool registration and execution
- [ ] Implement resource registry and reading
- [ ] Add prompt template support
- [ ] Implement sampling (LLM request) handler
- [ ] Create `AgentikMCPClient` class
- [ ] Implement external server connections
- [ ] Add stdio transport
- [ ] Add HTTP/SSE transport
- [ ] Add WebSocket transport
- [ ] Create `MCPChannel` adapter class
- [ ] Register built-in tools (search, db, file, agent)
- [ ] Add tool argument validation
- [ ] Implement rate limiting
- [ ] Add file system access restrictions
- [ ] Create `mcp.test.ts` with 15+ tests
- [ ] Update channels/index.ts export
- [ ] Document setup in MCP-INTEGRATION.md
- [ ] Create example configurations (Claude Desktop, VS Code)

---

**Estimated Time:** 20 hours
**Ready to implement:** When step-028 completes ✅

**Velocity target:** 5 hours at 4x velocity 🚀
