# CLI Commands Reference

> **Complete reference for the `panda` command-line interface**

Manage agents, chat with AI, deploy to production, and more—all from your terminal.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Global Options](#global-options)
4. [Init & Configuration](#init--configuration)
5. [Agent Management](#agent-management)
6. [Chat & Messaging](#chat--messaging)
7. [Skills](#skills)
8. [OS Modes](#os-modes)
9. [Sessions](#sessions)
10. [Logs & Monitoring](#logs--monitoring)
11. [Cost Tracking](#cost-tracking)
12. [Deployment](#deployment)
13. [Advanced Commands](#advanced-commands)

---

## Introduction

The `panda` CLI is your command-line interface to Agentik OS. Use it to:

- 🤖 Create and manage AI agents
- 💬 Chat with agents from your terminal
- 🛠️ Develop and test skills
- 📊 Monitor costs and usage
- 🚀 Deploy to production
- 🐛 Debug and troubleshoot

**Why "panda"?**
- **P**owerful
- **A**gent
- **N**ative
- **D**evelopment
- **A**rchitecture

---

## Installation

### NPM/PNPM (Recommended)

```bash
npm install -g @agentik/cli
# or
pnpm add -g @agentik/cli
```

### Homebrew (macOS/Linux)

```bash
brew tap agentik-os/tap
brew install panda
```

### Standalone Binary

```bash
# Download latest release
curl -fsSL https://install.agentik-os.com | sh
```

### Verify Installation

```bash
panda --version
# panda 1.0.0
```

---

## Global Options

All commands accept these global options:

| Option | Alias | Description |
|--------|-------|-------------|
| `--help` | `-h` | Show help |
| `--version` | `-v` | Show version |
| `--json` | `-j` | Output as JSON |
| `--api-key <key>` | | Override API key |
| `--quiet` | `-q` | Suppress output (except errors) |
| `--verbose` | | Show debug logs |

**Examples:**

```bash
# Show help for a command
panda agent create --help

# Get JSON output (for scripting)
panda agent list --json

# Use custom API key
panda agent list --api-key agk_test_xxxxx
```

---

## Init & Configuration

### `panda init`

Initialize Agentik OS in a project.

**Usage:**

```bash
panda init
```

**Interactive Wizard:**

```
🐼 Agentik OS Setup

? Project name: my-ai-app
? AI provider: (Use arrow keys)
  ❯ Claude (Anthropic)
    OpenAI (GPT-4, GPT-5)
    Google (Gemini)
    Multiple providers

? Backend: (Use arrow keys)
  ❯ Convex (Recommended - Real-time, serverless)
    Supabase
    Custom

Creating agentik.config.json...
Installing dependencies...
✅ Setup complete!

Next steps:
  1. panda agent create
  2. panda chat
```

**Output:**

```
agentik.config.json
.env.local
```

---

### `panda config`

View or update configuration.

**Usage:**

```bash
# View all config
panda config

# Get specific value
panda config get apiKey

# Set value
panda config set defaultModel claude-sonnet-4-5

# Reset to defaults
panda config reset
```

**Config File Location:**

```
~/.agentik/config.json
```

**Example Config:**

```json
{
  "apiKey": "agk_live_xxxxx",
  "defaultModel": "claude-sonnet-4-5",
  "defaultMode": "focus",
  "backend": "convex",
  "backendUrl": "https://happy-animal-123.convex.cloud"
}
```

---

## Agent Management

### `panda agent create`

Create a new AI agent.

**Usage:**

```bash
panda agent create [options]
```

**Options:**

| Option | Description | Required |
|--------|-------------|----------|
| `--name <name>` | Agent name | Yes |
| `--model <model>` | AI model ID | No (default: claude-sonnet-4-5) |
| `--prompt <text>` | System prompt | No |
| `--prompt-file <path>` | Read prompt from file | No |
| `--temperature <0-1>` | Temperature | No (default: 0.7) |
| `--max-tokens <number>` | Max output tokens | No (default: 4096) |
| `--mode <mode>` | OS mode (focus/creative/research) | No |
| `--skills <skills...>` | Install skills | No |
| `--budget <amount>` | Max cost per message (USD) | No |

**Examples:**

```bash
# Simple agent
panda agent create --name "Support Bot" --model claude-sonnet-4-5

# With custom prompt
panda agent create \
  --name "Code Reviewer" \
  --model claude-opus-4-6 \
  --prompt "You are an expert code reviewer. Focus on security and performance." \
  --temperature 0.5 \
  --budget 0.10

# From prompt file
panda agent create \
  --name "Writer" \
  --prompt-file ./prompts/creative-writer.txt \
  --mode creative \
  --skills web-search file-ops

# Interactive mode (no options)
panda agent create
# Launches wizard
```

**Output:**

```
✅ Agent created successfully!

Agent ID: agent_abc123
Name: Support Bot
Model: claude-sonnet-4-5

Next steps:
  panda chat agent_abc123
```

---

### `panda agent list`

List all agents.

**Usage:**

```bash
panda agent list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--status <status>` | Filter by status (active/paused/archived) |
| `--limit <number>` | Results per page (default: 20) |
| `--json` | Output as JSON |

**Examples:**

```bash
# List all agents
panda agent list

# Only active agents
panda agent list --status active

# JSON output (for scripting)
panda agent list --json | jq '.[] | {id, name, model}'
```

**Output:**

```
🤖 Agents (5)

ID              Name              Model               Status
─────────────────────────────────────────────────────────────
agent_abc123    Support Bot       claude-sonnet-4-5   Active
agent_def456    Code Reviewer     claude-opus-4-6     Active
agent_ghi789    Writer            claude-sonnet-4-5   Paused
```

---

### `panda agent get <id>`

Get agent details.

**Usage:**

```bash
panda agent get <agent-id>
```

**Examples:**

```bash
panda agent get agent_abc123
```

**Output:**

```
🤖 Agent: Support Bot

ID: agent_abc123
Model: claude-sonnet-4-5
Mode: focus
Temperature: 0.7
Max Tokens: 4096
Status: Active

System Prompt:
You are a helpful customer support agent.
Answer questions concisely and professionally.

Skills:
  • web-search (v1.2.0)
  • file-ops (v1.0.3)

Budget:
  Max Cost/Message: $0.10

Created: 2026-02-14 10:30 AM
Updated: 2026-02-14 11:45 AM
```

---

### `panda agent update <id>`

Update an agent.

**Usage:**

```bash
panda agent update <agent-id> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--name <name>` | Update name |
| `--model <model>` | Update model |
| `--prompt <text>` | Update system prompt |
| `--temperature <0-1>` | Update temperature |
| `--mode <mode>` | Update OS mode |
| `--status <status>` | Update status (active/paused/archived) |

**Examples:**

```bash
# Update model
panda agent update agent_abc123 --model claude-opus-4-6

# Update prompt from file
panda agent update agent_abc123 --prompt-file ./new-prompt.txt

# Pause agent
panda agent update agent_abc123 --status paused

# Multiple updates
panda agent update agent_abc123 \
  --temperature 0.9 \
  --mode creative \
  --max-tokens 8192
```

**Output:**

```
✅ Agent updated successfully!

Updated fields:
  • model: claude-sonnet-4-5 → claude-opus-4-6
  • temperature: 0.7 → 0.9
```

---

### `panda agent delete <id>`

Delete an agent.

**Usage:**

```bash
panda agent delete <agent-id> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--force` | Skip confirmation |
| `--permanent` | Hard delete (not recoverable) |

**Examples:**

```bash
# Soft delete (recoverable for 30 days)
panda agent delete agent_abc123

# Hard delete (permanent)
panda agent delete agent_abc123 --permanent --force
```

**Output:**

```
⚠️  Delete agent "Support Bot"?
This will delete the agent and all its sessions.
(Can be recovered for 30 days)

? Confirm deletion: (y/N) y

✅ Agent deleted successfully!

To recover within 30 days:
  panda agent recover agent_abc123
```

---

## Chat & Messaging

### `panda chat [agent-id]`

Start interactive chat with an agent.

**Usage:**

```bash
panda chat [agent-id] [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--session <id>` | Resume existing session |
| `--new-session` | Force new session |
| `--stream` | Stream responses (default: true) |
| `--show-cost` | Show cost after each message |
| `--show-reasoning` | Show agent's reasoning steps |

**Examples:**

```bash
# Chat with specific agent
panda chat agent_abc123

# Resume session
panda chat agent_abc123 --session session_xyz789

# Show cost and reasoning
panda chat agent_abc123 --show-cost --show-reasoning

# No agent ID = interactive selection
panda chat
# → Shows list of agents to choose from
```

**Interactive Chat:**

```
🐼 Chat with Support Bot

Type your message or use commands:
  /exit - Exit chat
  /new - Start new session
  /cost - Show session cost
  /clear - Clear screen
  /help - Show all commands

You: What is your return policy?

Support Bot: Our return policy allows returns within 30 days of purchase.
Items must be in original condition with tags attached.

📊 Cost: $0.023 | Tokens: 150 | Response time: 1.2s

You: How do I initiate a return?

Support Bot: To initiate a return:
1. Log into your account
2. Go to Orders → Select the order
3. Click "Request Return"
4. Print the prepaid shipping label

We'll process your refund within 5-7 business days after receiving the item.

📊 Cost: $0.031 | Tokens: 210 | Session total: $0.054

You: /exit

Session Summary:
  Messages: 4 (2 user, 2 assistant)
  Total Cost: $0.054
  Session ID: session_xyz789

To resume later:
  panda chat agent_abc123 --session session_xyz789
```

---

### `panda send <agent-id> <message>`

Send a single message (non-interactive).

**Usage:**

```bash
panda send <agent-id> <message> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--session <id>` | Session ID |
| `--stream` | Stream response |
| `--json` | Output as JSON |

**Examples:**

```bash
# Simple message
panda send agent_abc123 "What is quantum computing?"

# With session
panda send agent_abc123 "Tell me more" --session session_xyz789

# JSON output (for scripts)
panda send agent_abc123 "Hello" --json | jq '.content'
```

**Output:**

```
Support Bot:
Quantum computing is a type of computing that uses quantum-mechanical
phenomena like superposition and entanglement to perform operations...

Cost: $0.028 | Tokens: 185 | Time: 1.5s
```

---

## Skills

### `panda skill list`

List available skills.

**Usage:**

```bash
panda skill list [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--category <category>` | Filter by category |
| `--verified` | Only verified skills |

**Examples:**

```bash
# All skills
panda skill list

# Only productivity skills
panda skill list --category productivity

# Only verified
panda skill list --verified
```

**Output:**

```
🛠️  Skills Marketplace (24)

ID                    Name              Category      Verified
────────────────────────────────────────────────────────────────
skill_web_search      Web Search        Productivity  ✓
skill_file_ops        File Operations   Productivity  ✓
skill_email           Email Sender      Communication ✓
skill_calendar        Google Calendar   Productivity  ✓
```

---

### `panda skill install <agent-id> <skill-id>`

Install a skill on an agent.

**Usage:**

```bash
panda skill install <agent-id> <skill-id> [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--config <json>` | Skill configuration (JSON string) |
| `--config-file <path>` | Read config from file |

**Examples:**

```bash
# Simple install
panda skill install agent_abc123 skill_web_search

# With configuration
panda skill install agent_abc123 skill_calendar \
  --config '{"apiKey":"xxxxx","timezone":"America/New_York"}'

# From config file
panda skill install agent_abc123 skill_email \
  --config-file ./email-config.json
```

**Output:**

```
✅ Skill installed successfully!

Agent: Support Bot
Skill: Web Search (v1.2.0)

The agent can now search the web.
```

---

## OS Modes

### `panda mode set <agent-id> <mode>`

Set agent's OS mode.

**Usage:**

```bash
panda mode set <agent-id> <mode>
```

**Modes:**

| Mode | Description | Best For |
|------|-------------|----------|
| `focus` | Low temperature, fast models | Factual Q&A, analysis |
| `creative` | High temperature, best models | Writing, brainstorming |
| `research` | Balanced, web search enabled | Research, learning |

**Examples:**

```bash
# Set to creative mode
panda mode set agent_abc123 creative

# Set to focus mode
panda mode set agent_abc123 focus
```

**Output:**

```
✅ Mode updated successfully!

Agent: Support Bot
Mode: focus → creative

Temperature: 0.7 → 0.9
Model: claude-sonnet-4-5 → claude-opus-4-6
Skills: +web-search +file-ops
```

---

## Sessions

### `panda session list [agent-id]`

List sessions.

**Usage:**

```bash
panda session list [agent-id] [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--limit <number>` | Results per page (default: 20) |
| `--active` | Only active sessions |

**Examples:**

```bash
# All sessions
panda session list

# Sessions for specific agent
panda session list agent_abc123

# Active sessions only
panda session list --active
```

**Output:**

```
💬 Sessions (12)

ID              Agent           Messages  Cost    Last Activity
──────────────────────────────────────────────────────────────────
session_xyz789  Support Bot     24        $0.45   2 hours ago
session_abc123  Code Reviewer   156       $3.21   1 day ago
```

---

### `panda session delete <id>`

Delete a session.

**Usage:**

```bash
panda session delete <session-id> [--force]
```

**Examples:**

```bash
panda session delete session_xyz789
```

**Output:**

```
⚠️  Delete session?
This will delete 24 messages.

? Confirm deletion: (y/N) y

✅ Session deleted successfully!
```

---

## Logs & Monitoring

### `panda logs [agent-id]`

View agent logs.

**Usage:**

```bash
panda logs [agent-id] [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--follow` | `-f` - Follow logs in real-time |
| `--tail <number>` | Number of recent lines (default: 100) |
| `--level <level>` | Filter by level (error/warn/info/debug) |
| `--since <time>` | Show logs since time (e.g., "1h", "30m") |

**Examples:**

```bash
# View recent logs
panda logs agent_abc123

# Follow logs in real-time
panda logs agent_abc123 --follow

# Only errors
panda logs agent_abc123 --level error

# Last hour
panda logs agent_abc123 --since 1h
```

**Output:**

```
[2026-02-14 14:23:45] INFO  Message received: "What is..."
[2026-02-14 14:23:46] DEBUG Model: claude-sonnet-4-5, Tokens: 150
[2026-02-14 14:23:47] INFO  Response sent (1.2s, $0.023)
[2026-02-14 14:24:12] INFO  Message received: "Tell me more..."
[2026-02-14 14:24:14] INFO  Response sent (1.8s, $0.031)
```

---

## Cost Tracking

### `panda cost [agent-id]`

View cost analytics.

**Usage:**

```bash
panda cost [agent-id] [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--period <period>` | Period (today/week/month/all) |
| `--breakdown` | Show cost breakdown by model |
| `--export <format>` | Export to CSV or PDF |

**Examples:**

```bash
# Today's costs
panda cost agent_abc123 --period today

# This month with breakdown
panda cost agent_abc123 --period month --breakdown

# Export to CSV
panda cost agent_abc123 --export csv > costs.csv

# All agents
panda cost
```

**Output:**

```
💰 Cost Report: Support Bot

Period: Last 30 days
Total Cost: $47.32

Breakdown by Model:
  claude-opus-4-6:    $28.45 (60%)
  claude-sonnet-4-5:  $15.67 (33%)
  claude-haiku-4-5:    $3.20  (7%)

Messages: 1,234
Avg Cost/Message: $0.038
Tokens: 1,567,890

Top 5 Costliest Sessions:
  1. session_abc123   $4.56   (156 messages)
  2. session_def456   $3.21   (98 messages)
  3. session_ghi789   $2.87   (124 messages)
```

---

## Deployment

### `panda deploy`

Deploy to production.

**Usage:**

```bash
panda deploy [options]
```

**Options:**

| Option | Description |
|--------|-------------|
| `--env <environment>` | Environment (staging/production) |
| `--region <region>` | Deployment region |
| `--replicas <number>` | Number of replicas |

**Examples:**

```bash
# Deploy to production
panda deploy --env production

# Deploy to staging
panda deploy --env staging

# With replicas
panda deploy --env production --replicas 5
```

**Output:**

```
🚀 Deploying to Production...

Building dashboard...                 ✓
Deploying runtime...                  ✓
Configuring load balancer...          ✓
Running health checks...              ✓

✅ Deployment successful!

Dashboard: https://agentik-os.com
API: https://api.agentik-os.com
Status: https://status.agentik-os.com
```

---

## Advanced Commands

### `panda doctor`

Run diagnostics.

**Usage:**

```bash
panda doctor
```

**Output:**

```
🩺 Agentik OS Health Check

✓ CLI version: 1.0.0 (latest)
✓ API connection: OK (52ms)
✓ Convex backend: OK
✓ Clerk auth: OK
✓ API key: Valid (expires in 345 days)
✗ Node.js: 16.20.0 (recommend ≥18.0.0)
⚠ Environment: 3 missing variables

Issues Found:
  1. Node.js version outdated
     → Update to Node.js 18 or higher

  2. Missing environment variables:
     - ANTHROPIC_API_KEY
     - OPENAI_API_KEY
     - GOOGLE_AI_API_KEY

Overall Status: ⚠️  WARNINGS (3)
```

---

### `panda api-keys`

Manage API keys.

**Usage:**

```bash
# List API keys
panda api-keys list

# Create API key
panda api-keys create --name "Production API"

# Rotate API key
panda api-keys rotate agk_live_abc123

# Delete API key
panda api-keys delete agk_live_abc123
```

---

### `panda export`

Export data.

**Usage:**

```bash
# Export all agents
panda export agents --output agents.json

# Export sessions
panda export sessions --agent agent_abc123 --output sessions.json

# Export costs
panda export costs --period month --output costs.csv
```

---

## Summary

The `panda` CLI provides:

- ✅ **Agent management** - Create, list, update, delete
- ✅ **Interactive chat** - Terminal-based chat interface
- ✅ **Skills** - Install and configure skills
- ✅ **OS Modes** - Switch between focus/creative/research
- ✅ **Cost tracking** - Monitor and analyze costs
- ✅ **Deployment** - Deploy to production
- ✅ **Diagnostics** - Health checks and troubleshooting

**Next Steps:**

1. Install: `npm install -g @agentik/cli`
2. Initialize: `panda init`
3. Create agent: `panda agent create`
4. Start chatting: `panda chat`

**Resources:**

- 📚 CLI Guide: [docs.agentik-os.com/cli](https://docs.agentik-os.com/cli)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)
- 📧 Email: cli-support@agentik-os.com

---

*Last updated: February 14, 2026*
*CLI Version: 1.0.0*
*Agentik OS CLI Team*
