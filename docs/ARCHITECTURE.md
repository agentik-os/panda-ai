# AGENTIK OS - Architecture Blueprint

---

## System Overview

```
                          USERS
                    ______|______
                   |      |      |
               Telegram Discord  Web    CLI    Slack   WhatsApp
                   |      |      |       |      |        |
                   +------+------+-------+------+--------+
                                 |
                         [CHANNEL BRIDGE]
                      Unified message format
                                 |
                         [AGENT ROUTER]
                    Which agent handles this?
                                 |
                    +------------+------------+
                    |            |            |
               [Agent A]   [Agent B]   [Agent C]
               "Nova"      "Ralph"     "Sentinel"
                    |            |            |
                    +------------+------------+
                                 |
                         [MODEL ROUTER]
                    Which model? What budget?
                                 |
              +--------+---------+---------+--------+
              |        |         |         |        |
           Claude    GPT-5    Gemini    Ollama   Custom
              |        |         |         |        |
              +--------+---------+---------+--------+
                                 |
                          [TOOL LAYER]
                         MCP Servers
                                 |
              +--------+---------+---------+--------+
              |        |         |         |        |
           GitHub    Gmail    Notion    Stripe   Custom
```

---

## Monorepo Structure

```
agentik-os/
├── packages/
│   ├── runtime/              # Core agent runtime (Bun + TypeScript)
│   │   ├── src/
│   │   │   ├── agents/       # Agent lifecycle management
│   │   │   ├── channels/     # Channel adapters (telegram, discord, web, etc.)
│   │   │   ├── models/       # Model providers + smart router
│   │   │   ├── memory/       # Memory layers (short, session, long-term, shared)
│   │   │   ├── mcp/          # MCP client + server management
│   │   │   ├── skills/       # Skill loader + registry
│   │   │   ├── scheduler/    # Cron + event triggers
│   │   │   ├── functions/    # Webhook handlers
│   │   │   └── core/         # Message processing pipeline
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── dashboard/            # Web dashboard (Next.js 16 + shadcn/ui)
│   │   ├── app/
│   │   │   ├── (auth)/       # Login, signup
│   │   │   ├── agents/       # Agent management pages
│   │   │   ├── channels/     # Channel configuration
│   │   │   ├── skills/       # Skill store + management
│   │   │   ├── mcp/          # MCP hub
│   │   │   ├── memory/       # Memory explorer
│   │   │   ├── costs/        # Cost tracking + budgets
│   │   │   ├── scheduler/    # Cron job management
│   │   │   ├── logs/         # Activity logs + audit trail
│   │   │   └── settings/     # System settings
│   │   ├── components/       # Shared UI components
│   │   ├── Dockerfile
│   │   └── package.json
│   │
│   ├── cli/                  # CLI tool (panda ...)
│   │   ├── src/
│   │   │   ├── commands/     # agent, skill, mcp, config, etc.
│   │   │   └── tui/          # Interactive TUI chat
│   │   └── package.json
│   │
│   ├── sdk/                  # SDK for building skills + extensions
│   │   ├── src/
│   │   │   ├── skill.ts      # Skill base class
│   │   │   ├── agent.ts      # Agent API client
│   │   │   ├── mcp.ts        # MCP helpers
│   │   │   └── types.ts      # Shared types
│   │   └── package.json
│   │
│   └── shared/               # Shared types + utils
│       ├── src/
│       │   ├── types/        # Message, Agent, Skill, etc.
│       │   ├── schema/       # Zod schemas
│       │   └── utils/        # Common utilities
│       └── package.json
│
├── skills/                   # Built-in skills (ships with Agentik OS)
│   ├── research-assistant/
│   ├── code-reviewer/
│   ├── email-manager/
│   ├── daily-briefing/
│   └── project-tracker/
│
├── convex/                   # Convex backend (schema, queries, mutations)
│   ├── schema.ts             # Database schema
│   ├── conversations.ts      # Conversation queries/mutations
│   ├── agents.ts             # Agent queries/mutations
│   ├── costEvents.ts         # Cost tracking
│   └── memories.ts           # Memory storage with vector search
│
├── docker/
│   ├── docker-compose.yml    # Full stack
│   ├── docker-compose.dev.yml
│   └── Dockerfile.runtime
│
├── installer/
│   ├── install.sh            # curl -sL get.agentik-os.dev | sh
│   └── setup-wizard.ts       # Interactive setup
│
├── docs/                     # Documentation
│   ├── getting-started.md
│   ├── architecture.md
│   ├── skills-guide.md
│   ├── mcp-guide.md
│   └── api-reference.md
│
├── website/                  # Landing page (agentik-os.dev)
│
├── bun.lockb
├── package.json              # Workspace root
├── turbo.json                # Turborepo config
├── LICENSE                   # MIT
└── README.md
```

