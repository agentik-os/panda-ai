import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
  Attachment,
  RichContent,
} from "@agentik-os/shared";

/**
 * WhatsApp Channel Adapter
 *
 * Provides WhatsApp Business integration for Agentik OS agents
 * via the Twilio WhatsApp Business API.
 *
 * Features:
 * - Text message handling
 * - Media attachments (images, documents, audio, video)
 * - Rate limiting with retry logic
 * - Long message splitting (1600 char limit for WhatsApp)
 * - Webhook handler for incoming messages
 * - User state tracking
 * - Error recovery with exponential backoff
 */
export class WhatsAppChannel implements ChannelAdapter {
  readonly name = "whatsapp" as const;

  private accountSid?: string;
  private authToken?: string;
  private phoneNumber?: string;
  private webhookUrl?: string;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private rateLimiter?: WhatsAppRateLimiter;
  private userStates = new Map<string, UserState>();

  async connect(config: ChannelConfig): Promise<void> {
    const accountSid = config.options.accountSid as string;
    const authToken = config.options.authToken as string;
    const phoneNumber = config.options.phoneNumber as string;

    if (!accountSid) {
      throw new Error("Twilio account SID is required (config.options.accountSid)");
    }

    if (!authToken) {
      throw new Error("Twilio auth token is required (config.options.authToken)");
    }

    if (!phoneNumber) {
      throw new Error("WhatsApp phone number is required (config.options.phoneNumber)");
    }

    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;
    this.webhookUrl = config.options.webhookUrl as string | undefined;
    this.rateLimiter = new WhatsAppRateLimiter(accountSid, authToken);

    // Verify credentials by checking the Twilio account
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Twilio authentication failed: ${response.status} ${response.statusText}`);
      }

      console.log("✅ WhatsApp channel connected via Twilio");

      if (this.webhookUrl) {
        console.log(`📡 Webhook URL configured: ${this.webhookUrl}`);
      }
    } catch (error: any) {
      if (error.message.includes("Twilio authentication failed")) {
        throw error;
      }
      throw new Error(`Failed to connect to Twilio: ${error.message}`);
    }

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    this.accountSid = undefined;
    this.authToken = undefined;
    this.phoneNumber = undefined;
    this.webhookUrl = undefined;
    this.rateLimiter = undefined;
    this.userStates.clear();
    this.connected = false;
    console.log("👋 WhatsApp channel disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.phoneNumber || !this.rateLimiter) {
      throw new Error("Channel not connected");
    }

    // Send text (split if too long)
    if (content.text) {
      await this.sendLongMessage(to, content.text);
    }

    // Send rich content
    if (content.richContent && content.richContent.length > 0) {
      for (const item of content.richContent) {
        await this.sendRichContent(to, item);
      }
    }
  }

  async sendFile(to: string, _file: Buffer, caption?: string): Promise<void> {
    if (!this.accountSid || !this.authToken || !this.phoneNumber || !this.rateLimiter) {
      throw new Error("Channel not connected");
    }

    // For WhatsApp via Twilio, files need to be hosted at a public URL.
    // We send a message with a note about the file since direct buffer upload
    // requires hosting the file first.
    const message = caption
      ? `📎 File: ${caption}`
      : "📎 File attached";

    await this.rateLimiter.sendMessage(
      this.accountSid!,
      this.authToken!,
      this.phoneNumber!,
      to,
      message
    );
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Handle incoming webhook from Twilio
   *
   * Parse the POST body from Twilio's webhook and convert
   * to a RawMessage for the pipeline.
   */
  async handleWebhook(body: Record<string, string>): Promise<void> {
    if (!this.messageHandler) return;

    const from = body.From?.replace("whatsapp:", "") || "";
    const messageBody = body.Body || "";
    const messageSid = body.MessageSid || "";
    const numMedia = parseInt(body.NumMedia || "0");

    const attachments: Attachment[] = [];

    // Extract media attachments
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = body[`MediaUrl${i}`];
      const mediaType = body[`MediaContentType${i}`];

      if (mediaUrl && mediaType) {
        let type: Attachment["type"] = "file";
        if (mediaType.startsWith("image/")) type = "image";
        else if (mediaType.startsWith("audio/")) type = "audio";
        else if (mediaType.startsWith("video/")) type = "video";

        attachments.push({
          type,
          url: mediaUrl,
          mimeType: mediaType,
        });
      }
    }

    // Track user state
    const userId = from;
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        phoneNumber: from,
        currentAgent: "default",
        conversationHistory: [],
        preferences: { language: "en", notificationsEnabled: true },
      });
    }

    const userState = this.userStates.get(userId)!;

    const rawMessage: RawMessage = {
      channel: "whatsapp",
      channelMessageId: messageSid,
      userId,
      agentId: userState.currentAgent,
      content: messageBody,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: new Date(),
      raw: body,
    };

    await this.messageHandler(rawMessage);
  }

  /**
   * PRIVATE METHODS
   */

  private async sendLongMessage(to: string, text: string): Promise<void> {
    if (!this.rateLimiter || !this.accountSid || !this.authToken || !this.phoneNumber) return;

    const MAX_LENGTH = 1600; // WhatsApp limit

    if (text.length <= MAX_LENGTH) {
      await this.rateLimiter.sendMessage(
        this.accountSid,
        this.authToken,
        this.phoneNumber,
        to,
        text
      );
      return;
    }

    // Split by paragraphs
    const chunks = this.splitText(text, MAX_LENGTH);

    for (const chunk of chunks) {
      await this.rateLimiter.sendMessage(
        this.accountSid,
        this.authToken,
        this.phoneNumber,
        to,
        chunk
      );
      await this.delay(200); // Small delay between chunks
    }
  }

  private splitText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let current = "";

    for (const paragraph of text.split("\n\n")) {
      if ((current + paragraph).length > maxLength) {
        if (current) chunks.push(current.trim());

        // If a single paragraph exceeds max length, split by sentences
        if (paragraph.length > maxLength) {
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          for (const sentence of sentences) {
            if ((current + sentence).length > maxLength) {
              if (current) chunks.push(current.trim());
              current = sentence;
            } else {
              current += sentence;
            }
          }
        } else {
          current = paragraph;
        }
      } else {
        current += (current ? "\n\n" : "") + paragraph;
      }
    }

    if (current) chunks.push(current.trim());
    return chunks;
  }

  private async sendRichContent(to: string, item: RichContent): Promise<void> {
    if (!this.rateLimiter || !this.accountSid || !this.authToken || !this.phoneNumber) return;

    switch (item.type) {
      case "button":
        // WhatsApp doesn't support inline buttons via Twilio basic API
        // Format as text with numbered options
        await this.rateLimiter.sendMessage(
          this.accountSid,
          this.authToken,
          this.phoneNumber,
          to,
          `${item.data.text}\n\nReply with: *${item.data.label}*`
        );
        break;

      case "image":
        await this.rateLimiter.sendMediaMessage(
          this.accountSid,
          this.authToken,
          this.phoneNumber,
          to,
          item.data.url as string,
          (item.data.caption as string) || ""
        );
        break;

      case "card":
        await this.rateLimiter.sendMessage(
          this.accountSid,
          this.authToken,
          this.phoneNumber,
          to,
          `*${item.data.title}*\n\n${item.data.description}`
        );
        break;

      case "code_block":
        await this.rateLimiter.sendMessage(
          this.accountSid,
          this.authToken,
          this.phoneNumber,
          to,
          `\`\`\`${item.data.code}\`\`\``
        );
        break;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Rate Limiter for WhatsApp via Twilio API
 *
 * Twilio WhatsApp limits:
 * - 1 message per second (default)
 * - Higher throughput available with approved accounts
 */
class WhatsAppRateLimiter {
  private queue: Promise<void> = Promise.resolve();

