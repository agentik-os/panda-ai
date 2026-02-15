import chalk from "chalk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getHistoryFile = () => join(getDataDir(), "dream-history.json");

interface DreamExecution {
  id: string;
  agentId: string;
  agentName: string;
  startTime: Date;
  endTime: Date;
  status: "completed" | "stopped" | "failed";
  messagesProcessed: number;
  tokenCount: number;
  cost: number;
  summary: string;
}

interface DreamHistory {
  executions: DreamExecution[];
}

/**
 * Load dream execution history from file
 */
function loadDreamHistory(agentId?: string): DreamExecution[] {
  if (!existsSync(getHistoryFile())) {
    return [];
  }

  try {
    const data = readFileSync(getHistoryFile(), "utf-8");
    const history: DreamHistory = JSON.parse(data);
    const executions = history.executions || [];

    // Filter by agent if specified
    if (agentId) {
      return executions.filter((e) => e.agentId === agentId);
    }

    return executions;
  } catch (error) {
    console.error(
      chalk.red("Error loading dream history:"),
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * View dream execution history
 *
 * NOTE: Placeholder implementation until backend Step 107-110 is complete.
 * Will be wired to packages/runtime/src/dreams/manager.ts
 */
export async function viewDreamsCommand(agentId?: string): Promise<void> {
  const executions = loadDreamHistory(agentId);

  if (executions.length === 0) {
    console.log(chalk.yellow("\n⚠️  No dream executions found"));
    if (agentId) {
      console.log(chalk.dim(`For agent: ${agentId}`));
    }
    console.log(chalk.dim("\nTrigger a dream session with:"));
    console.log(chalk.dim("  panda dreams trigger <agent-id>\n"));
    return;
  }

  console.log(chalk.cyan.bold("\n🌙 Dream Execution History\n"));

  // Display each execution
  executions.forEach((exec) => {
    console.log(chalk.bold(`${exec.agentName}`));
    console.log(chalk.dim(`Agent ID: ${exec.agentId}`));
    console.log(chalk.dim(`Execution ID: ${exec.id}`));

    // Status with color
    const statusColor =
      exec.status === "completed"
        ? chalk.green
        : exec.status === "stopped"
          ? chalk.yellow
          : chalk.red;
    console.log(`Status: ${statusColor(exec.status)}`);

    // Time
    const startTime = new Date(exec.startTime);
    const endTime = new Date(exec.endTime);
    const duration = Math.abs(endTime.getTime() - startTime.getTime()) / 1000 / 60; // minutes
    console.log(`Started: ${startTime.toLocaleString()}`);
    console.log(`Ended: ${endTime.toLocaleString()}`);
    console.log(`Duration: ${duration.toFixed(1)} minutes`);

    // Stats
    console.log(`\nMessages processed: ${exec.messagesProcessed}`);
    console.log(`Tokens used: ${exec.tokenCount}`);
    console.log(`Cost: $${exec.cost.toFixed(2)}`);

    // Summary
    console.log(`\nSummary: ${exec.summary}`);
    console.log(chalk.dim("\n" + "-".repeat(60) + "\n"));
  });

  console.log(
    chalk.dim(`Total: ${executions.length} execution${executions.length !== 1 ? "s" : ""}\n`)
  );

  // TODO: Wire to backend when Step 107-110 is complete
  // - Fetch executions from dream manager
  // - Include detailed action logs
  // - Show memory snapshots before/after
  // - Display model reasoning traces
}
