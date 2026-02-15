# Agentik OS - Power Tools Integration

> **Two tools that make Agentik OS insanely powerful: /last30days and /forge**

---

## /last30days - Real-Time Community Intelligence

### What It Is

A research agent that scans Reddit and X/Twitter from the **last 30 days**, finding what the community is actually discussing, upvoting, and recommending right now.

**2.4K+ GitHub stars** | By mvanhorn | MIT License

### The Problem It Solves

AI agents have knowledge cutoffs. Even with recent training:
- Can't know what prompt techniques were discovered last week
- Can't see which tools the community recommends this month
- Can't track trending discussions or breaking news
- Answers based on 6-month-old data

### How It Works

```
/last30days [topic]

  Phase 1: RESEARCH
    → Scan Reddit (OpenAI Responses API)
    → Scan X/Twitter (xAI API or Bird CLI)
    → Strict 30-day recency window
    → Popularity-weighted ranking (upvotes, likes, reposts)

  Phase 2: SYNTHESIS
    → Cross-validate sources between platforms
    → Identify consensus, disagreements, trends
    → Extract actionable insights

  Phase 3: DELIVERY
    → "What I learned" summary with @handle citations
    → Stats box (threads, upvotes, top voices)
    → 2-3 follow-up suggestions
    → Copy-paste-ready prompts (if relevant)
```

### Agentik OS Integration

```yaml
# As an agent skill in any OS Mode
agents:
  - name: researcher
    skills:
      - last30days          # Real-time community intelligence
      - web-search          # Broader web search
      - context7            # Library documentation

    use_cases:
      - "What's the best way to do X right now?"
      - "What are people saying about Y?"
      - "Latest trends in Z"
```

### Why It Matters for Agentik OS

| Without /last30days | With /last30days |
|--------------------|-----------------|
| Agent recommends outdated tools | Agent knows what's trending THIS WEEK |
| Generic "best practices" | Community-validated techniques with engagement proof |
| No social proof | "@user (4.2K upvotes) recommends..." |
| Static knowledge | Dynamic, always-current intelligence |

### Examples in Each OS Mode

| Mode | Query | Value |
|------|-------|-------|
| **Dev OS** | `/last30days best React state management` | What devs are ACTUALLY choosing in 2026 |
| **Marketing OS** | `/last30days AI marketing tools SaaS` | What marketers are buzzing about |
| **Business OS** | `/last30days best CRM for startups` | Real user recommendations, not ads |
| **Learning OS** | `/last30days system design interview prep` | Latest study techniques that work |
| **Human OS** | `/last30days best productivity apps` | What's actually helping people |
| **Security OS** | `/last30days new CVE vulnerabilities` | Latest security discussions |

### Modes

```bash
/last30days topic                    # Standard (20-30 sources/platform)
/last30days topic --quick            # Fast (8-12 sources, ~1 min)
/last30days topic --deep             # Comprehensive (50-70 sources, ~5 min)
/last30days topic --days=7           # Last 7 days only
```

### Requirements

| API | Required? | Cost |
|-----|----------|------|
| OpenAI API key | Yes (for Reddit) | ~$0.01-0.05/search |
| xAI API key | Optional | ~$0.01-0.03/search |
| Bird CLI | Alternative to xAI (FREE) | $0 |

---

## /forge - From Idea to Working MVP

### What It Is

A complete project creation system that goes from **idea to working MVP** autonomously. FORGE v5.0 "Team Forge" spawns an AI team to build the entire application.

### The Complete Journey

```
/forge
  │
  ├── Phase 1: DEEP DISCOVERY (30-60 min)
  │     AI-driven exploration of your idea
  │     Output: Complete PRD
  │
  ├── Phase 2: SMART STACK (10-20 min)
  │     Feature-to-tool mapping
  │     Next.js + Convex + Clerk + Stripe (smart defaults)
  │     50+ specialized tool options
  │
  ├── Phase 3: SCAFFOLDING (5-10 min)
  │     Full project structure created
  │     All dependencies installed
  │     Auth, payments, DB configured
  │
  ├── Phase 4: BUILD MODE CHOICE
  │     ├── Team Build (RECOMMENDED) → AI team builds everything
  │     └── Manual Handoff → You build with /ralph
  │
  ├── Phase 5: TEAM BUILD (autonomous)
  │     Smart auto-sizing (3-8 agents)
  │     Task DAG with file ownership
  │     Parallel execution
  │     Guardian (Opus) quality gate
  │
  ├── Phase 6: AUTO QA
  │     MANIAC v5 tests all user stories
  │     Fix → re-test loop
  │     Guardian final sign-off
  │
  └── Phase 7: DELIVERY
        Git commit, Telegram notification
        Working MVP at localhost:PORT
```

