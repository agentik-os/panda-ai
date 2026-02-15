# API Channel Adapter - Implementation Plan

**Step:** step-028
**Estimated Hours:** 16h
**Depends On:** step-021 (Pipeline Orchestrator)
**Status:** Planning

---

## Overview

The API channel adapter provides a REST API for external systems to send messages to agents and receive responses. This enables integrations with webhooks, custom UIs, mobile apps, and third-party services.

---

## Technical Design

### Libraries

```bash
pnpm add express cors helmet express-rate-limit
```

- **express** - HTTP server framework
- **cors** - Cross-origin resource sharing
- **helmet** - Security headers
- **express-rate-limit** - DDoS protection

### Architecture

```
External System (HTTP Client)
     ↓
POST /api/message
     ↓
API Channel (express route)
     ↓
RawMessage → Pipeline
     ↓
Agent Response
     ↓
HTTP 200 + JSON response
     ↓
External System
```

### Implementation Files

- `packages/runtime/src/channels/api.ts` - Channel adapter
- `packages/runtime/src/api/routes.ts` - Express routes
- `packages/runtime/src/api/middleware.ts` - Auth, validation, rate limiting

---

## Interface Implementation

```typescript
import type { ChannelAdapter, ChannelConfig, RawMessage, ResponseContent } from "@agentik-os/shared";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

export class APIChannel implements ChannelAdapter {
  readonly name = "api" as const;
  private app: Express;
  private server?: ReturnType<typeof import("http").createServer>;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private pendingResponses = new Map<string, (response: ResponseContent) => void>();

  constructor() {
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  async connect(config: ChannelConfig): Promise<void> {
    const port = (config.options.port as number) || 3000;

    return new Promise((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`API Channel listening on port ${port}`);
        this.connected = true;
        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.server) {
      await new Promise((resolve) => this.server?.close(resolve));
    }
    this.connected = false;
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    // Resolve pending HTTP response
    const resolver = this.pendingResponses.get(to);
    if (resolver) {
      resolver(content);
      this.pendingResponses.delete(to);
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    // Return file as base64 in JSON response
    const resolver = this.pendingResponses.get(to);
    if (resolver) {
      resolver({
        text: caption || "",
        richContent: [
          {
            type: "file",
            data: {
              base64: file.toString("base64"),
              mimeType: "application/octet-stream",
            },
          },
        ],
      });
      this.pendingResponses.delete(to);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  private setupMiddleware() {
    this.app.use(helmet());
    this.app.use(cors());
    this.app.use(express.json({ limit: "10mb" }));

    // Rate limiting: 100 requests per 15 minutes
    this.app.use(
      rateLimit({
        windowMs: 15 * 60 * 1000,
        max: 100,
        message: "Too many requests, please try again later.",
      })
    );
  }

  private setupRoutes() {
    // POST /api/message - Send message to agent
    this.app.post("/api/message", async (req: Request, res: Response) => {
      try {
        const { userId, agentId, content, attachments } = req.body;

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
        this.messageHandler?.(rawMessage);

        // Wait for agent response (with timeout)
        const response = await Promise.race([
          responsePromise,
          new Promise<ResponseContent>((_, reject) =>
            setTimeout(() => reject(new Error("Timeout")), 30000)
          ),
        ]);

        // Return response
        res.json({
          messageId,
          response: response.text,
          richContent: response.richContent,
          metadata: response.metadata,
        });
      } catch (error) {
        console.error("API error:", error);
        res.status(500).json({
          error: error instanceof Error ? error.message : "Internal server error",
        });
      }
    });

    // GET /api/health - Health check
    this.app.get("/api/health", (req: Request, res: Response) => {
      res.json({
        status: "ok",
        channel: "api",
        connected: this.connected,
      });
    });

    // GET /api/agents - List available agents (future)
    this.app.get("/api/agents", (req: Request, res: Response) => {
      res.json({
        agents: ["default"],
      });
    });
  }
}
```

---

## API Endpoints

### POST /api/message

Send a message to an agent and receive a response.

**Request:**
```json
{
  "userId": "user_123",
  "agentId": "default",
  "content": "Hello, what's the weather?",
  "attachments": [
    {
      "type": "image",
      "url": "https://example.com/image.png"
    }
  ]
}
```

**Response:**
```json
{
  "messageId": "api_1234567890_abc123",
  "response": "The weather is sunny today!",
  "richContent": [],
  "metadata": {}
}
```

### GET /api/health

Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "channel": "api",
  "connected": true
}
```

### GET /api/agents

List available agents (future).

**Response:**
```json
{
  "agents": ["default", "nova", "ralph"]
}
```

---

## Configuration

```json
{
  "type": "api",
  "options": {
    "port": 3000,
    "cors": {
      "origin": "*",
      "credentials": true
    },
    "rateLimit": {
      "windowMs": 900000,
      "max": 100
    },
    "timeout": 30000
  },
  "enabled": true
}
```

---

## Security

### Authentication (Future)

```typescript
// API key middleware
function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || !isValidApiKey(apiKey)) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}

this.app.use("/api/message", requireApiKey);
```

### Rate Limiting

- 100 requests per 15 minutes per IP
- Returns 429 Too Many Requests if exceeded
- Prevents DDoS attacks

### Input Validation

- Required fields: userId, content
- Content length limit: 10,000 characters
- Attachment size limit: 10MB total

---

## Testing

### Unit Tests (`api.test.ts`)

```typescript
describe("APIChannel", () => {
  it("should implement ChannelAdapter interface", () => {});
  it("should start HTTP server on connect", () => {});
  it("should handle POST /api/message", () => {});
  it("should return agent response within timeout", () => {});
  it("should handle missing required fields", () => {});
  it("should respect rate limiting", () => {});
  it("should handle health check", () => {});
});
```

### Integration Tests

```bash
# Start server
panda api start

# Send message
curl -X POST http://localhost:3000/api/message \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "test_user",
    "content": "Hello"
  }'

# Health check
curl http://localhost:3000/api/health
```

---

## Error Handling

| Error | Status | Response |
|-------|--------|----------|
| Missing fields | 400 | `{ error: "Missing required fields" }` |
| Invalid JSON | 400 | `{ error: "Invalid JSON" }` |
| Agent timeout | 500 | `{ error: "Timeout" }` |
| Rate limit exceeded | 429 | `{ error: "Too many requests" }` |
| Internal error | 500 | `{ error: "Internal server error" }` |

---

## Use Cases

1. **Custom Web UI**: Frontend app sends messages via API
2. **Mobile App**: React Native app integrates with API
3. **Webhook Integration**: External service sends events
4. **Zapier/Make.com**: Automation workflows
5. **Testing**: Automated test scripts

---

## Dependencies

**Blocks:**
- Dashboard WebSocket connection
- External integrations
- Mobile app backend

**Blocked By:**
- Step-021 (Pipeline Orchestrator) - MUST complete first

---

## Implementation Checklist

- [ ] Create `packages/runtime/src/channels/api.ts`
- [ ] Implement ChannelAdapter interface
- [ ] Set up Express server with middleware
- [ ] Create /api/message endpoint
- [ ] Handle timeouts and pending responses
- [ ] Add rate limiting and security
- [ ] Create `api.test.ts`
- [ ] Write unit and integration tests
- [ ] Update channels/index.ts export
- [ ] Document API in README
- [ ] Add OpenAPI/Swagger spec (future)

---

**Estimated Time:** 16 hours
**Ready to implement:** When step-021 completes ✅
