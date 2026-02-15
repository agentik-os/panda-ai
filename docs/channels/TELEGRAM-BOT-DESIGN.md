# Telegram Bot Integration - Implementation Plan

**Step:** step-056
**Estimated Hours:** 14h
**Depends On:** step-028 (API Channel Adapter)
**Status:** Planning

---

## Overview

The Telegram bot integration enables users to interact with Agentik OS agents through Telegram. This provides a familiar, mobile-friendly interface with rich media support and broad user accessibility.

---

## Technical Design

### Libraries

```bash
pnpm add telegraf
pnpm add -D @types/node
```

**Why Telegraf:**
- Modern, TypeScript-friendly
- Built-in webhook support
- Scene management for complex flows
- Middleware architecture (similar to Express)
- Active maintenance (last update: 2024)
- Better than `node-telegram-bot-api` (outdated)

### Architecture

```
Telegram User
     ↓
Telegram API (receives message)
     ↓
Webhook → TelegramChannel.handleUpdate()
     ↓
RawMessage → Pipeline
     ↓
Agent Response
     ↓
TelegramChannel.send() → bot.telegram.sendMessage()
     ↓
Telegram User receives response
```

### Implementation Files

- `packages/runtime/src/channels/telegram.ts` - Channel adapter
- `packages/runtime/src/channels/telegram.test.ts` - Unit tests
- `docs/channels/TELEGRAM-BOT-SETUP.md` - User guide (BotFather setup)

---

## Authentication

### Bot Token

