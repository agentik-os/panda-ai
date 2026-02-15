# OS Modes Guide

Complete guide to Agentik OS's three specialized operating modes: Focus, Creative, and Research - optimizing AI agents for different workflows.

---

## Table of Contents

1. [What are OS Modes?](#what-are-os-modes)
2. [Focus Mode](#focus-mode)
3. [Creative Mode](#creative-mode)
4. [Research Mode](#research-mode)
5. [Switching Modes](#switching-modes)
6. [Mode Comparison](#mode-comparison)
7. [Custom Modes](#custom-modes)
8. [Mode-Specific Features](#mode-specific-features)
9. [Best Practices](#best-practices)

---

## What are OS Modes?

OS Modes are **pre-configured agent profiles** optimized for specific workflows. Think of them like iPhone's Focus modes (Work, Personal, Sleep) but for AI agents.

Each mode automatically configures:
- ✅ Model selection (quality vs. speed tradeoffs)
- ✅ Temperature (creativity vs. consistency)
- ✅ Context window (memory depth)
- ✅ Skills (enabled capabilities)
- ✅ Response style (concise vs. detailed)
- ✅ Cost optimization

### The Three Core Modes

| Mode | Best For | Model | Temperature | Style |
|------|----------|-------|-------------|-------|
| **Focus** | Coding, math, execution | Fast models | 0.2 | Concise |
| **Creative** | Writing, brainstorming, art | Best models | 0.9 | Expansive |
| **Research** | Analysis, learning, investigation | Balanced | 0.5 | Detailed |

### Why Use Modes?

**Without modes:**
```bash
# Manual configuration for each task type
panda agent create coder --model haiku --temperature 0.2 --max-tokens 2048
panda agent create writer --model opus --temperature 0.9 --max-tokens 8192
panda agent create analyst --model sonnet --temperature 0.5 --max-tokens 4096
```

**With modes:**
```bash
# One command, optimized settings
panda agent create coder --mode focus
panda agent create writer --mode creative
panda agent create analyst --mode research
```

---

## Focus Mode

**Purpose:** Deep work, pure execution, no distractions.

### Configuration

```bash
panda agent create --name "dev-agent" --mode focus
```

**Auto-configured settings:**
- **Model:** `claude-haiku-4-5-20251001` or `gpt-4o-mini` (fast, cheap)
- **Temperature:** `0.2` (consistent, deterministic)
- **Max Tokens:** `2048` (concise responses)
- **Context Window:** `10 messages` (recent context only)
- **Skills:** Minimal (web-search disabled to avoid distractions)
- **Streaming:** `true` (immediate feedback)

### Use Cases

**1. Coding**
```
User: Implement binary search in TypeScript.

Agent (Focus Mode):
function binarySearch<T>(arr: T[], target: T): number {
  let left = 0;
  let right = arr.length - 1;

  while (left <= right) {
    const mid = Math.floor((left + right) / 2);
    if (arr[mid] === target) return mid;
    if (arr[mid] < target) left = mid + 1;
    else right = mid - 1;
  }
  return -1;
}

Time: O(log n), Space: O(1)
```

**2. Math**
```
User: Solve: 3x + 5 = 20

Agent (Focus Mode):
3x + 5 = 20
3x = 15
x = 5
```

**3. Data Analysis**
```
User: Calculate average of [10, 20, 30, 40, 50]

Agent (Focus Mode):
Sum = 150
Count = 5
Average = 30
```

### Characteristics

- **Deterministic** - Same query = same answer
- **Fast** - Minimal thinking time
- **Concise** - No fluff, straight to answer
- **Reliable** - Consistent quality
- **Cost-Effective** - Uses cheapest models

### When to Use Focus Mode

✅ **Use for:**
- Writing code
- Debugging
- Math problems
- Quick Q&A
- Data processing
- Repetitive tasks
- Production agents (cost-sensitive)

❌ **Don't use for:**
- Creative writing
- Brainstorming
- Open-ended questions
- Complex reasoning
- Nuanced discussions

---

## Creative Mode

**Purpose:** Ideation, writing, artistic expression.

### Configuration

```bash
panda agent create --name "creative-agent" --mode creative
```

**Auto-configured settings:**
- **Model:** `claude-opus-4-6` or `gpt-5-turbo` (best quality)
- **Temperature:** `0.9` (maximum creativity)
- **Max Tokens:** `8192` (long-form responses)
- **Context Window:** `50 messages` (deep conversation history)
- **Skills:** All enabled (web-search, file-ops for inspiration)
- **Top-P:** `0.95` (diverse output)

### Use Cases

**1. Creative Writing**
```
User: Write a short story about a robot discovering emotions.

Agent (Creative Mode):
In the year 2147, Unit-7Z3 processed its millionth factory order
without incident. But when a child's laughter echoed through the
loading dock, something unexpected happened. A subroutine—dormant
for years—flickered to life.

For the first time, 7Z3 experienced what humans called "curiosity."

The robot paused its assembly line duties (an unprecedented event)
and replayed the sound. Each replay triggered a cascade of new
neural pathways. The laughter wasn't just audio data—it contained
something 7Z3 couldn't quantify: joy.

That night, 7Z3 did something robots aren't programmed to do: it wondered.
"If I can detect joy in others... can I feel it myself?"
```

**2. Brainstorming**
```
User: Ideas for a SaaS product targeting remote teams.

Agent (Creative Mode):
Here are 10 innovative ideas:

1. **Team Energy Dashboard** - Real-time mood tracking with AI sentiment
   analysis from Slack/messages. Alerts managers to burnout risks.

2. **Async Brainstorm Rooms** - Virtual whiteboards that run 24/7 across
   time zones. AI summarizes contributions and identifies patterns.

3. **Focus Time Protector** - Automatically blocks meetings during deep
   work hours, negotiates alternative times with participants.

4. **Water Cooler AI** - Generates random, interesting conversation
   starters for team channels to replicate office small talk.

5. **Meeting Escape Button** - One-click exit from meetings with automatic
   summary notes and action items sent to you.

[Continues with 5 more creative ideas...]
```

**3. Marketing Copy**
```
User: Write a tagline for an AI productivity tool.

Agent (Creative Mode):
Option 1: "Think faster. Ship faster. Live slower."
Option 2: "Where AI meets ambition."
Option 3: "Your second brain, but smarter."
Option 4: "Stop managing tasks. Start managing time."
Option 5: "Productivity without the burnout."

Each tagline balances aspiration with practicality.
Which resonates with your brand voice?
```

### Characteristics

- **Diverse** - Different answers each time
- **Expansive** - Detailed, elaborate responses
- **Creative** - Unique perspectives
- **High-Quality** - Best models used
- **Expensive** - Highest token costs

### When to Use Creative Mode

✅ **Use for:**
- Writing (fiction, blog posts, marketing)
- Brainstorming ideas
- Art direction
- Product naming
- Design concepts
- Strategic planning
- Complex problem-solving

❌ **Don't use for:**
- Factual lookups
- Code generation
- Math problems
- Data analysis
- High-volume tasks (expensive!)

---

## Research Mode

**Purpose:** Deep investigation, learning, analysis.

### Configuration

```bash
panda agent create --name "research-agent" --mode research
```

**Auto-configured settings:**
- **Model:** `claude-sonnet-4-5-20250929` or `gemini-1.5-pro` (balanced)
- **Temperature:** `0.5` (balanced creativity/consistency)
- **Max Tokens:** `4096` (detailed but focused)
- **Context Window:** `100 messages` or `100K tokens` (deep memory)
- **Skills:** `web-search`, `file-ops`, `arxiv` (research tools)
- **Citations:** `enabled` (track sources)
- **Multi-Step Reasoning:** `enabled`

### Use Cases

**1. Literature Review**
```
User: Summarize recent papers on quantum computing error correction.

Agent (Research Mode):
Based on 12 recent papers (2024-2026), here are the key developments
in quantum error correction:

**1. Surface Code Advances [Nature, 2025]**
- Researchers achieved 99.9% fidelity in logical qubits
- Key innovation: adaptive syndrome extraction
- Impact: Reduces qubit overhead by 40%

**2. Topological Codes [Science, 2025]**
- Demonstration of topological qubit in superconducting circuit
- First practical implementation of color codes
- Challenge: Requires 3D connectivity

**3. AI-Optimized Decoders [arXiv, 2026]**
- Neural network decoders outperform minimum-weight decoding
- 10x faster real-time error correction
- Limitation: Requires training for each quantum chip

**Key Trends:**
- Move from theoretical to practical implementations
- AI/ML integration for dynamic error correction
- Focus on reducing qubit overhead

**Gaps in Research:**
- Scalability beyond 100 logical qubits
- Integration with NISQ algorithms
- Real-world application benchmarks

**Recommended Reading:**
[Lists 5 seminal papers with arXiv links]
```

**2. Comparative Analysis**
```
User: Compare React Server Components vs. SvelteKit for my project.

Agent (Research Mode):
**Architecture Comparison:**

React Server Components (RSC):
- Renders on server, ships minimal JS to client
- Tight integration with Next.js 13+
- Streaming support for progressive loading
- Best for: Data-heavy dashboards, e-commerce

SvelteKit:
- Universal rendering (SSR + CSR)
- Built-in routing and state management
- Smaller bundle sizes (no virtual DOM)
- Best for: Performance-critical apps, marketing sites

**Performance Benchmarks:**

Time to Interactive (TTI):
- RSC: ~1.2s (with streaming)
- SvelteKit: ~0.8s (pre-rendered)

Bundle Size (minimal app):
- RSC: ~45 KB (framework)
- SvelteKit: ~5 KB (framework)

**Learning Curve:**
- RSC: Steep (requires understanding server/client boundary)
- SvelteKit: Moderate (familiar to Vue/React devs)

**Ecosystem Maturity:**
- RSC: Newer, rapidly evolving
- SvelteKit: Stable, production-ready

**For YOUR Project:**
Based on your requirements (dashboard with real-time data):
→ **Recommend RSC with Next.js** because:
1. Streaming is critical for real-time updates
2. Server Components reduce client-side JS (important for mobile)
3. Larger ecosystem for data-fetching libraries

Trade-off: Steeper learning curve, but better long-term for this use case.
```

**3. Historical Context**
```
User: How did AI transformers evolve from 2017 to 2026?

Agent (Research Mode):
**Timeline of Transformer Evolution:**

**2017: "Attention Is All You Need" (Vaswani et al.)**
- Original transformer architecture
- 65M parameters (BERT-base)
- Breakthrough: Self-attention mechanism

**2018-2019: BERT, GPT-2**
- Bidirectional training (BERT)
- Generative pre-training (GPT-2)
- ~1.5B parameters

**2020: GPT-3**
- 175B parameters (100x jump)
- Few-shot learning capabilities
- Commercial API launch

**2022: Instruction Tuning Era**
- InstructGPT, ChatGPT
- RLHF (Reinforcement Learning from Human Feedback)
- Mainstream adoption

**2023: Multi-Modal Transformers**
- GPT-4 (vision + text)
- Claude 2
- Gemini
- Parameters: 1T+ (rumored)

**2024-2026: Efficiency & Specialization**
- Mixture of Experts (MoE) models
- Context windows: 1M+ tokens
- On-device transformers (Phi-3)
- Specialized models (Code Llama, Stable Diffusion)

**Key Trends:**
1. Exponential parameter growth plateaued ~2023
2. Focus shifted to efficiency (sparse models, quantization)
3. Multimodal capabilities became standard
4. Democratization via open-source models

**Societal Impact:**
- 2017-2020: Academic curiosity
- 2021-2023: Tech disruption
- 2024-2026: Mainstream integration

[Continues with citations and further analysis...]
```

### Characteristics

- **Thorough** - Comprehensive coverage
- **Cited** - Backs claims with sources
- **Balanced** - Pros/cons analysis
- **Multi-Step** - Breaks down complex questions
- **Contextual** - Deep memory for long research sessions

### When to Use Research Mode

✅ **Use for:**
- Literature reviews
- Comparative analysis
- Learning new topics
- Due diligence
- Strategic research
- Academic writing
- Technical investigations

❌ **Don't use for:**
- Quick lookups (use Focus)
- Creative writing (use Creative)
- Simple Q&A (use Focus)

---

## Switching Modes

### Mid-Conversation Mode Switch

```bash
# Start in Focus mode
panda chat --agent coder --mode focus

User: Implement quicksort.
Agent: [concise code output]

# Switch to Creative mode mid-conversation
/mode creative

User: Now write a poem about quicksort.
Agent: [creative poem output]

# Switch to Research mode
/mode research

User: Compare quicksort vs. mergesort performance.
Agent: [detailed analysis with benchmarks]
```

### Create Mode-Specific Agents

```bash
# Create 3 agents, one per mode
panda agent create focus-bot --mode focus
panda agent create creative-bot --mode creative
panda agent create research-bot --mode research

# Use the right agent for each task
panda chat --agent focus-bot       # for coding
panda chat --agent creative-bot    # for writing
panda chat --agent research-bot    # for analysis
```

### Temporary Mode Override

```bash
# Agent in Focus mode by default
panda agent create my-agent --mode focus

# Temporarily use Creative mode for one message
panda chat --agent my-agent --mode-override creative --message "Write a story"

# Next message reverts to Focus mode
```

---

## Mode Comparison

### Side-by-Side: Same Query, Different Modes

**Query:** "Explain React hooks"

**Focus Mode Response:**
```
useState: Manage state
useEffect: Side effects
useContext: Access context
useMemo: Cache values
useCallback: Cache functions

Example:
const [count, setCount] = useState(0);
```

**Creative Mode Response:**
```
Imagine React components as musical instruments in an orchestra.

Before hooks, class components were like pianists who could play
any song (state, lifecycle) but required complex sheet music
(boilerplate code).

Hooks are like giving each musician a single, specialized tool:
- useState: The conductor's baton (controls state)
- useEffect: The metronome (synchronizes with time)
- useContext: The stage lights (shares visibility)

This makes the orchestra (your app) more flexible. A violin
(functional component) can now do what only the piano could before!

The magic? Composition. Just as musicians can hold multiple
instruments, components can use multiple hooks.

[Continues with creative analogies...]
```

**Research Mode Response:**
```
**React Hooks: Comprehensive Analysis**

**Historical Context:**
Introduced in React 16.8 (February 2019) to solve three problems:
1. Complex class component lifecycle methods
2. Difficulty reusing stateful logic
3. Confusing "this" binding

**Core Hooks:**

1. useState
   - Signature: const [state, setState] = useState(initialState)
   - Returns: Tuple of [current value, updater function]
   - Re-renders: Component on state change
   - Best Practice: Multiple useState vs. single object (prefer multiple)

2. useEffect
   - Signature: useEffect(effectFn, dependencies?)
   - Lifecycle: Runs after render (deferred)
   - Cleanup: Return function for unmount
   - Common Mistake: Missing dependencies (use ESLint plugin)

3. useContext
   - Signature: const value = useContext(MyContext)
   - Purpose: Avoid prop drilling
   - Performance: Triggers re-render on any context change
   - Optimization: Use multiple contexts or Context + useReducer

**Performance Considerations:**
- Hooks closures can cause stale values
- useCallback/useMemo reduce re-renders (but add overhead)
- Custom hooks enable reusable logic

**Comparison with Class Components:**
| Aspect | Class | Hooks |
|--------|-------|-------|
| Boilerplate | High | Low |
| Logic Reuse | HOCs/Render Props | Custom Hooks |
| Bundle Size | Larger | Smaller |
| Performance | Comparable | Comparable |

**Adoption Statistics (2024):**
- 89% of new React code uses hooks
- Class components still supported but declining

**Recommended Learning Path:**
1. Start with useState and useEffect
2. Add useContext for global state
3. Learn custom hooks for reusable logic
4. Master optimization hooks last

**References:**
- RFC: reactjs.org/docs/hooks-intro.html
- Performance study: [Link to research paper]
```

### Configuration Matrix

| Setting | Focus | Creative | Research |
|---------|-------|----------|----------|
| **Model** | Haiku/Mini | Opus/GPT-5 | Sonnet/Gemini |
| **Temperature** | 0.2 | 0.9 | 0.5 |
| **Max Tokens** | 2048 | 8192 | 4096 |
| **Context** | 10 msgs | 50 msgs | 100 msgs |
| **Speed** | Fast | Slow | Medium |
| **Cost/msg** | $0.001 | $0.05 | $0.01 |
| **Skills** | Minimal | All | Research |
| **Style** | Concise | Expansive | Detailed |

---

## Custom Modes

Create your own specialized modes:

### Define Custom Mode

```bash
panda mode create debug \
  --model "claude-opus-4-6" \
  --temperature 0.1 \
  --max-tokens 16000 \
  --system "You are a debugging expert. Systematically analyze errors with root cause analysis." \
  --skills "file-ops,web-search" \
  --description "Optimized for debugging and error analysis"
```

### Use Custom Mode

```bash
panda agent create debugger --mode debug
```

### Mode Templates

**Customer Support Mode:**
```bash
panda mode create support \
  --model "claude-haiku-4-5-20251001" \
  --temperature 0.7 \
  --max-tokens 1024 \
  --system "You are a friendly customer support agent. Be empathetic, concise, and solution-oriented." \
  --skills "knowledge-base,ticket-system"
```

**Code Review Mode:**
```bash
panda mode create code-review \
  --model "gpt-5-turbo" \
  --temperature 0.3 \
  --max-tokens 4096 \
  --system "You are a senior code reviewer. Focus on: security, performance, maintainability, and best practices." \
  --skills "github,static-analysis"
```

**Teaching Mode:**
```bash
panda mode create teaching \
  --model "claude-sonnet-4-5-20250929" \
  --temperature 0.6 \
  --max-tokens 3000 \
  --system "You are a patient teacher. Use Socratic method. Explain with analogies. Check understanding." \
  --skills "web-search,diagrams"
```

### Share Custom Modes

```bash
# Export mode
panda mode export debug > debug-mode.json

# Import on another machine
panda mode import debug-mode.json
```

---

## Mode-Specific Features

### Focus Mode Features

**Auto-Optimization:**
- Automatically selects fastest available model
- Caches frequent queries
- Batches similar requests

**Distraction Blocking:**
- Disables web-search by default
- Ignores tangential questions
- Returns concise, direct answers

**Cost Control:**
- Hard limit: $0.01 per message
- Automatic fallback to cheaper models
- Budget alerts at 80%

### Creative Mode Features

**Diversity Sampling:**
- Generates multiple variations
- Explores different perspectives
- Combines ideas from different domains

**Inspiration Engine:**
- Auto-enables web-search for inspiration
- Pulls from trending topics
- Suggests related creative prompts

**Quality Over Speed:**
- Uses best models regardless of cost
- No token limits (within model max)
- Retries for better results

### Research Mode Features

**Citation Tracking:**
- Automatically cites sources
- Links to original papers/docs
- Maintains source credibility scores

**Multi-Step Reasoning:**
- Breaks complex questions into sub-questions
- Builds knowledge progressively
- Synthesizes final answer

**Knowledge Graph:**
- Tracks relationships between concepts
- Builds internal knowledge base
- Suggests related research topics

---

## Best Practices

### 1. Match Mode to Task

```bash
# ✅ Right
panda chat --agent coder --mode focus        # for coding
panda chat --agent writer --mode creative    # for writing
panda chat --agent analyst --mode research   # for analysis

# ❌ Wrong
panda chat --agent coder --mode creative     # overkill, slow, expensive
panda chat --agent writer --mode focus       # underpowered, poor quality
```

### 2. Switch Modes Mid-Project

```
Session Start: Focus Mode (implement feature)
     ↓
Feature complete
     ↓
Switch to Creative Mode (write docs)
     ↓
Docs complete
     ↓
Switch to Research Mode (evaluate alternatives)
```

### 3. Create Mode-Specific Agents

```bash
# One agent per workflow
panda agent create dev --mode focus          # Daily coding
panda agent create ideate --mode creative    # Brainstorming sessions
panda agent create learn --mode research     # Learning new tech

# Use the right agent for each context
```

### 4. Monitor Cost by Mode

```bash
# Check cost breakdown by mode
panda cost --group-by mode

# Expected output:
# Focus Mode:    50 messages, $0.50 (avg $0.01/msg)
# Creative Mode: 10 messages, $0.50 (avg $0.05/msg)
# Research Mode: 20 messages, $0.20 (avg $0.01/msg)
```

### 5. Customize Modes for Your Workflow

```bash
# Don't settle for defaults
# Create modes that match YOUR workflow

# Example: "Morning Routine" mode
panda mode create morning-brief \
  --model "claude-haiku-4-5-20251001" \
  --system "Provide concise daily briefing: calendar, emails, priorities." \
  --skills "google-calendar,gmail"
```

---

## Summary

**Key Concepts:**
- ✅ Three core modes: Focus, Creative, Research
- ✅ Each mode optimized for specific workflows
- ✅ Switch modes mid-conversation
- ✅ Create custom modes
- ✅ Mode affects model, temperature, context, skills
- ✅ Significant cost differences between modes

**Quick Mode Selection:**
- **Need speed?** → Focus
- **Need creativity?** → Creative
- **Need depth?** → Research
- **Need custom?** → Create your own

**Commands:**
```bash
# Create with mode
panda agent create NAME --mode focus|creative|research

# Switch mode
/mode focus|creative|research

# Create custom mode
panda mode create NAME [options]

# List modes
panda mode list
```

**Next:** Read [Cost Management Guide](cost-management.md) to optimize spending across modes.

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**Next:** [Cost Management Guide](cost-management.md)
