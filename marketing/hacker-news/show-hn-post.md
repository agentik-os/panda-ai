# Hacker News - Show HN Post

**Title:** Show HN: Agentik OS – Self-hosted multi-model AI agent platform

**URL:** https://github.com/agentik-os/agentik-os

---

## Post Content

```
Hi HN!

I'm [Your Name], and I built Agentik OS - a self-hosted AI agent platform with multi-model routing.

**Why I Built This:**

I love OpenClaw (191K stars), but I wanted:
1. Multi-model support (Claude, GPT-5, Gemini, Ollama)
2. Transparent cost tracking (X-Ray view of $ per message)
3. Modern UX (Next.js 16 + shadcn/ui)
4. Enterprise features (RBAC, SSO, audit logs)

**What It Does:**

Agentik OS is an "operating system" for AI agents. You can:
- Create agents with different AI models
- Let the router pick the best model automatically (complexity scoring 0-100)
- See exact costs for every message
- Use 500+ tools via MCP (Model Context Protocol)
- Switch between "OS Modes" (Focus, Research, Build, Debug, etc.)
- Enable "Agent Dreams" (background processing while you sleep)

**Tech Stack:**

- Turborepo monorepo (5 packages)
- TypeScript strict mode
- Next.js 16 (App Router + shadcn/ui)
- Convex (real-time backend)
- Bun runtime
- WASM sandboxing (Extism) for security
- 308 passing tests (16 E2E + 292 unit)

**Architecture:**

9-stage message pipeline:
1. Normalize - Clean input
2. Route - Pick agent
3. Load Memory - Retrieve context
4. Model Select - Choose AI model (complexity-based)
5. Tool Resolution - Load required skills
6. Execute - Call AI with tools
7. Save Memory - Store conversation
8. Track Cost - Log $ and tokens
9. Send Response - Deliver to user

**Interesting Challenges:**

1. **Multi-model routing** - I built a complexity scorer (0-100) that analyzes messages for code blocks, technical terms, length, etc. Simple questions go to Haiku ($0.25/1M tokens), complex ones to Opus ($15/1M tokens). Saves ~60% on costs.

2. **Real-time cost tracking** - Every AI call logs tokens + cost to Convex. The dashboard shows live updates via WebSocket. Users love seeing "$0.0023" next to each message.

3. **WASM sandboxing** - Skills run in Extism WASM containers. Even if a skill is malicious, it can't access the file system or network (unless explicitly granted). Security-first design.

4. **Agent Dreams** - Inspired by human sleep, agents can process memories overnight. They consolidate learnings, extract entities, update knowledge graphs. Users wake up to smarter agents.

**vs OpenClaw:**

I respect OpenClaw deeply (they pioneered this category), but we differentiate on:
- Multi-model vs Claude-only
- Cost transparency vs hidden costs
- Modern UI vs legacy interface
- Enterprise features vs basic

Both are great. OpenClaw for simplicity, Agentik OS for flexibility.

**Open Source:**

100% Apache 2.0 licensed. Free forever for self-hosting. Revenue model: Marketplace takes 30% of skill sales (70/30 split with creators).

**Try It:**

```bash
git clone https://github.com/agentik-os/agentik-os
pnpm install && pnpm build
pnpm --filter @agentik-os/cli exec panda init
pnpm --filter @agentik-os/cli exec panda chat MyAgent
```

**Docs:** https://docs.agentik.dev
**Discord:** https://discord.gg/agentik

**Goal:** 100K GitHub stars in 12 months 🎯

Happy to answer any questions!
```

---

## Submission Guidelines

### Best Time to Post
- **Tuesday-Thursday** (best engagement)
- **8-10 AM PT** (when HN is most active)
- **Avoid Monday** (too many submissions)
- **Avoid Friday** (weekend coming up)

### Title Rules
- Max 80 characters
- Must start with "Show HN:"
- Clear, concise, no clickbait
- Include key differentiator ("multi-model", "self-hosted")

### What Works on HN

✅ **Good:**
- Technical depth
- Honest comparisons
- Open source
- Self-hosted
- Actual innovation
- Humble tone
- Engaging with comments

❌ **Bad:**
- Marketing speak
- Overpromising
- Ignoring comments
- Defensive responses
- Closed source SaaS pitches

---

## Comment Response Strategy

### Technical Questions
```
Great question!

[Detailed technical answer with code/architecture]

Here's the relevant code: [GitHub link]

Let me know if you want more details on [specific aspect]!
```

### Criticism/Concerns
```
Thanks for the feedback!

You're absolutely right about [valid point].

Here's how we're addressing it: [solution/roadmap]

We're early and learning - appreciate the constructive criticism!
```

### Feature Requests
```
Love this idea!

I've created an issue: [GitHub link]

Would you be interested in contributing? (Or beta testing when we build it?)
```

### Comparisons
```
Good question. Here's my honest take:

[Product X]: Great for [use case], but [limitation]
Agentik OS: Built for [different use case], with [advantage]

Both have their place. We're trying to solve [specific problem].
```

---

## Success Metrics

### Target Goals
- 100+ points
- 50+ comments
- Front page for 6+ hours
- Top 5 on Show HN
- +500 GitHub stars
- +1000 website visits

### Tracking
- HN ranking: Check every 30 minutes
- GitHub stars: Monitor live
- Website analytics: Track referrals
- Comment count: Respond to ALL

---

## Follow-Up Plan

### If It Goes Well (>100 points)
- Share on Twitter/LinkedIn
- Write blog post about the launch
- Engage deeply with commenters
- Build relationships with interested users
- Plan follow-up posts (e.g., "How we built X")

### If It Doesn't Get Traction (<50 points)
- Analyze what didn't resonate
- Learn from feedback
- Plan better next launch
- Consider timing/title adjustments
- Don't spam - wait 2-3 months to repost

---

## Related Subreddits (Cross-Post)

After HN success, share to:
- r/programming
- r/selfhosted
- r/opensource
- r/MachineLearning
- r/artificial
- r/ChatGPT

---

**Status:** Ready to post after deployment
**Timing:** 2-3 days after Product Hunt launch
**Owner:** Launch Coordinator
