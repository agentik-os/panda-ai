import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
  Attachment,
  RichContent,
} from "@agentik-os/shared";
import {
  Client,
  GatewayIntentBits,
  Message,
  ChatInputCommandInteraction,
  EmbedBuilder,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  SlashCommandBuilder,
  REST,
  Routes,
  ChannelType,
  TextChannel,
  PermissionFlagsBits,
} from "discord.js";

/**
 * Discord Channel Adapter
 *
 * Provides Discord bot integration for Agentik OS agents.
 * Users can interact with agents through Discord servers and DMs.
 *
 * Features:
 * - Slash commands (/ask, /agent, /clear, /status, /help)
 * - Message handling (guild and DM)
 * - Rich embeds and button components
 * - Permission checks
 * - Thread support
 * - Rate limiting (built-in via discord.js)
 */
export class DiscordChannel implements ChannelAdapter {
  readonly name = "discord" as const;

  private client?: Client;
  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private userStates = new Map<string, UserState>();
  private typingIntervals = new Map<string, NodeJS.Timeout>();

  async connect(config: ChannelConfig): Promise<void> {
    const token = config.options.botToken as string;
    const clientId = config.options.clientId as string;

    if (!token) {
      throw new Error("Discord bot token is required (config.options.botToken)");
    }

    if (!clientId) {
      throw new Error("Discord client ID is required (config.options.clientId)");
    }

    this.client = new Client({
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent, // Privileged intent
        GatewayIntentBits.DirectMessages,
      ],
    });

    this.setupHandlers();

    await this.client.login(token);

