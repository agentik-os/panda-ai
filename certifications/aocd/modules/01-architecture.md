# Module 1: Architecture & Core Concepts

## Learning Objectives

By the end of this module, you will be able to:
- Describe the Agentik OS architecture and component relationships
- Trace a message through the runtime pipeline
- Configure agents with multiple AI models
- Explain the role of channels, skills, and the Convex backend

## 1.1 Platform Architecture

### System Overview

```
                    ┌─────────────────────┐
                    │   Dashboard (Next.js)│
                    │   Port: 3000        │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   API Gateway        │
                    │   (Express/Hono)     │
                    └──────────┬──────────┘
                               │
         ┌─────────────────────┼─────────────────────┐
         │                     │                     │
┌────────▼────────┐  ┌────────▼────────┐  ┌────────▼────────┐
│  CLI Channel    │  │  API Channel    │  │ Telegram Channel│
│  (Commander.js) │  │  (REST/WS)     │  │  (Bot API)      │
└────────┬────────┘  └────────┬────────┘  └────────┬────────┘
         │                     │                     │
         └─────────────────────┼─────────────────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Runtime Engine     │
                    │   (Message Pipeline) │
                    ├─────────────────────┤
                    │  Middleware Chain    │
                    │  ├─ Auth            │
                    │  ├─ Rate Limit      │
                    │  ├─ Cost Track      │
                    │  └─ Logging         │
                    ├─────────────────────┤
                    │  Model Router       │
                    │  ├─ Claude          │
                    │  ├─ GPT             │
                    │  ├─ Gemini          │
                    │  └─ Ollama          │
                    ├─────────────────────┤
                    │  Skill Executor     │
                    │  (WASM Sandbox)     │
                    └──────────┬──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Convex Backend    │
                    │   (Real-time DB)    │
                    └─────────────────────┘
```

### Monorepo Structure

```
agentik-os/
├── packages/
│   ├── runtime/        # Core agent runtime (Bun + TypeScript)
│   ├── dashboard/      # Web UI (Next.js 16 + shadcn/ui)
│   ├── cli/            # CLI tool (panda ...)
│   ├── sdk/            # Skill builder SDK
│   └── shared/         # Shared types & utilities
├── skills/             # Official marketplace skills
├── convex/             # Backend schema & functions
└── tests/              # E2E & integration tests
```

## 1.2 Runtime Engine

### Message Pipeline

Every message flows through a pipeline of middleware:

1. **Channel Adapter** - Receives input (CLI, API, Telegram, etc.)
2. **Authentication** - Validates user identity and permissions
3. **Rate Limiting** - Enforces per-user/per-agent limits
4. **Cost Tracking** - Records token usage and costs
5. **Model Router** - Selects and calls the AI model
6. **Skill Executor** - Runs skills in sandboxed environment
7. **Response Formatter** - Formats output for the channel
8. **Logging** - Records conversation and metrics

### Agent Configuration

```typescript
interface AgentConfig {
  id: string;
  name: string;
  model: string;           // "claude-3-5-sonnet" | "gpt-4" | etc.
  systemPrompt: string;
  skills: string[];         // ["web-search", "file-ops"]
  channels: string[];       // ["cli", "api", "telegram"]
  memory: MemoryConfig;
  costLimits: CostConfig;
}
```

## 1.3 Multi-Model Router

The model router supports multiple AI providers:

| Provider | Models | Use Case |
|----------|--------|----------|
| Anthropic | Claude 3.5 Sonnet, Opus, Haiku | General purpose, coding |
| OpenAI | GPT-4, GPT-4 Mini | Diverse tasks |
| Google | Gemini Pro, Flash | Multi-modal |
| Ollama | Llama, Mistral, etc. | Local/private deployment |

### Routing Strategies

- **Direct**: Always use specified model
- **Fallback**: Try primary, fall back to secondary
- **Cost-Optimized**: Use cheapest model that meets quality threshold
- **Consensus**: Query multiple models, synthesize response

## 1.4 Channel Adapters

Each channel adapter translates between external protocols and the internal message format:

```typescript
interface ChannelAdapter {
  name: string;
  receive(raw: unknown): Message;
  send(message: Message): Promise<void>;
  formatResponse(response: AgentResponse): unknown;
}
```

## Labs

### Lab 1.1: Set Up Local Development

```bash
# Clone the repository
git clone https://github.com/agentik-os/agentik-os.git
cd agentik-os

# Install dependencies
pnpm install

# Start development
pnpm dev

# Run tests
pnpm test
```

### Lab 1.2: Trace a Message

Using the CLI, send a message and observe:
1. How the CLI channel adapter formats the input
2. How middleware processes the message
3. How the model router selects and calls the AI
4. How the response flows back through the pipeline

```bash
# Send a message with verbose logging
panda chat --verbose
```

### Lab 1.3: Configure a Multi-Model Agent

Create an agent that uses Claude for complex tasks and GPT-4 Mini for simple ones:

```bash
panda agent create "Smart Router Agent" \
  --model claude-3-5-sonnet \
  --description "Agent with intelligent model routing"
```

## Quiz Questions (Sample)

1. Which component is responsible for receiving messages from external services?
   - a) Runtime Engine
   - b) Channel Adapter ✓
   - c) Skill Executor
   - d) Model Router

2. What is the correct order of middleware in the pipeline?
   - a) Auth → Rate Limit → Cost Track → Model Router ✓
   - b) Model Router → Auth → Rate Limit → Cost Track
   - c) Cost Track → Auth → Rate Limit → Model Router
   - d) Rate Limit → Auth → Model Router → Cost Track

3. Which database does Agentik OS use for real-time data?
   - a) PostgreSQL
   - b) MongoDB
   - c) Convex ✓
   - d) Redis
