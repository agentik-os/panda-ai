# AGENTIK OS - The AI Agent Operating System

> **"OpenClaw showed the world wants a personal AI agent. We're building the OS it deserves."**

---

## THE OPPORTUNITY

### What OpenClaw Proved

| Metric | Value | What It Means |
|--------|-------|---------------|
| GitHub Stars | 191K+ | Massive demand for self-hosted AI agents |
| ClawHub Skills | 3,000+ | People want extensible AI agents |
| ClawHavoc Incident | 341 malicious skills | Security is the #1 unsolved problem |
| AtomicBot | "Coming soon" wrapper | Even they know OpenClaw is too hard to install |
| Daily Installs | 15,000+ skills/day | The ecosystem is exploding |

### What OpenClaw Gets Wrong

| Problem | Impact | Our Answer |
|---------|--------|------------|
| Claude-only | Locked to one provider, expensive | **Multi-model with smart routing** |
| No dashboard | CLI-only management, dev-only | **Beautiful web dashboard** |
| Complex setup | Node 22 + config files + pairing | **One-line install** |
| Security mess | ClawHavoc, plaintext creds, no audit | **Security-first, sandboxed skills** |
| No cost control | No token budgets, no routing | **Built-in cost optimizer** |
| Fragmented skills | Scattered across dirs, no registry | **Unified skill store with verification** |
| Single-user | No multi-tenant, no sharing | **Multi-user with permissions** |

### What OpenClaw Gets RIGHT (Steal These)

From deep-dive of their GitHub repo:

| # | Genius Pattern | Why It's Brilliant | We MUST Have This |
|---|---------------|-------------------|-------------------|
| 1 | **Wizard onboarding** (`openclaw onboard`) | One command walks through everything | `panda setup` wizard + web wizard |
| 2 | **Doctor command** (`openclaw doctor`) | Self-diagnosing health checks | `panda doctor` - auto-detect + auto-fix |
| 3 | **Node architecture** | Devices as peripherals, not monoliths | VPS = brain, phones/laptops = nodes |
| 4 | **Canvas/A2UI** | Agent RENDERS UI dynamically (not just text) | Agent-driven dashboard + reports |
| 5 | **Skills = SKILL.md** | Just a markdown file, no SDK | Same simplicity + visual creator |
| 6 | **Gating** | Skills declare `requires.bins/env/config` | Same + permission model |
| 7 | **Protocol auto-gen** | TypeBox -> JSON Schema + Swift models | Zod/TypeBox -> all client SDKs |
| 8 | **Date versioning** | `2026.2.12` not semver | Communicates freshness |
| 9 | **Voice interrupt** | Speak to stop assistant mid-sentence | Natural voice UX |
| 10 | **Hot-reload skills** | Edit SKILL.md, agent picks up changes live | Dev without restart |

---

## THE VISION

```
+================================================================+
|                        AGENTIK OS                                 |
|         "Your AI team, running anywhere, for everyone"          |
+================================================================+
|                                                                  |
|  [Dashboard]  [Agent Studio]  [Skill Store]  [MCP Hub]          |
|       |             |              |              |              |
|  +----------------------------------------------------------+   |
|  |                   PANDA RUNTIME                           |   |
|  |  Multi-Model | Multi-Agent | Multi-Channel | Cron+Events |   |
|  +----------------------------------------------------------+   |
|       |             |              |              |              |
|  [Claude]     [GPT/OpenAI]   [Gemini]      [Ollama/Local]      |
|  [Telegram]   [Discord]      [Slack]       [Web/CLI/API]       |
|  [Supabase]   [Convex]       [SQLite]      [Your VPS]          |
|                                                                  |
+================================================================+
```

---

## CORE PILLARS

### 1. DEAD SIMPLE INSTALL

```bash
# Option A: Self-hosted (VPS/Mac/Linux) - FREE
curl -sL get.agentik-os.dev | sh

# Option B: Self-hosted + Supabase backend - FREE
curl -sL get.agentik-os.dev | sh --backend supabase

# Option C: Self-hosted + Convex backend - FREE
curl -sL get.agentik-os.dev | sh --backend convex

# Option D: Cloud hosted (we run it) - PAID
# Sign up at app.agentik-os.dev
```