---

## Core Runtime Architecture

### Message Pipeline

```typescript
// Simplified message flow

interface PandaMessage {
  id: string;
  channel: "telegram" | "discord" | "web" | "cli" | "slack" | "api";
  channelMessageId: string;
  userId: string;
  agentId: string;
  content: string;
  attachments?: Attachment[];
  metadata: Record<string, unknown>;
  timestamp: Date;
}

// Pipeline stages
async function processMessage(msg: PandaMessage) {
  // 1. Channel Bridge - normalize message format
  const normalized = await channelBridge.normalize(msg);

  // 2. Agent Router - which agent handles this?
  const agent = await agentRouter.route(normalized);

  // 3. Memory Load - inject relevant context
  const context = await memory.getContext(agent, normalized);

  // 4. Model Router - pick the right model
  const model = await modelRouter.select(agent, normalized);

  // 5. Tool Resolution - which MCP tools available?
  const tools = await mcpManager.getTools(agent);

  // 6. Agent Loop - think + act
  const response = await agentLoop.run({
    message: normalized,
    agent,
    context,
    model,
    tools,
  });

  // 7. Memory Save - store conversation + insights
  await memory.save(agent, normalized, response);

  // 8. Cost Track - log usage
  await costTracker.log(agent, model, response.usage);

  // 9. Channel Bridge - send response back
  await channelBridge.send(msg.channel, response);
}
```

### Model Router

```typescript
interface ModelConfig {
  provider: "anthropic" | "openai" | "google" | "ollama" | "custom";
  model: string;
  costPer1kInput: number;
  costPer1kOutput: number;
  maxTokens: number;
  capabilities: ("vision" | "tools" | "streaming" | "long-context")[];
}

interface RoutingRule {
  condition: "simple" | "medium" | "complex" | "vision" | "code";
  model: ModelConfig;
  fallbacks: ModelConfig[];
}

// Smart routing logic
function routeToModel(message: PandaMessage, agent: Agent): ModelConfig {
  // 1. Check agent-specific model override
  if (agent.model) return agent.model;

  // 2. Score message complexity
  const complexity = scoreComplexity(message);

  // 3. Check budget remaining
  const budget = getBudgetRemaining(agent);

  // 4. Route to cheapest capable model
  const candidates = getModelsForComplexity(complexity);
  const affordable = candidates.filter(m => m.costPer1kInput < budget);
  const available = affordable.filter(m => !isRateLimited(m));

  return available[0] ?? getFallback();
}
```

### Memory Architecture

```typescript
// Three-tier memory with vector search

interface MemoryManager {
  // Short-term: current conversation
  shortTerm: Map<string, ConversationTurn[]>;

  // Session: full conversation history
  session: {
    save(agentId: string, turn: ConversationTurn): Promise<void>;
    getHistory(agentId: string, limit: number): Promise<ConversationTurn[]>;
  };

  // Long-term: searchable knowledge
  longTerm: {
    store(fact: Fact): Promise<void>;
    search(query: string, limit: number): Promise<Fact[]>;
    forget(factId: string): Promise<void>;
  };

  // Structured: preferences, relationships
  structured: {
    set(key: string, value: unknown): Promise<void>;
    get(key: string): Promise<unknown>;
  };

  // Shared: cross-agent knowledge
  shared: {
    publish(agentId: string, knowledge: Knowledge): Promise<void>;
    subscribe(agentId: string, topics: string[]): Promise<Knowledge[]>;
  };

  // Context builder: assemble context for agent
  getContext(agent: Agent, message: PandaMessage): Promise<string>;
}
```

---

## Convex Backend

**All data storage powered by Convex with real-time reactivity and serverless functions.**

