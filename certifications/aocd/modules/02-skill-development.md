# Module 2: Skill Development

## Learning Objectives

By the end of this module, you will be able to:
- Build custom skills using the Agentik OS SDK
- Implement proper input validation and error handling
- Write comprehensive tests using the testing framework
- Publish skills to the marketplace

## 2.1 SkillBase Class

Every skill extends `SkillBase`:

```typescript
import { SkillBase, type SkillInput, type SkillOutput } from "@agentik-os/sdk";

interface MyInput extends SkillInput {
  query: string;
}

interface MyOutput extends SkillOutput {
  data: unknown;
}

class MySkill extends SkillBase<MyInput, MyOutput> {
  readonly id = "my-skill";
  readonly name = "My Skill";
  readonly description = "Does something useful";
  readonly version = "1.0.0";

  async execute(input: MyInput): Promise<MyOutput> {
    // Your logic here
    return { success: true, data: result };
  }
}
```

### Required Properties

| Property | Type | Description |
|----------|------|-------------|
| `id` | string | Unique identifier (kebab-case) |
| `name` | string | Human-readable name |
| `description` | string | Short description |
| `version` | string | Semantic version |

### Optional Properties

| Property | Type | Description |
|----------|------|-------------|
| `author` | string | Author or organization |
| `permissions` | string[] | Required runtime permissions |
| `configSchema` | Record | Configuration field definitions |
| `tags` | string[] | Discovery tags |

## 2.2 Permission System

Skills declare required permissions using a category:resource format:

| Category | Resources | Example |
|----------|-----------|---------|
| `fs` | read, write, delete | `fs:read:/tmp/*` |
| `network` | http, https, ws | `network:http` |
| `system` | exec, env, process | `system:env` |
| `api` | external service names | `api:openai` |
| `ai` | model access | `ai:claude` |
| `kv` | key-value store | `kv:read`, `kv:write` |
| `env` | environment variables | `env:API_KEY` |
| `memory` | agent memory access | `memory:read` |
| `external` | external service calls | `external:webhook` |

```typescript
class WebSearchSkill extends SkillBase {
  readonly permissions = ["network:http", "network:https"];
  // ...
}
```

## 2.3 Skill Manifest

Every skill has a `skill.json`:

```json
{
  "id": "web-search",
  "name": "Web Search",
  "version": "1.0.0",
  "description": "Search the web using multiple engines",
  "author": "Agentik OS",
  "type": "official",
  "permissions": ["network:http", "network:https"],
  "tags": ["search", "web", "data"],
  "config": {
    "engine": {
      "type": "string",
      "default": "google",
      "enum": ["google", "bing", "duckduckgo"]
    },
    "maxResults": {
      "type": "number",
      "default": 10,
      "min": 1,
      "max": 100
    }
  },
  "dependencies": {}
}
```

## 2.4 Testing Framework

The SDK provides testing utilities:

### Mock Context

```typescript
import { createMockContext, createMockInput } from "@agentik-os/sdk";

const ctx = createMockContext({
  agentId: "test-agent",
  config: { apiKey: "test-key" },
});

skill.setContext(ctx);

// Check captured logs
expect(ctx.logs).toContainEqual({
  level: "info",
  message: expect.stringContaining("Executing"),
});
```

### Assertions

```typescript
import {
  assertSkillSuccess,
  assertSkillError,
  assertSkillOutput,
  assertExecutionTime,
} from "@agentik-os/sdk";

// Verify success
assertSkillSuccess(result);

// Verify failure
assertSkillError(result, "Query is required");

// Verify output fields
assertSkillOutput(result, { data: expectedData });

// Verify performance
const result = await assertExecutionTime(
  () => skill.execute(input),
  5000 // max 5 seconds
);
```

### Test Runner

```typescript
import { SkillTestRunner } from "@agentik-os/sdk";

const runner = new SkillTestRunner(new MySkill());

runner.addCases([
  {
    name: "valid input",
    input: { query: "test" },
    expected: { success: true },
  },
  {
    name: "empty input",
    input: { query: "" },
    expected: { success: false, error: "required" },
  },
]);

const results = await runner.run();
console.log(`${results.passed}/${results.total} passed`);
```

## 2.5 Development Workflow

### Create a Skill

```bash
panda skill create my-skill \
  --description "My awesome skill" \
  --permissions network:http \
  --tags api,data
```

This generates:
- `index.ts` - Skill implementation
- `index.test.ts` - Test suite
- `skill.json` - Manifest
- `README.md` - Documentation
- `package.json` - Dependencies
- `tsconfig.json` - TypeScript config

### Hot-Reload Development

```bash
panda dev --test --verbose
```

Features:
- Watches .ts, .tsx, .json files
- Recompiles TypeScript on save
- Runs tests on source changes
- Shows compile errors inline

### Publishing

```bash
panda publish
```

Requirements:
- All tests pass
- Type-check clean (0 errors)
- skill.json valid
- README.md present

## Labs

### Lab 2.1: Create a Skill from Template

```bash
panda skill create weather-lookup \
  --description "Look up weather for any city" \
  --permissions network:http \
  --tags weather,api
```

### Lab 2.2: Implement Weather Lookup

Edit `index.ts` to:
1. Accept a city name as input
2. Call a weather API
3. Return formatted weather data
4. Handle errors gracefully

### Lab 2.3: Write Tests

Write tests covering:
- Valid city input returns weather data
- Empty city returns error
- Invalid city returns error
- Response includes temperature, conditions, humidity
- Execution completes within 5 seconds

### Lab 2.4: Publish to Marketplace

```bash
pnpm test              # Verify tests pass
panda publish          # Publish to marketplace
```

## Quiz Questions (Sample)

1. What class must all skills extend?
   - a) Plugin
   - b) SkillBase ✓
   - c) AgentSkill
   - d) BaseSkill

2. Which format is used for skill identifiers?
   - a) camelCase
   - b) PascalCase
   - c) kebab-case ✓
   - d) snake_case

3. What does `panda dev --test` do?
   - a) Deploys to production
   - b) Watches files and runs tests on changes ✓
   - c) Creates a test skill
   - d) Opens the test dashboard
