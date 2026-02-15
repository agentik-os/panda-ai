# Convex Schema Reference

> **Complete database schema reference for Agentik OS**

Understand the data model, tables, indexes, and relationships in Agentik OS's Convex backend.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Schema Overview](#schema-overview)
3. [Core Tables](#core-tables)
4. [Channel Tables](#channel-tables)
5. [Skills Tables](#skills-tables)
6. [Cost Tracking Tables](#cost-tracking-tables)
7. [Indexes](#indexes)
8. [Relationships](#relationships)
9. [Querying Data](#querying-data)
10. [Schema Migrations](#schema-migrations)

---

## Introduction

Agentik OS uses **Convex** as its backend database. Convex provides:

- **Real-time subscriptions** - Automatic UI updates
- **Type-safe queries** - Full TypeScript support
- **ACID transactions** - Guaranteed consistency
- **Automatic scaling** - No manual configuration
- **Event sourcing** - Built-in audit trail

### Schema File

The complete schema is defined in:

```
packages/backend/convex/schema.ts
```

---

## Schema Overview

### Entity-Relationship Diagram

```
┌─────────────┐
│   Tenants   │
└──────┬──────┘
       │
       ├──────────┐
       │          │
       ▼          ▼
┌─────────┐  ┌──────────┐
│  Agents │  │  Users   │
└────┬────┘  └──────────┘
     │
     ├─────────┬──────────┬────────────┐
     ▼         ▼          ▼            ▼
┌──────────┐ ┌────────┐ ┌──────────┐ ┌──────────┐
│ Sessions │ │ Skills │ │  Events  │ │  Costs   │
└────┬─────┘ └────────┘ └──────────┘ └──────────┘
     │
     ▼
┌──────────┐
│ Messages │
└──────────┘
```

---

## Core Tables

### `tenants`

Multi-tenant organization data.

**Schema:**

```typescript
tenants: defineTable({
  // Identity
  name: v.string(),
  slug: v.string(), // URL-safe identifier
  status: v.string(), // "active" | "trial" | "suspended" | "deleted"

  // Plan & Quotas
  plan: v.string(), // "starter" | "pro" | "enterprise"
  maxAgents: v.number(),
  maxMonthlyTokens: v.number(),
  maxStorageGB: v.number(),

  // Billing
  monthlyBudget: v.optional(v.number()),
  billingEmail: v.string(),
  stripeCustomerId: v.optional(v.string()),

  // Metadata
  createdAt: v.number(),
  updatedAt: v.number(),
  deletedAt: v.optional(v.number()),
})
  .index("by_slug", ["slug"])
  .index("by_status", ["status"])
  .index("by_stripe_customer", ["stripeCustomerId"])
```

**Example:**

```json
{
  "_id": "ten_abc123",
  "name": "Acme Corporation",
  "slug": "acme-corp",
  "status": "active",
  "plan": "pro",
  "maxAgents": 100,
  "maxMonthlyTokens": 50000000,
  "maxStorageGB": 100,
  "monthlyBudget": 1000,
  "billingEmail": "billing@acme.com",
  "stripeCustomerId": "cus_xxxxx",
  "createdAt": 1707926400,
  "updatedAt": 1707926400
}
```

---

### `agents`

AI agent configurations.

**Schema:**

```typescript
agents: defineTable({
  // Tenant relationship
  tenantId: v.id("tenants"),

  // Identity
  name: v.string(),
  description: v.optional(v.string()),
  status: v.string(), // "active" | "paused" | "archived"

  // Model configuration
  model: v.string(), // "claude-opus-4-6" | "claude-sonnet-4-5" | ...
  systemPrompt: v.string(),
  temperature: v.number(), // 0.0 - 1.0
  maxTokens: v.number(),

  // OS Mode
  mode: v.string(), // "focus" | "creative" | "research" | custom mode ID

  // Skills
  skills: v.array(v.string()), // Array of skill IDs

  // Budget & Limits
  maxCostPerMessage: v.optional(v.number()),
  monthlyBudget: v.optional(v.number()),

  // Consensus (multi-model)
  consensusEnabled: v.boolean(),
  consensusModels: v.optional(v.array(v.string())),
  consensusStrategy: v.optional(v.string()), // "majority" | "unanimous" | "weighted"

  // Metadata
  metadata: v.optional(v.object({})), // Custom key-value pairs
  createdBy: v.id("users"),
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_tenant_and_status", ["tenantId", "status"])
  .index("by_created_by", ["createdBy"])
  .index("by_model", ["model"])
```

**Example:**

```json
{
  "_id": "agent_abc123",
  "tenantId": "ten_abc123",
  "name": "Customer Support Bot",
  "description": "Handles customer inquiries 24/7",
  "status": "active",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are a helpful customer support agent...",
  "temperature": 0.7,
  "maxTokens": 4096,
  "mode": "focus",
  "skills": ["skill_web_search", "skill_file_ops"],
  "maxCostPerMessage": 0.10,
  "consensusEnabled": false,
  "metadata": {
    "department": "support",
    "priority": "high"
  },
  "createdBy": "user_xyz789",
  "createdAt": 1707926400,
  "updatedAt": 1707930000
}
```

---

### `sessions`

Conversation sessions between users and agents.

**Schema:**

```typescript
sessions: defineTable({
  // Relationships
  tenantId: v.id("tenants"),
  agentId: v.id("agents"),
  userId: v.optional(v.id("users")), // Can be anonymous

  // Status
  status: v.string(), // "active" | "completed" | "abandoned"

  // Metadata
  metadata: v.optional(v.object({})),
  source: v.optional(v.string()), // "web-chat" | "telegram" | "api"

  // Statistics
  messageCount: v.number(),
  totalCost: v.number(),
  totalTokens: v.number(),

  // Timestamps
  createdAt: v.number(),
  lastActivityAt: v.number(),
  completedAt: v.optional(v.number()),
})
  .index("by_tenant", ["tenantId"])
  .index("by_agent", ["agentId"])
  .index("by_user", ["userId"])
  .index("by_tenant_and_status", ["tenantId", "status"])
  .index("by_last_activity", ["lastActivityAt"])
```

**Example:**

```json
{
  "_id": "session_xyz789",
  "tenantId": "ten_abc123",
  "agentId": "agent_abc123",
  "userId": "user_xyz789",
  "status": "active",
  "metadata": {
    "ipAddress": "203.0.113.42",
    "userAgent": "Mozilla/5.0..."
  },
  "source": "web-chat",
  "messageCount": 24,
  "totalCost": 0.45,
  "totalTokens": 12450,
  "createdAt": 1707920000,
  "lastActivityAt": 1707926400
}
```

---

### `messages`

Individual messages in sessions.

**Schema:**

```typescript
messages: defineTable({
  // Relationships
  tenantId: v.id("tenants"),
  agentId: v.id("agents"),
  sessionId: v.id("sessions"),

  // Message content
  role: v.string(), // "user" | "assistant" | "system"
  content: v.string(),

  // AI response metadata
  model: v.optional(v.string()),
  usage: v.optional(v.object({
    promptTokens: v.number(),
    completionTokens: v.number(),
    totalTokens: v.number(),
  })),
  cost: v.optional(v.object({
    amount: v.number(),
    currency: v.string(),
  })),

  // Reasoning (extended thinking)
  reasoning: v.optional(v.object({
    enabled: v.boolean(),
    steps: v.optional(v.array(v.string())),
  })),

  // Timestamp
  createdAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_session", ["sessionId"])
  .index("by_session_and_created", ["sessionId", "createdAt"])
  .index("by_agent", ["agentId"])
```

**Example:**

```json
{
  "_id": "msg_abc123",
  "tenantId": "ten_abc123",
  "agentId": "agent_abc123",
  "sessionId": "session_xyz789",
  "role": "assistant",
  "content": "Our return policy allows returns within 30 days...",
  "model": "claude-sonnet-4-5",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 85,
    "totalTokens": 235
  },
  "cost": {
    "amount": 0.0235,
    "currency": "usd"
  },
  "reasoning": {
    "enabled": true,
    "steps": [
      "User asking about return policy",
      "Need to provide standard 30-day policy",
      "Include condition requirements"
    ]
  },
  "createdAt": 1707926400
}
```

---

## Channel Tables

### `channels`

Communication channel configurations.

**Schema:**

```typescript
channels: defineTable({
  // Relationships
  tenantId: v.id("tenants"),
  agentId: v.id("agents"),

  // Channel type
  type: v.string(), // "telegram" | "discord" | "slack" | "whatsapp" | "api" | "cli"
  status: v.string(), // "active" | "paused" | "error"

  // Configuration (channel-specific)
  config: v.object({
    // For Telegram: botToken, webhookUrl
    // For Discord: botToken, guildId
    // For Slack: botToken, teamId
  }),

  // Statistics
  messageCount: v.number(),
  lastMessageAt: v.optional(v.number()),

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_agent", ["agentId"])
  .index("by_type", ["type"])
  .index("by_tenant_and_type", ["tenantId", "type"])
```

---

## Skills Tables

### `skills`

Available skills in the marketplace.

**Schema:**

```typescript
skills: defineTable({
  // Identity
  id: v.string(), // "skill_web_search"
  name: v.string(),
  description: v.string(),
  category: v.string(), // "productivity" | "communication" | "data" | ...

  // Verification
  verified: v.boolean(),
  publisherId: v.optional(v.id("users")),

  // Version
  version: v.string(), // "1.2.0"

  // Permissions
  permissions: v.array(v.string()), // ["network.http.get", "fs.read"]

  // Configuration schema
  configSchema: v.optional(v.object({})),

  // WASM binary (base64)
  wasmBinary: v.optional(v.string()),

  // Statistics
  installCount: v.number(),
  rating: v.optional(v.number()), // 0-5 stars

  // Timestamps
  createdAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_id", ["id"])
  .index("by_category", ["category"])
  .index("by_verified", ["verified"])
  .index("by_publisher", ["publisherId"])
```

---

### `agent_skills`

Installed skills per agent.

**Schema:**

```typescript
agent_skills: defineTable({
  // Relationships
  tenantId: v.id("tenants"),
  agentId: v.id("agents"),
  skillId: v.string(),

  // Configuration
  config: v.optional(v.object({})), // Skill-specific config

  // Status
  status: v.string(), // "installed" | "disabled" | "error"
  lastError: v.optional(v.string()),

  // Statistics
  useCount: v.number(),
  lastUsedAt: v.optional(v.number()),

  // Timestamps
  installedAt: v.number(),
  updatedAt: v.number(),
})
  .index("by_agent", ["agentId"])
  .index("by_skill", ["skillId"])
  .index("by_agent_and_skill", ["agentId", "skillId"])
```

---

## Cost Tracking Tables

### `cost_events`

Granular cost tracking for every AI call.

**Schema:**

```typescript
cost_events: defineTable({
  // Relationships
  tenantId: v.id("tenants"),
  agentId: v.id("agents"),
  sessionId: v.optional(v.id("sessions")),
  messageId: v.optional(v.id("messages")),

  // Model used
  model: v.string(),
  provider: v.string(), // "anthropic" | "openai" | "google"

  // Usage
  promptTokens: v.number(),
  completionTokens: v.number(),
  totalTokens: v.number(),

  // Cost
  inputCost: v.number(),
  outputCost: v.number(),
  totalCost: v.number(),
  currency: v.string(), // "usd"

  // Timestamp
  timestamp: v.number(),
})
  .index("by_tenant", ["tenantId"])
  .index("by_agent", ["agentId"])
  .index("by_session", ["sessionId"])
  .index("by_tenant_and_timestamp", ["tenantId", "timestamp"])
  .index("by_model", ["model"])
```

**Example:**

```json
{
  "_id": "cost_abc123",
  "tenantId": "ten_abc123",
  "agentId": "agent_abc123",
  "sessionId": "session_xyz789",
  "messageId": "msg_abc123",
  "model": "claude-sonnet-4-5",
  "provider": "anthropic",
  "promptTokens": 150,
  "completionTokens": 85,
  "totalTokens": 235,
  "inputCost": 0.00045,
  "outputCost": 0.01275,
  "totalCost": 0.0132,
  "currency": "usd",
  "timestamp": 1707926400
}
```

---

## Indexes

### Purpose of Indexes

Indexes optimize query performance. Every query in Convex **must use an index**.

### Index Types

**1. Single-field indexes:**

```typescript
.index("by_tenant", ["tenantId"])
```

Enables queries like:
```typescript
ctx.db.query("agents")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
```

**2. Compound indexes:**

```typescript
.index("by_tenant_and_status", ["tenantId", "status"])
```

Enables queries like:
```typescript
ctx.db.query("agents")
  .withIndex("by_tenant_and_status", (q) =>
    q.eq("tenantId", tenantId).eq("status", "active")
  )
```

**3. Range indexes:**

```typescript
.index("by_tenant_and_timestamp", ["tenantId", "timestamp"])
```

Enables queries like:
```typescript
ctx.db.query("cost_events")
  .withIndex("by_tenant_and_timestamp", (q) =>
    q.eq("tenantId", tenantId).gte("timestamp", startTime).lte("timestamp", endTime)
  )
```

---

## Relationships

### Tenant → Agents

**One-to-Many**

```typescript
// Get all agents for a tenant
const agents = await ctx.db
  .query("agents")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .collect();
```

### Agent → Sessions

**One-to-Many**

```typescript
// Get all sessions for an agent
const sessions = await ctx.db
  .query("sessions")
  .withIndex("by_agent", (q) => q.eq("agentId", agentId))
  .collect();
```

### Session → Messages

**One-to-Many**

```typescript
// Get all messages in a session (ordered by time)
const messages = await ctx.db
  .query("messages")
  .withIndex("by_session_and_created", (q) =>
    q.eq("sessionId", sessionId)
  )
  .order("asc") // Oldest first
  .collect();
```

### Agent → Skills

**Many-to-Many** (via `agent_skills` join table)

```typescript
// Get all skills for an agent
const agentSkills = await ctx.db
  .query("agent_skills")
  .withIndex("by_agent", (q) => q.eq("agentId", agentId))
  .collect();

// Load full skill details
const skills = await Promise.all(
  agentSkills.map((as) =>
    ctx.db
      .query("skills")
      .withIndex("by_id", (q) => q.eq("id", as.skillId))
      .unique()
  )
);
```

---

## Querying Data

### Basic Query

```typescript
// Get a single document by ID
const agent = await ctx.db.get(agentId);
```

### Index Query

```typescript
// Query with index
const agents = await ctx.db
  .query("agents")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .collect();
```

### Filtered Query

```typescript
// Query with index + filter
const activeAgents = await ctx.db
  .query("agents")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .filter((q) => q.eq(q.field("status"), "active"))
  .collect();
```

### Paginated Query

```typescript
// Paginate results
const agents = await ctx.db
  .query("agents")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .order("desc")
  .paginate({ numItems: 20, cursor: null });

console.log(agents.page); // Array of agents
console.log(agents.continueCursor); // Cursor for next page
console.log(agents.isDone); // true if last page
```

### Aggregation

```typescript
// Count documents
const agentCount = await ctx.db
  .query("agents")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .collect()
  .then((agents) => agents.length);

// Sum field
const totalCost = await ctx.db
  .query("cost_events")
  .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
  .collect()
  .then((events) => events.reduce((sum, e) => sum + e.totalCost, 0));
```

---

## Schema Migrations

### Adding a New Field

```typescript
// Old schema
agents: defineTable({
  name: v.string(),
  model: v.string(),
})

// New schema (backward compatible)
agents: defineTable({
  name: v.string(),
  model: v.string(),
  description: v.optional(v.string()), // ← New optional field
})
```

**Migration:**

Convex handles this automatically. Existing documents will have `description: undefined`.

---

### Adding a New Index

```typescript
// New index
.index("by_description", ["description"])
```

**Migration:**

1. Add index to schema
2. Push schema: `pnpm --filter @agentik/backend convex deploy`
3. Convex rebuilds index automatically (may take time for large tables)

---

### Removing a Field

```typescript
// Old schema
agents: defineTable({
  name: v.string(),
  deprecated_field: v.string(), // ← Remove this
})

// New schema
agents: defineTable({
  name: v.string(),
  // deprecated_field removed
})
```

**Migration:**

1. Remove from schema
2. Push schema
3. Old documents still have the field in database, but TypeScript won't allow accessing it
4. Optional: Run migration function to delete field from all documents

---

## Summary

The Convex schema provides:

- ✅ **Multi-tenancy** - Tenant isolation at database level
- ✅ **Type-safety** - Full TypeScript definitions
- ✅ **Real-time** - Automatic UI updates via subscriptions
- ✅ **Scalability** - Automatic indexing and optimization
- ✅ **Event sourcing** - Complete audit trail with cost_events
- ✅ **Relationships** - Clean foreign key relationships

**Key Tables:**

| Table | Purpose |
|-------|---------|
| `tenants` | Multi-tenant organizations |
| `agents` | AI agent configurations |
| `sessions` | Conversation sessions |
| `messages` | Individual messages |
| `skills` | Skill marketplace |
| `agent_skills` | Installed skills |
| `cost_events` | Granular cost tracking |

**Next Steps:**

1. Read the [Convex documentation](https://docs.convex.dev)
2. Explore [query patterns](./querying-patterns.md)
3. Learn about [real-time subscriptions](./realtime.md)

**Resources:**

- 📚 Convex Docs: [docs.convex.dev](https://docs.convex.dev)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)
- 📧 Email: backend-support@agentik-os.com

---

*Last updated: February 14, 2026*
*Schema Version: 1.0*
*Agentik OS Backend Team*
