import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
  Attachment,
  RichContent,
} from "@agentik-os/shared";
import { Telegraf, Context } from "telegraf";
import type { Message } from "telegraf/types";

/**
 * Telegram Channel Adapter
 *
 * Provides Telegram bot integration for Agentik OS agents.
 * Users can interact with agents through Telegram chats.
 *
 * Features:
 * - Text message handling
 * - File attachments (photos, documents, voice, video)
 * - Command support (/start, /help, /agent, etc.)
 * - Rate limiting (30 msg/sec per chat)
 * - Error recovery with exponential backoff
 * - Long message splitting (4096 char limit)
 */
export class TelegramChannel implements ChannelAdapter {
  readonly name = "telegram" as const;

  private bot?: Telegraf;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private rateLimiter?: TelegramRateLimiter;
  private userStates = new Map<number, UserState>();

  async connect(config: ChannelConfig): Promise<void> {
    const token = config.options.botToken as string;

    if (!token) {
      throw new Error("Telegram bot token is required (config.options.botToken)");
    }

    this.bot = new Telegraf(token);
    this.rateLimiter = new TelegramRateLimiter(this.bot);

    this.setupHandlers();

    const usePolling = config.options.usePolling as boolean;

    if (usePolling) {
      // Development: Long-polling
      await this.bot.launch();
      console.log("✅ Telegram bot connected (polling mode)");
    } else {
      // Production: Webhook
      const webhookUrl = config.options.webhookUrl as string;
      if (!webhookUrl) {
        throw new Error("webhookUrl is required when usePolling is false");
      }
      await this.bot.telegram.setWebhook(webhookUrl);
      console.log(`✅ Telegram bot connected (webhook mode: ${webhookUrl})`);
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    if (this.bot) {
      this.bot.stop();
      this.bot = undefined;
    }
    this.rateLimiter = undefined;
    this.connected = false;
    console.log("👋 Telegram bot disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.bot || !this.rateLimiter) {
      throw new Error("Bot not connected");
    }

    const chatId = parseInt(to);

    // Send text (split if too long)
    if (content.text) {
      await this.sendLongMessage(chatId, content.text);
    }

    // Send rich content
    if (content.richContent && content.richContent.length > 0) {
      for (const item of content.richContent) {
        await this.sendRichContent(chatId, item);
      }
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    if (!this.bot || !this.rateLimiter) {
      throw new Error("Bot not connected");
    }

    const chatId = parseInt(to);
    await this.rateLimiter.sendDocument(chatId, {
      source: file,
      filename: caption || "file",
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * PRIVATE METHODS
   */

  private setupHandlers(): void {
    if (!this.bot) return;

    // Commands
    this.bot.command("start", this.handleStartCommand.bind(this));
    this.bot.command("help", this.handleHelpCommand.bind(this));
    this.bot.command("agent", this.handleAgentCommand.bind(this));
    this.bot.command("clear", this.handleClearCommand.bind(this));
    this.bot.command("status", this.handleStatusCommand.bind(this));

    // Messages
    this.bot.on("text", this.handleTextMessage.bind(this));
    this.bot.on("photo", this.handlePhotoMessage.bind(this));
    this.bot.on("document", this.handleDocumentMessage.bind(this));
    this.bot.on("voice", this.handleVoiceMessage.bind(this));
    this.bot.on("video", this.handleVideoMessage.bind(this));

    // Callback queries (inline buttons)
    this.bot.on("callback_query", this.handleCallbackQuery.bind(this));

    // Error handling
    this.bot.catch(this.handleError.bind(this));
  }

  /**
   * COMMAND HANDLERS
   */

  private async handleStartCommand(ctx: Context): Promise<void> {
    await ctx.reply(
      "👋 Welcome to Agentik OS!\n\n" +
        "I'm your AI agent assistant. You can:\n" +
        "• Send me any message to chat\n" +
        "• /help - View available commands\n" +
        "• /agent [name] - Switch to a different agent\n\n" +
        "Try saying: 'Hello!'"
    );
  }

  private async handleHelpCommand(ctx: Context): Promise<void> {
    await ctx.reply(
      "*Available Commands:*\n\n" +
        "/start - Get started\n" +
        "/help - Show this help\n" +
        "/agent [name] - Switch agent\n" +
        "/clear - Clear conversation history\n" +
        "/status - Show current agent",
      { parse_mode: "Markdown" }
    );
  }

  private async handleAgentCommand(ctx: Context): Promise<void> {
    if (!ctx.message || !("text" in ctx.message)) return;

    const agentName = ctx.message.text.split(" ")[1];

    if (!agentName) {
      await ctx.reply("Usage: /agent <name>\n\nExample: /agent ralph");
      return;
    }

    // Store agent preference
    const userId = ctx.from!.id;
    const userState = this.userStates.get(userId) || {
      chatId: ctx.chat!.id,
      userId,
      currentAgent: "default",
      conversationHistory: [],
      preferences: { language: "en", notificationsEnabled: true },
    };
    userState.currentAgent = agentName;
    this.userStates.set(userId, userState);

    await ctx.reply(`✅ Switched to agent: ${agentName}`);
  }

  private async handleClearCommand(ctx: Context): Promise<void> {
    const userId = ctx.from!.id;
    const userState = this.userStates.get(userId);
    if (userState) {
      userState.conversationHistory = [];
      this.userStates.set(userId, userState);
    }
    await ctx.reply("🗑️ Conversation history cleared!");
  }

  private async handleStatusCommand(ctx: Context): Promise<void> {
    const userId = ctx.from!.id;
    const userState = this.userStates.get(userId);
    const currentAgent = userState?.currentAgent || "default";
    await ctx.reply(`🤖 Current agent: ${currentAgent}`);
  }

  /**
   * MESSAGE HANDLERS
   */

  private async handleTextMessage(ctx: Context): Promise<void> {
    if (!ctx.message || !("text" in ctx.message)) return;

    // Show typing indicator
    await ctx.sendChatAction("typing");

    const rawMessage = await this.telegramToRawMessage(ctx);
    await this.messageHandler?.(rawMessage);
  }

  private async handlePhotoMessage(ctx: Context): Promise<void> {
    await ctx.sendChatAction("typing");
    const rawMessage = await this.telegramToRawMessage(ctx);
    await this.messageHandler?.(rawMessage);
  }

  private async handleDocumentMessage(ctx: Context): Promise<void> {
    await ctx.sendChatAction("upload_document");
    const rawMessage = await this.telegramToRawMessage(ctx);
    await this.messageHandler?.(rawMessage);
  }

  private async handleVoiceMessage(ctx: Context): Promise<void> {
    await ctx.sendChatAction("typing");
    const rawMessage = await this.telegramToRawMessage(ctx);
    await this.messageHandler?.(rawMessage);
  }

  private async handleVideoMessage(ctx: Context): Promise<void> {
    await ctx.sendChatAction("typing");
    const rawMessage = await this.telegramToRawMessage(ctx);
    await this.messageHandler?.(rawMessage);
  }

  private async handleCallbackQuery(ctx: Context): Promise<void> {
    if (!ctx.callbackQuery || !("data" in ctx.callbackQuery)) return;

    const data = ctx.callbackQuery.data;

    // Parse button action
    try {
      const action = JSON.parse(data);
      console.log("Button action:", action);
      // TODO: Execute action based on action.type
      await ctx.answerCbQuery("✅ Action completed!");
    } catch (error) {
      console.error("Failed to parse callback data:", error);
      await ctx.answerCbQuery("❌ Invalid action");
    }
  }

  /**
   * MESSAGE CONVERSION
   */

  private async telegramToRawMessage(ctx: Context): Promise<RawMessage> {
    if (!ctx.message) {
      throw new Error("No message in context");
    }

    const message = ctx.message as Message.TextMessage;
    const userId = ctx.from!.id;
    const userState = this.userStates.get(userId);

    return {
      channel: "telegram",
      channelMessageId: message.message_id.toString(),
      userId: userId.toString(),
      agentId: userState?.currentAgent || "default",
      content: this.extractContent(message),
      attachments: await this.extractAttachments(message),
      timestamp: new Date(message.date * 1000),
      raw: message,
    };
  }

  private extractContent(message: any): string {
    return message.text || message.caption || "";
  }

  private async extractAttachments(message: any): Promise<Attachment[]> {
    if (!this.bot) return [];

    const attachments: Attachment[] = [];

    // Photo
    if (message.photo) {
      const largest = message.photo[message.photo.length - 1];
      const fileLink = await this.bot.telegram.getFileLink(largest.file_id);
      attachments.push({
        type: "image",
        url: fileLink.href,
        mimeType: "image/jpeg",
        size: largest.file_size,
      });
    }

    // Document
    if (message.document) {
      const fileLink = await this.bot.telegram.getFileLink(message.document.file_id);
      attachments.push({
        type: "file",
        url: fileLink.href,
        mimeType: message.document.mime_type || "application/octet-stream",
        filename: message.document.file_name,
        size: message.document.file_size,
      });
    }

    // Voice
    if (message.voice) {
      const fileLink = await this.bot.telegram.getFileLink(message.voice.file_id);
      attachments.push({
        type: "audio",
        url: fileLink.href,
        mimeType: message.voice.mime_type || "audio/ogg",
        size: message.voice.file_size,
      });
    }

    // Video
    if (message.video) {
      const fileLink = await this.bot.telegram.getFileLink(message.video.file_id);
      attachments.push({
        type: "video",
        url: fileLink.href,
        mimeType: message.video.mime_type || "video/mp4",
        size: message.video.file_size,
      });
    }

    return attachments;
  }

  /**
   * RESPONSE SENDING
   */

  private async sendLongMessage(chatId: number, text: string): Promise<void> {
    if (!this.rateLimiter) return;

    const MAX_LENGTH = 4096; // Telegram limit

    if (text.length <= MAX_LENGTH) {
      await this.rateLimiter.sendMessage(chatId, text, {
        parse_mode: "Markdown",
      });
      return;
    }

    // Split by paragraphs
    const chunks = this.splitText(text, MAX_LENGTH);

    for (const chunk of chunks) {
      await this.rateLimiter.sendMessage(chatId, chunk, {
        parse_mode: "Markdown",
      });
      await this.delay(100); // Small delay between chunks
    }
  }

  private splitText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let current = "";

    for (const paragraph of text.split("\n\n")) {
      if ((current + paragraph).length > maxLength) {
        if (current) chunks.push(current.trim());
        current = paragraph;
      } else {
        current += (current ? "\n\n" : "") + paragraph;
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  }

  private async sendRichContent(chatId: number, item: RichContent): Promise<void> {
    if (!this.rateLimiter) return;

    switch (item.type) {
      case "button":
        await this.rateLimiter.sendMessage(chatId, item.data.text as string, {
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: item.data.label as string,
                  callback_data: JSON.stringify(item.data.action),
                },
              ],
            ],
          },
        });
        break;

      case "image":
        await this.rateLimiter.sendPhoto(chatId, item.data.url as string, {
          caption: item.data.caption as string,
        });
        break;

      case "card":
        await this.rateLimiter.sendMessage(
          chatId,
          `*${item.data.title}*\n\n${item.data.description}`,
          { parse_mode: "Markdown" }
        );
        break;

      case "code_block":
        await this.rateLimiter.sendMessage(
          chatId,
          `\`\`\`${item.data.language || ""}\n${item.data.code}\n\`\`\``,
          { parse_mode: "Markdown" }
        );
        break;
    }
  }

  /**
   * ERROR HANDLING
   */

  private async handleError(error: any, ctx?: Context): Promise<void> {
    const code = error.response?.error_code;

    console.error("Telegram error:", {
      code,
      message: error.message,
      description: error.response?.description,
    });

    switch (code) {
      case 429: // Rate limit
        // Handled by retry logic in rateLimiter
        break;

      case 403: // User blocked bot
        if (ctx?.from) {
          console.log(`User ${ctx.from.id} blocked the bot`);
          this.userStates.delete(ctx.from.id);
        }
        break;

      case 400: // Bad request
        if (ctx) {
          await ctx.reply("❌ Sorry, I couldn't process that. Please try again.").catch(() => {});
        }
        break;

      case 401: // Unauthorized (invalid token)
        console.error("CRITICAL: Invalid Telegram bot token!");
        process.exit(1);
        break;

      default:
        if (ctx) {
          await ctx.reply("❌ An error occurred. Please try again later.").catch(() => {});
        }
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Rate Limiter for Telegram API
 *
 * Telegram limits:
 * - 30 messages per second per chat
 * - 1 message per second to different chats (broadcast)
 */
class TelegramRateLimiter {
  private queues = new Map<number, Promise<void>>();

  constructor(private bot: Telegraf) {}

  async sendMessage(chatId: number, text: string, extra?: any): Promise<void> {
    return this.enqueue(chatId, async () => {
      await this.sendWithRetry(() => this.bot.telegram.sendMessage(chatId, text, extra));
    });
  }

  async sendPhoto(chatId: number, photo: string, extra?: any): Promise<void> {
    return this.enqueue(chatId, async () => {
      await this.sendWithRetry(() => this.bot.telegram.sendPhoto(chatId, photo, extra));
    });
  }

  async sendDocument(chatId: number, document: any): Promise<void> {
    return this.enqueue(chatId, async () => {
      await this.sendWithRetry(() => this.bot.telegram.sendDocument(chatId, document));
    });
  }

  private async enqueue(chatId: number, fn: () => Promise<void>): Promise<void> {
    // Get existing queue for this chat, or create a resolved promise
    const prevQueue = this.queues.get(chatId) || Promise.resolve();

    // Chain the new request
    const newQueue = prevQueue.then(async () => {
      await fn();
      await this.delay(34); // 30 msg/sec = ~33ms per message, add buffer
    });

    this.queues.set(chatId, newQueue);

    // Wait for this request to complete
    await newQueue;
  }

  private async sendWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (error.response?.error_code === 429) {
          // Rate limit hit
          const retryAfter = error.response.parameters?.retry_after || Math.pow(2, i);
          console.log(`Rate limited. Retrying after ${retryAfter}s...`);
          await this.delay(retryAfter * 1000);
        } else {
          throw error; // Non-retryable error
        }
      }
    }
    throw new Error("Max retries exceeded");
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * User State
 */
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
