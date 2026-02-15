# MCP Integration Guide

> **Extend Agentik OS with Model Context Protocol servers**

Integrate external tools, data sources, and services into your AI agents using the standardized MCP protocol.

---

## Table of Contents

1. [Introduction](#introduction)
2. [What is MCP?](#what-is-mcp)
3. [MCP in Agentik OS](#mcp-in-agentik-os)
4. [Quick Start](#quick-start)
5. [Built-in MCP Servers](#built-in-mcp-servers)
6. [Creating Custom MCP Servers](#creating-custom-mcp-servers)
7. [Server Configuration](#server-configuration)
8. [Tool Calling](#tool-calling)
9. [Resource Access](#resource-access)
10. [Prompts](#prompts)
11. [Security](#security)
12. [Best Practices](#best-practices)

---

## Introduction

**Model Context Protocol (MCP)** is an open standard for connecting AI applications to external data sources and tools.

### Why MCP?

- ✅ **Standardized** - One protocol for all integrations
- ✅ **Composable** - Mix and match MCP servers
- ✅ **Type-safe** - Schema-driven tool definitions
- ✅ **Secure** - Permission-based access control
- ✅ **Ecosystem** - Growing library of pre-built servers

### Use Cases

| Use Case | Example MCP Servers |
|----------|---------------------|
| **Data Access** | Postgres, MongoDB, Google Sheets |
| **File Operations** | Filesystem, S3, Google Drive |
| **Web Browsing** | Puppeteer, Playwright |
| **Code Execution** | E2B, Replit |
| **APIs** | GitHub, Slack, Linear |

---

## What is MCP?

### Architecture

```
┌──────────────┐
│  AI Agent    │
│  (Client)    │
└──────┬───────┘
       │
       │ MCP Protocol
       │
       ▼
┌──────────────┐
│ MCP Server   │
│  (Tools)     │
└──────┬───────┘
       │
       ▼
┌──────────────┐
│  External    │
│  Service     │
└──────────────┘
```

### Core Concepts

**1. Tools** - Functions agents can call

```json
{
  "name": "search_database",
  "description": "Search a SQL database",
  "inputSchema": {
    "type": "object",
    "properties": {
      "query": { "type": "string" }
    }
  }
}
```

**2. Resources** - Data agents can read

```json
{
  "uri": "file:///path/to/document.txt",
  "name": "Project Documentation",
  "mimeType": "text/plain"
}
```

**3. Prompts** - Reusable prompt templates

```json
{
  "name": "code_review",
  "description": "Review code for best practices",
  "arguments": [
    { "name": "code", "description": "Code to review" }
  ]
}
```

---

## MCP in Agentik OS

### How It Works

1. **Register MCP server** in agent configuration
2. **Agent discovers tools** from MCP server
3. **Agent calls tool** when needed
4. **MCP server executes** and returns result
5. **Agent uses result** to continue conversation

### MCP Server Lifecycle

```
Agent Created
  ↓
Load MCP Servers
  ↓
Discover Tools/Resources
  ↓
Agent Ready
  ↓
User Sends Message
  ↓
Agent Decides to Use Tool
  ↓
Call MCP Server
  ↓
Get Result
  ↓
Continue Conversation
```

---

## Quick Start

### 1. Install MCP Server

```bash
# Install Filesystem MCP server
npm install -g @modelcontextprotocol/server-filesystem

# Or use a Docker image
docker pull mcp/filesystem:latest
```

---

### 2. Register in Agent

**Via Dashboard:**

1. Go to Agent Settings
2. MCP Servers → Add Server
3. Select "Filesystem"
4. Configure paths
5. Save

**Via CLI:**

```bash
panda agent update agent_abc123 \
  --add-mcp-server filesystem \
  --config '{"allowedPaths": ["/workspace"]}'
```

**Via API:**

```typescript
await agentik.agents.update(agentId, {
  mcpServers: [
    {
      type: 'filesystem',
      config: {
        allowedPaths: ['/workspace'],
      },
    },
  ],
});
```

---

### 3. Use in Conversation

```
User: Can you read the README.md file?

Agent: [Calls filesystem MCP server]
Tool: read_file
Args: { path: "/workspace/README.md" }

MCP Server: [Returns file contents]

Agent: Here's what's in the README:
[Summarizes README contents...]
```

---

## Built-in MCP Servers

Agentik OS includes several MCP servers out of the box:

### Filesystem

**Purpose:** Read/write files on the server

**Tools:**
- `read_file` - Read file contents
- `write_file` - Write to file
- `list_directory` - List files in directory
- `search_files` - Search file contents

**Configuration:**

```json
{
  "type": "filesystem",
  "config": {
    "allowedPaths": ["/workspace", "/data"],
    "readOnly": false
  }
}
```

**Example:**

```typescript
// Agent calls MCP tool
const result = await mcp.call('read_file', {
  path: '/workspace/config.json',
});

console.log(result.content);
// { "apiKey": "xxxxx", ... }
```

---

### Web Browser (Puppeteer)

**Purpose:** Browse websites, scrape data

**Tools:**
- `navigate` - Navigate to URL
- `screenshot` - Take screenshot
- `extract_text` - Extract text from page
- `click_element` - Click element
- `fill_form` - Fill and submit form

**Configuration:**

```json
{
  "type": "puppeteer",
  "config": {
    "headless": true,
    "timeout": 30000,
    "allowedDomains": ["example.com", "api.example.com"]
  }
}
```

**Example:**

```typescript
// Navigate to website
await mcp.call('navigate', {
  url: 'https://example.com/products',
});

// Extract product names
const products = await mcp.call('extract_text', {
  selector: '.product-name',
});

console.log(products);
// ["Product A", "Product B", "Product C"]
```

---

### Database (PostgreSQL)

**Purpose:** Query databases

**Tools:**
- `query` - Execute SQL query
- `list_tables` - List all tables
- `describe_table` - Get table schema

**Configuration:**

```json
{
  "type": "postgres",
  "config": {
    "connectionString": "postgresql://user:pass@localhost:5432/db",
    "allowedQueries": ["SELECT"],
    "maxRows": 1000
  }
}
```

**Example:**

```typescript
// Query database
const result = await mcp.call('query', {
  query: 'SELECT * FROM users WHERE active = true LIMIT 10',
});

console.log(result.rows);
// [{ id: 1, name: "Alice", ... }, ...]
```

---

### GitHub

**Purpose:** Interact with GitHub repositories

**Tools:**
- `create_issue` - Create GitHub issue
- `list_pull_requests` - List PRs
- `get_file_contents` - Read file from repo
- `search_code` - Search code

**Configuration:**

```json
{
  "type": "github",
  "config": {
    "token": "ghp_xxxxx",
    "owner": "agentik-os",
    "repo": "agentik-os"
  }
}
```

**Example:**

```typescript
// Create GitHub issue
const issue = await mcp.call('create_issue', {
  title: 'Bug: Login button not working',
  body: 'Steps to reproduce:\n1. Go to login page\n2. Click login button\n3. Nothing happens',
  labels: ['bug', 'priority-high'],
});

console.log(issue.url);
// https://github.com/agentik-os/agentik-os/issues/42
```

---

## Creating Custom MCP Servers

### TypeScript MCP Server

**1. Install MCP SDK:**

```bash
npm install @modelcontextprotocol/sdk
```

**2. Create Server:**

```typescript
// my-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Create server
const server = new Server(
  {
    name: 'my-custom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define a tool
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'get_weather',
        description: 'Get current weather for a city',
        inputSchema: {
          type: 'object',
          properties: {
            city: {
              type: 'string',
              description: 'City name',
            },
            units: {
              type: 'string',
              enum: ['celsius', 'fahrenheit'],
              description: 'Temperature units',
            },
          },
          required: ['city'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'get_weather') {
    // Fetch weather from API
    const response = await fetch(
      `https://api.weather.com/v1/current?city=${args.city}&units=${args.units || 'celsius'}`
    );
    const data = await response.json();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(data),
        },
      ],
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP Server running');
}

main();
```

**3. Run Server:**

```bash
node my-mcp-server.js
```

---

### Python MCP Server

**1. Install MCP SDK:**

```bash
pip install mcp
```

**2. Create Server:**

```python
# my_mcp_server.py
import asyncio
from mcp.server import Server, NotificationOptions
from mcp.server.models import InitializationOptions
import mcp.server.stdio
import mcp.types as types

# Create server
server = Server("my-custom-server")

# Define a tool
@server.list_tools()
async def handle_list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="get_weather",
            description="Get current weather for a city",
            inputSchema={
                "type": "object",
                "properties": {
                    "city": {"type": "string", "description": "City name"},
                    "units": {
                        "type": "string",
                        "enum": ["celsius", "fahrenheit"],
                        "description": "Temperature units"
                    }
                },
                "required": ["city"]
            }
        )
    ]

# Handle tool calls
@server.call_tool()
async def handle_call_tool(
    name: str, arguments: dict
) -> list[types.TextContent | types.ImageContent | types.EmbeddedResource]:
    if name == "get_weather":
        city = arguments["city"]
        units = arguments.get("units", "celsius")

        # Fetch weather from API
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.weather.com/v1/current?city={city}&units={units}"
            )
            data = response.json()

        return [types.TextContent(type="text", text=str(data))]

    raise ValueError(f"Unknown tool: {name}")

# Start server
async def main():
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            InitializationOptions(
                server_name="my-custom-server",
                server_version="1.0.0",
                capabilities=server.get_capabilities(
                    notification_options=NotificationOptions(),
                    experimental_capabilities={},
                ),
            ),
        )

if __name__ == "__main__":
    asyncio.run(main())
```

**3. Run Server:**

```bash
python my_mcp_server.py
```

---

## Server Configuration

### Register in agentik.config.json

```json
{
  "mcpServers": {
    "my-weather-server": {
      "command": "node",
      "args": ["/path/to/my-mcp-server.js"],
      "env": {
        "WEATHER_API_KEY": "xxxxx"
      }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/workspace"]
    },
    "github": {
      "command": "docker",
      "args": ["run", "-i", "mcp/github"],
      "env": {
        "GITHUB_TOKEN": "ghp_xxxxx"
      }
    }
  }
}
```

### Configuration Options

| Field | Description |
|-------|-------------|
| `command` | Executable to run (node, python, docker) |
| `args` | Command arguments |
| `env` | Environment variables |
| `timeout` | Startup timeout in ms (default: 10000) |
| `restartPolicy` | "always" \| "on-failure" \| "never" |

---

## Tool Calling

### How Agents Call Tools

1. **Agent receives user message**
2. **Agent decides tool is needed** (AI model decides)
3. **Agent calls MCP server** with tool name and arguments
4. **MCP server executes** and returns result
5. **Agent incorporates result** in response

### Tool Call Example

**User:** "What's the temperature in Paris?"

**Agent thinks:**
- User asking about temperature
- Need weather data
- Have `get_weather` tool
- Call tool with city="Paris"

**Agent calls MCP:**

```json
{
  "tool": "get_weather",
  "arguments": {
    "city": "Paris",
    "units": "celsius"
  }
}
```

**MCP server responds:**

```json
{
  "temperature": 18,
  "condition": "Partly Cloudy",
  "humidity": 65
}
```

**Agent responds to user:**

"The current temperature in Paris is 18°C (64°F) with partly cloudy skies and 65% humidity."

---

## Resource Access

MCP servers can expose **resources** (files, documents, data) that agents can read.

### Example: Expose Documentation

```typescript
// MCP server exposes docs
server.setRequestHandler('resources/list', async () => {
  return {
    resources: [
      {
        uri: 'docs://api-reference',
        name: 'API Reference',
        description: 'Complete API documentation',
        mimeType: 'text/markdown',
      },
      {
        uri: 'docs://user-guide',
        name: 'User Guide',
        description: 'Getting started guide',
        mimeType: 'text/markdown',
      },
    ],
  };
});

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;

  if (uri === 'docs://api-reference') {
    return {
      contents: [
        {
          uri,
          mimeType: 'text/markdown',
          text: fs.readFileSync('./docs/api-reference.md', 'utf-8'),
        },
      ],
    };
  }

  throw new Error(`Unknown resource: ${uri}`);
});
```

**Agent uses resource:**

```
User: What's the API endpoint for creating agents?

Agent: [Reads docs://api-reference resource]

Agent: The API endpoint for creating agents is:
POST /v1/agents

[Provides example request...]
```

---

## Prompts

MCP servers can provide **prompt templates** for common tasks.

### Example: Code Review Prompt

```typescript
server.setRequestHandler('prompts/list', async () => {
  return {
    prompts: [
      {
        name: 'code_review',
        description: 'Review code for best practices',
        arguments: [
          {
            name: 'code',
            description: 'Code to review',
            required: true,
          },
          {
            name: 'language',
            description: 'Programming language',
            required: true,
          },
        ],
      },
    ],
  };
});

server.setRequestHandler('prompts/get', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'code_review') {
    return {
      messages: [
        {
          role: 'user',
          content: {
            type: 'text',
            text: `Review this ${args.language} code for:
- Security vulnerabilities
- Performance issues
- Best practices
- Code style

Code:
\`\`\`${args.language}
${args.code}
\`\`\``,
          },
        },
      ],
    };
  }

  throw new Error(`Unknown prompt: ${name}`);
});
```

---

## Security

### Permission Model

MCP servers run with **limited permissions** defined in their configuration.

**Example: Filesystem Permissions**

```json
{
  "type": "filesystem",
  "config": {
    "allowedPaths": ["/workspace", "/data"],
    "readOnly": false,
    "maxFileSize": 10485760
  }
}
```

**Filesystem server enforces:**
- Only access `/workspace` and `/data`
- Can write files (not read-only)
- Max file size 10 MB

### Sandboxing

**WASM Sandbox:**

MCP servers written in JavaScript/TypeScript can be compiled to WASM and run in a sandboxed environment:

```bash
# Compile MCP server to WASM
extism compile my-mcp-server.js -o my-mcp-server.wasm

# Run sandboxed
agentik mcp run my-mcp-server.wasm --sandbox
```

**Docker Isolation:**

```json
{
  "command": "docker",
  "args": ["run", "--rm", "-i", "--network=none", "mcp/my-server"]
}
```

### Secret Management

**Never hardcode secrets in MCP config!**

```json
{
  "env": {
    "API_KEY": "${WEATHER_API_KEY}"
  }
}
```

Load from environment:

```bash
export WEATHER_API_KEY=xxxxx
panda start
```

---

## Best Practices

### 1. Keep Tools Focused

```typescript
// ✅ GOOD - Specific, single-purpose tool
{
  name: "get_weather",
  description: "Get current weather for a city",
  inputSchema: { ... }
}

// ❌ BAD - Too broad
{
  name: "do_everything",
  description: "Do anything you want",
  inputSchema: { ... }
}
```

### 2. Validate Inputs

```typescript
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'search_database') {
    // Validate input
    if (!args.query || typeof args.query !== 'string') {
      throw new Error('Invalid query parameter');
    }

    // Sanitize (prevent SQL injection)
    const sanitized = sanitizeQuery(args.query);

    // Execute
    return executeQuery(sanitized);
  }
});
```

### 3. Handle Errors Gracefully

```typescript
try {
  const result = await fetchWeather(args.city);
  return {
    content: [{ type: 'text', text: JSON.stringify(result) }],
  };
} catch (error) {
  return {
    content: [
      {
        type: 'text',
        text: `Error fetching weather: ${error.message}`,
      },
    ],
    isError: true,
  };
}
```

### 4. Document Tools Clearly

```typescript
{
  name: "search_database",
  description: "Search the product database using SQL WHERE clause. Returns up to 100 results. Only SELECT queries allowed.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "SQL WHERE clause (e.g., 'category = electronics AND price < 100')"
      }
    },
    required: ["query"]
  }
}
```

### 5. Use Timeouts

```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 30000); // 30s timeout

