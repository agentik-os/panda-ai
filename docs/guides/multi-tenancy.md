# Multi-Tenancy Setup Guide

> **Enterprise-grade multi-tenant deployments for Agentik OS**

Learn how to deploy Agentik OS for multiple organizations, teams, or customers with complete isolation, resource control, and cost attribution.

---

## Table of Contents

1. [Introduction](#introduction)
2. [Multi-Tenancy Architecture](#multi-tenancy-architecture)
3. [Tenant Isolation Models](#tenant-isolation-models)
4. [Setting Up Your First Tenant](#setting-up-your-first-tenant)
5. [Resource Allocation & Quotas](#resource-allocation--quotas)
6. [Billing & Cost Attribution](#billing--cost-attribution)
7. [Tenant Management Dashboard](#tenant-management-dashboard)
8. [Security & Compliance](#security--compliance)
9. [Scaling Strategies](#scaling-strategies)
10. [Migration & Onboarding](#migration--onboarding)
11. [Monitoring & Analytics](#monitoring--analytics)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

---

## Introduction

### What is Multi-Tenancy?

Multi-tenancy allows a single Agentik OS deployment to serve multiple independent organizations (tenants) with:

- **Complete isolation** - Each tenant's data and agents are isolated
- **Resource control** - Set quotas, limits, and budgets per tenant
- **Cost attribution** - Track and bill each tenant separately
- **Customization** - Per-tenant branding, configs, and features
- **Scalability** - Grow from 1 to 10,000+ tenants on one deployment

### When to Use Multi-Tenancy

| Scenario | Multi-Tenancy Benefits |
|----------|------------------------|
| **SaaS Platform** | Serve multiple customers from one deployment |
| **Enterprise Departments** | Isolate different business units |
| **Agency** | Manage multiple client accounts |
| **Reseller** | White-label Agentik OS for your customers |
| **Managed Service** | Offer AI agents as a managed service |

### Architecture Overview

```
┌─────────────────────────────────────────────────┐
│           Agentik OS Platform Layer             │
├─────────────────────────────────────────────────┤
│  Tenant A    │  Tenant B    │  Tenant C         │
│  ┌────────┐  │  ┌────────┐  │  ┌────────┐      │
│  │Agents  │  │  │Agents  │  │  │Agents  │      │
│  │Data    │  │  │Data    │  │  │Data    │      │
│  │Config  │  │  │Config  │  │  │Config  │      │
│  └────────┘  │  └────────┘  │  └────────┘      │
├──────────────┼──────────────┼─────────────────  │
│     Shared Infrastructure & Services            │
│  Runtime │ Dashboard │ Skills │ Storage          │
└─────────────────────────────────────────────────┘
```

---

## Multi-Tenancy Architecture

### Three-Layer Design

Agentik OS uses a **three-layer multi-tenancy architecture**:

#### 1. Platform Layer (Shared)
- Single runtime instance
- Shared dashboard infrastructure
- Common skills marketplace
- Centralized monitoring

#### 2. Tenant Layer (Isolated)
- Dedicated database schemas (Convex namespaces)
- Isolated authentication (Clerk organizations)
- Per-tenant configurations
- Separate event logs

#### 3. Resource Layer (Controlled)
- CPU/memory quotas per tenant
- Token budgets and rate limits
- Storage quotas
- Concurrent agent limits

### Data Isolation

```typescript
// Every query automatically scoped to tenant
const messages = await ctx.db
  .query("messages")
  .withIndex("by_tenant", (q) =>
    q.eq("tenantId", ctx.auth.tenantId)
  )
  .collect();

// Tenant ID injected by authentication middleware
// No tenant can access another tenant's data
```

---

## Tenant Isolation Models

Choose the right isolation model for your needs:

### 1. Shared Database (Default)

**Best for:** SaaS with many small tenants

```yaml
isolation:
  model: shared-database
  advantages:
    - Lowest cost per tenant
    - Easy to scale to 1000s of tenants
    - Simple backups
  disadvantages:
    - Higher noisy neighbor risk
    - Harder to customize per tenant
```

**Implementation:**
- All tenants in one Convex deployment
- Row-level tenant ID on every table
- Automatic query scoping via middleware

### 2. Isolated Database

**Best for:** Enterprise with large tenants

```yaml
isolation:
  model: isolated-database
  advantages:
    - Complete data isolation
    - Per-tenant performance control
    - Easier compliance (GDPR, HIPAA)
  disadvantages:
    - Higher cost per tenant
    - More complex to manage
```

**Implementation:**
- Separate Convex deployment per tenant
- Tenant-specific connection strings
- Independent backups and restores

### 3. Hybrid (Recommended for Most)

**Best for:** Mix of small and large tenants

```yaml
isolation:
  model: hybrid
  tiers:
    starter: shared-database   # 1-50 agents
    pro: shared-database       # 51-500 agents
    enterprise: isolated-database  # 500+ agents
```

**Implementation:**
- Small tenants share infrastructure
- Large tenants get dedicated resources
- Automatic migration between tiers

---

## Setting Up Your First Tenant

### Step 1: Enable Multi-Tenancy

**In your Convex schema:**

```typescript
// convex/schema.ts
import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // Tenant registry
  tenants: defineTable({
    name: v.string(),
    slug: v.string(), // URL-safe identifier
    plan: v.string(), // "starter" | "pro" | "enterprise"
    status: v.string(), // "active" | "suspended" | "trial"

    // Quotas
    maxAgents: v.number(),
    maxMonthlyTokens: v.number(),
    maxStorageGB: v.number(),

    // Billing
    monthlyBudget: v.optional(v.number()),
    billingEmail: v.string(),

    // Metadata
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_status", ["status"]),

  // All other tables add tenantId
  agents: defineTable({
    tenantId: v.id("tenants"), // Foreign key
    name: v.string(),
    model: v.string(),
    // ... other fields
  })
    .index("by_tenant", ["tenantId"])
    .index("by_tenant_and_status", ["tenantId", "status"]),

  messages: defineTable({
    tenantId: v.id("tenants"),
    agentId: v.id("agents"),
    content: v.string(),
    // ... other fields
  })
    .index("by_tenant", ["tenantId"])
    .index("by_agent", ["agentId"]),
});
```

### Step 2: Create Tenant Middleware

```typescript
// convex/lib/tenantMiddleware.ts
import { QueryCtx, MutationCtx } from "./_generated/server";

export async function getTenantId(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Not authenticated");
  }

  // Clerk stores tenant ID in organization metadata
  const tenantId = identity.orgId;
  if (!tenantId) {
    throw new Error("No tenant associated with user");
  }

  // Verify tenant is active
  const tenant = await ctx.db.get(tenantId);
  if (!tenant || tenant.status !== "active") {
    throw new Error("Tenant is not active");
  }

  return tenantId;
}

// Use in all queries/mutations
export async function withTenant<T>(
  ctx: QueryCtx | MutationCtx,
  fn: (tenantId: string) => Promise<T>
): Promise<T> {
  const tenantId = await getTenantId(ctx);
  return fn(tenantId);
}
```

### Step 3: Create Your First Tenant

```bash
# Via CLI
panda tenant create \
  --name "Acme Corporation" \
  --slug "acme-corp" \
  --plan "pro" \
  --max-agents 100 \
  --monthly-budget 1000 \
  --billing-email "billing@acme.com"

# Response:
# ✅ Tenant created successfully!
#
# Tenant ID: ten_abc123def456
# Name: Acme Corporation
# Slug: acme-corp
# Dashboard: https://your-domain.com/t/acme-corp
# Status: Active (Trial - 14 days remaining)
```

**Via Dashboard API:**

```typescript
const tenant = await createTenant({
  name: "Acme Corporation",
  slug: "acme-corp",
  plan: "pro",
  quotas: {
    maxAgents: 100,
    maxMonthlyTokens: 10_000_000,
    maxStorageGB: 50,
  },
  billing: {
    monthlyBudget: 1000,
    email: "billing@acme.com",
  },
});
```

### Step 4: Invite Users to Tenant

```bash
# Invite user to tenant
panda tenant invite \
  --tenant acme-corp \
  --email "user@acme.com" \
  --role "admin"

# Roles: owner, admin, member, viewer
```

---

## Resource Allocation & Quotas

### Setting Quotas

Each tenant can have quotas for:

| Resource | Default | Starter | Pro | Enterprise |
|----------|---------|---------|-----|------------|
| **Agents** | 5 | 10 | 100 | Unlimited |
| **Monthly Tokens** | 1M | 5M | 50M | Custom |
| **Storage** | 1 GB | 10 GB | 100 GB | Custom |
| **Concurrent Sessions** | 5 | 25 | 100 | Custom |
| **API Calls/min** | 100 | 500 | 5000 | Custom |

**Configure via CLI:**

```bash
panda tenant update acme-corp \
  --max-agents 200 \
  --max-monthly-tokens 100000000 \
  --max-storage-gb 500 \
  --max-concurrent-sessions 250
```

**Configure via API:**

```typescript
await updateTenantQuotas({
  tenantId: "ten_abc123",
  quotas: {
    maxAgents: 200,
    maxMonthlyTokens: 100_000_000,
    maxStorageGB: 500,
    maxConcurrentSessions: 250,
    maxApiCallsPerMinute: 10_000,
  },
});
```

### Quota Enforcement

Quotas are enforced at runtime:

```typescript
// When creating an agent
export const createAgent = mutation({
  handler: async (ctx, args) => {
    const tenantId = await getTenantId(ctx);

    // Check quota
    const tenant = await ctx.db.get(tenantId);
    const agentCount = await ctx.db
      .query("agents")
      .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
      .collect()
      .then((agents) => agents.length);

    if (agentCount >= tenant.maxAgents) {
      throw new Error(
        `Agent quota exceeded. Current: ${agentCount}, Max: ${tenant.maxAgents}. Upgrade your plan.`
      );
    }

    // Create agent
    return await ctx.db.insert("agents", {
      tenantId,
      ...args,
    });
  },
});
```

### Soft Limits vs Hard Limits

**Soft Limits** (warnings):
- 80% of monthly token budget → Email warning
- 90% of storage quota → Dashboard notification
- Approaching rate limits → Suggest upgrade

**Hard Limits** (enforcement):
- 100% of monthly tokens → Throttle to free models only
- 100% of storage → Reject new uploads
- API rate limit exceeded → Return 429 Too Many Requests

---

## Billing & Cost Attribution

### Real-Time Cost Tracking

Every AI model call is tracked per tenant:

```typescript
// Automatic cost tracking
const response = await callModel({
  model: "claude-opus-4-6",
  prompt: "...",
  tenantId: ctx.auth.tenantId, // Auto-tracked
});

// Cost X-Ray Vision per tenant
const monthlyCost = await getTenantMonthlyCost(tenantId);
// → $847.32
```

### Cost Attribution Dashboard

```
┌─────────────────────────────────────────┐
│  Tenant: Acme Corporation               │
│  Current Month: February 2026           │
├─────────────────────────────────────────┤
│  Total Cost: $847.32 / $1,000 (84%)    │
│  ████████░░ 84%                         │
│                                         │
│  Breakdown:                             │
│  • Claude Opus 4.6    $524.18  (62%)   │
│  • Claude Sonnet 4.5  $213.44  (25%)   │
│  • Claude Haiku 4.5    $89.12  (10%)   │
│  • GPT-4o              $20.58   (3%)   │
│                                         │
│  Top 5 Agents by Cost:                 │
│  1. Customer Support    $312.45        │
│  2. Code Reviewer       $189.23        │
│  3. Data Analyst        $156.78        │
│  4. Email Assistant      $98.65        │
│  5. Research Bot         $45.32        │
└─────────────────────────────────────────┘
```

### Billing Integration

**Stripe Integration:**

```typescript
// packages/dashboard/app/api/billing/webhook/route.ts
import Stripe from 'stripe';

export async function POST(request: Request) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
  const sig = request.headers.get('stripe-signature')!;
  const body = await request.text();

  const event = stripe.webhooks.constructEvent(
    body,
    sig,
    process.env.STRIPE_WEBHOOK_SECRET!
  );

  if (event.type === 'invoice.created') {
    // Get tenant's actual usage
    const tenantId = event.data.object.customer_metadata.tenantId;
    const usage = await getTenantMonthlyUsage(tenantId);

    // Add metered billing line items
    await stripe.invoiceItems.create({
      customer: event.data.object.customer,
      invoice: event.data.object.id,
      amount: Math.round(usage.totalCost * 100), // Convert to cents
      currency: 'usd',
      description: `AI Token Usage - ${usage.totalTokens.toLocaleString()} tokens`,
    });
  }

  return new Response('OK');
}
```

**Usage-Based Pricing:**

```typescript
// Calculate tenant's monthly bill
export const calculateBill = query({
  handler: async (ctx, { tenantId }) => {
    const usage = await getTenantMonthlyUsage(ctx, tenantId);

    // Base plan fee
    const tenant = await ctx.db.get(tenantId);
    let total = PLAN_PRICES[tenant.plan]; // e.g., $49/mo

    // Add usage charges
    if (usage.totalTokens > FREE_TIER_TOKENS) {
      const overageTokens = usage.totalTokens - FREE_TIER_TOKENS;
      total += (overageTokens / 1_000_000) * 10; // $10 per 1M tokens
    }

    // Add storage overage
    if (usage.storageGB > tenant.maxStorageGB) {
      const overageGB = usage.storageGB - tenant.maxStorageGB;
      total += overageGB * 0.10; // $0.10/GB
    }

    return {
      baseFee: PLAN_PRICES[tenant.plan],
      tokenOverage: usage.totalTokens > FREE_TIER_TOKENS
        ? (usage.totalTokens - FREE_TIER_TOKENS) / 1_000_000 * 10
        : 0,
      storageOverage: usage.storageGB > tenant.maxStorageGB
        ? (usage.storageGB - tenant.maxStorageGB) * 0.10
        : 0,
      total,
    };
  },
});
```

### Cost Allocation by Department

For enterprise tenants with internal departments:

```typescript
// Tag agents with cost center
await createAgent({
  name: "Sales Assistant",
  tenantId: "ten_abc123",
  metadata: {
    department: "sales",
    costCenter: "CC-1001",
  },
});

// Generate cost report by department
const report = await getCostByDepartment(tenantId);
/*
{
  sales: { cost: $345.67, tokens: 12_345_678 },
  engineering: { cost: $234.56, tokens: 8_765_432 },
  support: { cost: $123.45, tokens: 4_567_890 },
}
*/
```

---

## Tenant Management Dashboard

### Admin Dashboard Overview

Platform admins see all tenants:

```
┌──────────────────────────────────────────────────────┐
│  🏢 All Tenants (127)                   [+ New]       │
├──────────────────────────────────────────────────────┤
│  Name              Plan    Agents  Cost/mo  Status   │
│  ──────────────────────────────────────────────────  │
│  Acme Corp         Pro        87   $847    Active    │
│  Beta Industries   Ent       324  $3,421   Active    │
│  Gamma Solutions   Starter    12   $123    Trial     │
│  Delta Inc         Pro        45   $456    Suspended │
│  ...                                                  │
├──────────────────────────────────────────────────────┤
│  Total Revenue: $87,432/mo                           │
│  Active: 115  |  Trial: 8  |  Suspended: 4          │
└──────────────────────────────────────────────────────┘
```

### Tenant Detail View

Click a tenant to see details:

```
┌──────────────────────────────────────────────────────┐
│  Acme Corporation                         [Settings]  │
├──────────────────────────────────────────────────────┤
│  📊 Overview                                          │
│  Plan: Pro ($49/mo)                                  │
│  Status: Active since Jan 15, 2026                   │
│  Billing: billing@acme.com                           │
│                                                       │
│  👥 Users: 23 (5 admins, 18 members)                │
│  🤖 Agents: 87 / 100 quota                          │
│  💰 Cost: $847.32 / $1,000 budget (84%)             │
│  🪙 Tokens: 28.5M / 50M quota (57%)                 │
│  💾 Storage: 47.3 GB / 100 GB (47%)                 │
│                                                       │
│  📈 Activity (Last 30 days)                          │
│  • 1,234,567 messages sent                           │
│  • 98.7% uptime                                      │
│  • Avg response time: 1.2s                           │
│                                                       │
│  🔧 Actions                                          │
│  [Suspend] [Delete] [Export Data] [View Logs]       │
└──────────────────────────────────────────────────────┘
```

### Tenant Self-Service Portal

Tenants can manage their own account:

```typescript
// packages/dashboard/app/(tenant)/settings/page.tsx
export default function TenantSettings() {
  const { tenant, usage } = useTenant();

  return (
    <div>
      <h1>Tenant Settings</h1>

      {/* Plan & Billing */}
      <Card>
        <CardHeader>Plan & Billing</CardHeader>
        <CardContent>
          <p>Current Plan: <strong>{tenant.plan}</strong></p>
          <p>Monthly Cost: ${usage.monthlyCost}</p>
          <Button onClick={upgradePlan}>Upgrade Plan</Button>
        </CardContent>
      </Card>

      {/* Quotas */}
      <Card>
        <CardHeader>Resource Quotas</CardHeader>
        <CardContent>
          <QuotaBar
            label="Agents"
            current={usage.agents}
            max={tenant.maxAgents}
          />
          <QuotaBar
            label="Tokens"
            current={usage.tokens}
            max={tenant.maxMonthlyTokens}
          />
          <QuotaBar
            label="Storage"
            current={usage.storageGB}
            max={tenant.maxStorageGB}
          />
        </CardContent>
      </Card>

      {/* Users */}
      <Card>
        <CardHeader>Team Members</CardHeader>
        <CardContent>
          <UsersList tenantId={tenant.id} />
          <Button onClick={inviteUser}>Invite User</Button>
        </CardContent>
      </Card>
    </div>
  );
}
```

---

## Security & Compliance

### Data Isolation Guarantees

**Database-Level Isolation:**

```typescript
// Every query enforces tenant isolation
ctx.db.query("messages")
  // This index REQUIRES tenantId
  .withIndex("by_tenant", (q) => q.eq("tenantId", ctx.auth.tenantId))
  .collect();

// Trying to query without tenantId = Compile error
// Trying to query another tenant's data = Runtime error
```

**Authentication-Level Isolation:**

```typescript
// Clerk organizations = Tenants
// Users can only see/access their organization's data
const { orgId } = auth();
if (!orgId) {
  return redirect("/select-organization");
}
```

**API-Level Isolation:**

```typescript
// All API routes enforce tenant context
export async function POST(request: Request) {
  const session = await auth();
  const tenantId = session.orgId;

  // All operations scoped to this tenant
  const result = await createAgent({
    tenantId, // Auto-injected
    ...data
  });
}
```

### Compliance Features

| Regulation | How Agentik OS Complies |
|------------|-------------------------|
| **GDPR** | Per-tenant data export, deletion, consent tracking |
| **HIPAA** | Encrypted storage, audit logs, BAA support |
| **SOC 2** | Access controls, monitoring, incident response |
| **CCPA** | Data portability, deletion rights |

**Data Export (GDPR Right to Data Portability):**

```bash
# Export all tenant data
panda tenant export acme-corp --format json --output ./acme-data.json

# Includes:
# - All agents
# - All messages
# - All configurations
# - All costs/usage data
```

**Data Deletion (GDPR Right to Erasure):**

```bash
# Soft delete (30-day retention)
panda tenant delete acme-corp

# Hard delete (immediate, irreversible)
panda tenant delete acme-corp --permanent --confirm
```

### Audit Logging

All admin actions are logged:

```typescript
// Audit log entry
{
  tenantId: "ten_abc123",
  userId: "user_xyz789",
  action: "quota.updated",
  changes: {
    maxAgents: { from: 100, to: 200 },
    maxMonthlyTokens: { from: 50_000_000, to: 100_000_000 },
  },
  timestamp: 1734567890,
  ip: "203.0.113.42",
}
```

---

## Scaling Strategies

### Horizontal Scaling

**Shared Database Model:**
- Single Convex deployment can handle 10,000+ tenants
- Automatic sharding by Convex
- No code changes needed

**Isolated Database Model:**
- Each large tenant gets dedicated Convex deployment
- Scales infinitely (1 tenant = 1 deployment)
- Requires tenant routing logic

### Tenant Sharding

For massive scale (100,000+ tenants):

```typescript
// Route tenant to specific shard
function getTenantShard(tenantId: string): string {
  const shardCount = 10;
  const hash = hashCode(tenantId);
  const shardIndex = hash % shardCount;
  return `shard-${shardIndex}`;
}

// Connect to appropriate shard
const shard = getTenantShard(tenantId);
const convex = new ConvexClient(SHARD_URLS[shard]);
```

### Auto-Scaling Triggers

```yaml
# Kubernetes HPA for dashboard
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: agentik-dashboard
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: agentik-dashboard
  minReplicas: 3
  maxReplicas: 100
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Pods
    pods:
      metric:
        name: active_tenants
      target:
        type: AverageValue
        averageValue: "500"
```

---

## Migration & Onboarding

### Tenant Onboarding Flow

**1. Self-Service Signup:**

```typescript
// packages/dashboard/app/signup/page.tsx
export default function SignupPage() {
  const [step, setStep] = useState(1);

  return (
    <div>
      {step === 1 && <CompanyInfo onNext={setStep} />}
      {step === 2 && <PlanSelection onNext={setStep} />}
      {step === 3 && <PaymentInfo onNext={setStep} />}
      {step === 4 && <Welcome />}
    </div>
  );
}

// Auto-creates tenant after payment
async function handlePaymentSuccess(customerId: string) {
  const tenant = await createTenant({
    name: formData.companyName,
    slug: slugify(formData.companyName),
    plan: formData.selectedPlan,
    billingEmail: formData.email,
    stripeCustomerId: customerId,
  });

  // Send welcome email with setup guide
  await sendWelcomeEmail(tenant);
}
```

**2. Guided Setup Wizard:**

```
┌────────────────────────────────────────┐
│  Welcome to Agentik OS! 🎉             │
│  Let's set up your first agent.        │
├────────────────────────────────────────┤
│  Step 1/5: Create Your First Agent     │
│                                        │
│  Agent Name: [Customer Support Bot  ]  │
│  Purpose: [Answer customer questions]  │
│                                        │
│  [Skip] [Next →]                       │
└────────────────────────────────────────┘
```

**3. Sample Data & Templates:**

```bash
# Provision tenant with sample data
panda tenant provision acme-corp \
  --template "customer-support" \
  --include-sample-data

# Creates:
# - 3 pre-configured agents
# - 50 sample conversations
# - Skills marketplace integration
# - Dashboard widgets
```

### Migrating Existing Agents

**From Single-Tenant to Multi-Tenant:**

```bash
# Export existing agents
panda export --output ./agents-backup.json

# Create tenant
panda tenant create --name "My Company" --slug "my-company"

# Import agents into tenant
panda import ./agents-backup.json --tenant my-company
```

**Bulk Import from CSV:**

```bash
# CSV format: name,email,role
# john@acme.com,John Doe,admin
# jane@acme.com,Jane Smith,member

panda tenant import-users acme-corp --csv ./users.csv
```

---

## Monitoring & Analytics

### Platform-Wide Metrics

```
┌──────────────────────────────────────────────────────┐
│  📊 Platform Health Dashboard                        │
├──────────────────────────────────────────────────────┤
│  Total Tenants: 127                                  │
│  Active Agents: 8,432                                │
│  Messages Today: 1,234,567                           │
│  Total Revenue: $87,432/mo                           │
│                                                       │
│  🔥 Top Tenants by Usage:                           │
│  1. Beta Industries    $3,421/mo   324 agents       │
│  2. Acme Corp          $847/mo      87 agents       │
│  3. Gamma Solutions    $734/mo      65 agents       │
│                                                       │
│  ⚠️ Alerts:                                          │
│  • 4 tenants approaching quota limits                │
│  • 2 tenants with suspended payment                  │
│  • 1 tenant requesting enterprise upgrade            │
└──────────────────────────────────────────────────────┘
```

### Per-Tenant Analytics

```typescript
// Get tenant analytics
const analytics = await getTenantAnalytics({
  tenantId: "ten_abc123",
  period: "last-30-days",
});

/*
{
  messages: {
    total: 1_234_567,
    byDay: [...],
    avgPerDay: 41_152,
  },
  agents: {
    total: 87,
    active: 76,
    mostUsed: [
      { id: "agent_1", name: "Customer Support", messages: 456_789 },
      { id: "agent_2", name: "Code Reviewer", messages: 234_567 },
    ],
  },
  costs: {
    total: 847.32,
    byModel: {
      "claude-opus-4-6": 524.18,
      "claude-sonnet-4-5": 213.44,
    },
    trend: "+12% vs last month",
  },
  performance: {
    avgResponseTime: 1.2,
    p95ResponseTime: 3.4,
    uptime: 98.7,
  },
}
*/
```

### Alerting Rules

```yaml
# Alert configurations
alerts:
  - name: quota-exceeded
    condition: usage > quota * 0.95
    action: email-admin

  - name: payment-failed
    condition: stripe.payment.failed
    action: suspend-tenant

  - name: high-error-rate
    condition: error_rate > 5%
    action: page-oncall
```

---

## Best Practices

### 1. Start with Shared, Migrate to Isolated

```
Phase 1 (0-100 tenants):
  → Shared database
  → Lowest cost
  → Easy to manage

Phase 2 (100-1000 tenants):
  → Hybrid model
  → Small tenants share
  → Large tenants isolated

Phase 3 (1000+ tenants):
  → Auto-sharding
  → Dedicated resources for enterprise
  → Multi-region deployment
```

### 2. Set Conservative Quotas Initially

```typescript
// Default quotas for new tenants
const DEFAULT_QUOTAS = {
  starter: {
    maxAgents: 10,
    maxMonthlyTokens: 5_000_000,
    maxStorageGB: 10,
  },
  pro: {
    maxAgents: 100,
    maxMonthlyTokens: 50_000_000,
    maxStorageGB: 100,
  },
  enterprise: {
    maxAgents: Infinity,
    maxMonthlyTokens: Infinity,
    maxStorageGB: Infinity,
  },
};

// Easier to increase than decrease
```

### 3. Implement Soft Deletes

```typescript
// Don't hard-delete tenant data immediately
export const deleteTenant = mutation({
  handler: async (ctx, { tenantId }) => {
    await ctx.db.patch(tenantId, {
      status: "deleted",
      deletedAt: Date.now(),
      scheduledHardDeleteAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
    });

    // Suspend access but keep data for 30 days
  },
});

// Cron job to hard-delete after retention period
```

### 4. Monitor Tenant Health Proactively

```typescript
// Daily health check job
async function checkTenantHealth() {
  const tenants = await getAllActiveTenants();

  for (const tenant of tenants) {
    const usage = await getTenantUsage(tenant.id);

    // Approaching quota
    if (usage.tokens > tenant.maxMonthlyTokens * 0.9) {
      await sendQuotaWarningEmail(tenant);
    }

    // Unusual spike in usage
    if (usage.todayTokens > usage.avgDailyTokens * 3) {
      await alertAdmins({
        type: "unusual-usage",
        tenant: tenant.name,
        details: usage,
      });
    }

    // No activity for 30 days
    if (usage.daysSinceLastMessage > 30) {
      await sendReengagementEmail(tenant);
    }
  }
}
```

### 5. Provide Self-Service Upgrade Path

```typescript
// Easy upgrade flow
export default function UpgradePlanPage() {
  const { tenant } = useTenant();
  const [selectedPlan, setSelectedPlan] = useState(tenant.plan);

  return (
    <div>
      <h1>Upgrade Your Plan</h1>

      <PlanComparison currentPlan={tenant.plan} />

      <PlanSelector
        current={tenant.plan}
        selected={selectedPlan}
        onChange={setSelectedPlan}
      />

      <Button onClick={() => upgradePlan(selectedPlan)}>
        Upgrade to {selectedPlan} - ${PLAN_PRICES[selectedPlan]}/mo
      </Button>

      {/* Immediate upgrade, prorated billing */}
    </div>
  );
}
```

---

## Troubleshooting

### Problem: Tenant Can't Create Agents

**Symptoms:**
```
Error: Agent quota exceeded. Current: 100, Max: 100.
```

**Solutions:**

1. **Check current usage:**
   ```bash
   panda tenant usage acme-corp
   # Agents: 100/100 ⚠️ At limit
   ```

2. **Increase quota:**
   ```bash
   panda tenant update acme-corp --max-agents 200
   ```

3. **Or upgrade plan:**
   ```bash
   panda tenant upgrade acme-corp --plan enterprise
   ```

---

### Problem: Tenant Data Showing in Another Tenant

**🚨 CRITICAL SECURITY ISSUE**

**Symptoms:**
- User from Tenant A sees Tenant B's data
- Queries returning wrong tenant's results

**Immediate Actions:**

1. **Verify middleware is applied:**
   ```typescript
   // MUST use withTenant wrapper
   export const getAgents = query({
     handler: async (ctx) => {
       return withTenant(ctx, async (tenantId) => {
         return ctx.db
           .query("agents")
           .withIndex("by_tenant", (q) => q.eq("tenantId", tenantId))
           .collect();
       });
     },
   });
   ```

2. **Check authentication:**
   ```bash
   # Verify user's orgId matches expected tenant
   panda debug user-session <userId>
   ```

3. **Audit recent queries:**
   ```bash
   # Check if any queries missing tenant filter
   panda audit queries --missing-tenant-filter
   ```

---

### Problem: Tenant Billing Discrepancy

**Symptoms:**
- Tenant reports cost doesn't match their usage
- Missing charges or duplicate charges

**Solutions:**

1. **Export usage detail:**
   ```bash
   panda tenant usage acme-corp --detailed --output usage.csv
   ```

2. **Verify token counts:**
   ```typescript
   const usage = await getTenantUsage(tenantId);
   console.log({
     tokensRecorded: usage.totalTokens,
     costCalculated: usage.totalCost,
     breakdown: usage.byModel,
   });
   ```

3. **Reconcile with Stripe:**
   ```bash
   panda billing reconcile acme-corp --month 2026-02
   ```

---

### Problem: Slow Performance for Large Tenant

**Symptoms:**
- Dashboard loads slowly
- Queries timing out
- High database CPU

**Solutions:**

1. **Check query performance:**
   ```bash
   panda debug slow-queries --tenant acme-corp
   ```

2. **Add missing indexes:**
   ```typescript
   // If querying by createdAt frequently
   agents: defineTable({
     tenantId: v.id("tenants"),
     createdAt: v.number(),
     // ...
   })
     .index("by_tenant_and_created", ["tenantId", "createdAt"])
   ```

3. **Consider migrating to isolated database:**
   ```bash
   # For very large tenants (500+ agents, millions of messages)
   panda tenant migrate acme-corp --to isolated-database
   ```

---

## Summary

Multi-tenancy in Agentik OS enables you to:

- ✅ Serve multiple customers from one deployment
- ✅ Isolate data with database-level guarantees
- ✅ Control resources with quotas and limits
- ✅ Track costs per tenant in real-time
- ✅ Scale from 1 to 10,000+ tenants
- ✅ Maintain compliance (GDPR, HIPAA, SOC 2)
- ✅ Provide self-service tenant management

**Next Steps:**

1. Read [Security Best Practices](./security-best-practices.md)
2. Set up your first tenant with the CLI
3. Configure billing integration
4. Monitor tenant health proactively

**Need Help?**

- 📧 Email: enterprise@agentik-os.com
- 💬 Discord: [discord.gg/agentik-os](https://discord.gg/agentik-os)
- 📚 Docs: [docs.agentik-os.com](https://docs.agentik-os.com)

---

*Last updated: February 14, 2026*
*Agentik OS Documentation Team*
