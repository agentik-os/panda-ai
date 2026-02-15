# Agentik OS - CLAUDE.md

> **Project Context for Claude Code and AI Agents**

---

## Project Overview

**Agentik OS** is an AI Agent Operating System built to compete with and surpass OpenClaw (191K GitHub stars).

**Current Status:** 🏗️ Being built by FORGE v5.1 Team Build (7 agents)

## Documentation

**All project documentation is in `/docs`:**

| Document | Purpose |
|----------|---------|
| **docs/PRD.md** | Product Requirements (2,261 lines) |
| **docs/ARCHITECTURE.md** | Technical Architecture (825 lines) |
| **docs/step.json** | 261 Implementation Steps (4,556 lines) |
| **docs/USER-GUIDE.md** | End-User Guide (801 lines) |
| **docs/COMPETITIVE-ADVANTAGE.md** | vs OpenClaw Analysis |
| **+27 more docs** | Complete strategy, security, features |

## Implementation Plan

**Source:** `docs/step.json`

| Phase | Steps | Hours | Focus |
|-------|-------|-------|-------|
| 0 | 40 | 390h | Foundation (monorepo, runtime, CLI) |
| 1 | 30 | 398h | Core Features (dashboard, model router, memory) |
| 2 | 30 | 516h | Advanced (marketplace, OS modes, cost tracking) |
| 3 | 23 | 364h | Enterprise (scaling, security, compliance) |
| 4 | 138 | 2,502h | Community (skills, docs, marketplace content) |
| **TOTAL** | **261** | **4,170h** | **~8.7 months (3 devs)** |

## Tech Stack

```
Monorepo (Turborepo + pnpm):
├── packages/runtime/       # Core agent runtime (Bun + TypeScript)
├── packages/dashboard/     # Web UI (Next.js 16 + shadcn/ui)
├── packages/cli/           # CLI tool (panda ...)
├── packages/sdk/           # Skill builder SDK
└── packages/shared/        # Shared types + utils

Backend: Convex (local dev + cloud prod + real-time)
Frontend: Next.js 16 App Router + shadcn/ui + Tailwind
Security: WASM (Extism), gVisor, Kata Containers
AI: Claude, GPT-5, Gemini, Ollama (multi-model router)
```

## For FORGE Team Agents

### Your Mission

Build Agentik OS by following `docs/step.json` exactly (261 steps).

### File Ownership

| Agent | OWNS (can edit) |
|-------|-----------------|
| **runtime-backend** | packages/runtime/**, Convex schema |
| **dashboard-frontend** | packages/dashboard/**, Next.js pages |
| **cli-sdk** | packages/cli/**, packages/sdk/** |
| **channels-integrations** | packages/runtime/channels/**, MCP |
| **testing-qa** | **/tests/**, docs/**, CI/CD |
| **architect** | (read-only) Reviews, resolves blockers |
| **guardian** | (read-only) Verifies everything |

### Workflow

1. Read docs/PRD.md, docs/ARCHITECTURE.md, docs/step.json
2. TaskList → Find available tasks  
3. TaskUpdate → Claim task (set owner)
4. Implement following step.json
5. pnpm type-check → 0 errors required
6. TaskUpdate → Mark complete
7. Message guardian for verification
8. Repeat

### Quality Bar

- 0 TypeScript errors
- 0 console errors
- Responsive (375px/768px/1440px)
- Tests passing
- Production-ready code

**Target: 100K GitHub stars in 12 months**

---

**FORGE v5.1 "Team Forge" - Autonomous AI Build**


<claude-mem-context>
# Recent Activity

### Feb 14, 2026

| ID | Time | T | Title | Read |
|----|------|---|-------|------|
| #4714 | 12:18 AM | ✅ | Build Progress Tracking File Initialized | ~464 |
| #4706 | 12:16 AM | ✅ | CLAUDE.md Project Context File Created for AI Agents | ~614 |
| #4705 | 12:15 AM | ✅ | Project README Created with Status and Feature Overview | ~507 |
</claude-mem-context>