import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
  Attachment,
  RichContent,
} from "@agentik-os/shared";

/**
 * Slack Channel Adapter
 *
 * Provides Slack integration for Agentik OS agents using the Slack Web API
 * via native fetch (no external dependencies like @slack/bolt).
 *
 * Features:
 * - Socket Mode for real-time events (WebSocket)
 * - Slash commands (/ask, /agent, /clear, /status)
 * - Rich Block Kit messages (sections, buttons, images, code)
 * - Thread replies
 * - File uploads
 * - Long message splitting (3000 chars for readability)
 * - User state tracking
 * - Rate limiting with retry logic
 */
export class SlackChannel implements ChannelAdapter {
  readonly name = "slack" as const;

  private botToken?: string;
  private appToken?: string;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private ws?: WebSocket;
  private userStates = new Map<string, UserState>();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout?: NodeJS.Timeout;
  private pingInterval?: NodeJS.Timeout;

  private static readonly API_BASE = "https://slack.com/api/";
  private static readonly SPLIT_LENGTH = 3000;

  async connect(config: ChannelConfig): Promise<void> {
    const botToken = config.options.botToken as string;
    const appToken = config.options.appToken as string;

    if (!botToken) {
      throw new Error("Slack bot token is required (config.options.botToken)");
    }

    if (!config.options.signingSecret) {
      throw new Error(
        "Slack signing secret is required (config.options.signingSecret)"
      );
    }

    if (!appToken) {
      throw new Error("Slack app token is required (config.options.appToken)");
    }

    this.botToken = botToken;
    this.appToken = appToken;

    // Verify auth
    const authResult = await this.slackApi("auth.test", {});
    if (!authResult.ok) {
      throw new Error(`Slack auth failed: ${authResult.error}`);
    }

    // Connect via Socket Mode
    await this.connectSocketMode();

    this.connected = true;
    console.log(
      `✅ Slack bot connected as ${authResult.user} in workspace ${authResult.team}`
    );
  }

