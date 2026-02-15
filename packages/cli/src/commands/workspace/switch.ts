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
 * Save active workspace to file
 */
function saveActiveWorkspace(workspaceId: string): void {
  const data: ActiveWorkspaceData = { activeWorkspace: workspaceId };
  writeFileSync(getActiveWorkspaceFile(), JSON.stringify(data, null, 2));
}

/**
 * Switch to a different workspace
 *
 * NOTE: Placeholder implementation until backend Step 120-123 is complete.
 * Will be wired to packages/runtime/src/workspace/manager.ts
 */
export async function switchWorkspaceCommand(name?: string): Promise<void> {
  if (!name) {
    console.error(chalk.red("\n❌ Workspace name required"));
    console.log(chalk.dim("Usage: panda workspace switch <name>\n"));
    console.log(chalk.dim("List available workspaces with:"));
    console.log(chalk.dim("  panda workspace list\n"));
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

  // Check if already active
  if (workspace.id === activeWorkspaceId) {
    console.log(chalk.yellow(`\n⚠️  Already in workspace: ${chalk.bold(name)}\n`));
    return;
  }

  console.log(chalk.cyan.bold("\n🏢 Switching Workspace\n"));
  console.log(`Target: ${chalk.bold(name)}`);

  const spinner = ora("Loading workspace configuration...").start();

  // Simulate workspace switch
  await new Promise((resolve) => setTimeout(resolve, 1000));
  spinner.text = "Reconnecting to workspace agents...";
  await new Promise((resolve) => setTimeout(resolve, 800));

  // Save active workspace
  saveActiveWorkspace(workspace.id);

  spinner.succeed("Workspace switched");

  console.log(chalk.green(`\n✅ Switched to workspace: ${chalk.bold(name)}`));
  console.log(chalk.dim("\nAll subsequent commands will use this workspace context."));
  console.log(chalk.dim("View agents in this workspace with:"));
  console.log(chalk.dim("  panda agent list\n"));

  // TODO: Wire to backend when Step 120-123 is complete
  // - Call workspaceManager.switch(name)
  // - Update ~/.agentik-os/config.json with current workspace
  // - Load workspace-specific configuration
  // - Reconnect to workspace agents
  // - Update environment context
}
