# Skills Development Guide

**Complete guide to building skills for Agentik OS**

> **Target Audience:** JavaScript/TypeScript developers who want to extend Agentik OS with custom skills
>
> **Prerequisites:** Basic TypeScript knowledge, familiarity with async/await, understanding of AI agent concepts
>
> **Estimated Reading Time:** 45 minutes

---

## Table of Contents

1. [Introduction](#introduction)
2. [What is a Skill?](#what-is-a-skill)
3. [Skill Architecture](#skill-architecture)
4. [Getting Started](#getting-started)
5. [Your First Skill](#your-first-skill)
6. [Skill Structure](#skill-structure)
7. [Function Implementation](#function-implementation)
8. [Testing Skills](#testing-skills)
9. [Publishing to Marketplace](#publishing-to-marketplace)
10. [Best Practices](#best-practices)
11. [Advanced Topics](#advanced-topics)
12. [Examples](#examples)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

### Welcome to Agentik OS Skills Development!

Skills are the **building blocks** that give AI agents superpowers. They extend what agents can do beyond just chatting - searching the web, managing calendars, reading files, sending emails, and much more.

With Agentik OS's skill system, you can:

- ✅ Build custom skills in TypeScript
- ✅ Run code safely in sandboxed environments (WASM, containers)
- ✅ Monetize your skills through the marketplace (70/30 revenue split)
- ✅ Leverage 500+ existing MCP tools
- ✅ Distribute skills globally with one command

### Why Agentik OS Skills?

| Feature | Agentik OS | OpenClaw | Other Platforms |
|---------|-----------|----------|-----------------|
| **Language** | TypeScript | TypeScript | Varies |
| **Sandbox** | WASM + gVisor + Kata | ❌ None | Limited |
| **Permissions** | Fine-grained | ❌ All-or-nothing | Basic |
| **MCP Native** | ✅ Built-in | ❌ No | ❌ No |
| **Marketplace** | ✅ 70/30 split | ✅ Yes | Varies |
| **Security Audit** | Automated + Manual | Manual only | Varies |
| **Certification** | 4-tier program | ❌ No | ❌ No |

### The Skill Ecosystem

```
┌─────────────────────────────────────────────────────────────┐
│                    AGENTIK OS PLATFORM                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   RUNTIME    │  │  DASHBOARD   │  │     CLI      │      │
│  │              │  │              │  │              │      │
│  │  Executes    │  │  Manages     │  │  Installs    │      │
│  │  Skills      │  │  Skills      │  │  Skills      │      │
│  └──────┬───────┘  └──────────────┘  └──────────────┘      │
│         │                                                     │
│         ▼                                                     │
│  ┌─────────────────────────────────────────────────┐        │
│  │            SKILL SANDBOX (WASM/gVisor)          │        │
│  ├─────────────────────────────────────────────────┤        │
│  │                                                   │        │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐      │        │
│  │  │ Skill A  │  │ Skill B  │  │ Skill C  │      │        │
│  │  │          │  │          │  │          │      │        │
│  │  │ Web      │  │ Calendar │  │ File Ops │      │        │
│  │  │ Search   │  │ Manager  │  │          │      │        │
│  │  └──────────┘  └──────────┘  └──────────┘      │        │
│  │                                                   │        │
│  └─────────────────────────────────────────────────┘        │
│                                                               │
└───────────────────────────────────────────────────────────┘
```

---

## What is a Skill?

### Definition

A **skill** is a self-contained module that provides **one or more functions** an AI agent can call to perform actions or retrieve information.

**Examples:**
- **Web Search Skill**: Searches the web and returns results
- **Calendar Skill**: Creates, reads, updates calendar events
- **File Operations Skill**: Reads, writes, lists files (sandboxed)
- **Email Skill**: Sends, reads, manages emails
- **Database Skill**: Queries databases with natural language

### Skills vs. MCP Servers

| Aspect | Agentik OS Skill | MCP Server |
|--------|------------------|------------|
| **Format** | TypeScript package | Any language (stdio/SSE) |
| **Distribution** | npm + marketplace | Manual install |
| **Sandbox** | Enforced (WASM/gVisor) | Optional |
| **Permissions** | Declarative + runtime checks | None |
| **UI Integration** | Dashboard management | CLI only |
| **Best For** | First-party integrations | Third-party tools |

**Rule of Thumb:** Build a skill if you want marketplace distribution and tight Agentik OS integration. Wrap an MCP server if you want to reuse existing tools.

---

## Skill Architecture

### The SkillBase Pattern

Every skill extends the `SkillBase` abstract class, which provides:

- **Metadata**: Name, description, version, author
- **Function Registry**: Auto-discovery of available functions
- **Lifecycle Hooks**: `initialize()`, `shutdown()`, `healthCheck()`
- **Permission Management**: Declare and check permissions
- **Error Handling**: Standardized error responses
- **Logging**: Structured logging to Agentik OS runtime

```typescript
import { SkillBase, SkillFunction, SkillMetadata } from "@agentik-os/sdk";

export class MySkill extends SkillBase {
  // 1. Metadata (required)
  metadata: SkillMetadata = {
    id: "my-skill",
    name: "My Awesome Skill",
    version: "1.0.0",
    description: "Does amazing things",
    author: "Your Name",
    permissions: ["NETWORK", "KEYVALUE"],
  };

  // 2. Initialize (optional)
  async initialize(): Promise<void> {
    // Setup: load config, connect to APIs, etc.
  }

  // 3. Functions (1 or more, decorated with @SkillFunction)
  @SkillFunction({
    name: "doSomething",
    description: "Does something amazing",
    parameters: {
      query: { type: "string", description: "What to do" },
    },
  })
  async doSomething(args: { query: string }): Promise<string> {
    // Implementation
    return "Done!";
  }

  // 4. Cleanup (optional)
  async shutdown(): Promise<void> {
    // Cleanup: close connections, save state, etc.
  }
}
```

### Skill Lifecycle

```
┌─────────────┐
│   INSTALL   │  User installs skill via CLI/Dashboard
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ REGISTRATION│  Runtime loads skill.json, validates permissions
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ INITIALIZE  │  Calls skill.initialize() - setup phase
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    READY    │  Skill available for agent calls
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  FUNCTION   │  Agent invokes skill.functionName(args)
│  EXECUTION  │  Runtime checks permissions before executing
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  SHUTDOWN   │  Calls skill.shutdown() on app termination
└─────────────┘
```

### Execution Environments

Agentik OS supports **three sandbox levels** for skill execution:

| Level | Technology | Security | Performance | Use Case |
|-------|-----------|----------|-------------|----------|
| **WASM** | Extism (WebAssembly) | 🔒🔒🔒 Highest | ⚡⚡ Fast | Untrusted skills from marketplace |
| **gVisor** | Google's gVisor | 🔒🔒 High | ⚡ Medium | Trusted skills with system access |
| **Kata** | Kata Containers | 🔒 Medium | ⚡⚡⚡ Fastest | First-party skills (built-in) |

**Default:** All marketplace skills run in **WASM** sandbox. First-party skills (shipped with Agentik OS) run in **Kata** for performance.

---

## Getting Started

### Prerequisites

Before building your first skill, ensure you have:

```bash
# 1. Node.js 20+ and pnpm
node --version  # v20.0.0 or higher
pnpm --version  # 8.0.0 or higher

# 2. Agentik OS installed
panda --version  # 1.0.0 or higher

# 3. Agentik OS SDK
pnpm add @agentik-os/sdk@latest

# 4. TypeScript (recommended globally)
pnpm add -g typescript
```

### Project Setup

Use the CLI to scaffold a new skill:

```bash
# Create a new skill project
panda skill create my-awesome-skill

# Follow the interactive prompts
? Skill name: My Awesome Skill
? Description: Does amazing things for agents
? Author: Your Name
? License: MIT
? Permissions: (select with space)
  ◉ NETWORK - Make HTTP requests
  ◯ FILESYSTEM - Read/write files
  ◯ API - Call external APIs
  ◉ KEYVALUE - Store data
  ◯ STORAGE - Persistent storage

✓ Created skill at ./my-awesome-skill/
```

This generates:

```
my-awesome-skill/
├── src/
│   ├── index.ts          # Main skill class
│   ├── functions/        # Individual function implementations
│   │   └── example.ts
│   └── types.ts          # TypeScript types
├── tests/
│   ├── index.test.ts     # Unit tests
│   └── integration.test.ts
├── skill.json            # Skill manifest
├── package.json
├── tsconfig.json
└── README.md
```

### Skill Manifest (`skill.json`)

Every skill must have a `skill.json` manifest:

```json
{
  "id": "my-awesome-skill",
  "name": "My Awesome Skill",
  "version": "1.0.0",
  "description": "Does amazing things for agents",
  "author": "Your Name <you@example.com>",
  "license": "MIT",
  "permissions": [
    "NETWORK",
    "KEYVALUE"
  ],
  "functions": [
    {
      "name": "doSomething",
      "description": "Does something amazing",
      "parameters": {
        "query": {
          "type": "string",
          "description": "What to do",
          "required": true
        }
      }
    }
  ],
  "config": {
    "apiKey": {
      "type": "string",
      "description": "API key for service X",
      "required": false,
      "secret": true
    }
  },
  "repository": "https://github.com/username/my-awesome-skill",
  "homepage": "https://github.com/username/my-awesome-skill#readme",
  "keywords": ["productivity", "automation"],
  "categories": ["utilities"]
}
```

---

## Your First Skill

Let's build a **Weather Skill** that fetches weather data from an API.

### Step 1: Create Project

```bash
panda skill create weather-skill
cd weather-skill
pnpm install
```

### Step 2: Define Metadata

Edit `src/index.ts`:

```typescript
import { SkillBase, SkillFunction, SkillMetadata } from "@agentik-os/sdk";
import axios from "axios";

export class WeatherSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "weather-skill",
    name: "Weather Skill",
    version: "1.0.0",
    description: "Fetches current weather for any location",
    author: "Your Name <you@example.com>",
    permissions: ["NETWORK", "KEYVALUE"],
  };

  private apiKey: string;

  async initialize(): Promise<void> {
    // Get API key from config
    this.apiKey = this.getConfig("OPENWEATHER_API_KEY");
    if (!this.apiKey) {
      throw new Error("Missing OPENWEATHER_API_KEY in config");
    }
    this.log("info", "Weather skill initialized");
  }

  // Function implementation comes next...
}
```

### Step 3: Implement Function

Add the weather fetch function:

```typescript
  @SkillFunction({
    name: "getCurrentWeather",
    description: "Get current weather for a location",
    parameters: {
      location: {
        type: "string",
        description: "City name or zip code",
        required: true,
      },
      units: {
        type: "string",
        description: "Temperature units: metric or imperial",
        required: false,
        default: "metric",
      },
    },
  })
  async getCurrentWeather(args: {
    location: string;
    units?: "metric" | "imperial";
  }): Promise<{
    temperature: number;
    description: string;
    humidity: number;
    windSpeed: number;
  }> {
    // Check NETWORK permission
    this.checkPermission("NETWORK");

    const url = `https://api.openweathermap.org/data/2.5/weather`;
    const params = {
      q: args.location,
      appid: this.apiKey,
      units: args.units || "metric",
    };

    try {
      const response = await axios.get(url, { params });
      const data = response.data;

      // Store in cache (uses KEYVALUE permission)
      await this.setKeyValue(`weather:${args.location}`, JSON.stringify(data), {
        ttl: 600, // 10 minutes
      });

      return {
        temperature: data.main.temp,
        description: data.weather[0].description,
        humidity: data.main.humidity,
        windSpeed: data.wind.speed,
      };
    } catch (error) {
      this.log("error", `Failed to fetch weather: ${error.message}`);
      throw new Error(`Could not fetch weather for ${args.location}`);
    }
  }
```

### Step 4: Add Tests

Create `tests/index.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { WeatherSkill } from "../src";
import axios from "axios";

vi.mock("axios");

describe("WeatherSkill", () => {
  let skill: WeatherSkill;

  beforeEach(() => {
    skill = new WeatherSkill();
    skill.setConfig("OPENWEATHER_API_KEY", "test-key");
  });

  it("should fetch weather for a location", async () => {
    const mockData = {
      main: { temp: 22, humidity: 65 },
      weather: [{ description: "clear sky" }],
      wind: { speed: 5.2 },
    };

    vi.mocked(axios.get).mockResolvedValue({ data: mockData });

    const result = await skill.getCurrentWeather({
      location: "London",
      units: "metric",
    });

    expect(result.temperature).toBe(22);
    expect(result.description).toBe("clear sky");
    expect(axios.get).toHaveBeenCalledWith(
      expect.stringContaining("openweathermap"),
      expect.objectContaining({
        params: expect.objectContaining({
          q: "London",
          units: "metric",
        }),
      })
    );
  });

  it("should throw error for invalid location", async () => {
    vi.mocked(axios.get).mockRejectedValue(new Error("City not found"));

    await expect(
      skill.getCurrentWeather({ location: "InvalidCity" })
    ).rejects.toThrow("Could not fetch weather");
  });
});
```

### Step 5: Test Locally

```bash
# Run tests
pnpm test

# Build the skill
pnpm build

# Test with Agentik OS locally
panda skill link .
panda skill test weather-skill

# Try it in a conversation
panda chat
> What's the weather in London?
```

### Step 6: Publish

```bash
# Login to Agentik OS marketplace
panda auth login

# Publish (requires AOCD certification - see Publishing section)
panda skill publish

✓ Skill validated
✓ Security scan passed
✓ Published: weather-skill@1.0.0
```

**Congratulations!** 🎉 You've built your first Agentik OS skill!

---

## Skill Structure

### Recommended Directory Layout

```
your-skill/
├── src/
│   ├── index.ts              # Main skill class (exports SkillBase subclass)
│   ├── functions/            # Individual function implementations
│   │   ├── search.ts         # e.g., searchWeb()
│   │   ├── extract.ts        # e.g., extractData()
│   │   └── analyze.ts        # e.g., analyzeContent()
│   ├── utils/                # Helper utilities
│   │   ├── http.ts           # HTTP client wrapper
│   │   ├── cache.ts          # Caching logic
│   │   └── validation.ts     # Input validation
│   ├── types.ts              # TypeScript interfaces
│   └── config.ts             # Configuration schema
│
├── tests/
│   ├── unit/                 # Unit tests (pure functions)
│   ├── integration/          # Integration tests (with mocked APIs)
│   └── fixtures/             # Test data
│
├── docs/                     # Documentation
│   ├── README.md             # Overview + quick start
│   ├── API.md                # Function reference
│   ├── CONFIGURATION.md      # Config options
│   └── EXAMPLES.md           # Usage examples
│
├── skill.json                # Manifest (see schema below)
├── package.json              # npm package
├── tsconfig.json             # TypeScript config
├── vitest.config.ts          # Test config
├── .npmignore                # Exclude from npm package
├── LICENSE                   # MIT recommended
└── README.md                 # User-facing documentation
```

### `skill.json` Schema

Full specification:

```typescript
interface SkillManifest {
  // Required fields
  id: string;                    // Unique identifier (kebab-case)
  name: string;                  // Display name
  version: string;               // Semver (e.g., "1.2.3")
  description: string;           // Short description (max 200 chars)
  author: string;                // "Name <email>" format

  // Permissions (see docs/skills/permissions.md)
  permissions: Permission[];     // ["NETWORK", "KEYVALUE", ...]

  // Functions exposed to agents
  functions: FunctionDef[];

  // Optional fields
  license?: string;              // Default: "MIT"
  repository?: string;           // GitHub/GitLab URL
  homepage?: string;             // Documentation URL
  keywords?: string[];           // For marketplace search
  categories?: Category[];       // ["productivity", "communication", ...]

  // Configuration schema
  config?: Record<string, ConfigOption>;

  // Metadata
  icon?: string;                 // URL to icon image
  screenshots?: string[];        // URLs to screenshots
  pricing?: PricingModel;        // For paid skills

  // Requirements
  minAgentikVersion?: string;    // Minimum Agentik OS version
  dependencies?: Record<string, string>; // Skill dependencies
}

interface FunctionDef {
  name: string;                  // Function name (camelCase)
  description: string;           // What it does
  parameters: Record<string, ParameterDef>;
  returns?: TypeDef;             // Return type (optional)
  examples?: Example[];          // Usage examples
}

interface ParameterDef {
  type: "string" | "number" | "boolean" | "object" | "array";
  description: string;
  required?: boolean;            // Default: false
  default?: any;                 // Default value
  enum?: any[];                  // Allowed values
  pattern?: string;              // Regex validation
  min?: number;                  // Min value/length
  max?: number;                  // Max value/length
}

interface ConfigOption {
  type: "string" | "number" | "boolean";
  description: string;
  required: boolean;
  default?: any;
  secret?: boolean;              // Mask in UI (e.g., API keys)
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    enum?: any[];
  };
}

type Permission =
  | "NETWORK"      // HTTP/HTTPS requests
  | "API"          // Third-party API calls
  | "FILESYSTEM"   // Read/write files (sandboxed)
  | "KEYVALUE"     // Key-value storage
  | "STORAGE";     // Persistent storage

type Category =
  | "productivity"
  | "communication"
  | "utilities"
  | "automation"
  | "data"
  | "security"
  | "development"
  | "business"
  | "entertainment"
  | "other";

interface PricingModel {
  type: "free" | "one-time" | "subscription";
  price?: number;               // USD cents
  currency?: string;            // Default: "USD"
  interval?: "month" | "year";  // For subscriptions
}
```

### TypeScript Types (`src/types.ts`)

Define your skill's types:

```typescript
// Input types for functions
export interface SearchOptions {
  query: string;
  limit?: number;
  filters?: {
    domain?: string;
    dateRange?: { start: Date; end: Date };
  };
}

// Output types for functions
export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  publishedAt?: Date;
}

// Internal types
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

// Configuration
export interface SkillConfig {
  apiKey: string;
  endpoint?: string;
  timeout?: number;
}
```

---

## Function Implementation

### The @SkillFunction Decorator

Mark functions that agents can call with `@SkillFunction`:

```typescript
import { SkillFunction } from "@agentik-os/sdk";

@SkillFunction({
  name: "myFunction",              // Function name (must match method name)
  description: "Does something",   // LLM-friendly description
  parameters: {                    // Parameter definitions
    param1: {
      type: "string",
      description: "First parameter",
      required: true,
    },
    param2: {
      type: "number",
      description: "Second parameter",
      required: false,
      default: 10,
    },
  },
  returns: {                       // Optional: return type description
    type: "object",
    properties: {
      result: { type: "string" },
      count: { type: "number" },
    },
  },
  examples: [                      // Optional: usage examples
    {
      input: { param1: "test", param2: 5 },
      output: { result: "success", count: 5 },
    },
  ],
})
async myFunction(args: { param1: string; param2?: number }) {
  // Implementation
}
```

### Parameter Validation

The SDK automatically validates parameters based on the `@SkillFunction` definition. You can add custom validation:

```typescript
@SkillFunction({
  name: "processData",
  description: "Processes data with custom validation",
  parameters: {
    data: {
      type: "object",
      description: "Data to process",
      required: true,
    },
  },
})
async processData(args: { data: any }) {
  // Custom validation
  if (!args.data || typeof args.data !== "object") {
    throw new Error("Invalid data: must be an object");
  }

  if (!args.data.id) {
    throw new Error("Invalid data: missing required field 'id'");
  }

  // Validation passed, continue with logic
  return this.process(args.data);
}
```

### Error Handling

Use the built-in error types:

```typescript
import { SkillError, SkillErrorCode } from "@agentik-os/sdk";

@SkillFunction({ /* ... */ })
async dangerousOperation(args: any) {
  try {
    return await this.doSomethingRisky();
  } catch (error) {
    // Categorize errors for better agent handling
    if (error.code === "ENOTFOUND") {
      throw new SkillError(
        SkillErrorCode.NETWORK_ERROR,
        "Could not connect to service",
        { originalError: error }
      );
    }

    if (error.status === 401) {
      throw new SkillError(
        SkillErrorCode.AUTHENTICATION_ERROR,
        "Invalid API key - please check configuration",
        { service: "external-api" }
      );
    }

    // Generic error
    throw new SkillError(
      SkillErrorCode.UNKNOWN_ERROR,
      `Operation failed: ${error.message}`,
      { originalError: error }
    );
  }
}
```

**Error Codes:**
- `INVALID_PARAMETERS` - Invalid input
- `PERMISSION_DENIED` - Missing permission
- `NETWORK_ERROR` - Network failure
- `AUTHENTICATION_ERROR` - Auth failed
- `RATE_LIMIT_ERROR` - Rate limited
- `RESOURCE_NOT_FOUND` - Resource not found
- `TIMEOUT_ERROR` - Operation timeout
- `UNKNOWN_ERROR` - Other errors

### Async/Await Best Practices

All skill functions should be `async`:

```typescript
// ✅ Good - async/await
@SkillFunction({ /* ... */ })
async fetchData(args: any) {
  const data = await this.apiClient.get("/data");
  const processed = await this.processData(data);
  return processed;
}

// ❌ Bad - promise chaining
@SkillFunction({ /* ... */ })
fetchData(args: any) {
  return this.apiClient.get("/data")
    .then(data => this.processData(data));
}

// ✅ Good - parallel operations
@SkillFunction({ /* ... */ })
async fetchMultiple(args: { ids: string[] }) {
  const promises = args.ids.map(id => this.fetchOne(id));
  return await Promise.all(promises);
}

// ✅ Good - error handling
@SkillFunction({ /* ... */ })
async safeOperation(args: any) {
  try {
    return await this.dangerousOp();
  } catch (error) {
    this.log("error", `Operation failed: ${error.message}`);
    // Return fallback or throw SkillError
    return this.getFallbackData();
  }
}
```

### Working with Permissions

Check permissions before performing restricted operations:

```typescript
@SkillFunction({
  name: "fetchFromWeb",
  description: "Fetches data from a URL",
  parameters: {
    url: { type: "string", description: "URL to fetch", required: true },
  },
})
async fetchFromWeb(args: { url: string }) {
  // Check NETWORK permission BEFORE making request
  this.checkPermission("NETWORK");

  const response = await fetch(args.url);
  return await response.text();
}

@SkillFunction({
  name: "saveToFile",
  description: "Saves data to a file",
  parameters: {
    filename: { type: "string", required: true },
    content: { type: "string", required: true },
  },
})
async saveToFile(args: { filename: string; content: string }) {
  // Check FILESYSTEM permission
  this.checkPermission("FILESYSTEM");

  // Runtime enforces sandboxed paths (no access outside skill directory)
  await this.writeFile(args.filename, args.content);
}
```

**Permission Methods:**
- `this.checkPermission(permission)` - Throws if not granted
- `this.hasPermission(permission)` - Returns boolean
- `this.getGrantedPermissions()` - Returns array of granted permissions

### Using Skill Storage

Skills have access to persistent storage via the `KEYVALUE` and `STORAGE` permissions:

```typescript
// Key-Value Storage (ephemeral, fast)
@SkillFunction({ /* ... */ })
async cacheData(args: { key: string; value: any }) {
  this.checkPermission("KEYVALUE");

  // Store with 1-hour TTL
  await this.setKeyValue(args.key, JSON.stringify(args.value), {
    ttl: 3600,
  });
}

@SkillFunction({ /* ... */ })
async getCachedData(args: { key: string }) {
  this.checkPermission("KEYVALUE");

  const value = await this.getKeyValue(args.key);
  return value ? JSON.parse(value) : null;
}

// Persistent Storage (long-term, slower)
@SkillFunction({ /* ... */ })
async saveState(args: { state: any }) {
  this.checkPermission("STORAGE");

  await this.writeStorage("state.json", JSON.stringify(args.state));
}

@SkillFunction({ /* ... */ })
async loadState() {
  this.checkPermission("STORAGE");

  const data = await this.readStorage("state.json");
  return data ? JSON.parse(data) : {};
}
```

---

## Testing Skills

### Test Structure

Use Vitest for testing:

```typescript
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { MySkill } from "../src";

describe("MySkill", () => {
  let skill: MySkill;

  beforeEach(async () => {
    // Create skill instance
    skill = new MySkill();

    // Set up config
    skill.setConfig("API_KEY", "test-key");

    // Initialize
    await skill.initialize();
  });

  afterEach(async () => {
    // Cleanup
    await skill.shutdown();
  });

  describe("myFunction", () => {
    it("should return expected result", async () => {
      const result = await skill.myFunction({ param: "value" });
      expect(result).toBe("expected");
    });

    it("should handle errors gracefully", async () => {
      await expect(
        skill.myFunction({ param: "invalid" })
      ).rejects.toThrow("Expected error message");
    });
  });
});
```

### Mocking External APIs

```typescript
import axios from "axios";
import { vi } from "vitest";

vi.mock("axios");

describe("WeatherSkill", () => {
  it("should fetch weather data", async () => {
    // Mock API response
    vi.mocked(axios.get).mockResolvedValue({
      data: {
        main: { temp: 20 },
        weather: [{ description: "sunny" }],
      },
    });

    const skill = new WeatherSkill();
    const result = await skill.getCurrentWeather({ location: "London" });

    expect(result.temperature).toBe(20);
    expect(axios.get).toHaveBeenCalledTimes(1);
  });
});
```

### Integration Tests

Test with a real Agentik OS instance:

```typescript
import { AgentikOSTestClient } from "@agentik-os/sdk/testing";

describe("MySkill Integration", () => {
  let client: AgentikOSTestClient;

  beforeAll(async () => {
    // Start test Agentik OS instance
    client = await AgentikOSTestClient.start({
      skills: ["./dist"], // Load your skill
    });
  });

  afterAll(async () => {
    await client.stop();
  });

  it("should work end-to-end", async () => {
    // Create test agent
    const agent = await client.createAgent({
      name: "Test Agent",
      skills: ["my-skill"],
    });

    // Send message
    const response = await agent.sendMessage("Use my-skill to do something");

    // Verify skill was called
    expect(response.skillCalls).toHaveLength(1);
    expect(response.skillCalls[0].skill).toBe("my-skill");
    expect(response.skillCalls[0].function).toBe("myFunction");
  });
});
```

### Test Coverage

Aim for **>80% code coverage**:

```bash
# Run tests with coverage
pnpm test --coverage

# View coverage report
open coverage/index.html
```

**Coverage Requirements for Marketplace:**
- ✅ **80%** line coverage minimum
- ✅ All exported functions tested
- ✅ Error paths tested
- ✅ Permission checks tested

---

## Publishing to Marketplace

### Certification Levels

Agentik OS has a **4-tier certification program**:

| Level | Requirements | Revenue Split | Badge |
|-------|-------------|---------------|-------|
| **AOCD** (Developer) | 80% test coverage, security scan, documentation | 70/30 | 🥉 Bronze |
| **AOCM** (Master) | AOCD + 100 installs, 4.5+ rating, community support | 75/25 | 🥈 Silver |
| **AOCE** (Expert) | AOCM + 1000 installs, 4.8+ rating, code review | 80/20 | 🥇 Gold |
| **AOCT** (Titan) | AOCE + 10K installs, official partnership, enterprise features | 85/15 | 💎 Diamond |

### Publishing Checklist

Before publishing, ensure:

- [ ] **Tests**: >80% coverage, all passing
- [ ] **Security**: No secrets in code, dependencies scanned
- [ ] **Documentation**: README, API docs, examples
- [ ] **Manifest**: `skill.json` complete and valid
- [ ] **License**: OSS license (MIT/Apache recommended)
- [ ] **Versioning**: Semver format (1.0.0)
- [ ] **Build**: `pnpm build` succeeds
- [ ] **Permissions**: Minimal necessary permissions
- [ ] **Icon**: 512x512px PNG icon
- [ ] **Screenshots**: At least 2 screenshots

### Publishing Steps

```bash
# 1. Login to Agentik OS
panda auth login

# 2. Validate skill locally
panda skill validate

# 3. Run security scan
panda skill scan

# 4. Submit for certification (AOCD)
panda skill certify

# Wait for automated checks + manual review (2-5 days)

# 5. Publish to marketplace
panda skill publish

✓ Skill published: my-skill@1.0.0
✓ Marketplace URL: https://skills.agentik-os.com/my-skill
```

### Versioning

Follow **Semantic Versioning** (semver):

- **Major** (1.0.0 → 2.0.0): Breaking changes
- **Minor** (1.0.0 → 1.1.0): New features, backward compatible
- **Patch** (1.0.0 → 1.0.1): Bug fixes

```bash
# Publish update
pnpm version patch  # or minor, major
panda skill publish
```

### Monetization

Set pricing in `skill.json`:

```json
{
  "pricing": {
    "type": "subscription",
    "price": 999,          // $9.99/month (in cents)
    "currency": "USD",
    "interval": "month"
  }
}
```

**Revenue Splits:**
- Free skills: 100% free to users
- Paid skills: You get 70-85% (based on certification level)
- Agentik OS handles billing, taxes, and payouts

---

## Best Practices

### 1. Design Principles

**Single Responsibility**: One skill = one domain
```typescript
// ✅ Good - focused skill
class WeatherSkill {
  async getCurrentWeather() { /* ... */ }
  async getForecast() { /* ... */ }
  async getHistorical() { /* ... */ }
}

// ❌ Bad - too broad
class UtilitySkill {
  async getWeather() { /* ... */ }
  async sendEmail() { /* ... */ }
  async queryDatabase() { /* ... */ }
}
```

**Composability**: Skills can depend on other skills
```typescript
// Good - compose skills
class NewsDigestSkill {
  async initialize() {
    this.webSearch = await this.loadSkill("web-search");
    this.summarizer = await this.loadSkill("text-summarizer");
  }

  async createDigest(topic: string) {
    const articles = await this.webSearch.search({ query: topic, limit: 10 });
    const summaries = await Promise.all(
      articles.map(a => this.summarizer.summarize({ text: a.content }))
    );
    return { topic, summaries };
  }
}
```

### 2. Performance

**Cache aggressively**:
```typescript
async fetchData(args: { query: string }) {
  const cacheKey = `data:${args.query}`;

  // Check cache first
  const cached = await this.getKeyValue(cacheKey);
  if (cached) {
    return JSON.parse(cached);
  }

  // Fetch if not cached
  const data = await this.apiClient.get("/data", { params: { q: args.query } });

  // Cache for 1 hour
  await this.setKeyValue(cacheKey, JSON.stringify(data), { ttl: 3600 });

  return data;
}
```

**Batch operations**:
```typescript
// ✅ Good - batch
async fetchMultiple(args: { ids: string[] }) {
  const data = await this.apiClient.post("/batch", { ids: args.ids });
  return data;
}

// ❌ Bad - loop
async fetchMultiple(args: { ids: string[] }) {
  const results = [];
  for (const id of args.ids) {
    results.push(await this.apiClient.get(`/item/${id}`));
  }
  return results;
}
```

**Timeout long operations**:
```typescript
async slowOperation(args: any) {
  return await Promise.race([
    this.doSlowThing(args),
    this.timeout(30000), // 30 second timeout
  ]);
}

private timeout(ms: number): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Operation timeout after ${ms}ms`)), ms);
  });
}
```

### 3. Security

**Validate all inputs**:
```typescript
async processUrl(args: { url: string }) {
  // Validate URL format
  if (!/^https?:\/\//.test(args.url)) {
    throw new Error("Invalid URL: must start with http:// or https://");
  }

  // Prevent SSRF attacks
  const parsed = new URL(args.url);
  if (parsed.hostname === "localhost" || parsed.hostname.startsWith("192.168.")) {
    throw new Error("Access to local/private IPs not allowed");
  }

  // Continue with safe URL
  return await fetch(args.url);
}
```

**Never log secrets**:
```typescript
// ❌ Bad - logs API key
this.log("info", `Calling API with key: ${this.apiKey}`);

// ✅ Good - masks secret
this.log("info", `Calling API with key: ${this.apiKey.slice(0, 4)}...`);
```

**Use environment variables for secrets**:
```typescript
// ✅ Good - from config (set by user in dashboard)
async initialize() {
  this.apiKey = this.getConfig("API_KEY");
}

// ❌ Bad - hardcoded
async initialize() {
  this.apiKey = "sk_live_abc123"; // NEVER DO THIS
}
```

### 4. User Experience

**Provide helpful error messages**:
```typescript
// ❌ Bad
throw new Error("Failed");

// ✅ Good
throw new SkillError(
  SkillErrorCode.AUTHENTICATION_ERROR,
  "Could not authenticate with the API. Please check your API key in Settings > Skills > My Skill > Configuration.",
  { field: "API_KEY" }
);
```

**Support retries**:
```typescript
async fetchWithRetry(url: string, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fetch(url);
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await this.sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}

private sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
```

**Provide progress updates for long operations**:
```typescript
async processLargeDataset(args: { items: any[] }) {
  const total = args.items.length;

  for (let i = 0; i < total; i++) {
    await this.processItem(args.items[i]);

    // Emit progress every 10%
    if (i % Math.floor(total / 10) === 0) {
      this.emitProgress({
        current: i,
        total,
        percentage: Math.floor((i / total) * 100),
      });
    }
  }
}
```

### 5. Documentation

**Write clear function descriptions**:
```typescript
// ❌ Bad
@SkillFunction({
  name: "search",
  description: "Searches",
  // ...
})

// ✅ Good
@SkillFunction({
  name: "searchProducts",
  description: "Searches the product catalog using natural language. Returns up to 20 results ranked by relevance.",
  examples: [
    {
      input: { query: "wireless headphones under $100" },
      output: { results: [/* ... */], count: 15 },
    },
  ],
  // ...
})
```

**Maintain a changelog** (`CHANGELOG.md`):
```markdown
# Changelog

## [1.2.0] - 2024-02-14
### Added
- New `searchWithFilters()` function for advanced queries
- Support for pagination in search results

### Fixed
- Fixed bug where special characters in queries caused errors

### Changed
- Increased default timeout from 5s to 10s

## [1.1.0] - 2024-02-01
### Added
- Initial release
```

**Provide examples in README**:
```markdown
## Examples

### Basic Search
\`\`\`typescript
const result = await skill.search({ query: "AI agents" });
console.log(result.items);
\`\`\`

### Advanced Search with Filters
\`\`\`typescript
const result = await skill.searchWithFilters({
  query: "machine learning",
  filters: {
    dateRange: { start: new Date("2024-01-01"), end: new Date() },
    language: "en",
  },
  limit: 50,
});
\`\`\`
```

---

## Advanced Topics

### Streaming Responses

For long-running operations, stream results:

```typescript
import { SkillFunction, StreamableSkillFunction } from "@agentik-os/sdk";

@StreamableSkillFunction({
  name: "generateReport",
  description: "Generates a report and streams progress",
  parameters: {
    topic: { type: "string", required: true },
  },
})
async* generateReport(args: { topic: string }) {
  yield { status: "Starting", progress: 0 };

  yield { status: "Gathering data", progress: 25 };
  const data = await this.gatherData(args.topic);

  yield { status: "Analyzing", progress: 50 };
  const analysis = await this.analyze(data);

  yield { status: "Formatting", progress: 75 };
  const report = await this.format(analysis);

  yield { status: "Complete", progress: 100, result: report };
}
```

### Skill Dependencies

Skills can depend on other skills:

```json
// skill.json
{
  "dependencies": {
    "web-search": "^1.0.0",
    "text-summarizer": "^2.0.0"
  }
}
```

```typescript
// src/index.ts
export class NewsDigestSkill extends SkillBase {
  private webSearch: any;
  private summarizer: any;

  async initialize() {
    this.webSearch = await this.loadSkill("web-search");
    this.summarizer = await this.loadSkill("text-summarizer");
  }

  async createDigest(args: { topic: string }) {
    const articles = await this.webSearch.search({ query: args.topic });
    const summaries = await Promise.all(
      articles.map(a => this.summarizer.summarize({ text: a.content }))
    );
    return summaries;
  }
}
```

### Webhook Integration

Skills can expose webhooks for external events:

```typescript
import { SkillWebhook } from "@agentik-os/sdk";

export class GitHubSkill extends SkillBase {
  @SkillWebhook({
    path: "/github/webhook",
    method: "POST",
  })
  async handleWebhook(req: Request) {
    const event = req.headers.get("X-GitHub-Event");
    const payload = await req.json();

    if (event === "push") {
      await this.handlePush(payload);
    } else if (event === "pull_request") {
      await this.handlePR(payload);
    }

    return new Response("OK", { status: 200 });
  }
}
```

Webhook URL: `https://your-agentik-os.com/webhooks/github-skill/github/webhook`

### Multi-Language Support

Provide translations for skill metadata:

```json
// skill.json
{
  "name": "Weather Skill",
  "description": "Fetches current weather",
  "i18n": {
    "es": {
      "name": "Habilidad del Clima",
      "description": "Obtiene el clima actual"
    },
    "fr": {
      "name": "Compétence Météo",
      "description": "Récupère la météo actuelle"
    }
  }
}
```

---

## Examples

### Example 1: Web Search Skill

Complete implementation of a web search skill using Brave Search API:

```typescript
import { SkillBase, SkillFunction, SkillMetadata } from "@agentik-os/sdk";
import axios from "axios";

export class WebSearchSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "web-search",
    name: "Web Search",
    version: "1.0.0",
    description: "Search the web using Brave Search API",
    author: "Agentik OS <hello@agentik-os.com>",
    permissions: ["NETWORK", "KEYVALUE"],
  };

  private apiKey: string;

  async initialize(): Promise<void> {
    this.apiKey = this.getConfig("BRAVE_API_KEY");
    if (!this.apiKey) {
      throw new Error("Missing BRAVE_API_KEY in configuration");
    }
  }

  @SkillFunction({
    name: "search",
    description: "Search the web for information",
    parameters: {
      query: {
        type: "string",
        description: "Search query",
        required: true,
      },
      limit: {
        type: "number",
        description: "Number of results (1-20)",
        required: false,
        default: 10,
        min: 1,
        max: 20,
      },
    },
  })
  async search(args: { query: string; limit?: number }): Promise<{
    results: Array<{
      title: string;
      url: string;
      description: string;
    }>;
  }> {
    this.checkPermission("NETWORK");

    const limit = args.limit || 10;
    const cacheKey = `search:${args.query}:${limit}`;

    // Check cache
    const cached = await this.getKeyValue(cacheKey);
    if (cached) {
      this.log("info", `Cache hit for query: ${args.query}`);
      return JSON.parse(cached);
    }

    // Perform search
    try {
      const response = await axios.get("https://api.search.brave.com/res/v1/web/search", {
        params: { q: args.query, count: limit },
        headers: {
          "X-Subscription-Token": this.apiKey,
          "Accept": "application/json",
        },
        timeout: 10000,
      });

      const results = response.data.web.results.map((r: any) => ({
        title: r.title,
        url: r.url,
        description: r.description,
      }));

      const output = { results };

      // Cache for 1 hour
      await this.setKeyValue(cacheKey, JSON.stringify(output), { ttl: 3600 });

      return output;
    } catch (error) {
      this.log("error", `Search failed: ${error.message}`);
      throw new Error(`Web search failed: ${error.message}`);
    }
  }
}
```

### Example 2: Calendar Skill

Google Calendar integration:

```typescript
import { SkillBase, SkillFunction, SkillMetadata } from "@agentik-os/sdk";
import { google } from "googleapis";

export class CalendarSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "calendar",
    name: "Calendar",
    version: "1.0.0",
    description: "Manage Google Calendar events",
    author: "Agentik OS <hello@agentik-os.com>",
    permissions: ["API", "KEYVALUE"],
  };

  private calendar: any;

  async initialize(): Promise<void> {
    const credentials = JSON.parse(this.getConfig("GOOGLE_CREDENTIALS"));
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    this.calendar = google.calendar({ version: "v3", auth });
  }

  @SkillFunction({
    name: "createEvent",
    description: "Create a new calendar event",
    parameters: {
      title: { type: "string", description: "Event title", required: true },
      start: { type: "string", description: "Start time (ISO 8601)", required: true },
      end: { type: "string", description: "End time (ISO 8601)", required: true },
      description: { type: "string", description: "Event description" },
    },
  })
  async createEvent(args: {
    title: string;
    start: string;
    end: string;
    description?: string;
  }) {
    this.checkPermission("API");

    const event = {
      summary: args.title,
      description: args.description,
      start: { dateTime: args.start },
      end: { dateTime: args.end },
    };

    const response = await this.calendar.events.insert({
      calendarId: "primary",
      requestBody: event,
    });

    return {
      id: response.data.id,
      url: response.data.htmlLink,
    };
  }

  @SkillFunction({
    name: "listEvents",
    description: "List upcoming calendar events",
    parameters: {
      days: {
        type: "number",
        description: "Number of days to look ahead",
        default: 7,
      },
    },
  })
  async listEvents(args: { days?: number }): Promise<Array<{
    id: string;
    title: string;
    start: string;
    end: string;
  }>> {
    this.checkPermission("API");

    const now = new Date();
    const future = new Date();
    future.setDate(now.getDate() + (args.days || 7));

    const response = await this.calendar.events.list({
      calendarId: "primary",
      timeMin: now.toISOString(),
      timeMax: future.toISOString(),
      singleEvents: true,
      orderBy: "startTime",
    });

    return response.data.items.map((event: any) => ({
      id: event.id,
      title: event.summary,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
    }));
  }
}
```

### Example 3: File Operations Skill

Sandboxed file operations:

```typescript
import { SkillBase, SkillFunction, SkillMetadata } from "@agentik-os/sdk";
import * as fs from "fs/promises";
import * as path from "path";

export class FileOpsSkill extends SkillBase {
  metadata: SkillMetadata = {
    id: "file-ops",
    name: "File Operations",
    version: "1.0.0",
    description: "Read, write, and list files (sandboxed)",
    author: "Agentik OS <hello@agentik-os.com>",
    permissions: ["FILESYSTEM"],
  };

  private basePath: string;

  async initialize(): Promise<void> {
    // Sandbox restricts file access to skill's data directory
    this.basePath = this.getDataPath();
    await fs.mkdir(this.basePath, { recursive: true });
  }

  @SkillFunction({
    name: "readFile",
    description: "Read contents of a file",
    parameters: {
      filename: { type: "string", description: "Filename to read", required: true },
    },
  })
  async readFile(args: { filename: string }): Promise<{ content: string }> {
    this.checkPermission("FILESYSTEM");

    const safePath = this.getSafePath(args.filename);
    const content = await fs.readFile(safePath, "utf-8");

    return { content };
  }

  @SkillFunction({
    name: "writeFile",
    description: "Write content to a file",
    parameters: {
      filename: { type: "string", description: "Filename to write", required: true },
      content: { type: "string", description: "Content to write", required: true },
    },
  })
  async writeFile(args: { filename: string; content: string }): Promise<{ success: boolean }> {
    this.checkPermission("FILESYSTEM");

    const safePath = this.getSafePath(args.filename);
    await fs.writeFile(safePath, args.content, "utf-8");

    return { success: true };
  }

  @SkillFunction({
    name: "listFiles",
    description: "List files in a directory",
    parameters: {
      directory: {
        type: "string",
        description: "Directory path (relative to skill root)",
        default: ".",
      },
    },
  })
  async listFiles(args: { directory?: string }): Promise<{
    files: Array<{ name: string; size: number; modified: string }>;
  }> {
    this.checkPermission("FILESYSTEM");

    const safePath = this.getSafePath(args.directory || ".");
    const entries = await fs.readdir(safePath, { withFileTypes: true });

    const files = await Promise.all(
      entries.map(async (entry) => {
        const stats = await fs.stat(path.join(safePath, entry.name));
        return {
          name: entry.name,
          size: stats.size,
          modified: stats.mtime.toISOString(),
        };
      })
    );

    return { files };
  }

  // Prevent path traversal attacks
  private getSafePath(filename: string): string {
    const resolved = path.resolve(this.basePath, filename);
    if (!resolved.startsWith(this.basePath)) {
      throw new Error("Access denied: path outside skill directory");
    }
    return resolved;
  }
}
```

---

## Troubleshooting

### Common Issues

**1. "Permission denied" errors**

```
Error: Permission NETWORK not granted for skill my-skill
```

**Solution**: Add permission to `skill.json`:
```json
{
  "permissions": ["NETWORK"]
}
```

And check permission in code:
```typescript
this.checkPermission("NETWORK");
```

**2. "Function not found"**

```
Error: Function 'myFunction' not found in skill
```

**Solution**: Ensure function is decorated with `@SkillFunction`:
```typescript
@SkillFunction({ name: "myFunction", /* ... */ })
async myFunction(args: any) { /* ... */ }
```

**3. Skill fails to initialize**

```
Error: Skill initialization failed: Missing API_KEY
```

**Solution**: Check config is set:
```typescript
async initialize() {
  const apiKey = this.getConfig("API_KEY");
  if (!apiKey) {
    throw new Error("Missing API_KEY - please configure in Dashboard > Skills > My Skill");
  }
}
```

**4. TypeScript compilation errors**

```
error TS2345: Argument of type 'string' is not assignable to parameter of type 'number'
```

**Solution**: Fix type mismatches. Enable strict mode in `tsconfig.json`:
```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true
  }
}
```

**5. Tests fail with "Cannot find module"**

```
Error: Cannot find module '@agentik-os/sdk'
```

**Solution**: Install SDK as dev dependency:
```bash
pnpm add -D @agentik-os/sdk
```

### Debugging

**Enable debug logging**:
```typescript
export class MySkill extends SkillBase {
  async myFunction(args: any) {
    this.log("debug", `Input: ${JSON.stringify(args)}`);

    const result = await this.processData(args);
    this.log("debug", `Output: ${JSON.stringify(result)}`);

    return result;
  }
}
```

**View logs**:
```bash
# Watch skill logs in real-time
panda skill logs my-skill --follow

# Filter by log level
panda skill logs my-skill --level error
```

**Use the debugger**:
```typescript
// Set breakpoint in VS Code, then:
panda skill test my-skill --debug

// Or use Node debugger
node --inspect node_modules/.bin/panda skill test my-skill
```

### Performance Profiling

**Measure function execution time**:
```typescript
async myFunction(args: any) {
  const start = performance.now();

  const result = await this.heavyOperation(args);

  const duration = performance.now() - start;
  this.log("info", `Operation took ${duration.toFixed(2)}ms`);

  return result;
}
```

**View performance metrics**:
```bash
panda skill stats my-skill
```

### Getting Help

- **Documentation**: https://docs.agentik-os.com
- **Community Discord**: https://discord.gg/agentik-os
- **GitHub Issues**: https://github.com/agentik-os/agentik-os/issues
- **Stack Overflow**: Tag questions with `agentik-os`

---

## Next Steps

Now that you've learned the fundamentals of skill development, explore:

1. **[Permissions Guide](./permissions.md)** - Deep dive into the permission system
2. **[MCP Integration](./mcp-integration.md)** - Wrap existing MCP servers as skills
3. **[API Reference](../api-reference.md)** - Complete SDK documentation
4. **[Example Skills](https://github.com/agentik-os/skills)** - 20+ open-source skills

**Ready to build?** Start with:
```bash
panda skill create my-first-skill
```

Happy coding! 🚀

---

*Last updated: 2024-02-14*
*Agentik OS Skills SDK v1.0.0*
