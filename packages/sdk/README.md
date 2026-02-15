# Agentik OS SDK

**Build powerful skills for AI agents with the Agentik OS SDK**

The Agentik OS SDK provides everything you need to create custom skills that extend your AI agents' capabilities. Whether you're building integrations, tools, or custom behaviors, this SDK makes it simple.

---

## Table of Contents

- [Getting Started](#getting-started)
- [Core Concepts](#core-concepts)
- [Creating Your First Skill](#creating-your-first-skill)
- [Skill API Reference](#skill-api-reference)
- [Testing Skills](#testing-skills)
- [Publishing Skills](#publishing-skills)
- [Examples](#examples)
- [Best Practices](#best-practices)

---

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- TypeScript 5.0+
- Agentik OS installed (`panda` CLI available)

### Installation

```bash
npm install @agentik-os/sdk
# or
bun add @agentik-os/sdk
```

### Quick Start

Create a simple skill in 5 minutes:

```typescript
import { SkillBase } from "@agentik-os/sdk";

export class HelloWorldSkill extends SkillBase {
  id = "hello-world";
  name = "Hello World";
  description = "A simple greeting skill";
  version = "1.0.0";

  async execute(input: { name?: string }) {
    const name = input.name || "World";
    return {
      message: `Hello, ${name}!`,
      timestamp: new Date().toISOString()
    };
  }
}
```

---

## Core Concepts

### What is a Skill?

A **skill** is a reusable capability that an AI agent can use to perform tasks. Skills can:

- Call external APIs (web search, weather, calendar)
- Manipulate files (read, write, organize)
- Process data (parse, transform, analyze)
- Interact with services (send emails, post to Slack)
- Perform calculations or complex logic

### Skill Lifecycle

```
1. Development → 2. Testing → 3. Packaging → 4. Installation → 5. Execution
```

1. **Development**: Write your skill code
2. **Testing**: Test locally with mock data
3. **Packaging**: Bundle as a package or WASM module
4. **Installation**: Install in Agentik OS (`panda skill install`)
5. **Execution**: AI agents call your skill when needed

### Skill Types

| Type | Description | Use Case |
|------|-------------|----------|
| **Built-in** | Shipped with Agentik OS | Web search, file ops, calendar |
| **Local** | Developed locally by you | Custom business logic, internal tools |
| **Marketplace** | Published to marketplace | Shareable, monetizable skills |
| **MCP** | Model Context Protocol | Integrations via Claude Code's MCP servers |

---

## Creating Your First Skill

### Step 1: Initialize Skill

```bash
mkdir my-skill
cd my-skill
npm init -y
npm install @agentik-os/sdk typescript
npx tsc --init
```

### Step 2: Create Skill Class

**File:** `src/index.ts`

```typescript
import { SkillBase, type SkillInput, type SkillOutput } from "@agentik-os/sdk";

export interface WeatherInput extends SkillInput {
  location: string;
  units?: "metric" | "imperial";
}

export interface WeatherOutput extends SkillOutput {
  temperature: number;
  conditions: string;
  humidity: number;
}

export class WeatherSkill extends SkillBase<WeatherInput, WeatherOutput> {
  id = "weather";
  name = "Weather Lookup";
  description = "Get current weather for any location";
  version = "1.0.0";
  author = "Your Name";

  // Permissions required by this skill
  permissions = [
    "network:http", // Can make HTTP requests
    "api:openweathermap" // Can use OpenWeatherMap API
  ];

  // Configuration schema
  configSchema = {
    apiKey: {
      type: "string",
      required: true,
      description: "OpenWeatherMap API key"
    }
  };

  async execute(input: WeatherInput): Promise<WeatherOutput> {
    const { location, units = "metric" } = input;
    const apiKey = this.config.apiKey;

    // Validate inputs
    if (!location) {
      throw new Error("Location is required");
    }

    if (!apiKey) {
      throw new Error("API key not configured");
    }

    // Call weather API
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(location)}&units=${units}&appid=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();

    // Return structured output
    return {
      temperature: data.main.temp,
      conditions: data.weather[0].description,
      humidity: data.main.humidity,
      success: true
    };
  }
}
```

### Step 3: Create Manifest

**File:** `skill.json`

```json
{
  "id": "weather",
  "name": "Weather Lookup",
  "description": "Get current weather for any location",
  "version": "1.0.0",
  "author": "Your Name",
  "entrypoint": "./dist/index.js",
  "permissions": [
    "network:http",
    "api:openweathermap"
  ],
  "config": {
    "apiKey": {
      "type": "string",
      "required": true,
      "description": "OpenWeatherMap API key"
    }
  },
  "tags": ["weather", "api", "data"]
}
```

### Step 4: Build

```bash
npx tsc
```

### Step 5: Test Locally

```typescript
// test.ts
import { WeatherSkill } from "./dist/index.js";

const skill = new WeatherSkill({
  apiKey: "your-api-key-here"
});

const result = await skill.execute({
  location: "London",
  units: "metric"
});

console.log(result);
// { temperature: 15, conditions: "partly cloudy", humidity: 65, success: true }
```

### Step 6: Install in Agentik OS

```bash
# Link for local development
panda skill install ./my-skill

# Or package and publish
npm pack
panda skill install ./weather-1.0.0.tgz
```

---

## Skill API Reference

### SkillBase

Base class for all skills.

```typescript
abstract class SkillBase<TInput extends SkillInput, TOutput extends SkillOutput> {
  // Metadata (required)
  abstract id: string;
  abstract name: string;
  abstract description: string;
  abstract version: string;
  author?: string;

  // Permissions (optional)
  permissions?: string[];

  // Configuration (optional)
  config?: Record<string, unknown>;
  configSchema?: Record<string, ConfigField>;

  // Tags for discovery (optional)
  tags?: string[];

  // Main execution method (required)
  abstract execute(input: TInput): Promise<TOutput>;

  // Lifecycle hooks (optional)
  async onInstall?(): Promise<void>;
  async onUninstall?(): Promise<void>;
  async onConfigure?(config: Record<string, unknown>): Promise<void>;
}
```

### SkillInput

Base interface for skill inputs.

```typescript
interface SkillInput {
  // Agent that called this skill
  agentId?: string;

  // User who triggered this
  userId?: string;

  // Conversation context
  conversationId?: string;

  // Previous skill outputs in chain
  context?: Record<string, unknown>;

  // Add your custom fields here
  [key: string]: unknown;
}
```

### SkillOutput

Base interface for skill outputs.

```typescript
interface SkillOutput {
  // Whether skill succeeded
  success: boolean;

  // Error message if failed
  error?: string;

  // Add your custom fields here
  [key: string]: unknown;
}
```

### Permissions

Skills must declare required permissions:

| Permission | Description | Example Use |
|------------|-------------|-------------|
| `network:http` | Make HTTP/HTTPS requests | API calls |
| `network:ws` | WebSocket connections | Real-time data |
| `fs:read:<path>` | Read files | Read config files |
| `fs:write:<path>` | Write files | Save reports |
| `fs:list:<path>` | List directory | File management |
| `api:<service>` | Call specific API | `api:openai`, `api:stripe` |
| `db:read` | Read from database | Query data |
| `db:write` | Write to database | Save data |

**Example:**

```typescript
permissions = [
  "network:http",          // Can make HTTP requests
  "fs:read:/tmp/*",        // Can read files in /tmp
  "fs:write:/tmp/*",       // Can write files in /tmp
  "api:openai"             // Can call OpenAI API
];
```

---

## Testing Skills

### Unit Testing

**File:** `src/index.test.ts`

```typescript
import { describe, it, expect } from "vitest";
import { WeatherSkill } from "./index";

describe("WeatherSkill", () => {
  it("should return weather data", async () => {
    const skill = new WeatherSkill({
      apiKey: "test-key"
    });

    const result = await skill.execute({
      location: "London",
      units: "metric"
    });

    expect(result.success).toBe(true);
    expect(result.temperature).toBeDefined();
    expect(result.conditions).toBeDefined();
  });

  it("should handle errors gracefully", async () => {
    const skill = new WeatherSkill({
      apiKey: "invalid-key"
    });

    await expect(skill.execute({ location: "InvalidCity123" }))
      .rejects
      .toThrow();
  });
});
```

### Integration Testing

Test with real Agentik OS:

```bash
# Install skill locally
panda skill install ./my-skill

# Test with an agent
panda chat "My Agent"
> Use the weather skill to get the weather in Paris

# Check logs
panda logs --skill weather
```

---

## Publishing Skills

### To Local Registry

```bash
# Build
npm run build

# Package
npm pack

# Install locally
panda skill install ./weather-1.0.0.tgz
```

### To Marketplace (Coming in Phase 2)

```bash
# Login to marketplace
panda login

# Publish skill
panda skill publish ./weather-1.0.0.tgz --category "Data & APIs"

# Users can install with
panda skill install weather
```

---

## Examples

### Example 1: Simple Calculator

```typescript
import { SkillBase } from "@agentik-os/sdk";

interface CalcInput {
  operation: "add" | "subtract" | "multiply" | "divide";
  a: number;
  b: number;
}

export class CalculatorSkill extends SkillBase<CalcInput> {
  id = "calculator";
  name = "Calculator";
  description = "Perform basic math operations";
  version = "1.0.0";
  permissions = []; // No permissions needed

  async execute(input: CalcInput) {
    const { operation, a, b } = input;

    let result: number;

    switch (operation) {
      case "add":
        result = a + b;
        break;
      case "subtract":
        result = a - b;
        break;
      case "multiply":
        result = a * b;
        break;
      case "divide":
        if (b === 0) throw new Error("Division by zero");
        result = a / b;
        break;
    }

    return { result, success: true };
  }
}
```

### Example 2: File Reader

```typescript
import { SkillBase } from "@agentik-os/sdk";
import { readFile } from "fs/promises";

interface FileInput {
  path: string;
  encoding?: "utf-8" | "base64";
}

export class FileReaderSkill extends SkillBase<FileInput> {
  id = "file-reader";
  name = "File Reader";
  description = "Read file contents";
  version = "1.0.0";
  permissions = ["fs:read:/tmp/*"];

  async execute(input: FileInput) {
    const { path, encoding = "utf-8" } = input;

    // Security: Validate path is within allowed directory
    if (!path.startsWith("/tmp/")) {
      throw new Error("Access denied: Path must be in /tmp/");
    }

    const content = await readFile(path, { encoding });

    return {
      content,
      size: content.length,
      success: true
    };
  }
}
```

### Example 3: API Integration (Slack)

```typescript
import { SkillBase } from "@agentik-os/sdk";

interface SlackInput {
  channel: string;
  message: string;
}

export class SlackSkill extends SkillBase<SlackInput> {
  id = "slack";
  name = "Slack Integration";
  description = "Send messages to Slack";
  version = "1.0.0";
  permissions = ["network:http", "api:slack"];

  configSchema = {
    botToken: {
      type: "string",
      required: true,
      description: "Slack Bot Token"
    }
  };

  async execute(input: SlackInput) {
    const { channel, message } = input;
    const token = this.config.botToken;

    const response = await fetch("https://slack.com/api/chat.postMessage", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ channel, text: message })
    });

    const data = await response.json();

    if (!data.ok) {
      throw new Error(`Slack API error: ${data.error}`);
    }

    return {
      messageId: data.ts,
      channel: data.channel,
      success: true
    };
  }
}
```

---

## Best Practices

### 1. Error Handling

Always handle errors gracefully:

```typescript
async execute(input: MyInput) {
  try {
    // Your logic here
    return { success: true, result: data };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}
```

### 2. Input Validation

Validate all inputs:

```typescript
async execute(input: MyInput) {
  if (!input.requiredField) {
    throw new Error("requiredField is required");
  }

  if (typeof input.number !== "number") {
    throw new Error("number must be a number");
  }

  // Continue with validated input
}
```

### 3. Configuration

Use config for API keys and secrets:

```typescript
configSchema = {
  apiKey: {
    type: "string",
    required: true,
    sensitive: true, // Marks as secret (won't be logged)
    description: "API key for service"
  }
};
```

### 4. Permissions

Request minimum permissions needed:

```typescript
// ❌ Too broad
permissions = ["fs:read:/*"]; // Can read entire filesystem

// ✅ Specific
permissions = ["fs:read:/tmp/data/*"]; // Only data directory
```

### 5. Logging

Use structured logging:

```typescript
async execute(input: MyInput) {
  this.log("info", "Processing request", {
    inputSize: JSON.stringify(input).length
  });

  // Your logic

  this.log("success", "Request completed", {
    duration: Date.now() - startTime
  });
}
```

### 6. Performance

- Cache expensive operations
- Use streaming for large data
- Implement timeouts

```typescript
async execute(input: MyInput) {
  // Add timeout
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);

  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}
```

### 7. Testing

Write comprehensive tests:

- Unit tests for logic
- Integration tests with real APIs
- Error scenario tests
- Edge case tests

---

## Security

### Sandboxing

All skills run in a sandboxed environment:

- ✅ Permissions enforced at runtime
- ✅ File system access restricted
- ✅ Network access monitored
- ✅ Resource limits applied (CPU, memory)

### Best Practices

1. **Never hardcode secrets** - Use config instead
2. **Validate all inputs** - Prevent injection attacks
3. **Sanitize outputs** - Don't leak sensitive data
4. **Request minimum permissions** - Principle of least privilege
5. **Handle errors securely** - Don't expose internal details

---

## Support

- **Documentation**: https://docs.agentik-os.com
- **GitHub**: https://github.com/agentik-os/agentik-os
- **Discord**: https://discord.gg/agentik-os
- **Issues**: https://github.com/agentik-os/agentik-os/issues

---

## License

MIT © Agentik OS

---

**Happy skill building! 🛠️**
