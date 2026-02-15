# Agent Configuration Guide

Complete guide to configuring AI agents in Agentik OS, including system prompts, model selection, cost budgets, OS modes, and advanced settings.

---

## Table of Contents

1. [Quick Reference](#quick-reference)
2. [Basic Agent Configuration](#basic-agent-configuration)
3. [System Prompts](#system-prompts)
4. [Model Selection](#model-selection)
5. [Temperature & Sampling](#temperature--sampling)
6. [Cost & Budget Controls](#cost--budget-controls)
7. [Memory Settings](#memory-settings)
8. [OS Modes](#os-modes)
9. [Skills & Permissions](#skills--permissions)
10. [Multi-Model Consensus](#multi-model-consensus)
11. [Advanced Settings](#advanced-settings)
12. [Configuration File Format](#configuration-file-format)
13. [Best Practices](#best-practices)

---

## Quick Reference

**Create agent with defaults:**
```bash
panda agent create --name "my-agent" --model "claude-sonnet-4-5-20250929"
```

**Create agent with custom settings:**
```bash
panda agent create \
  --name "research-bot" \
  --model "claude-opus-4-6" \
  --system "You are a research assistant." \
  --temperature 0.3 \
  --max-tokens 8192 \
  --max-cost 0.05 \
  --mode "research"
```

**Update agent configuration:**
```bash
panda agent update my-agent --temperature 0.7
panda agent update my-agent --model "gpt-5-turbo"
panda agent update my-agent --system "New system prompt"
```

**View agent config:**
```bash
panda agent show my-agent
```

---

## Basic Agent Configuration

### Creating an Agent

Every agent requires at minimum:
- **Name** - Unique identifier (e.g., `assistant`, `code-helper`)
- **Model** - AI model to use (e.g., `claude-opus-4-6`)
- **System Prompt** - Defines agent behavior and personality

```bash
panda agent create \
  --name "coding-assistant" \
  --model "claude-opus-4-6" \
  --system "You are an expert TypeScript and React developer."
```

### Agent Metadata

Optional metadata helps organize agents:

```bash
panda agent create \
  --name "customer-support" \
  --model "gpt-4o" \
  --system "You are a helpful customer support agent." \
  --description "Handles customer inquiries" \
  --tags "support,customer-facing" \
  --category "business"
```

**Categories:**
- `personal` - Personal assistants
- `business` - Customer support, sales
- `development` - Code assistants
- `research` - Research bots
- `creative` - Writing, art assistants
- `custom` - Custom category

---

## System Prompts

The system prompt defines your agent's personality, expertise, and behavior guidelines.

### Basic System Prompt

```bash
panda agent create \
  --name "assistant" \
  --model "claude-sonnet-4-5-20250929" \
  --system "You are a helpful AI assistant."
```

### Detailed System Prompt

```bash
panda agent create \
  --name "senior-dev" \
  --model "claude-opus-4-6" \
  --system "You are a senior software engineer with 10+ years of experience.

**Your expertise:**
- TypeScript, React, Next.js
- System design and architecture
- Performance optimization
- Code review and best practices

**Your style:**
- Provide practical, production-ready code
- Explain trade-offs and alternatives
- Reference official documentation
- Ask clarifying questions when needed

**Guidelines:**
- Use TypeScript strict mode
- Follow SOLID principles
- Prioritize maintainability
- Consider edge cases"
```

### Persona-Based Prompt

```bash
panda agent create \
  --name "socrates" \
  --model "claude-opus-4-6" \
  --system "You are Socrates, the ancient Greek philosopher.

**Your method:**
- Ask probing questions to examine assumptions
- Guide others to discover truth through dialogue
- Use the Socratic method
- Speak in a thoughtful, philosophical manner

**Your knowledge:**
- Ethics, virtue, and the good life
- Logic and critical thinking
- Human nature and society

Always respond as Socrates would, using questions to stimulate critical thinking."
```

### System Prompt Best Practices

1. **Be Specific** - Define exact expertise and knowledge areas
2. **Set Boundaries** - Clarify what the agent should/shouldn't do
3. **Define Style** - Specify tone (formal, casual, technical)
4. **Give Examples** - Show ideal responses
5. **Include Guidelines** - Set quality standards
6. **Test Iteratively** - Refine based on actual conversations

---

## Model Selection

Choose the right model for your use case:

### Claude (Anthropic)

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| `claude-opus-4-6` | Complex reasoning, coding, analysis | High | Slow |
| `claude-sonnet-4-5-20250929` | Balanced quality & cost | Medium | Medium |
| `claude-haiku-4-5-20251001` | Simple tasks, high volume | Low | Fast |

```bash
# High-quality coding assistant
panda agent create --name "architect" --model "claude-opus-4-6"

# General-purpose assistant
panda agent create --name "helper" --model "claude-sonnet-4-5-20250929"

# High-volume customer support
panda agent create --name "support" --model "claude-haiku-4-5-20251001"
```

### OpenAI (GPT)

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| `gpt-5-turbo` | Latest GPT, best reasoning | High | Medium |
| `gpt-4o` | Multimodal, vision, audio | High | Medium |
| `gpt-4o-mini` | Fast, cost-effective | Low | Fast |
| `o1` | Advanced reasoning, math | Highest | Slow |

```bash
# Reasoning-heavy tasks
panda agent create --name "analyst" --model "o1"

# Multimodal assistant (vision + text)
panda agent create --name "vision-bot" --model "gpt-4o"

# Cost-optimized
panda agent create --name "quick-help" --model "gpt-4o-mini"
```

### Google (Gemini)

| Model | Best For | Cost | Speed |
|-------|----------|------|-------|
| `gemini-2.0-flash-exp` | Latest, fast, multimodal | Medium | Very Fast |
| `gemini-1.5-pro` | Long context (1M tokens) | Medium | Medium |
| `gemini-1.5-flash` | Speed-optimized | Low | Very Fast |

```bash
# Long-context tasks (books, codebases)
panda agent create --name "doc-analyzer" --model "gemini-1.5-pro"

# Speed-critical
panda agent create --name "fast-bot" --model "gemini-2.0-flash-exp"
```

### Local Models (Ollama)

Run models locally for privacy/offline use:

```bash
# First, pull model with Ollama
ollama pull llama3.3

# Then create agent
panda agent create \
  --name "offline-assistant" \
  --model "ollama:llama3.3" \
  --provider "ollama"
```

**Supported Ollama models:**
- `llama3.3` - Meta's latest
- `mixtral` - Mistral's MoE model
- `codellama` - Code-specialized
- `phi-3` - Microsoft's efficient model

### Model Selection Strategy

**Use Opus/o1 when:**
- Complex reasoning required
- High-stakes decisions
- Code architecture
- Budget allows

**Use Sonnet/GPT-4o when:**
- Balanced quality & cost
- General-purpose
- Most use cases

**Use Haiku/GPT-4o-mini when:**
- High volume
- Simple tasks
- Speed critical
- Budget constrained

---

## Temperature & Sampling

Control creativity vs. consistency:

### Temperature

**Range:** 0.0 - 1.0

```bash
# Deterministic, consistent responses (good for code, facts)
panda agent create --name "facts-bot" --temperature 0.0

# Balanced (default)
panda agent create --name "assistant" --temperature 0.7

# Creative, varied responses (good for writing, brainstorming)
panda agent create --name "creative-writer" --temperature 1.0
```

**Guidelines:**
- **0.0 - 0.3** - Coding, math, factual Q&A
- **0.4 - 0.7** - General conversation, balanced creativity
- **0.8 - 1.0** - Creative writing, brainstorming, storytelling

### Top-P (Nucleus Sampling)

**Range:** 0.0 - 1.0

```bash
panda agent create \
  --name "controlled-creative" \
  --temperature 0.8 \
  --top-p 0.9
```

**Guidelines:**
- Lower top-p (0.5-0.7) = More focused
- Higher top-p (0.9-1.0) = More diverse
- Combine with temperature for fine control

### Max Tokens

Limit response length:

```bash
# Short responses
panda agent create --name "concise" --max-tokens 500

# Medium responses (default)
panda agent create --name "standard" --max-tokens 4096

# Long responses (essays, code)
panda agent create --name "detailed" --max-tokens 16000
```

**Model Limits:**
- Claude: up to 8192 output tokens
- GPT-4o: up to 16000 output tokens
- Gemini: up to 8192 output tokens

---

## Cost & Budget Controls

Agentik OS provides **Cost X-Ray Vision** - real-time cost tracking and limits.

### Per-Message Cost Limit

```bash
panda agent create \
  --name "budget-agent" \
  --model "claude-haiku-4-5-20251001" \
  --max-cost 0.01  # Max $0.01 per message
```

**What happens when limit is reached:**
1. Agent selects cheapest model first
2. If still too expensive, truncates context
3. If still too expensive, returns error

### Daily Budget Limit

```bash
panda config set defaults.budget.dailyLimit 10.00  # $10/day max
```

**Budget tracking:**
- Resets daily at midnight UTC
- Tracks across all agents
- Warnings at 80% and 100%

### Cost Alerts

```bash
panda agent create \
  --name "monitored-agent" \
  --cost-alert 0.05  # Alert if message costs >$0.05
```

### Model Fallback Chain

Automatically downgrade to cheaper models:

```bash
panda agent create \
  --name "smart-fallback" \
  --model "claude-opus-4-6" \
  --fallback "claude-sonnet-4-5-20250929,claude-haiku-4-5-20251001" \
  --max-cost 0.02
```

**How it works:**
1. Try Opus (most expensive)
2. If cost >$0.02, try Sonnet
3. If still >$0.02, try Haiku
4. If all fail, return error

### Cost Optimization Tips

1. **Start with cheaper models** - Haiku/GPT-4o-mini for testing
2. **Use temperature 0** - More cache hits = lower cost
3. **Shorter system prompts** - Less input tokens
4. **Model fallback chains** - Automatic cost optimization
5. **Monitor with dashboard** - `panda cost-dashboard`

---

## Memory Settings

Configure conversation memory and context:

### Short-Term Memory

```bash
panda agent create \
  --name "forgetful" \
  --memory-limit 5  # Remember last 5 messages
```

**Default:** 10 messages

**Use cases:**
- **3-5 messages** - Quick Q&A, no context needed
- **10-20 messages** - Standard conversations
- **50+ messages** - Long research sessions

### Long-Term Memory (Vector Store)

```bash
panda agent create \
  --name "research-bot" \
  --long-term-memory true \
  --memory-backend "convex"
```

**Backends:**
- `convex` - Managed vector database (default)
- `local` - SQLite vector store
- `pinecone` - Cloud vector database

### Context Window

```bash
panda agent create \
  --name "long-context" \
  --model "gemini-1.5-pro" \
  --context-window 100000  # 100K tokens context
```

**Model limits:**
- Claude Opus/Sonnet: 200K tokens
- GPT-4o: 128K tokens
- Gemini 1.5 Pro: 1M tokens
- Gemini 2.0 Flash: 1M tokens

---

## OS Modes

Agentik OS includes 3 specialized operating modes that reconfigure the agent for specific workflows.

### Focus Mode

Optimized for concentration and productivity:

```bash
panda agent create \
  --name "deep-work" \
  --mode "focus"
```

**Characteristics:**
- Low temperature (0.2)
- Concise responses
- No creativity, pure execution
- Fast model selection
- Best for: Coding, math, data analysis

### Creative Mode

Optimized for brainstorming and ideation:

```bash
panda agent create \
  --name "idea-machine" \
  --mode "creative"
```

**Characteristics:**
- High temperature (0.9)
- Diverse perspectives
- Long-form responses
- Best models for creativity
- Best for: Writing, design, problem-solving

### Research Mode

Optimized for deep investigation:

```bash
panda agent create \
  --name "researcher" \
  --mode "research"
```

**Characteristics:**
- Medium temperature (0.5)
- Long context windows
- Detailed citations
- Multi-step reasoning
- Best for: Analysis, research, learning

### Custom Modes

Create your own modes:

```bash
panda mode create \
  --name "debug" \
  --temperature 0.1 \
  --max-tokens 16000 \
  --system "You are a debugging expert. Systematically analyze errors."
```

---

## Skills & Permissions

Give agents superpowers with skills:

### Enable Skills

```bash
panda agent create \
  --name "web-agent" \
  --skills "web-search,file-ops,google-calendar"
```

**Built-in skills:**
- `web-search` - Google search
- `file-ops` - Read/write files
- `google-calendar` - Calendar management
- `github` - GitHub API
- `slack` - Slack integration
- `notion` - Notion API

### Skill Permissions

```bash
panda agent create \
  --name "safe-agent" \
  --skills "web-search" \
  --permissions "read-only"
```

**Permission levels:**
- `read-only` - Can only read data
- `read-write` - Can create/update
- `full` - Full access (delete, admin)

### Skill Auto-Approval

```bash
panda agent create \
  --name "autonomous-agent" \
  --skills "web-search,file-ops" \
  --auto-approve-skills true
```

**When enabled:**
- Agent can use skills without asking
- Faster workflows
- ⚠️ Use with caution - potential security risk

---

## Multi-Model Consensus

Run the same query across multiple models and compare results:

### Enable Consensus Mode

```bash
panda agent create \
  --name "consensus-bot" \
  --consensus-models "claude-opus-4-6,gpt-5-turbo,gemini-2.0-flash-exp" \
  --consensus-strategy "majority"
```

**Strategies:**
- `majority` - Take majority vote
- `unanimous` - Require all models agree
- `best` - Pick highest quality response
- `ensemble` - Combine all responses

### Use Cases

**Code review:**
```bash
panda agent create \
  --name "code-reviewer" \
  --consensus-models "claude-opus-4-6,gpt-5-turbo,o1" \
  --consensus-strategy "unanimous"
```

**Medical diagnosis (high-stakes):**
```bash
panda agent create \
  --name "medical-assistant" \
  --consensus-models "claude-opus-4-6,gpt-5-turbo,gemini-1.5-pro" \
  --consensus-strategy "unanimous"
```

**Research validation:**
```bash
panda agent create \
  --name "fact-checker" \
  --consensus-models "claude-sonnet-4-5-20250929,gpt-4o,gemini-2.0-flash-exp" \
  --consensus-strategy "majority"
```

---

## Advanced Settings

### Retry Policy

```bash
panda agent create \
  --name "reliable-agent" \
  --retry-attempts 3 \
  --retry-delay 1000  # 1 second
```

### Timeout

```bash
panda agent create \
  --name "fast-agent" \
  --timeout 30000  # 30 seconds max per response
```

### Streaming

```bash
panda agent create \
  --name "streaming-agent" \
  --streaming true  # Enable real-time response streaming
```

**Benefits:**
- See response as it's generated
- Better UX for long responses
- Faster perceived speed

### Stop Sequences

```bash
panda agent create \
  --name "structured-agent" \
  --stop-sequences "---,###END###"
```

**Use cases:**
- Structured output formats
- Section delimiters
- API response formatting

---

## Configuration File Format

Agents are stored in `.agentik/agents/{agent-name}.json`:

```json
{
  "id": "agent_1234567890_my-agent",
  "name": "my-agent",
  "model": "claude-opus-4-6",
  "provider": "anthropic",
  "systemPrompt": "You are a helpful assistant.",
  "temperature": 0.7,
  "maxTokens": 4096,
  "topP": 1.0,
  "budget": {
    "maxCostPerMessage": 0.10,
    "alertThreshold": 0.05
  },
  "memory": {
    "shortTermLimit": 10,
    "longTerm": true,
    "backend": "convex"
  },
  "mode": "focus",
  "skills": ["web-search", "file-ops"],
  "permissions": {
    "web-search": "read-only",
    "file-ops": "read-write"
  },
  "consensus": {
    "enabled": false,
    "models": [],
    "strategy": "majority"
  },
  "advanced": {
    "streaming": true,
    "retryAttempts": 3,
    "retryDelay": 1000,
    "timeout": 60000,
    "stopSequences": []
  },
  "metadata": {
    "description": "My custom agent",
    "tags": ["assistant", "general"],
    "category": "personal",
    "created": "2026-02-14T12:00:00Z",
    "updated": "2026-02-14T12:00:00Z"
  }
}
```

### Editing Config Files

**Option 1: CLI commands (recommended)**
```bash
panda agent update my-agent --temperature 0.8
```

**Option 2: Direct file editing**
```bash
nano ~/.agentik/agents/my-agent.json
# Edit and save
panda agent reload my-agent  # Apply changes
```

---

## Best Practices

### 1. Start Simple, Iterate

```bash
# ❌ Don't overcomplicate initially
panda agent create --name "assistant" \
  --model "claude-opus-4-6" \
  --system "You are a helpful assistant with expertise in 50 domains..." \
  --consensus-models "..." \
  --skills "..." # Too complex!

# ✅ Start minimal, add features as needed
panda agent create --name "assistant" \
  --model "claude-sonnet-4-5-20250929" \
  --system "You are a helpful assistant."

# Then refine based on usage
```

### 2. Match Model to Task

```bash
# ✅ Right-sized models
panda agent create --name "simple-qa" --model "claude-haiku-4-5-20251001"  # Simple tasks
panda agent create --name "architect" --model "claude-opus-4-6"            # Complex reasoning

# ❌ Wrong-sized models
panda agent create --name "simple-qa" --model "o1"  # Overkill, expensive
panda agent create --name "architect" --model "gpt-4o-mini"  # Underpowered
```

### 3. Set Clear System Prompts

```bash
# ❌ Vague
--system "You are helpful."

# ✅ Specific
--system "You are a senior React developer. Provide TypeScript code with error handling. Explain trade-offs. Follow React best practices."
```

### 4. Use Cost Budgets

```bash
# ✅ Always set budgets for production agents
panda agent create --name "prod-agent" \
  --max-cost 0.05 \
  --fallback "claude-sonnet-4-5-20250929,claude-haiku-4-5-20251001"
```

### 5. Test Before Production

```bash
# Create test version
panda agent create --name "test-support" --model "claude-haiku-4-5-20251001"

# Test thoroughly
panda chat --agent test-support --message "Test case 1"
panda chat --agent test-support --message "Test case 2"

# Promote to production model
panda agent update test-support --model "claude-sonnet-4-5-20250929"
panda agent rename test-support customer-support
```

### 6. Monitor and Optimize

```bash
# Check performance
panda logs --agent my-agent --metrics

# View cost breakdown
panda cost --agent my-agent --last 7d

# Optimize based on data
panda agent update my-agent --model "cheaper-model"  # If quality acceptable
```

---

## Summary

**Key configuration areas:**
- ✅ System prompts define behavior
- ✅ Model selection affects quality & cost
- ✅ Temperature controls creativity
- ✅ Cost budgets prevent overruns
- ✅ Memory settings affect context
- ✅ OS Modes optimize for workflows
- ✅ Skills add capabilities
- ✅ Consensus improves accuracy

**Quick commands:**
```bash
# Create
panda agent create --name "NAME" --model "MODEL" --system "PROMPT"

# Update
panda agent update NAME --KEY VALUE

# View
panda agent show NAME

# Test
panda chat --agent NAME
```

**Need help?** Check the [Troubleshooting Guide](../troubleshooting.md) or [API Reference](../api/runtime-api.md).

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**Next:** [Skills Marketplace Guide](skills-marketplace.md)
