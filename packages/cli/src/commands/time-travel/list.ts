import chalk from "chalk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getSnapshotsFile = () => join(getDataDir(), "snapshots.json");

interface Snapshot {
  id: string;
  agentId: string;
  agentName: string;
  conversationId: string;
  timestamp: Date;
  messageCount: number;
  modelVersion: string;
  description?: string;
  messages?: any[];
  memory?: any;
}

interface SnapshotsData {
  snapshots: Snapshot[];
}

/**
 * Load snapshots from file
 */
function loadSnapshots(agentId?: string): Snapshot[] {
  if (!existsSync(getSnapshotsFile())) {
    return [];
  }

  try {
    const data = readFileSync(getSnapshotsFile(), "utf-8");
    const snapshotsData: SnapshotsData = JSON.parse(data);
    const snapshots = snapshotsData.snapshots || [];

    // Filter by agent if specified
    if (agentId) {
      return snapshots.filter((s) => s.agentId === agentId);
    }

    return snapshots;
  } catch (error) {
    console.error(
      chalk.red("Error loading snapshots:"),
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
  return d.toLocaleString();
}

/**
 * Display snapshots in table format
 */
function displaySnapshotsTable(snapshots: Snapshot[]): void {
  // Column widths
  const idWidth = 15;
  const agentWidth = 15;
  const dateWidth = 20;
  const modelWidth = 20;
  const messagesWidth = 10;

  // Header
  console.log(
    chalk.bold(
      [
        "EVENT ID".padEnd(idWidth),
        "AGENT".padEnd(agentWidth),
        "DATE".padEnd(dateWidth),
        "MODEL".padEnd(modelWidth),
        "MESSAGES".padEnd(messagesWidth),
      ].join(" ")
    )
  );

  console.log(
    chalk.dim("-".repeat(idWidth + agentWidth + dateWidth + modelWidth + messagesWidth + 4))
  );

  // Rows
  snapshots.forEach((snapshot) => {
    const id = snapshot.id.substring(0, idWidth - 1).padEnd(idWidth);
    const agent = snapshot.agentName.substring(0, agentWidth - 1).padEnd(agentWidth);
    const date = formatDate(snapshot.timestamp).substring(0, dateWidth - 1).padEnd(dateWidth);
    const model = snapshot.modelVersion.substring(0, modelWidth - 1).padEnd(modelWidth);
    const messages = snapshot.messageCount.toString().padEnd(messagesWidth);

    console.log([chalk.dim(id), agent, chalk.cyan(date), model, messages].join(" "));
  });
}

/**
 * List conversation events (snapshots)
 *
 * NOTE: Placeholder implementation until backend Step 112-115 is complete.
 * Will be wired to packages/runtime/src/time-travel/manager.ts
 */
export async function listEventsCommand(options?: {
  agent?: string;
  limit?: number;
}): Promise<void> {
  let snapshots = loadSnapshots(options?.agent);

  if (snapshots.length === 0) {
    console.log(chalk.yellow("\n⚠️  No conversation events found"));
    console.log(chalk.dim("\nEvents are created during agent conversations."));
    console.log(chalk.dim("Create a snapshot with:"));
    console.log(chalk.dim("  panda time-travel replay <conversation-id>\n"));
    return;
  }

  // Sort by timestamp (newest first)
  const sortedSnapshots = snapshots.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  // Limit results
  const limit = options?.limit || 50;
  const displaySnapshots = sortedSnapshots.slice(0, limit);

  // Header
  console.log(chalk.cyan.bold("\n⏰ Conversation Events\n"));

  // Display
  displaySnapshotsTable(displaySnapshots);

  // Footer
  console.log(
    chalk.dim(`\nShowing ${displaySnapshots.length} of ${sortedSnapshots.length} events`)
  );
  console.log(chalk.dim("\nReplay an event with:"));
  console.log(chalk.dim("  panda time-travel replay <event-id>\n"));

  // TODO: Wire to backend when Step 112-115 is complete
  // - Fetch snapshots from time-travel manager
  // - Include conversation metadata
  // - Show replay status
  // - Filter by date range
}
