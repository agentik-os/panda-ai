# Video Script: Agentik OS Dashboard Walkthrough (4 minutes)

> **Target Audience:** Technical users, new users exploring the platform
> **Goal:** Comprehensive tour of the Agentik OS dashboard
> **Tone:** Educational, friendly, clear
> **Length:** 4 minutes
> **Format:** Screen recording with voiceover

---

## Script

### Scene 1: Dashboard Overview (0:00 - 0:45)

**[Screen: Login → Dashboard loads]**

**Voiceover:**
> "Welcome to the Agentik OS dashboard. This is your control center for managing AI agents. Let's walk through everything."

**[Screen: Dashboard home - showing 4 main sections]**

**Voiceover:**
> "The dashboard has four main areas:"

**[Highlight each section as mentioned]**
1. **Agents** (left sidebar) - "Your AI agents"
2. **Cost Analytics** (top right) - "Real-time spend tracking"
3. **Models** (center) - "Model provider status"
4. **Activity Feed** (bottom) - "Live agent activity"

**[Cursor hovers over each section briefly]**

---

### Scene 2: Agents Section (0:45 - 1:30)

**[Screen: Click "Agents" in sidebar]**

**Voiceover:**
> "Let's start with Agents. Here you see all your deployed agents."

**[Screen: Agent list view showing 5 example agents]**

| Agent | Status | Requests/day | Cost/day | Model |
|-------|--------|--------------|----------|-------|
| customer-support | 🟢 Running | 1,247 | $12.40 | Claude Haiku |
| code-reviewer | 🟢 Running | 342 | $28.60 | GPT-4 |
| data-analyzer | 🟡 Idle | 0 | $0.00 | - |

**Voiceover:**
> "Each agent shows real-time status, request volume, daily cost, and which model it's using."

**[Click on "customer-support" agent]**

**[Screen: Agent detail page loads]**

**Voiceover:**
> "Click an agent to see details. You get request logs, cost breakdown, performance metrics, and configuration."

**[Scroll through tabs: Logs, Cost, Performance, Config]**

---

### Scene 3: Cost Analytics (1:30 - 2:15)

**[Screen: Navigate to "Cost Analytics"]**

**Voiceover:**
> "Cost Analytics is where Agentik OS shines. This is Cost X-Ray."

**[Screen: Cost dashboard with multiple visualizations]**

**Charts visible:**
1. **Daily spend trend** (line chart, last 30 days)
2. **Agent breakdown** (pie chart showing cost per agent)
3. **Model usage** (bar chart: GPT-4, Claude, Gemini, Ollama)
4. **Projected monthly cost** (gauge: $840 / $1,000 budget)

**Voiceover:**
> "You can see:"
- "Daily spend trends over time"
- "Which agents cost the most"
- "Model usage distribution"
- "Projected monthly cost vs budget"

**[Click "Export CSV"]**

**Voiceover:**
> "Export data for finance reports. They'll love you for this."

---

### Scene 4: Model Router (2:15 - 2:55)

**[Screen: Navigate to "Models"]**

**Voiceover:**
> "The Models page shows all connected AI providers and their status."

**[Screen: Model provider grid]**

| Provider | Status | Latency | Cost/1M | Uptime |
|----------|--------|---------|---------|--------|
| OpenAI (GPT-4) | 🟢 Healthy | 1.2s | $30.00 | 99.8% |
| Anthropic (Claude) | 🟢 Healthy | 0.8s | $15.00 | 99.9% |
| Google (Gemini) | 🟢 Healthy | 1.5s | $7.00 | 99.5% |
| Ollama (Local) | 🟢 Healthy | 0.3s | $0.00 | 100% |

**Voiceover:**
> "See real-time status, latency, pricing, and uptime for each provider."

**[Click "Routing Rules"]**

**[Screen: Routing configuration UI]**

**Voiceover:**
> "Configure routing rules. For example: 'Use Claude Haiku for simple requests under 500 tokens, GPT-4 for complex reasoning, Ollama for sensitive data.' Agentik OS handles the rest."

---

### Scene 5: Activity Feed (2:55 - 3:30)

**[Screen: Scroll to Activity Feed at bottom]**

**Voiceover:**
> "The Activity Feed shows live agent requests. Watch your agents work in real-time."

**[Screen: Activity feed with live updates (simulated)]**

```
🟢 customer-support: Answered "Where is my order?" (Claude Haiku, 0.8s, $0.003)
🟢 code-reviewer: Reviewed PR #847 (GPT-4, 2.3s, $0.12)
🔴 data-analyzer: Failed (OpenAI rate limit) → Retrying with Claude...
🟢 data-analyzer: Success (Claude Sonnet, 1.1s, $0.08)
```

**Voiceover:**
> "See which agent handled what, which model it used, latency, cost, and auto-failover in action."

**[Highlight the failed → retry → success flow]**

**Voiceover:**
> "Notice the automatic fallback? OpenAI hit rate limit, Agentik OS switched to Claude instantly. Zero downtime."

---

### Scene 6: Settings & Customization (3:30 - 4:00)

**[Screen: Navigate to "Settings"]**

**Voiceover:**
> "In Settings, you can configure:"

**[Show quick shots of each settings page]**

1. **Budget Alerts** - "Get notified at 80% of budget"
2. **Security Policies** - "Network isolation, data residency"
3. **Audit Logs** - "Immutable logs for compliance"
4. **Team Management** - "Invite team members, set permissions"

**[Screen: Return to Dashboard home]**

**Voiceover:**
> "That's the dashboard tour. Everything you need to operate AI agents at scale - visibility, control, and confidence."

**[End screen: "Get Started" CTA]**

**Text overlay:**
- **Install:** npm install -g agentik
- **Docs:** docs.agentik-os.com/dashboard
- **GitHub:** github.com/agentik-os/agentik-os

---

## Visual Callouts

Add animated arrows/highlights for:
- Budget gauge approaching limit (Scene 3)
- Auto-failover sequence (Scene 5)
- Routing rules modal (Scene 4)

---

## YouTube Metadata

**Title:** "Agentik OS Dashboard Walkthrough - Complete Guide (4 mins)"

**Description:**
```
Complete walkthrough of the Agentik OS dashboard. Learn how to:
- Monitor all your AI agents in one place
- Track costs with Cost X-Ray
- Configure multi-model routing
- Watch live agent activity
- Set up budgets and alerts

Timestamps:
0:00 - Dashboard Overview
0:45 - Agents Section
1:30 - Cost Analytics (Cost X-Ray)
2:15 - Model Router
2:55 - Activity Feed
3:30 - Settings & Customization

Get Started:
📦 npm install -g agentik
📚 https://docs.agentik-os.com

#AgentikOS #Dashboard #AIAgents #DevTools
```

---

**Last Updated:** 2026-02-14
**Status:** Ready for Production

