# Agentik OS - 10 Critical Improvements

> What's wrong with the current plan and how to fix it.

---

## 1. ARCHITECTURE IS BACKWARDS - Kernel + MCP Plugins

Current plan is a monolithic app. Should be a tiny kernel + everything is MCP.

```
Kernel (tiny):
├── Agent loop (receive → think → act → respond)
├── Model router (pick the right AI)
├── Event bus (everything is an event)
└── Memory (embeddings + search)

EVERYTHING ELSE = MCP server (plugin):
├── telegram-mcp     ← channel as plugin
├── discord-mcp      ← channel as plugin
├── web-search-mcp   ← skill as plugin
├── github-mcp       ← skill as plugin
├── convex-mcp       ← backend as plugin
└── human-os-mcp     ← mode as plugin
```

Composio already has 250+ MCP servers. Instant skills.

---

## 2. EVENT SOURCING = FREE KILLER FEATURES

Every agent action is an event:

```
AgentMessageReceived → ModelSelected → ModelInvoked →
ToolUsed → CostRecorded → ResponseSent
```

Features that come FOR FREE (just views over events):

| Feature | = Just a view over events |
|---------|--------------------------|
| Cost X-Ray | Sum of CostRecorded events per conversation |
| Activity Feed | Stream of all events |
| Time Travel Debug | Replay events with different model |
| Agent Dreams log | Morning summary of overnight events |
| Audit log | Events filtered by agent + action |
| Guardrails | Event interceptor that blocks dangerous actions |
| Memory | Events → extract facts → embed |

One architecture decision. Six features for free.

---

## 3. DON'T BUILD DASHBOARD FIRST

Dashboard is a trap. Ship an agent that WORKS first.

```
RIGHT priority:
  Week 1: Agent kernel that works via Telegram
  Week 2: Multi-model routing + memory
  Week 3: MCP skill system + CLI
  Week 4: Dashboard (now you have something to show!)
```

---

## 4. MODES ARE UNDEFINED - Now Defined

A mode is just a YAML config bundle:

```yaml
name: human-os
version: 2026.2.13
description: "Life management assistant"

personality:
  tone: warm, supportive, practical
  style: tables over paragraphs, visual, concise

agents:
  - name: health-tracker
    model: haiku
    skills: [calendar-mcp, health-mcp, reminder-mcp]
  - name: life-coach
    model: sonnet
    skills: [web-search-mcp, memory-mcp]

automations:
  - trigger: cron("0 7 * * *")
    action: morning-briefing
    agent: life-coach

dashboard_widgets:
  - health-summary
  - daily-agenda
  - mood-tracker

budget:
  daily_limit: $1.00
```

Mode = personality + agents + skills + automations + widgets + budget.

---

## 5. SKILL = ONE FILE (Not an SDK)

```typescript
// skills/web-search.ts - ONE FILE = ONE SKILL
import { skill } from '@agentik-os/sdk'

export default skill({
  name: 'web-search',
  description: 'Search the web for information',
  permissions: ['network'],
  budget: 0.01,

  async execute({ query }) {
    const results = await fetch(`https://api.search.com?q=${query}`)
    return results.json()
  }
})
```

One file. No boilerplate. Declares permissions. Has a budget cap.

---

## 6. SECURITY FROM DAY 1 (Not "Later")

After ClawHavoc (341 malicious OpenClaw skills):

```
Every skill runs in:
┌─────────────────────────────┐
│  Docker/WASM Sandbox        │
│  - No filesystem            │
│  - No network (unless       │
│    declared + approved)     │
│  - Budget capped            │
│  - Time limited             │
└─────────────────────────────┘
```

| OpenClaw | Agentik OS |
|----------|------------|
| Skills have full host access | Sandboxed by default |
| Trust the author | Verify + sandbox |
| ClawHavoc happened | Can't happen |

---

## 7. OFFLINE-FIRST DIFFERENTIATOR

Nobody does this:

```
Online:  Claude/GPT/Gemini via API
         ↓ (internet drops)
Offline: Ollama (local Llama/Mistral)
         ↓ (internet returns)
Online:  Syncs memory, catches up
```

Agent that works without internet = killer for VPS, privacy, developing countries.

---

## 8. WEB SETUP WIZARD (Not CLI)

```
agentik-os setup
→ Opens http://localhost:3000/setup in browser

┌─────────────────────────────────────┐
│  Welcome to Agentik OS              │
│                                     │
│  Step 1: Choose your AI             │
│  [Claude] [GPT] [Gemini] [Ollama]   │
│                                     │
│  Step 2: Paste your API key         │
│  [sk-ant-...]  [Where to find this?]│
│                                     │
│  Step 3: Connect Telegram           │
│  [Scan QR code] or [Enter token]    │
│                                     │
│  Step 4: Pick your first mode       │
│  [Human OS] [Dev OS] [Business OS]  │
│                                     │
│         [Launch Agentik OS →]        │
└─────────────────────────────────────┘
```

---

## 9. RUTHLESS MVP CUT (11 features, not 25)

| Feature | MVP? | Why |
|---------|------|-----|
| Agent kernel + loop | YES | Core |
| Multi-model router | YES | Differentiator |
| Telegram channel | YES | Main channel |
| Memory (embeddings) | YES | Core |
| MCP skill system | YES | Extension mechanism |
| Event bus | YES | Foundation for everything |
| Web chat | YES | Dashboard chat |
| CLI | YES | Dev tool |
| Dashboard (basic) | YES | Visual management |
| Cost X-Ray | YES | Free via events |
| OS Modes (3 built-in) | YES | Differentiator |
| ~~Voice Rooms~~ | NO | Year 2 |
| ~~Agent Genetics~~ | NO | Year 2 |
| ~~Agent Battles~~ | NO | Year 2 |
| ~~Mode Marketplace~~ | NO | Month 4+ |

---

## 10. AGENT-TO-AGENT MESH NETWORK (Moonshot)

```
Your Agentik OS ──── Friend's Agentik OS
     │                        │
     └── Agents discover and  │
         talk across instances┘
```

Like email but for AI agents. Discovery endpoint per instance.
This is the network effect that makes it viral.

---

## Updated Architecture

```
┌─────────────────────────────────────────────┐
│              AGENTIK OS KERNEL               │
│                                              │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Agent    │ │  Model   │ │  Event Bus   │ │
│  │  Loop     │ │  Router  │ │  (source of  │ │
│  │          │ │  (smart) │ │   truth)     │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
│  ┌──────────┐ ┌──────────┐ ┌──────────────┐ │
│  │  Memory  │ │  Config  │ │  Sandbox     │ │
│  │  (vector)│ │  (YAML)  │ │  (Docker/    │ │
│  │          │ │          │ │   WASM)      │ │
│  └──────────┘ └──────────┘ └──────────────┘ │
└──────────────────┬──────────────────────────┘
                   │ MCP Protocol
    ┌──────────────┼──────────────┐
    │              │              │
┌───┴───┐  ┌──────┴─────┐  ┌────┴────┐
│Channels│  │   Skills   │  │Backends │
│(MCP)   │  │   (MCP)    │  │(MCP)    │
├────────┤  ├────────────┤  ├─────────┤
│Telegram│  │Web Search  │  │Convex   │
│Discord │  │GitHub      │  │SQLite   │
│Web Chat│  │Email       │  │Supabase │
│CLI     │  │Calendar    │  │         │
│API     │  │250+ via    │  │         │
│        │  │Composio    │  │         │
└────────┘  └────────────┘  └─────────┘
```

Everything outside the kernel = MCP server = swappable plugin.

---

*Created: 2026-02-13*
