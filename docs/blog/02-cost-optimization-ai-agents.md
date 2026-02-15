# How We Reduced AI Costs by 85% with Smart Model Routing

**Published:** February 14, 2026
**Author:** Engineering Team
**Reading Time:** 10 minutes

---

Last month, we were burning through $12,000/month on AI API costs. Today, we're spending $1,800/month for the **same workload**.

Here's exactly how we did it—and how you can too.

---

## The Problem: Not All Tasks Need Opus

When we launched our AI-powered code review tool, we made a classic mistake: we used **Claude Opus 4.6** for everything.

**Why?** It gave the best results. Opus is amazing—it catches subtle bugs, understands complex context, and writes brilliant code suggestions.

**The problem?** Opus costs **$15 per million input tokens**. For a code review service processing 500 PRs/day, that adds up fast.

### Our Monthly Costs (Before Optimization)

```
Cost Breakdown (December 2025):
├── Code reviews: $8,400 (560M tokens × $15/M)
├── Comment generation: $2,100 (140M tokens × $15/M)
├── Classification: $900 (60M tokens × $15/M)
└── Summarization: $600 (40M tokens × $15/M)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: $12,000/month
```

We were on track to spend **$144K/year** on AI costs alone.

---

## The Solution: Model Routing

Here's the key insight: **80% of our tasks were simple** enough for cheaper models.

### Task Complexity Breakdown

| Task | Complexity | Best Model | Cost |
|------|-----------|------------|------|
| **Security review** | High | Opus 4.6 | $15/1M |
| **Bug detection** | High | Opus 4.6 | $15/1M |
| **Architecture review** | High | Opus 4.6 | $15/1M |
| **Code style** | Medium | Sonnet 4.5 | $3/1M |
| **Comment generation** | Medium | Sonnet 4.5 | $3/1M |
| **Summarization** | Medium | Sonnet 4.5 | $3/1M |
| **Language detection** | Low | Haiku 4.5 | $0.25/1M |
| **Spam classification** | Low | Haiku 4.5 | $0.25/1M |

By routing tasks to the appropriate model, we could **save 80%+ on costs**.

---

## Implementation with Agentik OS

### Before: Single Model for Everything

```typescript
const agent = await agentik.agents.create({
  model: 'claude-opus-4-6',  // Expensive!
});

// $15/1M for simple classification
await agent.sendMessage({ content: 'Is this spam?' });

// $15/1M for complex code review
await agent.sendMessage({ content: codeReviewPrompt });
```

### After: Smart Model Routing

```typescript
import { ModelRouter } from '@agentik/sdk';

const router = new ModelRouter({
  rules: [
    {
      name: 'Security & Bugs',
      condition: (task) =>
        task.type === 'security' || task.type === 'bugs',
      model: 'claude-opus-4-6',
    },
    {
      name: 'Style & Comments',
      condition: (task) =>
        task.type === 'style' || task.type === 'comments',
      model: 'claude-sonnet-4-5',
    },
    {
      name: 'Classification',
      condition: (task) =>
        task.type === 'classification',
      model: 'claude-haiku-4-5',
    },
  ],
  fallback: 'claude-sonnet-4-5',
});

// Automatically routes to Haiku ($0.25/1M)
await router.execute({
  type: 'classification',
  content: 'Is this spam?',
});

// Automatically routes to Opus ($15/1M)
await router.execute({
  type: 'security',
  content: codeReviewPrompt,
});
```

---

## Results: 85% Cost Reduction

### New Monthly Costs (After Optimization)

```
Cost Breakdown (January 2026):
├── Security reviews (Opus):     $1,200 (80M tokens × $15/M)
├── Code style (Sonnet):         $360 (120M tokens × $3/M)
├── Comments (Sonnet):           $180 (60M tokens × $3/M)
├── Classification (Haiku):      $60 (240M tokens × $0.25/M)
└── Language detection (Haiku):  $15 (60M tokens × $0.25/M)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Total: $1,815/month (-85%)
```

**Annual savings: $122,220** 💰

**Quality impact:** None. We A/B tested outputs and saw **no statistically significant difference** in user satisfaction.

---

## 5 More Cost Optimization Strategies

### 1. Response Caching

Cache responses for repeated queries:

```typescript
import { createHash } from 'crypto';

const cache = new Map();

async function getCachedResponse(prompt, agent) {
  const key = createHash('sha256').update(prompt).digest('hex');

  // Check cache
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < 3600000) {
    return cached.response;  // 1-hour TTL
  }

  // Generate response
  const response = await agent.sendMessage({ content: prompt });

  // Cache for 1 hour
  cache.set(key, { response, timestamp: Date.now() });

  return response;
}
```