**What happens after install:**
1. Docker pulls the stack (runtime + dashboard + db)
2. Opens `http://localhost:3000` with setup wizard
3. Wizard asks: API keys, channels, personality
4. 5 minutes later: your AI agent is live on Telegram/Discord/Web

### 2. MULTI-MODEL INTELLIGENCE

| Feature | How It Works |
|---------|-------------|
| **Smart Router** | Simple tasks -> Haiku/Flash (cheap). Complex -> Opus/GPT-5 (powerful) |
| **Auto-Fallback** | Provider down? Seamless switch. Zero downtime. |
| **Cost Budget** | Set $50/month cap. Agent optimizes within budget. |
| **Local Models** | Plug in Ollama for zero-cost basic tasks |
| **Model Arena** | Compare models on YOUR tasks. Data-driven switching. |

```
User message arrives
       |
  [Complexity Scorer]
       |
  Simple? -----> Haiku/Flash ($0.001)
       |
  Medium? -----> Sonnet/GPT-4.1 ($0.01)
       |
  Complex? ----> Opus 4.6/GPT-5 ($0.10)
       |
  Provider down? -> Next in fallback chain
       |
  Over budget? --> Queue or notify user
```

### 3. MULTI-CHANNEL I/O

| Channel | Priority | How |
|---------|----------|-----|
| Telegram | P0 - Day 1 | grammY (like OpenClaw) |
| Discord | P0 - Day 1 | discord.js |
| Web Chat | P0 - Day 1 | Built into dashboard |
| CLI | P1 - Week 2 | Interactive TUI |
| Slack | P1 - Week 2 | Bolt |
| WhatsApp | P2 - Month 2 | Baileys |
| API | P0 - Day 1 | REST + WebSocket |
| Voice | P2 - Month 2 | ElevenLabs / local Whisper |

**Key insight: Same agent, same memory, every channel.**

### 4. MCP-NATIVE TOOL ECOSYSTEM

```
+------------------------------------------+
|            PANDA MCP HUB                  |
|                                           |
|  [Browse]  [Install]  [Configure]  [Monitor] |
|                                           |
|  +------+  +------+  +------+  +------+  |
|  |GitHub|  |Gmail |  |Notion|  |Slack |  |
|  |  MCP |  | MCP  |  | MCP  |  | MCP  |  |
|  +------+  +------+  +------+  +------+  |
|  +------+  +------+  +------+  +------+  |
|  |Stripe|  |Cal   |  |DB    |  |Custom|  |
|  |  MCP |  | MCP  |  | MCP  |  | MCP  |  |
|  +------+  +------+  +------+  +------+  |
|                                           |
|  [Visual Auth Setup] [Permission Mgmt]   |
|  [Usage Monitoring]  [Cost per Tool]      |
+------------------------------------------+
```

