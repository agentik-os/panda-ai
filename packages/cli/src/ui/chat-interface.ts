import inquirer from "inquirer";
import chalk from "chalk";
import type { Agent } from "@agentik-os/shared";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

export interface ChatInterfaceOptions {
  agent: Agent;
  onMessage: (message: string) => Promise<string>;
  onExit?: () => void;
}

/**
 * ChatInterface - Interactive chat UI
 *
 * Provides a readline-based interface for chatting with agents.
 * Handles display, commands, and user input.
 */
export class ChatInterface {
  private agent: Agent;
  private onMessage: (message: string) => Promise<string>;
  private onExit?: () => void;
  private history: ChatMessage[] = [];
  private running = false;

  constructor(options: ChatInterfaceOptions) {
    this.agent = options.agent;
    this.onMessage = options.onMessage;
    this.onExit = options.onExit;
  }

  /**
   * Display welcome banner
   */
  private displayBanner(): void {
    console.log(chalk.bold.cyan("\n╔════════════════════════════════════════════════╗"));
    console.log(chalk.bold.cyan("║      🐼  Agentik OS - Interactive Chat       ║"));
    console.log(chalk.bold.cyan("╚════════════════════════════════════════════════╝"));
    console.log();
    console.log(chalk.bold(`  Agent: ${chalk.cyan(this.agent.name)}`));
    console.log(chalk.dim(`  Model: ${this.agent.model}`));
    console.log(chalk.dim(`  Description: ${this.agent.description}`));
    console.log();
    console.log(chalk.dim("  Commands: /help, /clear, /history, /exit"));
    console.log(chalk.dim("-".repeat(52)));
    console.log();
  }

  /**
   * Display help message
   */
  private displayHelp(): void {
    console.log(chalk.bold("\n📖 Available Commands:"));
    console.log(chalk.gray("  /help              - Show this help message"));
    console.log(chalk.gray("  /exit or /quit     - Exit the chat"));
    console.log(chalk.gray("  /clear             - Clear the screen"));
    console.log(chalk.gray("  /history           - Show conversation history"));
    console.log(chalk.gray("  /agent             - Show current agent info"));
    console.log();
  }

  /**
   * Display agent info
   */
  private displayAgentInfo(): void {
    console.log(chalk.bold(`\n🤖 ${this.agent.name}`));
    console.log(chalk.dim(`   Description: ${this.agent.description}`));
    console.log(chalk.dim(`   Model: ${this.agent.model}`));
    console.log(chalk.dim(`   Temperature: ${this.agent.temperature}`));
    console.log(chalk.dim(`   Max Tokens: ${this.agent.maxTokens}`));
    console.log(chalk.dim(`   Channels: ${this.agent.channels.join(", ")}`));
    if (this.agent.skills.length > 0) {
      console.log(chalk.dim(`   Skills: ${this.agent.skills.join(", ")}`));
    }
    console.log();
  }

  /**
   * Display conversation history
   */
  private displayHistory(): void {
    if (this.history.length === 0) {
      console.log(chalk.yellow("\n⚠️  No conversation history yet\n"));
      return;
    }

    console.log(chalk.bold(`\n📝 Conversation History (${this.history.length} messages):\n`));
    console.log(chalk.dim("-".repeat(52)));

    this.history.forEach((msg, index) => {
      const timestamp = msg.timestamp.toLocaleTimeString();
      const role = msg.role === "user"
        ? chalk.green("You")
        : chalk.blue(this.agent.name);

      console.log(`\n${chalk.dim(`[${timestamp}]`)} ${role}:`);
      console.log(msg.content);

      if (index < this.history.length - 1) {
        console.log(chalk.dim("-".repeat(52)));
      }
    });

    console.log();
  }

  /**
   * Handle slash commands
   */
  private async handleCommand(command: string): Promise<boolean> {
    const cmd = command.toLowerCase().slice(1);

    switch (cmd) {
      case "help":
        this.displayHelp();
        return true;

      case "exit":
      case "quit":
        this.running = false;
        console.log(chalk.yellow("\n👋 Goodbye!\n"));
        if (this.onExit) {
          this.onExit();
        }
        return true;

      case "clear":
        console.clear();
        this.displayBanner();
        return true;

      case "history":
        this.displayHistory();
        return true;

      case "agent":
        this.displayAgentInfo();
        return true;

      default:
        console.log(chalk.red(`\n❌ Unknown command: /${cmd}`));
        console.log(chalk.gray("Type /help for available commands\n"));
        return true;
    }
  }

  /**
   * Format and display assistant response
   */
  private displayAssistantMessage(content: string): void {
    // Simple markdown-like formatting
    let formatted = content;

    // Bold: **text**
    formatted = formatted.replace(/\*\*(.*?)\*\*/g, (_, match) =>
      chalk.bold(match)
    );

    // Italic: *text*
    formatted = formatted.replace(/\*(.*?)\*/g, (_, match) =>
      chalk.italic(match)
    );

    // Code: `code`
    formatted = formatted.replace(/`(.*?)`/g, (_, match) =>
      chalk.bgGray(chalk.white(` ${match} `))
    );

    console.log(chalk.blue(`\n${this.agent.name}:`));
    console.log(formatted);
    console.log();
  }

  /**
   * Start the interactive chat loop
   */
  async start(): Promise<void> {
    this.running = true;
    this.displayBanner();

    while (this.running) {
      try {
        const { message } = await inquirer.prompt<{ message: string }>([
          {
            type: "input",
            name: "message",
            message: chalk.green("You:"),
            prefix: "",
          },
        ]);

        // Handle commands
        if (message.startsWith("/")) {
          await this.handleCommand(message);
          continue;
        }

        // Empty message
        if (!message.trim()) {
          continue;
        }

        // Add user message to history
        this.history.push({
          role: "user",
          content: message,
          timestamp: new Date(),
        });

        // Get response from agent (via callback)
        try {
          console.log(chalk.yellow("\n⏳ Agent is thinking..."));
          const response = await this.onMessage(message);

          // Add assistant response to history
          this.history.push({
            role: "assistant",
            content: response,
            timestamp: new Date(),
          });

          // Display response
          this.displayAssistantMessage(response);
        } catch (error) {
          console.log(
            chalk.red(
              `\n❌ Error: ${error instanceof Error ? error.message : "Unknown error"}`
            )
          );
          console.log();
        }
      } catch (error) {
        // Handle Ctrl+C or other interruptions
        if ((error as { isTtyError?: boolean })?.isTtyError) {
          console.log(chalk.red("\n❌ Prompt error - exiting\n"));
        }
        this.running = false;
      }
    }
  }

  /**
   * Stop the chat interface
   */
  stop(): void {
    this.running = false;
  }

  /**
   * Get conversation history
   */
  getHistory(): ChatMessage[] {
    return [...this.history];
  }
}
