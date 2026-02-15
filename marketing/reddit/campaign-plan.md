# Reddit Marketing Campaign

**Goal:** Drive awareness and GitHub stars from technical communities
**Duration:** 2 weeks post-launch
**Target:** +1000 GitHub stars, +2000 website visits

---

## Target Subreddits

### Tier 1: Primary Targets (Post First)

| Subreddit | Subscribers | Relevance | Strategy |
|-----------|-------------|-----------|----------|
| r/selfhosted | 500K+ | 🔥 High | Self-hosting angle |
| r/opensource | 200K+ | 🔥 High | OSS project |
| r/LocalLLaMA | 150K+ | 🔥 High | Ollama integration |
| r/MachineLearning | 3M+ | ⚡ Medium | Technical deep-dive |
| r/programming | 7M+ | ⚡ Medium | Architecture post |

### Tier 2: Secondary Targets

| Subreddit | Subscribers | Relevance | Strategy |
|-----------|-------------|-----------|----------|
| r/ChatGPT | 2M+ | ⚡ Medium | Multi-model angle |
| r/artificial | 500K+ | ⚡ Medium | AI platform |
| r/webdev | 1M+ | ⚡ Medium | Next.js stack |
| r/typescript | 200K+ | ⚡ Medium | TypeScript quality |
| r/homelab | 400K+ | ⚡ Medium | Self-hosting |

### Tier 3: Niche Communities

| Subreddit | Subscribers | Relevance | Strategy |
|-----------|-------------|-----------|----------|
| r/sideproject | 300K+ | ✅ Good | Project showcase |
| r/coolgithubprojects | 100K+ | ✅ Good | GitHub focus |
| r/reactjs | 500K+ | ✅ Good | Next.js tech |
| r/kubernetes | 150K+ | ✅ Good | Container deployment |

---

## Content Strategy

### Post Type 1: Technical Deep-Dive

**Best For:** r/programming, r/MachineLearning, r/typescript

**Title:** "I built a self-hosted AI agent OS with multi-model routing [Open Source]"

