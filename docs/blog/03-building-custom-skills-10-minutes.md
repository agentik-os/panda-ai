# Building Custom AI Agent Skills in 10 Minutes

**Published:** February 14, 2026
**Author:** Developer Relations Team
**Reading Time:** 12 minutes

---

You've built an AI agent. It can chat, it can reason, it can write code. But what if you want it to:
- Check your Stripe payments?
- Send Slack notifications?
- Query your custom database?
- Interact with your internal API?

**That's where skills come in.**

In this tutorial, we'll build a production-ready custom skill from scratch in just 10 minutes.

---

## What We're Building

A **Stripe Payment Checker** skill that lets AI agents:
- List recent payments
- Get payment details
- Refund payments
- Create payment links

By the end, your agent will be able to answer questions like:
- *"Show me payments from yesterday"*
- *"What's the total revenue this week?"*
- *"Refund payment pi_abc123"*

---

## Prerequisites

**You'll need:**
- Node.js 18+ or Bun
- A Stripe account ([sign up free](https://stripe.com))
- Agentik OS installed (`npm install @agentik/sdk`)
- 10 minutes ⏱️

**Skill development experience:** Not required! We'll walk through everything.

---

## Step 1: Scaffold the Skill (2 minutes)

### Use the CLI Generator

```bash
panda skill create stripe-payments

# Output:
# ✓ Created skill skeleton
# ✓ Added to skills/stripe-payments/
#
# Next steps:
# 1. cd skills/stripe-payments
# 2. Implement execute() method
# 3. Test with: panda skill test stripe-payments
```

This creates:

```
skills/stripe-payments/
├── index.ts          # Main skill logic
├── package.json      # Dependencies
├── skill.yaml        # Metadata
└── README.md         # Documentation
```

### Skill Skeleton

```typescript
// skills/stripe-payments/index.ts
import { SkillBase, Permission } from '@agentik/sdk';

export class StripePaymentsSkill extends SkillBase {
  name = 'stripe-payments';
  version = '1.0.0';
  description = 'Interact with Stripe payments';

  permissions: Permission[] = [
    { type: 'network', domain: 'api.stripe.com' },
  ];

  async execute(params: any) {
    // We'll implement this next
  }
}
```

---

## Step 2: Install Dependencies (1 minute)

```bash
cd skills/stripe-payments
npm install stripe
```

---

## Step 3: Implement the Skill (5 minutes)

### Define Input Schema

First, let's define what parameters our skill accepts:

```typescript
import { z } from 'zod';

const StripePaymentsSchema = z.object({
  action: z.enum(['list', 'get', 'refund', 'create_link']),
  paymentId: z.string().optional(),
  limit: z.number().min(1).max(100).optional().default(10),
  refundAmount: z.number().positive().optional(),
});

type StripePaymentsParams = z.infer<typeof StripePaymentsSchema>;
```

### Implement Execute Method

```typescript
import Stripe from 'stripe';

export class StripePaymentsSkill extends SkillBase {
  private stripe: Stripe;

  constructor() {
    super();
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
      apiVersion: '2023-10-16',
    });
  }

  async execute(params: StripePaymentsParams) {
    // Validate input
    const validated = StripePaymentsSchema.parse(params);

    // Route to appropriate handler
    switch (validated.action) {
      case 'list':
        return await this.listPayments(validated.limit);

      case 'get':
        if (!validated.paymentId) {
          throw new Error('paymentId required for action: get');
        }
        return await this.getPayment(validated.paymentId);

      case 'refund':
        if (!validated.paymentId) {
          throw new Error('paymentId required for action: refund');
        }
        return await this.refundPayment(
          validated.paymentId,
          validated.refundAmount
        );

      case 'create_link':
        if (!validated.refundAmount) {
          throw new Error('refundAmount required for action: create_link');
        }
        return await this.createPaymentLink(validated.refundAmount);

      default:
        throw new Error(`Unknown action: ${validated.action}`);
    }
  }

  private async listPayments(limit: number) {
    const payments = await this.stripe.paymentIntents.list({
      limit,
    });

    return {
      success: true,
      count: payments.data.length,
      payments: payments.data.map(p => ({
        id: p.id,
        amount: p.amount / 100,  // Convert cents to dollars
        currency: p.currency,
        status: p.status,
        created: new Date(p.created * 1000).toISOString(),
        customer: p.customer,
      })),
    };
  }

  private async getPayment(paymentId: string) {
    const payment = await this.stripe.paymentIntents.retrieve(paymentId);

    return {
      success: true,
      payment: {
        id: payment.id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        description: payment.description,
        created: new Date(payment.created * 1000).toISOString(),
        customer: payment.customer,
        receipt_email: payment.receipt_email,
      },
    };
  }

  private async refundPayment(paymentId: string, amount?: number) {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: amount ? Math.round(amount * 100) : undefined,  // Full refund if not specified
    });

    return {
      success: true,
      refund: {
        id: refund.id,
        amount: refund.amount / 100,
        status: refund.status,
        created: new Date(refund.created * 1000).toISOString(),
      },
    };
  }

  private async createPaymentLink(amount: number) {
    const paymentLink = await this.stripe.paymentLinks.create({
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: 'Payment',
          },
          unit_amount: Math.round(amount * 100),
        },
        quantity: 1,
      }],
    });

    return {
      success: true,
      link: {
        id: paymentLink.id,
        url: paymentLink.url,
        active: paymentLink.active,
      },
    };
  }
}
```

---

## Step 4: Add Metadata (1 minute)

Update `skill.yaml`:

```yaml
name: stripe-payments
version: 1.0.0
description: Interact with Stripe payments - list, get details, refund, create links

author:
  name: Your Name
  email: you@example.com

permissions:
  - type: network
    domain: api.stripe.com
    description: Access Stripe API

parameters:
  action:
    type: enum
    values: [list, get, refund, create_link]
    description: Action to perform
    required: true

  paymentId:
    type: string
    description: Stripe payment intent ID (pi_...)
    required: false

  limit:
    type: number
    description: Max results for 'list' action
    default: 10
    min: 1
    max: 100

  refundAmount:
    type: number
    description: Amount to refund (dollars). Omit for full refund
    required: false

examples:
  - description: List 10 recent payments
    params:
      action: list
      limit: 10

  - description: Get payment details
    params:
      action: get
      paymentId: pi_abc123

  - description: Refund $50.00
    params:
      action: refund
      paymentId: pi_abc123
      refundAmount: 50.00

  - description: Create payment link for $99.99
    params:
      action: create_link
      refundAmount: 99.99
```

---

## Step 5: Test the Skill (1 minute)

```bash
# Test with CLI
panda skill test stripe-payments --params '{
  "action": "list",
  "limit": 5
}'

# Output:
# ✓ Skill executed successfully
# {
#   "success": true,
#   "count": 5,
#   "payments": [
#     {
#       "id": "pi_abc123",
#       "amount": 99.99,
#       "currency": "usd",
#       "status": "succeeded",
#       "created": "2026-02-14T10:30:00.000Z"
#     },
#     ...
#   ]
# }
```

### Write Unit Tests

```typescript
// skills/stripe-payments/test.ts
import { describe, it, expect } from 'vitest';
import { StripePaymentsSkill } from './index';

describe('StripePaymentsSkill', () => {
  const skill = new StripePaymentsSkill();

  it('should list payments', async () => {
    const result = await skill.execute({
      action: 'list',
      limit: 5,
    });

    expect(result.success).toBe(true);
    expect(result.payments).toBeDefined();
    expect(result.payments.length).toBeLessThanOrEqual(5);
  });

  it('should get payment details', async () => {
    const result = await skill.execute({
      action: 'get',
      paymentId: 'pi_test_123',
    });

    expect(result.success).toBe(true);
    expect(result.payment.id).toBe('pi_test_123');
  });

  it('should validate input', async () => {
    await expect(skill.execute({ action: 'invalid' }))
      .rejects.toThrow();
  });
});
```

Run tests:

```bash
npm test

# ✓ should list payments
# ✓ should get payment details
# ✓ should validate input
#
# Test Suites: 1 passed, 1 total
# Tests:       3 passed, 3 total
```

---

## Step 6: Use Your Skill with an Agent

```typescript
import { Agentik } from '@agentik/sdk';

const agentik = new Agentik({ apiKey: process.env.AGENTIK_API_KEY });

// Create agent with your custom skill
const agent = await agentik.agents.create({
  name: 'Payment Assistant',
  model: 'claude-sonnet-4-5',
  skills: ['stripe-payments'],  // ← Your custom skill!
  systemPrompt: `You are a payment support assistant.
  You can help users check payments, process refunds, and create payment links.
  Always confirm before executing refunds.`,
});

// Test it out
const response = await agent.sendMessage({
  content: 'Show me the last 5 payments',
});

console.log(response.content);
// "Here are your last 5 payments:
//  1. $99.99 (succeeded) - Feb 14, 10:30 AM
//  2. $49.00 (succeeded) - Feb 14, 9:15 AM
//  ..."

// Test refund
const refundResponse = await agent.sendMessage({
  content: 'Refund payment pi_abc123 for $50',
});

console.log(refundResponse.content);
// "I've processed a $50.00 refund for payment pi_abc123.
//  Refund ID: re_xyz789
//  Status: succeeded"
```

---

## Advanced: Error Handling & Retries

### Handle Stripe Errors Gracefully

```typescript
import { SkillError } from '@agentik/sdk';

private async getPayment(paymentId: string) {
  try {
    const payment = await this.stripe.paymentIntents.retrieve(paymentId);
    return { success: true, payment: { /* ... */ } };
  } catch (error) {
    if (error.type === 'StripeInvalidRequestError') {
      throw new SkillError({
        code: 'PAYMENT_NOT_FOUND',
        message: `Payment ${paymentId} not found`,
        recoverable: false,
        userMessage: 'I couldn\'t find that payment. Please check the payment ID.',
      });
    }

    if (error.type === 'StripeRateLimitError') {
      throw new SkillError({
        code: 'RATE_LIMITED',
        message: 'Stripe API rate limit exceeded',
        recoverable: true,
        retryAfter: 5000,  // 5 seconds
      });
    }

    throw error;
  }
}
```

### Implement Retry Logic

```typescript
import { retry } from '@agentik/sdk';

private async listPayments(limit: number) {
  return await retry(
    () => this.stripe.paymentIntents.list({ limit }),
    {
      maxRetries: 3,
      baseDelay: 1000,
      exponentialBackoff: true,
      retryOn: ['StripeConnectionError', 'StripeRateLimitError'],
    }
  );
}
```

---

## Advanced: Rate Limiting

Protect your API quota:

```typescript
import { RateLimiter } from '@agentik/sdk';

export class StripePaymentsSkill extends SkillBase {
  private rateLimiter = new RateLimiter({
    points: 100,  // 100 requests
    duration: 60,  // per minute
  });

  async execute(params: StripePaymentsParams) {
    // Check rate limit
    await this.rateLimiter.consume(1);

    // ... rest of execute logic
  }
}
```

---

## Publishing Your Skill

### 1. Package It

```bash
panda skill build stripe-payments

# Output:
# ✓ Built dist/stripe-payments.wasm
# ✓ Size: 234 KB (optimized)
# ✓ Security scan: passed
```

### 2. Test in Isolation

```bash
panda skill sandbox stripe-payments

# Runs skill in WASM sandbox (isolated environment)
# Tests: permission checks, resource limits, security
```

### 3. Publish to Marketplace

```bash
panda skill publish stripe-payments --public

# Output:
# ✓ Published to marketplace
# ✓ Skill ID: stripe-payments-v1-0-0
# ✓ URL: https://marketplace.agentik-os.com/skills/stripe-payments
```

---

## Real-World Examples

### Example 1: Customer Support Bot

```typescript
const supportAgent = await agentik.agents.create({
  name: 'Support Bot',
  skills: ['stripe-payments', 'sendgrid', 'zendesk'],
  systemPrompt: `You are a support agent for TechCo.
  Help customers with payment issues, refunds, and billing questions.`,
});

// User: "I want a refund for my last payment"
const response = await supportAgent.sendMessage({
  content: "I want a refund for my last payment",
  userId: 'user_123',
});

// Agent automatically:
// 1. Uses stripe-payments skill to list user's payments
// 2. Finds most recent payment
// 3. Processes refund
// 4. Uses sendgrid skill to send confirmation email
// 5. Uses zendesk skill to create a ticket
```

### Example 2: Finance Dashboard

```typescript
const financeAgent = await agentik.agents.create({
  name: 'Finance Assistant',
  skills: ['stripe-payments', 'quickbooks', 'google-sheets'],
});

// "What's our revenue this week?"
const response = await financeAgent.sendMessage({
  content: "What's our revenue this week?",
});

// Agent automatically:
// 1. Uses stripe-payments to get this week's payments
// 2. Calculates total revenue
// 3. Compares to last week
// 4. Updates Google Sheets with new data
```

---

## Performance & Security Best Practices

### 1. Caching

Cache expensive API calls:

```typescript
import { cache } from '@agentik/sdk';

private async listPayments(limit: number) {
  const cacheKey = `payments:list:${limit}`;

  // Check cache
  const cached = await cache.get(cacheKey);
  if (cached) return cached;

  // Fetch from Stripe
  const result = await this.stripe.paymentIntents.list({ limit });

  // Cache for 5 minutes
  await cache.set(cacheKey, result, { ttl: 300 });

  return result;
}
```

### 2. Input Validation

Always validate user input:

```typescript
const schema = z.object({
  action: z.enum(['list', 'get', 'refund', 'create_link']),
  paymentId: z.string().regex(/^pi_[a-zA-Z0-9]+$/).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

// Will throw if invalid
const validated = schema.parse(params);
```

### 3. Secure Secrets

Never hardcode API keys:

```typescript
// ❌ Bad
const stripe = new Stripe('sk_live_abc123...');

// ✅ Good
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

// ✅ Better (use secret manager)
const stripe = new Stripe(
  await secretManager.get('stripe-secret-key')
);
```

### 4. Audit Logging

Log all operations:

```typescript
private async refundPayment(paymentId: string, amount?: number) {
  // Log before operation
  await this.auditLog({
    action: 'refund_initiated',
    paymentId,
    amount,
    timestamp: Date.now(),
  });

  try {
    const refund = await this.stripe.refunds.create({
      payment_intent: paymentId,
      amount: amount ? Math.round(amount * 100) : undefined,
    });

    // Log success
    await this.auditLog({
      action: 'refund_succeeded',
      paymentId,
      refundId: refund.id,
      amount: refund.amount / 100,
    });

    return { success: true, refund };
  } catch (error) {
    // Log failure
    await this.auditLog({
      action: 'refund_failed',
      paymentId,
      error: error.message,
    });

    throw error;
  }
}
```

---

## Next Steps

Now that you've built your first skill, try:

### More Custom Skills Ideas

- **Slack Notifications**: Post messages, create channels
- **GitHub Integration**: Create PRs, add comments, merge
- **Database Queries**: Query your Postgres/MySQL database
- **Custom API**: Integrate with your internal services
- **File Processing**: Read/write files, convert formats

### Resources

- 📚 [Skills Development Guide](https://docs.agentik-os.com/guides/skills-marketplace)
- 🎥 [Video Tutorial](https://www.youtube.com/watch?v=...)
- 💬 [Discord Community](https://discord.gg/agentik-os)
- 📦 [Skill Examples Repo](https://github.com/agentik-os/skills-examples)

### Share Your Skill

Built something cool? Share it with the community:
- Publish to the [Skills Marketplace](https://marketplace.agentik-os.com)
- Write a blog post
- Give a talk at our monthly meetup

---

**Happy building!** 🚀

If you run into issues or have questions, we're here to help in [Discord](https://discord.gg/agentik-os).

---

*What skill will you build next? Let us know on Twitter [@AgentikOS](https://twitter.com/AgentikOS)!*
