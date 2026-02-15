import chalk from "chalk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Agent } from "@agentik-os/shared";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getAgentsFile = () => join(getDataDir(), "agents.json");

interface AgentData {
  agents: Agent[];
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
 * Format channels for display (limit to 3, show count if more)
 */
function formatChannels(channels: string[]): string {
  if (channels.length === 0) {
    return chalk.dim("none");
  }
  if (channels.length <= 3) {
    return channels.join(", ");
  }
  return `${channels.slice(0, 3).join(", ")} +${channels.length - 3}`;
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString();
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
 * Display agents in a formatted table
 */
function displayAgentsTable(agents: Agent[]): void {
  // Column widths
  const idWidth = 8;
  const nameWidth = 20;
  const modelWidth = 20;
  const channelsWidth = 25;
  const statusWidth = 8;

  // Header
  console.log(
    chalk.bold(
      [
        "ID".padEnd(idWidth),
        "NAME".padEnd(nameWidth),
        "MODEL".padEnd(modelWidth),
        "CHANNELS".padEnd(channelsWidth),
        "STATUS".padEnd(statusWidth),
      ].join(" ")
    )
  );

  console.log(
    chalk.dim(
      "-".repeat(idWidth + nameWidth + modelWidth + channelsWidth + statusWidth + 4)
    )
  );

  // Rows
  agents.forEach((agent) => {
    const id = truncate(agent.id, idWidth - 1).padEnd(idWidth);
    const name = truncate(agent.name, nameWidth - 1).padEnd(nameWidth);
    const model = truncate(agent.model, modelWidth - 1).padEnd(modelWidth);
    const channels = formatChannels(agent.channels).padEnd(channelsWidth);
    const status = agent.active
      ? chalk.green("Active").padEnd(statusWidth)
      : chalk.red("Inactive").padEnd(statusWidth);

    console.log([chalk.dim(id), name, chalk.cyan(model), channels, status].join(" "));
  });
}

/**
 * Display agents in detailed list format
 */
function displayAgentsDetailed(agents: Agent[]): void {
  agents.forEach((agent, index) => {
    if (index > 0) {
      console.log(chalk.dim("\n" + "-".repeat(60)));
    }

    console.log(chalk.bold(`\n${agent.name}`));
    console.log(chalk.dim(`ID: ${agent.id}`));
    console.log(`Description: ${agent.description}`);
    console.log(`Model: ${chalk.cyan(agent.model)}`);
    console.log(
      `Status: ${agent.active ? chalk.green("Active") : chalk.red("Inactive")}`
    );
    console.log(`Channels: ${agent.channels.join(", ")}`);

    if (agent.skills.length > 0) {
      console.log(`Skills: ${agent.skills.join(", ")}`);
    }

    console.log(`Created: ${formatDate(agent.createdAt)}`);
  });
}

/**
 * List all agents
 */
export async function listAgentsCommand(options?: {
  detailed?: boolean;
  active?: boolean;
}): Promise<void> {
  const agents = loadAgents();

  if (agents.length === 0) {
    console.log(chalk.yellow("\n⚠️  No agents found"));
    console.log(chalk.dim("Create your first agent with:"));
    console.log(chalk.dim("  panda agent create\n"));
    return;
  }

  // Filter by active status if requested
  let filteredAgents = agents;
  if (options?.active !== undefined) {
    filteredAgents = agents.filter((a) => a.active === options.active);

    if (filteredAgents.length === 0) {
      console.log(
        chalk.yellow(
          `\n⚠️  No ${options.active ? "active" : "inactive"} agents found\n`
        )
      );
      return;
    }
  }

  // Header
  console.log(chalk.cyan.bold(`\n🤖 Agents (${filteredAgents.length})\n`));

  // Display
  if (options?.detailed) {
    displayAgentsDetailed(filteredAgents);
  } else {
    displayAgentsTable(filteredAgents);
  }

  // Footer
  console.log(
    chalk.dim(`\nTotal: ${filteredAgents.length} agent${filteredAgents.length !== 1 ? "s" : ""}`)
  );
  console.log(chalk.dim("Use --detailed for more information\n"));
}