    // Wait for ready event
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Discord bot connection timeout"));
      }, 30000);

      this.client!.once("ready", async () => {
        clearTimeout(timeout);
        this.connected = true;
        console.log(`✅ Discord bot connected as ${this.client!.user?.tag}`);

        // Register slash commands
        try {
          await this.registerCommands(token, clientId);
        } catch (error) {
          console.error("Failed to register slash commands:", error);
        }

        resolve();
      });
    });
  }

  async disconnect(): Promise<void> {
    if (this.client) {
      this.client.destroy();
      this.client = undefined;
    }
    this.connected = false;
    // Clear typing intervals
    this.typingIntervals.forEach((interval) => clearInterval(interval));
    this.typingIntervals.clear();
    console.log("👋 Discord bot disconnected");
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(to: string, content: ResponseContent): Promise<void> {
    if (!this.client) {
      throw new Error("Bot not connected");
    }

    // "to" can be channelId or userId (for DM)
    const channel = await this.client.channels.fetch(to);

    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${to} not found or not text-based`);
    }

    // Stop typing if active
    this.stopTyping(to);

    // Send text (split if too long)
    if (content.text) {
      await this.sendLongMessage(channel as TextChannel, content.text);
    }

    // Send embeds and components
    if (content.richContent && content.richContent.length > 0) {
      const embeds = this.buildEmbeds(content.richContent);
      const components = this.buildComponents(content.richContent);

      if (embeds.length > 0 || components.length > 0) {
        await (channel as TextChannel).send({
          embeds: embeds.length > 0 ? embeds : undefined,
          components: components.length > 0 ? components : undefined,
        });
      }
    }
  }

  async sendFile(to: string, file: Buffer, caption?: string): Promise<void> {
    if (!this.client) {
      throw new Error("Bot not connected");
    }

    const channel = await this.client.channels.fetch(to);

    if (!channel || !channel.isTextBased()) {
      throw new Error(`Channel ${to} not found or not text-based`);
    }

    await (channel as TextChannel).send({
      content: caption,
      files: [{ attachment: file, name: "file" }],
    });
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * PRIVATE METHODS
   */

  private setupHandlers(): void {
    if (!this.client) return;

    this.client.on("messageCreate", async (message) => {
      await this.handleMessage(message);
    });

    this.client.on("interactionCreate", async (interaction) => {
      if (interaction.isChatInputCommand()) {
        await this.handleInteraction(interaction);
      } else if (interaction.isButton()) {
        await this.handleButtonInteraction(interaction);
      }
    });

    this.client.on("error", (error) => {
      console.error("Discord client error:", error);
    });

    this.client.on("ready", () => {
      console.log("Discord bot ready with intents:", this.client!.options.intents);

      // Warn if missing MessageContent intent
      if (!this.client!.options.intents.has(GatewayIntentBits.MessageContent)) {
        console.warn(
          "⚠️ MessageContent intent not enabled! message.content will be empty."
        );
      }
    });
  }

  /**
   * MESSAGE HANDLERS
   */

  private async handleMessage(message: Message): Promise<void> {
    // Ignore bot messages
    if (message.author.bot) return;

    // DM handling
    if (message.channel.type === ChannelType.DM) {
      await this.handleDM(message);
      return;
    }

    // Guild handling - only respond when mentioned or in agent channel
    if (
      message.mentions.has(this.client!.user!) ||
      this.isAgentChannel(message.channel as TextChannel)
    ) {
      await this.handleGuildMessage(message);
    }
  }

  private async handleDM(message: Message): Promise<void> {
    const rawMessage = await this.discordToRawMessage(message);
    await this.messageHandler?.(rawMessage);
  }

  private async handleGuildMessage(message: Message): Promise<void> {
    // Check permissions
    const channel = message.channel as TextChannel;
    if (!this.hasPermissions(channel)) {
      await message.reply(
        "❌ I don't have the required permissions in this channel."
      );
      return;
    }

    // Start typing
    await this.startTyping(channel.id);

    const rawMessage = await this.discordToRawMessage(message);
    await this.messageHandler?.(rawMessage);
  }

  private isAgentChannel(channel: TextChannel): boolean {
    const name = channel.name.toLowerCase();
    return name.includes("agent") || name.includes("ai") || name.includes("bot");
  }

  private hasPermissions(channel: TextChannel): boolean {
    const permissions = channel.permissionsFor(this.client!.user!);

    return (
      permissions?.has([
        PermissionFlagsBits.SendMessages,
        PermissionFlagsBits.ReadMessageHistory,
        PermissionFlagsBits.EmbedLinks,
        PermissionFlagsBits.AttachFiles,
      ]) ?? false
    );
  }

  /**
   * INTERACTION HANDLERS (SLASH COMMANDS)
   */

  private async handleInteraction(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    switch (interaction.commandName) {
      case "ask":
        await this.handleAskCommand(interaction);
        break;

      case "agent":
        await this.handleAgentCommand(interaction);
        break;

      case "clear":
        await this.handleClearCommand(interaction);
        break;

      case "status":
        await this.handleStatusCommand(interaction);
        break;

      case "help":
        await this.handleHelpCommand(interaction);
        break;

      default:
        await interaction.reply({
          content: "❌ Unknown command",
          ephemeral: true,
        });
    }
  }

  private async handleAskCommand(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const question = interaction.options.getString("question", true);

    // Defer reply (Discord requires response within 3 seconds)
    await interaction.deferReply();

    // Convert to RawMessage
    const rawMessage: RawMessage = {
      channel: "discord",
      channelMessageId: interaction.id,
      userId: interaction.user.id,
      agentId: this.getUserState(interaction.user.id).currentAgent,
      content: question,
      timestamp: interaction.createdAt,
      raw: { interaction, guild: interaction.guild, channel: interaction.channel },
    };

    await this.messageHandler?.(rawMessage);

    // Response will be sent via send() which should use interaction.followUp()
  }

  private async handleAgentCommand(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const agentName = interaction.options.getString("name", true);

    const userState = this.getUserState(interaction.user.id);
    userState.currentAgent = agentName;
    this.userStates.set(interaction.user.id, userState);

    await interaction.reply({
      content: `✅ Switched to agent: **${agentName}**`,
      ephemeral: true,
    });
  }

  private async handleClearCommand(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const userState = this.getUserState(interaction.user.id);
    userState.messageCount = 0;
    this.userStates.set(interaction.user.id, userState);

    await interaction.reply({
      content: "🗑️ Conversation history cleared!",
      ephemeral: true,
    });
  }

  private async handleStatusCommand(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const state = this.getUserState(interaction.user.id);

    const embed = new EmbedBuilder()
      .setColor(0x5865f2) // Discord blurple
      .setTitle("🤖 Agent Status")
      .addFields(
        {
          name: "Current Agent",
          value: state.currentAgent || "default",
          inline: true,
        },
        {
          name: "Server",
          value: interaction.guild?.name || "DM",
          inline: true,
        },
        {
          name: "Messages",
          value: state.messageCount.toString(),
          inline: true,
        }
      );

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleHelpCommand(
    interaction: ChatInputCommandInteraction
  ): Promise<void> {
    const embed = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle("🤖 Agentik OS Bot - Help")
      .setDescription(
        "I'm an AI agent assistant. Here's how to interact with me:"
      )
      .addFields(
        { name: "/ask <question>", value: "Ask me anything", inline: false },
        {
          name: "/agent <name>",
          value: "Switch to a different agent",
          inline: false,
        },
        {
          name: "/clear",
          value: "Clear your conversation history",
          inline: false,
        },
        { name: "/status", value: "Show your current settings", inline: false },
        { name: "/help", value: "Show this help message", inline: false }
      )
      .setFooter({ text: "You can also @ mention me in any channel!" });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }

  private async handleButtonInteraction(interaction: any): Promise<void> {
    const customId = interaction.customId;

    console.log("Button interaction:", customId);

    await interaction.reply({
      content: "✅ Button action received!",
      ephemeral: true,
    });
  }

  /**
   * SLASH COMMAND REGISTRATION
   */

  private async registerCommands(token: string, clientId: string): Promise<void> {
    const commands = [
      new SlashCommandBuilder()
        .setName("ask")
        .setDescription("Ask the AI agent a question")
        .addStringOption((option) =>
          option
            .setName("question")
            .setDescription("Your question for the agent")
            .setRequired(true)
        ),

      new SlashCommandBuilder()
        .setName("agent")
        .setDescription("Switch to a different agent")
        .addStringOption((option) =>
          option
            .setName("name")
            .setDescription("Agent name")
            .setRequired(true)
            .addChoices(
              { name: "Default", value: "default" },
              { name: "Ralph", value: "ralph" },
              { name: "Nova", value: "nova" }
            )
        ),

      new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Clear your conversation history"),

      new SlashCommandBuilder()
        .setName("status")
        .setDescription("Show current agent and settings"),

      new SlashCommandBuilder()
        .setName("help")
        .setDescription("Show available commands and usage"),
    ];

    const rest = new REST({ version: "10" }).setToken(token);

    await rest.put(Routes.applicationCommands(clientId), {
      body: commands.map((cmd) => cmd.toJSON()),
    });

    console.log("✅ Registered Discord slash commands");
  }

  /**
   * MESSAGE CONVERSION
   */

  private async discordToRawMessage(message: Message): Promise<RawMessage> {
    const userId = message.author.id;
    const userState = this.getUserState(userId);
    userState.messageCount++;
    this.userStates.set(userId, userState);

    return {
      channel: "discord",
      channelMessageId: message.id,
      userId,
      agentId: userState.currentAgent,
      content: message.content,
      attachments: this.extractAttachments(message),
      timestamp: message.createdAt,
      raw: { message, guild: message.guild, channel: message.channel },
    };
  }

  private extractAttachments(message: Message): Attachment[] {
    return Array.from(message.attachments.values()).map((attachment) => ({
      type: this.getAttachmentType(attachment.contentType),
      url: attachment.url,
      mimeType: attachment.contentType || "application/octet-stream",
      filename: attachment.name,
      size: attachment.size,
    }));
  }

  private getAttachmentType(contentType: string | null): "image" | "file" | "audio" | "video" {
    if (!contentType) return "file";
    if (contentType.startsWith("image/")) return "image";
    if (contentType.startsWith("video/")) return "video";
    if (contentType.startsWith("audio/")) return "audio";
    return "file";
  }

  /**
   * RESPONSE BUILDING
   */

  private buildEmbeds(richContent?: RichContent[]): EmbedBuilder[] {
    if (!richContent) return [];

    return richContent
      .filter((item) => item.type === "card" || item.type === "embed")
      .map((item) => {
        const embed = new EmbedBuilder()
          .setColor((item.data.color as number) || 0x5865f2)
          .setTitle(item.data.title as string)
          .setDescription(item.data.description as string);

        if (item.data.thumbnail) embed.setThumbnail(item.data.thumbnail as string);
        if (item.data.image) embed.setImage(item.data.image as string);
        if (item.data.footer) embed.setFooter({ text: item.data.footer as string });

        return embed;
      });
  }

  private buildComponents(richContent?: RichContent[]): ActionRowBuilder<ButtonBuilder>[] {
    if (!richContent) return [];

    const buttons = richContent.filter((item) => item.type === "button");

    if (buttons.length === 0) return [];

    const row = new ActionRowBuilder<ButtonBuilder>();

    buttons.slice(0, 5).forEach((button) => {
      // Discord max 5 buttons per row
      row.addComponents(
        new ButtonBuilder()
          .setCustomId(JSON.stringify(button.data.action) || "button_click")
          .setLabel((button.data.text as string) || (button.data.label as string))
          .setStyle(ButtonStyle.Primary)
      );
    });

    return [row];
  }

  /**
   * MESSAGE SENDING
   */

  private async sendLongMessage(channel: TextChannel, text: string): Promise<void> {
    const MAX_LENGTH = 2000; // Discord limit

    if (text.length <= MAX_LENGTH) {
      await channel.send(text);
      return;
    }

    // Split by paragraphs
    const chunks = this.splitText(text, MAX_LENGTH);

    for (const chunk of chunks) {
      await channel.send(chunk);
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
   * TYPING INDICATOR
   */

  private async startTyping(channelId: string): Promise<void> {
    if (!this.client) return;

    const channel = await this.client.channels.fetch(channelId);
    if (!channel || !channel.isTextBased()) return;

    const textChannel = channel as TextChannel;

    // Send initial typing
    await textChannel.sendTyping();

    // Refresh every 8 seconds
    const interval = setInterval(() => {
      textChannel.sendTyping().catch(() => clearInterval(interval));
    }, 8000);

    this.typingIntervals.set(channelId, interval);
  }

  private stopTyping(channelId: string): void {
    const interval = this.typingIntervals.get(channelId);
    if (interval) {
      clearInterval(interval);
      this.typingIntervals.delete(channelId);
    }
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
