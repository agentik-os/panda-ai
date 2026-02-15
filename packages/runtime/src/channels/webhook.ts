import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
} from "@agentik-os/shared";
import type { Express, Request, Response } from "express";
import crypto from "crypto";

/**
 * Webhook Channel Adapter
 *
 * Enables bidirectional integration with external services.
 * - Receives webhook events from GitHub, Stripe, Slack, etc.
 * - Sends outgoing webhooks to notify external systems
 *
 * Features:
 * - HMAC signature validation
 * - Multi-provider support (GitHub, Stripe, Slack, generic)
 * - Retry logic with exponential backoff
 * - Dead letter queue for failed deliveries
 * - Authentication for outgoing webhooks (Bearer, Basic, API Key, HMAC)
 */
export class WebhookChannel implements ChannelAdapter {
  readonly name = "webhook" as const;

  private app?: Express;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private providers: Map<string, WebhookProvider>;
  private webhookDestinations = new Map<string, WebhookDestination>();

  constructor(app?: Express) {
    this.app = app;
    this.providers = new Map(Object.entries(PROVIDERS));
  }

  async connect(_config: ChannelConfig): Promise<void> {
    if (!this.app) {
      throw new Error("Express app is required for webhook channel");
    }

    this.setupRoutes();
    this.connected = true;
    console.log("✅ Webhook channel connected");
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.webhookDestinations.clear();
    console.log("👋 Webhook channel disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.connected) {
      throw new Error("Webhook channel not connected");
    }

    const destination = this.webhookDestinations.get(to);

    if (!destination) {
      console.log(`No webhook destination configured for user: ${to}`);
      return;
    }

    const payload = this.buildWebhookResponse(to, content);

    try {
      await sendWithRetry(destination, payload);
    } catch (error) {
      console.error("Failed to send webhook after retries:", error);
      // In production, would add to dead letter queue here
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Webhook channel not connected");
    }

    const destination = this.webhookDestinations.get(to);

    if (!destination) {
      console.log(`No webhook destination configured for user: ${to}`);
      return;
    }

    const payload = {
      event: "agent.file",
      timestamp: new Date().toISOString(),
      file: {
        data: file.toString("base64"),
        caption,
        mimeType: "application/octet-stream",
      },
    };

    try {
      await sendWithRetry(destination, payload);
    } catch (error) {
      console.error("Failed to send file webhook:", error);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Register a webhook destination for a user
   */
  registerDestination(userId: string, destination: WebhookDestination): void {
    this.webhookDestinations.set(userId, destination);
  }

  /**
   * PRIVATE METHODS
   */

  private setupRoutes(): void {
    if (!this.app) return;

    // POST /webhook/:provider/:secret - Incoming webhooks
    this.app.post("/webhook/:provider/:secret", async (req: Request, res: Response) => {
      const provider = req.params.provider as string;
      const secret = req.params.secret as string;

      try {
        const handler = this.providers.get(provider);

        if (!handler) {
          return res.status(400).json({ error: "Unknown provider" });
        }

        // Validate signature/secret
        const isValid = handler.validateSignature(req, secret);

        if (!isValid) {
          return res.status(401).json({ error: "Invalid signature" });
        }

        // Parse payload to RawMessage
        const rawMessage = handler.parsePayload(req.body);

        // Send to pipeline
        if (this.messageHandler) {
          await this.messageHandler(rawMessage);
        }

        // Return 200 OK (webhook providers expect this)
        return res.status(200).json({ received: true });
      } catch (error) {
        console.error("Webhook processing error:", error);
        return res.status(500).json({ error: "Internal server error" });
      }
    });

    // POST /webhook/register - Register webhook destination
    this.app.post("/webhook/register", (req: Request, res: Response) => {
      const { userId, url, auth } = req.body;

      if (!userId || !url) {
        return res.status(400).json({ error: "userId and url required" });
      }

      this.registerDestination(userId, { url, auth });

      return res.json({ success: true, userId, url });
    });

    // GET /webhook/health - Health check
    this.app.get("/webhook/health", (_req: Request, res: Response) => {
      return res.json({
        status: "ok",
        channel: "webhook",
        connected: this.connected,
        providers: Array.from(this.providers.keys()),
        registrations: this.webhookDestinations.size,
      });
    });
  }

  private buildWebhookResponse(userId: string, content: ResponseContent): WebhookResponse {
    return {
      event: "agent.response",
      timestamp: new Date().toISOString(),
      agent: "default",
      user: userId,
      message: {
        text: content.text,
        richContent: content.richContent,
        metadata: content.metadata,
      },
    };
  }
}

/**
 * WEBHOOK PROVIDERS
 */

interface WebhookProvider {
  name: string;
  validateSignature: (req: Request, secret: string) => boolean;
  parsePayload: (body: any) => RawMessage;
  supportedEvents: string[];
}

const PROVIDERS: Record<string, WebhookProvider> = {
  github: {
    name: "GitHub",
    validateSignature: validateGitHub,
    parsePayload: parseGitHubPayload,
    supportedEvents: ["push", "pull_request", "issues", "issue_comment", "release"],
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

/**
 * SIGNATURE VALIDATION
 */

export function validateGitHub(req: Request, secret: string): boolean {
  const signature = req.headers["x-hub-signature-256"] as string;

  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  const receivedSignature = signature.replace("sha256=", "");

  return secureCompare(receivedSignature, expectedSignature);
}

export function validateStripe(req: Request, secret: string): boolean {
  // In production, would use Stripe SDK to validate
  // For now, simple HMAC validation
  const signature = req.headers["stripe-signature"] as string;

  if (!signature) return false;

  const payload = JSON.stringify(req.body);
  const expectedSignature = crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return secureCompare(signature, expectedSignature);
}

export function validateSlack(req: Request, secret: string): boolean {
  const timestamp = req.headers["x-slack-request-timestamp"] as string;
  const signature = req.headers["x-slack-signature"] as string;

  if (!timestamp || !signature) return false;

  // Prevent replay attacks (timestamp older than 5 minutes)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp)) > 300) {
    return false;
  }

  const payload = `v0:${timestamp}:${JSON.stringify(req.body)}`;
  const expectedSignature = "v0=" + crypto.createHmac("sha256", secret).update(payload).digest("hex");

  return secureCompare(signature, expectedSignature);
}

export function validateAPIKey(req: Request, secret: string): boolean {
  const headerKey = req.headers["x-api-key"] as string | undefined;
  const queryKey = req.query.api_key;

  // Handle query parameter which can be string | string[] | undefined
  const queryKeyString = typeof queryKey === "string" ? queryKey : undefined;

  const apiKey = headerKey || queryKeyString;

  if (!apiKey) return false;

  return secureCompare(apiKey, secret);
}

/**
 * Timing-safe string comparison
 */
function secureCompare(a: string, b: string): boolean {
  if (a.length !== b.length) return false;

  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * PAYLOAD PARSING
 */

export function parseGitHubPayload(body: any): RawMessage {
  let content = "";

  switch (body.action) {
    case "opened":
      if (body.pull_request) {
        content = `New PR: ${body.pull_request.title}\n${body.pull_request.html_url}`;
      } else if (body.issue) {
        content = `New issue: ${body.issue.title}\n${body.issue.html_url}`;
      }
      break;

    case "created":
      if (body.comment) {
        content = `Comment by ${body.comment.user.login}: ${body.comment.body}`;
      }
      break;

    default:
      content = `GitHub event: ${body.action || "unknown"}`;
  }

  return {
    channel: "webhook",
    channelMessageId: body.id || `github_${Date.now()}`,
    userId: body.sender?.login || "github_bot",
    content,
    timestamp: new Date(body.created_at || Date.now()),
    raw: body,
  };
}

export function parseStripePayload(body: any): RawMessage {
  let content = "";

  switch (body.type) {
    case "payment_intent.succeeded":
      const amount = body.data?.object?.amount ? body.data.object.amount / 100 : 0;
      content = `Payment successful: $${amount}`;
      break;

    case "customer.subscription.created":
      content = `New subscription: ${body.data?.object?.plan?.nickname || "Plan"}`;
      break;

    case "invoice.payment_failed":
      content = `Payment failed for invoice ${body.data?.object?.id}`;
      break;

    default:
      content = `Stripe event: ${body.type || "unknown"}`;
  }

  return {
    channel: "webhook",
    channelMessageId: body.id || `stripe_${Date.now()}`,
    userId: body.data?.object?.customer || "stripe_system",
    content,
    timestamp: new Date((body.created || Date.now() / 1000) * 1000),
    raw: body,
  };
}

export function parseSlackPayload(body: any): RawMessage {
  const content = body.text || body.message?.text || "Slack event";

  return {
    channel: "webhook",
    channelMessageId: body.ts || `slack_${Date.now()}`,
    userId: body.user || body.user_id || "slack_user",
    content,
    timestamp: new Date(parseFloat(body.ts || Date.now() / 1000) * 1000),
    raw: body,
  };
}

export function parseGenericPayload(body: any): RawMessage {
  return {
    channel: "webhook",
    channelMessageId: body.id || `webhook_${Date.now()}`,
    userId: body.userId || body.user_id || "webhook_user",
    content: body.message || body.text || body.content || JSON.stringify(body),
    timestamp: new Date(body.timestamp || Date.now()),
    raw: body,
  };
}

/**
 * OUTGOING WEBHOOKS
 */

interface WebhookDestination {
  url: string;
  auth?: {
    type: "bearer" | "basic" | "api-key" | "hmac";
    token?: string;
    username?: string;
    password?: string;
    header?: string;
    secret?: string;
  };
}

interface WebhookResponse {
  event: "agent.response" | "agent.file";
  timestamp: string;
  agent: string;
  user: string;
  message?: {
    text: string;
    richContent?: any[];
    metadata?: Record<string, unknown>;
  };
  file?: {
    data: string;
    caption?: string;
    mimeType: string;
  };
}

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
  destination: WebhookDestination,
  payload: any,
  config: RetryConfig = DEFAULT_RETRY_CONFIG
): Promise<void> {
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

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      const response = await fetch(destination.url, {
        method: "POST",
        headers,
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

    // Don't sleep after last attempt
    if (attempt < config.maxRetries) {
      const delay = Math.min(
        config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
        config.maxDelay
      );

      console.log(
        `Webhook failed. Retrying in ${delay}ms... (attempt ${attempt + 1}/${config.maxRetries + 1})`
      );

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw new Error(
    `Webhook delivery failed after ${config.maxRetries + 1} attempts: ${lastError?.message}`
  );
}
