# Agentik OS - Skills Ecosystem Strategy

> **57,000+ skills already exist. We don't build them. We absorb them.**

---

## The Insight

The AI agent skills ecosystem is exploding:

| Source | Skills Available | Format |
|--------|-----------------|--------|
| **skills.sh** (Vercel) | 57,025+ | SKILL.md (markdown + YAML frontmatter) |
| **claude-ads** | 12 specialized | Claude Code skills (markdown) |
| **MCP Registry** | 1,000+ | MCP servers (JSON-RPC) |
| **Composio** | 500+ | MCP gateway (OAuth managed) |
| **Community repos** | Thousands | Various |
| **/last30days** | 1 (meta-research) | Python + SKILL.md |
| **/forge** | 3 (forge + team-build + auto-qa) | Claude commands |

**Total addressable skill pool: 58,000+**

Agentik OS should be the **universal skill runtime** -- install skills from ANY source, run them in ANY mode.

---

## Three Skill Layers

```
Layer 3: MARKETPLACE (Agentik-native skills)
         Custom skills built FOR Agentik OS
         Monetizable (70/30 split)

Layer 2: ADAPTERS (skills.sh, claude-ads, community)
         57,000+ existing skills auto-imported
         Zero-effort integration via SKILL.md format

Layer 1: MCP SERVERS (Composio, Registry, custom)
         Tool-level integrations (API calls, data access)
         The "hands" of agents
```

### How They Connect

```
User: "Audit my Google Ads account"

Agentik OS resolves:
  1. Skill needed: ads-google (Layer 2, from claude-ads)
  2. Tools needed: Google Ads API (Layer 1, via Composio MCP)
  3. Agent: Marketing OS mode, "auditor" agent
  4. Model: Claude Sonnet (cost-effective for analysis)

Result: Full audit with 74 checks, health score, recommendations
Cost: ~$0.15
```

---

## Layer 2: skills.sh Integration

### What skills.sh Is

An open ecosystem by Vercel. 57K+ skills. 211K+ installs. Compatible with 27+ coding agents.

**Format is dead simple:**
```yaml
# SKILL.md frontmatter
---
name: react-best-practices
description: 57 optimization rules for React/Next.js
triggers:
  - "writing React components"
  - "reviewing React code"
---

# React Best Practices

## Critical Rules
1. Never fetch data in client components that could be server components
2. Use dynamic imports for heavy components
...
```

### Installation in Agentik OS

```bash
# Native skills.sh CLI (already works)
npx skills add vercel-labs/agent-skills --skill react-best-practices

# Agentik OS wrapper (proposed)
agentik skill add react-best-practices          # From skills.sh registry
agentik skill add github:AgriciDaniel/claude-ads # Full repo
agentik skill add mcp:composio/gmail             # MCP server
agentik skill search "SEO audit"                 # Search all sources
```

### Auto-Import Strategy

```
agentik skill sync skills.sh
  --> Indexes 57,025 skills
  --> Creates searchable catalog
  --> Skills load on-demand (not pre-installed)
  --> Agent can discover and self-install skills at runtime
```

**Key insight:** Don't pre-install 57K skills. Index them. When an agent needs a capability it doesn't have, it searches the index and installs on-the-fly.

### Top Skills to Pre-Bundle

| Skill | Source | Why |
|-------|--------|-----|
| react-best-practices | vercel-labs | Most installed (211K+) |
| web-design-guidelines | vercel-labs | UI/UX quality |
| find-skills | vercel-labs | Meta-skill: discover others |
| systematic-debugging | community | Universal debugging |
| seo-audit | community | Website optimization |
| shadcn-ui | community | UI component guide |
| stripe-best-practices | community | Payment integration |
| convex-best-practices | community | Our backend stack |

---

## Layer 2: claude-ads Integration

### What claude-ads Is

12 specialized advertising audit skills covering 6 platforms with 186+ checks.

| Skill | Platform | Checks |
|-------|----------|--------|
| `ads-audit` | All platforms (orchestrator) | Spawns 6 subagents |
| `ads-google` | Google Ads | 74 checks |
| `ads-meta` | Meta/Facebook/Instagram | 46 checks |
| `ads-linkedin` | LinkedIn Ads (B2B) | 25 checks |
| `ads-tiktok` | TikTok Ads | 25 checks |
| `ads-microsoft` | Bing/Microsoft Ads | 20 checks |
| `ads-youtube` | YouTube Ads | - |
| `ads-budget` | Cross-platform budgets | - |
| `ads-competitor` | Competitor analysis | - |
| `ads-creative` | Creative quality audit | - |
| `ads-landing` | Landing page quality | - |
| `ads-plan` | Strategic planning | 8 industry templates |