### Schema Definition

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Conversations - stores all agent interactions
  conversations: defineTable({
    agentId: v.string(),
    userId: v.optional(v.string()),
    messages: v.array(v.object({
      id: v.string(),
      role: v.string(),
      content: v.string(),
      model: v.optional(v.string()),
      timestamp: v.number(),
      metadata: v.optional(v.any())
    })),
    createdAt: v.number(),
    updatedAt: v.number()
  }).index("by_agent", ["agentId"])
    .index("by_user", ["userId"]),

  // Agents - configured AI assistants
  agents: defineTable({
    name: v.string(),
    personality: v.string(),
    skills: v.array(v.string()),
    channels: v.array(v.string()),
    config: v.object({
      defaultModel: v.optional(v.string()),
      temperature: v.optional(v.number()),
      maxTokens: v.optional(v.number())
    }),
    createdAt: v.number()
  }).index("by_name", ["name"]),

  // Cost Events - real-time cost tracking
  costEvents: defineTable({
    agentId: v.string(),
    conversationId: v.string(),
    model: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    cost: v.number(),
    timestamp: v.number()
  }).index("by_agent_time", ["agentId", "timestamp"])
    .index("by_conversation", ["conversationId"]),

  // Memories - long-term memory with vector search
  memories: defineTable({
    agentId: v.string(),
    content: v.string(),
    embedding: v.array(v.float64()),
    importance: v.number(),
    accessCount: v.number(),
    lastAccessed: v.number(),
    createdAt: v.number()
  }).index("by_agent", ["agentId"])
    .vectorIndex("by_embedding", {
      vectorField: "embedding",
      dimensions: 1536,
      filterFields: ["agentId"]
    }),

  // Skills - installed skills/MCP servers
  skills: defineTable({
    name: v.string(),
    version: v.string(),
    manifest: v.any(),
    installedAt: v.number()
  }).index("by_name", ["name"]),

  // Cron Jobs - scheduled tasks
  cronJobs: defineTable({
    agentId: v.string(),
    schedule: v.string(),
    task: v.string(),
    enabled: v.boolean(),
    lastRun: v.optional(v.number()),
    nextRun: v.number(),
    createdAt: v.number()
  }).index("by_agent", ["agentId"])
    .index("by_next_run", ["nextRun"])
});
```

### Query Example

```typescript
// convex/conversations.ts
import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Get messages for an agent (reactive!)
export const getMessages = query({
  args: { agentId: v.string() },
  handler: async (ctx, { agentId }) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .order("desc")
      .take(100);

    return conversations.flatMap(c => c.messages);
  }
});

// Save a new message
export const saveMessage = mutation({
  args: {
    agentId: v.string(),
    message: v.object({
      role: v.string(),
      content: v.string(),
      model: v.optional(v.string())
    })
  },
  handler: async (ctx, { agentId, message }) => {
    // Get or create conversation
    const existing = await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", agentId))
      .first();

    if (existing) {
      await ctx.db.patch(existing._id, {
        messages: [...existing.messages, {
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        }],
        updatedAt: Date.now()
      });
    } else {
      await ctx.db.insert("conversations", {
        agentId,
        messages: [{
          ...message,
          id: crypto.randomUUID(),
          timestamp: Date.now()
        }],
        createdAt: Date.now(),
        updatedAt: Date.now()
      });
    }
  }
});
```

### Frontend Integration (Real-time!)

```typescript
// packages/dashboard/lib/convex.ts
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";

export function ChatInterface({ agentId }: { agentId: string }) {
  // Reactive query - updates automatically when data changes!
  const messages = useQuery(api.conversations.getMessages, { agentId });
  const sendMessage = useMutation(api.conversations.saveMessage);

  // When you call sendMessage, the UI updates instantly via optimistic updates
  // Then Convex syncs to all clients in <100ms
}
```

### Why Convex?

| Feature | Benefit |
|---------|---------|
| **Local dev** | `npx convex dev` works offline, zero config |
| **Real-time** | Reactive queries update UI automatically |
| **TypeScript** | End-to-end type safety from DB to UI |
| **Serverless** | Zero ops, auto-scales, global edge |
| **Vector search** | Native embeddings support for memory |
| **File storage** | Built-in file uploads (avatars, docs) |
| **Scheduled functions** | Native cron jobs for Agent Dreams |

---

## Channel Adapters

```typescript
interface ChannelAdapter {
  name: string;
  connect(config: ChannelConfig): Promise<void>;
  disconnect(): Promise<void>;
  onMessage(handler: (msg: RawMessage) => void): void;
  send(to: string, content: ResponseContent): Promise<void>;
  sendFile(to: string, file: Buffer, caption?: string): Promise<void>;
}

// Example: Telegram adapter
class TelegramChannel implements ChannelAdapter {
  name = "telegram";
  private bot: Bot; // grammY

  async connect(config: { token: string }) {
    this.bot = new Bot(config.token);
    await this.bot.start();
  }

