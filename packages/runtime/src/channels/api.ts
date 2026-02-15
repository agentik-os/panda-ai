import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
} from "@agentik-os/shared";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import type { Server } from "http";

/**
 * API Channel Adapter
 *
 * Provides a REST API for external systems to send messages to agents.
 * Enables integrations with webhooks, custom UIs, mobile apps, and third-party services.
 */
export class APIChannel implements ChannelAdapter {
  readonly name = "api" as const;

  private app: Express;
  private server?: Server;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private pendingResponses = new Map<
    string,
    (response: ResponseContent) => void
  >();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  async connect(config: ChannelConfig): Promise<void> {
    const port = (config.options.port as number) || 3000;

    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`✅ API Channel listening on port ${port}`);
        this.connected = true;
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.server) {
      await new Promise<void>((resolve) => {
        this.server?.close(() => resolve());
      });
    }
    this.connected = false;
    console.log("👋 API Channel disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(_to: string, content: ResponseContent): Promise<void> {
    // Resolve pending HTTP response
    const resolver = this.pendingResponses.get(_to);
    if (resolver) {
      resolver(content);
      this.pendingResponses.delete(_to);
    }
  }

  async sendFile(_to: string, file: Buffer, caption?: string): Promise<void> {
    // Return file as base64 in metadata
    const resolver = this.pendingResponses.get(_to);
    if (resolver) {
      resolver({
        text: caption || "File attachment",
        metadata: {
          file: {
            base64: file.toString("base64"),
            mimeType: "application/octet-stream",
          },
        },
      });
      this.pendingResponses.delete(_to);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Setup middleware (security, parsing, rate limiting)
   */
  private setupMiddleware(): void {
    // Security headers
    this.app.use(helmet());

    // CORS
    this.app.use(cors());

    // JSON body parser with 10MB limit
    this.app.use(express.json({ limit: "10mb" }));

    // Rate limiting: 100 requests per 15 minutes
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // Limit each IP to 100 requests per windowMs
      message: "Too many requests, please try again later.",
      standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
      legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    });

    this.app.use(limiter);
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // POST /api/message - Send message to agent
    this.app.post("/api/message", async (req: Request, res: Response) => {
      try {
        const { userId, content, attachments } = req.body;

        // Validation
        if (!userId || !content) {
          return res.status(400).json({
            error: "Missing required fields: userId, content",
          });
        }

        const messageId = `api_${Date.now()}_${Math.random().toString(36).slice(2)}`;

        // Create raw message
        const rawMessage: RawMessage = {
          channel: "api",
          channelMessageId: messageId,
          userId,
          content,
          attachments,
          timestamp: new Date(),
          raw: req,
        };

        // Register response resolver
        const responsePromise = new Promise<ResponseContent>((resolve) => {
          this.pendingResponses.set(messageId, resolve);
        });

        // Send to pipeline (non-blocking)
        if (!this.messageHandler) {
          return res.status(500).json({
            error: "Message handler not configured",
          });
        }

        this.messageHandler(rawMessage).catch((error) => {
          console.error("Pipeline error:", error);
        });

        // Wait for agent response (with timeout)
        const response = await Promise.race([
          responsePromise,
          new Promise<ResponseContent>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 30000)
          ),
        ]);

        // Return response
        return res.json({
          messageId,
          response: response.text,
          richContent: response.richContent,
          metadata: response.metadata,
        });
      } catch (error) {
        console.error("API error:", error);

        // Handle timeout
        if (error instanceof Error && error.message === "Timeout") {
          return res.status(504).json({
            error: "Request timeout - agent took too long to respond",
          });
        }

        return res.status(500).json({
          error: error instanceof Error ? error.message : "Internal server error",
        });
      }
    });

    // GET /api/health - Health check
    this.app.get("/api/health", (_req: Request, res: Response) => {
      res.json({
        status: "ok",
        channel: "api",
        connected: this.connected,
        timestamp: new Date().toISOString(),
      });
    });

    // GET /api/agents - List available agents (future)
    this.app.get("/api/agents", (_req: Request, res: Response) => {
      res.json({
        agents: ["default"],
      });
    });
  }
}
