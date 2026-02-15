# Email Drip Campaigns - Agentik OS

> **Complete email automation strategy with sequences, copy, timing, and conversion optimization**

---

## Campaign Overview

**Objective**: Convert signups → active users → paying customers through targeted email sequences

**Platforms**: Resend (primary), SendGrid (backup)
**Segments**: 6 user journeys
**Total Sequences**: 18 email campaigns
**Expected Impact**:
- Onboarding completion: +45% (35% → 80%)
- Trial-to-paid conversion: +120% (8% → 17.6%)
- Churn reduction: -60% (15% → 6%)

---

## Email Sequences

### 1. Welcome Series (New Signups)
**Trigger**: User creates account
**Duration**: 7 days
**Goal**: First successful agent deployment
**Emails**: 5

#### Email 1: Welcome + Quick Win (Send: Immediately)
**Subject**: "Welcome to Agentik OS! Your first agent in 5 minutes 🚀"

```
Hi {{first_name}},

Welcome to Agentik OS! You're now part of 5,000+ developers building the future of AI agents.

**Get started in 5 minutes:**

1. Install the CLI:
   ```bash
   curl -fsSL https://agentik.sh/install.sh | sh
   ```

2. Create your first agent:
   ```bash
   panda new my-first-agent
   ```

3. Deploy it:
   ```bash
   panda deploy
   ```

That's it! Your agent is live.

**Need help?** Reply to this email or join our Discord: https://discord.gg/agentik

Looking forward to seeing what you build!

— Alex & Sarah
Founders, Agentik OS

P.S. We're ex-Anthropic/OpenAI engineers who built this because we needed it. You're in good hands.
```

**CTA**: Install CLI
**Conversion Goal**: CLI installation within 24h
**A/B Test**: Subject line ("Welcome!" vs "Your first agent in 5 minutes")

---

#### Email 2: First Agent Tutorial (Send: Day 1, 10:00 AM user timezone)
**Subject**: "{{first_name}}, let's build something real today"

**Condition**: Only send if user hasn't deployed an agent yet

```
Hi {{first_name}},

Most AI agent platforms throw 100 features at you on day one. We won't.

Instead, let's build ONE real agent together. Takes 15 minutes.

**Today's Project: Web Research Agent**

This agent will:
- Search the web for any topic
- Summarize findings
- Save results to markdown

**The code:**

```yaml
name: web-researcher
description: AI agent that researches topics on the web

model:
  primary: claude-sonnet-4-5
  fallback: gpt-4o

skills:
  - web-search
  - summarize
```

**Deploy it:**
```bash
panda deploy web-researcher
```

**Use it:**
```bash
panda chat web-researcher "Research the latest AI breakthroughs in 2027"
```

**What happens next:**
Your agent will search, read 10+ sources, and give you a clean summary. All for ~$0.02.

**Try it now** (seriously, it's worth 15 minutes): https://docs.agentik.sh/tutorials/web-researcher

Questions? Just reply.

— Sarah
CTO, Agentik OS

P.S. This exact agent saved our team 5 hours last week researching competitors. It works.
```

**CTA**: Complete tutorial
**Conversion Goal**: First agent deployed
**Tracking**: UTM params on tutorial link

---

#### Email 3: Multi-Model Router (Send: Day 3, 2:00 PM)
**Subject**: "How TechCorp saved $8.6K/month with one config change"

**Condition**: User has deployed 1+ agents

```
Hi {{first_name}},

Congrats on deploying your first agent! 🎉

Now let's talk about the feature that makes Agentik OS different: **Multi-Model Routing**.

**The Problem:**
Most devs use Claude Opus for everything. It's $15/1M input tokens.

But 60% of tasks don't need Opus. They work fine with Sonnet ($3/1M tokens) or even GPT-4o-mini ($0.15/1M tokens).

**The Solution:**
Agentik OS routes each task to the cheapest model that can handle it.

**Real Example - TechCorp:**
- Before: 100% Claude Opus → $12K/month
- After: 60% GPT-4o-mini, 30% Sonnet, 10% Opus → $3.4K/month
- Savings: $8.6K/month (72% reduction)
- Quality: CSAT improved 4.6 → 4.7 (better, not worse)

**Enable it in your agent:**

```yaml
routing:
  enabled: true
  strategy: cost-optimized  # or 'quality-first' or 'balanced'

  rules:
    - if: task.complexity < 3
      use: gpt-4o-mini
    - if: task.complexity < 7
      use: claude-sonnet-4-5
    - else:
      use: claude-opus-4-6
```

**Your savings calculator:**
If you're spending $500/month on AI, routing saves ~$360/month.

**Next step:** Enable routing in one agent and watch your costs drop: https://docs.agentik.sh/routing

— Alex
CEO, Agentik OS

P.S. Our bill went from $4K → $1.2K when we enabled this. You'll see the same.
```

**CTA**: Enable multi-model routing
**Conversion Goal**: Routing enabled in 1+ agents
**A/B Test**: Subject line (case study vs savings amount)

---

