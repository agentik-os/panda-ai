# Webhook Channel Adapter - Implementation Plan

**Step:** step-058
**Estimated Hours:** 12h
**Depends On:** step-028 (API Channel Adapter)
**Status:** Planning

---

## Overview

The Webhook channel adapter enables bidirectional integration with external services. It receives webhook events from external systems (Stripe, GitHub, Slack, etc.) and can also send outgoing webhooks to notify external systems of agent responses.

---

## Technical Design

### Libraries

```bash
pnpm add express crypto
pnpm add -D @types/node @types/express
```

**Built on Express** (already installed for API channel):
- Reuses existing Express server infrastructure
- Adds webhook-specific routes
- HMAC signature validation
- Retry logic for outgoing webhooks

### Architecture

```
External Service (GitHub, Stripe, Slack, etc.)
     ↓
POST /webhook/:provider/:secret
     ↓
WebhookChannel.validateSignature()
     ↓
WebhookChannel.parsePayload()
     ↓
RawMessage → Pipeline
     ↓
Agent Response
     ↓
WebhookChannel.send() → POST to external webhook URL
     ↓
External Service receives response
```

### Implementation Files

- `packages/runtime/src/channels/webhook.ts` - Channel adapter
- `packages/runtime/src/channels/webhook.test.ts` - Unit tests
- `docs/channels/WEBHOOK-INTEGRATIONS.md` - User guide (provider setup)

---

## Authentication

### Incoming Webhooks

**Multiple authentication methods:**

#### 1. HMAC Signature Validation (Recommended)

```typescript
function validateHMAC(payload: string, signature: string, secret: string): boolean {
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}

// GitHub webhook validation
function validateGitHub(req: Request): boolean {
  const signature = req.headers["x-hub-signature-256"];
  const payload = JSON.stringify(req.body);
  const secret = process.env.GITHUB_WEBHOOK_SECRET;

  return validateHMAC(payload, signature.replace("sha256=", ""), secret);
}

// Stripe webhook validation
function validateStripe(req: Request): boolean {
  const signature = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;

  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  try {
    stripe.webhooks.constructEvent(req.body, signature, secret);
    return true;
  } catch (error) {
    return false;
  }
}
```

#### 2. API Key Validation

```typescript
function validateAPIKey(req: Request): boolean {
  const apiKey = req.headers["x-api-key"] || req.query.api_key;
  const expectedKey = process.env.WEBHOOK_API_KEY;

  if (!apiKey || !expectedKey) return false;

  return crypto.timingSafeEqual(
    Buffer.from(apiKey),
    Buffer.from(expectedKey)
  );
}
```

#### 3. Secret URL Path

```typescript
// POST /webhook/github/abc123def456
// URL includes secret token

function validateSecretPath(req: Request): boolean {
  const { secret } = req.params;
  const expectedSecret = process.env.WEBHOOK_SECRET;

  if (!secret || !expectedSecret) return false;

  return crypto.timingSafeEqual(
    Buffer.from(secret),
    Buffer.from(expectedSecret)
  );
}
```

### Outgoing Webhooks

**Authentication for sending to external services:**

```typescript
interface WebhookDestination {
  url: string;
  auth?: {
    type: "bearer" | "basic" | "api-key" | "hmac";
    token?: string;
    username?: string;
    password?: string;
    header?: string; // For api-key
    secret?: string; // For HMAC
  };
}

async function sendWebhook(destination: WebhookDestination, payload: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  // Add authentication
  if (destination.auth) {
    switch (destination.auth.type) {
      case "bearer":
        headers["Authorization"] = `Bearer ${destination.auth.token}`;
        break;

      case "basic":
        const creds = Buffer.from(
          `${destination.auth.username}:${destination.auth.password}`
        ).toString("base64");
        headers["Authorization"] = `Basic ${creds}`;
        break;

      case "api-key":
        headers[destination.auth.header || "X-API-Key"] = destination.auth.token!;
        break;

      case "hmac":
        const signature = crypto
          .createHmac("sha256", destination.auth.secret!)
          .update(JSON.stringify(payload))
          .digest("hex");
        headers["X-Webhook-Signature"] = `sha256=${signature}`;
        break;
    }
  }

  await fetch(destination.url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });
}
```