**Obtained from:** [@BotFather](https://t.me/BotFather) on Telegram

**Commands:**
```
/newbot → Create new bot → Receive token
/setdescription → Set bot description
/setabouttext → Set about text
/setuserpic → Upload bot avatar
```

**Token format:** `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

**Storage:**
```typescript
// In channel config
{
  type: "telegram",
  options: {
    botToken: process.env.TELEGRAM_BOT_TOKEN,
    webhookUrl: "https://yourdomain.com/api/telegram/webhook",
    // OR for local dev:
    usePolling: true // Long-polling instead of webhook
  },
  enabled: true
}
```

### Webhook vs Long-Polling

| Method | Production | Development | Advantages | Disadvantages |
|--------|-----------|-------------|------------|---------------|
| **Webhook** | ✅ Recommended | ❌ Complex | Fast, scalable, efficient | Requires HTTPS, public URL |
| **Long-polling** | ❌ Not scalable | ✅ Easy | No setup, works locally | Slower, polling overhead |

**Decision:**
- Production: Webhook (via ngrok for staging, real domain for prod)
- Development: Long-polling (easier local testing)

---

## Message Format Conversion

### Telegram Message → Agentik RawMessage

```typescript
async function telegramToRawMessage(ctx: Context): Promise<RawMessage> {
  const message = ctx.message;

  return {
    channel: "telegram",
    channelMessageId: message.message_id.toString(),
    userId: message.from.id.toString(),
    content: message.text || message.caption || "",
    attachments: await extractAttachments(message),
    timestamp: new Date(message.date * 1000),
    raw: message, // Full Telegram message for channel-specific features
  };
}

async function extractAttachments(message: any): Promise<Attachment[]> {
  const attachments: Attachment[] = [];

  // Photo
  if (message.photo) {
    const largest = message.photo[message.photo.length - 1];
    attachments.push({
      type: "image",
      url: await getFileUrl(largest.file_id),
      metadata: { file_id: largest.file_id, width: largest.width, height: largest.height },
    });
  }

  // Document
  if (message.document) {
    attachments.push({
      type: "file",
      url: await getFileUrl(message.document.file_id),
      metadata: {
        file_id: message.document.file_id,
        file_name: message.document.file_name,
        mime_type: message.document.mime_type,
        file_size: message.document.file_size,
      },
    });
  }

  // Voice
  if (message.voice) {
    attachments.push({
      type: "audio",
      url: await getFileUrl(message.voice.file_id),
      metadata: {
        file_id: message.voice.file_id,
        duration: message.voice.duration,
        mime_type: message.voice.mime_type,
      },
    });
  }

  // Video
  if (message.video) {
    attachments.push({
      type: "video",
      url: await getFileUrl(message.video.file_id),
      metadata: {
        file_id: message.video.file_id,
        duration: message.video.duration,
        width: message.video.width,
        height: message.video.height,
      },
    });
  }

  return attachments;
}
```

### Agentik ResponseContent → Telegram Message

```typescript
async function sendResponse(chatId: number, content: ResponseContent) {
  // Send text
  await bot.telegram.sendMessage(chatId, content.text, {
    parse_mode: "Markdown", // Support **bold**, *italic*, `code`
  });

  // Send rich content
  if (content.richContent) {
    for (const item of content.richContent) {
      switch (item.type) {
        case "button":
          await bot.telegram.sendMessage(chatId, item.data.text, {
            reply_markup: {
              inline_keyboard: [[{
                text: item.data.label,
                callback_data: item.data.action,
              }]],
            },
          });
          break;

        case "image":
          await bot.telegram.sendPhoto(chatId, item.data.url, {
            caption: item.data.caption,
          });
          break;

        case "card":
          await bot.telegram.sendMessage(chatId,
            `*${item.data.title}*\n\n${item.data.description}`,
            { parse_mode: "Markdown" }
          );
          break;
      }
    }
  }
}
```

---

## Event Handling

### Commands

```typescript
// /start - Welcome new users
bot.command("start", async (ctx) => {
  await ctx.reply(
    "👋 Welcome to Agentik OS!\n\n" +
    "I'm your AI agent assistant. You can:\n" +
    "• Send me any message to chat\n" +
    "• /help - View available commands\n" +
    "• /agent [name] - Switch to a different agent\n\n" +
    "Try saying: 'Hello!'"
  );
});

// /help - Show available commands
bot.command("help", async (ctx) => {
  await ctx.reply(
    "*Available Commands:*\n\n" +
    "/start - Get started\n" +
    "/help - Show this help\n" +
    "/agent [name] - Switch agent\n" +
    "/clear - Clear conversation history\n" +
    "/status - Show current agent",
    { parse_mode: "Markdown" }
  );
});

// /agent - Switch active agent
bot.command("agent", async (ctx) => {
  const agentName = ctx.message.text.split(" ")[1];

  if (!agentName) {
    await ctx.reply("Usage: /agent <name>\n\nExample: /agent ralph");
    return;
  }

  // Store agent preference in user state
  await setUserAgent(ctx.from.id, agentName);
  await ctx.reply(`✅ Switched to agent: ${agentName}`);
});

// /clear - Clear conversation history
bot.command("clear", async (ctx) => {
  await clearUserHistory(ctx.from.id);
  await ctx.reply("🗑️ Conversation history cleared!");
});

// /status - Show current agent
bot.command("status", async (ctx) => {
  const currentAgent = await getUserAgent(ctx.from.id);
  await ctx.reply(`🤖 Current agent: ${currentAgent || "default"}`);
});
```

### Message Handling

```typescript
// Regular text messages
bot.on("text", async (ctx) => {
  // Show typing indicator
  await ctx.sendChatAction("typing");

  // Convert to RawMessage
  const rawMessage = await telegramToRawMessage(ctx);

  // Send to pipeline
  await this.messageHandler(rawMessage);

  // Response is sent via send() callback from pipeline
});

// Photo messages
bot.on("photo", async (ctx) => {
  await ctx.sendChatAction("typing");
  const rawMessage = await telegramToRawMessage(ctx);
  await this.messageHandler(rawMessage);
});

// Document messages
bot.on("document", async (ctx) => {
  await ctx.sendChatAction("upload_document");
  const rawMessage = await telegramToRawMessage(ctx);
  await this.messageHandler(rawMessage);
});

// Voice messages
bot.on("voice", async (ctx) => {
  await ctx.sendChatAction("typing");
  const rawMessage = await telegramToRawMessage(ctx);
  await this.messageHandler(rawMessage);
});
```

### Callback Queries (Inline Buttons)

```typescript
// Handle inline button clicks
bot.on("callback_query", async (ctx) => {
  const data = ctx.callbackQuery.data;

  // Parse button action
  const action = JSON.parse(data);

  // Execute action (e.g., "confirm_order", "cancel", etc.)
  await handleAction(ctx, action);

  // Answer callback query (removes loading state)
  await ctx.answerCbQuery("✅ Action completed!");
});
```

---

## Rate Limiting

### Telegram Limits

| Limit Type | Value | Scope |
|------------|-------|-------|
| Messages per second | 30 | Per chat |
| Messages per second | 1 | To different chats (broadcast) |
| Group messages | 20/min | Per group |

**Source:** [Telegram Bot API Limits](https://core.telegram.org/bots/faq#my-bot-is-hitting-limits-how-do-i-avoid-this)

### Queue Management

```typescript
class TelegramRateLimiter {
  private queues = new Map<number, MessageQueue>();

  async sendMessage(chatId: number, ...args: any[]) {
    const queue = this.getOrCreateQueue(chatId);

    return queue.enqueue(async () => {
      await bot.telegram.sendMessage(chatId, ...args);
      await this.delay(34); // 30 msg/sec = ~33ms per message, add buffer
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
```

### Retry Logic with Exponential Backoff

```typescript
async function sendWithRetry(fn: () => Promise<any>, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.response?.error_code === 429) {
        // Rate limit hit
        const retryAfter = error.response.parameters?.retry_after || Math.pow(2, i);
        console.log(`Rate limited. Retrying after ${retryAfter}s...`);
        await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
      } else {
        throw error; // Non-retryable error
      }
    }
  }
  throw new Error("Max retries exceeded");
}
```

---

## Error Recovery

### Error Types

```typescript
enum TelegramErrorType {
  RATE_LIMIT = 429,
  FORBIDDEN = 403, // User blocked the bot
  BAD_REQUEST = 400, // Invalid request
  UNAUTHORIZED = 401, // Invalid token
  NOT_FOUND = 404, // Chat not found
}

async function handleError(error: any, ctx: Context) {
  const code = error.response?.error_code;

  switch (code) {
    case TelegramErrorType.RATE_LIMIT:
      // Handled by retry logic
      break;

    case TelegramErrorType.FORBIDDEN:
      // User blocked bot - remove from active users
      await deactivateUser(ctx.from.id);
      console.log(`User ${ctx.from.id} blocked the bot`);
      break;

    case TelegramErrorType.BAD_REQUEST:
      // Log error, notify user
      await ctx.reply("❌ Sorry, I couldn't process that. Please try again.");
      console.error("Bad request:", error.message);
      break;

    case TelegramErrorType.UNAUTHORIZED:
      // Critical: Invalid bot token
      console.error("CRITICAL: Invalid bot token!");
      process.exit(1);
      break;

    default:
      // Unknown error
      console.error("Telegram error:", error);
      await ctx.reply("❌ An error occurred. Please try again later.");
  }
}
```

### Graceful Degradation

```typescript
// If message is too long, split it
async function sendLongMessage(chatId: number, text: string) {
  const MAX_LENGTH = 4096; // Telegram limit

  if (text.length <= MAX_LENGTH) {
    await bot.telegram.sendMessage(chatId, text);
    return;
  }

  // Split by paragraphs
  const chunks = splitText(text, MAX_LENGTH);

  for (const chunk of chunks) {
    await bot.telegram.sendMessage(chatId, chunk);
    await delay(100); // Small delay between chunks
  }
}

function splitText(text: string, maxLength: number): string[] {
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of text.split("\n\n")) {
    if ((current + paragraph).length > maxLength) {
      chunks.push(current.trim());
      current = paragraph;
    } else {
      current += "\n\n" + paragraph;
    }
  }

  if (current) chunks.push(current.trim());
  return chunks;
}
```

---

## Implementation Plan

### Class Structure

```typescript
export class TelegramChannel implements ChannelAdapter {
  readonly name = "telegram" as const;

  private bot: Telegraf;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private rateLimiter: TelegramRateLimiter;
  private userStates = new Map<number, UserState>(); // chat_id → state

  constructor() {
    // Bot initialized in connect()
  }

  async connect(config: ChannelConfig): Promise<void> {
    const token = config.options.botToken as string;

    if (!token) {
      throw new Error("Telegram bot token is required");
    }

    this.bot = new Telegraf(token);
    this.rateLimiter = new TelegramRateLimiter();

    this.setupHandlers();

    if (config.options.usePolling) {
      // Development: Long-polling
      await this.bot.launch();
    } else {
      // Production: Webhook
      const webhookUrl = config.options.webhookUrl as string;
      await this.bot.telegram.setWebhook(webhookUrl);
    }

    this.connected = true;
    console.log("✅ Telegram bot connected");
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      this.bot.stop();
    }
    this.connected = false;
    console.log("👋 Telegram bot disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    const chatId = parseInt(to);
    await this.rateLimiter.sendMessage(chatId, content.text, {
      parse_mode: "Markdown",
    });

    // Send rich content
    if (content.richContent) {
      for (const item of content.richContent) {
        await this.sendRichContent(chatId, item);
      }
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    const chatId = parseInt(to);
    await this.bot.telegram.sendDocument(chatId, {
      source: file,
      filename: caption || "file",
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  private setupHandlers() {
    // Commands
    this.bot.command("start", async (ctx) => { /* ... */ });
    this.bot.command("help", async (ctx) => { /* ... */ });
    this.bot.command("agent", async (ctx) => { /* ... */ });

    // Messages
    this.bot.on("text", async (ctx) => {
      const rawMessage = await this.telegramToRawMessage(ctx);
      await this.messageHandler?.(rawMessage);
    });

    // Error handling
    this.bot.catch(async (error, ctx) => {
      await this.handleError(error, ctx);
    });
  }
}
```

---

## Test Strategy

### Unit Tests (`telegram.test.ts`)

```typescript
describe("TelegramChannel", () => {
  describe("ChannelAdapter interface", () => {
    it("should have name 'telegram'");
    it("should implement isConnected");
    it("should connect with bot token");
    it("should connect with polling mode");
    it("should connect with webhook mode");
    it("should disconnect successfully");
    it("should register message handler");
  });

  describe("Message conversion", () => {
    it("should convert text message to RawMessage");
    it("should convert photo message to RawMessage");
    it("should convert document to RawMessage");
    it("should convert voice to RawMessage");
    it("should extract multiple attachments");
  });

  describe("Command handling", () => {
    it("should handle /start command");
    it("should handle /help command");
    it("should handle /agent command");
    it("should handle /clear command");
    it("should handle /status command");
  });

  describe("Response sending", () => {
    it("should send text response");
    it("should send markdown-formatted text");
    it("should send rich content (buttons)");
    it("should send rich content (images)");
    it("should split long messages");
  });

  describe("Rate limiting", () => {
    it("should respect 30 msg/sec limit");
    it("should queue messages for same chat");
    it("should retry on 429 error");
    it("should use exponential backoff");
  });

  describe("Error handling", () => {
    it("should handle user blocking bot (403)");
    it("should handle invalid token (401)");
    it("should handle bad request (400)");
    it("should gracefully degrade on errors");
  });
});
```

### Integration Tests

```typescript
// Use test bot token from BotFather
describe("TelegramChannel Integration", () => {
  it("should receive and respond to messages");
  it("should handle inline button callbacks");
  it("should download and process file attachments");
  it("should send photos with captions");
});
```

---

## Security Considerations

### Bot Token Protection

```typescript
// NEVER commit bot token to git
// Use environment variables
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

if (!BOT_TOKEN) {
  throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}
```

### Webhook Validation

```typescript
// Verify webhook requests are from Telegram
function verifyWebhook(req: Request): boolean {
  const secret = crypto
    .createHash("sha256")
    .update(BOT_TOKEN)
    .digest();

  const checkString = [
    req.headers["x-telegram-bot-api-secret-token"],
  ].join("\n");

  const signature = crypto
    .createHmac("sha256", secret)
    .update(checkString)
    .digest("hex");

  return signature === req.headers["x-telegram-bot-api-signature"];
}
```

### User Input Validation

```typescript
// Sanitize user input before processing
function sanitizeInput(text: string): string {
  // Remove control characters
  return text.replace(/[\x00-\x1F\x7F-\x9F]/g, "");
}

// Validate file uploads
function validateFile(file: any): boolean {
  const MAX_SIZE = 50 * 1024 * 1024; // 50MB (Telegram limit)
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

  if (file.file_size > MAX_SIZE) {
    throw new Error("File too large");
  }

  if (!ALLOWED_TYPES.includes(file.mime_type)) {
    throw new Error("File type not allowed");
  }

  return true;
}
```

---

## User State Management

### Storing User Preferences

```typescript
interface UserState {
  chatId: number;
  userId: number;
  currentAgent: string;
  conversationHistory: string[];
  preferences: {
    language: string;
    notificationsEnabled: boolean;
  };
}

// Store in Convex database
async function getUserState(userId: number): Promise<UserState> {
  return await ctx.db
    .query("telegram_users")
    .filter((q) => q.eq(q.field("userId"), userId))
    .first();
}

async function setUserAgent(userId: number, agentName: string) {
  await ctx.db.patch(userStateId, {
    currentAgent: agentName,
  });
}
```

---

## Deployment

### Environment Variables

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_WEBHOOK_URL=https://yourdomain.com/api/telegram/webhook
TELEGRAM_USE_POLLING=false # true for development
```

### Webhook Setup (Production)

```typescript
// Set webhook on startup
await bot.telegram.setWebhook(WEBHOOK_URL, {
  allowed_updates: ["message", "callback_query"],
  drop_pending_updates: true, // Clear old updates on restart
});

// Verify webhook is set
const webhookInfo = await bot.telegram.getWebhookInfo();
console.log("Webhook:", webhookInfo.url);
```

### Health Check

```typescript
// GET /api/telegram/health
app.get("/api/telegram/health", async (req, res) => {
  try {
    const me = await bot.telegram.getMe();
    const webhookInfo = await bot.telegram.getWebhookInfo();

    res.json({
      status: "ok",
      bot: {
        id: me.id,
        username: me.username,
        name: me.first_name,
      },
      webhook: {
        url: webhookInfo.url,
        pending_updates: webhookInfo.pending_update_count,
        last_error: webhookInfo.last_error_message,
      },
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      error: error.message,
    });
  }
});
```

---

## Dependencies

**Blocks:**
- User-facing Telegram bot interface
- Mobile-first agent interactions
- Group chat integrations

**Blocked By:**
- Step-028 (API Channel Adapter) - MUST complete first

---

## Implementation Checklist

- [ ] Install telegraf dependency
- [ ] Create `TelegramChannel` class implementing `ChannelAdapter`
- [ ] Implement message format conversion (Telegram ↔ Agentik)
- [ ] Set up command handlers (/start, /help, /agent, /clear, /status)
- [ ] Implement message handlers (text, photo, document, voice)
- [ ] Add callback query handling (inline buttons)
- [ ] Implement rate limiting (30 msg/sec per chat)
- [ ] Add retry logic with exponential backoff
- [ ] Implement error recovery (403, 429, 400, 401)
- [ ] Add long message splitting (4096 char limit)
- [ ] Create `telegram.test.ts` with 15+ tests
- [ ] Set up webhook validation
- [ ] Add user state management (Convex)
- [ ] Update channels/index.ts export
- [ ] Document setup in TELEGRAM-BOT-SETUP.md
- [ ] Create health check endpoint

---

**Estimated Time:** 14 hours
**Ready to implement:** When step-028 completes ✅

**Velocity target:** 3.5 hours at 4x velocity 🚀
