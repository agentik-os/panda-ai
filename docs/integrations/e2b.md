# E2B Integration

> Sandboxed code execution via the E2B MCP protocol.

## Overview

The E2B skill enables AI agents to execute code safely in isolated cloud sandboxes. Agents can run Python, JavaScript, Bash, and other languages without affecting the host system. Each sandbox is a fully isolated environment with its own filesystem and network.

## Installation

```bash
panda skill install @agentik-os/skill-e2b
```

## Configuration

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `apiKey` | string | Yes | - | E2B API key |
| `defaultTemplate` | string | No | `base` | Default sandbox template |
| `maxExecutionTime` | number | No | 30000 | Max execution time (ms) |

```yaml
# agent.yaml
skills:
  - id: e2b
    config:
      apiKey: ${E2B_API_KEY}
      defaultTemplate: python
      maxExecutionTime: 30000
```

## Actions

### `createSandbox`

Create a new isolated sandbox.

```typescript
const result = await agent.skill('e2b', {
  action: 'createSandbox',
  params: { template: 'python' }
});
// result.sandboxId => "sbx_abc123"
```

**Available templates:** `base`, `python`, `nodejs`, `go`, `rust`, `java`

### `runCode`

Execute code in a sandbox.

```typescript
const result = await agent.skill('e2b', {
  action: 'runCode',
  params: {
    sandboxId: 'sbx_abc123',
    code: 'import math\nprint(math.pi)',
    language: 'python'
  }
});
// result.data => { stdout: "3.141592653589793\n", stderr: "", exitCode: 0, executionTimeMs: 45 }
```

### `runCommand`

Execute a shell command.

```typescript
const result = await agent.skill('e2b', {
  action: 'runCommand',
  params: {
    sandboxId: 'sbx_abc123',
    command: 'ls -la /home'
  }
});
```

### `writeFile`

Write a file into the sandbox filesystem.

```typescript
await agent.skill('e2b', {
  action: 'writeFile',
  params: {
    sandboxId: 'sbx_abc123',
    path: '/home/user/script.py',
    content: 'print("Hello from file!")'
  }
});
```

### `readFile`

Read a file from the sandbox filesystem.

```typescript
const result = await agent.skill('e2b', {
  action: 'readFile',
  params: {
    sandboxId: 'sbx_abc123',
    path: '/home/user/output.txt'
  }
});
```

### `installPackages`

Install packages in the sandbox.

```typescript
await agent.skill('e2b', {
  action: 'installPackages',
  params: {
    sandboxId: 'sbx_abc123',
    packages: ['pandas', 'numpy', 'matplotlib'],
    language: 'python'
  }
});
```

### `closeSandbox`

Close and destroy a sandbox.

```typescript
await agent.skill('e2b', {
  action: 'closeSandbox',
  params: { sandboxId: 'sbx_abc123' }
});
```

## Permissions

| Permission | Description |
|------------|-------------|
| `network:https:api.e2b.dev` | API access |
| `api:e2b` | Service authorization |
| `kv:read:e2b:*` | Cache reads |
| `kv:write:e2b:*` | Cache writes |

## Use Cases

- **Code Execution**: Run user-provided code safely
- **Data Analysis**: Process datasets with Python/pandas
- **Prototyping**: Test code snippets in isolation
- **Build & Test**: Compile and run code in clean environments
- **Education**: Provide safe coding environments for learners

## Security

- Each sandbox is fully isolated (own filesystem, network, processes)
- Sandboxes auto-terminate after the configured timeout
- No access to host system or other sandboxes
- Network access can be restricted per sandbox

## Rate Limits

- 20 requests per minute per agent
- Maximum 5 concurrent sandboxes per entity
- Sandboxes auto-close after 5 minutes of inactivity