---

## Payload Validation

### Webhook Providers

```typescript
interface WebhookProvider {
  name: string;
  validateSignature: (req: Request) => boolean;
  parsePayload: (body: any) => RawMessage;
  supportedEvents: string[];
}

const providers: Record<string, WebhookProvider> = {
  github: {
    name: "GitHub",
    validateSignature: validateGitHub,
    parsePayload: parseGitHubPayload,
    supportedEvents: [
      "push",
      "pull_request",
      "issues",
      "issue_comment",
      "release",
    ],
  },

  stripe: {
    name: "Stripe",
    validateSignature: validateStripe,
    parsePayload: parseStripePayload,
    supportedEvents: [
      "payment_intent.succeeded",
      "customer.subscription.created",
      "invoice.payment_failed",
    ],
  },

  slack: {
    name: "Slack",
    validateSignature: validateSlack,
    parsePayload: parseSlackPayload,
    supportedEvents: ["message", "app_mention", "slash_command"],
  },

  generic: {
    name: "Generic",
    validateSignature: validateAPIKey,
    parsePayload: parseGenericPayload,
    supportedEvents: ["*"],
  },
};
```

### Payload Parsing

```typescript
// GitHub webhook payload → Agentik RawMessage
function parseGitHubPayload(body: any): RawMessage {
  const event = body; // GitHub sends full event object

  let content = "";

  switch (event.action) {
    case "opened":
      if (event.pull_request) {
        content = `New PR: ${event.pull_request.title}\n${event.pull_request.html_url}`;
      } else if (event.issue) {
        content = `New issue: ${event.issue.title}\n${event.issue.html_url}`;
      }
      break;

    case "created":
      if (event.comment) {
        content = `Comment by ${event.comment.user.login}: ${event.comment.body}`;
      }
      break;

    default:
      content = `GitHub event: ${event.action}`;
  }

  return {
    channel: "webhook",
    channelMessageId: event.id || `github_${Date.now()}`,
    userId: event.sender?.login || "github_bot",
    content,
    timestamp: new Date(event.created_at || Date.now()),
    raw: event,
  };
}

// Stripe webhook payload → Agentik RawMessage
function parseStripePayload(body: any): RawMessage {
  const event = body;

  let content = "";

  switch (event.type) {
    case "payment_intent.succeeded":
      const amount = event.data.object.amount / 100;
      content = `Payment successful: $${amount}`;
      break;

    case "customer.subscription.created":
      content = `New subscription: ${event.data.object.plan.nickname}`;
      break;

    case "invoice.payment_failed":
      content = `Payment failed for invoice ${event.data.object.id}`;
      break;

    default:
      content = `Stripe event: ${event.type}`;
  }

  return {
    channel: "webhook",
    channelMessageId: event.id,
    userId: event.data.object.customer || "stripe_system",
    content,
    timestamp: new Date(event.created * 1000),
    raw: event,
  };
}

// Generic webhook payload → Agentik RawMessage
function parseGenericPayload(body: any): RawMessage {
  return {
    channel: "webhook",
    channelMessageId: body.id || `webhook_${Date.now()}`,
    userId: body.userId || body.user_id || "webhook_user",
    content: body.message || body.text || body.content || JSON.stringify(body),
    timestamp: new Date(body.timestamp || Date.now()),
    raw: body,
  };
}
```

---

## Response Format

### Outgoing Webhook Payload

