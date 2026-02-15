# Agentik OS - Event Sourcing Architecture

> Every agent action is an event. This gives us 6+ features for free.

---

## Why Event Sourcing for AI Agents

| AI Agent Need | Event Sourcing Gives |
|---|---|
| Conversation memory | Append-only log of all messages |
| Tool call history | Immutable record of every action |
| Cost tracking | Project token counts from events |
| Debugging/replay | Reconstruct exact state at any point |
| Audit/compliance | Complete trail of decisions |
| Multi-agent coordination | Agents communicate through events |

---

## Event Types

```
session.start
  → llm.request         (model selected, prompt sent)
  → llm.response         (tokens used, cost calculated)
  → tool.request         (MCP tool called)
  → tool.response        (result received)
  → agent.decision       (why agent chose this action)
  → memory.stored        (fact extracted and embedded)
session.end
```

---

## Event Schema

```typescript
interface AgentEvent {
  id: string               // UUID
  type: string             // "llm.request", "tool.response", etc
  timestamp: string        // ISO 8601
  sessionId: string        // Agent session
  agentId: string          // Which agent
  correlationId: string    // Links related events
  version: number          // Schema version
  metadata: {
    userId: string         // Who initiated
    traceId: string        // OpenTelemetry
  }
}

// LLM events
interface LLMResponseEvent extends AgentEvent {
  type: "llm.response"
  payload: {
    model: string          // "claude-opus-4-6"
    inputTokens: number
    outputTokens: number
    costUsd: number        // Calculated at write time
    latencyMs: number
  }
}

// Tool events
interface ToolCallEvent extends AgentEvent {
  type: "tool.request"
  payload: {
    toolName: string       // "fs_read_file"
    mcpServer: string      // Which MCP server
    arguments: any
    userApproved: boolean  // Consent tracking
  }
}
```

---

## CQRS: Write Once, Read Many Views

### Write Side (Commands)
Events are appended. Never modified. Never deleted.

```
User sends message
  → Append: session.message_received
  → Agent thinks, picks tool
  → Append: llm.request
  → Append: llm.response
  → Append: tool.request
  → Append: tool.response
  → Append: agent.response_sent
```

### Read Side (Projections = Views)

Each projection reads events and builds a materialized view:

| Projection | Events It Reads | What It Produces |
|---|---|---|
| **Cost X-Ray** | llm.response | Cost per user/day/agent/model |
| **Activity Feed** | All events | Timeline of agent actions |
| **Audit Log** | tool.* | Who did what, when, approved? |
| **Session Replay** | All events | Full conversation reconstruction |
| **Budget Alerts** | llm.response | "You've spent 80% of budget" |
| **Memory** | agent.response | Extract facts → embed → store |
| **Analytics** | All events | Usage patterns, popular tools |

---

## Features We Get For Free

### 1. Cost X-Ray
```
Every llm.response event has: model, tokens, costUsd
→ Sum by day/agent/model = Cost X-Ray dashboard
→ Zero extra code needed
```

### 2. Time Travel Debug
```
Replay session events with different model/config
→ "What if I had used Haiku instead of Opus?"
→ Compare results side by side
```

### 3. Agent Dreams Log
```
Filter overnight events by agent
→ Morning summary: "While you slept, agent did X, Y, Z"
→ Cost: $0.87
```

### 4. Guardrails / Kill Switch
```
Event interceptor BEFORE tool.request is executed:
→ Check: is this tool allowed?
→ Check: is budget exceeded?
→ Check: is this a dangerous action?
→ Block or allow
```

### 5. Audit Trail
```
Filter events by tool.* type
→ Complete compliance log
→ Who approved what, when
```

### 6. Session Analytics
```
Aggregate all events
→ Most used tools, most expensive agents
→ Average response time, error rates
```

---

## Replay and Debugging

```typescript
// Replay a session to see what happened
async function replaySession(sessionId: string) {
  const events = await eventStore.getBySession(sessionId)

  for (const event of events) {
    console.log(`[${event.timestamp}] ${event.type}`)
    // Can pause, inspect, or diverge at any point
  }
}

// "What if" analysis
async function whatIfReplay(sessionId: string, newModel: string) {
  const events = await eventStore.getBySession(sessionId)

  // Replay with different model
  // Compare: original cost vs new cost
  // Compare: original quality vs new quality
}
```

---

## Snapshots (Performance)

For agents with thousands of events:

```
Every 100 events → Save snapshot of current state
Restore = Load snapshot + replay remaining events
```

---

## Schema Evolution

- Add new fields → old events still valid (defaults)
- Breaking changes → version the event type (v1 → v2)
- Events are IMMUTABLE → never modify stored events
- Transform during read/replay (upcasters)

---

## Storage Options

| Option | Best For |
|---|---|
| SQLite (local) | Self-hosted, single node |
| Convex (cloud) | Realtime projections |
| Postgres (scale) | Enterprise, large datasets |
| File-based (append) | Simplest MVP |

For MVP: append-only JSON file or SQLite table.
Scale later to Convex or Postgres.

---

*Created: 2026-02-13*
*Based on: Akka research, Graphite framework, CQRS patterns*
