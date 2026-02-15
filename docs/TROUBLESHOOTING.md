# Agentik OS - Troubleshooting Guide

> **Common issues and their solutions**

This guide covers the most frequently encountered issues and how to resolve them.

---

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Agent Creation & Configuration](#agent-creation--configuration)
- [Message & Streaming Issues](#message--streaming-issues)
- [Skills & Marketplace](#skills--marketplace)
- [Performance & Costs](#performance--costs)
- [Deployment & Production](#deployment--production)
- [Integrations](#integrations)
- [Database & Convex](#database--convex)
- [Authentication & Security](#authentication--security)

---

## Installation & Setup

### Issue: `pnpm install` fails with dependency conflicts

**Symptoms:**
```
ERR_PNPM_PEER_DEP_ISSUES
```

**Solution:**
```bash
# Clean install
rm -rf node_modules pnpm-lock.yaml
pnpm install --no-frozen-lockfile

# If still failing, use --force
pnpm install --force
```

**Alternative:** Use Bun instead:
```bash
bun install
```

---

### Issue: TypeScript errors after installation

**Symptoms:**
```
TS2307: Cannot find module '@agentik/sdk'
```

**Solution:**
```bash
# Rebuild TypeScript declarations
pnpm build --filter=@agentik/sdk

# Or rebuild all packages
turbo build
```

---

### Issue: `Cannot find module 'convex'`

**Symptoms:**
```
Error: Cannot find package 'convex'
```

**Solution:**
```bash
# Install Convex CLI globally
npm install -g convex

# Then install local dependencies
pnpm install
```

---

## Agent Creation & Configuration

### Issue: Agent creation fails with "Invalid model"

**Symptoms:**
```
Error: Model 'gpt-5' is not available
```

**Solution:**

Valid models as of February 2026:
```typescript
// Claude models
'claude-opus-4-6'      // Most capable
'claude-sonnet-4-5'    // Balanced
'claude-haiku-4-5'     // Fast & cheap

// OpenAI models
'gpt-4o'               // GPT-4 Optimized
'gpt-5'                // GPT-5 (if you have access)
'o1-preview'           // Reasoning model

// Google models
'gemini-2.0-flash-exp' // Fast
'gemini-1.5-pro'       // Capable

// Local models (via Ollama)
'ollama/llama3.3'
'ollama/qwen2.5-coder'
```

**Check available models:**
```typescript
const models = await agentik.models.list();
console.log(models);
```

---

### Issue: Agent doesn't remember previous messages

**Symptoms:**
- Each message treated as new conversation
- No context from previous messages

**Solution:**

Ensure you're using the same session:
```typescript
// ❌ Wrong - creates new session each time
const agent1 = await agentik.agents.create({ name: 'My Agent' });
const msg1 = await agentik.agents.messages.create(agent1.id, { content: 'Hi' });

const agent2 = await agentik.agents.create({ name: 'My Agent' });
const msg2 = await agentik.agents.messages.create(agent2.id, { content: 'Remember me?' });

// ✅ Correct - reuse same agent
const agent = await agentik.agents.create({ name: 'My Agent' });
const msg1 = await agentik.agents.messages.create(agent.id, { content: 'Hi' });
const msg2 = await agentik.agents.messages.create(agent.id, { content: 'Remember me?' });
```

Or explicitly manage sessions:
```typescript
const session = await agentik.agents.sessions.create(agent.id, {
  name: 'User Chat',
});

// All messages in this session will have shared context
await agentik.agents.messages.create(agent.id, {
  content: 'Hi',
  sessionId: session.id,
});
```

---

### Issue: Temperature/maxTokens settings not applied

**Symptoms:**
- Agent behavior doesn't change with temperature
- Responses shorter than expected

**Solution:**

Some settings require agent recreation:
```typescript
// ❌ Updating existing agent may not work for all settings
await agentik.agents.update(agent.id, { temperature: 0.9 });

// ✅ Create new agent with desired settings
const creativeAgent = await agentik.agents.create({
  name: 'Creative Agent',
  model: 'claude-sonnet-4-5',
  temperature: 0.9,
  maxTokens: 8192,
});
```

---

## Message & Streaming Issues

### Issue: Streaming stuck or incomplete

**Symptoms:**
- Stream hangs indefinitely
- `for await` loop never completes

**Solution 1:** Add timeout
```typescript
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 60000); // 60s timeout

try {
  const stream = await agentik.agents.messages.create(agent.id, {
    content: 'Your message',
    stream: true,
    signal: controller.signal,
  });

  for await (const chunk of stream) {
    // Process chunks
  }
} finally {
  clearTimeout(timeout);
}
```

**Solution 2:** Check for network issues
```bash
# Test connectivity
curl https://api.agentik-os.com/health

# Check if Convex is reachable
curl $CONVEX_URL
```

---

### Issue: Messages return empty or null responses

**Symptoms:**
```json
{
  "content": "",
  "role": "assistant"
}
```

**Causes & Solutions:**

**1. Empty system prompt blocking output**
```typescript
// ❌ May cause issues
systemPrompt: ''

// ✅ Provide clear instructions
systemPrompt: 'You are a helpful assistant. Provide concise, accurate answers.'
```

**2. Content filtering triggered**
```typescript
// Check for content filter hits
const message = await agentik.agents.messages.create(agent.id, {
  content: 'Your message',
});

if (message.filtered) {
  console.log('Content filtered:', message.filterReason);
}
```

**3. Token limit reached**
```typescript
// Increase maxTokens
await agentik.agents.update(agent.id, {
  maxTokens: 8192, // Default is 2048
});
```

---

### Issue: Rate limit errors

**Symptoms:**
```
Error: Rate limit exceeded (429)
```

**Solution:**

Implement exponential backoff:
```typescript
async function sendWithRetry(agentId, content, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await agentik.agents.messages.create(agentId, { content });
    } catch (error) {
      if (error.status === 429 && i < maxRetries - 1) {
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      } else {
        throw error;
      }
    }
  }
}
```

Or upgrade your plan:
```bash
# Check current limits
panda config get plan

# Upgrade via dashboard
# Settings → Billing → Upgrade Plan
```

---

## Skills & Marketplace

### Issue: Skill not showing in marketplace

**Symptoms:**
- Uploaded skill doesn't appear
- Skill exists but can't be installed

**Solution:**

**1. Check skill validation**
```bash
panda skill validate ./dist/skill.js
```

**2. Verify required fields**
```typescript
export default class MySkill extends Skill {
  static id = 'skill_unique_id';        // Required, must be unique
  static name = 'My Skill';             // Required
  static description = 'What it does';  // Required
  static category = 'productivity';     // Required
  static version = '1.0.0';            // Required

  // ... skill implementation
}
```

**3. Check permissions**
```typescript
// Missing permissions can cause silent failures
static permissions = [
  'network.http.get',  // If making HTTP requests
  'filesystem.read',   // If reading files
];
```

---

### Issue: Skill execution fails

**Symptoms:**
```
Error: Permission denied: network.http.get
```

**Solution:**

**1. Request permission in skill**
```typescript
static permissions = ['network.http.get'];
```

**2. User must approve during installation**
```bash
panda skill install agent_123 skill_weather \
  --config '{"apiKey":"xxx"}' \
  --approve-permissions
```

---

### Issue: Skill config not persisting

**Symptoms:**
- Configuration lost after restart
- `this.getConfig()` returns undefined

**Solution:**

**1. Define config schema**
```typescript
static configSchema = {
  apiKey: {
    type: 'string',
    required: true,
    description: 'API key for service',
  },
  endpoint: {
    type: 'string',
    default: 'https://api.example.com',
  },
};
```

**2. Provide config during installation**
```bash
panda skill install agent_123 skill_id \
  --config '{"apiKey":"your-key","endpoint":"https://custom.com"}'
```

**3. Verify config was saved**
```bash
panda skill config agent_123 skill_id
```

---

## Performance & Costs

### Issue: Unexpectedly high costs

**Symptoms:**
- Bill higher than expected
- Rapid token consumption

**Diagnosis:**
```bash
# Check cost breakdown
panda cost breakdown --last-30d

# See per-agent costs
panda cost by-agent --last-7d

# Find expensive requests
panda cost top-requests --limit 10
```

**Solutions:**

**1. Use cheaper models**
```typescript
// ❌ Expensive
model: 'claude-opus-4-6'  // $15/M input, $75/M output

// ✅ Cheaper
model: 'claude-sonnet-4-5'  // $3/M input, $15/M output
model: 'claude-haiku-4-5'   // $0.25/M input, $1.25/M output
```

**2. Reduce maxTokens**
```typescript
maxTokens: 2048  // Instead of 8192
```

**3. Implement caching**
```typescript
import { cache } from '@agentik/sdk';

@cache({ ttl: 300 })  // Cache for 5 minutes
async myExpensiveTool(params) {
  // Expensive operation
}
```

**4. Set budget limits**
```typescript
await agentik.agents.update(agent.id, {
  budget: {
    maxCostPerMessage: 0.10,    // Max $0.10 per message
    maxCostPerDay: 5.00,        // Max $5 per day
    fallbackModel: 'claude-haiku-4-5',  // Switch if over budget
  },
});
```

---

### Issue: Slow response times

**Symptoms:**
- Messages taking >30 seconds
- Timeouts

**Solutions:**

**1. Use faster models**
```typescript
model: 'claude-haiku-4-5'      // Fastest
model: 'gemini-2.0-flash-exp'  // Fast
```

**2. Reduce context window**
```typescript
// Limit message history
const messages = await agentik.agents.messages.list(agent.id, {
  limit: 10,  // Only last 10 messages
});
```

**3. Use streaming**
```typescript
// User sees response immediately
const stream = await agentik.agents.messages.create(agent.id, {
  content: 'Your message',
  stream: true,
});
```

**4. Optimize skills**
```typescript
// ❌ Slow - synchronous operations
async mySkill(params) {
  const data1 = await fetch(url1);
  const data2 = await fetch(url2);
  const data3 = await fetch(url3);
  return [data1, data2, data3];
}

// ✅ Fast - parallel operations
async mySkill(params) {
  const [data1, data2, data3] = await Promise.all([
    fetch(url1),
    fetch(url2),
    fetch(url3),
  ]);
  return [data1, data2, data3];
}
```

---

## Deployment & Production

### Issue: Kubernetes pods crash looping

**Symptoms:**
```
CrashLoopBackOff
```

**Diagnosis:**
```bash
kubectl logs <pod-name> -n agentik --previous
kubectl describe pod <pod-name> -n agentik
```

**Common causes:**

**1. Missing environment variables**
```yaml
# Ensure all required secrets are set
env:
  - name: ANTHROPIC_API_KEY
    valueFrom:
      secretKeyRef:
        name: agentik-secrets
        key: ANTHROPIC_API_KEY
  - name: CONVEX_URL
    valueFrom:
      secretKeyRef:
        name: agentik-secrets
        key: CONVEX_URL
```

**2. Health check failing**
```yaml
# Increase initialDelaySeconds
livenessProbe:
  httpGet:
    path: /health
    port: 8080
  initialDelaySeconds: 30  # Was 10, increased
  periodSeconds: 30
```

**3. Insufficient resources**
```yaml
resources:
  requests:
    memory: "1Gi"    # Was 512Mi
    cpu: "1000m"     # Was 500m
  limits:
    memory: "4Gi"    # Was 2Gi
    cpu: "2000m"
```

---

### Issue: HPA not scaling

**Symptoms:**
- Pod count stuck at minimum
- High CPU but no scaling

**Diagnosis:**
```bash
kubectl get hpa -n agentik
kubectl describe hpa agentik-runtime-hpa -n agentik
```

**Solutions:**

**1. Install metrics server**
```bash
kubectl apply -f https://github.com/kubernetes-sigs/metrics-server/releases/latest/download/components.yaml
```

**2. Verify metrics available**
```bash
kubectl top pods -n agentik
kubectl top nodes
```

**3. Check HPA configuration**
```yaml
# Ensure targets are realistic
metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70  # Not 10 (too low) or 95 (too high)
```

---

## Integrations

### Issue: Telegram bot not responding

**Symptoms:**
- Bot doesn't reply to messages
- Commands don't work

**Solutions:**

**1. Check bot is running**
```bash
# If using webhook
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Should show your webhook URL
```

**2. Check webhook is accessible**
```bash
curl https://yourdomain.com/webhook
# Should return 200
```

**3. Check logs**
```bash
# View bot logs
tail -f bot.log

# Or if in production
kubectl logs deployment/telegram-bot -n agentik
```

**4. Test with polling (debugging)**
```typescript
// Temporarily switch from webhook to polling
// bot.launch({ webhook: { domain: '...' } });  // Comment out
bot.launch();  // Use polling for debugging
```

---

### Issue: Discord slash commands not showing

**Symptoms:**
- Commands registered but not visible
- "Application did not respond" error

**Solutions:**

**1. Re-register commands**
```bash
panda integration discord register-commands \
  --bot-token $DISCORD_BOT_TOKEN \
  --guild-id $GUILD_ID  # Optional: for testing in specific server
```

**2. Check bot permissions**
- Bot needs `applications.commands` scope
- Invite link: `https://discord.com/api/oauth2/authorize?client_id=YOUR_CLIENT_ID&scope=bot%20applications.commands`

**3. Respond within 3 seconds**
```typescript
interaction.deferReply();  // Defer if processing takes >3s

// Do long operation
const result = await longOperation();

interaction.editReply(result);  // Then respond
```

---

## Database & Convex

### Issue: "Table not found" errors

**Symptoms:**
```
Error: Table 'agents' does not exist
```

**Solution:**

**1. Push schema to Convex**
```bash
cd packages/runtime
npx convex dev  # For development

# Or for production
npx convex deploy
```

**2. Verify tables exist**
```bash
npx convex dashboard

# Or via CLI
npx convex run listTables
```

---

### Issue: Convex quota exceeded

**Symptoms:**
```
Error: Database quota exceeded
```

**Solutions:**

**1. Check current usage**
```bash
# Visit Convex dashboard
open https://dashboard.convex.dev
```

**2. Upgrade plan**
- Free: 1 GB storage, 1M function calls/month
- Pro: 10 GB storage, 10M calls/month
- Enterprise: Custom limits

**3. Optimize queries**
```typescript
// ❌ Inefficient - loads all data
const agents = await ctx.db.query('agents').collect();

// ✅ Efficient - uses index and limits
const agents = await ctx.db
  .query('agents')
  .withIndex('by_tenant', (q) => q.eq('tenantId', tenantId))
  .take(100);
```

---

## Authentication & Security

### Issue: "Invalid API key" errors

**Symptoms:**
```
Error: Invalid API key (401)
```

**Solutions:**

**1. Verify API key**
```bash
# Get API key from dashboard
panda config get api-key

# Test API key
curl -H "Authorization: Bearer YOUR_KEY" \
  https://api.agentik-os.com/v1/agents
```

**2. Check environment variable**
```bash
echo $AGENTIK_API_KEY
# Should print your key, not empty
```

**3. Regenerate if compromised**
```bash
panda api-keys create --name "Production Key"
panda api-keys revoke <old-key-id>
```

---

### Issue: Clerk authentication not working

**Symptoms:**
- Users can't sign in
- "Invalid token" errors

**Solutions:**

**1. Check Clerk keys**
```bash
# Verify keys in .env.local
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_...
CLERK_SECRET_KEY=sk_...
```

**2. Verify middleware setup**
```typescript
// middleware.ts
import { clerkMiddleware } from '@clerk/nextjs/server';

export default clerkMiddleware();

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)',
  ],
};
```

**3. Check CORS settings**
```typescript
// For API routes
export const config = {
  api: {
    bodyParser: true,
    externalResolver: true,
  },
};
```

---

## Still Having Issues?

If your issue isn't covered here:

1. **Search existing issues:** [github.com/agentik-os/agentik-os/issues](https://github.com/agentik-os/agentik-os/issues)
2. **Ask on Discord:** [discord.gg/agentik-os](https://discord.gg/agentik-os)
3. **Create a new issue:** Include:
   - Error message (full stack trace)
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment (OS, Node version, package versions)

---

*Last updated: February 14, 2026*
*Agentik OS Troubleshooting Team*
