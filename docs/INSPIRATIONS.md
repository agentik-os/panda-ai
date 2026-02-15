# AGENTIK OS - Inspirations & What to Steal

> "Good artists copy, great artists steal" - Picasso
> "Great engineers study what works and build something better" - Us

---

## FROM OPENCLAW: What to Keep (all but better ahah)

| Feature | Their Approach | Our Improvement |
|---------|---------------|-----------------|
| Multi-channel | 15+ channels (Telegram, WhatsApp, Discord, Slack, Signal, iMessage) | Start with 5, do them perfectly. Quality > quantity |
| Personality (SOUL.md) | Markdown files for personality, tools, memory | Same approach + visual editor in dashboard |
| Gateway architecture | WebSocket control plane on 127.0.0.1 | Same, but add REST API + dashboard on top |
| Skills system | Markdown + optional JS/TS code | Same format + sandboxed execution + visual store |
| Device pairing | DM pairing for Telegram security | Keep this pattern, add web-based approval |
| Cron jobs | JSON-based scheduler | Same + visual cron builder in dashboard |
| Voice | ElevenLabs TTS | Same + local Whisper for STT |

## FROM OPENCLAW: What to Fix

| Problem | Why It Sucks | Our Fix |
|---------|-------------|---------|
| No dashboard | Everything is CLI/config files | Beautiful Next.js dashboard |
| Claude-only | Locked to one expensive provider | Multi-model with smart routing |
| ClawHavoc security | 341 malicious skills published | Sandboxed skills + verified publishers |
| Complex install | Node 22 + pnpm + manual config | One-line Docker install + wizard |
| No cost tracking | No idea how much you're spending | Built-in cost dashboard + budgets |
| Fragmented config | JSON files scattered everywhere | Single config source + dashboard UI |

---

## FROM CLAWHUB: What to Keep

| Feature | Their Approach | Our Improvement |
|---------|---------------|-----------------|
| Vector search | Embeddings-based skill discovery | Same, natural language skill search |
| Versioning | Semver for skills | Same + auto-update with rollback |
| Community signals | Stars, downloads, comments | Same + "verified" badge program |
| Categories | 200+ topic tags | Curated categories + AI-suggested |

## FROM CLAWHUB: What to Fix

| Problem | Why It Sucks | Our Fix |
|---------|-------------|---------|
| No security review | Anyone could publish malware | Pre-publish scan + Docker sandbox |
| No revenue for devs | Free only, no monetization path | Optional paid skills (we take 15%) |
| CLI-only install | `openclaw skill install slug` | Visual store with one-click install |
| No usage metrics | Can't see if skill works well | Usage stats + success rate tracking |

---

## FROM ATOMICBOT/OPENCLAW REPO: What to Keep

> Deep-dive from github.com/AtomicBot-ai/atomicbot (fork of OpenClaw)

### GENIUS PATTERNS TO STEAL

| # | Pattern | Their Implementation | Our Version |
|---|---------|---------------------|-------------|
| 1 | **Wizard onboarding** | `openclaw onboard` - guided setup, daemon install, health check | `panda setup` - same wizard approach + web-based wizard option |
| 2 | **Doctor command** | `openclaw doctor` - self-diagnosing health checks | `panda doctor` - diagnose issues, suggest fixes, auto-repair |
| 3 | **Node architecture** | Devices (Mac/iOS/Android) connect as "peripherals" exposing local capabilities | Same - VPS is brain, devices are nodes exposing camera/GPS/screen |
| 4 | **Canvas/A2UI** | Agent dynamically renders UI surfaces (not just text responses) | Agent-driven dashboard widgets + dynamic report generation |
| 5 | **Skills as SKILL.md** | Simple markdown with YAML frontmatter, no SDK needed | Same simplicity + visual skill creator in dashboard |
| 6 | **Gating system** | Skills declare `requires.bins`, `requires.env`, `requires.config` | Same + permission model (network, filesystem, budget) |
| 7 | **Protocol auto-gen** | TypeBox schemas -> JSON Schema + Swift models | TypeBox/Zod schemas -> JSON Schema + all client SDKs |
| 8 | **Date versioning** | `2026.2.12` instead of semver | Same - communicates freshness for fast-moving project |
| 9 | **Voice interrupt** | Speaking while assistant talks stops playback instantly | Same - natural conversation flow |
| 10 | **Hot-reload skills** | File watcher on SKILL.md, refreshes mid-session | Same - develop skills without restart |

