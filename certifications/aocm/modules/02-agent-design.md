# Module 2: Agent Design for Non-Developers

## Learning Objectives

By the end of this module, you will be able to:
- Create and configure agents through the dashboard (no code)
- Write effective system prompts for marketing use cases
- Install and configure marketplace skills
- Design multi-agent workflows for complex marketing tasks

## 2.1 Agent Anatomy

### What Makes Up an Agent

Every Agentik OS agent has these components:

| Component | What It Does | Who Configures It |
|-----------|-------------|-------------------|
| **Name & Description** | Identifies the agent | You (dashboard) |
| **System Prompt** | Defines personality, rules, knowledge | You (dashboard) |
| **AI Model** | The brain powering responses | You (dropdown selection) |
| **Skills** | Abilities the agent can use | You (marketplace install) |
| **Channels** | Where the agent is available | You (toggle on/off) |
| **Memory** | What the agent remembers | Automatic + your config |
| **Cost Limits** | Budget controls | You (set amounts) |

### Choosing an AI Model

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| Claude Sonnet | General marketing, support, content | $$ | Fast |
| Claude Opus | Complex analysis, strategy, long documents | $$$$ | Slower |
| Claude Haiku | Simple FAQ, routing, classification | $ | Very fast |
| GPT-4 | Diverse tasks, creative writing | $$$ | Medium |
| GPT-4 Mini | Quick responses, high volume | $ | Very fast |
| Gemini Pro | Multi-modal (images + text) | $$ | Fast |

**Rule of thumb:** Start with the cheapest model that gives good results, upgrade if quality isn't sufficient.

## 2.2 System Prompt Engineering

### The System Prompt Template

```
You are [AGENT NAME], a [ROLE] for [COMPANY NAME].

## Your Personality
- [Trait 1: e.g., Professional but friendly]
- [Trait 2: e.g., Concise — keep responses under 3 sentences when possible]
- [Trait 3: e.g., Always end with a helpful next step]

## Your Knowledge
- [Fact 1: e.g., Our product costs $29/month for Pro plan]
- [Fact 2: e.g., We offer a 14-day free trial]
- [Fact 3: e.g., Support hours are 9am-6pm EST]

## Your Rules
- NEVER discuss competitors by name
- NEVER make promises about features in development
- ALWAYS offer to connect with a human if you're unsure
- ALWAYS use the customer's name if provided

## Your Escalation Triggers
If the customer mentions:
- Legal action → Escalate immediately
- Billing dispute over $100 → Escalate to billing team
- Bug report → Create ticket and acknowledge
```

### Prompt Engineering Tips

| Principle | Bad Example | Good Example |
|-----------|-------------|--------------|
| Be specific | "Be helpful" | "Answer product questions using our FAQ. If unsure, say 'Let me connect you with our team.'" |
| Set constraints | "Don't be rude" | "Keep responses under 150 words. Use a professional, warm tone." |
| Give examples | "Format nicely" | "Use bullet points for lists. Bold key terms. End with a question." |
| Define boundaries | "Help with anything" | "Only answer questions about our SaaS product. For unrelated topics, redirect politely." |

### Brand Voice Guide

| Voice Attribute | Description | Example |
|----------------|-------------|---------|
| **Tone** | How it sounds | Friendly but professional (not casual or corporate) |
| **Vocabulary** | Words to use/avoid | Use "help" not "assist"; "issue" not "problem" |
| **Length** | Response size | 1-3 sentences for chat; up to 5 for email |
| **Emoji** | When to use | Only in Telegram/Discord, never in email |
| **Sign-off** | How to end | "Is there anything else I can help with?" |

## 2.3 Installing Marketplace Skills

### What Are Skills?

Skills give your agent abilities beyond conversation:

| Skill | What It Does | Use Case |
|-------|-------------|----------|
| Web Search | Search the internet | Answer product comparison questions |
| Email Send | Send emails | Follow-up with leads |
| Calendar | Schedule meetings | Book demos and consultations |
| CRM Update | Update customer records | Log interactions automatically |
| Analytics | Pull marketing metrics | Generate performance reports |
| Content Gen | Create marketing copy | Draft social posts, emails |

### Installing a Skill (Dashboard)

1. Navigate to **Marketplace** in the sidebar
2. Browse or search for the skill you need
3. Click **Install** on the skill card
4. Review the permissions requested
5. Click **Confirm Install**
6. Go to your agent → **Skills** tab → Enable the new skill