```typescript
interface WebhookResponse {
  event: "agent.response";
  timestamp: string;
  agent: string;
  user: string;
  message: {
    text: string;
    richContent?: RichContent[];
    metadata?: Record<string, unknown>;
  };
  original: {
    provider: string;
    eventId: string;
    eventType: string;
  };
}

function buildWebhookResponse(
  rawMessage: RawMessage,
  responseContent: ResponseContent
): WebhookResponse {
  return {
    event: "agent.response",
    timestamp: new Date().toISOString(),
    agent: "default", // TODO: Get from user state
    user: rawMessage.userId,
    message: {
      text: responseContent.text,
      richContent: responseContent.richContent,
      metadata: responseContent.metadata,
    },
    original: {
      provider: rawMessage.raw.provider || "unknown",
      eventId: rawMessage.channelMessageId,
      eventType: rawMessage.raw.type || rawMessage.raw.action || "message",
    },
  };
}
```

### Response Delivery

```typescript
async function deliverResponse(
  userId: string,
  response: WebhookResponse
): Promise<void> {
  // Get user's webhook destination
  const webhookUrl = await getUserWebhookUrl(userId);

  if (!webhookUrl) {
    console.log("No webhook URL configured for user:", userId);
    return;
  }

  // Send with retry logic
  await sendWithRetry(webhookUrl, response);
}
```

---

## Retry Logic

### Outgoing Webhook Retries

```typescript
interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000, // 1 second
  maxDelay: 30000, // 30 seconds
  backoffMultiplier: 2,
};

async function sendWithRetry(
  url: string,
  payload: any,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        console.log(`Webhook delivered successfully (attempt ${attempt + 1})`);
        return;
      }

      // Non-retryable status codes
      if (response.status === 400 || response.status === 401 || response.status === 404) {
        throw new Error(`Non-retryable error: ${response.status}`);
      }

      lastError = new Error(`HTTP ${response.status}`);
    } catch (error) {
      lastError = error as Error;

      // Don't retry on non-retryable errors
      if (
        lastError.message.includes("Non-retryable") ||
        lastError.message.includes("ENOTFOUND")
      ) {
        throw lastError;
      }
    }

    // Calculate delay with exponential backoff
    const delay = Math.min(
      config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
      config.maxDelay
    );

    console.log(`Webhook failed. Retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries + 1})`);

    await new Promise((resolve) => setTimeout(resolve, delay));
  }

  // All retries exhausted
  throw new Error(`Webhook delivery failed after ${config.maxRetries + 1} attempts: ${lastError?.message}`);
}
```

### Dead Letter Queue (Optional)

```typescript
interface FailedWebhook {
  id: string;
  url: string;
  payload: any;
  attempts: number;
  lastError: string;
  createdAt: Date;
  nextRetry?: Date;
}

async function addToDeadLetterQueue(
  url: string,
  payload: any,
  error: string
): Promise<void> {
  await ctx.db.insert("failed_webhooks", {
    id: `failed_${Date.now()}`,
    url,
    payload,
    attempts: 0,
    lastError: error,
    createdAt: new Date(),
    nextRetry: new Date(Date.now() + 60000), // Retry in 1 minute
  });
}

// Background job to retry failed webhooks
async function retryFailedWebhooks(): Promise<void> {
  const failed = await ctx.db
    .query("failed_webhooks")
    .filter((q) =>
      q.and(
        q.lte(q.field("attempts"), 10), // Max 10 retries
        q.lte(q.field("nextRetry"), Date.now())
      )
    )
    .collect();

  for (const webhook of failed) {
    try {
      await sendWithRetry(webhook.url, webhook.payload, {
        maxRetries: 1,
        initialDelay: 1000,
        maxDelay: 1000,
        backoffMultiplier: 1,
      });

      // Success - remove from queue
      await ctx.db.delete(webhook._id);
    } catch (error) {
      // Update attempts and nextRetry
      await ctx.db.patch(webhook._id, {
        attempts: webhook.attempts + 1,
        lastError: (error as Error).message,
        nextRetry: new Date(
          Date.now() + Math.pow(2, webhook.attempts + 1) * 60000
        ),
      });
    }
  }
}
```

---

## Implementation Plan

### Class Structure

