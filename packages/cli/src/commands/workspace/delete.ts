import chalk from "chalk";
import ora from "ora";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getWorkspacesFile = () => join(getDataDir(), "workspaces.json");
const getActiveWorkspaceFile = () => join(getDataDir(), "active-workspace.json");

interface Workspace {
  id: string;
  name: string;
  description: string;
  agentCount: number;
  createdAt: Date;
  isDefault?: boolean;
}

interface WorkspacesData {
  workspaces: Workspace[];
}

interface ActiveWorkspaceData {
  activeWorkspace: string;
}

/**
 * Load workspaces from file
 */
function loadWorkspaces(): Workspace[] {
  if (!existsSync(getWorkspacesFile())) {
    return [];
  }

  try {
    const data = readFileSync(getWorkspacesFile(), "utf-8");
    const workspacesData: WorkspacesData = JSON.parse(data);
    return workspacesData.workspaces || [];
  } catch (error) {
    console.error(
      chalk.red("Error loading workspaces:"),
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Load active workspace from file
 */
function loadActiveWorkspace(): string | undefined {
  if (!existsSync(getActiveWorkspaceFile())) {
    return undefined;
  }

  try {
    const data = readFileSync(getActiveWorkspaceFile(), "utf-8");
    const activeData: ActiveWorkspaceData = JSON.parse(data);
    return activeData.activeWorkspace;
  } catch (error) {
    return undefined;
  }
}

/**
 * Save workspaces to file
 */
function saveWorkspaces(workspaces: Workspace[]): void {
  const data: WorkspacesData = { workspaces };
  writeFileSync(getWorkspacesFile(), JSON.stringify(data, null, 2));
}

/**
 * Delete a workspace
 *
 * NOTE: Placeholder implementation until backend Step 120-123 is complete.
 * Will be wired to packages/runtime/src/workspace/manager.ts
 */
export async function deleteWorkspaceCommand(
  name?: string,
  options?: {
    force?: boolean;
  }
): Promise<void> {
  if (!name) {
    console.error(chalk.red("\n❌ Workspace name required"));
    console.log(chalk.dim("Usage: panda workspace delete <name>\n"));
    process.exit(1);
  }

  const workspaces = loadWorkspaces();
  const activeWorkspaceId = loadActiveWorkspace();

  // Find the workspace
  const workspace = workspaces.find((w) => w.name === name);

  if (!workspace) {
    console.error(chalk.red(`\n❌ Workspace not found: ${name}\n`));
    return;
  }

  // Check if it's the active workspace
  if (workspace.id === activeWorkspaceId) {
    console.error(chalk.red("\n❌ Cannot delete active workspace"));
    console.log(chalk.dim("Switch to another workspace first:"));
    console.log(chalk.dim("  panda workspace switch <name>\n"));
    return;
  }

  // Check if it's the default workspace
  if (workspace.isDefault) {
    console.error(chalk.red("\n❌ Cannot delete default workspace\n"));
    return;
  }

  // Check if workspace has agents
  if (workspace.agentCount > 0 && !options?.force) {
    console.error(
      chalk.red(
        `\n❌ Workspace "${name}" contains ${workspace.agentCount} agent${
          workspace.agentCount !== 1 ? "s" : ""
        }`
      )
    );
    console.log(chalk.dim("Use --force to delete anyway:"));
    console.log(chalk.dim(`  panda workspace delete ${name} --force\n`));
    return;
  }

  console.log(chalk.red.bold("\n⚠️  Delete Workspace\n"));
  console.log(chalk.yellow(`This will permanently delete workspace: ${chalk.bold(name)}`));
  if (workspace.agentCount > 0) {
    console.log(
      chalk.yellow(`This will also delete ${workspace.agentCount} agent${workspace.agentCount !== 1 ? "s" : ""}`)
    );
  }

  const spinner = ora("Deleting workspace...").start();

  // Simulate deletion
  await new Promise((resolve) => setTimeout(resolve, 1000));

  // Remove workspace from array
  const updatedWorkspaces = workspaces.filter((w) => w.id !== workspace.id);
  saveWorkspaces(updatedWorkspaces);

  spinner.succeed("Workspace deleted");

  console.log(chalk.green(`\n✅ Workspace deleted: ${chalk.bold(name)}`));
  if (workspace.agentCount > 0) {
    console.log(chalk.dim(`Deleted ${workspace.agentCount} agents`));
  }
  console.log(chalk.dim("\nList remaining workspaces with:"));
  console.log(chalk.dim("  panda workspace list\n"));

  // TODO: Wire to backend when Step 120-123 is complete
  // - Call workspaceManager.delete(name, { force })
  // - Delete all agents in workspace
  // - Delete all conversations and memory
  // - Delete workspace database schema
  // - Update config if this was current workspace
  // - Return success confirmation
}