### Permission Categories

When installing skills, you'll see permission requests:

| Permission | Meaning | Risk Level |
|-----------|---------|------------|
| Network Access | Can make web requests | Medium |
| File Read | Can read uploaded files | Low |
| File Write | Can save/export files | Medium |
| API Access | Can call external services | Medium |
| Memory Access | Can read conversation history | Low |

**Rule:** Only approve permissions that make sense for the skill's purpose.

## 2.4 Multi-Agent Workflows

### Why Multiple Agents?

One agent trying to do everything = mediocre at all tasks.
Specialized agents = excellent at specific tasks.

### Example: Content Marketing Pipeline

```
Agent 1: "Research Scout"
├── Model: Haiku (fast, cheap)
├── Skills: Web Search, Analytics
├── Task: Find trending topics in your industry
│
Agent 2: "Content Writer"
├── Model: Sonnet (balanced)
├── Skills: Content Gen
├── Task: Write drafts based on Scout's findings
│
Agent 3: "Brand Guardian"
├── Model: Haiku (fast)
├── Skills: None (just reviews)
├── Task: Check drafts against brand guidelines
│
Human: Final review and publish
```

### Example: Lead Qualification Flow

```
Website Visitor arrives
        ↓
Agent: "Greeter" (Haiku - fast, cheap)
├── Welcomes visitor
├── Asks qualifying questions
├── Scores the lead
        ↓
Hot Lead → Agent: "Demo Booker" (Sonnet)
├── Discusses product in depth
├── Books a demo meeting
├── Sends confirmation email
        ↓
Warm Lead → Agent: "Nurturer" (Haiku)
├── Sends educational content
├── Drip email sequence
├── Checks back in 7 days
```

## 2.5 Guardrails & Safety

### Preventing Off-Brand Responses

Add these to your system prompt:

```
## Absolute Rules (NEVER break these)
1. Never mention competitor products by name
2. Never share internal pricing or discount codes
3. Never promise features that don't exist
4. Never share customer data with other customers
5. Never use profanity or inappropriate language
```

### Content Moderation

| Scenario | Agent Response |
|----------|---------------|
| Abusive customer | "I understand you're frustrated. Let me connect you with a team member." |
| Off-topic question | "I specialize in [topic]. For other questions, I'd recommend [resource]." |
| Attempting to jailbreak | "I'm designed to help with [specific purpose]. How can I assist you today?" |
| Requesting personal data | "For privacy reasons, I can't share that information. Please contact support." |

## Labs

### Lab 2.1: Create a Customer Support Agent

Using the dashboard:
1. Click **Create Agent**
2. Name it "[Your Company] Support Bot"
3. Select Claude Haiku (cost-effective for support)
4. Write a system prompt using the template above
5. Enable the Web Chat channel
6. Set a daily cost limit of $5
7. Test with 10 sample customer questions

### Lab 2.2: Write Effective System Prompts

Practice prompt engineering:
1. Write a prompt for a lead qualification chatbot
2. Write a prompt for a content creation assistant
3. Write a prompt for an internal FAQ bot
4. Peer-review prompts (or use a second agent to review)

### Lab 2.3: Install and Configure Skills

Enhance your support agent:
1. Install the "Web Search" skill
2. Install the "Email Send" skill
3. Configure the email skill with your SMTP settings
4. Test: ask the agent to find something online and email it to you

### Lab 2.4: Multi-Agent Content Pipeline

Build a 3-agent content workflow:
1. Create a Research agent (Haiku + Web Search)
2. Create a Writer agent (Sonnet + Content Gen)
3. Create a Reviewer agent (Haiku, no skills)
4. Test the pipeline: give a topic and follow it through all 3 agents

## Quiz Questions (Sample)

1. Which AI model is best for high-volume, simple FAQ responses?
   - a) Claude Opus
   - b) GPT-4
   - c) Claude Haiku ✓
   - d) Gemini Pro

2. What should you ALWAYS include in a support agent's system prompt?
   - a) Competitor pricing
   - b) Escalation triggers and rules ✓
   - c) Internal company financials
   - d) Employee contact information

3. When installing a marketplace skill, what should you check?
   - a) The skill's star rating only
   - b) That the permissions match the skill's purpose ✓
   - c) Nothing, all skills are safe
   - d) The developer's social media profiles
