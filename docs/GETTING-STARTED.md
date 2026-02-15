# Getting Started with Agentik OS

Welcome to **Agentik OS** - your AI Agent Operating System! This guide will help you install, configure, and create your first AI agent in under 10 minutes.

**What you'll learn:**
- How to install and verify Agentik OS
- Creating your first AI agent
- Having conversations with your agent
- Managing multiple agents
- Troubleshooting common issues

**No AI agent experience required** - we'll guide you through everything step by step.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Configuration](#configuration)
5. [Creating Your First Agent](#creating-your-first-agent)
6. [Chat Interface](#chat-interface)
7. [Managing Agents](#managing-agents)
8. [Troubleshooting](#troubleshooting)
9. [Next Steps](#next-steps)

---

## Prerequisites

Before installing Agentik OS, ensure you have:

### Required

- **Node.js** 20 or higher ([download here](https://nodejs.org/))
- **pnpm** 9.0 or higher (install: `npm install -g pnpm`)
- **Anthropic API Key** (Claude) - [Get free trial](https://console.anthropic.com/)

### Optional

- **OpenAI API Key** (GPT-4/5) - [Get key](https://platform.openai.com/)
- **Google AI API Key** (Gemini) - [Get key](https://aistudio.google.com/)
- **Ollama** (for local models) - [Install](https://ollama.ai/)

### Verify Prerequisites

```bash
# Check Node.js version
node --version
# Should be v20.0.0 or higher

# Check pnpm version
pnpm --version
# Should be 9.0.0 or higher
```

**Estimated time:** 2 minutes

---

## Installation

### Step 1: Clone the Repository

```bash
# Clone Agentik OS
git clone https://github.com/agentik-os/agentik-os.git
cd agentik-os
```

### Step 2: Install Dependencies

```bash
# Install all packages (uses Turborepo + pnpm workspace)
pnpm install

# This will install:
# - Runtime package (core agent engine)
# - CLI package (panda commands)
# - Dashboard package (web UI - optional)
# - Shared types and utilities
```

**Estimated time:** 3-5 minutes (depending on internet speed)

### Step 3: Build the Packages

```bash
# Build all packages
pnpm build

# This compiles:
# - TypeScript → JavaScript
# - All workspace packages
# - Optimized for production
```

**Estimated time:** 1-2 minutes

### Step 4: Verify Installation

```bash
# Verify CLI is accessible
pnpm --filter @agentik-os/cli exec panda --version

# Expected output:
# Agentik OS CLI v1.0.0
```

If you see the version number, **installation successful!** ✅

**Estimated time:** 1 minute

---

## Quick Start

Let's create your first agent and have a conversation in 5 steps:

### Step 1: Initialize Agentik OS

```bash
# Initialize the system (creates config file)
pnpm --filter @agentik-os/cli exec panda init

# You'll be prompted for:
# - Default model provider (Anthropic/OpenAI/Google)
# - API key
# - Preferences (temperature, max tokens)
```

**Example interaction:**
```
🤖 Welcome to Agentik OS!

? Select default model provider: Anthropic (Claude)
? Enter Anthropic API Key: sk-ant-xxxxx
? Default temperature (0-1): 0.7
? Default max tokens: 4096

✅ Configuration saved to .agentik/config.json
```

### Step 2: Create Your First Agent

```bash
# Create an agent named "assistant"
pnpm --filter @agentik-os/cli exec panda agent create \
  --name "assistant" \
  --model "claude-sonnet-4-5-20250929" \
  --system "You are a helpful AI assistant."

# Expected output:
# ✅ Agent 'assistant' created successfully!
# ID: agent_1234567890_assistant
```

### Step 3: Start Chatting

```bash
# Start interactive chat with your agent
pnpm --filter @agentik-os/cli exec panda chat --agent assistant

# Chat interface will open:
# ╔════════════════════════════════════╗
# ║   🤖  Agentik OS - CLI Chat       ║
# ╚════════════════════════════════════╝
#
# User: you | Agent: assistant
# Type /help for commands, /exit to quit
```

### Step 4: Have a Conversation

```
You: Hello! What can you help me with?

assistant: Hello! I'm your AI assistant powered by Claude Sonnet. I can help you with:
- Answering questions and providing information
- Writing and editing content
- Problem-solving and brainstorming
- Code assistance and debugging
- And much more!

What would you like help with today?

You: Explain how Agentik OS works in simple terms.

assistant: Agentik OS is like an operating system for AI agents! Here's how it works:

1. **Message Pipeline**: When you send a message, it goes through a 9-stage pipeline
2. **Model Router**: The system picks the best AI model for your question (balancing quality and cost)
3. **Memory**: Your conversation history is saved so agents remember context
4. **Multi-Provider**: Use Claude, GPT-4, Gemini, or local models - all from one interface

Think of it as a smart layer that manages your AI conversations efficiently!
```

### Step 5: Exit Chat

```
You: /exit

👋 Goodbye! Your conversation has been saved.
```

**Congratulations!** You just created and chatted with your first AI agent. 🎉

**Total time:** 5-10 minutes

---

## Configuration

Agentik OS stores configuration in `.agentik/config.json` in your home directory.

### Configuration File Structure

```json
{
  "defaultProvider": "anthropic",
  "providers": {
    "anthropic": {
      "apiKey": "sk-ant-xxxxx",
      "models": ["claude-opus-4-6", "claude-sonnet-4-5-20250929", "claude-haiku-4-5-20251001"]
    },
    "openai": {
      "apiKey": "sk-xxxxx",
      "models": ["gpt-4o", "gpt-4o-mini", "o1"]
    },
    "google": {
      "apiKey": "xxxxx",
      "models": ["gemini-pro", "gemini-ultra"]
    }
  },
  "defaults": {
    "temperature": 0.7,
    "maxTokens": 4096,
    "budget": {
      "maxCostPerMessage": 0.10,
      "dailyLimit": 5.00
    }
  },
  "memory": {
    "shortTermLimit": 10,
    "sessionLimit": 100
  }
}
```

### Update Configuration

```bash
# View current configuration
pnpm --filter @agentik-os/cli exec panda config

# Update a specific value
pnpm --filter @agentik-os/cli exec panda config set providers.anthropic.apiKey "new-key"

# Update budget limit
pnpm --filter @agentik-os/cli exec panda config set defaults.budget.dailyLimit 10.00
```

### Environment Variables (Alternative)

You can also use environment variables instead of the config file:

```bash
# Anthropic
export ANTHROPIC_API_KEY="sk-ant-xxxxx"

# OpenAI
export OPENAI_API_KEY="sk-xxxxx"

# Google
export GOOGLE_AI_API_KEY="xxxxx"
```

Environment variables take precedence over config file values.

**Estimated time:** 2-3 minutes

---

## Creating Your First Agent

Let's create a more sophisticated agent with custom settings.

### Basic Agent Creation

```bash
pnpm --filter @agentik-os/cli exec panda agent create \
  --name "coding-assistant" \
  --model "claude-opus-4-6" \
  --system "You are an expert software engineer specializing in TypeScript and React."
```

### Advanced Agent with Custom Settings

```bash
pnpm --filter @agentik-os/cli exec panda agent create \
  --name "research-bot" \
  --model "claude-sonnet-4-5-20250929" \
  --system "You are a research assistant. Provide detailed, well-sourced answers." \
  --temperature 0.3 \
  --max-tokens 8192
```

### Agent with Cost Budget

```bash
pnpm --filter @agentik-os/cli exec panda agent create \
  --name "budget-agent" \
  --model "claude-haiku-4-5-20251001" \
  --system "You are a helpful assistant." \
  --max-cost 0.01
```

### What Happens Behind the Scenes

When you create an agent, Agentik OS:

1. **Validates** your configuration (model exists, API key valid)
2. **Creates** an agent profile with unique ID
3. **Initializes** memory storage for this agent
4. **Sets up** the 9-stage message pipeline
5. **Configures** the model router with your preferences

**Estimated time:** 1 minute per agent

---

## Chat Interface

The Agentik OS chat interface is your main way to interact with agents.

### Starting a Chat Session

```bash
# Chat with specific agent
pnpm --filter @agentik-os/cli exec panda chat --agent assistant

# Chat with agent by ID
pnpm --filter @agentik-os/cli exec panda chat --agent agent_1234567890_assistant

# One-off message (no interactive mode)
pnpm --filter @agentik-os/cli exec panda chat --agent assistant --message "What's 2+2?"
```

### Chat Commands

While in the chat interface, you can use special commands:

| Command | Description | Example |
|---------|-------------|---------|
| `/help` | Show available commands | `/help` |
| `/history` | View conversation history | `/history` |
| `/clear` | Clear current conversation | `/clear` |
| `/model` | Switch model mid-conversation | `/model claude-opus-4-6` |
| `/system` | Update system prompt | `/system You are a poet.` |
| `/cost` | View current session cost | `/cost` |
| `/exit` or `/quit` | Exit chat | `/exit` |

### Example Chat Session

```
╔════════════════════════════════════╗
║   🤖  Agentik OS - CLI Chat       ║
╚════════════════════════════════════╝

User: you | Agent: coding-assistant
Type /help for commands, /exit to quit

---

You: How do I create a React component?

coding-assistant: Here's a modern React component using TypeScript and hooks:

```tsx
import React, { useState } from 'react';

interface ButtonProps {
  label: string;
  onClick: () => void;
}

export const Button: React.FC<ButtonProps> = ({ label, onClick }) => {
  const [clicked, setClicked] = useState(false);

  const handleClick = () => {
    setClicked(true);
    onClick();
  };

  return (
    <button onClick={handleClick} className={clicked ? 'active' : ''}>
      {label}
    </button>
  );
};
```

This component:
- Uses TypeScript for type safety
- Accepts props via interface
- Uses useState hook for local state
- Follows modern React patterns

Would you like me to explain any part in detail?

---

You: /cost

💰 Current Session Cost:
- Model: claude-opus-4-6
- Messages: 1
- Tokens: 285 (prompt: 45, completion: 240)
- Cost: $0.0042

---

You: /exit

👋 Goodbye! Your conversation has been saved.
💾 Session summary: 1 message, $0.0042 total cost
```

### Multi-Turn Conversations with Memory

Agentik OS automatically maintains conversation context:

```
You: My favorite color is blue.

agent: That's nice! Blue is a calming color.

---

You: What's my favorite color?

agent: Your favorite color is blue! You just mentioned that.
```

**Memory is automatic** - no special commands needed!

**Estimated time:** Ongoing (chat as long as you need)

---

## Managing Agents

### List All Agents

```bash
pnpm --filter @agentik-os/cli exec panda agent list

# Expected output:
# ╔════════════════════════════════════════════════════════════╗
# ║                    Your AI Agents                         ║
# ╚════════════════════════════════════════════════════════════╝
#
# ID: agent_1234567890_assistant
# Name: assistant
# Model: claude-sonnet-4-5-20250929
# Created: 2026-02-14 12:30 PM
# Messages: 5
# ---
# ID: agent_1234567891_coding
# Name: coding-assistant
# Model: claude-opus-4-6
# Created: 2026-02-14 12:45 PM
# Messages: 3
```

### View Agent Logs

```bash
# View recent activity for an agent
pnpm --filter @agentik-os/cli exec panda logs --agent assistant

# View last 20 messages
pnpm --filter @agentik-os/cli exec panda logs --agent assistant --limit 20

# View logs from specific time
pnpm --filter @agentik-os/cli exec panda logs --agent assistant --since "2026-02-14"
```

### Delete an Agent

```bash
pnpm --filter @agentik-os/cli exec panda agent delete --name assistant

# Confirmation prompt:
# ⚠️  Are you sure you want to delete 'assistant'? (y/n): y
# ✅ Agent 'assistant' deleted successfully
```

**Estimated time:** 1-2 minutes

---

## Troubleshooting

### Common Issues and Solutions

#### 1. "API Key Invalid" Error

**Problem:**
```
❌ Error: Invalid API key for Anthropic
```

**Solution:**
```bash
# Update your API key
pnpm --filter @agentik-os/cli exec panda config set providers.anthropic.apiKey "sk-ant-your-new-key"

# Or use environment variable
export ANTHROPIC_API_KEY="sk-ant-your-new-key"

# Verify it works
pnpm --filter @agentik-os/cli exec panda chat --agent assistant --message "test"
```

#### 2. "Agent Not Found" Error

**Problem:**
```
❌ Error: Agent 'my-agent' not found
```

**Solution:**
```bash
# List all agents to find the correct name/ID
pnpm --filter @agentik-os/cli exec panda agent list

# Use the exact name or ID shown
pnpm --filter @agentik-os/cli exec panda chat --agent agent_1234567890_assistant
```

#### 3. "Rate Limit Exceeded" Error

**Problem:**
```
❌ Error: Rate limit exceeded for claude-opus-4-6
```

**Solution:**
```bash
# Wait 60 seconds, then retry
# OR switch to a different model:
pnpm --filter @agentik-os/cli exec panda agent create \
  --name "agent" \
  --model "claude-sonnet-4-5-20250929"  # Different tier, separate rate limit
```

#### 4. "Budget Exceeded" Error

**Problem:**
```
❌ Error: Daily budget limit reached ($5.00)
```

**Solution:**
```bash
# Check current spending
pnpm --filter @agentik-os/cli exec panda logs --cost

# Increase budget (if desired)
pnpm --filter @agentik-os/cli exec panda config set defaults.budget.dailyLimit 10.00

# Or wait until tomorrow (budget resets daily)
```

#### 5. Slow Responses

**Problem:** Agent takes 10+ seconds to respond

**Solutions:**
1. **Use a faster model:**
   ```bash
   # Switch from Opus → Sonnet or Haiku
   /model claude-haiku-4-5-20251001
   ```

2. **Check internet connection:**
   ```bash
   ping api.anthropic.com
   ```

3. **Reduce max tokens:**
   ```bash
   pnpm --filter @agentik-os/cli exec panda config set defaults.maxTokens 2048
   ```

#### 6. Memory Issues (Agent Doesn't Remember)

**Problem:** Agent forgets previous messages in the same conversation

**Solution:**
```bash
# Check memory settings
pnpm --filter @agentik-os/cli exec panda config

# Increase short-term memory limit
pnpm --filter @agentik-os/cli exec panda config set memory.shortTermLimit 20
```

### Getting Help

If you're still stuck:

1. **Check logs:**
   ```bash
   pnpm --filter @agentik-os/cli exec panda logs --verbose
   ```

2. **View architecture docs:**
   ```bash
   cat docs/IMPLEMENTATION-ARCHITECTURE.md
   ```

3. **GitHub Issues:**
   - Search: https://github.com/agentik-os/agentik-os/issues
   - Create new issue with error logs

4. **Community Discord:**
   - Join: https://discord.gg/agentik-os
   - #help channel for troubleshooting

**Estimated time:** 5-10 minutes per issue

---

## Next Steps

Now that you've mastered the basics, explore advanced features:

### 1. Learn the Architecture

Understand how the 9-stage message pipeline works:
- Read: `docs/IMPLEMENTATION-ARCHITECTURE.md`
- Visual diagrams: `docs/diagrams/pipeline.svg`

### 2. Try the Dashboard (Web UI)

Launch the visual interface:
```bash
pnpm --filter @agentik-os/dashboard dev

# Open: http://localhost:3000
# Features: Agent management, chat history, cost analytics
```

### 3. Build Custom Skills

Create reusable agent behaviors:
- Guide: `docs/SKILLS.md`
- SDK: `packages/sdk/`

### 4. Integrate MCP Tools

Give your agents superpowers (web search, code execution, etc.):
- MCP Guide: `docs/MCP-INTEGRATION.md`

### 5. Deploy to Production

Run Agentik OS on your server:
- Deployment Guide: `docs/DEPLOYMENT.md`
- Docker setup: `docker/`

### 6. Contribute to Agentik OS

Help improve the project:
- Contributing Guide: `CONTRIBUTING.md`
- Development Setup: `docs/DEVELOPMENT.md`

---

## Summary

**You've learned how to:**
- ✅ Install and verify Agentik OS
- ✅ Configure API keys and settings
- ✅ Create your first AI agent
- ✅ Have multi-turn conversations
- ✅ Manage multiple agents
- ✅ Troubleshoot common issues

**Key Commands to Remember:**

| Task | Command |
|------|---------|
| Initialize | `panda init` |
| Create agent | `panda agent create --name "NAME" --model "MODEL"` |
| List agents | `panda agent list` |
| Start chat | `panda chat --agent NAME` |
| View logs | `panda logs --agent NAME` |
| Update config | `panda config set KEY VALUE` |

**Questions?** Check the [Troubleshooting](#troubleshooting) section or open a GitHub issue.

**Ready to build amazing AI agents?** Start experimenting and have fun! 🚀

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**For:** Agentik OS Phase 0