### Team Auto-Sizing

FORGE calculates optimal team based on project complexity:

```
Score = features × 1.0 + pages × 0.5 + integrations × 2.0
      + ai_features × 3.0 + realtime × 2.0 + payments × 1.5
```

| Score | Team | Agents |
|-------|------|--------|
| 1-8 | Small | builder + designer + guardian |
| 9-15 | Basic | backend + frontend + integrator + guardian |
| 16-25 | Full | backend + frontend + ai-dev + designer + guardian |
| 26-35 | Complex | architect + backend + frontend + ai-dev + designer + guardian |
| 36+ | Enterprise | 7-8 specialized agents |

### Agent Roles

| Role | Model | Does |
|------|-------|------|
| **architect** | Opus | Designs interfaces, resolves blockers |
| **backend** | Sonnet | Schema, queries, mutations, API |
| **frontend** | Sonnet | Pages, components, responsive |
| **ai-dev** | Sonnet | AI features, prompts, RAG |
| **designer** | Sonnet | Landing pages, animations |
| **integrator** | Sonnet | Stripe, email, webhooks |
| **guardian** | Opus | **Verifies everything, veto power** |

### Why It Matters for Agentik OS

FORGE is the **ultimate proof of concept** for Agentik OS:

```
"Here's my SaaS idea"
  → /forge
  → 4-8 hours later
  → Working MVP with auth, payments, AI, landing page
  → $3-10 in API costs
```

This IS the future of software development. Agentik OS enables it.

### FORGE vs ShipFast vs Others

| Feature | ShipFast ($199) | create-t3-app | **FORGE (FREE)** |
|---------|----------------|---------------|-----------------|
| Price | $199 | Free | **Free** |
| Customization | Template-locked | Manual | **AI-driven discovery** |
| AI features | None | None | **Built-in (Vercel AI SDK)** |
| Autonomous build | No | No | **Yes (AI team)** |
| QA included | No | No | **Yes (MANIAC v5)** |
| Time to MVP | 2-5 days | 1-3 days | **4-8 hours** |

### Full Stack Options

FORGE supports 50+ specialized tools via feature-to-tool mapping:

| Need | Tool Options |
|------|-------------|
| AI/LLM | Vercel AI SDK, Anthropic, OpenAI, Google, Ollama |
| Email | Resend, Mailgun, SendGrid, Postmark |
| SMS/WhatsApp | Twilio, Baileys |
| Background Jobs | Inngest, Trigger.dev |
| File Storage | Uploadthing, Cloudinary, S3 |
| Analytics | PostHog, Plausible |
| Vector DB | Pinecone, Weaviate |
| Search | Algolia, Meilisearch |
| CMS | Sanity, Payload, MDX |

---

## How They Combine in Agentik OS

### The Ultimate Workflow

```
Step 1: Research with /last30days
  "What AI features are SaaS users asking for in 2026?"
  → Community intelligence: "Everyone wants AI agents, not chatbots"

Step 2: Build with /forge
  "Build a SaaS with AI agent capabilities"
  → Full discovery → PRD → Team builds MVP → QA passes

Step 3: Secure with Security OS
  → Nuclei scan → Semgrep audit → Secret check → All clear

Step 4: Launch with Marketing OS
  → Landing page copy → Social media → Email sequence → Go live

Step 5: Monitor with Business OS
  → Sales tracking → Customer support → Analytics → Growth
```

**From research to revenue in 48 hours.** That's the Agentik OS promise.

---

### Installation Status

| Tool | Status | Path |
|------|--------|------|
| /forge | Installed | `/home/hacker/.claude/commands/forge.md` |
| /forge team-build | Installed | `/home/hacker/.claude/commands/forge-team-build.md` |
| /forge auto-qa | Installed | `/home/hacker/.claude/commands/forge-auto-qa.md` |
| /last30days | **To install** | `github.com/mvanhorn/last30days-skill` |

### Install /last30days

```bash
git clone https://github.com/mvanhorn/last30days-skill.git ~/.claude/skills/last30days
mkdir -p ~/.config/last30days
echo "OPENAI_API_KEY=sk-..." > ~/.config/last30days/.env
chmod 600 ~/.config/last30days/.env

# Optional: Free X/Twitter search
npm install -g @steipete/bird
bird login
```

---

*Created: 2026-02-13*
*Sources: mvanhorn/last30days-skill (2.4K stars), FORGE v5.0 docs*