  constructor(
    _accountSid: string,
    _authToken: string
  ) {}

  async sendMessage(
    accountSid: string,
    authToken: string,
    from: string,
    to: string,
    body: string
  ): Promise<void> {
    return await this.enqueue(async () => {
      await this.sendWithRetry(async () => {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        const params = new URLSearchParams();
        params.append("To", `whatsapp:${to}`);
        params.append("From", `whatsapp:${from}`);
        params.append("Body", body);

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
          const error: any = new Error(
            `Twilio API error: ${response.status} ${errorBody.message || response.statusText}`
          );
          error.status = response.status;
          error.code = errorBody.code;
          throw error;
        }

        return await response.json();
      });
    });
  }

  async sendMediaMessage(
    accountSid: string,
    authToken: string,
    from: string,
    to: string,
    mediaUrl: string,
    body: string
  ): Promise<void> {
    return await this.enqueue(async () => {
      await this.sendWithRetry(async () => {
        const url = `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`;

        const params = new URLSearchParams();
        params.append("To", `whatsapp:${to}`);
        params.append("From", `whatsapp:${from}`);
        params.append("MediaUrl", mediaUrl);
        if (body) {
          params.append("Body", body);
        }

        const response = await fetch(url, {
          method: "POST",
          headers: {
            Authorization: `Basic ${btoa(`${accountSid}:${authToken}`)}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => ({})) as Record<string, unknown>;
          const error: any = new Error(
            `Twilio API error: ${response.status} ${errorBody.message || response.statusText}`
          );
          error.status = response.status;
          error.code = errorBody.code;
          throw error;
        }

        return await response.json();
      });
    });
  }

  private async enqueue(fn: () => Promise<void>): Promise<void> {
    const prevQueue = this.queue;

    const newQueue = prevQueue.then(async () => {
      await fn();
      await this.delay(1000); // 1 msg/sec for WhatsApp
    });

    this.queue = newQueue;

    await newQueue;
  }

  private async sendWithRetry(fn: () => Promise<any>, maxRetries = 3): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        if (error.status === 429) {
          // Rate limit hit
          const retryAfter = Math.pow(2, i + 1);
          console.log(`WhatsApp rate limited. Retrying after ${retryAfter}s...`);
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
  phoneNumber: string;
  currentAgent: string;
  conversationHistory: string[];
  preferences: {
    language: string;
    notificationsEnabled: boolean;
  };
}
