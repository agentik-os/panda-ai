# Agentik OS - Confirmed Decisions

> Locked-in technical and product decisions.

---

## Identity

| Field | Value |
|-------|-------|
| **Name** | Agentik OS |
| **Tagline** | Next Generation Autonomous AI Agent Operating System |
| **Domain** | agentik-os.dev (TBD) |
| **GitHub** | github.com/agentik-os/agentik-os |
| **License** | MIT |

---

## Tech Stack (Confirmed)

| Layer | Choice | Why |
|-------|--------|-----|
| **Runtime** | Bun | Faster than Node, built-in TypeScript, built-in bundler |
| **Language** | TypeScript | End-to-end type safety |
| **API Framework** | Hono | Ultra-fast, Bun-native, edge-ready |
| **Dashboard** | Next.js 16 + App Router | Scalable, RSC, best ecosystem |
| **UI Library** | shadcn/ui + Tailwind CSS | Beautiful, accessible, customizable |
| **Deployment** | Docker | One-line install anywhere |

---

## Backend Strategy (Confirmed: BOTH)

Users choose during setup. Both are first-class citizens.

```
agentik-os setup

? Choose your backend:
  > SQLite (local, free, zero deps)        ← Default for self-hosted
  > Convex (cloud, realtime, recommended)   ← Recommended for cloud
  > Supabase (cloud, SQL, alternative)      ← For SQL-native devs
```

| Backend | Target User | Cost | Realtime | Vector Search |
|---------|------------|------|----------|---------------|
| **SQLite + Chroma** | Self-hosted, solo | $0 | Polling | Chroma |
| **Convex** | Cloud users, teams | $0-25/mo | Native | Built-in |
| **Supabase** | SQL devs, enterprise | $0-25/mo | Add-on | pgvector |

**Architecture**: Abstract `AgentikBackend` interface. Each backend implements the same contract. Swap without code changes.

---

## Channels (Confirmed)

| Priority | Channel | Status |
|----------|---------|--------|
| **P0 (MVP)** | Telegram | Main channel, first implemented |
| **P0 (MVP)** | Web Chat | Dashboard built-in chat |
| **P1** | CLI | Terminal interface |
| **P1** | Discord | Community channel |
| **P1** | REST API | For integrations |
| **P2** | Slack | Business channel |
| **P2** | WhatsApp | Consumer channel |
| **P3** | Signal, Matrix, etc. | Plugin-based |

---

## Monorepo Structure

```
agentik-os/
├── packages/
│   ├── runtime/          # Core agent engine (Bun + Hono)
│   │   ├── src/
│   │   │   ├── core/         # Agent loop, message routing
│   │   │   ├── models/       # Multi-model router (Claude, GPT, Gemini, Ollama)
│   │   │   ├── channels/     # Channel adapters (Telegram, Web, CLI)
│   │   │   ├── memory/       # Memory system (embeddings, search)
│   │   │   ├── skills/       # Skill loader and executor
│   │   │   ├── mcp/          # MCP client + server
│   │   │   ├── cron/         # Scheduler (cron + webhooks)
│   │   │   └── backends/     # Backend adapters (SQLite, Convex, Supabase)
│   │   └── package.json
│   │
│   ├── dashboard/        # Web UI (Next.js 16)
│   │   ├── app/
│   │   │   ├── (auth)/       # Login/register
│   │   │   ├── (dashboard)/  # Main dashboard
│   │   │   │   ├── agents/       # Agent management
│   │   │   │   ├── channels/     # Channel config
│   │   │   │   ├── skills/       # Skill store
│   │   │   │   ├── mcp/          # MCP hub
│   │   │   │   ├── memory/       # Memory graph
│   │   │   │   ├── costs/        # Cost X-Ray
│   │   │   │   ├── scheduler/    # Cron + automations
│   │   │   │   ├── modes/        # OS Modes
│   │   │   │   └── settings/     # Settings
│   │   │   └── chat/        # Web chat interface
│   │   └── package.json
│   │
│   ├── cli/              # CLI tool (agentik-os command)
│   │   └── package.json
│   │
│   ├── sdk/              # Developer SDK (for building skills/plugins)
│   │   └── package.json
│   │
│   └── shared/           # Shared types, utils, constants
│       └── package.json
│
├── skills/               # Built-in skills
│   ├── web-search/
│   ├── code-runner/
│   ├── file-manager/
│   └── ...
│
├── modes/                # OS Modes definitions
│   ├── human-os/
│   ├── business-os/
│   ├── dev-os/
│   └── ...
│
├── docker/
│   ├── Dockerfile
│   └── docker-compose.yml
│
├── installer/            # One-line install script
│   └── install.sh
│
├── bun.lockb
├── package.json          # Workspace root
├── tsconfig.json
└── README.md
```

---

## Revenue Model (Confirmed)

| Plan | Price | Backend | Features |
|------|-------|---------|----------|
| **Free** | $0/mo | Self-hosted (SQLite) | BYO API keys, 1 mode, unlimited agents |
| **Starter** | $19/mo | Cloud (Convex/Supabase) | 3 modes, 10 agents, 5 channels |
| **Pro** | $49/mo | Cloud | All modes, unlimited agents, all channels |
| **Team** | $99/mo | Cloud | 5 users, shared agents, collaboration |
| **Enterprise** | $299+/mo | Custom | SSO, audit, dedicated infra |

---

## Development Phases

| Phase | Timeline | Deliverables |
|-------|----------|-------------|
| **P0: Foundation** | Week 1-2 | Monorepo, runtime core, agent loop, model router, SQLite backend |
| **P1: MVP** | Week 3-4 | Telegram channel, web chat, dashboard shell, skill system |
| **P2: Power** | Month 2 | Convex + Supabase backends, OS Modes, Cost X-Ray, MCP hub |
| **P3: Ecosystem** | Month 3 | Skill store, mode marketplace, installer, docs |
| **P4: Scale** | Month 4+ | Cloud hosting, billing, enterprise features |

---

*Confirmed: 2026-02-13*
*Stack: Bun + TypeScript + Hono + Next.js 16 + shadcn/ui + Docker*
*Backends: SQLite (default) + Convex (recommended cloud) + Supabase (alternative)*
*Main channel: Telegram + Web Chat*