**Results:**
- Cache hit rate: 35%
- Additional savings: $600/month

### 2. Context Pruning

Don't send entire conversation history every time:

```typescript
// ❌ Bad: Sends 10K+ tokens per request
const response = await agent.sendMessage({
  content: userMessage,
  history: allPreviousMessages,  // 50+ messages!
});

// ✅ Good: Sliding window (last 10 messages)
const recentMessages = conversationHistory.slice(-10);

const response = await agent.sendMessage({
  content: userMessage,
  history: recentMessages,  // ~2K tokens
});

// ✅ Better: Summarize old context
const summary = await summarizeConversation(oldMessages);

const response = await agent.sendMessage({
  content: userMessage,
  context: summary,  // ~500 tokens
  history: recentMessages,
});
```

**Results:**
- Token usage: -70% per conversation
- Additional savings: $400/month

### 3. Prompt Engineering

Shorter prompts = lower costs:

```typescript
// ❌ Bad: Verbose prompt (847 tokens)
const prompt = `
You are an expert code reviewer with 15+ years of experience in
software engineering. You have deep knowledge of security best
practices, performance optimization, design patterns, and clean
code principles. Your job is to carefully analyze the following
code and provide detailed feedback on any issues you find,
including but not limited to security vulnerabilities, performance
bottlenecks, code smells, potential bugs, and suggestions for
improvement...
`;

// ✅ Good: Concise prompt (142 tokens)
const prompt = `
You are an expert code reviewer. Focus on:
- Security vulnerabilities
- Performance issues
- Code smells
- Potential bugs

Analyze this code and provide specific, actionable feedback.
`;
```

**Results:**
- Average prompt length: -60%
- Additional savings: $300/month

### 4. Batch Processing

Process multiple items together instead of one-at-a-time:

```typescript
// ❌ Bad: 100 separate API calls
for (const file of files) {
  await agent.sendMessage({
    content: `Review this file: ${file.content}`,
  });
}

// ✅ Good: Single API call with all files
const allFiles = files.map(f => f.content).join('\n---\n');

await agent.sendMessage({
  content: `Review these files:\n${allFiles}`,
});
```

**Benefits:**
- Shared context reduces redundancy
- Fewer API calls = lower latency overhead
- Better analysis across files

**Results:**
- API calls: -90%
- Additional savings: $200/month

### 5. Output Length Limits

Restrict max tokens to what you actually need:

```typescript
// ❌ Bad: No limit (can generate 8K+ tokens)
const response = await agent.sendMessage({
  content: 'Summarize this article',
});

// ✅ Good: Explicit limit
const response = await agent.sendMessage({
  content: 'Summarize this article in 3 bullet points',
  maxTokens: 500,  // Enforce limit
});
```

**Results:**
- Average output length: -50%
- Additional savings: $250/month

---

## Combined Results

### Total Monthly Savings

| Strategy | Savings |
|----------|---------|
| **Model routing** | $10,185 (base) |
| Response caching | $600 |
| Context pruning | $400 |
| Prompt engineering | $300 |
| Batch processing | $200 |
| Output limits | $250 |
| **Total Savings** | **$11,935** |

**New monthly cost: $1,065** (down from $12,000)

**Total reduction: 91%** 🎉

---

## How to Implement This in Your App

### Step 1: Analyze Your Current Usage

```typescript
import { agentik } from '@agentik/sdk';

const costs = await agentik.analytics.getCosts({
  groupBy: ['model', 'task'],
  period: 'last-30-days',
});

console.log(costs);
// {
//   'claude-opus-4-6': {
//     security: { cost: '$1,200', tokens: 80_000_000 },
//     classification: { cost: '$900', tokens: 60_000_000 },  // ← EXPENSIVE!
//   }
// }
```

**Look for:**
- High-cost, low-complexity tasks (classification, summarization)
- Repeated queries (caching opportunities)
- Large context windows (pruning opportunities)

### Step 2: Set Up Model Routing

```typescript
const router = new ModelRouter({
  rules: [
    {
      name: 'Complex Reasoning',
      condition: (task) => task.complexity === 'high',
      model: 'claude-opus-4-6',
    },
    {
      name: 'General Tasks',
      condition: (task) => task.complexity === 'medium',
      model: 'claude-sonnet-4-5',
    },
    {
      name: 'Simple Tasks',
      condition: (task) => task.complexity === 'low',
      model: 'claude-haiku-4-5',
    },
  ],
});
```

### Step 3: Implement Caching

```typescript
import { CacheManager } from '@agentik/sdk';

const cache = new CacheManager({
  backend: 'redis',  // or 'memory', 'memcached'
  ttl: 3600,  // 1 hour
});

async function getCachedResponse(prompt, agent) {
  const cached = await cache.get(prompt);
  if (cached) return cached;

  const response = await agent.sendMessage({ content: prompt });
  await cache.set(prompt, response);

  return response;
}
```