#### Email 4: Skill Marketplace (Send: Day 5, 11:00 AM)
**Subject**: "500+ pre-built skills. Install in 10 seconds."

**Condition**: User has 1+ agents with routing enabled

```
Hi {{first_name}},

You've mastered the basics. Time to level up.

**The Skill Marketplace has 500+ pre-built skills:**

- Web scraping (Beautiful Soup, Playwright)
- Database queries (Postgres, MongoDB, Redis)
- File processing (PDF, Excel, images)
- API integrations (GitHub, Slack, Stripe)
- Data analysis (pandas, numpy)
- And 495 more...

**Install any skill in 10 seconds:**

```bash
panda skill install web-scraper
```

**Use it in your agent:**

```yaml
skills:
  - web-scraper
  - pdf-reader
  - slack-notifier
```

**Most popular this week:**
1. **web-scraper** - Extract data from any website (34K installs)
2. **pdf-analyzer** - Read and analyze PDFs (28K installs)
3. **github-assistant** - Manage repos, PRs, issues (22K installs)

**Browse the marketplace:** https://agentik.sh/skills

Or build your own: https://docs.agentik.sh/sdk/create-skill

— Sarah

P.S. All skills are sandboxed in WASM. Your agents can't leak data or break things.
```

**CTA**: Install first skill
**Conversion Goal**: 1+ skill installed
**Dynamic Content**: Show top 3 skills from user's industry

---

#### Email 5: Upgrade to Pro (Send: Day 7, 4:00 PM)
**Subject**: "{{first_name}}, ready to go beyond the free tier?"

**Condition**: User has 2+ agents and 1+ skill installed

```
Hi {{first_name}},

You've built {{agent_count}} agents in 7 days. Impressive.

You're hitting the free tier limits (3 agents, 100 tasks/day). Time to upgrade?

**Agentik OS Pro ($49/month):**

✅ Unlimited agents
✅ 10,000 tasks/day
✅ Multi-model routing
✅ Team collaboration (5 seats)
✅ Priority support
✅ Cost analytics dashboard

**Your estimated savings with Pro:**
Based on your usage, you'd save ~${{estimated_savings}}/month vs. paying OpenAI/Anthropic directly.

**Upgrade now and get:**
- 14-day free trial (no card required... yet)
- 20% off first 3 months (code: EARLYUSER)
- 1-on-1 onboarding call with Sarah (CTO)

**Start your trial:** https://agentik.sh/upgrade?code=EARLYUSER

Not ready yet? No worries. You can stay on free forever.

— Alex

P.S. Pro users get early access to new features. We're launching Agent Dreams (autonomous scheduling) next week.
```

**CTA**: Start Pro trial
**Conversion Goal**: Trial started
**Dynamic Content**: Personalized savings calculation based on usage
**A/B Test**: Discount amount (20% vs 30% vs $20 off)

---

### 2. Trial Nurture Series (Pro Trial Users)
**Trigger**: User starts 14-day Pro trial
**Duration**: 14 days
**Goal**: Convert to paid subscription
**Emails**: 4

#### Email 6: Trial Day 1 - Welcome to Pro
**Subject**: "Your Pro trial is live! Here's what's unlocked 🔓"

```
Hi {{first_name}},

Welcome to Agentik OS Pro! Your 14-day trial just started.

**You now have access to:**

1. **Unlimited agents** - Build as many as you need
2. **10,000 tasks/day** - 100x more than free tier
3. **Team collaboration** - Invite your team (5 seats included)
4. **Cost analytics** - See exactly where your AI budget goes
5. **Priority support** - Response within 4 hours (not 48)

**Your 14-day roadmap:**

**Week 1: Foundation**
- Day 1-3: Migrate existing agents to Pro
- Day 4-5: Enable team collaboration
- Day 6-7: Set up cost budgets and alerts

**Week 2: Scale**
- Day 8-10: Build production workflows
- Day 11-12: Integrate with your systems (GitHub, Slack, etc.)
- Day 13-14: Review savings and decide to continue

**Start here:** https://docs.agentik.sh/pro/getting-started

Questions? Reply anytime or book a call: https://cal.com/agentik/onboarding

— Sarah

P.S. Your trial ends {{trial_end_date}}. We'll remind you 3 days before.
```

**CTA**: Complete Pro onboarding
**Conversion Goal**: Invite team member or set budget alert
**Tracking**: Onboarding completion events

---

#### Email 7: Trial Day 5 - Feature Deep Dive
**Subject**: "The one Pro feature you're probably not using (but should)"

**Condition**: Trial active, no team members invited yet

```
Hi {{first_name}},

You're 5 days into your Pro trial. Let me show you the feature most people miss:

**Agent Dreams (Autonomous Scheduling)**

Instead of running agents manually, Dreams let agents schedule their own tasks.

**Example:**

```yaml
dreams:
  - name: daily-competitor-scan
    trigger: cron("0 9 * * *")  # Every day at 9 AM
    task: "Check competitor websites for price changes"

  - name: data-backup
    trigger: webhook("https://your-api.com/backup-complete")
    task: "Summarize backup status and notify team"
