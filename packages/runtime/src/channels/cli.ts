import type {
  ChannelAdapter,
  ChannelConfig,
  RawMessage,
  ResponseContent,
} from "@agentik-os/shared";
import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";

/**
 * CLI Channel Adapter
 *
 * Provides an interactive terminal interface for chatting with agents.
 * Users can run the CLI and have real-time conversations with configured agents.
 */
export class CLIChannel implements ChannelAdapter {
  readonly name = "cli" as const;

  private messageHandler?: (msg: RawMessage) => Promise<void>;
  private connected = false;
  private spinner = ora();
  private userId = "cli_user";
  private currentAgentId = "default";

  async connect(config: ChannelConfig): Promise<void> {
    // Extract config options
    this.userId = (config.options.userId as string) || "cli_user";
    this.currentAgentId =
      (config.options.defaultAgentId as string) || "default";

    // Display welcome banner
    this.displayWelcomeBanner();

    this.connected = true;
  }

  async disconnect(): Promise<void> {
    console.log(chalk.yellow("\n👋 Goodbye!"));
    this.connected = false;
  }

  onMessage(handler: (msg: RawMessage) => Promise<void>): void {
    this.messageHandler = handler;
  }

  async send(_to: string, content: ResponseContent): Promise<void> {
    // Stop spinner if running
    this.spinner.stop();

    // Format and display the response
    console.log(
      chalk.green(`\n${this.currentAgentId}:`),
      this.formatResponse(content)
    );

    // Display rich content if present
    if (content.richContent && content.richContent.length > 0) {
      this.displayRichContent(content.richContent);
    }
  }

  async sendFile(_to: string, file: Buffer, caption?: string): Promise<void> {
    this.spinner.stop();

    // Save file to /tmp
    const fs = await import("fs/promises");
    const path = await import("path");
    const filename = `cli_file_${Date.now()}.dat`;
    const filepath = path.join("/tmp", filename);

    await fs.writeFile(filepath, file);

    console.log(
      chalk.blue(`\n📎 File saved: ${filepath}${caption ? ` - ${caption}` : ""}`)
    );
  }

  isConnected(): boolean {
    return this.connected;
  }

  /**
   * Start the interactive chat loop
   */
  async startChatLoop(): Promise<void> {
    while (this.connected) {
      const { message } = await inquirer.prompt<{ message: string }>([
        {
          type: "input",
          name: "message",
          message: chalk.blue("You:"),
          prefix: "",
        },
      ]);

      // Handle commands
      if (message.startsWith("/")) {
        const handled = await this.handleCommand(message);
        if (handled) continue;
      }

      // Empty message
      if (!message.trim()) {
        continue;
      }

      // Send to pipeline
      await this.sendMessage(message);
    }
  }

  /**
   * Send a message to the pipeline
   */
  private async sendMessage(content: string): Promise<void> {
    if (!this.messageHandler) {
      console.log(
        chalk.red("Error: Message handler not configured. Did you call onMessage()?")
      );
      return;
    }

    const rawMessage: RawMessage = {
      channel: "cli",
      channelMessageId: `cli_${Date.now()}`,
      userId: this.userId,
      content,
      timestamp: new Date(),
    };

    // Show thinking spinner
    this.spinner.start(chalk.yellow("Agent is thinking..."));

    try {
      await this.messageHandler(rawMessage);
    } catch (error) {
      this.spinner.stop();
      console.log(
        chalk.red(
          `\n❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
        )
      );
    }
  }

  /**
   * Handle CLI commands
   */
  private async handleCommand(command: string): Promise<boolean> {
    const [cmd, ...args] = command.slice(1).split(" ");

    if (!cmd) {
      return false;
    }

    switch (cmd.toLowerCase()) {
      case "exit":
      case "quit":
        await this.disconnect();
        return true;

      case "agent":
        if (args.length > 0) {
          this.currentAgentId = args[0]!;
          console.log(
            chalk.yellow(`\n✓ Switched to agent: ${this.currentAgentId}`)
          );
        } else {
          console.log(chalk.yellow(`\nCurrent agent: ${this.currentAgentId}`));
        }
        return true;

      case "clear":
        console.clear();
        this.displayWelcomeBanner();
        return true;

      case "help":
        this.displayHelp();
        return true;

      default:
        console.log(chalk.red(`\n❌ Unknown command: /${cmd}`));
        console.log(chalk.gray("Type /help for available commands"));
        return true;
    }
  }

  /**
   * Display welcome banner
   */
  private displayWelcomeBanner(): void {
    console.log(chalk.bold.cyan("\n╔════════════════════════════════════╗"));
    console.log(chalk.bold.cyan("║   🤖  Agentik OS - CLI Chat     ║"));
    console.log(chalk.bold.cyan("╚════════════════════════════════════╝\n"));
    console.log(
      chalk.gray(`User: ${this.userId} | Agent: ${this.currentAgentId}`)
    );
    console.log(chalk.gray("Type /help for commands, /exit to quit\n"));
  }

  /**
   * Display help
   */
  private displayHelp(): void {
    console.log(chalk.bold("\n📖 Available Commands:"));
    console.log(chalk.gray("  /help              - Show this help message"));
    console.log(chalk.gray("  /exit or /quit     - Exit the CLI"));
    console.log(chalk.gray("  /agent [name]      - Switch to a different agent"));
    console.log(
      chalk.gray("  /clear             - Clear the screen and show banner")
    );
    console.log();
  }

  /**
   * Format response content
   */
  private formatResponse(content: ResponseContent): string {
    // Basic markdown-like formatting
    let text = content.text;

    // Bold: **text**
    text = text.replace(/\*\*(.*?)\*\*/g, (_, match) => chalk.bold(match));

    // Italic: *text*
    text = text.replace(/\*(.*?)\*/g, (_, match) => chalk.italic(match));

    // Code: `code`
    text = text.replace(/`(.*?)`/g, (_, match) =>
      chalk.bgGray(chalk.white(match))
    );

    return text;
  }

  /**
   * Display rich content
   */
  private displayRichContent(richContent: ResponseContent["richContent"]): void {
    if (!richContent) return;

    for (const item of richContent) {
      switch (item.type) {
        case "code_block":
          console.log(
            chalk.bgBlack(chalk.white(`\n${item.data.code as string}\n`))
          );
          break;

        case "button":
          console.log(chalk.blue(`  [${item.data.text as string}]`));
          break;

        case "card":
          console.log(chalk.cyan(`\n📋 ${item.data.title as string}`));
          if (item.data.description) {
            console.log(chalk.gray(`   ${item.data.description as string}`));
          }
          break;

        default:
          // Ignore other types for now
          break;
      }
    }
  }
}
