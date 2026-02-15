# SDK Documentation

> **Official SDKs for TypeScript/JavaScript and Python**

Build AI agent applications with type-safe, idiomatic SDKs for Agentik OS.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [TypeScript/JavaScript SDK](#typescriptjavascript-sdk)
5. [Python SDK](#python-sdk)
6. [Authentication](#authentication)
7. [Error Handling](#error-handling)
8. [Streaming Responses](#streaming-responses)
9. [Pagination](#pagination)
10. [Webhooks](#webhooks)
11. [Advanced Usage](#advanced-usage)
12. [API Reference](#api-reference)

---

## Introduction

The Agentik OS SDKs provide:

- ✅ **Type-safe** - Full TypeScript definitions, IDE autocomplete
- ✅ **Idiomatic** - Follows language conventions
- ✅ **Stream support** - Real-time AI responses
- ✅ **Error handling** - Structured error types
- ✅ **Pagination** - Automatic cursor-based pagination
- ✅ **Retries** - Automatic retry logic with exponential backoff

### Supported Languages

| Language | Package | Version | Status |
|----------|---------|---------|--------|
| **TypeScript/JavaScript** | `@agentik/sdk` | 1.0.0 | ✅ Stable |
| **Python** | `agentik` | 1.0.0 | ✅ Stable |
| **Go** | `agentik-go` | - | 🚧 Coming soon |
| **Rust** | `agentik-rs` | - | 🚧 Coming soon |

---

## Installation

### TypeScript / JavaScript

```bash
npm install @agentik/sdk
# or
pnpm add @agentik/sdk
# or
yarn add @agentik/sdk
# or
bun add @agentik/sdk
```

**Requirements:**
- Node.js 18+ or Bun 1.0+
- TypeScript 5.0+ (optional, but recommended)

---

### Python

```bash
pip install agentik
# or
poetry add agentik
# or
uv pip install agentik
```

**Requirements:**
- Python 3.9+

---

## Quick Start

### TypeScript

```typescript
import { Agentik } from '@agentik/sdk';

// Initialize client
const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});

// Create an agent
const agent = await agentik.agents.create({
  name: 'Customer Support Bot',
  model: 'claude-sonnet-4-5',
  systemPrompt: 'You are a helpful customer support agent.',
});

// Send a message
const response = await agentik.agents.messages.create(agent.id, {
  content: 'What is your return policy?',
});

console.log(response.content);
// "Our return policy allows returns within 30 days..."
```

---

### Python

```python
import os
from agentik import Agentik

# Initialize client
agentik = Agentik(api_key=os.environ["AGENTIK_API_KEY"])

# Create an agent
agent = agentik.agents.create(
    name="Customer Support Bot",
    model="claude-sonnet-4-5",
    system_prompt="You are a helpful customer support agent."
)

# Send a message
response = agentik.agents.messages.create(
    agent_id=agent.id,
    content="What is your return policy?"
)

print(response.content)
# "Our return policy allows returns within 30 days..."
```

---

## TypeScript/JavaScript SDK

### Initialization

```typescript
import { Agentik } from '@agentik/sdk';

const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
  baseURL: 'https://api.agentik-os.com/v1', // Optional, defaults to this
  timeout: 60000, // Request timeout in ms (default: 60s)
  maxRetries: 3, // Max retry attempts (default: 3)
});
```

### Agents

#### Create Agent

```typescript
const agent = await agentik.agents.create({
  name: 'Code Reviewer',
  model: 'claude-opus-4-6',
  systemPrompt: 'You are an expert code reviewer...',
  temperature: 0.7,
  maxTokens: 4096,
  mode: 'focus',
  skills: ['web-search', 'file-ops'],
  budget: {
    maxCostPerMessage: 0.10,
  },
  metadata: {
    team: 'engineering',
    environment: 'production',
  },
});

// Response type is fully typed:
// agent: Agent
console.log(agent.id); // agent_abc123
console.log(agent.name); // "Code Reviewer"
```

#### Get Agent

```typescript
const agent = await agentik.agents.get('agent_abc123');

console.log(agent.model); // "claude-opus-4-6"
console.log(agent.status); // "active"
```

#### List Agents

```typescript
const agents = await agentik.agents.list({
  limit: 20,
  status: 'active',
});

for (const agent of agents.data) {
  console.log(`${agent.name} (${agent.model})`);
}

// Pagination
if (agents.hasMore) {
  const nextPage = await agentik.agents.list({
    cursor: agents.nextCursor,
  });
}
```

#### Update Agent

```typescript
const updated = await agentik.agents.update('agent_abc123', {
  temperature: 0.8,
  systemPrompt: 'Updated instructions...',
});

console.log(updated.temperature); // 0.8
```

#### Delete Agent

```typescript
await agentik.agents.delete('agent_abc123');
// Soft delete - recoverable for 30 days
```

---

### Messages

#### Send Message

```typescript
const response = await agentik.agents.messages.create(agent.id, {
  content: 'Explain quantum computing in simple terms',
  sessionId: 'session_xyz789', // Optional - auto-created if omitted
});

console.log(response.content);
// "Quantum computing is like having a computer that can try..."

// Full response includes:
console.log(response.usage); // { promptTokens: 20, completionTokens: 150, totalTokens: 170 }
console.log(response.cost); // { amount: 0.0255, currency: "usd" }
console.log(response.model); // "claude-sonnet-4-5"
```

#### Stream Message

```typescript
const stream = await agentik.agents.messages.create(agent.id, {
  content: 'Write a poem about AI',
  stream: true,
});

// Option 1: Async iterator
for await (const chunk of stream) {
  if (chunk.type === 'content_block_delta') {
    process.stdout.write(chunk.delta.text);
  }
}

// Option 2: Event listeners
stream.on('text', (text) => {
  process.stdout.write(text);
});

stream.on('end', (finalMessage) => {
  console.log('\n\nTotal cost:', finalMessage.cost.amount);
});

stream.on('error', (error) => {
  console.error('Stream error:', error);
});
```

#### Get Message

```typescript
const message = await agentik.messages.get('msg_abc123');

console.log(message.role); // "assistant"
console.log(message.content); // "..."
```

---

### Sessions

#### Create Session

```typescript
const session = await agentik.sessions.create({
  agentId: 'agent_abc123',
  metadata: {
    userId: 'user_123',
    source: 'web-chat',
  },
});

console.log(session.id); // "session_xyz789"
```

#### Get Session

```typescript
const session = await agentik.sessions.get('session_xyz789');

console.log(session.messageCount); // 42
console.log(session.totalCost); // 1.23
```

#### List Messages in Session

```typescript
const messages = await agentik.sessions.messages.list('session_xyz789', {
  limit: 50,
});

for (const message of messages.data) {
  console.log(`${message.role}: ${message.content.slice(0, 50)}...`);
}
```

#### Delete Session

```typescript
await agentik.sessions.delete('session_xyz789');
// Deletes session and all messages
```

---

### Skills

#### List Skills

```typescript
const skills = await agentik.skills.list({
  category: 'productivity',
  verified: true,
});

for (const skill of skills.data) {
  console.log(`${skill.name} - ${skill.description}`);
}
```

#### Install Skill

```typescript
await agentik.agents.skills.install(agent.id, {
  skillId: 'skill_web_search',
  config: {
    apiKey: process.env.GOOGLE_API_KEY,
  },
});

console.log('Skill installed!');
```

---

### Models

#### List Models

```typescript
const models = await agentik.models.list();

for (const model of models.data) {
  console.log(`${model.name} - $${model.pricing.input}/M input tokens`);
}
```

---

## Python SDK

### Initialization

```python
from agentik import Agentik

agentik = Agentik(
    api_key=os.environ["AGENTIK_API_KEY"],
    base_url="https://api.agentik-os.com/v1",  # Optional
    timeout=60,  # Seconds (default: 60)
    max_retries=3,  # Max retry attempts (default: 3)
)
```

### Agents

#### Create Agent

```python
agent = agentik.agents.create(
    name="Code Reviewer",
    model="claude-opus-4-6",
    system_prompt="You are an expert code reviewer...",
    temperature=0.7,
    max_tokens=4096,
    mode="focus",
    skills=["web-search", "file-ops"],
    budget={"max_cost_per_message": 0.10},
    metadata={"team": "engineering"},
)

print(agent.id)  # agent_abc123
print(agent.name)  # "Code Reviewer"
```

#### Get Agent

```python
agent = agentik.agents.get("agent_abc123")

print(agent.model)  # "claude-opus-4-6"
print(agent.status)  # "active"
```

#### List Agents

```python
agents = agentik.agents.list(limit=20, status="active")

for agent in agents.data:
    print(f"{agent.name} ({agent.model})")

# Pagination
if agents.has_more:
    next_page = agentik.agents.list(cursor=agents.next_cursor)
```

#### Update Agent

```python
updated = agentik.agents.update(
    "agent_abc123",
    temperature=0.8,
    system_prompt="Updated instructions...",
)

print(updated.temperature)  # 0.8
```

#### Delete Agent

```python
agentik.agents.delete("agent_abc123")
```

---

### Messages

#### Send Message

```python
response = agentik.agents.messages.create(
    agent_id=agent.id,
    content="Explain quantum computing in simple terms",
    session_id="session_xyz789",  # Optional
)

print(response.content)
# "Quantum computing is like having a computer that can try..."

# Full response includes:
print(response.usage)  # Usage(prompt_tokens=20, completion_tokens=150, total_tokens=170)
print(response.cost)  # Cost(amount=0.0255, currency="usd")
```

#### Stream Message

```python
stream = agentik.agents.messages.create(
    agent_id=agent.id,
    content="Write a poem about AI",
    stream=True,
)

# Option 1: Iterate
for chunk in stream:
    if chunk.type == "content_block_delta":
        print(chunk.delta.text, end="")

# Option 2: Context manager
with agentik.agents.messages.create(
    agent_id=agent.id,
    content="Write a poem",
    stream=True,
) as stream:
    for chunk in stream:
        print(chunk.delta.text, end="")
```

#### Get Message

```python
message = agentik.messages.get("msg_abc123")

print(message.role)  # "assistant"
print(message.content)  # "..."
```

---

### Sessions

#### Create Session

```python
session = agentik.sessions.create(
    agent_id="agent_abc123",
    metadata={"user_id": "user_123", "source": "web-chat"},
)

print(session.id)  # "session_xyz789"
```

#### Get Session

```python
session = agentik.sessions.get("session_xyz789")

print(session.message_count)  # 42
print(session.total_cost)  # 1.23
```

#### List Messages in Session

```python
messages = agentik.sessions.messages.list("session_xyz789", limit=50)

for message in messages.data:
    print(f"{message.role}: {message.content[:50]}...")
```

#### Delete Session

```python
agentik.sessions.delete("session_xyz789")
```

---

## Authentication

### API Key

Both SDKs support API key authentication:

**TypeScript:**
```typescript
const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});
```

**Python:**
```python
agentik = Agentik(api_key=os.environ["AGENTIK_API_KEY"])
```

### Environment Variables

SDKs automatically detect `AGENTIK_API_KEY`:

**TypeScript:**
```typescript
// No need to pass apiKey if AGENTIK_API_KEY is set
const agentik = new Agentik();
```

**Python:**
```python
# No need to pass api_key if AGENTIK_API_KEY is set
agentik = Agentik()
```

---

## Error Handling

### TypeScript

```typescript
import { Agentik, AgentikError } from '@agentik/sdk';

try {
  const agent = await agentik.agents.get('invalid_id');
} catch (error) {
  if (error instanceof AgentikError) {
    console.error('API Error:', error.message);
    console.error('Status:', error.status);
    console.error('Type:', error.type);
    console.error('Code:', error.code);

    // Specific error types
    if (error.type === 'not_found_error') {
      console.log('Agent not found');
    } else if (error.type === 'rate_limit_exceeded') {
      console.log('Rate limit exceeded, retry after:', error.retryAfter);
    }
  } else {
    // Network error, etc.
    console.error('Unexpected error:', error);
  }
}
```

### Python

```python
from agentik import Agentik, AgentikError

try:
    agent = agentik.agents.get("invalid_id")
except AgentikError as error:
    print(f"API Error: {error.message}")
    print(f"Status: {error.status}")
    print(f"Type: {error.type}")
    print(f"Code: {error.code}")

    # Specific error types
    if error.type == "not_found_error":
        print("Agent not found")
    elif error.type == "rate_limit_exceeded":
        print(f"Rate limit exceeded, retry after: {error.retry_after}")
except Exception as error:
    # Network error, etc.
    print(f"Unexpected error: {error}")
```

### Error Types

| Error Class | Description |
|-------------|-------------|
| `InvalidRequestError` | Invalid request parameters (400) |
| `AuthenticationError` | Invalid API key (401) |
| `PermissionDeniedError` | Insufficient permissions (403) |
| `NotFoundError` | Resource not found (404) |
| `RateLimitError` | Rate limit exceeded (429) |
| `ServerError` | Internal server error (500) |

---

## Streaming Responses

### TypeScript - Event Listeners

```typescript
const stream = await agentik.agents.messages.create(agent.id, {
  content: 'Write a story',
  stream: true,
});

// Listen to specific events
stream.on('text', (text) => {
  process.stdout.write(text);
});

stream.on('usage', (usage) => {
  console.log(`\nTokens: ${usage.totalTokens}`);
});

stream.on('cost', (cost) => {
  console.log(`Cost: $${cost.amount}`);
});

stream.on('end', (finalMessage) => {
  console.log('\nDone!');
  console.log('Final cost:', finalMessage.cost.amount);
});

stream.on('error', (error) => {
  console.error('Error:', error);
});
```

### TypeScript - Async Iterator

```typescript
for await (const chunk of stream) {
  switch (chunk.type) {
    case 'content_block_delta':
      process.stdout.write(chunk.delta.text);
      break;
    case 'message_delta':
      console.log('\nTokens:', chunk.usage.totalTokens);
      break;
  }
}
```

### Python - Iterator

```python
stream = agentik.agents.messages.create(
    agent_id=agent.id,
    content="Write a story",
    stream=True,
)

for chunk in stream:
    if chunk.type == "content_block_delta":
        print(chunk.delta.text, end="")
    elif chunk.type == "message_delta":
        print(f"\nTokens: {chunk.usage.total_tokens}")
```

---

## Pagination

### TypeScript - Manual

```typescript
let cursor: string | undefined;
let allAgents: Agent[] = [];

do {
  const page = await agentik.agents.list({ limit: 100, cursor });
  allAgents.push(...page.data);
  cursor = page.nextCursor;
} while (cursor);

console.log(`Total agents: ${allAgents.length}`);
```

### TypeScript - Auto-Paginate

```typescript
// Automatically fetches all pages
for await (const agent of agentik.agents.listAutoPaginate({ limit: 100 })) {
  console.log(agent.name);
}

// Or collect all at once
const allAgents = await agentik.agents.listAutoPaginate({ limit: 100 }).toArray();
```

### Python - Manual

```python
cursor = None
all_agents = []

while True:
    page = agentik.agents.list(limit=100, cursor=cursor)
    all_agents.extend(page.data)
    if not page.has_more:
        break
    cursor = page.next_cursor

print(f"Total agents: {len(all_agents)}")
```

### Python - Auto-Paginate

```python
# Automatically fetches all pages
for agent in agentik.agents.list_auto_paginate(limit=100):
    print(agent.name)

# Or collect all at once
all_agents = list(agentik.agents.list_auto_paginate(limit=100))
```

---

## Webhooks

### TypeScript - Verify Signature

```typescript
import { Agentik } from '@agentik/sdk';

export async function POST(request: Request) {
  const signature = request.headers.get('agentik-signature');
  const body = await request.text();

  // Verify webhook signature
  const isValid = Agentik.verifyWebhookSignature(
    body,
    signature!,
    process.env.WEBHOOK_SECRET!
  );

  if (!isValid) {
    return new Response('Invalid signature', { status: 400 });
  }

  const event = JSON.parse(body);

  switch (event.type) {
    case 'message.created':
      console.log('New message:', event.data.content);
      break;
    case 'cost.threshold_exceeded':
      console.log('Cost threshold exceeded:', event.data.amount);
      break;
  }

  return new Response('OK');
}
```

### Python - Verify Signature

```python
from agentik import Agentik
from flask import Flask, request

app = Flask(__name__)

@app.route("/webhooks/agentik", methods=["POST"])
def handle_webhook():
    signature = request.headers.get("agentik-signature")
    body = request.get_data(as_text=True)

    # Verify webhook signature
    is_valid = Agentik.verify_webhook_signature(
        body, signature, os.environ["WEBHOOK_SECRET"]
    )

    if not is_valid:
        return "Invalid signature", 400

    event = request.get_json()

    if event["type"] == "message.created":
        print(f"New message: {event['data']['content']}")
    elif event["type"] == "cost.threshold_exceeded":
        print(f"Cost threshold exceeded: {event['data']['amount']}")

    return "OK"
```

---

## Advanced Usage

### Custom HTTP Client (TypeScript)

```typescript
import { Agentik } from '@agentik/sdk';
import { ProxyAgent } from 'undici';

const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
  httpAgent: new ProxyAgent('http://proxy.example.com:8080'),
});
```

### Timeout & Retries (TypeScript)

```typescript
const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
  timeout: 120000, // 2 minutes
  maxRetries: 5,
});
```

### Logging (Python)

```python
import logging
from agentik import Agentik

# Enable SDK logging
logging.basicConfig(level=logging.DEBUG)

agentik = Agentik(api_key=os.environ["AGENTIK_API_KEY"])
```

### Async/Await (Python)

```python
import asyncio
from agentik import AsyncAgentik

async def main():
    agentik = AsyncAgentik(api_key=os.environ["AGENTIK_API_KEY"])

    agent = await agentik.agents.create(
        name="Async Agent",
        model="claude-sonnet-4-5",
        system_prompt="You are helpful",
    )

    response = await agentik.agents.messages.create(
        agent_id=agent.id,
        content="Hello!",
    )

    print(response.content)

asyncio.run(main())
```

---

## API Reference

### TypeScript Types

```typescript
// Agent
interface Agent {
  id: string;
  object: 'agent';
  name: string;
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  mode: 'focus' | 'creative' | 'research';
  skills: string[];
  budget?: {
    maxCostPerMessage?: number;
  };
  metadata?: Record<string, any>;
  status: 'active' | 'paused' | 'archived';
  createdAt: number;
  updatedAt: number;
}

// Message
interface Message {
  id: string;
  object: 'message';
  agentId: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  model: string;
  usage: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  cost: {
    amount: number;
    currency: string;
  };
  reasoning?: {
    steps: string[];
  };
  createdAt: number;
}

// Session
interface Session {
  id: string;
  object: 'session';
  agentId: string;
  messageCount: number;
  totalCost: number;
  metadata?: Record<string, any>;
  createdAt: number;
  lastActivityAt: number;
}

// Skill
interface Skill {
  id: string;
  name: string;
  description: string;
  category: string;
  verified: boolean;
  version: string;
  permissions: string[];
}

// Model
interface Model {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  maxOutput: number;
  pricing: {
    input: number;
    output: number;
    currency: string;
    per: number;
  };
  capabilities: string[];
}
```

### Python Types

```python
from typing import List, Optional, Literal
from pydantic import BaseModel

class Agent(BaseModel):
    id: str
    object: Literal["agent"]
    name: str
    model: str
    system_prompt: str
    temperature: float
    max_tokens: int
    mode: Literal["focus", "creative", "research"]
    skills: List[str]
    budget: Optional[dict] = None
    metadata: Optional[dict] = None
    status: Literal["active", "paused", "archived"]
    created_at: int
    updated_at: int

class Message(BaseModel):
    id: str
    object: Literal["message"]
    agent_id: str
    session_id: str
    role: Literal["user", "assistant"]
    content: str
    model: str
    usage: dict
    cost: dict
    reasoning: Optional[dict] = None
    created_at: int

# ... (similar for Session, Skill, Model)
```

---

## Summary

The Agentik OS SDKs provide:

- ✅ **Full API coverage** - All endpoints supported
- ✅ **Type-safe** - TypeScript definitions, Python type hints
- ✅ **Streaming** - Real-time AI responses
- ✅ **Error handling** - Structured error types
- ✅ **Pagination** - Auto-paginate helpers
- ✅ **Webhooks** - Signature verification
- ✅ **Async support** - Both sync and async in Python
- ✅ **Production-ready** - Timeouts, retries, logging

**Next Steps:**

1. Install the SDK: `npm install @agentik/sdk` or `pip install agentik`
2. Get an API key from your dashboard
3. Follow the [quickstart tutorial](../tutorials/first-api-integration.md)
4. Explore [code examples](../examples/)

**Resources:**

- 📦 NPM: [npmjs.com/package/@agentik/sdk](https://npmjs.com/package/@agentik/sdk)
- 🐍 PyPI: [pypi.org/project/agentik](https://pypi.org/project/agentik)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)
- 📧 Email: sdk-support@agentik-os.com

---

*Last updated: February 14, 2026*
*SDK Version: 1.0.0*
*Agentik OS SDK Team*