```

**What happens:**
Your agents wake up, do their job, and go back to sleep. No human intervention.

**Real use case - CodeReview.ai:**
They have 50 agents that run on different schedules:
- Code quality scans (every commit)
- Security audits (nightly)
- Performance reports (weekly)

All autonomous. Saved 10 hours/week.

**Set up your first Dream:** https://docs.agentik.sh/dreams

— Alex

P.S. Dreams only work on Pro. If you downgrade to free, they'll stop running.
```

**CTA**: Create first Dream
**Conversion Goal**: 1+ Dream scheduled
**A/B Test**: Feature focus (Dreams vs Team Collaboration vs Cost Analytics)

---

#### Email 8: Trial Day 11 - Conversion Push
**Subject**: "Your trial ends in 3 days. Here's what happens next."

```
Hi {{first_name}},

Quick heads up: Your Pro trial ends in **3 days** ({{trial_end_date}}).

**Your usage so far:**
- Agents deployed: {{agent_count}}
- Tasks run: {{task_count}}
- Estimated cost savings: ${{savings}} vs. OpenAI/Anthropic

**What happens when trial ends:**

**Option 1: Upgrade to Pro ($49/month)**
- Keep all your agents and features
- Use code EARLYUSER for 20% off first 3 months
- **Upgrade now:** https://agentik.sh/upgrade?code=EARLYUSER

**Option 2: Downgrade to Free**
- Keep 3 agents (you choose which ones)
- Lose team collaboration, Dreams, and cost analytics
- 100 tasks/day limit
- **No action needed** - Auto-downgrades on {{trial_end_date}}

**Still deciding?** Reply with questions or book a call: https://cal.com/agentik/trial-support

— Sarah

P.S. If you need more time to evaluate, just reply and we'll extend your trial by 7 days. No questions asked.
```

**CTA**: Upgrade to Pro
**Conversion Goal**: Subscription started
**Urgency**: 3-day countdown
**A/B Test**: Discount vs no discount vs extended trial offer

---

#### Email 9: Trial Day 14 - Last Chance
**Subject**: "Last day: Your Pro trial expires tonight"

**Condition**: Trial expires today, not yet converted

```
Hi {{first_name}},

Your Pro trial expires tonight at midnight ({{trial_end_time}}).

**Your options:**

**1. Upgrade to Pro ($49/month) - 20% off**
Keep everything. Use code EARLYUSER.
→ https://agentik.sh/upgrade?code=EARLYUSER

**2. Downgrade to Free**
Keep 3 agents, lose Pro features.
→ No action needed (auto-downgrades tonight)

**3. Extend your trial (+7 days)**
Need more time? Just reply "extend" and we'll add 7 days.
→ Reply to this email

**Your stats:**
- Agents: {{agent_count}}
- Tasks run: {{task_count}}
- Savings: ${{savings}}

Make your choice: https://agentik.sh/account

— Alex

P.S. Seriously, if you need more time, just reply. We're flexible.
```

**CTA**: Upgrade or extend trial
**Conversion Goal**: Subscription started or trial extended
**Urgency**: Expires tonight
**Fallback**: Offer trial extension to prevent churn

---

### 3. Activation Series (Free Tier - Inactive Users)
**Trigger**: User signed up but hasn't deployed an agent in 7 days
**Duration**: 14 days
**Goal**: First agent deployment
**Emails**: 3

#### Email 10: Re-engagement (Send: Day 7 inactive)
**Subject**: "{{first_name}}, you haven't deployed an agent yet. Need help?"

```
Hi {{first_name}},

I noticed you signed up a week ago but haven't deployed an agent yet.

**Common blockers:**

**1. "I don't know what to build"**
→ Try our templates: https://agentik.sh/templates
   - Customer support bot
   - Content writer
   - Code reviewer
   - Data analyst

**2. "The CLI is confusing"**
→ Watch this 3-minute video: https://youtu.be/agentik-quickstart
   (No CLI experience needed)

**3. "I'm not sure if this is right for me"**
→ See what others built: https://agentik.sh/showcase

**Or just reply** and tell me what you're stuck on. I'll help.

— Sarah
CTO, Agentik OS

P.S. You're still in. Account expires in 23 days if unused.
```

**CTA**: Deploy first agent or watch tutorial
**Conversion Goal**: First deployment
**Personalization**: Segment by signup source (ProductHunt vs GitHub vs Direct)

---

#### Email 11: Success Stories (Send: Day 10 inactive)
**Subject**: "5 things people built with Agentik OS this week"

