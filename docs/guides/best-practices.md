# Agentik OS Best Practices Guide

> **Production-ready patterns and recommendations for building with Agentik OS**

Learn battle-tested patterns, security best practices, performance optimization techniques, and architectural decisions for scaling Agentik OS to production.

---

## Table of Contents

1. [Agent Configuration](#agent-configuration)
2. [Skill Development](#skill-development)
3. [Cost Optimization](#cost-optimization)
4. [Security & Compliance](#security--compliance)
5. [Performance](#performance)
6. [Error Handling](#error-handling)
7. [Testing Strategy](#testing-strategy)
8. [Monitoring & Observability](#monitoring--observability)
9. [Scaling Patterns](#scaling-patterns)
10. [Multi-Tenancy](#multi-tenancy)
11. [Database Design](#database-design)
12. [API Design](#api-design)

---

## Agent Configuration

### System Prompts

**❌ Bad: Vague, generic prompts**

```typescript
const agent = await agentik.agents.create({
  systemPrompt: 'You are a helpful AI assistant.',
});
```

**✅ Good: Specific, contextual prompts**

```typescript
const agent = await agentik.agents.create({
  systemPrompt: `You are a specialized customer support agent for TechCo SaaS.

Role: First-line technical support specialist
Expertise: Product features, troubleshooting, account management
Limitations: Cannot access billing or legal information
Escalation: Route complex technical issues to engineers

Communication Style:
- Professional but friendly
- Use bullet points for multi-step instructions
- Always ask for error messages before debugging
- Provide links to relevant documentation

Context:
- Product: TechCo Analytics Platform
- Common Issues: API rate limits, webhook setup, data export
- Documentation: https://docs.techco.com`,
});
```

**Key principles:**

| Principle | Why | Example |
|-----------|-----|---------|
| **Specificity** | Reduces hallucination | "You are a Python developer" vs "helpful assistant" |
| **Constraints** | Prevents scope creep | "Only answer questions about Product X" |
| **Examples** | Improves consistency | Include 2-3 example responses |
| **Tone** | Maintains brand voice | "Professional", "Casual", "Technical" |
| **Escalation** | Handles edge cases | When to say "I don't know" |

### Temperature & Parameters

**Use case-based temperature:**

```typescript
// Code generation: Low temperature (deterministic)
const codeAgent = await agentik.agents.create({
  model: 'claude-sonnet-4-5',
  temperature: 0.3,
  mode: 'focus',
  maxTokens: 4096,
});

// Creative writing: High temperature (diverse outputs)
const creativeAgent = await agentik.agents.create({
  model: 'claude-opus-4-6',
  temperature: 0.9,
  mode: 'creative',
  maxTokens: 8192,
});

// Customer support: Balanced (helpful but consistent)
const supportAgent = await agentik.agents.create({
  model: 'claude-sonnet-4-5',
  temperature: 0.5,
  mode: 'balanced',
  maxTokens: 2048,
});
```

**Temperature guide:**

| Temperature | Use Case | Output Characteristics |
|------------|----------|----------------------|
| 0.0-0.3 | Code, data analysis, factual Q&A | Deterministic, focused, repeatable |
| 0.4-0.6 | Customer support, documentation | Balanced creativity and consistency |
| 0.7-0.9 | Marketing copy, creative writing | Diverse, creative, unpredictable |
| 1.0+ | Brainstorming, poetry | Highly random, experimental |

### Model Selection

**Choose the right model for the task:**

```typescript
// Complex reasoning: Opus
const architectAgent = await agentik.agents.create({
  model: 'claude-opus-4-6',  // $15/1M input, $75/1M output
  temperature: 0.4,
  maxTokens: 8192,
});

// Most tasks: Sonnet (best balance)
const generalAgent = await agentik.agents.create({
  model: 'claude-sonnet-4-5',  // $3/1M input, $15/1M output
  temperature: 0.5,
  maxTokens: 4096,
});

// Simple tasks: Haiku
const classificationAgent = await agentik.agents.create({
  model: 'claude-haiku-4-5',  // $0.25/1M input, $1.25/1M output
  temperature: 0.3,
  maxTokens: 1024,
});
```

**Model comparison:**

| Model | Best For | Speed | Cost | Context |
|-------|----------|-------|------|---------|
| **Opus 4.6** | Complex reasoning, architecture, research | Slow | 5x | 200K |
| **Sonnet 4.5** | General purpose, code, support | Medium | 1x | 200K |
| **Haiku 4.5** | Classification, routing, simple tasks | Fast | 0.2x | 200K |
| **GPT-4 Turbo** | Alternative for specific use cases | Medium | 0.7x | 128K |

---

## Skill Development

### Skill Structure

**✅ Good: Well-structured skill**

```typescript
// skills/web-search.ts
import { SkillBase, Permission } from '@agentik/sdk';

export class WebSearchSkill extends SkillBase {
  name = 'web-search';
  version = '1.0.0';
  description = 'Search the web using Google Custom Search API';

  permissions: Permission[] = [
    { type: 'network', domain: 'googleapis.com' },
  ];

  config = {
    apiKey: process.env.GOOGLE_SEARCH_API_KEY,
    searchEngineId: process.env.GOOGLE_SEARCH_ENGINE_ID,
  };

  async execute({ query, maxResults = 10 }) {
    // Input validation
    if (!query || typeof query !== 'string') {
      throw new Error('Query must be a non-empty string');
    }

    if (maxResults < 1 || maxResults > 100) {
      throw new Error('Max results must be between 1 and 100');
    }

    // Rate limiting
    await this.checkRateLimit(query);

    try {
      // Execute search
      const results = await this.searchGoogle(query, maxResults);

      // Return structured data
      return {
        success: true,
        query,
        results: results.map(r => ({
          title: r.title,
          url: r.link,
          snippet: r.snippet,
        })),
        metadata: {
          totalResults: results.totalResults,
          searchTime: results.searchTime,
        },
      };
    } catch (error) {
      // Error handling
      throw new SkillError({
        code: 'SEARCH_FAILED',
        message: 'Web search failed',
        cause: error,
        recoverable: true,
      });
    }
  }

  private async checkRateLimit(query: string) {
    // Implement rate limiting logic
  }

  private async searchGoogle(query: string, maxResults: number) {
    // Implement search logic
  }
}
```

**Key patterns:**

1. **Input Validation**: Validate all inputs before processing
2. **Error Handling**: Use custom error types with recovery hints
3. **Rate Limiting**: Prevent API quota exhaustion
4. **Structured Output**: Return consistent, typed responses
5. **Permissions**: Declare all required permissions upfront

### Security in Skills

**❌ Bad: Unsafe skill**

```typescript
// DON'T DO THIS
async execute({ url }) {
  // No validation - vulnerable to SSRF
  const response = await fetch(url);

  // Executes arbitrary code
  eval(response.body);

  // Exposes secrets
  return { apiKey: process.env.API_KEY };
}
```

**✅ Good: Secure skill**

```typescript
async execute({ url }) {
  // 1. Validate URL
  const parsed = new URL(url);
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('Only HTTP/HTTPS allowed');
  }

  // 2. Allowlist domains
  const allowedDomains = ['api.example.com', 'cdn.example.com'];
  if (!allowedDomains.includes(parsed.hostname)) {
    throw new Error(`Domain ${parsed.hostname} not allowed`);
  }

  // 3. Use timeout
  const controller = new AbortController();
  setTimeout(() => controller.abort(), 5000);

  // 4. Sanitize response
  const response = await fetch(url, { signal: controller.signal });
  const text = await response.text();

  // 5. Never expose secrets
  return {
    success: true,
    content: text.substring(0, 1000),  // Limit size
    // DO NOT include: process.env, credentials, etc.
  };
}
```

**Security checklist:**

- [ ] Input validation (type, format, range)
- [ ] URL validation (protocol, domain allowlist)
- [ ] Rate limiting (per user, per API)
- [ ] Timeout enforcement (prevent hangs)
- [ ] Output sanitization (remove sensitive data)
- [ ] Error messages (don't leak internals)
- [ ] Permissions (principle of least privilege)

---

## Cost Optimization

### Token Management

**❌ Bad: Wasteful token usage**

```typescript
// Sends entire conversation history every time
const response = await agent.sendMessage({
  content: userMessage,
  history: allPreviousMessages,  // Could be 10K+ tokens
});
```

**✅ Good: Optimized token usage**

```typescript
// Strategy 1: Sliding window (keep recent context)
const recentMessages = conversationHistory.slice(-10);

const response = await agent.sendMessage({
  content: userMessage,
  history: recentMessages,  // Only last 10 messages
});

// Strategy 2: Summarization (compress old context)
const summary = await summarizeConversation(oldMessages);

const response = await agent.sendMessage({
  content: userMessage,
  context: summary,  // Compressed context
  history: recentMessages,
});

// Strategy 3: Retrieval (only relevant context)
const relevantContext = await vectorSearch(userMessage, conversationHistory);

const response = await agent.sendMessage({
  content: userMessage,
  context: relevantContext,  // Only relevant parts
});
```

**Token optimization strategies:**

| Strategy | Savings | Trade-off | Best For |
|----------|---------|-----------|----------|
| **Sliding Window** | 50-70% | Loses old context | Chat, support |
| **Summarization** | 80-90% | Loses details | Long conversations |
| **Retrieval** | 90-95% | Requires setup | Knowledge base Q&A |
| **Pruning** | 30-50% | May remove important info | Technical docs |

### Caching

**Implement response caching:**

```typescript
import { createHash } from 'crypto';

const cache = new Map<string, { response: string; timestamp: number }>();

async function getCachedResponse(prompt: string, agent: Agent) {
  // Create cache key
  const key = createHash('sha256')
    .update(`${agent.id}:${prompt}`)
    .digest('hex');

  // Check cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return { ...cached.response, cached: true };
  }

  // Generate response
  const response = await agent.sendMessage({ content: prompt });

  // Cache for 1 hour
  cache.set(key, { response, timestamp: Date.now() });

  return { ...response, cached: false };
}
```

**What to cache:**

| Content Type | TTL | Cache Key |
|-------------|-----|-----------|
| **Static FAQ** | 24 hours | Question hash |
| **Product Info** | 1 hour | Product ID + version |
| **Code Generation** | 15 min | Code prompt + language |
| **Translations** | 7 days | Text + target language |
| **Summaries** | 1 hour | Content hash |

### Model Routing

**Route to cheaper models when possible:**

```typescript
async function routeToModel(task: Task) {
  // Simple classification → Haiku (cheap)
  if (task.type === 'classification') {
    return await agent.sendMessage({
      content: task.content,
      model: 'claude-haiku-4-5',  // $0.25/1M
    });
  }

  // Complex reasoning → Opus (expensive but accurate)
  if (task.complexity === 'high') {
    return await agent.sendMessage({
      content: task.content,
      model: 'claude-opus-4-6',  // $15/1M
    });
  }

  // Default → Sonnet (balanced)
  return await agent.sendMessage({
    content: task.content,
    model: 'claude-sonnet-4-5',  // $3/1M
  });
}
```

---

## Security & Compliance

### Secret Management

**❌ Bad: Hardcoded secrets**

```typescript
const apiKey = 'sk-ant-api-key-12345';  // NEVER do this
```

**✅ Good: Environment variables + secret management**

```typescript
import { SecretManager } from '@agentik/sdk';

const secrets = new SecretManager({
  provider: 'aws',  // or 'gcp', 'azure', 'vault'
});

const apiKey = await secrets.get('anthropic-api-key');
```

**Secret management checklist:**

- [ ] No secrets in code or version control
- [ ] Use environment variables (`process.env`)
- [ ] Rotate secrets regularly (30-90 days)
- [ ] Use secret management service (AWS Secrets Manager, etc.)
- [ ] Encrypt secrets at rest
- [ ] Limit secret access (principle of least privilege)
- [ ] Audit secret access (who accessed what, when)

### Data Privacy

**Implement PII detection:**

```typescript
import { PIIDetector } from '@agentik/sdk';

const detector = new PIIDetector();

async function sanitizeMessage(message: string) {
  // Detect PII
  const pii = await detector.detect(message);

  if (pii.found) {
    // Redact PII
    let sanitized = message;
    for (const entity of pii.entities) {
      sanitized = sanitized.replace(entity.value, `[${entity.type}]`);
    }

    return {
      message: sanitized,
      redacted: pii.entities.length,
    };
  }

  return { message, redacted: 0 };
}

// Usage
const { message, redacted } = await sanitizeMessage(userInput);
if (redacted > 0) {
  console.warn(`Redacted ${redacted} PII entities`);
}
```

**PII types to detect:**

- Email addresses
- Phone numbers
- Social Security Numbers
- Credit card numbers
- IP addresses
- Physical addresses
- Names (when sensitive)

### RBAC (Role-Based Access Control)

**Implement permission checks:**

```typescript
import { checkPermission } from '@agentik/sdk';

async function createAgent(userId: string, config: AgentConfig) {
  // Check if user has permission
  if (!await checkPermission(userId, 'agents:create')) {
    throw new Error('Insufficient permissions');
  }

  // Check quota
  const usage = await getUserUsage(userId);
  if (usage.agents >= usage.limits.agents) {
    throw new Error('Agent limit reached');
  }

  // Create agent
  const agent = await agentik.agents.create(config);

  // Log action
  await auditLog({
    userId,
    action: 'agents:create',
    agentId: agent.id,
    timestamp: Date.now(),
  });

  return agent;
}
```

---

## Performance

### Streaming Responses

**✅ Always use streaming for real-time UX:**

```typescript
async function streamResponse(agent: Agent, prompt: string) {
  const stream = await agent.sendMessage({
    content: prompt,
    stream: true,
  });

  let fullResponse = '';

  for await (const chunk of stream) {
    if (chunk.type === 'content_block_delta') {
      // Send chunk to client immediately
      sendToClient(chunk.delta.text);
      fullResponse += chunk.delta.text;
    }
  }

  return fullResponse;
}
```

**Benefits:**

- **Perceived performance**: User sees response immediately
- **Time to first token**: ~500ms vs ~5s for full response
- **Cancellation**: User can stop mid-generation
- **Progress indicator**: Show typing animation

### Parallel Execution

**❌ Bad: Sequential execution**

```typescript
// Takes 3+ seconds
const agent1 = await agentik.agents.create(config1);
const agent2 = await agentik.agents.create(config2);
const agent3 = await agentik.agents.create(config3);
```

**✅ Good: Parallel execution**

```typescript
// Takes ~1 second
const [agent1, agent2, agent3] = await Promise.all([
  agentik.agents.create(config1),
  agentik.agents.create(config2),
  agentik.agents.create(config3),
]);
```

### Database Queries

**❌ Bad: N+1 queries**

```typescript
const agents = await convex.query(api.agents.list);

for (const agent of agents) {
  // N additional queries!
  agent.messages = await convex.query(api.messages.list, {
    agentId: agent.id,
  });
}
```

**✅ Good: Single query with join**

```typescript
// Fetch everything in one query
const agentsWithMessages = await convex.query(api.agents.listWithMessages);
```

**Query optimization checklist:**

- [ ] Use indexes for frequent queries
- [ ] Batch queries when possible
- [ ] Implement pagination (don't fetch all data)
- [ ] Use `limit` and `offset` appropriately
- [ ] Cache frequently accessed data
- [ ] Use database views for complex joins

---

## Error Handling

### Retry Logic

**Implement exponential backoff:**

```typescript
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      // Don't retry on client errors (4xx)
      if (error.status >= 400 && error.status < 500) {
        throw error;
      }

      // Last attempt - throw error
      if (attempt === maxRetries - 1) {
        throw error;
      }

      // Calculate backoff: 1s, 2s, 4s, 8s...
      const delay = baseDelay * Math.pow(2, attempt);

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.3 * delay;

      await sleep(delay + jitter);
    }
  }
}

// Usage
const response = await retryWithBackoff(() =>
  agent.sendMessage({ content: prompt })
);
```

### Circuit Breaker

**Prevent cascading failures:**

```typescript
class CircuitBreaker {
  private failures = 0;
  private lastFailTime = 0;
  private state: 'closed' | 'open' | 'half-open' = 'closed';

  constructor(
    private threshold = 5,
    private timeout = 60000,  // 1 minute
    private resetTimeout = 30000  // 30 seconds
  ) {}

  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state === 'open') {
      if (Date.now() - this.lastFailTime > this.resetTimeout) {
        this.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }

    try {
      const result = await fn();

      if (this.state === 'half-open') {
        this.reset();
      }

      return result;
    } catch (error) {
      this.recordFailure();
      throw error;
    }
  }

  private recordFailure() {
    this.failures++;
    this.lastFailTime = Date.now();

    if (this.failures >= this.threshold) {
      this.state = 'open';
    }
  }

  private reset() {
    this.failures = 0;
    this.state = 'closed';
  }
}

// Usage
const breaker = new CircuitBreaker();

const response = await breaker.execute(() =>
  agent.sendMessage({ content: prompt })
);
```

---

## Testing Strategy

### Unit Tests

**Test individual skills:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { WebSearchSkill } from './web-search';

describe('WebSearchSkill', () => {
  let skill: WebSearchSkill;

  beforeEach(() => {
    skill = new WebSearchSkill({
      apiKey: 'test-key',
      searchEngineId: 'test-engine',
    });
  });

  it('should search and return results', async () => {
    const result = await skill.execute({
      query: 'test query',
      maxResults: 5,
    });

    expect(result.success).toBe(true);
    expect(result.results).toHaveLength(5);
    expect(result.results[0]).toHaveProperty('title');
    expect(result.results[0]).toHaveProperty('url');
  });

  it('should validate input', async () => {
    await expect(skill.execute({ query: '' }))
      .rejects
      .toThrow('Query must be a non-empty string');
  });

  it('should respect max results limit', async () => {
    await expect(skill.execute({ query: 'test', maxResults: 101 }))
      .rejects
      .toThrow('Max results must be between 1 and 100');
  });
});
```

### Integration Tests

**Test agent workflows:**

```typescript
import { describe, it, expect } from 'vitest';
import { Agentik } from '@agentik/sdk';

describe('Agent Workflows', () => {
  it('should create agent and send message', async () => {
    const agentik = new Agentik({ apiKey: process.env.TEST_API_KEY });

    const agent = await agentik.agents.create({
      name: 'Test Agent',
      model: 'claude-sonnet-4-5',
      systemPrompt: 'You are a test assistant.',
    });

    expect(agent.id).toBeDefined();

    const response = await agent.sendMessage({
      content: 'Hello, what is 2+2?',
    });

    expect(response.content).toContain('4');

    await agent.delete();
  });

  it('should use skills', async () => {
    const agent = await agentik.agents.create({
      name: 'Search Agent',
      skills: ['web-search'],
    });

    const response = await agent.sendMessage({
      content: 'Search for "Anthropic Claude"',
    });

    expect(response.skillCalls).toHaveLength(1);
    expect(response.skillCalls[0].name).toBe('web-search');

    await agent.delete();
  });
});
```

### E2E Tests

**Test complete user journeys:**

```typescript
import { test, expect } from '@playwright/test';

test('user can create agent and chat', async ({ page }) => {
  // Navigate to dashboard
  await page.goto('http://localhost:3000');

  // Login
  await page.click('text=Sign In');
  await page.fill('input[name=email]', 'test@example.com');
  await page.fill('input[name=password]', 'password');
  await page.click('button[type=submit]');

  // Create agent
  await page.click('text=Create Agent');
  await page.fill('input[name=name]', 'Test Agent');
  await page.selectOption('select[name=model]', 'claude-sonnet-4-5');
  await page.click('button:has-text("Create")');

  // Verify agent created
  await expect(page.locator('text=Test Agent')).toBeVisible();

  // Send message
  await page.click('text=Test Agent');
  await page.fill('textarea[placeholder="Type a message"]', 'Hello!');
  await page.keyboard.press('Enter');

  // Verify response
  await expect(page.locator('.message-bubble:has-text("Hello")')).toBeVisible();
});
```

---

## Monitoring & Observability

### Structured Logging

**✅ Use structured logs:**

```typescript
import { logger } from '@agentik/sdk';

// Good: Structured log
logger.info('Agent created', {
  agentId: agent.id,
  userId: user.id,
  model: agent.model,
  timestamp: Date.now(),
});

// Bad: String concatenation
console.log(`Agent ${agent.id} created by user ${user.id}`);
```

### Custom Metrics

**Track business metrics:**

```typescript
import { metrics } from '@agentik/sdk';

// Counter: Increment for each occurrence
metrics.increment('agents.created', 1, {
  model: agent.model,
  userId: user.id,
});

// Gauge: Current value
metrics.gauge('agents.active', activeAgentCount);

// Histogram: Distribution of values
metrics.histogram('message.responseTime', duration, {
  agentId: agent.id,
});

// Timer: Measure duration
const timer = metrics.startTimer();
await agent.sendMessage({ content: prompt });
timer.end('message.duration');
```

### Alerts

**Set up critical alerts:**

```typescript
// Alert on high error rate
if (errorRate > 0.05) {  // 5%
  await sendAlert({
    severity: 'critical',
    message: 'Error rate exceeded 5%',
    metrics: { errorRate, period: '5m' },
  });
}

// Alert on slow responses
if (p95ResponseTime > 5000) {  // 5 seconds
  await sendAlert({
    severity: 'warning',
    message: 'P95 response time > 5s',
    metrics: { p95: p95ResponseTime },
  });
}

// Alert on quota exhaustion
if (tokensRemaining < 0.1 * tokensLimit) {
  await sendAlert({
    severity: 'warning',
    message: 'Token quota 90% exhausted',
    metrics: { remaining: tokensRemaining },
  });
}
```

---

## Scaling Patterns

### Horizontal Scaling

**Design for stateless services:**

```typescript
// ❌ Bad: Stateful (doesn't scale)
let conversationHistory = [];

app.post('/message', async (req, res) => {
  conversationHistory.push(req.body.message);
  // ...
});

// ✅ Good: Stateless (scales horizontally)
app.post('/message', async (req, res) => {
  const { sessionId } = req.body;

  // Fetch from database (shared state)
  const history = await db.getHistory(sessionId);

  // Process message
  const response = await agent.sendMessage({
    content: req.body.message,
    history,
  });

  // Save to database
  await db.saveMessage(sessionId, response);

  res.json(response);
});
```

### Rate Limiting

**Implement rate limiting:**

```typescript
import { RateLimiter } from '@agentik/sdk';

const limiter = new RateLimiter({
  points: 100,  // 100 requests
  duration: 60,  // per 60 seconds
  blockDuration: 300,  // block for 5 minutes
});

app.use(async (req, res, next) => {
  const userId = req.user.id;

  try {
    await limiter.consume(userId);
    next();
  } catch (error) {
    res.status(429).json({
      error: 'Rate limit exceeded',
      retryAfter: error.msBeforeNext / 1000,
    });
  }
});
```

### Caching Strategy

**Implement multi-layer caching:**

```
Client → L1 Cache (Browser) → L2 Cache (CDN) → L3 Cache (Redis) → Database
```

```typescript
async function getAgent(agentId: string) {
  // L1: In-memory cache (fastest)
  const cached = memoryCache.get(agentId);
  if (cached) return cached;

  // L2: Redis cache
  const redisCached = await redis.get(`agent:${agentId}`);
  if (redisCached) {
    const agent = JSON.parse(redisCached);
    memoryCache.set(agentId, agent);
    return agent;
  }

  // L3: Database (slowest)
  const agent = await db.getAgent(agentId);

  // Populate caches
  await redis.setEx(`agent:${agentId}`, 3600, JSON.stringify(agent));
  memoryCache.set(agentId, agent);

  return agent;
}
```

---

## Multi-Tenancy

### Data Isolation

**Ensure tenant isolation:**

```typescript
// Add tenant filter to ALL queries
async function listAgents(tenantId: string) {
  return await db.query.agents.findMany({
    where: { tenantId },  // Always filter by tenant
  });
}

// Middleware to enforce tenant
app.use((req, res, next) => {
  const tenantId = req.headers['x-tenant-id'];

  if (!tenantId) {
    return res.status(400).json({ error: 'Tenant ID required' });
  }

  // Attach to request
  req.tenantId = tenantId;
  next();
});
```

### Resource Quotas

**Implement per-tenant quotas:**

```typescript
async function checkQuota(tenantId: string, resource: string) {
  const usage = await db.getUsage(tenantId);
  const limits = await db.getLimits(tenantId);

  if (usage[resource] >= limits[resource]) {
    throw new Error(`${resource} quota exceeded`);
  }
}

// Usage
await checkQuota(tenantId, 'agents');
const agent = await createAgent(config);
await incrementUsage(tenantId, 'agents');
```

---

## Database Design

### Schema Best Practices

**Use proper indexing:**

```typescript
// Convex schema example
export default defineSchema({
  agents: defineTable({
    name: v.string(),
    userId: v.string(),
    tenantId: v.string(),
    model: v.string(),
    createdAt: v.number(),
  })
    .index('by_user', ['userId'])
    .index('by_tenant', ['tenantId'])
    .index('by_created', ['createdAt']),
});
```

**Index guidelines:**

| Query Pattern | Index | Why |
|--------------|-------|-----|
| `where: { userId }` | `.index('by_user', ['userId'])` | Frequent lookups |
| `where: { tenantId }` | `.index('by_tenant', ['tenantId'])` | Multi-tenancy |
| `orderBy: { createdAt }` | `.index('by_created', ['createdAt'])` | Sorting |
| `where: { userId, status }` | `.index('by_user_status', ['userId', 'status'])` | Compound queries |

---

## API Design

### REST Best Practices

**Use proper HTTP methods:**

```typescript
// ✅ Good: RESTful design
app.get('/api/agents', listAgents);           // Read all
app.get('/api/agents/:id', getAgent);         // Read one
app.post('/api/agents', createAgent);         // Create
app.patch('/api/agents/:id', updateAgent);    // Update
app.delete('/api/agents/:id', deleteAgent);   // Delete

// ❌ Bad: Everything is POST
app.post('/api/agents/list', listAgents);
app.post('/api/agents/get', getAgent);
app.post('/api/agents/create', createAgent);
```

### Error Responses

**Return consistent error format:**

```typescript
interface ErrorResponse {
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
  };
}

// Example
res.status(400).json({
  error: {
    code: 'INVALID_INPUT',
    message: 'Model must be one of: opus, sonnet, haiku',
    details: { model: req.body.model },
    requestId: req.id,
  },
});
```

**HTTP status codes:**

| Code | Use Case | Example |
|------|----------|---------|
| 200 | Success | Agent retrieved |
| 201 | Created | Agent created |
| 400 | Invalid input | Missing required field |
| 401 | Unauthorized | Invalid API key |
| 403 | Forbidden | Insufficient permissions |
| 404 | Not found | Agent ID doesn't exist |
| 429 | Rate limited | Too many requests |
| 500 | Server error | Database connection failed |

---

## Summary Checklist

**Before going to production:**

- [ ] **Security**: Secrets in vault, input validation, RBAC
- [ ] **Performance**: Streaming enabled, caching implemented, parallel execution
- [ ] **Cost**: Token optimization, model routing, response caching
- [ ] **Monitoring**: Structured logging, metrics, alerts
- [ ] **Testing**: Unit tests >80%, integration tests, E2E tests
- [ ] **Scaling**: Stateless design, rate limiting, horizontal scaling
- [ ] **Database**: Indexes on query fields, pagination implemented
- [ ] **Error Handling**: Retry logic, circuit breaker, graceful degradation
- [ ] **Documentation**: API docs, runbooks, troubleshooting guides

---

**Questions?** Join our [Discord](https://discord.gg/agentik-os) or open an issue on [GitHub](https://github.com/agentik-os/agentik-os).

---

*Last updated: February 14, 2026 • Best Practices Guide v1.0*
