# AGENTIK OS - Backend Pricing Analysis (Real Numbers)

> Brutal honest pricing comparison for the backend layer.

---

## TL;DR VERDICT

| Situation | Recommendation | Why |
|-----------|---------------|-----|
| **MVP / Solo dev** | Convex Free | $0, vector search built-in, realtime native |
| **Growing product** | Convex Pro | $25/mo, everything integrated |
| **Large team (3+ devs)** | Supabase Pro | $25/mo flat (no per-seat) |
| **Maximum cheap** | Self-hosted Hetzner | $4.50/mo but ops burden |
| **SaaS at scale** | Convex Pro or Supabase Pro | $75-140/mo for 100 users |

---

## Monthly Cost by Usage Tier

| Provider & Plan | Solo ($0 budget) | Power User | Small Team (5) | SaaS (100 users) |
|-----------------|------------------|------------|----------------|-------------------|
| **Supabase Free** | **$0** | $0* | Not viable | Not viable |
| **Supabase Pro** | $25 | $25 | $25-30 | **$95-140** |
| **Convex Free** | **$0** | $0-2 | Not viable | Not viable |
| **Convex Pro** | $25 | $25 | $25-55** | **$75-150** |
| **Neon + Clerk + Pusher** | $0 | $0-7 | $15-30 | $110-135 |
| **Self-hosted Hetzner** | $4.50 | $4.50 | $8-12 | $15-20 |

*\* Supabase Free pauses projects after 7 days idle - BAD for always-on agents*
*\*\* Convex Pro = $25/developer/month (scales with team)*

---

## What Each Tier Actually Consumes

| Metric | Solo | Power | Small Team | SaaS |
|--------|------|-------|------------|------|
| Messages/month | 3,000 | 15,000 | 60,000 | 1,500,000 |
| DB storage | ~50 MB | ~500 MB | ~2 GB | ~50 GB |
| Vector embeddings | ~5K | ~30K | ~100K | ~2M |
| Realtime connections | 1-2 | 3-5 | 10-20 | 200-500 |
| Edge/function calls | ~10K | ~100K | ~500K | ~10M |
| File storage | ~100 MB | ~500 MB | ~2 GB | ~50 GB |
| Bandwidth | ~1 GB | ~5 GB | ~20 GB | ~500 GB |

---

## Feature Completeness (This Matters Most)

| Feature Agentik OS Needs | Supabase | Convex | Neon | Turso | Self-hosted |
|------------------------|----------|--------|------|-------|-------------|
| Relational DB | Postgres | Document DB | Postgres | SQLite | Postgres |
| Vector search | pgvector | **Built-in** | pgvector | No | pgvector |
| Realtime subscriptions | Add-on layer | **Core feature** | No | No | Build yourself |
| Auth | GoTrue (mature) | Beta | No (need Clerk) | No | Build yourself |
| File storage | S3-compatible | Built-in | No | No | Build yourself |
| Edge functions | Deno runtime | Actions | No | No | Build yourself |
| Cron/scheduled | pg_cron | Built-in | No | No | System cron |
| **Services to manage** | **1** | **1** | **4-5** | **4-5** | **1 (ops heavy)** |

---

## Why Convex Wins for Agentik OS

1. **Vector search is first-class** - Dedicated storage/bandwidth, not eating your regular DB
2. **Realtime is the core architecture** - Every query is reactive by default (perfect for dashboard)
3. **Functions integrated** - Mutations, actions, crons all count toward one pool
4. **TypeScript-native** - Same language as our runtime, no SQL translation layer
5. **$0 to start** - Free tier handles solo user perfectly

### Convex Downsides (Honest)

1. **Per-seat pricing** - 5 devs = $125/mo in seats before usage
2. **No SQL** - Learning curve if you're SQL-native
3. **Vendor lock-in** - Harder to migrate than Postgres
4. **Auth is beta** - Might need Clerk anyway
5. **Newer platform** - Less battle-tested than Postgres/Supabase

---

## Why Supabase is the Backup Plan