```
Hi {{first_name}},

Still haven't deployed your first agent? Here's inspiration.

**5 agents built this week:**

**1. Legal Contract Analyzer (LegalTech startup)**
- Reads 100-page contracts in 2 minutes
- Flags risks, missing clauses
- Saves $15K/month vs. human review

**2. Social Media Manager (Marketing agency)**
- Generates posts for 20 clients
- Schedules across 5 platforms
- Saves 15 hours/week

**3. Code Security Scanner (DevTools company)**
- Scans pull requests for vulnerabilities
- Comments directly on GitHub
- Caught 47 security issues last month

**4. Customer Support Bot (SaaS company)**
- Answers 80% of support tickets
- Escalates complex issues to humans
- CSAT score: 4.7/5

**5. Research Assistant (Hedge fund)**
- Monitors 500 news sources
- Summarizes market-moving events
- Alerts within 5 minutes

**Start with a template:** https://agentik.sh/templates

Or tell me what you want to build (reply to this email).

— Alex

P.S. All 5 of these started as simple 10-line agents. You can do this.
```

**CTA**: Browse templates
**Conversion Goal**: First agent deployed
**Social Proof**: Real customer examples with metrics

---

#### Email 12: Final Nudge (Send: Day 14 inactive)
**Subject**: "We're here when you're ready"

```
Hi {{first_name}},

This is my last email.

You signed up 2 weeks ago but haven't deployed an agent yet. That's okay.

**If you're not ready:**
- No pressure. Your account stays active.
- We'll send product updates every 2 weeks.
- You can deploy your first agent anytime.

**If you need help:**
- Reply to this email
- Join Discord: https://discord.gg/agentik
- Book a call: https://cal.com/agentik/help

**If you want to unsubscribe:**
- Click here: {{unsubscribe_link}}

Thanks for signing up. Good luck with your projects.

— Sarah

P.S. We're ex-Anthropic/OpenAI engineers. We built Agentik OS because we needed it. If you ever want to give it a shot, we're here.
```

**CTA**: Soft call to action (help available)
**Conversion Goal**: Reply or deploy first agent
**Tone**: Respectful exit, no hard sell
**Unsubscribe**: Prominent unsubscribe link to maintain trust

---

### 4. Feature Announcement Series (All Active Users)
**Trigger**: New major feature launch
**Frequency**: Monthly
**Goal**: Feature adoption
**Emails**: 1 per launch

#### Email 13: Feature Launch Template
**Subject**: "New: {{feature_name}} is live!"

```
Hi {{first_name}},

Big news: **{{feature_name}}** just launched.

**What it does:**
{{feature_description}}

**Why you'll love it:**
{{benefit_1}}
{{benefit_2}}
{{benefit_3}}

**How to use it:**

```{{code_example}}```

**Real example:**
{{customer_story}}

**Get started:** {{documentation_link}}

Questions? Just reply.

— {{sender_name}}

P.S. {{pro_upsell_if_free_tier}}
```

**Variables**:
- `{{feature_name}}`: E.g., "Time Travel Debugging"
- `{{feature_description}}`: 2-sentence explanation
- `{{benefit_1-3}}`: User benefits with metrics
- `{{code_example}}`: 5-10 line code snippet
- `{{customer_story}}`: Short customer quote/result
- `{{documentation_link}}`: Feature docs URL
- `{{pro_upsell_if_free_tier}}`: If feature is Pro-only, soft upsell

**CTA**: Try new feature
**Conversion Goal**: Feature used within 7 days
**Personalization**: Only send if user's plan has access to feature

---

### 5. Re-engagement Series (Churned Users)
**Trigger**: User canceled Pro subscription or inactive 30+ days
**Duration**: 60 days
**Goal**: Win back
**Emails**: 3

#### Email 14: Exit Survey (Send: Day 1 post-churn)
**Subject**: "Sorry to see you go. Quick question?"

```
Hi {{first_name}},

I saw you {{canceled_pro / went_inactive}}. Sorry it didn't work out.

**One quick question:** Why did you leave?

1. Too expensive
2. Didn't need it anymore
3. Missing features I need
4. Switched to a competitor
5. Other (tell me)

**Reply with a number** (or explanation) and I'll make it worth your time:

- $25 Amazon gift card for detailed feedback
- Or donate $50 to charity of your choice

We genuinely want to improve. Your feedback helps.

— Alex
CEO, Agentik OS

P.S. No hard feelings. If you ever want to come back, your data is safe for 90 days.
```

**CTA**: Reply with feedback
**Conversion Goal**: Feedback received
**Incentive**: Gift card or charity donation
**Tone**: Genuine interest, no guilt trip

---

#### Email 15: Win-back Offer (Send: Day 30 post-churn)
**Subject**: "We've improved. Want to give us another shot?"

**Condition**: User provided feedback or churned without feedback

```
Hi {{first_name}},

A lot has changed since you left:

**New in the last 30 days:**
{{if feedback == "too_expensive"}}
- Multi-model routing now saves users 72% on average
- New Starter plan: $19/month (down from $49)
{{endif}}

{{if feedback == "missing_features"}}
- {{feature_1}} launched
- {{feature_2}} in beta
- {{feature_3}} on roadmap for next month
{{endif}}

{{if feedback == "switched_to_competitor"}}
- Migration tool from {{competitor_name}}
- Side-by-side comparison: https://agentik.sh/vs/{{competitor}}
- We'll beat their pricing by 20%
{{endif}}

**Win-back offer:**
Come back and get **50% off for 3 months**.

Code: COMEBACK50
Expires: {{expiry_date}}

**Reactivate your account:** https://agentik.sh/reactivate?code=COMEBACK50

No strings. Cancel anytime.

— Sarah

P.S. Your old agents are still here. We kept them safe.
```