### How It Fits Agentik OS

```
Marketing OS mode:
  agents:
    - name: ad-auditor
      skills:
        - ads-audit          # From claude-ads
        - ads-google         # Platform-specific
        - ads-meta
      tools:
        - composio/google-ads  # API access via MCP
        - composio/meta-ads
      cron: "0 8 * * 1"      # Monday morning audit
      budget: $0.50/run
```

**Use case from USE-CASES.md #16 (Marketing War Room) -- now with real skills:**

```
Marketing Lead: "Audit our Google Ads account"

ad-auditor:
  1. Loads ads-google skill (74 checks)
  2. Connects to Google Ads API via Composio MCP
  3. Runs parallel analysis (campaign structure, bidding, keywords, creative)
  4. Generates health score: B+ (78/100)
  5. Top recommendations:
     - 23% wasted spend on broad match keywords
     - 4 ad groups with <3 ads (needs more creative variety)
     - Performance Max cannibalizing branded search
  6. Cost: $0.12
```

---

## Unified Skill Format

### The Problem

Skills come in different formats:
- skills.sh: `SKILL.md` with YAML frontmatter
- claude-ads: Markdown files in `.claude/commands/`
- MCP: JSON-RPC servers
- Composio: OAuth-wrapped APIs
- Custom: Anything

### The Solution: Agentik Skill Manifest

```yaml
# skill.agentik.yaml
name: seo-audit
version: 1.0.0
source: skills.sh/roier-seo        # Where it came from
runtime: markdown                   # or "mcp", "wasm", "docker"

triggers:                           # When to auto-activate
  - "audit SEO"
  - "check my site"
  - "why am I not ranking"

requires:                           # Dependencies
  tools:
    - composio/google-search-console  # MCP tool needed
    - composio/google-analytics
  models:
    - claude-sonnet                    # Minimum model capability

permissions:
  network:
    - "*.googleapis.com"
  filesystem: read-only

modes:                              # Which OS Modes can use this
  - marketing-os
  - business-os

cost_estimate: $0.05-0.15/run
```

### Universal Installer

```bash
# Install from ANY source
agentik skill add seo-audit                     # skills.sh (default)
agentik skill add github:AgriciDaniel/claude-ads # GitHub repo
agentik skill add mcp:composio/gmail             # MCP server
agentik skill add npm:@agentik/custom-skill      # npm package
agentik skill add ./my-local-skill               # Local path
agentik skill add oci:ghcr.io/agentik/reviewer   # WASM via OCI

# Manage
agentik skill list                               # Installed skills
agentik skill search "marketing"                 # Search all sources
agentik skill update                             # Update all
agentik skill remove seo-audit                   # Uninstall
```

---

## Self-Installing Agents

**The killer feature:** Agents that discover and install skills they need.

```
User: "Optimize my landing page for conversions"

Agent thinks:
  1. I need CRO knowledge → search skills
  2. Found: page-cro, ads-landing, marketing-psychology
  3. Installing page-cro... done (0.3s)
  4. Installing marketing-psychology... done (0.2s)
  5. Now I have 70+ mental models and CRO frameworks
  6. Analyzing your landing page...

User: "Now check the SEO"

Agent thinks:
  1. I need SEO knowledge → search skills
  2. Found: seo-audit, schema-markup, seo-meta
  3. Already have seo-audit from earlier session (cached)
  4. Installing schema-markup... done (0.2s)
  5. Running audit with 200+ rules...
```

**This is the "app store moment" for AI agents.** The agent builds itself based on what you need.

---

## Skill Discovery UX

### Dashboard View

```
+------------------------------------------+
| SKILL STORE                    [Search]  |
|------------------------------------------|
| TRENDING                                 |
| 1. ads-audit .............. 186 checks   |
| 2. react-best-practices .. 57 rules     |
| 3. seo-audit ............. 200+ rules   |
|                                          |
| BY MODE                                  |
| Marketing OS (47 skills)                 |
|   ads-google, ads-meta, page-cro,       |
|   marketing-psychology, seo-audit...     |
|                                          |
| Dev OS (312 skills)                      |
|   react-best-practices, debugging,       |
|   convex, mcp-builder, shadcn-ui...     |
|                                          |
| Business OS (89 skills)                  |
|   stripe, pricing-strategy, sales,       |
|   email-sequence, launch-strategy...     |
|                                          |
| INSTALLED (23)                           |
| [View All] [Update All]                  |
+------------------------------------------+
```