try {
  const response = await fetch(url, { signal: controller.signal });
  // ...
} catch (error) {
  if (error.name === 'AbortError') {
    throw new Error('Request timed out after 30 seconds');
  }
  throw error;
} finally {
  clearTimeout(timeout);
}
```

---

## Summary

MCP integration in Agentik OS enables:

- ✅ **Extensibility** - Add any external tool or data source
- ✅ **Standardization** - One protocol for all integrations
- ✅ **Security** - Sandboxed execution with permissions
- ✅ **Composability** - Mix and match MCP servers
- ✅ **Ecosystem** - Leverage pre-built MCP servers

**Key Concepts:**

| Concept | Description |
|---------|-------------|
| **Tools** | Functions agents can call |
| **Resources** | Data agents can read |
| **Prompts** | Reusable prompt templates |
| **Server** | Exposes tools/resources/prompts |
| **Client** | Agent that calls MCP servers |

**Next Steps:**

1. Try a [built-in MCP server](#built-in-mcp-servers)
2. Create a [custom MCP server](#creating-custom-mcp-servers)
3. Read the [MCP specification](https://modelcontextprotocol.io/specification)
4. Join the [MCP community](https://discord.gg/modelcontextprotocol)

**Resources:**

- 📚 MCP Spec: [modelcontextprotocol.io](https://modelcontextprotocol.io)
- 🐙 GitHub: [github.com/modelcontextprotocol](https://github.com/modelcontextprotocol)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)
- 📧 Email: mcp-support@agentik-os.com

---

*Last updated: February 14, 2026*
*MCP Version: 1.0*
*Agentik OS Integration Team*
