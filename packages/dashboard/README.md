# Agentik OS Dashboard

Next.js 16 dashboard for managing AI agents, monitoring costs, and orchestrating autonomous workflows.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Backend:** Convex (real-time database)
- **UI:** shadcn/ui + Tailwind CSS
- **Language:** TypeScript 5.7

## Setup

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Initialize Convex Backend

**⚠️ BLOCKING STEP - Requires interactive terminal access**

```bash
# From monorepo root
npx convex dev
```

This will:
- Prompt you to login to Convex
- Create/link a Convex project
- Deploy the schema from `convex/`
- Generate type-safe client code in `convex/_generated/`
- Output a deployment URL

### 3. Configure Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Update `NEXT_PUBLIC_CONVEX_URL` with the URL from `npx convex dev` output:

```env
NEXT_PUBLIC_CONVEX_URL=https://your-project.convex.cloud
```

### 4. Run Development Server

```bash
pnpm dev
```

Dashboard will be available at `http://localhost:3000`

## Project Structure

```
packages/dashboard/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout with ConvexProvider
│   ├── page.tsx                # Redirects to /dashboard
│   └── dashboard/              # Dashboard pages
│       ├── page.tsx            # Overview (stats, recent agents, costs)
│       ├── agents/             # Agent management
│       ├── costs/              # Cost tracking
│       ├── skills/             # Skills management
│       ├── automations/        # Workflow automation
│       ├── channels/           # Communication channels
│       ├── memory/             # Conversation history
│       └── settings/           # Settings
├── components/
│   ├── dashboard/              # Dashboard-specific components
│   │   ├── sidebar.tsx         # Main navigation
│   │   └── topnav.tsx          # Top bar with breadcrumbs
│   ├── providers/
│   │   └── convex-provider.tsx # Convex client provider
│   └── ui/                     # shadcn/ui components (18 total)
├── lib/
│   ├── convex.ts               # Convex client wrapper (isolates type errors)
│   └── utils.ts                # Utility functions
└── convex/                     # (in monorepo root, not here)
```

## Convex Integration

### Current Status

✅ **Structure Complete** - All Convex code written and ready
⏳ **Awaiting Initialization** - Needs `npx convex dev` to generate types

### Type Errors (Expected)

Until Convex is initialized, you'll see import errors in `lib/convex.ts`:

```typescript
// @ts-expect-error - TODO: Remove after npx convex dev generates types
import { api } from "../../../convex/_generated/api";
```

This is **intentional** and follows Guardian-approved isolation strategy. Once `npx convex dev` runs, all type errors will auto-resolve.

### Real-Time Queries

Dashboard uses Convex `useQuery` hooks for automatic real-time updates:

```typescript
// Example: Agents page
const agents = useQuery(api.queries.agents.list, {});
// Automatically re-renders when agents change in database
```

### Pages Using Convex

| Page | Queries Used | Features |
|------|-------------|----------|
| `/dashboard` | `agents.stats`, `agents.list`, `costs.summary` | Overview stats, recent agents, cost breakdown |
| `/dashboard/agents` | `agents.list` | Full agent list with real-time status |
| `/dashboard/costs` | `costs.summary`, `agents.stats` | Cost tracking by model, time period |

## Features

### Dashboard Overview
- Real-time agent statistics (active, total, messages)
- Monthly cost tracking
- Recent agents list
- Cost breakdown by model

### Agent Management
- List all agents with status indicators
- Real-time agent status updates
- Agent creation/editing (UI ready, mutations available)

### Cost X-Ray
- Monthly, daily, and all-time cost tracking
- Cost breakdown by AI model
- Average cost per agent
- Real-time cost updates

## Development

### Type-Check

```bash
pnpm type-check
```

**Note:** Will show Convex import errors until `npx convex dev` is run. This is expected.

### Build

```bash
pnpm build
```

### Lint

```bash
pnpm lint
```

## Next Steps

Once Convex is initialized:

1. ✅ Type errors will auto-resolve
2. ✅ Dashboard will connect to real database
3. ✅ Real-time updates will work
4. ✅ Agent CRUD operations will be functional

## Documentation

- **Convex Backend:** See `convex/README.md` in monorepo root
- **Architecture:** See `docs/ARCHITECTURE.md` in monorepo root
- **PRD:** See `docs/PRD.md` in monorepo root

---

**Status:** ✅ Dashboard structure complete, awaiting Convex initialization
**Last Updated:** 2026-02-14
