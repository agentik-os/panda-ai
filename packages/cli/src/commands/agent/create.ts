import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { writeFileSync, existsSync, mkdirSync, readFileSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import { randomUUID } from "crypto";
import type { Agent, AgentConfig } from "@agentik-os/shared";
import {
  agentBasicQuestions,
  agentModelQuestions,
  agentChannelsQuestions,
  agentSkillsQuestions,
  agentConfirmQuestion,
} from "../../prompts/agent-create.js";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getAgentsFile = () => join(getDataDir(), "agents.json");

interface AgentData {
  agents: Agent[];
}

/**
 * Load existing agents from file
 */
export function loadAgents(): AgentData {
  if (!existsSync(getAgentsFile())) {
    return { agents: [] };
  }

  try {
    const data = readFileSync(getAgentsFile(), "utf-8");
    return JSON.parse(data);
  } catch (error) {
    console.warn(
      chalk.yellow("⚠️  Failed to load existing agents, starting fresh")
    );
    return { agents: [] };
  }
}

/**
 * Save agents to file
 */
function saveAgents(data: AgentData): void {
  // Ensure data directory exists
  if (!existsSync(getDataDir())) {
    mkdirSync(getDataDir(), { recursive: true });
  }

  writeFileSync(getAgentsFile(), JSON.stringify(data, null, 2));
}

/**
 * Display agent summary
 */
function displayAgentSummary(agent: Agent): void {
  console.log(chalk.cyan("\n📋 Agent Summary:"));
  console.log(chalk.dim(`   ID: ${agent.id}\n`));

  console.log(chalk.bold("   Basic Info:"));
  console.log(`   Name: ${agent.name}`);
  console.log(`   Description: ${agent.description}`);
  console.log(`   System Prompt: ${agent.systemPrompt.substring(0, 80)}...`);

  console.log(chalk.bold("\n   Model Configuration:"));
  console.log(`   Model: ${agent.model}`);
  console.log(`   Temperature: ${agent.temperature}`);
  console.log(`   Max Tokens: ${agent.maxTokens}`);

  console.log(chalk.bold("\n   Channels:"));
  agent.channels.forEach((channel: string) => {
    console.log(`   - ${channel}`);
  });

  if (agent.skills.length > 0) {
    console.log(chalk.bold("\n   Skills:"));
    agent.skills.forEach((skill: string) => {
      console.log(`   - ${skill}`);
    });
  }

  console.log(chalk.bold("\n   Status:"));
  console.log(`   Active: ${agent.active ? chalk.green("Yes") : chalk.red("No")}`);
  console.log(chalk.dim(`   Created: ${new Date(agent.createdAt).toLocaleString()}`));
}

/**
 * Create a new agent via interactive wizard
 */
export async function createAgentCommand(
  name?: string,
  options?: {
    model?: string;
    channels?: string;
    skills?: string;
    yes?: boolean;
    description?: string;
    systemPrompt?: string;
  }
): Promise<void> {
  console.log(chalk.cyan.bold("\n🤖 Create New Agent\n"));

  const isNonInteractive = options?.yes || false;
  let agentConfig: Partial<AgentConfig> = {};

  // If name provided via CLI arg, use it
  if (name) {
    agentConfig.name = name;
    console.log(chalk.dim(`Name: ${name} (from argument)`));
  }

  // If model provided via CLI option, use it
  if (options?.model) {
    agentConfig.model = options.model;
    console.log(chalk.dim(`Model: ${options.model} (from option)`));
  }

  // If channels provided via CLI option, parse them
  if (options?.channels) {
    agentConfig.channels = options.channels.split(",").map((c) => c.trim());
    console.log(
      chalk.dim(`Channels: ${agentConfig.channels.join(", ")} (from option)`)
    );
  }

  // If skills provided via CLI option, parse them
  if (options?.skills) {
    agentConfig.skills = options.skills.split(",").map((s) => s.trim());
    console.log(
      chalk.dim(`Skills: ${agentConfig.skills.join(", ")} (from option)`)
    );
  }

  // If description provided via CLI option, use it
  if (options?.description) {
    agentConfig.description = options.description;
    console.log(chalk.dim(`Description: ${options.description} (from option)`));
  }

  // If systemPrompt provided via CLI option, use it
  if (options?.systemPrompt) {
    agentConfig.systemPrompt = options.systemPrompt;
    console.log(
      chalk.dim(`System Prompt: ${options.systemPrompt.substring(0, 50)}... (from option)`)
    );
  }

  // Interactive wizard for missing fields (unless --yes flag)
  if (!isNonInteractive) {
    console.log(chalk.dim("\nLet's configure your agent...\n"));
  }

  // Basic info
  if (!agentConfig.name) {
    if (isNonInteractive) {
      console.error(chalk.red("❌ Error: Agent name is required"));
      process.exit(1);
    }
    const basicAnswers = await inquirer.prompt(agentBasicQuestions);
    agentConfig = { ...agentConfig, ...basicAnswers };
  } else if (!isNonInteractive) {
    // Name provided, but still need description and system prompt in interactive mode
    const questions = [];
    if (!agentConfig.description) {
      const descriptionPrompt = agentBasicQuestions.find(
        (q: any) => q.name === "description"
      );
      questions.push(descriptionPrompt!);
    }
    if (!agentConfig.systemPrompt) {
      const systemPromptQuestion = agentBasicQuestions.find(
        (q: any) => q.name === "systemPrompt"
      );
      questions.push(systemPromptQuestion!);
    }

    if (questions.length > 0) {
      const answers = await inquirer.prompt(questions);
      agentConfig = { ...agentConfig, ...answers };
    }
  }

  // Apply defaults for non-interactive mode
  if (isNonInteractive) {
    if (!agentConfig.description) {
      agentConfig.description = `AI agent: ${agentConfig.name}`;
    }
    if (!agentConfig.systemPrompt) {
      agentConfig.systemPrompt = `You are ${agentConfig.name}, a helpful AI assistant.`;
    }
  }

  // Model configuration
  if (!agentConfig.model) {
    if (isNonInteractive) {
      agentConfig.model = "claude-sonnet-4.5";
    } else {
      const modelAnswers = await inquirer.prompt(agentModelQuestions);
      agentConfig = { ...agentConfig, ...modelAnswers };
    }
  } else if (!isNonInteractive) {
    // Model provided, but still need temperature and maxTokens in interactive mode
    const tempQuestion = agentModelQuestions.find(
      (q: any) => q.name === "temperature"
    );
    const maxTokensQuestion = agentModelQuestions.find(
      (q: any) => q.name === "maxTokens"
    );

    const answers = await inquirer.prompt([tempQuestion!, maxTokensQuestion!]);
    agentConfig = { ...agentConfig, ...answers };
  }

  // Channels
  if (!agentConfig.channels) {
    if (isNonInteractive) {
      agentConfig.channels = ["cli"];
    } else {
      const channelsAnswers = await inquirer.prompt(agentChannelsQuestions);
      agentConfig = { ...agentConfig, ...channelsAnswers };
    }
  }

  // Skills
  if (!agentConfig.skills) {
    if (isNonInteractive) {
      agentConfig.skills = [];
    } else {
      const skillsAnswers = await inquirer.prompt(agentSkillsQuestions);
      agentConfig = { ...agentConfig, ...skillsAnswers };
    }
  }

  // Create agent object
  const now = new Date();
  const agent: Agent = {
    id: randomUUID(),
    name: agentConfig.name!,
    description: agentConfig.description!,
    systemPrompt: agentConfig.systemPrompt!,
    model: agentConfig.model || "claude-sonnet-4.5",
    temperature: agentConfig.temperature ?? 0.7,
    maxTokens: agentConfig.maxTokens ?? 4096,
    active: true,
    channels: agentConfig.channels || ["cli"],
    skills: agentConfig.skills || [],
    createdAt: now,
    updatedAt: now,
  };

  // Display summary
  displayAgentSummary(agent);

  // Confirm creation (skip in non-interactive mode)
  if (!isNonInteractive) {
    const { confirm } = await inquirer.prompt(agentConfirmQuestion);

    if (!confirm) {
      console.log(chalk.dim("\nAgent creation cancelled.\n"));
      return;
    }
  }

  // Save agent
  const spinner = ora("Creating agent...").start();

  try {
    const agentData = loadAgents();
    agentData.agents.push(agent);
    saveAgents(agentData);

    spinner.succeed(chalk.green("Agent created successfully!"));

    console.log(chalk.cyan("\n🚀 Next steps:"));
    console.log(chalk.dim(`   panda agent list          # View all agents`));
    console.log(chalk.dim(`   panda chat ${agent.name}    # Start chatting\n`));
  } catch (error) {
    spinner.fail(chalk.red("Failed to create agent"));
    console.error(error);
    process.exit(1);
  }
}