  onMessage(handler) {
    this.bot.on("message:text", (ctx) => {
      handler({
        channel: "telegram",
        userId: String(ctx.from.id),
        content: ctx.message.text,
        raw: ctx,
      });
    });
  }

  async send(chatId: string, content: ResponseContent) {
    await this.bot.api.sendMessage(chatId, content.text, {
      parse_mode: "Markdown",
    });
  }
}
```

---

## Security Model

### Skill Sandboxing

```
+----------------------------------------------------+
|  PANDA RUNTIME (host)                               |
|                                                      |
|  Agent Process                                       |
|    |                                                 |
|    +-- Built-in tools (memory, channels) ✅ Direct  |
|    |                                                 |
|    +-- MCP Servers ✅ Stdio (subprocess)             |
|    |                                                 |
|    +-- Skills ⚠️ Docker sandbox                      |
|         |                                            |
|         +-- [Docker Container]                       |
|         |    - No network by default                 |
|         |    - No filesystem access                  |
|         |    - Only declared permissions              |
|         |    - Resource limits (CPU, RAM, time)       |
|         |    - Stdout/stdin communication             |
|         +------------------------------------------- |
+----------------------------------------------------+
```

### Permission Model

```yaml
# Each skill/MCP server declares permissions
permissions:
  network:
    - "api.github.com"     # Only this domain
    - "*.openai.com"       # Wildcard
  filesystem:
    - read: "/tmp/panda-*" # Read only in specific paths
  mcp:
    - "github"             # Can use GitHub MCP
    - "notion"             # Can use Notion MCP
  budget:
    max_per_run: "$0.50"   # Cost limit per invocation
```

---

## Dashboard Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Overview: agents, activity, costs |
| Agents | `/agents` | List, create, configure agents |
| Agent Detail | `/agents/[id]` | Conversations, settings, personality |
| Channels | `/channels` | Connect/configure channels |
| Skills | `/skills` | Browse skill store, manage installed |
| MCP Hub | `/mcp` | Browse, install, configure MCP servers |
| Memory | `/memory` | Search, explore, manage agent memory |
| Costs | `/costs` | Usage breakdown, budgets, model comparison |
| Scheduler | `/scheduler` | Cron jobs, webhooks, event triggers |
| Logs | `/logs` | Activity log, audit trail |
| Settings | `/settings` | System config, API keys, users |

---

## API Design

```
GET    /api/agents                    # List agents
POST   /api/agents                    # Create agent
GET    /api/agents/:id                # Get agent
PATCH  /api/agents/:id                # Update agent
DELETE /api/agents/:id                # Delete agent

GET    /api/agents/:id/conversations  # List conversations
GET    /api/agents/:id/memory         # Search memory
POST   /api/agents/:id/message        # Send message to agent

GET    /api/skills                    # List installed skills
POST   /api/skills/install            # Install skill
DELETE /api/skills/:id                # Uninstall skill
GET    /api/skills/store              # Browse skill store

GET    /api/mcp                       # List MCP servers
POST   /api/mcp                       # Add MCP server
DELETE /api/mcp/:id                   # Remove MCP server

GET    /api/costs                     # Cost report
GET    /api/costs/budget              # Budget status

GET    /api/cron                      # List cron jobs
POST   /api/cron                      # Create cron job
PATCH  /api/cron/:id                  # Update cron job
DELETE /api/cron/:id                  # Delete cron job

GET    /api/logs                      # Activity logs