### THEIR FULL CHANNEL SUPPORT (20+)

| Built-in | Plugin-based |
|----------|-------------|
| WhatsApp (Baileys) | Microsoft Teams |
| Telegram (grammY) | Matrix |
| Discord (discord.js) | Zalo |
| Slack (Bolt) | Feishu |
| Signal (signal-cli) | Mattermost |
| Google Chat | LINE |
| BlueBubbles/iMessage | Nextcloud Talk |
| IRC | Nostr |
| WebChat | Tlon, Twitch |

**Our approach:** Start with 5 (Telegram, Discord, Web, CLI, API), add others as plugins.

### THEIR TECH CHOICES WE SHOULD CONSIDER

| Choice | What They Use | Why | Our Decision |
|--------|--------------|-----|-------------|
| Linting | oxlint + oxfmt (Rust) | 100x faster than ESLint | Adopt - faster DX |
| Control UI | Lit (web components) | Lightweight, no framework overhead | Consider for embeddable widgets |
| Build | tsdown (successor to tsup) | Modern, fast TS bundler | Evaluate vs Bun bundler |
| Testing | Vitest | Fast, modern | Adopt |
| Validation | TypeBox | Runtime validation + schema gen | Adopt alongside Zod |

## FROM ATOMICBOT: What to Fix

| Problem | Why It Sucks | Our Fix |
|---------|-------------|---------|
| Desktop-only wrapper (Mac) | No Linux, no server, no mobile | Docker = runs everywhere |
| No VPS-first design | Can't run 24/7 headless | VPS-first architecture, desktop optional |
| No multi-user | Single user "personal assistant" only | Multi-user with permissions + teams |
| No API for integration | Can't build on top of it | Full REST + WebSocket API from day 1 |
| No cost visibility | Zero cost tracking | Built-in cost dashboard + budgets |
| No web dashboard | CLI + desktop app only | Beautiful web dashboard (Next.js + shadcn) |
| 20+ channels = complexity | Too much to maintain | Plugin architecture - core channels + community plugins |
| Single-model bias | Claude-centric | True multi-model with smart routing |

---

## FROM CLAUDE CODE: What to Steal

| Feature | How Claude Code Does It | How We Adapt It |
|---------|------------------------|-----------------|
| **Slash commands** | `/commit`, `/review-pr`, etc. | Same pattern: `/research`, `/email`, `/report` |
| **Skills system** | Loadable skills with prompts | Exact same approach for agent skills |
| **MCP integration** | Native MCP client | Native MCP client, same approach |
| **Subagents** | Task tool spawns specialized agents | Multi-agent with subagent spawning |
| **Hooks** | Pre/post tool execution hooks | Same - hooks for channel messages, skill runs |
| **Rules files** | `.claude/rules/*.md` auto-loaded | Agent personality files auto-loaded |
| **Memory** | claude-mem plugin pattern | Built-in, not a plugin |
| **Team mode** | TeamCreate + SendMessage | Same orchestration pattern |
| **Cost awareness** | Model selection by capability | Smart router with cost optimization |

---

## FROM DIFY.AI: What to Steal

| Feature | Their Approach | Our Take |
|---------|---------------|----------|
| Visual workflow builder | Drag-and-drop node editor | Agent workflow builder (simpler) |
| Prompt IDE | Test and iterate prompts | Agent personality tester in dashboard |
| Model management | Switch models per workflow | Switch models per agent + smart routing |
| RAG pipeline | Upload docs, auto-chunk, embed | Memory system with auto-embedding |

---

## FROM N8N: What to Steal

| Feature | Their Approach | Our Take |
|---------|---------------|----------|
| 400+ integrations | Node-based automation | MCP servers as our integration layer |
| Webhook triggers | HTTP endpoints that trigger workflows | Same - webhooks trigger agent tasks |
| Cron with UI | Visual cron builder | Same in our dashboard |
| Execution logs | See every step of every run | Agent activity logs with full trace |

---

## FROM LOBEHAT: What to Steal

| Feature | Their Approach | Our Take |
|---------|---------------|----------|
| Beautiful UI | Modern, polished, dark mode | Same level of polish for our dashboard |
| Plugin marketplace | Visual plugin browser | Our skill store |
| Agent marketplace | Pre-built agent configs | Agent templates in our store |
| PWA | Mobile-friendly web app | Dashboard as PWA |
| TTS/STT | Built-in voice | Same |