**Content:**
```
I spent [X months] building Agentik OS - a self-hosted AI agent platform with automatic model selection.

**The Problem:**
Most AI platforms lock you into one model. OpenClaw (191K stars) only supports Claude. I wanted multi-model routing with cost optimization.

**The Solution:**
Agentik OS analyzes each message's complexity (0-100 score) and picks the cheapest capable model:
- Simple questions → Haiku ($0.25/1M tokens)
- Medium complexity → Sonnet ($3/1M tokens)
- Hard problems → Opus ($15/1M tokens)

This saves ~60% on AI costs.

**Architecture:**

9-stage message pipeline:
1. Normalize
2. Route
3. Load Memory
4. Model Select (complexity scorer)
5. Tool Resolution
6. Execute
7. Save Memory
8. Track Cost
9. Send Response

**Tech Stack:**
- Turborepo monorepo
- TypeScript strict mode (0 errors)
- Next.js 16 + shadcn/ui
- Convex real-time backend
- WASM sandboxing (Extism)
- 308 passing tests

**Interesting Bits:**

*Complexity Scorer:*
```typescript
export function scoreComplexity(message: string): number {
  let score = 0;

  // Base score from length
  score += Math.min(message.length / 100, 30);

  // Code blocks (+20)
  if (/```/.test(message)) score += 20;

  // Technical terms (+15)
  const techTerms = ['algorithm', 'optimize', 'architecture'];
  if (techTerms.some(t => message.includes(t))) score += 15;

  // Questions (-10, usually simpler)
  if (message.includes('?')) score -= 10;

  return Math.max(0, Math.min(100, score));
}
```

*Real-time Cost Tracking:*
Every AI call logs to Convex. Dashboard updates via WebSocket. Users see "$0.0023" next to each message.

*Agent Dreams:*
While you sleep, agents consolidate memories, extract entities, update knowledge graphs. Wake up to a smarter agent.

**Open Source:**
100% Apache 2.0. Free forever for self-hosting.

**Try It:**
```bash
git clone https://github.com/agentik-os/agentik-os
pnpm install && pnpm build
pnpm --filter @agentik-os/cli exec panda init
```

**GitHub:** https://github.com/agentik-os/agentik-os
**Docs:** https://docs.agentik.dev

Happy to answer technical questions!
```

---

### Post Type 2: Self-Hosting Focus

**Best For:** r/selfhosted, r/homelab

**Title:** "Self-hosted AI agent platform with multi-model routing (OpenClaw alternative)"

**Content:**
```
I love self-hosting, so I built Agentik OS - a self-hosted AI agent platform you can run on your homelab.

**Why Self-Host?**
- Full data control (no cloud lock-in)
- Use your own API keys
- Local models via Ollama
- No subscription fees
- Enterprise security on your infrastructure

**Features:**
- Multi-model routing (Claude, GPT, Gemini, Ollama)
- Cost transparency (X-Ray view of $ per message)
- Real-time dashboard (Next.js 16)
- 500+ tools via MCP
- WASM sandboxing for security
- 10 OS Modes (Focus, Research, Build, etc.)

**Deployment:**

*Docker Compose:*
```yaml
version: '3.8'
services:
  agentik-os:
    image: agentik/agentik-os:latest
    ports:
      - "3000:3000"
    environment:
      - ANTHROPIC_API_KEY=your_key
      - OPENAI_API_KEY=your_key
    volumes:
      - ./data:/app/data
```

*Or Self-Build:*
```bash
git clone https://github.com/agentik-os/agentik-os
pnpm install && pnpm build
pnpm start
```

**Hardware Requirements:**
- Minimum: 2GB RAM, 2 CPU cores
- Recommended: 4GB RAM, 4 CPU cores
- Storage: 1GB for app, varies for memory/logs

**vs OpenClaw:**
Both are great self-hosted options. OpenClaw for simplicity, Agentik OS for multi-model + modern UX.

**GitHub:** https://github.com/agentik-os/agentik-os

Questions about self-hosting? Happy to help!
```

---

### Post Type 3: Show & Tell

**Best For:** r/sideproject, r/coolgithubprojects

**Title:** "I built an AI agent OS in [X months] - 100% open source"

**Content:**
```
Project: Agentik OS
Time: [X months]
Stack: TypeScript, Next.js, Convex
GitHub: https://github.com/agentik-os/agentik-os

**What It Does:**
Self-hosted AI agent platform with multi-model routing. Think "OpenClaw but supports Claude, GPT, Gemini, and Ollama".

**Cool Features:**
- Automatic model selection (complexity scoring)
- Real-time cost tracking (see $ per message)
- Agent Dreams (background processing while you sleep)
- Time Travel Debug (replay conversations)
- 10 OS Modes (Focus, Research, Build, etc.)

**Stats:**
- 50,000+ lines of code
- 308 passing tests
- 0 TypeScript errors
- Built by 7 AI agents using FORGE v5.1

**What I Learned:**
[Share 3-5 key learnings from building it]

**Try It:**
```bash
git clone https://github.com/agentik-os/agentik-os
pnpm install && pnpm build
pnpm --filter @agentik-os/cli exec panda chat
```

Feedback welcome!
```

---

## Posting Schedule

### Week 1
- **Day 1:** r/selfhosted (self-hosting angle)
- **Day 2:** r/opensource (OSS project)
- **Day 3:** r/LocalLLaMA (Ollama integration)
- **Day 4:** r/programming (technical deep-dive)
- **Day 5:** r/sideproject (show & tell)

### Week 2
- **Day 1:** r/MachineLearning (ML focus)
- **Day 2:** r/webdev (Next.js stack)
- **Day 3:** r/typescript (TypeScript quality)
- **Day 4:** r/ChatGPT (multi-model angle)
- **Day 5:** r/coolgithubprojects (GitHub focus)

---

## Engagement Rules

### ✅ Do:
- Respond to ALL comments
- Be humble and helpful
- Share technical details
- Accept criticism gracefully
- Provide value in responses
- Cross-post to related subreddits (with different angles)

### ❌ Don't:
- Spam the same post everywhere
- Ignore criticism
- Be defensive
- Over-promote
- Post more than once per week to same subreddit
- Use the same title/content for every post

---

## Success Metrics

### Per Post
- 100+ upvotes (good)
- 50+ comments (engaging)
- 10+ direct GitHub stars
- 5+ quality discussions

### Campaign Total
- 1000+ total upvotes
- 500+ comments
- +1000 GitHub stars
- +2000 website visits
- 50+ Discord joins

---

## Crisis Management

### If Downvoted
- Check if content doesn't fit subreddit
- Engage with critical comments
- Learn for next post
- Don't delete (looks bad)

### If Accused of Self-Promotion
```
You're right, this is self-promotion.

I genuinely think r/[subreddit] would be interested because [reason].

I'm here to engage and answer questions, not just drive traffic.

Happy to delete if mods feel it doesn't fit!
```

### If Called Out vs OpenClaw
```
I have huge respect for OpenClaw - they pioneered this category.

We're not "better" - we're different:
- OpenClaw: Claude-only, simpler
- Agentik OS: Multi-model, more features

Both are great for different use cases. Users should pick what fits their needs.
```

---

## Post-Campaign Analysis

### Metrics to Track
- Total upvotes by subreddit
- Comment engagement rate
- GitHub star velocity
- Website visit sources
- Discord join sources

### Questions to Answer
- Which subreddits performed best?
- Which content angle resonated most?
- What criticisms came up repeatedly?
- What features did people request most?
- How can we improve next campaign?

---

**Status:** Ready to execute post-deployment
**Duration:** 2 weeks
**Owner:** Launch Coordinator
