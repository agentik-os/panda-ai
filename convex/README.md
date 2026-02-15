# Convex Backend

Real-time backend infrastructure for Agentik OS.

## 📁 Directory Structure

```
convex/
├── schema.ts              # Database schema (agents, conversations, costs)
├── queries/               # Data retrieval functions
│   ├── agents.ts          # Agent queries (list, get, stats, search)
│   ├── conversations.ts   # Conversation queries (list, get, session, recent)
│   └── costs.ts           # Cost queries (summary, byAgent, byModel, history)
├── mutations/             # Data modification functions
│   ├── agents.ts          # Agent CRUD (create, update, remove, updateStats)
│   ├── conversations.ts   # Conversation CRUD (create, remove, update)
│   └── costs.ts           # Cost tracking (create, cleanup)
└── actions/               # External API calls
    └── external.ts        # AI model calls, webhooks, skill execution
```

## 🚀 Setup Instructions

### 1. Initialize Convex (Interactive - Requires Terminal Access)

```bash
npx convex dev
```

This will:
- Prompt you to login to Convex
- Create a new project (or link to existing)
- Generate `_generated/` directory with type-safe client code
- Start the development server

### 2. After Initialization

The `_generated/` directory will be created with:
- Type-safe function definitions
- Database client
- Server utilities

### 3. Environment Variables

Add to `.env.local`:
```
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

## 📊 Database Schema

### Agents Table
Stores AI agent configurations.

**Fields:**
- `name`, `description`, `systemPrompt`
- `model`, `provider`, `temperature`, `maxTokens`
- `channels[]`, `skills[]`
- `status`, timestamps, usage stats

**Indexes:**
- by_status
- by_created
- by_last_active

### Conversations Table
Stores message history.

**Fields:**
- `agentId`, `channel`, `sessionId`
- `role`, `content`, `timestamp`
- `model`, `tokensUsed`, `cost`
- `attachments[]`, `skillsUsed[]`
- `responseTime`, `error`

**Indexes:**
- by_agent
- by_timestamp
- by_session
- by_agent_and_session
- by_channel

### Costs Table
Tracks usage and spending.

**Fields:**
- `agentId`, `conversationId`
- `model`, `provider`
- Token counts (input, output, total)
- Cost breakdown (input, output, total)
- `timestamp`, `responseTime`
- `channel`, `endpoint`

**Indexes:**
- by_agent
- by_timestamp
- by_model
- by_provider
- by_agent_and_timestamp

## 🔍 Query Examples

### List Active Agents
```typescript
const agents = await ctx.query(api.queries.agents.list, {
  status: "active",
  limit: 10,
});
```

### Get Conversation Session
```typescript
const messages = await ctx.query(api.queries.conversations.getSession, {
  agentId: "...",
  sessionId: "session-123",
});
```

### Get Cost Summary
```typescript
const summary = await ctx.query(api.queries.costs.summary);
// Returns: { today, month, total, modelBreakdown }
```

## ✏️ Mutation Examples

### Create Agent
```typescript
const agentId = await ctx.mutation(api.mutations.agents.create, {
  name: "Customer Support Bot",
  description: "Handles customer inquiries",
  systemPrompt: "You are a helpful customer support agent.",
  model: "claude-opus-4",
  provider: "anthropic",
  channels: ["dashboard", "api"],
  skills: ["web-search", "knowledge-base"],
});
```

### Track Cost
```typescript
await ctx.mutation(api.mutations.costs.create, {
  agentId,
  model: "claude-opus-4",
  provider: "anthropic",
  inputTokens: 100,
  outputTokens: 200,
  totalTokens: 300,
  inputCost: 0.0015,
  outputCost: 0.003,
  totalCost: 0.0045,
  channel: "dashboard",
});
```

## 🔄 Real-Time Subscriptions

Convex provides automatic real-time updates:

```typescript
// In React component
const agents = useQuery(api.queries.agents.list);
// Automatically re-renders when agents change
```

## 🛠️ Development Workflow

1. **Modify schema** → `convex/schema.ts`
2. **Run** → `npx convex dev` (watches for changes)
3. **Types auto-generated** → `convex/_generated/`
4. **Use in app** → Import from `convex/_generated/api`

## 📝 Notes

- **Status:** Structure complete, awaiting `npx convex dev` initialization
- **Next Steps:**
  1. Run `npx convex dev` interactively to deploy schema
  2. Integrate with dashboard (Step-044)
  3. Connect to runtime message pipeline

## 📚 Resources

- [Convex Docs](https://docs.convex.dev/)
- [Real-time Subscriptions](https://docs.convex.dev/client/react)
- [Schema Design](https://docs.convex.dev/database/schemas)