WS     /api/ws                        # Real-time updates
```

---

*Created: 2026-02-13*
*Status: ARCHITECTURE DRAFT*

---

## Project Creator Agent Architecture

### Overview

The **Project Creator Agent** is a specialized orchestrator agent that coordinates the entire project creation workflow from initial idea to deployed MVP.

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                   USER INPUT                                 │
│           "Build a SaaS for freelancers..."                  │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────────────┐
│              PROJECT CREATOR AGENT (Opus 4.6)               │
│                   State Machine Orchestrator                 │
└──────────────────────┬──────────────────────────────────────┘
                       │
       ┌───────────────┼───────────────┐
       │               │               │
       ▼               ▼               ▼
┌──────────┐    ┌──────────┐    ┌──────────┐
│Discovery │───→│ Branding │───→│   PRD    │
│ Phase    │    │  Phase   │    │ Phase    │
└──────────┘    └──────────┘    └──────────┘
                                      │
                                      ▼
                              ┌────────────┐
                              │   Stack    │
                              │ Selection  │
                              └──────┬─────┘
                                     │
                                     ▼
┌─────────────────────────────────────────────────────────────┐
│                    TEAM SPAWNING PHASE                       │
│                                                              │
│  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌─────────┐ │
│  │ Guardian  │  │ Frontend  │  │ Backend   │  │Designer │ │
│  │(Opus 4.6) │  │   Lead    │  │   Lead    │  │(opus) │ │
│  │           │  │ (opus)  │  │ (opus)  │  │         │ │
│  └─────┬─────┘  └─────┬─────┘  └─────┬─────┘  └────┬────┘ │
│        │              │              │              │      │
│        │  ┌───────────┴──────────────┴──────────────┘      │
│        │  │         PARALLEL EXECUTION                     │
│        │  │                                                 │
│        ▼  ▼                                                 │
│  ┌─────────────┐                                           │
│  │   QA Eng    │                                           │
│  │  (Sonnet)   │                                           │
│  └──────┬──────┘                                           │
└─────────┼────────────────────────────────────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     QA PHASE (MANIAC)                        │
│  - Comprehensive testing                                     │
│  - Accessibility audit                                       │
│  - Performance validation                                    │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
               ┌──────────────┐
               │  Iteration?  │
               └───┬──────┬───┘
                   │      │
              Failed│     │Passed
                   │      │
                   ▼      ▼
           ┌────────┐  ┌──────────┐
           │  Fix   │  │ Deploy   │
           │ Issues │  │  Phase   │
           └───┬────┘  └─────┬────┘
               │             │
               └──────┬──────┘
                      │
                      ▼
              ┌────────────────┐
              │ WORKING MVP    │
              │   DEPLOYED     │
              └────────────────┘
```

### Component Breakdown

#### 1. Project Creator Agent Core

**Location:** `packages/agents/project-creator/index.ts`

**Responsibilities:**
- Workflow orchestration (state machine)
- User communication & approval gates
- Progress tracking & cost monitoring
- Error handling & recovery

**State Machine:**
```typescript
type WorkflowState =
  | 'DISCOVERY'
  | 'BRANDING'
  | 'PRD'
  | 'STACK'
  | 'TEAM_SPAWNING'
  | 'BUILDING'
  | 'QA'
  | 'ITERATION'
  | 'DEPLOYMENT'
  | 'HANDOFF'
  | 'COMPLETE';

interface StateMachine {
  currentState: WorkflowState;
  transitionTo(newState: WorkflowState): void;
  canTransition(from: WorkflowState, to: WorkflowState): boolean;
  onStateEnter(state: WorkflowState): Promise<void>;
  onStateExit(state: WorkflowState): Promise<void>;
}
```

#### 2. Phase Implementations

Each phase is a separate module with clear inputs/outputs:

| Phase | Input | Output | Duration |
|-------|-------|--------|----------|
| **Discovery** | User prompt | `PROJECT_DISCOVERY.json` | 5-10 min |
| **Branding** | Discovery | `BRANDING.json` | 5 min |
| **PRD** | Discovery + Branding | `PRD.md` | 10 min |
| **Stack** | PRD | `STACK_SELECTION.json` | 2 min |
| **Team** | PRD + Stack | Spawned agents | 2 min |
| **Building** | Team | Codebase | 2-8 hours |
| **QA** | Codebase | `QA_REPORT.json` | 30 min |
| **Deploy** | Codebase | Deployment URL | 5 min |

#### 3. Team Coordination Layer

**Location:** `packages/agents/project-creator/coordination/`

**Components:**
- `team-spawner.ts` - Spawns and initializes AI agents
- `guardian.ts` - Quality gate agent (Opus)
- `task-distributor.ts` - Assigns tasks based on PRD
- `progress-monitor.ts` - Tracks team progress
- `blocker-resolver.ts` - Handles agent blockers

**Communication Protocol:**
```typescript
interface AgentMessage {
  from: AgentId;
  to: AgentId;
  type: MessageType;
  payload: any;
  timestamp: number;
}

type MessageType =
  | 'TASK_ASSIGNED'
  | 'TASK_COMPLETED'
  | 'BLOCKER_ENCOUNTERED'
  | 'REVIEW_REQUEST'
  | 'REVIEW_FEEDBACK'
  | 'COLLABORATION_NEEDED';
```

#### 4. Integration Points

**With Agentik OS Core:**

| System | Integration Point | Purpose |
|--------|------------------|---------|
| **Multi-Model Router** | All agents | Cost optimization |
| **Cost X-Ray** | All phases | Real-time cost tracking |
| **Agent Spawning** | Team phase | Create sub-agents |
| **Dashboard** | All phases | Live progress UI |
| **MCP Skills** | Building phase | Access to tools |
| **FORGE** | Installation | GitHub-based FORGE integration |
| **MANIAC** | QA phase | Comprehensive testing |