  async disconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close(1000, "Disconnecting");
      this.ws = undefined;
    }
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = undefined;
    }
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = undefined;
    }
    this.botToken = undefined;
    this.appToken = undefined;
    this.connected = false;
    this.reconnectAttempts = 0;
    console.log("👋 Slack bot disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.botToken) {
      throw new Error("Bot not connected");
    }

    // Parse destination: "channel_id" or "channel_id:thread_ts"
    const parts = to.split(":");
    const channelId = parts[0]!;
    const threadTs = parts[1];

    // Send text (split if too long)
    if (content.text) {
      await this.sendLongMessage(channelId, content.text, threadTs);
    }

    // Send rich content as blocks
    if (content.richContent && content.richContent.length > 0) {
      const blocks = this.buildBlocks(content.richContent);
      if (blocks.length > 0) {
        await this.postMessage(channelId, {
          blocks,
          thread_ts: threadTs,
        });
      }
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    if (!this.botToken) {
      throw new Error("Bot not connected");
    }

    const fileParts = to.split(":");
    const channelId = fileParts[0]!;
    const threadTs = fileParts[1];

    // Use files.uploadV2 via multipart form
    const formData = new FormData();
    const arrayBuffer = file.buffer.slice(
      file.byteOffset,
      file.byteOffset + file.byteLength
    ) as ArrayBuffer;
    const blob = new Blob([arrayBuffer]);
    formData.append("file", blob, caption || "file");
    formData.append("channels", channelId);
    if (caption) {
      formData.append("initial_comment", caption);
    }
    if (threadTs) {
      formData.append("thread_ts", threadTs);
    }

    const response = await fetch(`${SlackChannel.API_BASE}files.upload`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.botToken}`,
      },
      body: formData,
    });

    const result = (await response.json()) as { ok: boolean; error?: string };
    if (!result.ok) {
      throw new Error(`Slack file upload failed: ${result.error}`);
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * SLACK WEB API
   */

  private async slackApi(
    method: string,
    body: Record<string, unknown>
  ): Promise<any> {
    const response = await fetch(`${SlackChannel.API_BASE}${method}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Authorization: `Bearer ${this.botToken}`,
      },
      body: JSON.stringify(body),
    });

    const result = (await response.json()) as Record<string, unknown>;

    // Handle rate limiting
    if (response.status === 429) {
      const retryAfter = parseInt(
        response.headers.get("Retry-After") || "1",
        10
      );
      console.log(`Slack rate limited. Retrying after ${retryAfter}s...`);
      await this.delay(retryAfter * 1000);
      return await this.slackApi(method, body);
    }

    return result;
  }

  private async postMessage(
    channel: string,
    options: {
      text?: string;
      blocks?: SlackBlock[];
      thread_ts?: string;
      mrkdwn?: boolean;
    }
  ): Promise<any> {
    return await this.slackApi("chat.postMessage", {
      channel,
      text: options.text || "",
      blocks: options.blocks,
      thread_ts: options.thread_ts,
      mrkdwn: options.mrkdwn ?? true,
    });
  }

  /**
   * SOCKET MODE CONNECTION
   */

  private async connectSocketMode(): Promise<void> {
    // Request a WebSocket URL via apps.connections.open
    const response = await fetch(
      `${SlackChannel.API_BASE}apps.connections.open`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Authorization: `Bearer ${this.appToken}`,
        },
      }
    );

    const result = (await response.json()) as {
      ok: boolean;
      error?: string;
      url?: string;
    };
    if (!result.ok) {
      throw new Error(`Socket Mode connection failed: ${result.error}`);
    }

    const wsUrl = result.url as string;
    await this.connectWebSocket(wsUrl);
  }

  private async connectWebSocket(url: string): Promise<void> {
    return await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Slack Socket Mode connection timeout"));
      }, 30000);

      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        clearTimeout(timeout);
        this.reconnectAttempts = 0;
        console.log("🔌 Slack Socket Mode connected");

        // Keep-alive ping every 30 seconds
        this.pingInterval = setInterval(() => {
          if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({ type: "ping" }));
          }
        }, 30000);

        resolve();
      };

      this.ws.onmessage = (event) => {
        this.handleSocketMessage(event.data as string).catch((error) => {
          console.error("Error handling Socket Mode message:", error);
        });
      };

      this.ws.onerror = (error) => {
        console.error("Slack WebSocket error:", error);
      };

      this.ws.onclose = (event) => {
        clearTimeout(timeout);
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = undefined;
        }

        if (this.connected) {
          console.log(
            `Slack WebSocket closed (code: ${event.code}). Reconnecting...`
          );
          this.scheduleReconnect();
        }
      };
    });
  }

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("Max reconnect attempts reached. Giving up.");
      this.connected = false;
      return;
    }

    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
    this.reconnectAttempts++;

    console.log(
      `Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})...`
    );

    this.reconnectTimeout = setTimeout(() => {
      this.connectSocketMode().catch((error) => {
        console.error("Reconnect failed:", error);
        this.scheduleReconnect();
      });
    }, delay);
  }

  /**
   * SOCKET MODE MESSAGE HANDLING
   */

  private async handleSocketMessage(data: string): Promise<void> {
    const payload = JSON.parse(data);

    // Acknowledge envelope
    if (payload.envelope_id) {
      this.ws?.send(
        JSON.stringify({
          envelope_id: payload.envelope_id,
        })
      );
    }

    switch (payload.type) {
      case "events_api":
        await this.handleEvent(payload.payload);
        break;

      case "slash_commands":
        await this.handleSlashCommand(payload.payload);
        break;

      case "interactive":
        await this.handleInteractive(payload.payload);
        break;

      case "hello":
        console.log("Slack Socket Mode handshake complete");
        break;

      case "disconnect":
        console.log("Slack requested disconnect. Reconnecting...");
        this.connectSocketMode().catch(console.error);
        break;
    }
  }

  /**
   * EVENT HANDLERS
   */

  private async handleEvent(payload: any): Promise<void> {
    const event = payload.event;

    if (!event) return;

    switch (event.type) {
      case "message":
        // Ignore bot messages and message_changed subtypes
        if (event.bot_id || event.subtype) return;
        await this.handleIncomingMessage(event);
        break;

      case "app_mention":
        await this.handleIncomingMessage(event);
        break;
    }
  }

  private async handleIncomingMessage(event: any): Promise<void> {
    const userId = event.user;
    const userState = this.getUserState(userId);
    userState.messageCount++;
    this.userStates.set(userId, userState);

    const rawMessage: RawMessage = {
      channel: "slack",
      channelMessageId: event.ts,
      userId,
      agentId: userState.currentAgent,
      content: event.text || "",
      attachments: this.extractAttachments(event),
      timestamp: new Date(parseFloat(event.ts) * 1000),
      raw: event,
    };

    // Include thread_ts in metadata for thread replies
    if (event.thread_ts) {
      rawMessage.metadata = { thread_ts: event.thread_ts };
    }

    await this.messageHandler?.(rawMessage);
  }

  private extractAttachments(event: any): Attachment[] {
    if (!event.files || !Array.isArray(event.files)) return [];

    return event.files.map((file: any) => ({
      type: this.getFileType(file.mimetype),
      url: file.url_private,
      mimeType: file.mimetype || "application/octet-stream",
      filename: file.name,
      size: file.size,
    }));
  }

  private getFileType(mimeType: string): "image" | "file" | "audio" | "video" {
    if (!mimeType) return "file";
    if (mimeType.startsWith("image/")) return "image";
    if (mimeType.startsWith("video/")) return "video";
    if (mimeType.startsWith("audio/")) return "audio";
    return "file";
  }

  /**
   * SLASH COMMAND HANDLERS
   */

  private async handleSlashCommand(payload: any): Promise<void> {
    const command = payload.command;
    const text = payload.text || "";
    const userId = payload.user_id;
    const channelId = payload.channel_id;
    const responseUrl = payload.response_url;

    switch (command) {
      case "/ask":
        await this.handleAskCommand(userId, channelId, text, responseUrl);
        break;

      case "/agent":
        await this.handleAgentCommand(userId, text, responseUrl);
        break;

      case "/clear":
        await this.handleClearCommand(userId, responseUrl);
        break;

      case "/status":
        await this.handleStatusCommand(userId, responseUrl);
        break;

      default:
        await this.respondToCommand(responseUrl, `Unknown command: ${command}`);
    }
  }

  private async handleAskCommand(
    userId: string,
    channelId: string,
    question: string,
    responseUrl: string
  ): Promise<void> {
    if (!question) {
      await this.respondToCommand(responseUrl, "Usage: /ask <your question>");
      return;
    }

    // Acknowledge immediately
    await this.respondToCommand(responseUrl, "🤔 Thinking...");

    const userState = this.getUserState(userId);

    const rawMessage: RawMessage = {
      channel: "slack",
      channelMessageId: Date.now().toString(),
      userId,
      agentId: userState.currentAgent,
      content: question,
      timestamp: new Date(),
      metadata: { channelId, responseUrl },
    };

    await this.messageHandler?.(rawMessage);
  }

  private async handleAgentCommand(
    userId: string,
    agentName: string,
    responseUrl: string
  ): Promise<void> {
    if (!agentName) {
      await this.respondToCommand(
        responseUrl,
        "Usage: /agent <name>\n\nAvailable agents: default, ralph, nova"
      );
      return;
    }

    const userState = this.getUserState(userId);
    userState.currentAgent = agentName;
    this.userStates.set(userId, userState);

    await this.respondToCommand(
      responseUrl,
      `✅ Switched to agent: *${agentName}*`
    );
  }

  private async handleClearCommand(
    userId: string,
    responseUrl: string
  ): Promise<void> {
    const userState = this.getUserState(userId);
    userState.messageCount = 0;
    this.userStates.set(userId, userState);

    await this.respondToCommand(
      responseUrl,
      "🗑️ Conversation history cleared!"
    );
  }

  private async handleStatusCommand(
    userId: string,
    responseUrl: string
  ): Promise<void> {
    const state = this.getUserState(userId);

    const blocks: SlackBlock[] = [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: "*🤖 Agent Status*",
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Current Agent:*\n${state.currentAgent}` },
          { type: "mrkdwn", text: `*Messages:*\n${state.messageCount}` },
        ],
      },
    ];

    await this.respondToCommand(responseUrl, "", blocks);
  }

  private async respondToCommand(
    responseUrl: string,
    text: string,
    blocks?: SlackBlock[]
  ): Promise<void> {
    const body: Record<string, unknown> = {
      response_type: "ephemeral",
      text,
    };
    if (blocks) {
      body.blocks = blocks;
    }

    await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  /**
   * INTERACTIVE HANDLERS (buttons, modals)
   */

  private async handleInteractive(payload: any): Promise<void> {
    const action = payload.actions?.[0];
    if (!action) return;

    console.log("Slack interactive action:", action.action_id);

    // Acknowledge
    if (payload.response_url) {
      await fetch(payload.response_url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "✅ Action received!",
          replace_original: false,
        }),
      });
    }
  }

  /**
   * MESSAGE SENDING
   */

  private async sendLongMessage(
    channel: string,
    text: string,
    threadTs?: string
  ): Promise<void> {
    if (text.length <= SlackChannel.SPLIT_LENGTH) {
      await this.postMessage(channel, {
        text,
        thread_ts: threadTs,
        mrkdwn: true,
      });
      return;
    }

    // Split by paragraphs for readability
    const chunks = this.splitText(text, SlackChannel.SPLIT_LENGTH);

    for (const chunk of chunks) {
      await this.postMessage(channel, {
        text: chunk,
        thread_ts: threadTs,
        mrkdwn: true,
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
        // Handle single paragraphs longer than maxLength
        if (paragraph.length > maxLength) {
          let remaining = paragraph;
          while (remaining.length > maxLength) {
            chunks.push(remaining.substring(0, maxLength));
            remaining = remaining.substring(maxLength);
          }
          current = remaining;
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

  /**
   * BLOCK KIT BUILDING
   */

  private buildBlocks(richContent: RichContent[]): SlackBlock[] {
    const blocks: SlackBlock[] = [];

    for (const item of richContent) {
      switch (item.type) {
        case "card":
        case "embed":
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*${item.data.title || ""}*\n${item.data.description || ""}`,
            },
          });
          if (item.data.image) {
            blocks.push({
              type: "image",
              image_url: item.data.image as string,
              alt_text: (item.data.title as string) || "image",
            });
          }
          break;

        case "button":
          blocks.push({
            type: "actions",
            elements: [
              {
                type: "button",
                text: {
                  type: "plain_text",
                  text:
                    (item.data.label as string) ||
                    (item.data.text as string) ||
                    "Click",
                },
                action_id: `action_${Date.now()}`,
                value: JSON.stringify(item.data.action || {}),
              },
            ],
          });
          break;

        case "image":
          blocks.push({
            type: "image",
            image_url: item.data.url as string,
            alt_text: (item.data.caption as string) || "image",
            title: item.data.caption
              ? {
                  type: "plain_text",
                  text: item.data.caption as string,
                }
              : undefined,
          });
          break;

        case "code_block":
          blocks.push({
            type: "section",
            text: {
              type: "mrkdwn",
              text: `\`\`\`${item.data.code || ""}\`\`\``,
            },
          });
          break;
      }
    }

    return blocks;
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
   * UTILITIES
   */

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * User State
 */
interface UserState {
  userId: string;
  currentAgent: string;
  messageCount: number;
}

/**
 * Slack Block Kit types (simplified)
 */
interface SlackBlock {
  type: string;
  text?: {
    type: string;
    text: string;
  };
  fields?: Array<{
    type: string;
    text: string;
  }>;
  elements?: Array<{
    type: string;
    text?: { type: string; text: string };
    action_id?: string;
    value?: string;
  }>;
  image_url?: string;
  alt_text?: string;
  title?: {
    type: string;
    text: string;
  };
}
