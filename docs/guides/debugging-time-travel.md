# Debugging with Time Travel

Complete guide to debugging AI agents using Agentik OS's Time Travel Debug feature - replay, inspect, and fix agent sessions with full historical context.

---

## Table of Contents

1. [What is Time Travel Debugging?](#what-is-time-travel-debugging)
2. [How It Works](#how-it-works)
3. [Capturing Sessions](#capturing-sessions)
4. [Replaying Sessions](#replaying-sessions)
5. [Inspection Tools](#inspection-tools)
6. [Common Debugging Scenarios](#common-debugging-scenarios)
7. [Time Travel Dashboard](#time-travel-dashboard)
8. [Best Practices](#best-practices)

---

## What is Time Travel Debugging?

Time Travel Debugging lets you **replay agent sessions** like a DVR - rewind, pause, inspect, and understand exactly what happened.

### The Problem

**Without Time Travel:**
```
User: "The agent gave a wrong answer yesterday."
You: "What was the question?"
User: "I don't remember exactly..."
You: "What was the context?"
User: "There was a long conversation before that..."
You: ¯\_(ツ)_/¯ [Give up debugging]
```

**With Time Travel:**
```
User: "The agent gave a wrong answer yesterday."
You: "Let me replay that session..."

[Time Travel Dashboard opens]
[Rewinds to exact timestamp]
[Shows full conversation context]
[Inspects agent's reasoning]
[Identifies root cause: outdated data in context]
[Fixes issue]
[Verifies fix by replaying with correction]

You: "Fixed! The agent was using cached data from 2 days ago."
```

### Key Features

- ✅ **Full session history** - Every message, every token
- ✅ **Replay with modifications** - Change inputs and re-run
- ✅ **Inspect internal state** - See agent's "thought process"
- ✅ **Compare sessions** - Side-by-side diff
- ✅ **Branch timelines** - Create alternative histories
- ✅ **Export for analysis** - JSON, CSV, video recording

---

## How It Works

### Event Sourcing Architecture

Agentik OS uses **event sourcing** - every event is stored chronologically and immutably.

```
User Message → Event #1 (stored)
     ↓
Agent Reasoning → Event #2 (stored)
     ↓
Model API Call → Event #3 (stored)
     ↓
Model Response → Event #4 (stored)
     ↓
Agent Final Response → Event #5 (stored)
```

**Every event includes:**
- Timestamp (nanosecond precision)
- Actor (user, agent, system)
- Event type (message, reasoning, api_call, etc.)
- Full payload (message content, tokens, cost, etc.)
- Context snapshot (conversation state at that moment)

### Session Recording

```bash
# Sessions are auto-recorded
panda chat --agent my-agent
# → Creates session_1234567890_my-agent

# All events stored in Convex:
# - convex/messages: user/agent messages
# - convex/events: internal events (reasoning, API calls)
# - convex/snapshots: periodic state snapshots
```

### Replay Engine

```bash
# Replay a session
panda time-travel replay session_1234567890_my-agent

# What happens:
# 1. Loads all events from database
# 2. Reconstructs exact state at each point
# 3. Re-executes agent logic (or fast-forwards if unchanged)
# 4. Shows side-by-side: original vs. replay
```

---

## Capturing Sessions

### Automatic Capture

All sessions are automatically recorded (no setup required):

```bash
panda chat --agent my-agent

# Session auto-captured as:
# session_1708012345_my-agent
```

### Named Sessions

Create named sessions for important conversations:

```bash
# Start named session
panda chat --agent my-agent --session "customer-issue-142"

# Later, easy to find:
panda time-travel list --session customer-issue-142
```

### Selective Capture

Disable recording for privacy-sensitive conversations:

```bash
# Disable recording
panda chat --agent my-agent --no-record

# Or mark as private (recorded but not searchable)
panda chat --agent my-agent --private
```

### Storage Settings

```bash
# How long to keep sessions
panda config set timeTravel.retentionDays 90  # Default: 90 days

# Auto-delete after retention period
panda config set timeTravel.autoDelete true
```

---

## Replaying Sessions

### List Sessions

```bash
# List all recorded sessions
panda time-travel list

# Output:
# ╔════════════════════════════════════════════════════════╗
# ║ Session ID                Agent        Date       Msgs ║
# ╠════════════════════════════════════════════════════════╣
# ║ session_1708012345        my-agent     Feb 14     15   ║
# ║ session_1708011234        research-bot Feb 13     42   ║
# ║ customer-issue-142        support      Feb 12     8    ║
# ╚════════════════════════════════════════════════════════╝

# Filter by agent
panda time-travel list --agent research-bot

# Filter by date
panda time-travel list --since "2026-02-01"

# Search by content
panda time-travel search "quantum computing"
```

### Replay Entire Session

```bash
# Replay from start to finish
panda time-travel replay session_1708012345

# Output (animated):
# ╔════════════════════════════════════════════════════════╗
# ║ TIME TRAVEL: Replaying session_1708012345             ║
# ╚════════════════════════════════════════════════════════╝
#
# [2026-02-14 09:15:23] User: Hello, what can you help with?
# [2026-02-14 09:15:24] Agent: Hello! I can help with...
#
# [2026-02-14 09:16:10] User: Explain quantum computing.
# [2026-02-14 09:16:15] Agent: Quantum computing uses qubits...
#
# [... continues through all 15 messages ...]
#
# Session complete. Duration: 12 minutes 34 seconds
```

### Replay from Specific Point

```bash
# Start replay at message #5
panda time-travel replay session_1708012345 --from-message 5

# Start replay at timestamp
panda time-travel replay session_1708012345 --from-time "2026-02-14 09:16:00"
```

### Replay with Modifications

```bash
# Replay but change a user message
panda time-travel replay session_1708012345 \
  --modify-message 3 \
  --new-text "Explain quantum computing in simple terms."

# What happens:
# - Replays messages 1-2 as-is
# - Replays message 3 with NEW text
# - Agent re-processes from message 3 onward with new context
# - Shows diff: original vs. modified timeline
```

### Compare Sessions

```bash
# Compare two sessions side-by-side
panda time-travel compare session_A session_B

# Output:
# ╔════════════════════════════════════════════════════════╗
# ║ Session A              │  Session B                    ║
# ╠════════════════════════════════════════════════════════╣
# ║ User: Explain AI       │  User: Explain AI             ║
# ║ Agent: AI is...        │  Agent: AI is...              ║
# ║                        │                               ║
# ║ User: How does it work?│  User: How does it work?      ║
# ║ Agent: (GPT-5 resp)    │  Agent: (Claude resp) ← DIFF  ║
# ╚════════════════════════════════════════════════════════╝
#
# Differences:
# - Message 2: Different model used (GPT-5 vs Claude)
# - Message 2: Response length differs (500 vs 300 tokens)
# - Message 2: Cost differs ($0.05 vs $0.03)
```

---

## Inspection Tools

### Message-Level Inspection

```bash
# Inspect a specific message
panda time-travel inspect session_1708012345 --message 5

# Output:
# ╔════════════════════════════════════════════════════════╗
# ║ Message #5 - User                                      ║
# ╚════════════════════════════════════════════════════════╝
#
# Timestamp: 2026-02-14 09:16:10.234 UTC
# Content: "Explain quantum computing."
# Tokens: 3
#
# Context at this point:
# - Previous messages: 4
# - Total context tokens: 523
# - Agent mode: research
# - Model selected: claude-sonnet-4-5-20250929
```

### Agent Reasoning Inspection

```bash
# See agent's internal reasoning (if enabled)
panda time-travel inspect session_1708012345 --message 6 --reasoning

# Output:
# ╔════════════════════════════════════════════════════════╗
# ║ Message #6 - Agent Reasoning                           ║
# ╚════════════════════════════════════════════════════════╝
#
# User asked: "Explain quantum computing."
#
# Agent's internal reasoning:
# 1. Detected topic: quantum physics
# 2. Assessed complexity: high
# 3. Checked context: no prior quantum discussion
# 4. Mode: research (appropriate for technical topic)
# 5. Skills considered: web-search (for latest research)
# 6. Decided: Use internal knowledge + web-search for recent papers
# 7. Model selection: Sonnet (balanced quality/cost)
# 8. Response strategy: Start with fundamentals, then recent advances
#
# Skills invoked:
# - web-search("quantum computing recent papers") → 5 results
#
# Response generated (500 tokens):
# "Quantum computing uses qubits..."
```

### API Call Inspection

```bash
# See actual API calls made
panda time-travel inspect session_1708012345 --message 6 --api-calls

# Output:
# ╔════════════════════════════════════════════════════════╗
# ║ API Calls for Message #6                               ║
# ╚════════════════════════════════════════════════════════╝
#
# Call #1: Anthropic Claude API
# - Model: claude-sonnet-4-5-20250929
# - Timestamp: 2026-02-14 09:16:11.567 UTC
# - Request:
#   {
#     "model": "claude-sonnet-4-5-20250929",
#     "messages": [...],
#     "temperature": 0.5,
#     "max_tokens": 4096
#   }
# - Response:
#   {
#     "content": "Quantum computing uses qubits...",
#     "usage": {
#       "input_tokens": 523,
#       "output_tokens": 500
#     }
#   }
# - Duration: 3.2 seconds
# - Cost: $0.012
#
# Call #2: Web Search API
# - Query: "quantum computing recent papers"
# - Duration: 1.1 seconds
# - Results: 5
# - Cost: $0.001
```

### Cost Breakdown

```bash
# Cost analysis for a session
panda time-travel inspect session_1708012345 --costs

# Output:
# ╔════════════════════════════════════════════════════════╗
# ║ Cost Breakdown - session_1708012345                    ║
# ╚════════════════════════════════════════════════════════╝
#
# Total Cost: $0.183
#
# By Message:
# Msg 1: $0.001  (User: "Hello")
# Msg 2: $0.005  (Agent: greeting)
# Msg 3: $0.002  (User: "What can you help with?")
# Msg 4: $0.008  (Agent: capabilities list)
# Msg 5: $0.003  (User: "Explain quantum computing")
# Msg 6: $0.012  (Agent: explanation) ← Most expensive
# ...
#
# By Skill:
# - web-search: $0.015 (10 searches)
# - file-ops: $0.002 (5 operations)
#
# By Model:
# - claude-sonnet-4-5-20250929: $0.166 (90%)
# - claude-haiku (fallback): $0.017 (10%)
#
# Optimization Opportunity:
# → Message 6 used Sonnet for simple explanation
# → Haiku could have handled it (-75% cost)
# → Potential savings: $0.009 for this message
```

---

## Common Debugging Scenarios

### Scenario 1: Agent Gave Wrong Answer

**Problem:** Agent provided incorrect information.

**Debug Steps:**

```bash
# 1. Find the session
panda time-travel search "incorrect answer keyword"

# 2. Replay the session
panda time-travel replay session_XYZ

# 3. Inspect the wrong message
panda time-travel inspect session_XYZ --message 10 --reasoning

# 4. Check what data the agent used
# (Inspect API call, check if web-search was used, etc.)

# 5. Identify root cause
# Example findings:
# - Agent used outdated cached data
# - Web-search returned irrelevant results
# - Model hallucinated due to low temperature

# 6. Fix and verify
# - Clear cache
# - Adjust search query
# - Increase temperature

# 7. Replay with fix to verify
panda time-travel replay session_XYZ --modify-settings "..."
```

### Scenario 2: Agent Was Slow

**Problem:** Response took 30 seconds (normally 3 seconds).

**Debug Steps:**

```bash
# 1. Inspect timing
panda time-travel inspect session_XYZ --message 5 --timing

# Output:
# Total Duration: 28.5 seconds
# Breakdown:
# - User input received: 0ms
# - Agent reasoning: 150ms
# - Skill: web-search: 1,200ms  ← Normal
# - Skill: web-search: 1,100ms  ← Normal
# - Skill: web-search: 1,300ms  ← Normal
# - Model API call (attempt 1): TIMEOUT after 10s  ← Problem!
# - Model API retry (attempt 2): 14,750ms  ← Slow but succeeded
#
# Root Cause: Anthropic API timeout, then slow retry

# 2. Check API status at that time
panda time-travel inspect session_XYZ --message 5 --api-status

# 3. Solution: Enable automatic fallback to different provider
panda agent update my-agent --fallback-provider openai
```

### Scenario 3: Unexpected Skill Invocation

**Problem:** Agent called expensive skill unnecessarily.

**Debug Steps:**

```bash
# 1. Find session
panda time-travel list --skills web-search --cost-above 0.50

# 2. Inspect reasoning
panda time-travel inspect session_XYZ --message 3 --reasoning

# Output:
# Agent reasoning:
# User asked: "What's 2+2?"
# - Detected: math question
# - Invoked: web-search (WHY?!) ← Bug!
# - Cost: $0.05

# Root cause: Agent's math detector failed, treated as general question

# 3. Fix agent's reasoning logic
# 4. Verify fix by replaying
panda time-travel replay session_XYZ --modified-agent
```

### Scenario 4: Context Window Overflow

**Problem:** Agent forgot earlier conversation.

**Debug Steps:**

```bash
# 1. Inspect context at the point of failure
panda time-travel inspect session_XYZ --message 20 --context

# Output:
# Context at Message 20:
# - Context window: 10 messages
# - Included messages: 11-20 (last 10)
# - Excluded messages: 1-10 (too old)
#
# User's message 3: "My name is Alice"
# User's message 20: "What's my name?"
# Agent's response: "I don't know your name."
#
# Root Cause: Message 3 fell out of context window

# 2. Fix: Increase context window
panda agent update my-agent --context-window 20

# 3. Or: Use long-term memory
panda agent update my-agent --long-term-memory true
```

### Scenario 5: Cost Spike

**Problem:** One session cost $50 (normally $0.50).

**Debug Steps:**

```bash
# 1. Find expensive sessions
panda time-travel list --cost-above 10.00

# 2. Analyze cost breakdown
panda time-travel inspect session_XYZ --costs

# Output:
# Message 5: $48.00 ← Spike!
# - Model: claude-opus-4-6
# - Input tokens: 150,000 ← WAY too many!
# - Output tokens: 8,000
#
# Root Cause: Agent sent entire 100-page PDF in context

# 3. Fix: Implement document summarization
# - Summarize PDF first ($0.50)
# - Then analyze summary ($0.10)
# Total: $0.60 vs. $48.00 (99% savings)
```

---

## Time Travel Dashboard

Access the visual debugging interface:

```bash
# CLI
panda time-travel dashboard

# Web
http://localhost:3000/time-travel
```

### Dashboard Features

**1. Session Timeline**
```
Timeline View:

09:15 ━━━━┬━━━━━━━━┬━━━━━━━━┬━━━━━━━━┬━━━━ 09:30
         │        │        │        │
         1        5        10       15 (messages)
         │        │        │        │
       Start   Skill   Model    End
               used    call
```

**2. Message Inspector**
- Click any message to see full details
- View reasoning, API calls, costs
- Edit and replay from that point

**3. Comparison View**
- Compare two sessions side-by-side
- Highlight differences
- Show cost/time deltas

**4. Performance Graph**
```
Response Time (seconds):

5s ┤       ╭─╮
4s ┤   ╭───╯ ╰─╮
3s ┤╭──╯       ╰──╮
2s ┼╯             ╰────
0s ┴─────────────────────
   Msg 1   5   10   15

Slowest: Msg 10 (web-search timeout)
```

**5. Cost Waterfall**
```
Cost Breakdown:

Msg 1  ▓ $0.001
Msg 2  ▓▓ $0.005
Msg 3  ▓ $0.002
Msg 4  ▓▓▓ $0.008
Msg 5  ▓ $0.003
Msg 6  ▓▓▓▓▓▓▓▓▓▓ $0.050 ← Expensive!
...

Click to inspect
```

**6. Export Options**
- JSON (for analysis)
- CSV (for spreadsheets)
- Video recording (animated replay)

---

## Best Practices

### 1. Name Important Sessions

```bash
# ❌ Generic
panda chat --agent support

# ✅ Named for easy retrieval
panda chat --agent support --session "customer-issue-12345"
```

### 2. Use Reasoning Inspection for Complex Issues

```bash
# Always inspect reasoning when debugging unexpected behavior
panda time-travel inspect SESSION --message N --reasoning
```

### 3. Compare Before/After Fixing

```bash
# 1. Identify problem in session A
# 2. Make fix
# 3. Create new session B with same inputs
# 4. Compare to verify fix
panda time-travel compare session_A session_B
```

### 4. Export for Team Collaboration

```bash
# Share session with team
panda time-travel export session_XYZ --format json > issue-123.json

# Team member imports and replays
panda time-travel import issue-123.json
panda time-travel replay session_XYZ
```

### 5. Set Appropriate Retention

```bash
# Keep recent sessions longer
panda config set timeTravel.retentionDays.production 180
panda config set timeTravel.retentionDays.development 30

# Auto-delete old dev sessions
panda time-travel cleanup --older-than 30d --env development
```

### 6. Use Time Travel for Load Testing

```bash
# Record a typical user session
panda chat --agent my-agent --session "typical-user-flow"

# Replay 100x in parallel to test load
for i in {1..100}; do
  panda time-travel replay typical-user-flow &
done

# Measure: performance, cost, errors under load
```

### 7. Create Regression Tests from Sessions

```bash
# Convert a session into an automated test
panda time-travel export session_XYZ --format test > test-quantum-qa.ts

# test-quantum-qa.ts:
# import { test, expect } from 'vitest';
#
# test('Agent handles quantum computing questions', async () => {
#   const agent = await createAgent('research-bot');
#   const response = await agent.chat('Explain quantum computing');
#   expect(response).toContain('qubits');
#   expect(response).toContain('superposition');
# });

# Run as part of CI/CD
pnpm test test-quantum-qa.ts
```

---

## Summary

**Key Capabilities:**
- ✅ Replay any session with full fidelity
- ✅ Inspect message-level details (reasoning, API calls, cost)
- ✅ Modify and re-run with changes
- ✅ Compare sessions side-by-side
- ✅ Export for analysis and collaboration
- ✅ Visual dashboard for exploration

**Common Use Cases:**
- Debug wrong answers
- Investigate performance issues
- Optimize costs
- Create regression tests
- Train new agents (learn from past sessions)
- Compliance audits (show exactly what happened)

**Quick Commands:**
```bash
# List sessions
panda time-travel list

# Replay
panda time-travel replay SESSION_ID

# Inspect
panda time-travel inspect SESSION_ID --message N

# Compare
panda time-travel compare SESSION_A SESSION_B

# Dashboard
panda time-travel dashboard
```

**Pro Tip:** Use Time Travel not just for debugging, but also for:
- Analyzing successful sessions (what worked well?)
- Creating training data (export good sessions)
- Compliance reporting (prove agent behavior)
- Cost optimization (identify waste patterns)

**Next:** Read [Multi-Tenancy Setup](multi-tenancy.md) for enterprise deployment.

---

**Last Updated:** 2026-02-14
**Version:** 1.0.0
**Next:** [Multi-Tenancy Setup](multi-tenancy.md)