**CTA**: Reactivate with 50% discount
**Conversion Goal**: Subscription restarted
**Personalization**: Customize based on churn reason
**Urgency**: 7-day expiration on offer

---

#### Email 16: Final Goodbye (Send: Day 60 post-churn)
**Subject**: "This is goodbye (unless you want to stay in touch)"

```
Hi {{first_name}},

It's been 60 days since you left Agentik OS.

**Your data expires in 30 days** (Day 90). After that, it's gone forever.

**Want to keep it?**
Log in once and we'll preserve it: https://agentik.sh/login

**Want updates without the product?**
We publish a monthly newsletter about AI agents, new models, and industry news. No product pitches.

Subscribe: https://agentik.sh/newsletter

**Want to fully delete your data now?**
Click here: https://agentik.sh/delete-account

**Otherwise:**
This is my last email. Unsubscribing you from all product emails now.

Thanks for trying Agentik OS. Good luck with your projects.

— Alex

P.S. If you ever change your mind, we're here. Your data lives until Day 90.
```

**CTA**: Preserve data, subscribe to newsletter, or delete account
**Conversion Goal**: Newsletter subscription or data preservation
**Tone**: Respectful final goodbye
**Action**: Auto-unsubscribe from product emails after this

---

### 6. Educational Nurture Series (All Users)
**Trigger**: Opt-in or after 30 days as active user
**Frequency**: Weekly
**Goal**: Engagement and education
**Emails**: Ongoing series

#### Email 17: Weekly Newsletter Template
**Subject**: "AI Agent Weekly: {{topic_of_week}}"

```
Hi {{first_name}},

Your weekly AI agent update from Agentik OS.

**This Week's Topic: {{topic}}**

{{content_section_1}}

{{content_section_2}}

**From the Community:**
- {{community_highlight_1}}
- {{community_highlight_2}}

**New This Week:**
- {{product_update_1}}
- {{product_update_2}}

**Worth Reading:**
{{external_article_1}}
{{external_article_2}}

**Agent of the Week:**
{{featured_agent_showcase}}

That's it for this week. See you next Monday.

— Sarah

**P.S.** Got a cool agent to share? Reply and we'll feature it.
```

**Topics Rotation** (8-week cycle):
1. Multi-model routing strategies
2. Skill development best practices
3. Security and sandboxing deep dive
4. Cost optimization techniques
5. Agent Dreams and automation
6. Team collaboration workflows
7. Production deployment tips
8. Community showcase + case studies

**CTA**: Read full article or try featured technique
**Conversion Goal**: Engagement (click-through rate >15%)
**Format**: Educational, not promotional
**Unsubscribe**: Easy opt-out at bottom

---

## Email Automation Workflows

### Resend Configuration

