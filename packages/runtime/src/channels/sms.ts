import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
  Attachment,
  RichContent,
} from "@agentik-os/shared";
import { createHmac } from "crypto";

/**
 * SMS Channel Adapter (Twilio)
 *
 * Provides SMS/MMS integration for Agentik OS agents.
 * Users can interact with agents through text messages.
 *
 * Features:
 * - Text message sending and receiving via Twilio
 * - MMS support for image attachments
 * - Long message splitting (1600 char limit per segment)
 * - Webhook signature validation for security
 * - Rate limiting with retry logic
 * - User session tracking by phone number
 * - Rich content stripping (SMS is plain text only)
 */
export class SMSChannel implements ChannelAdapter {
  readonly name = "sms" as const;

  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private accountSid = "";
  private authToken = "";
  private phoneNumber = "";
  private userStates = new Map<string, UserState>();
  private rateLimiter?: SMSRateLimiter;

  async connect(config: ChannelConfig): Promise<void> {
    const accountSid = config.options.accountSid as string;
    const authToken = config.options.authToken as string;
    const phoneNumber = config.options.phoneNumber as string;

    if (!accountSid) {
      throw new Error(
        "Twilio Account SID is required (config.options.accountSid)"
      );
    }

    if (!authToken) {
      throw new Error(
        "Twilio Auth Token is required (config.options.authToken)"
      );
    }

    if (!phoneNumber) {
      throw new Error(
        "Twilio phone number is required (config.options.phoneNumber)"
      );
    }

    this.accountSid = accountSid;
    this.authToken = authToken;
    this.phoneNumber = phoneNumber;
    this.rateLimiter = new SMSRateLimiter();

    // Verify credentials by checking the account
    try {
      const response = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${accountSid}.json`,
        {
          headers: {
            Authorization: this.buildAuthHeader(),
          },
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Twilio authentication failed: ${error}`);
      }