**What makes this different from ClawHub:**
- **Visual installer** (not CLI)
- **OAuth handled for you** (Composio-style but built-in)
- **Sandboxed execution** (skills can't access your filesystem)
- **Verified publishers** (no ClawHavoc repeat)
- **Usage & cost tracking per MCP server**

### 5. MULTI-AGENT ORCHESTRATION

```
User: "Research competitors and write a report"
              |
        [PANDA ORCHESTRATOR]
              |
     +--------+--------+
     |                  |
  [Agent: Researcher]  [Agent: Writer]
  Model: Sonnet        Model: Opus
  Tools: Web, Firecrawl Tools: Markdown, PDF
  Budget: $2            Budget: $3
     |                  |
  Researches 10 sites   Waits for research
     |                  |
  Passes findings ------+
                        |
                   Writes report
                        |
                  [Send to Telegram]
```

**Agent features:**
- Spawn sub-agents for parallel work
- Inter-agent messaging (like Claude Code teams)
- Each agent has own model, tools, budget
- Templates: "Research Crew", "Dev Team", "Content Machine"

### 6. PERSISTENT MEMORY

| Layer | Storage | Purpose |
|-------|---------|---------|
| **Short-term** | In-memory | Current conversation context |
| **Session** | SQLite/Supabase | This conversation's full history |
| **Long-term** | Vector DB (Chroma) | Searchable knowledge across all sessions |
| **Structured** | JSON/DB | Facts, preferences, relationships |
| **Shared** | Cross-agent DB | Knowledge shared between agents |

**Key difference from OpenClaw:** Memory is searchable, auto-consolidated, and has governance (what was accessed, when, by whom).

### 7. BEAUTIFUL DASHBOARD

```
+================================================================+
|  AGENTIK OS                              [Gareth] [Settings] [?] |
+================================================================+
|         |                                                       |
| Agents  |  AGENT: Nova                              [Edit]     |
| -----   |  Status: Active | Model: Claude Opus | Cost: $4.20  |
| > Nova  |  -------------------------------------------------- |
| > Ralph |  | Conversations  | Skills (12) | Memory | Logs |   |
|   Neo   |  -------------------------------------------------- |
|         |                                                       |
| Channels|  Recent Activity:                                     |
| -----   |  14:00 - Daily AI Trends report generated            |
| Telegram|  13:45 - Answered Gareth on Telegram                 |
| Discord |  13:30 - Research task completed (3 sub-agents)      |
| Web     |  13:15 - MCP GitHub: 5 PRs reviewed                 |
|         |                                                       |
| MCP Hub |  Memory Insights:                                    |
| -----   |  "Gareth prefers tables over paragraphs"             |
| 12 tools|  "Q1 focus: DentistryGPT + Kommu"                   |
| 3 active|  "ADHD-friendly: short, visual, actionable"          |
|         |                                                       |
| Costs   |  Budget: $47.30 / $100.00 this month                 |
| -----   |  +------------------------------------------+         |
| $47/$100|  | ████████████████████░░░░░░░ 47%          |         |
|         |  +------------------------------------------+         |
+================================================================+
```

---

## BACKEND ARCHITECTURE OPTIONS

### Option A: SQLite (Default - Simplest)

```
Panda Runtime (Node.js/Bun)
    |
    +-- SQLite (conversations, agents, memory)
    +-- Chroma (vector search for memory)
    +-- Local filesystem (skills, config)
```

**Pros:** Zero dependencies, works offline, fastest setup
**Cons:** Single machine, no real-time sync, manual backups
**Best for:** Solo user, VPS, privacy-maximalist

### Option B: Supabase Backend

```
Panda Runtime (Node.js/Bun)
    |
    +-- Supabase Postgres (conversations, agents, memory)
    +-- Supabase Auth (user management, API keys)
    +-- Supabase Realtime (live dashboard updates)
    +-- Supabase Storage (files, avatars, exports)
    +-- Supabase Edge Functions (webhooks, cron)
    +-- pgvector (vector search for memory)
```

**Pros:** Free tier generous, real-time built-in, auth handled, scales
**Cons:** Dependency on Supabase, data leaves your machine
**Best for:** Multi-device, team use, cloud deployment

### Option C: Convex Backend

```
Panda Runtime (Node.js/Bun)
    |
    +-- Convex (everything - real-time, auth, storage, cron, vector)
    +-- Built-in full-text + vector search
    +-- Real-time subscriptions (dashboard updates instantly)
    +-- Scheduled functions (cron jobs)
```

**Pros:** Real-time native, serverless, TypeScript-first, vector built-in
**Cons:** Newer platform, vendor lock-in, less SQL flexibility
**Best for:** Real-time dashboard, multi-user, modern stack

### Option D: Hybrid (Local Runtime + Cloud Sync)

```
VPS: Panda Runtime + SQLite (primary, always works)
          |
          +-- Sync to Supabase/Convex (backup + dashboard access)
          +-- Cloud dashboard reads from Supabase/Convex
          +-- Runtime always works even if cloud is down
```

**Pros:** Best of both - local resilience + cloud features
**Cons:** Most complex, sync logic needed
**Best for:** Production deployment, "never dies" requirement

### RECOMMENDATION: Start with Option A (SQLite), build Option D (Hybrid)

Phase 1: SQLite works, dashboard is local
Phase 2: Add Supabase sync for cloud dashboard + multi-device
Phase 3: Offer Convex as alternative backend

---

## INSTALLATION TIERS

| Tier | Name | What You Get | Cost | Complexity |
|------|------|-------------|------|------------|
| **Free** | Self-Install | Full Agentik OS on your machine | $0 + API keys | `curl` one-liner |
| **Free+** | Self + Supabase | Agentik OS + cloud sync/dashboard | $0 (Supabase free tier) | Setup wizard |
| **Free++** | Self + Convex | Agentik OS + real-time backend | $0 (Convex free tier) | Setup wizard |
| **Pro** | Cloud | We host everything | $19/mo | Sign up + connect keys |
| **Team** | Cloud Team | Multi-user, shared agents | $49/mo | Admin dashboard |

**Key principle: Always free to self-host. Cloud is convenience, not lock-in.**

---

## SKILL SYSTEM (vs ClawHub)

### What We Learn from ClawHavoc

| ClawHub Problem | Agentik OS Solution |
|-----------------|-------------------|
| Anyone could publish | **Verified publishers + automated security scan** |
| No sandboxing | **Skills run in Docker containers** |
| Obfuscated code allowed | **Source must be readable, no minification** |
| Delayed detection | **Pre-publish scan + daily re-scan** |
| No permissions model | **Skills declare permissions, user approves** |

### Skill Format

```yaml
# panda-skill.yaml
name: "github-reviewer"
version: "1.0.0"
author: "dafnck"
verified: true

description: "AI-powered code review for GitHub PRs"

permissions:
  - mcp:github (read PRs, write comments)
  - network (api.github.com only)

models:
  minimum: "sonnet"
  recommended: "opus"

install:
  mcp_servers:
    - "@anthropic/github-mcp"

instructions: |
  You are a code reviewer. When asked to review a PR:
  1. Read all changed files
  2. Analyze for bugs, security issues, and style
  3. Post inline comments on the PR
  4. Summarize findings
```

### Skill Store UX

```
+================================================+
|  PANDA SKILL STORE                    [Search] |
+================================================+
|                                                  |
|  Featured                                        |
|  +----------+ +----------+ +----------+         |
|  |Code      | |Research  | |Email     |         |
|  |Reviewer  | |Assistant | |Manager   |         |
|  |*****(42) | |*****(89) | |**** (31) |         |
|  |[Install] | |[Install] | |[Install] |         |
|  +----------+ +----------+ +----------+         |
|                                                  |
|  Categories:                                     |
|  [Dev Tools] [Productivity] [Marketing]          |
|  [Research]  [Communication] [Finance]           |
|                                                  |
|  Popular MCP Bundles:                            |
|  > GitHub + Linear + Slack = "Dev Workflow"      |
|  > Gmail + Calendar + Notion = "Productivity"    |
|  > Stripe + Analytics + CRM = "Business"         |
|                                                  |
+================================================+
```

---

## COMMANDS SYSTEM (Like Claude Code)

```bash
# Built-in commands (in any channel)
/help                    # Show available commands
/agent create "name"     # Create new agent
/agent list              # List agents
/skill install "name"    # Install a skill
/skill list              # List installed skills
/mcp add "server"        # Add MCP server
/mcp list                # List MCP servers
/memory search "query"   # Search memory
/memory forget "topic"   # Delete memory
/cost report             # Cost breakdown
/cron add "schedule"     # Add cron job
/cron list               # List cron jobs
/mode focus              # Disable notifications
/mode normal             # Resume notifications
/export chat             # Export conversation
/settings                # Open settings
```

---

## CRON + FUNCTIONS

### Built-in Scheduler

```yaml
# panda-cron.yaml
jobs:
  daily-trends:
    schedule: "0 14 * * *"          # 2pm daily
    timezone: "Europe/Paris"
    agent: "nova"
    prompt: "Research today's AI trends and send report to Telegram"
    budget: "$0.50"

  weekly-review:
    schedule: "0 18 * * 5"          # Friday 6pm
    timezone: "Europe/Paris"
    agent: "nova"
    prompt: "Summarize this week's work across all projects"
    budget: "$1.00"

  monitor-sites:
    schedule: "*/30 * * * *"        # Every 30min
    agent: "sentinel"
    prompt: "Check if kommu.app and dentistrygpt.com are up"
    budget: "$0.05"
```

### Webhook Functions (Supabase Edge Functions Style)

```typescript
// functions/on-github-push.ts
export default async function handler(event: WebhookEvent) {
  const { repo, commits } = event.payload;

  // Trigger agent to review
  await panda.agent("reviewer").run({
    prompt: `Review these ${commits.length} commits on ${repo}`,
    tools: ["mcp:github"],
    budget: "$0.50"
  });
}
```

### Event Triggers

| Trigger | Example |
|---------|---------|
| **Cron** | "Every day at 2pm" |
| **Webhook** | GitHub push, Stripe payment, form submission |
| **Channel** | New message in specific channel |
| **MCP Event** | New email, calendar event, PR created |
| **Agent** | Agent A finishes -> trigger Agent B |
| **Cost** | Budget threshold reached |
| **Health** | Service down, error spike |

---

## WHAT MAKES THIS THE "BIG BUZZ"

### 1. The Name: AGENTIK OS

- Memorable, cute, non-threatening
- "OS" signals ambition (it's not just a chatbot)
- Panda = gentle but powerful
- Great mascot potential

### 2. The Install Experience

```
$ curl -sL get.agentik-os.dev | sh

  🐼 AGENTIK OS Installer v1.0

  Detecting system... Linux x86_64 ✓
  Pulling Docker images... ████████████ Done
  Starting services... ████████████ Done

  🎉 Agentik OS is running!

  Dashboard: http://localhost:3000
  API: http://localhost:3001

  Next: Open the dashboard to set up your first agent!
```

**This is the viral moment.** If setup takes <5 minutes, people will tweet about it.

### 3. The "I Built My Own Jarvis" Factor

People want to say: "I have my own AI agent that manages my email, reviews my PRs, and sends me a daily briefing on Telegram."

Agentik OS makes that real in 10 minutes, not 10 hours.

### 4. The Open Source Play

| Strategy | Why It Works |
|----------|-------------|
| MIT License | Maximum trust, maximum adoption |
| Self-host free | No lock-in fear |
| Cloud optional | Revenue without resentment |
| Skill store open | Community builds the ecosystem |
| Security-first | Trust after ClawHavoc |

### 5. The Community Strategy

```
Phase 1: "Look what I built" (Hacker News, Reddit, Twitter)
         -> One-line install + beautiful dashboard = viral screenshots

Phase 2: "Build skills for Agentik OS" (Developer community)
         -> Skill SDK + store + verified publisher program

Phase 3: "My company uses Agentik OS" (Enterprise)
         -> Team features, SSO, audit logs, compliance
```

---

## TECH STACK DECISION

| Layer | Technology | Why |
|-------|-----------|-----|
| **Runtime** | Bun + TypeScript | Fast, modern, single binary |
| **API** | Hono | Lightweight, fast, edge-compatible |
| **Dashboard** | Next.js 16 + shadcn/ui | Beautiful, SSR, our expertise |
| **Database** | SQLite (default) / Supabase / Convex | Progressive complexity |
| **Vector DB** | Built-in pgvector (Supabase) or Chroma (local) | Memory search |
| **Agent Engine** | Claude Agent SDK + custom multi-model layer | Best agent primitives |
| **MCP** | Native MCP client | Tool ecosystem |
| **Channels** | grammY (Telegram), discord.js, Bolt (Slack) | Proven libs |
| **Auth** | Clerk or Better Auth | Dashboard auth |
| **Containerization** | Docker + Docker Compose | Universal deployment |
| **CI/CD** | GitHub Actions | Standard |

---

## COMPETITIVE POSITIONING

```
                    Easy to Use
                        ^
                        |
           Agentik OS ----+---- AtomicBot (desktop only)
                        |
                        |
       LobeChat --------+-------- Open WebUI
                        |
                        |
                        |
  Powerful  <-----------+----------->  Simple
                        |
                        |
       Dify.ai ---------+-------- Jan.ai
                        |
                        |
           OpenClaw ----+---- n8n AI
                        |
                        v
                   Hard to Use
```

**Agentik OS target: Top-right quadrant. Powerful AND easy.**

---

## DEVELOPMENT PHASES

### Phase 0: Foundation (Week 1-2)

- [ ] Project setup (Bun + TypeScript monorepo)
- [ ] Core runtime: model router (Claude, OpenAI, Gemini, Ollama)
- [ ] Basic agent loop (receive message -> think -> respond)
- [ ] SQLite persistence (conversations, config)
- [ ] Docker setup + one-line installer
- [ ] README + landing page

### Phase 1: MVP (Week 3-4)

- [ ] Telegram channel (grammY)
- [ ] Web chat (built into dashboard)
- [ ] Dashboard v1 (Next.js + shadcn)
  - Agent management
  - Conversation viewer
  - Settings
- [ ] MCP client (connect to any MCP server)
- [ ] Basic memory (conversation history + vector search)
- [ ] Personality system (SOUL.md equivalent)

### Phase 2: Power Features (Month 2)

- [ ] Multi-agent orchestration
- [ ] Skill system + basic store
- [ ] Cron scheduler
- [ ] Discord channel
- [ ] Cost tracking + budget controls
- [ ] Supabase backend option
- [ ] CLI tool (`panda agent create`, `panda skill install`)

### Phase 3: Ecosystem (Month 3)

- [ ] Skill Store web UI
- [ ] Skill SDK + publisher tools
- [ ] Convex backend option
- [ ] Webhook functions
- [ ] Voice (ElevenLabs + Whisper)
- [ ] Slack channel
- [ ] WhatsApp channel
- [ ] Mobile PWA dashboard

### Phase 4: Scale (Month 4+)

- [ ] Cloud hosted option (app.agentik-os.dev)
- [ ] Team/multi-user support
- [ ] Enterprise features (SSO, audit, compliance)
- [ ] Agent templates marketplace
- [ ] Community contributions
- [ ] Plugin system for custom backends

---

## REVENUE MODEL

| Stream | Price | Target |
|--------|-------|--------|
| **Self-host** | FREE forever | Developers, tinkerers |
| **Cloud Personal** | $19/mo | Non-technical users |
| **Cloud Team** | $49/mo (5 users) | Small teams |
| **Cloud Enterprise** | Custom | Companies |
| **Skill Store** | 15% cut on paid skills | Skill developers |
| **Premium Skills** | $5-50/skill | Power users |
| **API Access** | Usage-based | Developers building on Panda |

---

## NAME & BRANDING

| Element | Value |
|---------|-------|
| **Name** | Agentik OS |
| **Tagline** | "Your AI team, running anywhere" |
| **Mascot** | Panda with headphones (chill but productive) |
| **Colors** | Black + White + Bamboo Green (#4ade80) |
| **Domain** | agentik-os.dev |
| **GitHub** | github.com/agentik-os/agentik-os |
| **License** | MIT |

---

## vs OPENCLAW: HONEST COMPARISON

| Feature | OpenClaw | Agentik OS |
|---------|----------|----------|
| Stars | 191K (established) | 0 (new) |
| Install | `npm install -g` + config | `curl` one-liner + wizard |
| Dashboard | None (CLI only) | Beautiful web UI |
| Models | Claude-only | Multi-model + smart router |
| Cost control | None | Built-in budgets + routing |
| Security | ClawHavoc happened | Sandboxed + verified skills |
| Channels | 15+ (mature) | 5 initially (growing) |
| Skills | 3,000+ (ClawHub) | 0 initially (growing) |
| Memory | Files only | Vector DB + structured |
| Multi-agent | Basic | Full orchestration |
| Community | Massive | Zero (must build) |
| Backend | Files only | SQLite / Supabase / Convex |

**Honest truth:** OpenClaw has massive community advantage. We win on UX, security, multi-model, and dashboard. We must be 10x better on the experience to overcome the network effect.

---

## THE KILLER DEMO

**What we show in the launch video (2 minutes):**

```
0:00 - "What if you could have your own AI team in 5 minutes?"
0:10 - Terminal: curl -sL get.agentik-os.dev | sh
0:20 - Dashboard opens, beautiful setup wizard
0:30 - Connect Telegram bot in 3 clicks
0:40 - Add Claude API key
0:50 - Install "Research Assistant" skill from store
1:00 - Send message on Telegram: "Research the top 5 AI agent frameworks"
1:10 - Agent works: spawns 3 sub-agents, searches web, compiles report
1:30 - Report arrives on Telegram, formatted beautifully
1:40 - Dashboard shows: cost ($0.12), tokens used, agents involved
1:50 - "Agentik OS. Your AI team, running anywhere."
2:00 - GitHub link + star count animation
```

---

## FROM ELIZAOS: Key Patterns to Integrate

ElizaOS (17.5K stars, 651 contributors) has the best plugin architecture in the space.

### Must-Have Patterns

| Pattern | What It Does | Why We Need It |
|---------|-------------|----------------|
| **Character System** | Structured persona (bio, style, examples, topics) | Agent personality beyond just a system prompt |
| **Provider Pattern** | Modular context injection before each response | Scalable way to assemble agent knowledge |
| **Reflection Evaluator** | Auto-extracts facts from conversations | Agents that LEARN from every interaction |
| **Action Chaining** | Multi-step plans with result passing | Complex workflows (research -> summarize -> send) |
| **Typed Memory** | MESSAGE/DOCUMENT/FRAGMENT/DESCRIPTION + scoping | Organized, searchable, manageable memory |
| **Event System** | 30+ events with plugin handlers | Extensibility without code changes |

### Anti-Patterns to AVOID

| Don't Do This | Why | Our Approach |
|--------------|-----|-------------|
| Bun-only requirement | Locks out devs | Support npm + pnpm + bun |
| Crypto-first | Alienates 95% of users | Domain-agnostic modes |
| 90+ plugins day 1 | Quality nightmare | 15 solid ones > 90 broken |
| No memory decay | Grows forever | Auto-consolidation + pruning |
| 1.6GB repo | Horrible DX | Lean <100MB |

---

## THE DNA: Agentik OS = Best of All Worlds

```
FROM OPENCLAW:   Multi-channel + personality + skills + cron
FROM ELIZAOS:    Plugin architecture + typed memory + reflection + action chains
FROM CLAUDE CODE: Slash commands + MCP native + subagents + hooks
FROM ATOMICBOT:  Wizard install + doctor command + node architecture
FROM LOBEHAT:    Beautiful dashboard + agent marketplace
FROM N8N:        Visual automations + webhook triggers + execution logs
FROM DIFY:       Prompt IDE + RAG pipeline + model management

UNIQUE TO AGENTIK OS:
  - OS Modes (Human/Business/Dev/Marketing/Sales/Art/Design/Ask/Finance/Learning)
  - Cost X-Ray (transparent per-message costs)
  - Agent Dreams (autonomous night work)
  - Multi-AI Consensus (/consensus command)
  - Memory Graph (visual knowledge map)
  - Agent Battles (A/B test configs)
  - Kill Switch + Guardrails dashboard
  - Mode Marketplace (create + sell modes)
```

---

## OPEN QUESTIONS

1. **Bun vs Node.js?** Bun is faster but less ecosystem support. ElizaOS went Bun-only and it hurts adoption.
2. **Dashboard: Next.js vs SvelteKit?** Next.js = our expertise, Svelte = lighter
3. **Vector DB: Chroma vs pgvector vs Qdrant?** Depends on backend choice
4. **Agent SDK: Build custom vs use Claude Agent SDK?** Custom = more control
5. **Naming: Agentik OS vs PandaAgent vs PandaClaw?** Need community input
6. **License: MIT vs Apache 2.0?** MIT = simpler, Apache = patent protection
7. **First channel: Telegram or Web?** Telegram = viral, Web = accessible
8. **Monorepo structure?** packages/runtime, packages/dashboard, packages/cli

---

## NEXT STEPS

1. **Validate the name** - Check domain availability, GitHub org
2. **Set up monorepo** - Bun workspace with packages
3. **Build runtime MVP** - Multi-model agent loop
4. **Build dashboard MVP** - Next.js + shadcn
5. **Build installer** - Docker + setup wizard
6. **Write landing page** - agentik-os.dev
7. **Launch on Hacker News** - "Show HN: Agentik OS"

---

*Created: 2026-02-13*
*Author: Gareth (Dafnck Studio)*
*Status: BRAINSTORM - Ready for discussion*