```typescript
// lib/email/campaigns.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export const emailCampaigns = {
  // Welcome Series
  welcome: {
    id: 'welcome-series',
    emails: [
      {
        name: 'welcome-quick-win',
        delay: 0, // immediate
        template: 'welcome-01',
        subject: 'Welcome to Agentik OS! Your first agent in 5 minutes 🚀',
        conditions: [],
      },
      {
        name: 'first-agent-tutorial',
        delay: 24 * 60, // 1 day in minutes
        template: 'welcome-02',
        subject: '{{first_name}}, let\'s build something real today',
        conditions: [
          { field: 'agents_deployed', operator: '==', value: 0 },
        ],
      },
      {
        name: 'multi-model-router',
        delay: 72 * 60, // 3 days
        template: 'welcome-03',
        subject: 'How TechCorp saved $8.6K/month with one config change',
        conditions: [
          { field: 'agents_deployed', operator: '>=', value: 1 },
        ],
      },
      {
        name: 'skill-marketplace',
        delay: 120 * 60, // 5 days
        template: 'welcome-04',
        subject: '500+ pre-built skills. Install in 10 seconds.',
        conditions: [
          { field: 'routing_enabled', operator: '==', value: true },
        ],
      },
      {
        name: 'upgrade-to-pro',
        delay: 168 * 60, // 7 days
        template: 'welcome-05',
        subject: '{{first_name}}, ready to go beyond the free tier?',
        conditions: [
          { field: 'agents_deployed', operator: '>=', value: 2 },
          { field: 'skills_installed', operator: '>=', value: 1 },
        ],
      },
    ],
  },

  // Trial Nurture
  trialNurture: {
    id: 'trial-nurture',
    emails: [
      {
        name: 'trial-welcome',
        delay: 0,
        template: 'trial-01',
        subject: 'Your Pro trial is live! Here\'s what\'s unlocked 🔓',
      },
      {
        name: 'trial-feature-deepdive',
        delay: 5 * 24 * 60, // 5 days
        template: 'trial-02',
        subject: 'The one Pro feature you\'re probably not using (but should)',
        conditions: [
          { field: 'team_members', operator: '==', value: 0 },
        ],
      },
      {
        name: 'trial-conversion-push',
        delay: 11 * 24 * 60, // 11 days
        template: 'trial-03',
        subject: 'Your trial ends in 3 days. Here\'s what happens next.',
      },
      {
        name: 'trial-last-chance',
        delay: 14 * 24 * 60, // 14 days
        template: 'trial-04',
        subject: 'Last day: Your Pro trial expires tonight',
        conditions: [
          { field: 'subscription_status', operator: '!=', value: 'active' },
        ],
      },
    ],
  },

  // Activation (Inactive Users)
  activation: {
    id: 'activation-series',
    emails: [
      {
        name: 'reengagement',
        delay: 7 * 24 * 60, // 7 days inactive
        template: 'activation-01',
        subject: '{{first_name}}, you haven\'t deployed an agent yet. Need help?',
        conditions: [
          { field: 'agents_deployed', operator: '==', value: 0 },
          { field: 'days_since_signup', operator: '>=', value: 7 },
        ],
      },
      {
        name: 'success-stories',
        delay: 10 * 24 * 60, // 10 days inactive
        template: 'activation-02',
        subject: '5 things people built with Agentik OS this week',
        conditions: [
          { field: 'agents_deployed', operator: '==', value: 0 },
        ],
      },
      {
        name: 'final-nudge',
        delay: 14 * 24 * 60, // 14 days inactive
        template: 'activation-03',
        subject: 'We\'re here when you\'re ready',
        conditions: [
          { field: 'agents_deployed', operator: '==', value: 0 },
        ],
      },
    ],
  },

  // Re-engagement (Churned)
  reengagement: {
    id: 'reengagement-series',
    emails: [
      {
        name: 'exit-survey',
        delay: 0, // immediate on churn
        template: 'churn-01',
        subject: 'Sorry to see you go. Quick question?',
      },
      {
        name: 'winback-offer',
        delay: 30 * 24 * 60, // 30 days post-churn
        template: 'churn-02',
        subject: 'We\'ve improved. Want to give us another shot?',
      },
      {
        name: 'final-goodbye',
        delay: 60 * 24 * 60, // 60 days post-churn
        template: 'churn-03',
        subject: 'This is goodbye (unless you want to stay in touch)',
      },
    ],
  },
};

// Trigger campaign
export async function triggerCampaign(
  userId: string,
  campaignId: keyof typeof emailCampaigns,
  userData: Record<string, any>
) {
  const campaign = emailCampaigns[campaignId];

  for (const email of campaign.emails) {
    // Check conditions
    const conditionsMet = email.conditions?.every(condition => {
      const userValue = userData[condition.field];
      switch (condition.operator) {
        case '==': return userValue == condition.value;
        case '!=': return userValue != condition.value;
        case '>=': return userValue >= condition.value;
        case '<=': return userValue <= condition.value;
        case '>': return userValue > condition.value;
        case '<': return userValue < condition.value;
        default: return true;
      }
    }) ?? true;

    if (!conditionsMet) continue;

    // Schedule email
    await scheduleEmail({
      userId,
      templateId: email.template,
      subject: interpolate(email.subject, userData),
      delay: email.delay,
    });
  }
}
```

---

## A/B Testing Strategy

### Email 1: Welcome Subject Line
**Variants**:
- A: "Welcome to Agentik OS! Your first agent in 5 minutes 🚀" (Control)
- B: "Welcome! Let's build your first AI agent together"
- C: "{{first_name}}, your AI agent platform is ready"

**Metric**: Open rate (target: >35%)
**Winner**: Variant with highest open rate after 1000 sends

### Email 3: Multi-Model Router Subject
**Variants**:
- A: "How TechCorp saved $8.6K/month with one config change" (Control - specific $)
- B: "Save 72% on AI costs with multi-model routing" (Control - percentage)
- C: "The feature that cuts your AI bill in half"

**Metric**: Click-through rate (target: >12%)

### Email 5: Upgrade to Pro Discount
**Variants**:
- A: 20% off first 3 months (Control)
- B: 30% off first 3 months
- C: $20 off first 3 months (flat discount)
- D: First month free, then full price

**Metric**: Conversion rate to paid (target: >8%)

### Email 7: Trial Feature Focus
**Variants**:
- A: Agent Dreams (autonomous scheduling) (Control)
- B: Team Collaboration (invite team members)
- C: Cost Analytics (detailed billing breakdown)

**Metric**: Feature adoption rate (target: >25% try featured feature)

### Email 15: Win-back Discount
**Variants**:
- A: 50% off for 3 months (Control)
- B: 60% off for 3 months
- C: 3 months free, then full price
- D: Lifetime 25% discount

**Metric**: Reactivation rate (target: >5%)

**Testing Platform**: Resend A/B testing + PostHog for analytics

---

## Personalization Variables