```typescript
export class WebhookChannel implements ChannelAdapter {
  readonly name = "webhook" as const;

  private app: Express; // Shared with APIChannel
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private providers: Map<string, WebhookProvider>;
  private webhookDestinations = new Map<string, WebhookDestination>(); // userId → destination

  constructor(app?: Express) {
    this.app = app || express(); // Reuse existing Express app if provided
    this.providers = new Map(Object.entries(providers));
  }

  async connect(config: ChannelConfig): Promise<void> {
    this.setupRoutes();
    this.connected = true;
    console.log("✅ Webhook channel connected");
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    console.log("👋 Webhook channel disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    // Build webhook response payload
    const response = this.buildWebhookResponse(to, content);

    // Get destination for this user
    const destination = this.webhookDestinations.get(to);

    if (!destination) {
      console.log("No webhook destination for user:", to);
      return;
    }

    // Send with retry logic
    try {
      await sendWithRetry(destination.url, response);
    } catch (error) {
      console.error("Failed to send webhook:", error);
      await addToDeadLetterQueue(destination.url, response, (error as Error).message);
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    // Convert file to base64 and send in webhook payload
    const destination = this.webhookDestinations.get(to);

    if (!destination) return;

    const payload = {
      event: "agent.file",
      file: {
        data: file.toString("base64"),
        caption,
        mimeType: "application/octet-stream",
      },
    };

    await sendWithRetry(destination.url, payload);
  }

  isConnected(): boolean {
    return this.connected;
  }

  private setupRoutes() {
    // POST /webhook/:provider/:secret
    this.app.post("/webhook/:provider/:secret", async (req, res) => {
      const { provider, secret } = req.params;

      try {
        // Get provider handler
        const handler = this.providers.get(provider);

        if (!handler) {
          return res.status(400).json({ error: "Unknown provider" });
        }

        // Validate signature/secret
        const isValid = handler.validateSignature(req);

        if (!isValid) {
          return res.status(401).json({ error: "Invalid signature" });
        }

        // Parse payload
        const rawMessage = handler.parsePayload(req.body);

        // Send to pipeline
        if (this.messageHandler) {
          await this.messageHandler(rawMessage);
        }

        // Return success (webhook providers expect 200 OK)
        res.status(200).json({ received: true });
      } catch (error) {
        console.error("Webhook error:", error);
        res.status(500).json({ error: "Internal server error" });
      }
    });

    // POST /webhook/register - Register webhook destination
    this.app.post("/webhook/register", async (req, res) => {
      const { userId, url, auth } = req.body;

      if (!userId || !url) {
        return res.status(400).json({ error: "userId and url required" });
      }

      this.webhookDestinations.set(userId, { url, auth });

      res.json({ success: true, userId, url });
    });

    // GET /webhook/health
    this.app.get("/webhook/health", (req, res) => {
      res.json({
        status: "ok",
        channel: "webhook",
        connected: this.connected,
        providers: Array.from(this.providers.keys()),
        registrations: this.webhookDestinations.size,
      });
    });
  }
}
```

---

## Test Strategy

### Unit Tests (`webhook.test.ts`)

```typescript
describe("WebhookChannel", () => {
  describe("ChannelAdapter interface", () => {
    it("should have name 'webhook'");
    it("should implement isConnected");
    it("should connect successfully");
    it("should disconnect successfully");
    it("should register message handler");
  });

  describe("Signature validation", () => {
    it("should validate GitHub HMAC signature");
    it("should validate Stripe signature");
    it("should validate API key");
    it("should validate secret URL path");
    it("should reject invalid signatures");
  });

  describe("Payload parsing", () => {
    it("should parse GitHub push event");
    it("should parse GitHub pull_request event");
    it("should parse Stripe payment_intent event");
    it("should parse Stripe subscription event");
    it("should parse Slack message event");
    it("should parse generic webhook payload");
  });

  describe("Response sending", () => {
    it("should send webhook response");
    it("should include authentication headers");
    it("should retry on failure");
    it("should use exponential backoff");
    it("should add to dead letter queue after max retries");
  });

  describe("Provider support", () => {
    it("should support GitHub webhooks");
    it("should support Stripe webhooks");
    it("should support Slack webhooks");
    it("should support generic webhooks");
  });

  describe("Webhook registration", () => {
    it("should register webhook destination");
    it("should store authentication config");
    it("should return registered destinations");
  });
});
```

