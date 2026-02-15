import chalk from "chalk";
import inquirer from "inquirer";
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { Agent } from "@agentik-os/shared";
import { ChatInterface } from "../ui/chat-interface.js";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getAgentsFile = () => join(getDataDir(), "agents.json");
const getConversationsDir = () => join(getDataDir(), "conversations");

interface AgentData {
  agents: Agent[];
}

interface Conversation {
  id: string;
  agentId: string;
  agentName: string;
  channel: string;
  userId: string;
  messages: Array<{
    id: string;
    role: "user" | "assistant";
    content: string;
    timestamp: Date;
    model?: string;
  }>;
  startedAt: Date;
  updatedAt: Date;
}

/**
 * Load agents from file
 */
function loadAgents(): Agent[] {
  if (!existsSync(getAgentsFile())) {
    return [];
  }

  try {
    const data = readFileSync(getAgentsFile(), "utf-8");
    const agentData: AgentData = JSON.parse(data);
    return agentData.agents || [];
  } catch (error) {
    console.error(
      chalk.red("Error loading agents:"),
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Find agent by name or ID
 */
function findAgent(agents: Agent[], nameOrId: string): Agent | undefined {
  const search = nameOrId.toLowerCase();
  return agents.find(
    (a) =>
      a.name.toLowerCase() === search ||
      a.name.toLowerCase().includes(search) ||
      a.id.startsWith(nameOrId)
  );
}

/**
 * Select agent interactively
 */
async function selectAgent(agents: Agent[]): Promise<Agent | null> {
  if (agents.length === 0) {
    console.log(chalk.yellow("\n⚠️  No agents found"));
    console.log(chalk.dim("Create an agent first:"));
    console.log(chalk.dim("  panda agent create\n"));
    return null;
  }

  if (agents.length === 1) {
    console.log(chalk.dim(`\nUsing agent: ${agents[0]!.name}`));
    return agents[0]!;
  }

  const { agentId } = await inquirer.prompt<{ agentId: string }>([
    {
      type: "list",
      name: "agentId",
      message: "Select an agent to chat with:",
      choices: agents.map((agent) => ({
        name: `${agent.name} (${agent.model})`,
        value: agent.id,
      })),
    },
  ]);

  return agents.find((a) => a.id === agentId) || null;
}

/**
 * Save conversation to file
 */
function saveConversation(conversation: Conversation): void {
  try {
    // Ensure conversations directory exists
    if (!existsSync(getConversationsDir())) {
      mkdirSync(getConversationsDir(), { recursive: true });
    }

    const filepath = join(getConversationsDir(), `${conversation.id}.json`);
    writeFileSync(filepath, JSON.stringify(conversation, null, 2));
  } catch (error) {
    console.error(
      chalk.yellow("Warning: Failed to save conversation:"),
      error instanceof Error ? error.message : error
    );
  }
}

/**
 * Generate a mock response (placeholder until runtime integration)
 */
async function generateMockResponse(
  message: string,
  agent: Agent
): Promise<string> {
  // Simulate thinking time
  await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 1000));

  // Simple mock responses based on keywords
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return `Hello! I'm ${agent.name}. How can I help you today?`;
  }

  if (lowerMessage.includes("help")) {
    return `I'm here to assist you! I can help with various tasks. What would you like to know?`;
  }

  if (lowerMessage.includes("your name") || lowerMessage.includes("who are you")) {
    return `I'm ${agent.name}. ${agent.description}`;
  }

  if (lowerMessage.includes("model")) {
    return `I'm running on ${agent.model} with a temperature of ${agent.temperature}.`;
  }

  if (lowerMessage.includes("thank")) {
    return "You're welcome! Feel free to ask me anything else.";
  }

  if (lowerMessage.includes("bye") || lowerMessage.includes("goodbye")) {
    return "Goodbye! It was nice chatting with you. Feel free to come back anytime!";
  }

  // Default response
  return `I understand you said: "${message}". This is a demo response. Full AI integration will be available once the runtime is connected.`;
}

/**
 * Chat with an agent
 */
export async function chatCommand(agentNameOrId?: string): Promise<void> {
  const agents = loadAgents();

  let agent: Agent | null | undefined = null;

  // If agent specified, try to find it
  if (agentNameOrId) {
    agent = findAgent(agents, agentNameOrId);

    if (!agent) {
      console.log(
        chalk.yellow(`\n⚠️  Agent not found: ${agentNameOrId}`)
      );
      console.log(chalk.dim("Available agents:"));
      agents.forEach((a) => {
        console.log(chalk.dim(`  - ${a.name} (${a.id.substring(0, 8)}...)`));
      });
      console.log();
      return;
    }
  } else {
    // Let user select
    agent = await selectAgent(agents);
  }

  if (!agent) {
    return;
  }

  // Create conversation
  const conversation: Conversation = {
    id: randomUUID(),
    agentId: agent.id,
    agentName: agent.name,
    channel: "cli",
    userId: "cli_user",
    messages: [],
    startedAt: new Date(),
    updatedAt: new Date(),
  };

  // Create chat interface
  const chat = new ChatInterface({
    agent,
    onMessage: async (message) => {
      const response = await generateMockResponse(message, agent!);

      // Save messages to conversation
      conversation.messages.push({
        id: randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
      });

      conversation.messages.push({
        id: randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
        model: agent!.model,
      });

      conversation.updatedAt = new Date();

      return response;
    },
    onExit: () => {
      // Save conversation on exit
      saveConversation(conversation);
      console.log(chalk.dim(`Conversation saved: ${conversation.id}\n`));
    },
  });

  // Start chat
  await chat.start();
}