```typescript
// User data for email personalization
interface EmailUserData {
  // Profile
  first_name: string;
  last_name: string;
  email: string;
  company?: string;
  role?: string;

  // Activity
  signup_date: Date;
  days_since_signup: number;
  last_login: Date;
  agents_deployed: number;
  tasks_run: number;
  skills_installed: number;

  // Features
  routing_enabled: boolean;
  dreams_created: number;
  team_members: number;

  // Billing
  plan: 'free' | 'pro' | 'enterprise';
  subscription_status: 'active' | 'trial' | 'canceled' | 'expired';
  trial_start_date?: Date;
  trial_end_date?: Date;
  mrr: number; // Monthly Recurring Revenue

  // Engagement
  email_opens: number;
  email_clicks: number;
  support_tickets: number;

  // Cost tracking
  estimated_savings: number; // vs. paying OpenAI/Anthropic directly
  monthly_spend: number;

  // Churn prediction
  churn_risk_score: number; // 0-100
  last_activity_days_ago: number;
}
```

---

## Deliverability Best Practices

### 1. Sender Authentication
```
SPF Record: v=spf1 include:_spf.resend.com ~all
DKIM: Configured via Resend dashboard
DMARC: v=DMARC1; p=quarantine; rua=mailto:dmarc@agentik.sh
```

### 2. Warm-up Schedule
**Week 1**: 50 emails/day
**Week 2**: 200 emails/day
**Week 3**: 500 emails/day
**Week 4**: 1,000 emails/day
**Week 5**: 2,500 emails/day
**Week 6+**: Full volume

### 3. Engagement Monitoring
- **Suppress unengaged** after 90 days (0 opens)
- **Re-engagement campaign** before suppression
- **Sunset policy**: Remove suppressed after 180 days

### 4. Spam Avoidance
- ❌ Avoid: "Free", "Click here", "Act now", excessive exclamation marks
- ✅ Use: Personalization, plain text + HTML, clear unsubscribe
- **Spam score target**: <3.0 (use mail-tester.com)

---

## Metrics & Goals

### Email Performance Targets

| Email Type | Open Rate | Click Rate | Conversion |
|------------|-----------|------------|------------|
| **Welcome Series** | 45-55% | 15-25% | 35% deploy agent |
| **Trial Nurture** | 50-65% | 20-30% | 18% convert to paid |
| **Activation** | 25-35% | 8-15% | 20% deploy agent |
| **Feature Announce** | 35-45% | 12-20% | 25% try feature |
| **Re-engagement** | 20-30% | 5-10% | 5% reactivate |
| **Newsletter** | 30-40% | 15-25% | N/A (educational) |

### Revenue Impact

| Campaign | Users/Month | Conversion | Value/User | Monthly Impact |
|----------|-------------|------------|------------|----------------|
| **Welcome → Pro** | 1,000 | 8% | $49 | $3,920 |
| **Trial → Paid** | 300 | 18% | $49 | $2,646 |
| **Activation → Pro** | 500 | 5% | $49 | $1,225 |
| **Win-back** | 200 | 5% | $49 | $490 |
| **TOTAL** | | | | **$8,281/month** |

**Annual Revenue Impact**: $99,372
**Cost** (Resend Pro): $20/month
**ROI**: 4,968x

---

## Technical Implementation

### 1. Install Resend

```bash
pnpm add resend
```

### 2. Email Templates

```typescript
// lib/email/templates/welcome-01.tsx
import { Html, Head, Body, Container, Heading, Text, Button, Code } from '@react-email/components';

interface WelcomeEmailProps {
  firstName: string;
}

export default function WelcomeEmail({ firstName }: WelcomeEmailProps) {
  return (
    <Html>
      <Head />
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Welcome to Agentik OS!</Heading>

          <Text style={text}>Hi {firstName},</Text>

          <Text style={text}>
            Welcome to Agentik OS! You're now part of 5,000+ developers building the future of AI agents.
          </Text>

          <Heading as="h2" style={h2}>Get started in 5 minutes:</Heading>

          <Text style={text}>1. Install the CLI:</Text>
          <Code style={code}>curl -fsSL https://agentik.sh/install.sh | sh</Code>

          <Text style={text}>2. Create your first agent:</Text>
          <Code style={code}>panda new my-first-agent</Code>

          <Text style={text}>3. Deploy it:</Text>
          <Code style={code}>panda deploy</Code>

          <Button href="https://docs.agentik.sh/quickstart" style={button}>
            View Full Tutorial
          </Button>

          <Text style={text}>
            Need help? Reply to this email or join our Discord.
          </Text>

          <Text style={signature}>
            — Alex & Sarah<br />
            Founders, Agentik OS
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: '#f6f9fc', fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' };
const container = { backgroundColor: '#ffffff', margin: '0 auto', padding: '20px 0 48px', marginBottom: '64px' };
const h1 = { color: '#333', fontSize: '24px', fontWeight: 'bold', margin: '40px 0', padding: '0' };
const h2 = { color: '#333', fontSize: '20px', fontWeight: 'bold', margin: '24px 0 16px' };
const text = { color: '#333', fontSize: '16px', lineHeight: '26px' };
const code = { backgroundColor: '#f4f4f4', padding: '12px', borderRadius: '4px', fontFamily: 'monospace', fontSize: '14px' };
const button = { backgroundColor: '#9c87f5', borderRadius: '4px', color: '#fff', fontSize: '16px', textDecoration: 'none', textAlign: 'center' as const, display: 'block', width: '200px', padding: '12px' };
const signature = { color: '#666', fontSize: '14px', lineHeight: '24px', marginTop: '32px' };
```