### CLI View

```bash
$ agentik skill search "advertising"

  NAME              SOURCE      CHECKS  INSTALLS
  ads-audit         claude-ads  186     12.4K
  ads-google        claude-ads  74      8.2K
  ads-meta          claude-ads  46      7.1K
  ads-creative      claude-ads  -       5.3K
  programmatic-seo  skills.sh   -       3.8K
  ads-linkedin      claude-ads  25      2.9K

  Install: agentik skill add <name>
```

---

## Numbers That Matter

| Metric | Value |
|--------|-------|
| Skills available at launch | **57,000+** (via skills.sh index) |
| MCP tools available | **1,500+** (Composio + Registry) |
| Pre-bundled skills | **15-20** (most popular per mode) |
| Skill install time | **< 1 second** (markdown) |
| WASM skill install time | **< 3 seconds** |
| Skill discovery | **Runtime** (agents self-install) |
| Custom skill creation | **1 file** (SKILL.md) |

### Competitive Advantage

| Platform | Skills | Install UX | Self-Install | Marketplace |
|----------|--------|-----------|--------------|-------------|
| OpenClaw | ~50 built-in | Manual config | No | No |
| ElizaOS | ~30 plugins | npm install | No | No |
| Claude Code | 57K+ (skills.sh) | `npx skills add` | No | skills.sh |
| **Agentik OS** | **57K+ unified** | **`agentik skill add`** | **Yes (agents self-install)** | **Built-in + skills.sh + MCP** |

**We don't compete on skill count. We win on skill UX.**

---

## Implementation Plan

### Phase 1: Import (Week 1-2)
- [ ] skills.sh index integration (read-only, search + install)
- [ ] claude-ads 12 skills bundled in Marketing OS
- [ ] `agentik skill add/remove/list/search` CLI
- [ ] SKILL.md format support (same as skills.sh)

### Phase 2: Modes Mapping (Week 3-4)
- [ ] Map top skills to each OS Mode
- [ ] Auto-suggest skills based on Mode activation
- [ ] Skill dependency resolution (skill needs MCP tool -> auto-install)

### Phase 3: Self-Install (Month 2)
- [ ] Agent skill discovery at runtime
- [ ] Skill caching (don't re-download)
- [ ] Usage analytics (which skills are popular per mode)

### Phase 4: Marketplace (Month 3-4)
- [ ] Agentik-native skill format (skill.agentik.yaml)
- [ ] Publish to skills.sh (interoperable)
- [ ] Paid skills with 70/30 revenue split
- [ ] Skill ratings and reviews
- [ ] Verified publisher badges

---

## Already Installed on This VPS

These skills are already available from claude-ads and skills.sh:

### Advertising (12 skills from claude-ads)
| Skill | Status |
|-------|--------|
| ads-audit | Installed |
| ads-google | Installed |
| ads-meta | Installed |
| ads-linkedin | Installed |
| ads-tiktok | Installed |
| ads-microsoft | Installed |
| ads-youtube | Installed |
| ads-budget | Installed |
| ads-competitor | Installed |
| ads-creative | Installed |
| ads-landing | Installed |
| ads-plan | Installed |

### Development & Marketing (from skills.sh)
| Skill | Status |
|-------|--------|
| react-best-practices (vercel) | Installed |
| web-design-guidelines (vercel) | Installed |
| shadcn-ui | Installed |
| seo-audit | Installed |
| stripe-best-practices | Installed |
| convex | Installed |
| context7 | Installed |
| mcp-builder | Installed |
| debugging | Installed |
| launch-strategy | Installed |
| pricing-strategy | Installed |
| marketing-psychology | Installed |
| email-sequence | Installed |
| social-content | Installed |
| agent-browser | Installed |
| frontend-design | Installed |
| brainstorming | Installed |

**Total installed: 29+ skills already operational.**

---

*Created: 2026-02-13*
*Sources: skills.sh, claude-ads, Vercel Labs, MCP Registry*
