import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
  Attachment,
  RichContent,
} from "@agentik-os/shared";

/**
 * Microsoft Teams Channel Adapter
 *
 * Provides Microsoft Teams bot integration for Agentik OS agents.
 * Uses the Bot Framework REST API via fetch (no SDK dependency).
 *
 * Features:
 * - OAuth2 client credentials flow for authentication
 * - Token caching with automatic refresh
 * - Adaptive Cards for rich content (cards, buttons, images)
 * - Typing indicator support
 * - Proactive messaging
 * - Thread/reply support via replyToId
 * - Long message splitting (28KB activity limit)
 * - Retry with exponential backoff
 * - User state tracking
 */
export class TeamsChannel implements ChannelAdapter {
  readonly name = "teams" as const;

  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private appId = "";
  private appPassword = "";
  private tenantId = "";
  private accessToken = "";
  private tokenExpiry = 0;
  private userStates = new Map<string, UserState>();
  private typingTimers = new Map<string, NodeJS.Timeout>();

  async connect(config: ChannelConfig): Promise<void> {
    const appId = config.options.appId as string;
    const appPassword = config.options.appPassword as string;

    if (!appId) {
      throw new Error(
        "Microsoft App ID is required (config.options.appId)"
      );
    }

    if (!appPassword) {
      throw new Error(
        "Microsoft App Password is required (config.options.appPassword)"
      );
    }

    this.appId = appId;
    this.appPassword = appPassword;
    this.tenantId = (config.options.tenantId as string) || "botframework.com";

    // Acquire initial token to validate credentials
    await this.acquireToken();

    this.connected = true;
    console.log("✅ Teams bot connected");
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    this.accessToken = "";
    this.tokenExpiry = 0;

    // Clear typing timers
    this.typingTimers.forEach((timer) => clearTimeout(timer));
    this.typingTimers.clear();

    console.log("👋 Teams bot disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.connected) {
      throw new Error("Bot not connected");
    }

    const { serviceUrl, conversationId, replyToId } = this.parseRecipient(to);

    // Send typing indicator first
    await this.sendTypingIndicator(serviceUrl, conversationId);

    // Send text (split if too long)
    if (content.text) {
      await this.sendLongMessage(serviceUrl, conversationId, content.text, replyToId);
    }

    // Send rich content as Adaptive Cards
    if (content.richContent && content.richContent.length > 0) {
      const card = this.buildAdaptiveCard(content.richContent);
      await this.sendActivity(serviceUrl, conversationId, {
        type: "message",
        attachments: [
          {
            contentType: "application/vnd.microsoft.card.adaptive",
            content: card,
          },
        ],
        replyToId,
      });
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    if (!this.connected) {
      throw new Error("Bot not connected");
    }

    const { serviceUrl, conversationId, replyToId } = this.parseRecipient(to);

    // Teams file sending: base64 inline attachment
    const base64Content = file.toString("base64");
    const filename = caption || "file";

    await this.sendActivity(serviceUrl, conversationId, {
      type: "message",
      text: caption || "",
      attachments: [
        {
          contentType: "application/octet-stream",
          contentUrl: `data:application/octet-stream;base64,${base64Content}`,
          name: filename,
        },
      ],
      replyToId,
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Process an incoming Bot Framework activity.
   * Called by a webhook endpoint that receives POST requests from Teams.
   */
  async processActivity(activity: BotFrameworkActivity): Promise<void> {
    if (activity.type === "message" && activity.text) {
      const rawMessage = this.activityToRawMessage(activity);
      await this.messageHandler?.(rawMessage);
    }
  }

  /**
   * AUTHENTICATION
   */

  private async acquireToken(): Promise<string> {
    // Return cached token if still valid (with 5 min buffer)
    if (this.accessToken && Date.now() < this.tokenExpiry - 300000) {
      return this.accessToken;
    }

    const tokenUrl = `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`;

    const body = new URLSearchParams({
      grant_type: "client_credentials",
      client_id: this.appId,
      client_secret: this.appPassword,
      scope: "https://api.botframework.com/.default",
    });

    const response = await this.fetchWithRetry(tokenUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: body.toString(),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to acquire Teams token: ${response.status} ${errorText}`
      );
    }

    const data = (await response.json()) as TokenResponse;

    this.accessToken = data.access_token;
    this.tokenExpiry = Date.now() + data.expires_in * 1000;

    return this.accessToken;
  }

  /**
   * BOT FRAMEWORK API
   */

  private async sendActivity(
    serviceUrl: string,
    conversationId: string,
    activity: Partial<BotFrameworkActivity>
  ): Promise<void> {
    const token = await this.acquireToken();

    const baseUrl = serviceUrl.endsWith("/") ? serviceUrl.slice(0, -1) : serviceUrl;
    const url = `${baseUrl}/v3/conversations/${conversationId}/activities`;

    const fullActivity = {
      ...activity,
      from: {
        id: this.appId,
        name: "Agentik OS",
      },
      conversation: {
        id: conversationId,
      },
    };

    const response = await this.fetchWithRetry(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(fullActivity),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Failed to send Teams activity: ${response.status} ${errorText}`
      );
    }
  }

  private async sendTypingIndicator(
    serviceUrl: string,
    conversationId: string
  ): Promise<void> {
    try {
      await this.sendActivity(serviceUrl, conversationId, {
        type: "typing",
      });
    } catch (error) {
      // Typing indicator failure is non-critical
      console.warn("Failed to send typing indicator:", error);
    }
  }

  /**
   * MESSAGE CONVERSION
   */

  private activityToRawMessage(activity: BotFrameworkActivity): RawMessage {
    const userId = activity.from?.id || "unknown";
    const userState = this.getUserState(userId);
    userState.messageCount++;
    this.userStates.set(userId, userState);

    // Encode serviceUrl into the "to" field for reply routing
    const to = this.encodeRecipient(
      activity.serviceUrl || "https://smba.trafficmanager.net/",
      activity.conversation?.id || "",
      activity.id
    );

    const attachments = this.extractAttachments(activity);

    return {
      channel: "teams",
      channelMessageId: activity.id || "",
      userId,
      agentId: userState.currentAgent,
      content: activity.text || "",
      attachments: attachments.length > 0 ? attachments : undefined,
      metadata: {
        serviceUrl: activity.serviceUrl,
        conversationId: activity.conversation?.id,
        replyToId: activity.id,
        tenantId: (activity.channelData?.tenant as Record<string, unknown>)?.id,
        recipientEncoded: to,
      },
      timestamp: activity.timestamp ? new Date(activity.timestamp) : new Date(),
      raw: activity,
    };
  }

  private extractAttachments(activity: BotFrameworkActivity): Attachment[] {
    if (!activity.attachments || activity.attachments.length === 0) {
      return [];
    }

    return activity.attachments.map((att) => ({
      type: this.getAttachmentType(att.contentType),
      url: att.contentUrl,
      mimeType: att.contentType || "application/octet-stream",
      filename: att.name,
    }));
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

  /**
   * ADAPTIVE CARD BUILDING
   */

  private buildAdaptiveCard(richContent: RichContent[]): AdaptiveCard {
    const body: AdaptiveCardElement[] = [];
    const actions: AdaptiveCardAction[] = [];

    for (const item of richContent) {
      switch (item.type) {
        case "card":
          if (item.data.title) {
            body.push({
              type: "TextBlock",
              text: item.data.title as string,
              size: "Large",
              weight: "Bolder",
              wrap: true,
            });
          }
          if (item.data.description) {
            body.push({
              type: "TextBlock",
              text: item.data.description as string,
              wrap: true,
            });
          }
          break;

        case "button":
          actions.push({
            type: "Action.Submit",
            title: (item.data.label as string) || (item.data.text as string) || "Click",
            data: item.data.action || {},
          });
          break;

        case "image":
          body.push({
            type: "Image",
            url: item.data.url as string,
            altText: (item.data.caption as string) || "Image",
            size: "Large",
          });
          break;

        case "code_block":
          body.push({
            type: "TextBlock",
            text: `\`\`\`\n${item.data.code as string}\n\`\`\``,
            fontType: "Monospace",
            wrap: true,
          });
          break;

        case "embed":
          if (item.data.title) {
            body.push({
              type: "TextBlock",
              text: item.data.title as string,
              size: "Medium",
              weight: "Bolder",
              wrap: true,
            });
          }
          if (item.data.description) {
            body.push({
              type: "TextBlock",
              text: item.data.description as string,
              wrap: true,
            });
          }
          break;
      }
    }

    return {
      type: "AdaptiveCard",
      $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
      version: "1.4",
      body,
      actions: actions.length > 0 ? actions : undefined,
    };
  }

  /**
   * MESSAGE SENDING HELPERS
   */

  private async sendLongMessage(
    serviceUrl: string,
    conversationId: string,
    text: string,
    replyToId?: string
  ): Promise<void> {
    const MAX_SIZE = 25000; // 28KB limit, leave room for JSON overhead

    if (text.length <= MAX_SIZE) {
      await this.sendActivity(serviceUrl, conversationId, {
        type: "message",
        text,
        textFormat: "markdown",
        replyToId,
      });
      return;
    }

    // Split by paragraphs
    const chunks = this.splitText(text, MAX_SIZE);

    for (const chunk of chunks) {
      await this.sendActivity(serviceUrl, conversationId, {
        type: "message",
        text: chunk,
        textFormat: "markdown",
        replyToId,
      });
      await this.delay(100);
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

  /**
   * RECIPIENT ENCODING
   *
   * Teams needs serviceUrl + conversationId + optional replyToId
   * to route messages. We encode these into a single string.
   */

  private encodeRecipient(
    serviceUrl: string,
    conversationId: string,
    replyToId?: string
  ): string {
    const parts = [serviceUrl, conversationId];
    if (replyToId) parts.push(replyToId);
    return Buffer.from(parts.join("|")).toString("base64");
  }

  private parseRecipient(to: string): {
    serviceUrl: string;
    conversationId: string;
    replyToId?: string;
  } {
    try {
      const decoded = Buffer.from(to, "base64").toString("utf-8");
      const parts = decoded.split("|");

      if (parts.length >= 2 && parts[0] && parts[1]) {
        return {
          serviceUrl: parts[0],
          conversationId: parts[1],
          replyToId: parts[2] || undefined,
        };
      }
    } catch {
      // Fall through to default
    }

    // If not encoded, assume it is a conversationId with default serviceUrl
    return {
      serviceUrl: "https://smba.trafficmanager.net/",
      conversationId: to,
    };
  }

  /**
   * USER STATE
   */

  private getUserState(userId: string): UserState {
    if (!this.userStates.has(userId)) {
      this.userStates.set(userId, {
        userId,
        currentAgent: "default",
        messageCount: 0,
      });
    }
    return this.userStates.get(userId)!;
  }

  /**
   * RETRY LOGIC
   */

  private async fetchWithRetry(
    url: string,
    options: RequestInit,
    maxRetries = 3
  ): Promise<Response> {
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const response = await fetch(url, options);

        if (response.status === 429) {
          // Rate limited — respect Retry-After header
          const retryAfter = parseInt(
            response.headers.get("Retry-After") || String(Math.pow(2, attempt)),
            10
          );
          console.warn(
            `Teams API rate limited. Retrying after ${retryAfter}s...`
          );
          await this.delay(retryAfter * 1000);
          continue;
        }

        return response;
      } catch (error) {
        if (attempt === maxRetries - 1) {
          throw error;
        }
        // Exponential backoff for network errors
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }

    throw new Error("Max retries exceeded for Teams API request");
  }

  /**
   * UTILITIES
   */

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Bot Framework Activity (simplified)
 */
interface BotFrameworkActivity {
  type: string;
  id?: string;
  timestamp?: string;
  serviceUrl?: string;
  channelId?: string;
  from?: { id: string; name?: string };
  recipient?: { id: string; name?: string };
  conversation?: { id: string; name?: string; isGroup?: boolean };
  text?: string;
  textFormat?: string;
  attachments?: BotFrameworkAttachment[];
  replyToId?: string;
  channelData?: Record<string, unknown>;
}

interface BotFrameworkAttachment {
  contentType?: string;
  contentUrl?: string;
  content?: unknown;
  name?: string;
  thumbnailUrl?: string;
}

/**
 * OAuth Token Response
 */
interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  ext_expires_in?: number;
}

/**
 * Adaptive Card Types
 */
interface AdaptiveCard {
  type: "AdaptiveCard";
  $schema: string;
  version: string;
  body: AdaptiveCardElement[];
  actions?: AdaptiveCardAction[];
}

interface AdaptiveCardElement {
  type: string;
  text?: string;
  url?: string;
  altText?: string;
  size?: string;
  weight?: string;
  wrap?: boolean;
  fontType?: string;
  [key: string]: unknown;
}

interface AdaptiveCardAction {
  type: string;
  title: string;
  data?: unknown;
  url?: string;
  [key: string]: unknown;
}

/**
 * User State
 */
interface UserState {
  userId: string;
  currentAgent: string;
  messageCount: number;
}