### 3. Send Email Function

```typescript
// lib/email/send.ts
import { Resend } from 'resend';
import WelcomeEmail from './templates/welcome-01';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendWelcomeEmail(user: { email: string; firstName: string }) {
  const { data, error } = await resend.emails.send({
    from: 'Alex & Sarah <founders@agentik.sh>',
    to: [user.email],
    subject: 'Welcome to Agentik OS! Your first agent in 5 minutes 🚀',
    react: WelcomeEmail({ firstName: user.firstName }),
  });

  if (error) {
    console.error('Failed to send welcome email:', error);
    throw error;
  }

  return data;
}
```

### 4. Trigger on User Signup

```typescript
// app/api/auth/signup/route.ts
import { sendWelcomeEmail } from '@/lib/email/send';
import { triggerCampaign } from '@/lib/email/campaigns';

export async function POST(req: Request) {
  const { email, firstName, lastName } = await req.json();

  // Create user...
  const user = await createUser({ email, firstName, lastName });

  // Send immediate welcome email
  await sendWelcomeEmail(user);

  // Start welcome campaign (scheduled emails)
  await triggerCampaign(user.id, 'welcome', {
    first_name: firstName,
    agents_deployed: 0,
    routing_enabled: false,
    skills_installed: 0,
  });

  return Response.json({ success: true });
}
```

---

## Analytics & Reporting

### PostHog Event Tracking

```typescript
// Track email events
posthog.capture({
  distinctId: user.id,
  event: 'email_sent',
  properties: {
    campaign: 'welcome',
    email_id: 'welcome-01',
    subject: 'Welcome to Agentik OS!',
  },
});

posthog.capture({
  distinctId: user.id,
  event: 'email_opened',
  properties: {
    campaign: 'welcome',
    email_id: 'welcome-01',
  },
});

posthog.capture({
  distinctId: user.id,
  event: 'email_clicked',
  properties: {
    campaign: 'welcome',
    email_id: 'welcome-01',
    link: 'https://docs.agentik.sh/quickstart',
  },
});
```

### Dashboard Metrics

**Real-time monitoring**:
- Campaign performance (open/click/convert rates)
- Revenue attribution by campaign
- Churn prediction alerts
- Deliverability scores
- A/B test results

**Weekly reports**:
- Top performing emails
- Underperforming campaigns (action items)
- Cohort analysis (signup week X conversion)
- Revenue impact vs. goal

---

## Compliance

### GDPR & CAN-SPAM
- ✅ Clear unsubscribe link in every email (bottom)
- ✅ Honor unsubscribe within 24 hours
- ✅ Include physical mailing address
- ✅ Accurate "From" name and email
- ✅ Don't sell email lists
- ✅ Consent tracking (opt-in for newsletters)

### Footer Template
```html
<footer style="margin-top: 48px; padding-top: 24px; border-top: 1px solid #eee; color: #666; font-size: 12px;">
  <p>Agentik OS, Inc.</p>
  <p>123 Innovation Drive, San Francisco, CA 94103</p>
  <p>
    <a href="{{unsubscribe_link}}" style="color: #9c87f5;">Unsubscribe</a> |
    <a href="https://agentik.sh/privacy" style="color: #9c87f5;">Privacy Policy</a> |
    <a href="https://agentik.sh/terms" style="color: #9c87f5;">Terms of Service</a>
  </p>
</footer>
```

---

## Next Steps

1. **Week 1**: Set up Resend, create templates for Welcome Series (Emails 1-5)
2. **Week 2**: Build automation workflows, integrate with signup flow
3. **Week 3**: Launch Welcome Series, monitor metrics
4. **Week 4**: Create Trial Nurture (Emails 6-9), A/B test subject lines
5. **Week 5**: Build Activation Series (Emails 10-12) for inactive users
6. **Week 6**: Feature Announcement template (Email 13), first announcement
7. **Week 7**: Re-engagement Series (Emails 14-16), win-back campaigns
8. **Week 8**: Weekly Newsletter (Email 17), ongoing content strategy

**Estimated setup time**: 42 hours (6 weeks @ 7h/week)
**Expected revenue impact**: $99K/year
**ROI timeline**: 30 days to first revenue attribution

---

**Total Email Campaigns**: 17 sequences
**Total Emails**: 18 (1 template reusable for feature launches + newsletter)
**Automation Platform**: Resend (primary), SendGrid (backup)
**Analytics**: PostHog + Resend built-in analytics
**Templates**: React Email Components
**Testing**: A/B tests on 5 critical emails
**Compliance**: GDPR + CAN-SPAM compliant

**Status**: Ready for implementation ✅