---

## Security Considerations

### Signature Validation

**ALWAYS validate signatures:**

```typescript
// NEVER process webhooks without validation
if (!provider.validateSignature(req)) {
  return res.status(401).json({ error: "Invalid signature" });
}
```

### Timing Attack Prevention

```typescript
// Use crypto.timingSafeEqual for constant-time comparison
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(
    Buffer.from(a),
    Buffer.from(b)
  );
}
```

### Rate Limiting

```typescript
// Prevent webhook spam
const webhookLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute per IP
  message: "Too many webhook requests",
});

app.post("/webhook/:provider/:secret", webhookLimiter, async (req, res) => {
  // ...
});
```

### IP Whitelisting (Optional)

```typescript
// Only accept webhooks from known IPs
const ALLOWED_IPS: Record<string, string[]> = {
  github: [
    "192.30.252.0/22",
    "185.199.108.0/22",
    "140.82.112.0/20",
  ],
  stripe: [
    "3.18.12.63",
    "3.130.192.231",
    "13.235.14.237",
  ],
};

function validateIP(provider: string, ip: string): boolean {
  const allowedIPs = ALLOWED_IPS[provider];
  if (!allowedIPs) return true; // No IP restriction

  return allowedIPs.some((range) => ipInRange(ip, range));
}
```

---

## Webhook Integrations Guide

### Example Configurations

**GitHub:**
```json
{
  "provider": "github",
  "webhookUrl": "https://yourdomain.com/webhook/github/YOUR_SECRET",
  "secret": "YOUR_GITHUB_WEBHOOK_SECRET",
  "events": ["push", "pull_request", "issues", "issue_comment"]
}
```

**Stripe:**
```json
{
  "provider": "stripe",
  "webhookUrl": "https://yourdomain.com/webhook/stripe/YOUR_SECRET",
  "secret": "whsec_YOUR_STRIPE_WEBHOOK_SECRET",
  "events": ["payment_intent.succeeded", "customer.subscription.created"]
}
```

**Slack:**
```json
{
  "provider": "slack",
  "webhookUrl": "https://yourdomain.com/webhook/slack/YOUR_SECRET",
  "secret": "YOUR_SLACK_SIGNING_SECRET",
  "events": ["message", "app_mention"]
}
```

---

## Dependencies

**Blocks:**
- External service integrations (Stripe, GitHub, Slack, etc.)
- Event-driven agent workflows
- Automated notifications

**Blocked By:**
- Step-028 (API Channel Adapter) - MUST complete first

---

## Implementation Checklist

- [ ] Create `WebhookChannel` class implementing `ChannelAdapter`
- [ ] Implement signature validation (HMAC, API key, secret path)
- [ ] Add provider handlers (GitHub, Stripe, Slack, generic)
- [ ] Implement payload parsing for each provider
- [ ] Add retry logic with exponential backoff
- [ ] Implement dead letter queue for failed webhooks
- [ ] Add webhook destination registration
- [ ] Create `/webhook/:provider/:secret` endpoint
- [ ] Add authentication for outgoing webhooks
- [ ] Implement rate limiting
- [ ] Add IP whitelisting (optional)
- [ ] Create `webhook.test.ts` with 15+ tests
- [ ] Update channels/index.ts export
- [ ] Document integrations in WEBHOOK-INTEGRATIONS.md
- [ ] Create health check endpoint
- [ ] Add background job for failed webhook retries

---

**Estimated Time:** 12 hours
**Ready to implement:** When step-028 completes ✅

**Velocity target:** 3 hours at 4x velocity 🚀