### Data Flow

```
User Input
    ↓
Discovery Questions ──→ PROJECT_DISCOVERY.json
    ↓
Branding Generation ──→ BRANDING.json
    ↓
PRD Generation ──→ PRD.md (3500+ words)
    ↓
Stack Analysis ──→ STACK_SELECTION.json
    ↓
Team Spawning ──→ 5 AI Agents
    ↓
Parallel Building ──→ Codebase (80+ files)
    ↓
Quality Assurance ──→ QA_REPORT.json
    ↓
Deployment ──→ Working MVP URL
    ↓
Handoff Package ──→ Docs + Code + Cost Report
```

### File Structure

```
packages/agents/project-creator/
├── index.ts                          # Main agent
├── state-machine.ts                  # Workflow orchestration
├── types.ts                          # TypeScript types
│
├── phases/                           # Each phase is isolated
│   ├── discovery.ts                  # Discovery phase
│   ├── branding.ts                   # Branding phase
│   ├── prd.ts                        # PRD generation
│   ├── stack.ts                      # Stack selection
│   ├── team.ts                       # Team spawning
│   ├── qa.ts                         # QA orchestration
│   └── deploy.ts                     # Deployment
│
├── coordination/                     # Team coordination
│   ├── team-spawner.ts               # Spawn agents
│   ├── guardian.ts                   # Guardian agent
│   ├── task-distributor.ts           # Task assignment
│   ├── progress-monitor.ts           # Progress tracking
│   └── blocker-resolver.ts           # Handle blockers
│
├── templates/                        # Project templates
│   ├── prd-template.md               # PRD template
│   ├── color-palettes.ts             # Color palette library
│   ├── stack-configs/                # Stack configurations
│   │   ├── nextjs-convex.json
│   │   ├── nextjs-supabase.json
│   │   └── react-firebase.json
│   └── project-templates/            # Full project templates
│       ├── saas/
│       ├── ecommerce/
│       ├── blog/
│       ├── api/
│       └── chrome-extension/
│
├── prompts/                          # System prompts
│   ├── discovery-questions.md
│   ├── branding-prompt.md
│   ├── prd-prompt.md
│   └── stack-selection-prompt.md
│
├── qa/                               # QA integration
│   └── maniac-integration.ts         # MANIAC integration
│
├── handoff/                          # Handoff package
│   └── package-generator.ts          # Generate docs + cost report
│
└── tests/                            # Tests
    ├── unit/
    ├── integration/
    └── e2e/
        ├── full-workflow.test.ts
        ├── approval-gates.test.ts
        └── team-coordination.test.ts
```

### Cost Optimization Strategies

**Model Selection:**
```typescript
const modelStrategy = {
  discovery: 'sonnet-4.5',          // $0.05-0.15
  branding: 'sonnet-4.5',           // $0.10-0.20
  prd: 'sonnet-4.5',                // $0.30-0.60
  stack: 'haiku',                   // $0.05-0.10
  guardian: 'opus-4.6',             // $1.00-3.00 (quality critical)
  frontendLead: 'sonnet-4.5',       // $0.50-1.50
  backendLead: 'sonnet-4.5',        // $0.50-1.50
  designer: 'sonnet-4.5',           // $0.30-0.80
  qaEngineer: 'sonnet-4.5',         // $0.40-1.00
  qa: 'sonnet-4.5',                 // $0.20-0.50
  deployment: 'haiku'               // $0.10-0.20
};
```

**Caching:**
- Reusable component templates (shadcn/ui setup)
- Common auth flows (Clerk integration)
- Standard API patterns (CRUD operations)

**Parallel Execution:**
- Frontend + Backend + Designer work simultaneously
- Reduces wall-clock time from ~8h to ~3h

### Scalability Considerations

**Concurrent Projects:**
```typescript
interface ConcurrentProjects {
  maxConcurrent: number;          // 10 projects at once
  queueing: 'fifo' | 'priority';  // Priority for Pro users
  resourceAllocation: {
    cpuPerProject: number;        // CPU cores
    memoryPerProject: number;     // RAM in GB
    budgetPerProject: number;     // AI cost limit
  };
}
```

**Resource Pooling:**
- Shared component library
- Shared template cache
- Shared Guardian agent (reviews for all projects)

---