### Step 4: Monitor & Iterate

```typescript
// Set up cost alerts
await agentik.alerts.create({
  name: 'High Daily Cost',
  condition: 'daily_cost > 100',
  action: 'email',
  recipients: ['eng@company.com'],
});

// Track cost over time
const trend = await agentik.analytics.getCostTrend({
  period: 'last-30-days',
  interval: 'daily',
});
```

---

## Common Pitfalls to Avoid

### ❌ Pitfall 1: Over-Optimization

Don't route **everything** to Haiku just to save money. Use the right model for the task.

**Bad:**
```typescript
// Don't use Haiku for complex code review!
const reviewer = await agentik.agents.create({
  model: 'claude-haiku-4-5',  // Too cheap for this task
  systemPrompt: 'Review this code for security vulnerabilities...',
});
```

**Outcome:** Missed 60% of security bugs, cost us $50K in fixes.

### ❌ Pitfall 2: Aggressive Caching

Be careful with cache TTLs. Stale data can cause issues.

**Bad:**
```typescript
cache.set(prompt, response, { ttl: 86400 * 7 });  // 7 days!
```

**Better:**
```typescript
// Different TTLs for different content types
const ttls = {
  'static-faq': 86400 * 7,  // 7 days
  'product-info': 3600,  // 1 hour
  'real-time-data': 300,  // 5 minutes
};
```

### ❌ Pitfall 3: Ignoring Latency

Haiku is fast, Opus is slow. Factor this into routing:

| Model | P50 Latency | P95 Latency |
|-------|-------------|-------------|
| Haiku 4.5 | 800ms | 1.2s |
| Sonnet 4.5 | 1.5s | 2.3s |
| Opus 4.6 | 3.2s | 5.1s |

**For user-facing features:** Prefer Sonnet over Opus if latency matters.

---

## Tools to Help You Optimize

### Agentik OS Cost Dashboard

Built-in analytics show:
- ✅ Cost per agent, user, model
- ✅ Token usage trends
- ✅ Most expensive queries
- ✅ Optimization suggestions

```typescript
const insights = await agentik.analytics.getInsights();

console.log(insights.suggestions);
// [
//   {
//     type: 'model-routing',
//     message: 'Move classification tasks to Haiku',
//     potentialSavings: '$450/month'
//   },
//   {
//     type: 'caching',
//     message: 'Cache FAQ responses',
//     potentialSavings: '$200/month'
//   }
// ]
```

### CLI Command

```bash
panda costs analyze --period last-30-days

# Output:
# Cost Breakdown:
# ├── claude-opus-4-6:     $1,200 (10% of total)
# ├── claude-sonnet-4-5:   $540 (45% of total)
# └── claude-haiku-4-5:    $75 (6% of total)
#
# Optimization Opportunities:
# • Move 'classification' tasks to Haiku: -$450/month
# • Cache FAQ responses: -$200/month
# • Reduce context window for 'chat': -$150/month
#
# Total potential savings: $800/month
```

---

## Benchmark: Our Model Router Performance

We A/B tested quality across different routing strategies:

| Strategy | Quality Score | Cost | Latency |
|----------|--------------|------|---------|
| **All Opus** | 9.2/10 | $12,000/mo | 3.2s |
| **All Sonnet** | 8.8/10 | $2,400/mo | 1.5s |
| **Smart Routing** | 9.1/10 | $1,815/mo | 1.8s |

**Smart routing wins:**
- Quality: -1% (negligible)
- Cost: -85%
- Latency: -44%

---

## Conclusion

By implementing smart model routing and optimization strategies, we:
- **Reduced costs by 91%** ($12,000 → $1,065/month)
- **Maintained quality** (9.2 → 9.1 user satisfaction score)
- **Improved latency** (3.2s → 1.8s average response time)

**Key takeaways:**
1. Not all tasks need your most powerful model
2. Cache aggressively for repeated queries
3. Prune conversation context to essentials
4. Batch process when possible
5. Monitor and iterate continuously

**Try it yourself:**
```bash
npm install @agentik/sdk
```

Read our [Cost Optimization Guide](https://docs.agentik-os.com/guides/cost-management) for the complete implementation.

---

**Questions? We're here to help!**
- 💬 [Join our Discord](https://discord.gg/agentik-os)
- 📧 [Email us](mailto:eng@agentik-os.com)
- 📊 [Request a cost audit](https://agentik-os.com/cost-audit)

---

*Have you optimized AI costs in your app? Share your strategies in the comments! 👇*
