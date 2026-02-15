# Module 3: Best Practices & Production

## Learning Objectives

By the end of this module, you will be able to:
- Implement security best practices for skills and agents
- Configure monitoring, alerting, and cost tracking
- Deploy agents to production environments
- Use advanced features: OS modes and multi-AI consensus

## 3.1 Security

### WASM Sandboxing

Skills run in isolated WASM sandboxes (Extism):
- No direct filesystem access
- No network access unless permitted
- Memory limits enforced
- Execution time limits

### Permission Enforcement

```typescript
// Skills must declare ALL required permissions
class MySkill extends SkillBase {
  readonly permissions = [
    "network:http",      // Required for HTTP calls
    "fs:read:/data/*",   // Required for reading files
  ];
}
```

The runtime validates permissions before execution. Undeclared permissions are denied.

### Input Sanitization

Always validate and sanitize inputs:

```typescript
async execute(input: MyInput): Promise<MyOutput> {
  // Validate required fields
  if (!input.query?.trim()) {
    return { success: false, error: "Query is required" };
  }

  // Sanitize string inputs
  const sanitized = input.query.replace(/<[^>]*>/g, "");

  // Validate numeric ranges
  const limit = Math.min(Math.max(input.limit ?? 10, 1), 100);

  // Process with sanitized inputs
  return this.process(sanitized, limit);
}
```

### Authentication & RBAC

```typescript
// Role-Based Access Control
interface Role {
  name: string;
  permissions: string[];
  agentAccess: string[];  // Agent IDs this role can use
}
```

## 3.2 Performance

### Caching

```typescript
class CachedSkill extends SkillBase {
  private cache = new Map<string, { data: unknown; expires: number }>();

  async execute(input: MyInput): Promise<MyOutput> {
    const key = JSON.stringify(input);
    const cached = this.cache.get(key);

    if (cached && cached.expires > Date.now()) {
      return { success: true, data: cached.data };
    }

    const result = await this.fetchData(input);
    this.cache.set(key, { data: result, expires: Date.now() + 300_000 });
    return { success: true, data: result };
  }
}
```

### Batch Processing

For skills that handle multiple items, process in batches:

```typescript
async processBatch(items: string[]): Promise<unknown[]> {
  const batchSize = 10;
  const results: unknown[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(item => this.processItem(item))
    );
    results.push(...batchResults);
  }

  return results;
}
```

## 3.3 Monitoring

### Prometheus Metrics

Key metrics to track:
- `agent_execution_total` - Total executions by agent
- `agent_execution_duration_seconds` - Execution time histogram
- `agent_errors_total` - Error count by type
- `agent_cost_total` - Cost in USD by model
- `skill_execution_total` - Skill usage counts

### Sentry Error Tracking

```typescript
// Automatic error capture with context
this.log("error", "API call failed", {
  skillId: this.id,
  input: sanitizedInput,
  error: err.message,
});
```

### Dashboard Monitoring

The built-in metrics dashboard shows:
- Real-time agent performance
- Error rates and trends
- Cost breakdown by model
- Skill usage analytics

## 3.4 Cost Management

### Budget Alerts

```typescript
// Configure per-agent cost limits
{
  costLimits: {
    daily: 10.00,       // $10/day
    monthly: 200.00,    // $200/month
    perConversation: 1.00, // $1 per conversation
    alertAt: 0.8,       // Alert at 80% usage
  }
}
```

### Cost Optimization Strategies

1. **Use cheaper models for simple tasks** - GPT-4 Mini for classification, Claude for generation
2. **Cache repeated queries** - Avoid redundant API calls
3. **Set conversation limits** - Max turns per conversation
4. **Monitor per-agent costs** - Identify expensive agents

## 3.5 Deployment

### Docker

```bash
panda deploy docker --prod
# Generates docker-compose.prod.yml
docker compose -f docker-compose.prod.yml up -d
```

### Kubernetes

```bash
panda deploy k8s --namespace agentik-os
# Generates k8s manifests
kubectl apply -f k8s/
```

### Multi-Tenancy

Workspaces provide isolation:
```bash
panda workspace create production
panda workspace create staging
panda workspace switch production
```

## 3.6 Advanced Features

### OS Modes

| Mode | Focus | Use Case |
|------|-------|----------|
| Focus | Deep work, minimal distractions | Coding, writing |
| Creative | Brainstorming, exploration | Ideation, design |
| Research | Thorough analysis, citations | Investigation |

### Multi-AI Consensus

Query multiple models and synthesize:
- **Quorum**: Majority agreement required
- **Deliberation**: Models discuss and refine
- **Debate**: Models argue positions, synthesize best answer

## Labs

### Lab 3.1: Configure RBAC

Set up roles for admin, developer, and viewer with appropriate permissions.

### Lab 3.2: Monitoring Dashboard

Configure Prometheus metrics and create a monitoring dashboard.

### Lab 3.3: Docker Deployment

Deploy an agent stack with Docker Compose including runtime, dashboard, and Convex.

### Lab 3.4: Cost Controls

Configure budget alerts and implement cost optimization for a multi-model agent.

## Quiz Questions (Sample)

1. What technology does Agentik OS use for skill sandboxing?
   - a) Docker containers
   - b) WASM (Extism) ✓
   - c) Virtual machines
   - d) chroot jails

2. At what percentage should budget alerts trigger by default?
   - a) 50%
   - b) 80% ✓
   - c) 90%
   - d) 100%
