import chalk from "chalk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getWorkspacesFile = () => join(getDataDir(), "workspaces.json");

interface Workspace {
  id: string;
  name: string;
  description: string;
  createdAt: Date;
  agentCount: number;
  monthlyUsage: number;
  quota?: number;
  active: boolean;
}

interface WorkspacesData {
  workspaces: Workspace[];
  currentWorkspace?: string;
}

/**
 * Load workspaces from file
 */
function loadWorkspaces(): { workspaces: Workspace[]; current?: string } {
  if (!existsSync(getWorkspacesFile())) {
    return { workspaces: [] };
  }

  try {
    const data = readFileSync(getWorkspacesFile(), "utf-8");
    const workspacesData: WorkspacesData = JSON.parse(data);
    return {
      workspaces: workspacesData.workspaces || [],
      current: workspacesData.currentWorkspace,
    };
  } catch (error) {
    console.error(
      chalk.red("Error loading workspaces:"),
      error instanceof Error ? error.message : error
    );
    return { workspaces: [] };
  }
}

/**
 * Format date for display
 */
function formatDate(date: Date): string {
  const d = new Date(date);
  return d.toLocaleDateString();
}

/**
 * Format cost for display
 */
function formatCost(cost: number): string {
  return `$${cost.toFixed(2)}`;
}

/**
 * Display workspaces in table format
 */
function displayWorkspacesTable(workspaces: Workspace[], current?: string): void {
  // Column widths
  const nameWidth = 20;
  const descriptionWidth = 30;
  const agentsWidth = 8;
  const usageWidth = 12;
  const quotaWidth = 12;
  const createdWidth = 12;

  // Header
  console.log(
    chalk.bold(
      [
        "NAME".padEnd(nameWidth),
        "DESCRIPTION".padEnd(descriptionWidth),
        "AGENTS".padEnd(agentsWidth),
        "USAGE".padEnd(usageWidth),
        "QUOTA".padEnd(quotaWidth),
        "CREATED".padEnd(createdWidth),
      ].join(" ")
    )
  );

  console.log(
    chalk.dim(
      "-".repeat(
        nameWidth + descriptionWidth + agentsWidth + usageWidth + quotaWidth + createdWidth + 5
      )
    )
  );

  // Rows
  workspaces.forEach((workspace) => {
    const isCurrent = workspace.name === current;
    const prefix = isCurrent ? chalk.green("▸ ") : "  ";

    const name = workspace.name.substring(0, nameWidth - 3).padEnd(nameWidth - 2);
    const description = workspace.description.substring(0, descriptionWidth - 1).padEnd(descriptionWidth);
    const agents = workspace.agentCount.toString().padEnd(agentsWidth);
    const usage = formatCost(workspace.monthlyUsage).padEnd(usageWidth);
    const quota = workspace.quota ? formatCost(workspace.quota).padEnd(quotaWidth) : chalk.dim("unlimited").padEnd(quotaWidth);
    const created = formatDate(workspace.createdAt).padEnd(createdWidth);

    const nameDisplay = isCurrent ? chalk.bold(name) : name;

    console.log(
      prefix + [nameDisplay, description, agents, chalk.cyan(usage), quota, created].join(" ")
    );
  });
}

/**
 * List all workspaces
 */
export async function listWorkspacesCommand(): Promise<void> {
  const { workspaces, current } = loadWorkspaces();

  if (workspaces.length === 0) {
    console.log(chalk.yellow("\n⚠️  No workspaces found"));
    console.log(chalk.dim("\nCreate your first workspace with:"));
    console.log(chalk.dim("  panda workspace create <name>\n"));
    return;
  }

  // Header
  console.log(chalk.cyan.bold(`\n🏢 Workspaces (${workspaces.length})\n`));

  // Display
  displayWorkspacesTable(workspaces, current);

  // Footer
  if (current) {
    console.log(chalk.dim(`\n▸ Current workspace: ${chalk.bold(current)}`));
  }
  console.log(
    chalk.dim(`\nTotal: ${workspaces.length} workspace${workspaces.length !== 1 ? "s" : ""}`)
  );
  console.log(chalk.dim("\nSwitch workspace with:"));
  console.log(chalk.dim("  panda workspace switch <name>\n"));
}