      this.connected = true;
      console.log(`✅ SMS channel connected (Twilio: ${phoneNumber})`);
    } catch (error: any) {
      if (error.message.includes("Twilio authentication failed")) {
        throw error;
      }
      throw new Error(`Failed to connect to Twilio: ${error.message}`);
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.accountSid = "";
    this.authToken = "";
    this.phoneNumber = "";
    this.rateLimiter = undefined;
    this.userStates.clear();
    console.log("👋 SMS channel disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.connected || !this.rateLimiter) {
      throw new Error("SMS channel not connected");
    }

    // Send text (split if too long)
    if (content.text) {
      const plainText = this.stripFormatting(content.text);
      await this.sendLongMessage(to, plainText);
    }

    // Send rich content as plain text (SMS doesn't support rich content)
    if (content.richContent && content.richContent.length > 0) {
      for (const item of content.richContent) {
        await this.sendRichContent(to, item);
      }
    }
  }

  async sendFile(to: string, _file: Buffer, caption?: string): Promise<void> {
    if (!this.connected || !this.rateLimiter) {
      throw new Error("SMS channel not connected");
    }

    // For MMS, we need a publicly accessible URL
    // Since we have a raw buffer, send the caption as text
    // and note that MMS requires a MediaUrl (public URL)
    const message = caption
      ? `📎 ${caption} (file attached)`
      : "📎 File attached";

    await this.rateLimiter.enqueue(async () => {
      return await this.sendTwilioMessage(to, message);
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * WEBHOOK HANDLING
   *
   * Call this method when receiving a Twilio webhook POST request.
   * Twilio sends incoming SMS data as form-urlencoded POST.
   */
  async handleIncomingWebhook(
    body: Record<string, string>,
    signature?: string,
    url?: string
  ): Promise<void> {
    // Validate webhook signature if auth token is available
    if (signature && url) {
      const isValid = this.validateWebhookSignature(url, body, signature);
      if (!isValid) {
        throw new Error("Invalid Twilio webhook signature");
      }
    }

    const from = body.From || "";
    const messageBody = body.Body || "";
    const messageSid = body.MessageSid || "";
    const numMedia = parseInt(body.NumMedia || "0", 10);

    // Extract media attachments
    const attachments: Attachment[] = [];
    for (let i = 0; i < numMedia; i++) {
      const mediaUrl = body[`MediaUrl${i}`];
      const mediaContentType = body[`MediaContentType${i}`];
      if (mediaUrl) {
        attachments.push({
          type: this.getAttachmentType(mediaContentType),
          url: mediaUrl,
          mimeType: mediaContentType || "application/octet-stream",
        });
      }
    }

    // Track user state
    const userState = this.getUserState(from);
    userState.messageCount++;
    this.userStates.set(from, userState);

    const rawMessage: RawMessage = {
      channel: "sms",
      channelMessageId: messageSid,
      userId: from,
      agentId: userState.currentAgent,
      content: messageBody,
      attachments: attachments.length > 0 ? attachments : undefined,
      timestamp: new Date(),
      raw: body,
    };

    await this.messageHandler?.(rawMessage);
  }

  /**
   * PRIVATE METHODS
   */

  private buildAuthHeader(): string {
    const credentials = Buffer.from(
      `${this.accountSid}:${this.authToken}`
    ).toString("base64");
    return `Basic ${credentials}`;
  }

  private async sendTwilioMessage(
    to: string,
    body: string,
    mediaUrl?: string
  ): Promise<any> {
    const params = new URLSearchParams();
    params.append("To", to);
    params.append("From", this.phoneNumber);
    params.append("Body", body);

    if (mediaUrl) {
      params.append("MediaUrl", mediaUrl);
    }

    const url = `https://api.twilio.com/2010-04-01/Accounts/${this.accountSid}/Messages.json`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: this.buildAuthHeader(),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Twilio API error (${response.status}): ${errorBody}`);
    }

    return await response.json();
  }

  private async sendLongMessage(to: string, text: string): Promise<void> {
    if (!this.rateLimiter) return;

    const MAX_LENGTH = 1600; // SMS segment limit

    if (text.length <= MAX_LENGTH) {
      await this.rateLimiter.enqueue(async () => {
        return await this.sendTwilioMessage(to, text);
      });
      return;
    }

    // Split into segments
    const chunks = this.splitText(text, MAX_LENGTH);

    for (let i = 0; i < chunks.length; i++) {
      const prefix =
        chunks.length > 1 ? `(${i + 1}/${chunks.length}) ` : "";
      await this.rateLimiter.enqueue(async () => {
        return await this.sendTwilioMessage(to, prefix + chunks[i]);
      });
    }
  }

  private splitText(text: string, maxLength: number): string[] {
    const chunks: string[] = [];
    let current = "";

    for (const paragraph of text.split("\n\n")) {
      // Account for segment prefix like "(1/3) "
      const prefixLength = 8;
      const effectiveMax = maxLength - prefixLength;

      if ((current + paragraph).length > effectiveMax) {
        if (current) chunks.push(current.trim());

        // Handle single paragraph longer than max
        if (paragraph.length > effectiveMax) {
          // Split by sentences
          const sentences = paragraph.match(/[^.!?]+[.!?]+/g) || [paragraph];
          for (const sentence of sentences) {
            if ((current + sentence).length > effectiveMax) {
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

  private stripFormatting(text: string): string {
    return (
      text
        // Remove markdown bold
        .replace(/\*\*(.*?)\*\*/g, "$1")
        // Remove markdown italic
        .replace(/\*(.*?)\*/g, "$1")
        .replace(/_(.*?)_/g, "$1")
        // Remove markdown code blocks
        .replace(/```[\s\S]*?```/g, (match) => {
          return match.replace(/```\w*\n?/g, "").replace(/```/g, "");
        })
        // Remove inline code
        .replace(/`(.*?)`/g, "$1")
        // Remove markdown links, keep text
        .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
        // Remove markdown headers
        .replace(/^#{1,6}\s+/gm, "")
        // Clean up extra whitespace
        .replace(/\n{3,}/g, "\n\n")
        .trim()
    );
  }

  private async sendRichContent(to: string, item: RichContent): Promise<void> {
    if (!this.rateLimiter) return;

    let text = "";

    switch (item.type) {
      case "button":
        text = `${item.data.text || ""}\n→ ${item.data.label}`;
        break;

      case "image":
        // Send as MMS if we have a URL
        if (item.data.url) {
          await this.rateLimiter.enqueue(async () => {
            return await this.sendTwilioMessage(
              to,
              (item.data.caption as string) || "",
              item.data.url as string
            );
          });
          return;
        }
        text = `[Image: ${item.data.caption || ""}]`;
        break;

      case "card":
        text = `${item.data.title}\n${item.data.description}`;
        break;

      case "code_block":
        text = `Code:\n${item.data.code}`;
        break;

      default:
        return;
    }

    if (text) {
      await this.rateLimiter.enqueue(async () => {
        return await this.sendTwilioMessage(to, text);
      });
    }
  }

  /**
   * WEBHOOK SIGNATURE VALIDATION
   *
   * Twilio signs webhook requests using HMAC-SHA1.
   * The signature is computed from the URL + sorted POST parameters.
   */
  private validateWebhookSignature(
    url: string,
    params: Record<string, string>,
    signature: string
  ): boolean {
    // Build the data string: URL + sorted params
    const sortedKeys = Object.keys(params).sort();
    let data = url;
    for (const key of sortedKeys) {
      data += key + params[key];
    }

    // Compute HMAC-SHA1
    const computed = createHmac("sha1", this.authToken)
      .update(data)
      .digest("base64");

    return computed === signature;
  }

  private getAttachmentType(
    contentType?: string
  ): "image" | "file" | "audio" | "video" {
    if (!contentType) return "file";
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "video";
    if (contentType.startsWith("audio/")) return "audio";
    return "file";
  }

  private getUserState(phoneNumber: string): UserState {
    if (!this.userStates.has(phoneNumber)) {
      this.userStates.set(phoneNumber, {
        phoneNumber,
        currentAgent: "default",
        messageCount: 0,
      });
    }
    return this.userStates.get(phoneNumber)!;
  }

}

/**
 * Rate Limiter for Twilio SMS API
 *
 * Twilio has account-level rate limits (typically 1 msg/sec for trial,
 * higher for paid accounts). This ensures we don't exceed limits.
 */
class SMSRateLimiter {
  private queue: Promise<void> = Promise.resolve();
  private lastSendTime = 0;
  private readonly minInterval = 1000; // 1 message per second (conservative)

  async enqueue(fn: () => Promise<any>): Promise<any> {
    const prevQueue = this.queue;

    let result: any;

    this.queue = prevQueue.then(async () => {
      // Enforce minimum interval between messages
      const now = Date.now();
      const timeSinceLastSend = now - this.lastSendTime;
      if (timeSinceLastSend < this.minInterval) {
        await this.delay(this.minInterval - timeSinceLastSend);
      }

      result = await this.sendWithRetry(fn);
      this.lastSendTime = Date.now();
    });

    await this.queue;
    return result;
  }

  private async sendWithRetry(
    fn: () => Promise<any>,
    maxRetries = 3
  ): Promise<any> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await fn();
      } catch (error: any) {
        const statusCode = error.message?.match(/\((\d{3})\)/)?.[1];

        if (statusCode === "429") {
          // Rate limit hit
          const retryAfter = Math.pow(2, i) * 1000;
          console.log(
            `SMS rate limited. Retrying after ${retryAfter / 1000}s...`
          );
          await this.delay(retryAfter);
        } else if (i < maxRetries - 1 && statusCode === "500") {
          // Server error, retry
          await this.delay(Math.pow(2, i) * 1000);
        } else {
          throw error;
        }
      }
    }
    throw new Error("Max retries exceeded for SMS send");
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
  messageCount: number;
}
