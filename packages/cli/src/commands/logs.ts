import chalk from "chalk";
import { readFileSync, existsSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getConversationsDir = () => join(getDataDir(), "conversations");

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  model?: string;
  tokens?: number;
}

interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  channel: string;
  userId: string;
  messages: Message[];
  startedAt: Date;
  updatedAt: Date;
}

/**
 * Load all conversations from directory
 */
function loadConversations(): Conversation[] {
  if (!existsSync(getConversationsDir())) {
    return [];
  }

  try {
    const files = readdirSync(getConversationsDir());
    const conversations: Conversation[] = [];

    for (const file of files) {
      if (!file.endsWith(".json")) {
        continue;
      }

      try {
        const filePath = join(getConversationsDir(), file);
        const data = readFileSync(filePath, "utf-8");
        const conversation: Conversation = JSON.parse(data);
        conversations.push(conversation);
      } catch (error) {
        // Skip corrupted files
        console.warn(chalk.yellow(`Warning: Skipped corrupted file ${file}`));
      }
    }

    // Sort by most recent first
    conversations.sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return conversations;
  } catch (error) {
    console.error(
      chalk.red("Error loading conversations:"),
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) {
    return "just now";
  } else if (minutes < 60) {
    return `${minutes}m ago`;
  } else if (hours < 24) {
    return `${hours}h ago`;
  } else if (days < 7) {
    return `${days}d ago`;
  } else {
    return d.toLocaleDateString();
  }
}

/**
 * Format timestamp for detailed view
 */
function formatTimestamp(date: Date): string {
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Truncate string with ellipsis
 */
function truncate(str: string, maxLength: number): string {
  if (str.length <= maxLength) {
    return str;
  }
  return str.substring(0, maxLength - 3) + "...";
}

/**
 * Display conversations in list format
 */
function displayConversationsList(conversations: Conversation[]): void {
  console.log(
    chalk.bold(
      [
        "ID".padEnd(10),
        "AGENT".padEnd(20),
        "CHANNEL".padEnd(12),
        "MESSAGES".padEnd(10),
        "LAST UPDATED".padEnd(15),
      ].join(" ")
    )
  );

  console.log(chalk.dim("-".repeat(70)));

  conversations.forEach((conv) => {
    const id = truncate(conv.id, 8).padEnd(10);
    const agent = truncate(conv.agentName, 18).padEnd(20);
    const channel = conv.channel.padEnd(12);
    const msgCount = String(conv.messages.length).padEnd(10);
    const updated = formatDate(conv.updatedAt).padEnd(15);

    console.log(
      [chalk.dim(id), chalk.cyan(agent), channel, msgCount, chalk.dim(updated)].join(
        " "
      )
    );
  });
}

/**
 * Display a single conversation with messages
 */
function displayConversationDetailed(conversation: Conversation): void {
  console.log(chalk.cyan.bold(`\n💬 Conversation: ${conversation.agentName}\n`));
  console.log(chalk.dim(`ID: ${conversation.id}`));
  console.log(chalk.dim(`Channel: ${conversation.channel}`));
  console.log(
    chalk.dim(`Started: ${formatTimestamp(conversation.startedAt)}`)
  );
  console.log(
    chalk.dim(`Updated: ${formatTimestamp(conversation.updatedAt)}`)
  );
  console.log(
    chalk.dim(`Messages: ${conversation.messages.length}\n`)
  );
  console.log(chalk.dim("-".repeat(70)));

  conversation.messages.forEach((msg, index) => {
    const timestamp = formatTimestamp(msg.timestamp);
    const role = msg.role === "user" ? chalk.green("You") : chalk.blue(conversation.agentName);

    console.log(
      `\n${chalk.dim(`[${timestamp}]`)} ${role}${msg.model ? chalk.dim(` (${msg.model})`) : ""}:`
    );
    console.log(msg.content);

    if (msg.tokens) {
      console.log(chalk.dim(`   ${msg.tokens} tokens`));
    }

    if (index < conversation.messages.length - 1) {
      console.log(chalk.dim("-".repeat(70)));
    }
  });
}

/**
 * View conversation logs
 */
export async function logsCommand(options?: {
  agent?: string;
  channel?: string;
  limit?: number;
  conversation?: string;
  detailed?: boolean;
}): Promise<void> {
  let conversations = loadConversations();

  if (conversations.length === 0) {
    console.log(chalk.yellow("\n⚠️  No conversations found"));
    console.log(chalk.dim("Start chatting with an agent to see logs:"));
    console.log(chalk.dim("  panda chat <agent-name>\n"));
    return;
  }

  // Filter by specific conversation ID
  if (options?.conversation) {
    const conv = conversations.find((c) => c.id.startsWith(options.conversation!));

    if (!conv) {
      console.log(
        chalk.yellow(`\n⚠️  Conversation not found: ${options.conversation}\n`)
      );
      return;
    }

    displayConversationDetailed(conv);
    console.log(); // Empty line at end
    return;
  }

  // Filter by agent
  if (options?.agent) {
    conversations = conversations.filter(
      (c) =>
        c.agentName.toLowerCase().includes(options.agent!.toLowerCase()) ||
        c.agentId.startsWith(options.agent!)
    );

    if (conversations.length === 0) {
      console.log(
        chalk.yellow(`\n⚠️  No conversations found for agent: ${options.agent}\n`)
      );
      return;
    }
  }

  // Filter by channel
  if (options?.channel) {
    conversations = conversations.filter(
      (c) => c.channel.toLowerCase() === options.channel!.toLowerCase()
    );

    if (conversations.length === 0) {
      console.log(
        chalk.yellow(
          `\n⚠️  No conversations found for channel: ${options.channel}\n`
        )
      );
      return;
    }
  }

  // Apply limit
  if (options?.limit) {
    conversations = conversations.slice(0, options.limit);
  }

  // Display
  console.log(
    chalk.cyan.bold(`\n💬 Conversations (${conversations.length})\n`)
  );

  if (options?.detailed) {
    conversations.forEach((conv, index) => {
      if (index > 0) {
        console.log(chalk.dim("\n" + "=".repeat(70)));
      }
      displayConversationDetailed(conv);
    });
  } else {
    displayConversationsList(conversations);
  }

  // Footer
  console.log(
    chalk.dim(
      `\nTotal: ${conversations.length} conversation${conversations.length !== 1 ? "s" : ""}`
    )
  );
  console.log(
    chalk.dim("Use --conversation <id> to view a specific conversation")
  );
  console.log(chalk.dim("Use --detailed to see all messages\n"));
}
