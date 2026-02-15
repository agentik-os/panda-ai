# Cost Management Guide - X-Ray Vision for AI Costs

Complete guide to tracking, optimizing, and controlling AI costs with Agentik OS's Cost X-Ray Vision - real-time cost transparency down to the token level.

---

## Table of Contents

1. [What is Cost X-Ray Vision?](#what-is-cost-x-ray-vision)
2. [Real-Time Cost Tracking](#real-time-cost-tracking)
3. [Cost Dashboard](#cost-dashboard)
4. [Budget Limits & Alerts](#budget-limits--alerts)
5. [Cost Analytics](#cost-analytics)
6. [Cost Optimization](#cost-optimization)
7. [Model Cost Comparison](#model-cost-comparison)
8. [Export & Reporting](#export--reporting)
9. [Best Practices](#best-practices)

---

## What is Cost X-Ray Vision?

Cost X-Ray Vision is Agentik OS's **real-time cost transparency system** - see exactly what you're spending on AI, token by token, model by model, agent by agent.

### The Problem

**Without cost visibility:**
```
You: "How much did I spend on AI this month?"
Bill: "$487.23"
You: "On what?!"
Bill: "¯\_(ツ)_/¯"
```

**With Cost X-Ray Vision:**
```
Cost Breakdown (February 2026):
├── Agent "research-bot" (GPT-5): $245.12 (50.3%)
│   ├── Research papers: $180.00 (73.5%)
│   ├── Code reviews: $45.12 (18.4%)
│   └── Q&A: $20.00 (8.1%)
├── Agent "coder" (Claude Opus): $142.11 (29.1%)
├── Agent "support" (Haiku): $85.00 (17.4%)
└── Agent "creative" (Gemini): $15.00 (3.1%)

Top Cost Drivers:
1. Long-context research sessions ($180)
2. Claude Opus for complex coding ($142)
3. High-volume customer support ($85)

Optimization Opportunities:
→ Switch research-bot from GPT-5 to Gemini 1.5 Pro (-35% cost)
→ Use Haiku for simple code questions instead of Opus (-80% cost)
```

### Key Features

- ✅ **Real-time tracking** - See costs as they happen
- ✅ **Token-level granularity** - Input vs. output token costs
- ✅ **Agent breakdown** - Which agents cost most
- ✅ **Model comparison** - Compare cost/quality tradeoffs
- ✅ **Budget alerts** - Warnings before limits
- ✅ **Forecasting** - Predict monthly spend
- ✅ **Optimization suggestions** - Automated cost reduction tips
- ✅ **Export** - CSV/PDF reports for accounting

---

## Real-Time Cost Tracking

### During Chat Sessions

```bash
panda chat --agent research-bot

User: Analyze this 50-page research paper.

Agent: [Reading paper... analyzing...]

💰 Cost Update: $0.08 (4,523 input tokens @ $0.015/1k, 1,245 output tokens @ $0.020/1k)

Agent: [Provides analysis]

Total Session Cost: $0.08
```

### CLI Cost Display

```bash
# View cost of last message
panda cost --last

# Output:
# Last Message Cost: $0.0042
# - Model: claude-opus-4-6
# - Input: 245 tokens ($0.0012)
# - Output: 150 tokens ($0.0030)
# - Time: 2026-02-14 10:45 AM

# View current session cost
panda cost --session

# View today's cost
panda cost --today

# View this month
panda cost --month
```

### Web Dashboard

**Cost Widget (Dashboard):**
```
┌─────────────────────────────────┐
│  💰 Cost Today                  │
│                                 │
│  $4.23                          │
│  ▲ 12% vs. yesterday            │
│                                 │
│  Budget: $4.23 / $10.00 (42%)   │
│  ▓▓▓▓▓▓▓▓░░░░░░░░░               │
│                                 │
│  [View Details]                 │
└─────────────────────────────────┘
```

---

## Cost Dashboard

Access the full cost analytics dashboard:

```bash
# CLI
panda cost-dashboard

# Web
http://localhost:3000/cost
```

### Dashboard Sections

**1. Overview**
- Total spend (today, week, month, year)
- Budget usage percentage
- Cost trends (line chart)
- Top cost drivers (pie chart)

**2. By Agent**
```
Agent Cost Breakdown (This Month):

research-bot (GPT-5 Turbo)     $245.12  ████████████████░░░░  (50.3%)
coder (Claude Opus)            $142.11  █████████░░░░░░░░░░░  (29.1%)
support (Haiku)                 $85.00  ██████░░░░░░░░░░░░░░  (17.4%)
creative (Gemini)               $15.00  █░░░░░░░░░░░░░░░░░░░   (3.1%)

Total: $487.23
```

**3. By Model**
```
Model Cost Comparison:

GPT-5 Turbo        $245.12  (32,145 messages)  $0.0076/msg  ████████████
Claude Opus        $142.11  (4,521 messages)   $0.0314/msg  ██████
Claude Haiku       $85.00   (18,234 messages)  $0.0047/msg  ████
Gemini 2.0 Flash   $15.00   (5,623 messages)   $0.0027/msg  ██
```

**4. By Time Period**
```
Daily Cost Trend (Last 30 Days):

$15 ┤           ╭─╮
$12 ┤       ╭───╯ │
$10 ┤   ╭───╯     │
$8  ┤╭──╯         ╰─╮
$5  ┼╯              ╰───╮
$0  ┴────────────────────╯
    Feb 1              Feb 14

Average: $8.50/day
Forecast (Feb 28): $420 total
```

**5. Top Cost Queries**
```
Most Expensive Queries:

1. "Analyze 100-page technical specification" - $12.45 (GPT-5, 45K tokens)
2. "Generate full React component library" - $8.23 (Claude Opus, 28K tokens)
3. "Research paper literature review" - $6.78 (Gemini, 50K tokens)
4. "Translate 50 pages EN→FR" - $5.12 (GPT-4o, 35K tokens)
5. "Debug complex distributed system" - $4.56 (o1, 12K tokens reasoning)
```

**6. Optimization Recommendations**
```
💡 Cost Savings Opportunities:

1. ⬇️ Switch "research-bot" from GPT-5 to Gemini 1.5 Pro
   - Current: $245/mo
   - Estimated: $160/mo
   - Savings: $85/mo (35%)
   - Risk: Minimal quality difference for research tasks

2. 🎯 Use Haiku for simple code questions instead of Opus
   - Current: $142/mo on Opus
   - Potential: $28/mo on Haiku (80% of queries)
   - Savings: $114/mo (80%)
   - Risk: May need manual fallback for complex queries

3. 📉 Reduce context window for "support" agent
   - Current: 100 messages context
   - Recommend: 10 messages (support doesn't need full history)
   - Savings: ~$30/mo (35%)

Total Potential Savings: $229/mo (47% reduction)
```

---

## Budget Limits & Alerts

### Set Daily Budget

```bash
# Set daily limit
panda config set budget.dailyLimit 10.00

# Set per-message limit
panda config set budget.maxCostPerMessage 0.10

# Set per-agent limit
panda agent update research-bot --budget-limit 5.00
```

### Alert Thresholds

```bash
# Alert at 80% of budget
panda config set budget.alertAt 0.80

# Alert on expensive messages
panda config set budget.expensiveMessageThreshold 0.50
```

### Budget Enforcement

**Soft Limit (Warning):**
```
User: [Sends message to research-bot]

⚠️  Warning: This message will cost ~$0.12 and put you at 85% of daily budget ($8.50/$10.00).

Continue? (y/n):
```

**Hard Limit (Block):**
```
User: [Sends message that would exceed budget]

❌ Budget Limit Reached
You've reached your daily budget limit of $10.00.

Options:
1. Wait until tomorrow (resets at midnight UTC)
2. Increase budget: `panda config set budget.dailyLimit 15.00`
3. Use cheaper model: `panda agent update AGENT --model claude-haiku-4-5-20251001`
```

### Alert Channels

```bash
# Email alerts
panda config set alerts.email "you@example.com"

# Slack alerts
panda config set alerts.slack "https://hooks.slack.com/services/XXX"

# Telegram alerts
panda config set alerts.telegram "@your-telegram-bot"
```

**Alert Example (Slack):**
```
🚨 Cost Alert - Agentik OS

Daily budget at 80%: $8.00 / $10.00

Top spenders today:
- research-bot: $4.50 (56%)
- coder: $2.30 (29%)
- support: $1.20 (15%)

Recommendation: Consider switching research-bot to cheaper model.

[View Dashboard]
```

---

## Cost Analytics

### Cost Breakdown Dimensions

**By Agent:**
```bash
panda cost --by agent
```

**By Model:**
```bash
panda cost --by model
```

**By OS Mode:**
```bash
panda cost --by mode

# Output:
# Focus Mode:    $50 (1,000 msgs @ $0.05/msg)  - Haiku
# Creative Mode: $200 (100 msgs @ $2.00/msg)   - Opus
# Research Mode: $150 (500 msgs @ $0.30/msg)   - Sonnet
```

**By Skill:**
```bash
panda cost --by skill

# Output:
# web-search: $25 (500 searches @ $0.05/search)
# google-calendar: $5 (100 events @ $0.05/event)
# file-ops: $2 (200 operations @ $0.01/op)
```

**By Time:**
```bash
panda cost --by hour    # Hourly breakdown
panda cost --by day     # Daily breakdown
panda cost --by week    # Weekly breakdown
```

### Cost Metrics

**Average Cost Per Message:**
```bash
panda cost --metric avg-per-message

# Output:
# Overall: $0.08/message
# research-bot: $0.15/message
# coder: $0.12/message
# support: $0.01/message
```

**Cost Efficiency Score:**
```bash
panda cost --efficiency

# Output:
# Cost Efficiency Score: 7.2/10
#
# ✅ Good:
# - Using Haiku for 70% of simple queries
# - Appropriate context window sizes
# - Budget alerts enabled
#
# ⚠️  Needs Improvement:
# - research-bot using GPT-5 for all queries (could use Gemini for 40%)
# - coder agent has 50-message context (10 would suffice)
#
# 💡 Optimization Potential: 35% cost reduction
```

### Forecasting

```bash
# Predict month-end cost
panda cost --forecast

# Output:
# Current Spend (Feb 1-14): $120.50
# Burn Rate: $8.61/day
# Projected Month Total: $241.00
# Budget: $300.00
# Forecast: ✅ Under budget ($59 remaining)
```

---

## Cost Optimization

### Automatic Optimization

Enable auto-optimization to reduce costs without quality loss:

```bash
# Enable auto-optimization
panda config set optimization.enabled true

# Set optimization level
panda config set optimization.level aggressive  # aggressive | balanced | conservative
```

**Optimization Strategies:**

**1. Model Downgrading**
```
Before: All queries → Claude Opus ($0.05/msg)
After:  Simple queries → Haiku ($0.001/msg)
        Complex queries → Opus ($0.05/msg)

Savings: 70% of queries are simple → 70% * $0.049 = $0.034/msg saved
```

**2. Context Window Optimization**
```
Before: 100-message context window
After:  10-message context window (for agents that don't need history)

Savings: 90% reduction in input tokens → ~45% cost savings
```

**3. Caching**
```
Before: Every query hits API
After:  Cache frequent queries (TTL: 1 hour)

Savings: 20% cache hit rate → 20% cost savings
```

**4. Batch Processing**
```
Before: Process 100 documents individually (100 API calls)
After:  Batch 10 documents per call (10 API calls)

Savings: 90% reduction in API calls → ~70% cost savings (due to batching overhead)
```

### Manual Optimization Tips

**1. Use Model Fallback Chains**
```bash
panda agent update my-agent \
  --model claude-opus-4-6 \
  --fallback "claude-sonnet-4-5-20250929,claude-haiku-4-5-20251001" \
  --max-cost 0.02
```

How it works:
1. Try Opus first
2. If cost >$0.02, use Sonnet
3. If still >$0.02, use Haiku
4. Result: 80% cost reduction while maintaining quality for most queries

**2. Right-Size Context Windows**
```bash
# Audit context usage
panda cost --context-audit

# Output:
# Agent "coder":
#   - Current context: 50 messages
#   - Avg messages referenced: 5
#   - Recommendation: Reduce to 10 messages
#   - Potential savings: $40/mo (35%)
```

**3. Use Temperature 0 for Caching**
```bash
# Temperature 0 = deterministic = more cache hits
panda agent update my-agent --temperature 0

# Savings: ~15% due to increased cache hit rate
```

**4. Compress System Prompts**
```bash
# Before (verbose)
--system "You are a highly experienced senior software engineer with over 15 years of expertise in building scalable distributed systems using modern cloud-native architectures..."

# After (concise)
--system "Senior engineer. Expert: distributed systems, cloud-native, scalability."

# Savings: 80% reduction in system prompt tokens → ~5% overall cost savings
```

**5. Use Streaming for Long Responses**
```bash
panda agent update my-agent --streaming true

# Why? Streaming allows early termination if answer is sufficient
# Savings: ~10% by not generating full response when partial answer works
```

---

## Model Cost Comparison

### Cost Per 1M Tokens (February 2026)

| Model | Input | Output | Total (50/50 mix) |
|-------|-------|--------|-------------------|
| **Claude Opus 4.6** | $15.00 | $75.00 | $45.00 |
| **Claude Sonnet 4.5** | $3.00 | $15.00 | $9.00 |
| **Claude Haiku 4.5** | $0.25 | $1.25 | $0.75 |
| **GPT-5 Turbo** | $5.00 | $15.00 | $10.00 |
| **GPT-4o** | $2.50 | $10.00 | $6.25 |
| **GPT-4o Mini** | $0.15 | $0.60 | $0.375 |
| **o1** | $15.00 | $60.00 | $37.50 |
| **Gemini 2.0 Flash** | $0.075 | $0.30 | $0.1875 |
| **Gemini 1.5 Pro** | $1.25 | $5.00 | $3.125 |
| **Ollama (Local)** | $0.00 | $0.00 | $0.00 |

### Quality vs. Cost Analysis

```
High Quality, High Cost:
├── Claude Opus ($45/M tokens) - Best reasoning
├── o1 ($37.50/M tokens) - Best for math/logic
└── GPT-5 Turbo ($10/M tokens) - Best all-around

Balanced Quality & Cost:
├── Claude Sonnet ($9/M tokens) - Great for most tasks
├── GPT-4o ($6.25/M tokens) - Good multimodal
└── Gemini 1.5 Pro ($3.125/M tokens) - Long context

Low Cost, Acceptable Quality:
├── Claude Haiku ($0.75/M tokens) - Fast, reliable
├── GPT-4o Mini ($0.375/M tokens) - Cheap, capable
└── Gemini 2.0 Flash ($0.1875/M tokens) - Cheapest API model

Zero Cost:
└── Ollama (Local) - Free, private, slower
```

### ROI Calculator

```bash
panda cost --roi-calculator

# Interactive prompts:
? How many messages per day? 100
? Current model? claude-opus-4-6
? Alternative model to compare? claude-sonnet-4-5-20250929

# Output:
ROI Analysis:

Current Setup (Claude Opus):
- Cost/day: $5.00
- Cost/month: $150.00
- Quality: 9.5/10

Alternative (Claude Sonnet):
- Cost/day: $1.00
- Cost/month: $30.00
- Quality: 8.5/10

Savings: $120/month (80% reduction)
Quality Impact: -10.5% (minimal for most tasks)

Recommendation: ✅ Switch to Sonnet
Breakeven: Immediate (no switching cost)
```

---

## Export & Reporting

### Export Formats

**CSV Export:**
```bash
panda cost --export csv --month february > costs-feb-2026.csv
```

**PDF Report:**
```bash
panda cost --export pdf --month february > costs-feb-2026.pdf
```

**JSON Export:**
```bash
panda cost --export json --month february > costs-feb-2026.json
```

### Report Contents

**Monthly Cost Report (PDF):**
```
═══════════════════════════════════════════════
     AGENTIK OS - COST REPORT
     February 2026
═══════════════════════════════════════════════

SUMMARY
-------
Total Spend: $487.23
Messages: 60,523
Avg Cost/Message: $0.0080
Budget: $500.00
Utilization: 97.4%

BREAKDOWN BY AGENT
-------------------
research-bot (GPT-5)     $245.12  (50.3%)
coder (Claude Opus)      $142.11  (29.1%)
support (Haiku)          $85.00   (17.4%)
creative (Gemini)        $15.00   (3.1%)

BREAKDOWN BY MODEL
-------------------
GPT-5 Turbo              $245.12  (50.3%)
Claude Opus              $142.11  (29.1%)
Claude Haiku             $85.00   (17.4%)
Gemini 2.0 Flash         $15.00   (3.1%)

TOP 10 MOST EXPENSIVE QUERIES
-------------------------------
1. Analyze 100-page spec        $12.45
2. Generate component library    $8.23
3. Literature review             $6.78
[... continues ...]

OPTIMIZATION OPPORTUNITIES
---------------------------
→ Potential savings: $229/mo (47%)
1. Switch research-bot to Gemini (-$85/mo)
2. Use Haiku for simple code (-$114/mo)
3. Reduce context windows (-$30/mo)

═══════════════════════════════════════════════
Generated: 2026-03-01 09:00 AM UTC
═══════════════════════════════════════════════
```

### Automated Reports

```bash
# Email monthly report
panda config set reports.email.enabled true
panda config set reports.email.recipients "finance@company.com"
panda config set reports.email.frequency monthly

# Slack weekly summary
panda config set reports.slack.enabled true
panda config set reports.slack.webhook "https://hooks.slack.com/..."
panda config set reports.slack.frequency weekly
```

---

## Best Practices

### 1. Set Realistic Budgets

```bash
# Start with generous budget, then optimize
panda config set budget.dailyLimit 20.00  # Month 1

# After 1 month, analyze average spend
panda cost --month --metric avg-per-day
# Output: $8.50/day

# Set realistic budget with 20% buffer
panda config set budget.dailyLimit 10.00  # Month 2+
```

### 2. Enable Alerts Early

```bash
# Set up alerts on day 1
panda config set budget.alertAt 0.80
panda config set alerts.email "you@example.com"
panda config set alerts.slack "webhook-url"

# Don't wait until you overspend!
```

### 3. Monitor Weekly, Optimize Monthly

```
Week 1: Monitor → Understand patterns
Week 2-3: Monitor → Identify waste
Week 4: Optimize → Implement changes
Week 5+: Repeat
```

### 4. Right-Size Models

```bash
# ❌ Don't use Opus for everything
panda agent create my-agent --model claude-opus-4-6

# ✅ Use model fallback chain
panda agent create my-agent \
  --model claude-opus-4-6 \
  --fallback "claude-sonnet-4-5-20250929,claude-haiku-4-5-20251001" \
  --max-cost 0.02
```

### 5. Audit Regularly

```bash
# Monthly cost review
panda cost --audit

# Checks:
# - Unused agents (wasting quota)
# - Oversized context windows
# - Expensive models for simple tasks
# - Missing budget limits
# - Optimization opportunities
```

### 6. Use Local Models for Development

```bash
# Development/testing
panda agent create dev-test --provider ollama --model llama3.3

# Production
panda agent create production --provider anthropic --model claude-opus-4-6

# Saves $$ during development iterations
```

### 7. Compress Data Before Processing

```bash
# ❌ Don't send raw 100-page PDFs
panda chat --agent analyzer --file huge-doc.pdf  # Costs $15

# ✅ Extract key sections first
panda chat --agent summarizer --file huge-doc.pdf  # Costs $0.50
# Then analyze summary
panda chat --agent analyzer --message "[summary]"  # Costs $0.10

# Total: $0.60 vs. $15 (96% savings)
```

### 8. Batch Processing

```bash
# ❌ Don't process files individually
for file in *.txt; do
  panda chat --agent processor --file "$file"
done
# 100 files × $0.05 = $5.00

# ✅ Batch files together
cat *.txt > combined.txt
panda chat --agent processor --file combined.txt
# 1 call × $0.20 = $0.20 (96% savings)
```

---

## Summary

**Key Features:**
- ✅ Real-time cost tracking (token-level granularity)
- ✅ Multi-dimensional analytics (agent, model, time, skill)
- ✅ Budget limits & alerts (soft + hard limits)
- ✅ Forecasting & ROI analysis
- ✅ Automated optimization suggestions
- ✅ Export to CSV/PDF/JSON

**Cost Optimization Strategies:**
1. Model fallback chains (80% savings)
2. Right-size context windows (35% savings)
3. Use temperature 0 for caching (15% savings)
4. Compress system prompts (5% savings)
5. Batch processing (90% savings)
6. Local models for dev (100% savings)

**Quick Commands:**
```bash
# View cost
panda cost --today|--month|--last

# Dashboard
panda cost-dashboard

# Set budget
panda config set budget.dailyLimit 10.00

# Export report
panda cost --export pdf --month february

# Audit
panda cost --audit
```

**Typical Savings:**
- Before optimization: $500/month
- After optimization: $200/month
- **Total savings: $300/month (60%)**

**Next:** Read [Debugging with Time Travel](debugging-time-travel.md) to debug your agents with replayable history.

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**Next:** [Debugging with Time Travel](debugging-time-travel.md)
