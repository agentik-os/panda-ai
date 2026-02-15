# Runtime API Reference

> **Complete API reference for the Agentik OS Agent Runtime**

Programmatically create agents, send messages, manage sessions, and integrate Agentik OS into your applications.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication](#authentication)
3. [Base URL & Versioning](#base-url--versioning)
4. [Agents API](#agents-api)
5. [Messages API](#messages-api)
6. [Sessions API](#sessions-api)
7. [Skills API](#skills-api)
8. [Models API](#models-api)
9. [Webhooks](#webhooks)
10. [Rate Limits](#rate-limits)
11. [Error Handling](#error-handling)
12. [Code Examples](#code-examples)

---

## Introduction

The Agentik OS Runtime API allows you to:

- **Create and configure agents** programmatically
- **Send messages** and receive AI responses
- **Manage sessions** and conversation history
- **Install skills** and extend agent capabilities
- **Stream responses** for real-time UX
- **Track costs** per request

### API Design Principles

- **REST-ful** - Standard HTTP methods (GET, POST, PUT, DELETE)
- **JSON** - Request and response bodies use JSON
- **Typed** - Full TypeScript definitions available
- **Paginated** - Large result sets use cursor-based pagination
- **Versioned** - API version in URL (`/v1/`)

---

## Authentication

All API requests require an API key in the `Authorization` header:

```http
Authorization: Bearer agk_live_xxxxx
```

### Getting an API Key

**Via Dashboard:**
1. Go to Settings → API Keys
2. Click "Create API Key"
3. Copy the key (shown only once)

**Via CLI:**
```bash
panda api-keys create --name "Production API"
# agk_live_abc123def456...
```

### API Key Types

| Type | Prefix | Permissions |
|------|--------|-------------|
| **Live** | `agk_live_` | Full access (production use) |
| **Test** | `agk_test_` | Sandbox mode (no real AI calls) |
| **Restricted** | `agk_restricted_` | Read-only access |

### Key Rotation

```bash
# Rotate key
panda api-keys rotate agk_live_abc123

# New key generated:
# agk_live_def456ghi789
```

---

## Base URL & Versioning

**Base URL:**
```
https://api.agentik-os.com/v1
```

**Current Version:** `v1`

**Version Header** (optional):
```http
Agentik-Version: 2026-02-14
```

---

## Agents API

### Create Agent

**POST** `/v1/agents`

Create a new AI agent.

**Request:**

```http
POST /v1/agents
Authorization: Bearer agk_live_xxxxx
Content-Type: application/json

{
  "name": "Customer Support Bot",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are a helpful customer support agent...",
  "temperature": 0.7,
  "maxTokens": 4096,
  "mode": "focus",
  "skills": ["web-search", "file-ops"],
  "budget": {
    "maxCostPerMessage": 0.10
  },
  "metadata": {
    "department": "support",
    "team": "customer-success"
  }
}
```

**Response (201 Created):**

```json
{
  "id": "agent_abc123",
  "object": "agent",
  "name": "Customer Support Bot",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are a helpful customer support agent...",
  "temperature": 0.7,
  "maxTokens": 4096,
  "mode": "focus",
  "skills": ["web-search", "file-ops"],
  "budget": {
    "maxCostPerMessage": 0.10
  },
  "metadata": {
    "department": "support",
    "team": "customer-success"
  },
  "status": "active",
  "createdAt": 1707926400,
  "updatedAt": 1707926400
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `name` | string | Yes | Agent display name (1-100 chars) |
| `model` | string | Yes | AI model ID (see [Models API](#models-api)) |
| `systemPrompt` | string | Yes | System instructions (max 10,000 chars) |
| `temperature` | number | No | 0.0-1.0 (default: 0.7) |
| `maxTokens` | number | No | 1-4096 (default: 4096) |
| `mode` | string | No | "focus" \| "creative" \| "research" |
| `skills` | string[] | No | Array of skill IDs |
| `budget` | object | No | Cost controls |
| `metadata` | object | No | Custom key-value pairs |

---

### Get Agent

**GET** `/v1/agents/:id`

Retrieve an agent by ID.

**Request:**

```http
GET /v1/agents/agent_abc123
Authorization: Bearer agk_live_xxxxx
```

**Response (200 OK):**

```json
{
  "id": "agent_abc123",
  "object": "agent",
  "name": "Customer Support Bot",
  "model": "claude-sonnet-4-5",
  "systemPrompt": "You are a helpful customer support agent...",
  "status": "active",
  "createdAt": 1707926400,
  "updatedAt": 1707926400
}
```

---

### List Agents

**GET** `/v1/agents`

List all agents.

**Request:**

```http
GET /v1/agents?limit=20&cursor=abc123
Authorization: Bearer agk_live_xxxxx
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | number | Results per page (1-100, default: 20) |
| `cursor` | string | Pagination cursor from previous response |
| `status` | string | Filter by status: "active" \| "paused" \| "archived" |

**Response (200 OK):**

```json
{
  "object": "list",
  "data": [
    {
      "id": "agent_abc123",
      "name": "Customer Support Bot",
      "model": "claude-sonnet-4-5",
      "status": "active"
    },
    {
      "id": "agent_def456",
      "name": "Code Reviewer",
      "model": "claude-opus-4-6",
      "status": "active"
    }
  ],
  "hasMore": true,
  "nextCursor": "def456"
}
```

---

### Update Agent

**PATCH** `/v1/agents/:id`

Update an agent's configuration.

**Request:**

```http
PATCH /v1/agents/agent_abc123
Authorization: Bearer agk_live_xxxxx
Content-Type: application/json

{
  "temperature": 0.8,
  "maxTokens": 2048,
  "systemPrompt": "Updated instructions..."
}
```

**Response (200 OK):**

```json
{
  "id": "agent_abc123",
  "temperature": 0.8,
  "maxTokens": 2048,
  "systemPrompt": "Updated instructions...",
  "updatedAt": 1707930000
}
```

---

### Delete Agent

**DELETE** `/v1/agents/:id`

Delete an agent (soft delete - recoverable for 30 days).

**Request:**

```http
DELETE /v1/agents/agent_abc123
Authorization: Bearer agk_live_xxxxx
```

**Response (204 No Content)**

---

## Messages API

### Send Message

**POST** `/v1/agents/:id/messages`

Send a message to an agent and get a response.

**Request:**

```http
POST /v1/agents/agent_abc123/messages
Authorization: Bearer agk_live_xxxxx
Content-Type: application/json

{
  "content": "What is the status of order #12345?",
  "sessionId": "session_xyz789",
  "stream": false
}
```

**Response (200 OK):**

```json
{
  "id": "msg_abc123",
  "object": "message",
  "agentId": "agent_abc123",
  "sessionId": "session_xyz789",
  "role": "assistant",
  "content": "Let me check order #12345 for you...",
  "model": "claude-sonnet-4-5",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 85,
    "totalTokens": 235
  },
  "cost": {
    "amount": 0.0235,
    "currency": "usd"
  },
  "reasoning": {
    "steps": [
      "User asking about order status",
      "Need to search order database",
      "Order #12345 found, shipped yesterday"
    ]
  },
  "createdAt": 1707926400
}
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `content` | string | Yes | User message text |
| `sessionId` | string | No | Session ID to continue conversation (auto-created if omitted) |
| `stream` | boolean | No | Stream response with SSE (default: false) |
| `tools` | string[] | No | Override agent's default skills |

---

### Stream Message (SSE)

**POST** `/v1/agents/:id/messages` with `stream: true`

**Request:**

```http
POST /v1/agents/agent_abc123/messages
Authorization: Bearer agk_live_xxxxx
Content-Type: application/json

{
  "content": "Write a poem about AI",
  "stream": true
}
```

**Response (Server-Sent Events):**

```
event: message_start
data: {"id":"msg_abc123","object":"message","agentId":"agent_abc123"}

event: content_block_start
data: {"index":0,"type":"text"}

event: content_block_delta
data: {"index":0,"delta":{"type":"text_delta","text":"In silicon"}}

event: content_block_delta
data: {"index":0,"delta":{"type":"text_delta","text":" minds"}}

event: content_block_stop
data: {"index":0}

event: message_delta
data: {"usage":{"promptTokens":20,"completionTokens":15,"totalTokens":35}}

event: message_stop
data: {}
```

**TypeScript Client:**

```typescript
const response = await fetch('https://api.agentik-os.com/v1/agents/agent_abc123/messages', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer agk_live_xxxxx',
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    content: 'Write a poem about AI',
    stream: true,
  }),
});

const reader = response.body!.getReader();
const decoder = new TextDecoder();

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const chunk = decoder.decode(value);
  const lines = chunk.split('\n\n');

  for (const line of lines) {
    if (line.startsWith('data: ')) {
      const data = JSON.parse(line.slice(6));
      console.log(data);
    }
  }
}
```

---

### Get Message

**GET** `/v1/messages/:id`

Retrieve a message by ID.

**Request:**

```http
GET /v1/messages/msg_abc123
Authorization: Bearer agk_live_xxxxx
```

**Response (200 OK):**

```json
{
  "id": "msg_abc123",
  "object": "message",
  "agentId": "agent_abc123",
  "sessionId": "session_xyz789",
  "role": "assistant",
  "content": "Let me check order #12345...",
  "model": "claude-sonnet-4-5",
  "usage": {
    "promptTokens": 150,
    "completionTokens": 85,
    "totalTokens": 235
  },
  "cost": {
    "amount": 0.0235,
    "currency": "usd"
  },
  "createdAt": 1707926400
}
```

---

### List Messages

**GET** `/v1/sessions/:id/messages`

List messages in a session.

**Request:**

```http
GET /v1/sessions/session_xyz789/messages?limit=50
Authorization: Bearer agk_live_xxxxx
```

**Response (200 OK):**

```json
{
  "object": "list",
  "data": [
    {
      "id": "msg_001",
      "role": "user",
      "content": "Hello!",
      "createdAt": 1707926000
    },
    {
      "id": "msg_002",
      "role": "assistant",
      "content": "Hi! How can I help you?",
      "createdAt": 1707926010
    }
  ],
  "hasMore": false
}
```

---

## Sessions API

### Create Session

**POST** `/v1/sessions`

Create a new conversation session.

**Request:**

```http
POST /v1/sessions
Authorization: Bearer agk_live_xxxxx
Content-Type: application/json

{
  "agentId": "agent_abc123",
  "metadata": {
    "userId": "user_123",
    "source": "web-chat"
  }
}
```

**Response (201 Created):**

```json
{
  "id": "session_xyz789",
  "object": "session",
  "agentId": "agent_abc123",
  "metadata": {
    "userId": "user_123",
    "source": "web-chat"
  },
  "createdAt": 1707926400,
  "lastActivityAt": 1707926400
}
```

---

### Get Session

**GET** `/v1/sessions/:id`

Retrieve a session.

**Request:**

```http
GET /v1/sessions/session_xyz789
Authorization: Bearer agk_live_xxxxx
```

**Response (200 OK):**

```json
{
  "id": "session_xyz789",
  "object": "session",
  "agentId": "agent_abc123",
  "messageCount": 24,
  "totalCost": 0.45,
  "createdAt": 1707926400,
  "lastActivityAt": 1707930000
}
```

---

### Delete Session

**DELETE** `/v1/sessions/:id`

Delete a session and all its messages.

**Request:**

```http
DELETE /v1/sessions/session_xyz789
Authorization: Bearer agk_live_xxxxx
```

**Response (204 No Content)**

---

## Skills API

### List Skills

**GET** `/v1/skills`

List available skills in the marketplace.

**Request:**

```http
GET /v1/skills?category=productivity
Authorization: Bearer agk_live_xxxxx
```

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `category` | string | Filter by category |
| `verified` | boolean | Only verified skills |
| `search` | string | Search by name/description |

**Response (200 OK):**

```json
{
  "object": "list",
  "data": [
    {
      "id": "skill_web_search",
      "name": "Web Search",
      "description": "Search the web using Google",
      "category": "productivity",
      "verified": true,
      "version": "1.2.0",
      "permissions": ["network.http.get"]
    }
  ]
}
```

---

### Install Skill

**POST** `/v1/agents/:id/skills`

Install a skill on an agent.

**Request:**

```http
POST /v1/agents/agent_abc123/skills
Authorization: Bearer agk_live_xxxxx
Content-Type: application/json

{
  "skillId": "skill_web_search",
  "config": {
    "apiKey": "google_api_key_here"
  }
}
```

**Response (200 OK):**

```json
{
  "agentId": "agent_abc123",
  "skillId": "skill_web_search",
  "status": "installed",
  "installedAt": 1707926400
}
```

---

## Models API

### List Models

**GET** `/v1/models`

List available AI models.

**Request:**

```http
GET /v1/models
Authorization: Bearer agk_live_xxxxx
```

**Response (200 OK):**

```json
{
  "object": "list",
  "data": [
    {
      "id": "claude-opus-4-6",
      "name": "Claude Opus 4.6",
      "provider": "anthropic",
      "contextWindow": 200000,
      "maxOutput": 4096,
      "pricing": {
        "input": 15.00,
        "output": 75.00,
        "currency": "usd",
        "per": 1000000
      },
      "capabilities": ["vision", "tools", "streaming"]
    },
    {
      "id": "claude-sonnet-4-5",
      "name": "Claude Sonnet 4.5",
      "provider": "anthropic",
      "contextWindow": 200000,
      "maxOutput": 8192,
      "pricing": {
        "input": 3.00,
        "output": 15.00
      }
    }
  ]
}
```

---

## Webhooks

Subscribe to events from Agentik OS.

### Webhook Events

| Event | Description |
|-------|-------------|
| `agent.created` | New agent created |
| `agent.updated` | Agent configuration changed |
| `agent.deleted` | Agent deleted |
| `message.created` | New message sent/received |
| `session.created` | New session started |
| `session.completed` | Session ended |
| `cost.threshold_exceeded` | Cost budget threshold exceeded |

### Create Webhook

**POST** `/v1/webhooks`

**Request:**

```http
POST /v1/webhooks
Authorization: Bearer agk_live_xxxxx
Content-Type: application/json

{
  "url": "https://your-app.com/webhooks/agentik",
  "events": ["message.created", "cost.threshold_exceeded"],
  "secret": "whsec_abc123"
}
```

**Response (201 Created):**

```json
{
  "id": "webhook_xyz789",
  "url": "https://your-app.com/webhooks/agentik",
  "events": ["message.created", "cost.threshold_exceeded"],
  "status": "active",
  "createdAt": 1707926400
}
```

### Webhook Payload

**POST** `https://your-app.com/webhooks/agentik`

```json
{
  "id": "evt_abc123",
  "object": "event",
  "type": "message.created",
  "data": {
    "id": "msg_abc123",
    "agentId": "agent_abc123",
    "content": "Hello!",
    "cost": 0.023
  },
  "createdAt": 1707926400
}
```

**Headers:**

```http
Agentik-Signature: t=1707926400,v1=abc123def456...
Content-Type: application/json
```

**Verify Signature:**

```typescript
import crypto from 'crypto';

function verifyWebhook(payload: string, signature: string, secret: string): boolean {
  const [timestamp, hash] = signature.split(',').map(s => s.split('=')[1]);

  const expectedHash = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  return hash === expectedHash;
}
```

---

## Rate Limits

| Plan | Requests/min | Burst |
|------|--------------|-------|
| **Free** | 10 | 20 |
| **Pro** | 100 | 200 |
| **Enterprise** | 1,000 | 2,000 |

**Rate Limit Headers:**

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1707926460
```

**429 Response:**

```json
{
  "error": {
    "type": "rate_limit_exceeded",
    "message": "Rate limit exceeded. Try again in 23 seconds.",
    "retryAfter": 23
  }
}
```

---

## Error Handling

### Error Response Format

```json
{
  "error": {
    "type": "invalid_request_error",
    "message": "Agent not found",
    "param": "agentId",
    "code": "agent_not_found"
  }
}
```

### Error Types

| Type | HTTP Status | Description |
|------|-------------|-------------|
| `invalid_request_error` | 400 | Invalid parameters |
| `authentication_error` | 401 | Missing or invalid API key |
| `permission_denied` | 403 | Insufficient permissions |
| `not_found_error` | 404 | Resource not found |
| `rate_limit_exceeded` | 429 | Too many requests |
| `server_error` | 500 | Internal server error |

### Error Codes

- `agent_not_found` - Agent ID does not exist
- `session_not_found` - Session ID does not exist
- `invalid_model` - Model ID not supported
- `quota_exceeded` - Tenant quota exceeded
- `insufficient_budget` - Cost budget exceeded

---

## Code Examples

### Node.js / TypeScript

```typescript
import Agentik from '@agentik/sdk';

const agentik = new Agentik({
  apiKey: process.env.AGENTIK_API_KEY!,
});

// Create agent
const agent = await agentik.agents.create({
  name: 'Support Bot',
  model: 'claude-sonnet-4-5',
  systemPrompt: 'You are a helpful support agent.',
});

// Send message
const response = await agentik.agents.messages.create(agent.id, {
  content: 'Hello!',
});

console.log(response.content);
// "Hi! How can I help you today?"

// Stream response
const stream = await agentik.agents.messages.create(agent.id, {
  content: 'Write a poem',
  stream: true,
});

for await (const chunk of stream) {
  process.stdout.write(chunk.delta.text);
}
```

### Python

```python
from agentik import Agentik

agentik = Agentik(api_key=os.environ["AGENTIK_API_KEY"])

# Create agent
agent = agentik.agents.create(
    name="Support Bot",
    model="claude-sonnet-4-5",
    system_prompt="You are a helpful support agent."
)

# Send message
response = agentik.agents.messages.create(
    agent_id=agent.id,
    content="Hello!"
)

print(response.content)
# "Hi! How can I help you today?"

# Stream response
stream = agentik.agents.messages.create(
    agent_id=agent.id,
    content="Write a poem",
    stream=True
)

for chunk in stream:
    print(chunk.delta.text, end="")
```

### cURL

```bash
# Create agent
curl -X POST https://api.agentik-os.com/v1/agents \
  -H "Authorization: Bearer agk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Support Bot",
    "model": "claude-sonnet-4-5",
    "systemPrompt": "You are a helpful support agent."
  }'

# Send message
curl -X POST https://api.agentik-os.com/v1/agents/agent_abc123/messages \
  -H "Authorization: Bearer agk_live_xxxxx" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "Hello!"
  }'
```

---

## Summary

The Agentik OS Runtime API provides:

- ✅ **Full CRUD** for agents, messages, sessions
- ✅ **Streaming** support with Server-Sent Events
- ✅ **Webhooks** for real-time event notifications
- ✅ **Skills** installation and management
- ✅ **Cost tracking** per message/session
- ✅ **Type-safe** SDKs for TypeScript and Python

**Next Steps:**

1. Get an API key from your dashboard
2. Install the SDK: `npm install @agentik/sdk`
3. Follow the [quickstart tutorial](../tutorials/first-api-integration.md)
4. Read the [SDK documentation](./sdk.md)

**Need Help?**

- 📚 Full API spec: [api.agentik-os.com/openapi.json](https://api.agentik-os.com/openapi.json)
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)
- 📧 Email: api-support@agentik-os.com

---

*Last updated: February 14, 2026*
*API Version: v1*
*Agentik OS API Team*
