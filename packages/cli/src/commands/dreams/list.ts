import chalk from "chalk";
import { readFileSync, existsSync } from "fs";
import { join } from "path";
import { homedir } from "os";

// Use process.env.HOME for testability, fall back to os.homedir()
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getDreamsConfigFile = () => join(getDataDir(), "dream-schedules.json");

interface DreamSchedule {
  agentId: string;
  agentName: string;
  enabled: boolean;
  frequency: "daily" | "weekly" | "custom";
  time: string;
  lastRun?: Date;
  nextRun?: Date;
}

interface DreamSchedulesData {
  schedules: DreamSchedule[];
}

/**
 * Load dream schedules from file
 */
function loadDreamSchedules(): DreamSchedule[] {
  if (!existsSync(getDreamsConfigFile())) {
    return [];
  }

  try {
    const data = readFileSync(getDreamsConfigFile(), "utf-8");
    const schedulesData: DreamSchedulesData = JSON.parse(data);
    return schedulesData.schedules || [];
  } catch (error) {
    console.error(
      chalk.red("Error loading dream schedules:"),
      error instanceof Error ? error.message : error
    );
    return [];
  }
}

/**
 * Format date for display
 */
function formatDate(date?: Date): string {
  if (!date) return chalk.dim("Never");
  const d = new Date(date);
  return d.toLocaleString();
}

/**
 * Display dream schedules in table format
 */
function displaySchedulesTable(schedules: DreamSchedule[]): void {
  // Column widths
  const agentWidth = 20;
  const frequencyWidth = 12;
  const timeWidth = 8;
  const lastRunWidth = 20;
  const nextRunWidth = 20;
  const statusWidth = 10;

  // Header
  console.log(
    chalk.bold(
      [
        "AGENT".padEnd(agentWidth),
        "FREQUENCY".padEnd(frequencyWidth),
        "TIME".padEnd(timeWidth),
        "LAST RUN".padEnd(lastRunWidth),
        "NEXT RUN".padEnd(nextRunWidth),
        "STATUS".padEnd(statusWidth),
      ].join(" ")
    )
  );

  console.log(
    chalk.dim(
      "-".repeat(
        agentWidth + frequencyWidth + timeWidth + lastRunWidth + nextRunWidth + statusWidth + 5
      )
    )
  );

  // Rows
  schedules.forEach((schedule) => {
    const agent = schedule.agentName.substring(0, agentWidth - 1).padEnd(agentWidth);
    const frequency = schedule.frequency.padEnd(frequencyWidth);
    const time = schedule.time.padEnd(timeWidth);
    const lastRun = formatDate(schedule.lastRun).substring(0, lastRunWidth - 1).padEnd(lastRunWidth);
    const nextRun = formatDate(schedule.nextRun).substring(0, nextRunWidth - 1).padEnd(nextRunWidth);
    const status = schedule.enabled
      ? chalk.green("Enabled").padEnd(statusWidth)
      : chalk.red("Disabled").padEnd(statusWidth);

    console.log([agent, frequency, chalk.cyan(time), lastRun, nextRun, status].join(" "));
  });
}

/**
 * List all dream schedules
 */
export async function listDreamsCommand(): Promise<void> {
  const schedules = loadDreamSchedules();

  if (schedules.length === 0) {
    console.log(chalk.yellow("\n⚠️  No dream schedules configured"));
    console.log(chalk.dim("\nSchedule dream sessions with:"));
    console.log(chalk.dim("  panda dreams schedule <agent-id>\n"));
    return;
  }

  // Header
  console.log(chalk.cyan.bold(`\n🌙 Dream Schedules (${schedules.length})\n`));

  // Display
  displaySchedulesTable(schedules);

  // Footer
  const enabledCount = schedules.filter((s) => s.enabled).length;
  console.log(
    chalk.dim(
      `\nTotal: ${schedules.length} schedule${schedules.length !== 1 ? "s" : ""} (${enabledCount} enabled)`
    )
  );
  console.log(chalk.dim("\nManage schedules with:"));
  console.log(chalk.dim("  panda dreams schedule <agent-id> --time 02:00 --frequency daily\n"));
}