1. **Flat pricing** - $25/mo regardless of team size
2. **Raw Postgres** - SQL ecosystem, pgvector, pg_cron, PostgREST
3. **Mature auth** - Production-ready, well-documented
4. **Clerk integration** - Battle-tested combo
5. **Self-host option** - Can run Supabase on your own infra

### Supabase Downsides (Honest)

1. **Realtime costs** - $2.50/1M messages adds up at scale ($62.50/mo for SaaS tier)
2. **Vectors compete with DB** - pgvector queries share Postgres resources
3. **Free tier pauses** - 7 days idle = project paused (bad for agents)
4. **Edge functions are Deno** - Not Node/Bun compatible, separate runtime

---

## RECOMMENDATION FOR AGENTIK OS

### The Hybrid Strategy (Best of Both Worlds)

```
DEFAULT: SQLite (local, zero deps, works offline)
    |
    +-- Works for: self-hosted solo users
    |
UPGRADE PATH 1: Convex (recommended for cloud)
    |
    +-- Works for: cloud users, teams, real-time dashboard
    |
UPGRADE PATH 2: Supabase (alternative for SQL lovers)
    |
    +-- Works for: teams, enterprise, SQL-native devs
```

### Why This Works

- **Free users** get SQLite - zero cost, zero deps, works on any VPS
- **Cloud users** pick Convex (our recommendation) or Supabase (their choice)
- **We abstract the backend** behind an interface - swap without code changes
- **Never locked in** - user can migrate between backends

### Implementation Priority

| Phase | Backend | Who Uses It |
|-------|---------|-------------|
| Phase 0 (MVP) | SQLite + Chroma | Self-hosted users |
| Phase 1 | + Convex adapter | Cloud users |
| Phase 2 | + Supabase adapter | SQL-loving users |
| Phase 3 | + Self-hosted Postgres | Enterprise users |

---

## AGENTIK OS SaaS Pricing Model

Based on the backend costs, here's what we should charge:

| Plan | What User Gets | Our Backend Cost | Our Price | Margin |
|------|---------------|-----------------|-----------|--------|
| **Free** | Self-hosted, BYO keys | $0 | **$0** | N/A |
| **Starter** | Cloud, 3 modes, 10 agents | ~$2-5/user | **$19/mo** | ~75% |
| **Pro** | Cloud, all modes, unlimited | ~$5-10/user | **$49/mo** | ~80% |
| **Team** | Cloud, 5 users, shared | ~$15-25/team | **$99/mo** | ~75% |
| **Enterprise** | Custom, SSO, audit | ~$50-100 | **$299+/mo** | ~65% |

**Note:** These margins assume Convex Pro as backend. AI model costs (Claude, GPT) are NOT included - users bring their own API keys or we add usage-based AI billing.

### AI Cost Pass-through Option

For users who don't want to manage API keys:

| AI Tier | What They Get | Our Markup | Price |
|---------|-------------|-----------|-------|
| **BYO Keys** | Use their own Claude/GPT keys | 0% | $0 |
| **Panda AI Basic** | 100K tokens/day (Haiku/Flash) | 30% | +$9/mo |
| **Panda AI Pro** | 500K tokens/day (Sonnet/GPT-4.1) | 30% | +$29/mo |
| **Panda AI Unlimited** | Unlimited (smart routing) | 30% | +$99/mo |

---

## 12-Month Cost Projection (Our Infrastructure)

Assuming we grow from 0 to 500 users over 12 months:

| Month | Users | Backend (Convex) | AI passthrough | Revenue | Profit |
|-------|-------|------------------|----------------|---------|--------|
| 1-3 | 0-50 | $0 (free tier) | $0 | $0-500 | ~$500 |
| 4-6 | 50-150 | $25-50 | $200-500 | $2K-5K | ~$3K |
| 7-9 | 150-300 | $50-100 | $500-1K | $5K-12K | ~$8K |
| 10-12 | 300-500 | $100-200 | $1K-3K | $12K-20K | ~$15K |

**First year: $0-200/mo in backend costs. Revenue potential: $0-20K/mo.**

---

*Created: 2026-02-13*
*Based on: Real pricing research from Supabase, Convex, Neon, Turso, PlanetScale, Railway, Hetzner*