---

## FROM ELIZAOS: What to Steal (17.5K stars, 651 contributors)

> github.com/elizaOS/eliza - The most feature-rich open-source AI agent framework

### GENIUS PATTERNS TO STEAL

| # | Pattern | Their Implementation | Our Version |
|---|---------|---------------------|-------------|
| 1 | **Character System** | Structured JSON: bio, topics, adjectives, style, messageExamples, postExamples | Agent personality files: YAML + markdown, visual editor in dashboard |
| 2 | **Plugin Interface** | Single Plugin can provide: actions, providers, evaluators, services, models, events, routes, DB adapters, tests | Same comprehensive interface for skills |
| 3 | **Provider Pattern** | "Data injectors" that populate agent context before each response (facts, messages, time, relationships) | Same - modular context assembly from multiple sources |
| 4 | **Reflection Evaluator** | Post-response: auto-extracts facts + relationships from conversations. Agent LEARNS. | Built-in learning: every conversation makes agent smarter |
| 5 | **Typed Memory** | MESSAGE, DOCUMENT, FRAGMENT, DESCRIPTION, CUSTOM + scoping (shared/private/room) | Same taxonomy + dashboard to manage/search/forget |
| 6 | **Event System** | 30+ events: WORLD_JOINED, MESSAGE_RECEIVED, ACTION_STARTED, ACTION_COMPLETED | Same event-driven architecture for hooks + automations |
| 7 | **Action Chaining** | Actions return results that feed into next action. Multi-step plans with tracking. | Same - agent workflows with step-by-step execution |
| 8 | **World/Room/Entity** | Worlds (servers) > Rooms (channels) > Entities (users/agents) > Participants | Same hierarchy for multi-channel abstraction |
| 9 | **Task Worker System** | Named workers, background execution, room/world scoped, tags | Same for cron jobs + long-running tasks |

### What They Do WRONG (Anti-patterns to avoid)

| Anti-Pattern | Problem | Our Approach |
|-------------|---------|-------------|
| **Bun-only** (no npm/pnpm) | Locks out 90% of developers | Support npm, pnpm, bun - all work |
| **Node 23 exact version** | Fragile requirement | Node 20+ or Bun, flexible |
| **Crypto-first branding** | Alienates non-crypto devs | Domain-agnostic, modes for everything |
| **90+ plugins, many broken** | Quality nightmare | 10-20 solid plugins > 90 half-working |
| **No memory pruning** | Unbounded growth | Memory decay, auto-consolidation, budget |
| **Centralized only** | Single server bottleneck | Designed for distributed from day 1 |
| **1.6GB repo** | Horrible DX | Lean monorepo, <100MB |
| **Broken documentation** | 404 URLs everywhere | Docs as first-class citizen |

### Competitive Position

```
ElizaOS:  Multi-agent framework (developer tool, build agents)
OpenClaw: Personal AI assistant (end-user tool, USE an agent)
Agentik OS: AI Agent OPERATING SYSTEM (both: build AND use agents, with dashboard)
```

ElizaOS = engine. OpenClaw = car. **Agentik OS = the whole highway system.**

---

## THE SYNTHESIS: What Makes Agentik OS Unique

Nobody has ALL of these together:

```
+--------------------------------------------------+
|                                                    |
|  1. One-line install (Docker)        ✅ AtomicBot  |
|  2. Beautiful dashboard              ✅ LobeChat   |
|  3. Multi-model + smart routing      ✅ NEW        |
|  4. Multi-channel (Telegram+)        ✅ OpenClaw   |
|  5. MCP ecosystem (visual)           ✅ NEW        |
|  6. Skill store (secure)             ✅ ClawHub+   |
|  7. Multi-agent orchestration        ✅ Claude Code |
|  8. Persistent searchable memory     ✅ NEW        |
|  9. Cost tracking + budgets          ✅ NEW        |
|  10. Cron + webhooks + events        ✅ n8n        |
|  11. Supabase/Convex backend options ✅ NEW        |
|  12. Open source (MIT)               ✅ OpenClaw   |
|                                                    |
|  ALL IN ONE PACKAGE = AGENTIK OS                     |
|                                                    |
+--------------------------------------------------+
```

**The thesis:** Everyone does 2-3 of these well. Nobody does all 12. That's our gap.

---

*Created: 2026-02-13*
