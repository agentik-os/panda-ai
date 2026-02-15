#!/usr/bin/env node

import { Command } from "commander";
import chalk from "chalk";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { initCommand, logsCommand, chatCommand } from "./commands/index.js";
import { createAgentCommand, listAgentsCommand } from "./commands/agent/index.js";
import { installSkillCommand, listSkillsCommand, uninstallSkillCommand, createSkillCommand } from "./commands/skill/index.js";
import { devCommand } from "./commands/dev.js";
import { publishCommand } from "./commands/publish.js";
// Phase 3 imports
import { viewDreamsCommand, triggerDreamCommand, scheduleDreamCommand, listDreamsCommand } from "./commands/dreams/index.js";
import { replayCommand, diffCommand, listEventsCommand } from "./commands/time-travel/index.js";
import { createWorkspaceCommand, switchWorkspaceCommand, listWorkspacesCommand, deleteWorkspaceCommand } from "./commands/workspace/index.js";
import { exportMetricsCommand, viewMetricsCommand } from "./commands/metrics.js";
import { deployDockerCommand, deployK8sCommand, deployStatusCommand } from "./commands/deploy.js";

// Get package.json for version
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const packageJson = JSON.parse(
  readFileSync(join(__dirname, "../package.json"), "utf-8")
);

const program = new Command();

program
  .name("panda")
  .description(
    chalk.cyan("🐼 Agentik OS - AI Agent Operating System CLI")
  )
  .version(packageJson.version, "-v, --version", "Display version number")
  .helpOption("-h, --help", "Display help information");

// Agent management commands
const agent = program
  .command("agent")
  .description("Manage AI agents")
  .addHelpText("after", `

Examples:
  $ panda agent create              # Interactive wizard
  $ panda agent create "My Agent"   # With name
  $ panda agent list                # View all agents
  $ panda agent list --active       # Only active agents
`);

agent
  .command("create [name]")
  .description("Create a new AI agent with interactive wizard")
  .option("-m, --model <model>", "AI model (claude-3-5-sonnet, gpt-4, etc.)")
  .option("-c, --channels <channels>", "Channels: cli,api,telegram,discord")
  .option("-s, --skills <skills>", "Skills: web-search,file-ops,calendar")
  .option("-d, --description <description>", "Brief description of agent purpose")
  .option("-p, --system-prompt <prompt>", "System instructions for agent")
  .option("-y, --yes", "Skip confirmations (use defaults)")
  .addHelpText("after", `

Examples:
  $ panda agent create                           # Interactive mode
  $ panda agent create "Customer Support Bot"    # With name
  $ panda agent create --model gpt-4 --yes       # Quick create
`)
  .action(async (name, options) => {
    try {
      await createAgentCommand(name, options);
    } catch (error) {
      console.error(chalk.red("Error creating agent:"), error);
      process.exit(1);
    }
  });

agent
  .command("list")
  .description("List all agents with status and usage info")
  .option("-d, --detailed", "Show full details (config, stats, skills)")
  .option("-a, --active", "Filter: show only active agents")
  .option("-i, --inactive", "Filter: show only inactive agents")
  .addHelpText("after", `

Examples:
  $ panda agent list              # All agents (summary)
  $ panda agent list --detailed   # Full details
  $ panda agent list --active     # Only active agents
`)
  .action(async (options) => {
    try {
      // Handle mutually exclusive flags
      if (options.active && options.inactive) {
        console.error(
          chalk.red("Error: --active and --inactive cannot be used together")
        );
        process.exit(1);
      }

      const filterOptions = {
        detailed: options.detailed,
        active: options.active ? true : options.inactive ? false : undefined,
      };

      await listAgentsCommand(filterOptions);
    } catch (error) {
      console.error(chalk.red("Error listing agents:"), error);
      process.exit(1);
    }
  });

agent
  .command("delete <id>")
  .description("Delete an agent")
  .action(() => {
    console.log(chalk.yellow("⚠️  Agent delete command coming soon!"));
    console.log(chalk.dim("Available in future step"));
  });

agent
  .command("config <id>")
  .description("View or edit agent configuration")
  .action(() => {
    console.log(chalk.yellow("⚠️  Agent config command coming soon!"));
    console.log(chalk.dim("Available in future step"));
  });

// Skill management commands
const skill = program.command("skill").description("Manage skills and MCP servers");

skill
  .command("install [name]")
  .description("Install a skill and optionally add to agents")
  .option("-a, --agent <agent>", "Add to specific agent (by ID or name)")
  .option("--all-agents", "Add to all existing agents automatically")
  .option("-y, --yes", "Skip confirmations (auto-approve permissions)")
  .addHelpText("after", `

Examples:
  $ panda skill install                  # Interactive mode (choose skill)
  $ panda skill install web-search       # Install specific skill
  $ panda skill install web-search --agent "My Agent"
  $ panda skill install calendar --all-agents
`)
  .action(async (name, options) => {
    try {
      await installSkillCommand(name, options);
    } catch (error) {
      console.error(chalk.red("Error installing skill:"), error);
      process.exit(1);
    }
  });

skill
  .command("list")
  .description("List all installed skills with usage information")
  .option("-d, --detailed", "Show full details (permissions, config schema, agents using)")
  .option("--unused", "Show only skills not currently used by any agent")
  .addHelpText("after", `

Examples:
  $ panda skill list              # All installed skills (summary)
  $ panda skill list --detailed   # Full details for each skill
  $ panda skill list --unused     # Find unused skills to clean up
`)
  .action(async (options) => {
    try {
      await listSkillsCommand(options);
    } catch (error) {
      console.error(chalk.red("Error listing skills:"), error);
      process.exit(1);
    }
  });

skill
  .command("uninstall <name>")
  .description("Uninstall a skill and remove from all agents")
  .option("-f, --force", "Skip confirmation prompt")
  .addHelpText("after", `

Examples:
  $ panda skill uninstall web-search       # Uninstall with confirmation
  $ panda skill uninstall calendar --force # Skip confirmation
`)
  .action(async (name, options) => {
    try {
      await uninstallSkillCommand(name, options);
    } catch (error) {
      console.error(chalk.red("Error uninstalling skill:"), error);
      process.exit(1);
    }
  });

skill
  .command("create [name]")
  .description("Create a new skill from template")
  .option("-d, --description <description>", "Skill description")
  .option("-a, --author <author>", "Author name")
  .option("--permissions <permissions>", "Comma-separated permissions (e.g., network:http,fs:read)")
  .option("--tags <tags>", "Comma-separated tags (e.g., api,data)")
  .option("-o, --output-dir <dir>", "Output directory")
  .option("-y, --yes", "Skip confirmations")
  .addHelpText("after", `

Examples:
  $ panda skill create my-skill                        # Create with name
  $ panda skill create web-scraper -d "Web scraper"    # With description
  $ panda skill create my-api --permissions network:http --tags api,data
`)
  .action(async (name, options) => {
    try {
      await createSkillCommand(name, {
        name: options.name,
        description: options.description,
        author: options.author,
        permissions: options.permissions,
        tags: options.tags,
        outputDir: options.outputDir,
        yes: options.yes,
      });
    } catch (error) {
      console.error(chalk.red("Error creating skill:"), error);
      process.exit(1);
    }
  });

// Dev server command
program
  .command("dev [path]")
  .description("Start hot-reload development server for a skill")
  .option("-p, --port <port>", "Dev server port", parseInt)
  .option("--no-watch", "Disable file watching")
  .option("-t, --test", "Enable test runner on file changes")
  .option("--verbose", "Show detailed output")
  .addHelpText("after", `

Examples:
  $ panda dev                     # Dev server in current directory
  $ panda dev ./skills/my-skill   # Dev server for specific skill
  $ panda dev --test              # With test runner
  $ panda dev --verbose           # Detailed output
`)
  .action(async (path, options) => {
    try {
      await devCommand(path, {
        port: options.port,
        watch: options.watch,
        test: options.test,
        verbose: options.verbose,
      });
    } catch (error) {
      console.error(chalk.red("Error starting dev server:"), error);
      process.exit(1);
    }
  });

// Publish command
program.addCommand(publishCommand);

// Interactive chat
program
  .command("chat [agent]")
  .description("Start interactive chat session with an AI agent")
  .addHelpText("after", `

Examples:
  $ panda chat                    # Select agent from list
  $ panda chat "My Agent"         # Chat with specific agent (by name)
  $ panda chat agent_abc123       # Chat with specific agent (by ID)

Tips:
  • Use Ctrl+C or type 'exit' to end the chat
  • Chat history is automatically saved
  • Agent skills are available during conversation
`)
  .action(async (agentNameOrId) => {
    try {
      await chatCommand(agentNameOrId);
    } catch (error) {
      console.error(chalk.red("Error starting chat:"), error);
      process.exit(1);
    }
  });

// View logs
program
  .command("logs")
  .description("View conversation history and activity logs")
  .option("-a, --agent <name>", "Filter by agent name or ID")
  .option("-c, --channel <channel>", "Filter by channel (cli, api, telegram, discord)")
  .option("-l, --limit <number>", "Limit number of results (default: 50)", parseInt)
  .option("--conversation <id>", "View a specific conversation by ID")
  .option("-d, --detailed", "Show detailed view with all messages and metadata")
  .addHelpText("after", `

Examples:
  $ panda logs                                # Recent activity (all agents)
  $ panda logs --agent "My Agent"             # Filter by agent
  $ panda logs --channel telegram             # Filter by channel
  $ panda logs --limit 100                    # Last 100 conversations
  $ panda logs --conversation conv_abc123     # Specific conversation
  $ panda logs --agent "Support Bot" --detailed  # Full details
`)
  .action(async (options) => {
    try {
      await logsCommand(options);
    } catch (error) {
      console.error(chalk.red("Error viewing logs:"), error);
      process.exit(1);
    }
  });

// Configuration (init command)
program
  .command("init")
  .description("Initialize Agentik OS configuration and setup")
  .addHelpText("after", `

Description:
  Sets up Agentik OS for first-time use. This interactive wizard will:
  • Create configuration directory (~/.agentik-os)
  • Configure AI model providers (API keys)
  • Set up default agent profiles
  • Initialize local database
  • Test connections

Examples:
  $ panda init                    # Run interactive setup wizard

Note: Run this once after installing Agentik OS.
`)
  .action(async () => {
    try {
      await initCommand();
    } catch (error) {
      console.error(chalk.red("Error during initialization:"), error);
      process.exit(1);
    }
  });

// Health check
program
  .command("doctor")
  .description("Run health checks and diagnostics on your Agentik OS installation")
  .addHelpText("after", `

Description:
  Performs comprehensive health checks including:
  • Configuration file integrity
  • Database connectivity
  • AI model provider API access
  • Installed skills validation
  • Agent runtime status
  • System dependencies

Examples:
  $ panda doctor                  # Run full diagnostic suite

Note: This helps troubleshoot installation and configuration issues.
`)
  .action(() => {
    console.log(chalk.green("✅ Basic CLI is working!"));
    console.log(chalk.dim("Full health check coming in later phases"));
  });

// =============================================================================
// PHASE 3: Enterprise Features
// =============================================================================

// Dreams management (Steps 107-111)
const dreams = program
  .command("dreams")
  .description("Manage agent dream sessions (autonomous task processing)")
  .addHelpText("after", `

Examples:
  $ panda dreams view agent_123           # View dream reports
  $ panda dreams view agent_123 --latest  # View latest report
  $ panda dreams trigger agent_123        # Manually trigger dream
  $ panda dreams schedule agent_123       # Schedule recurring dreams
  $ panda dreams list                     # List all schedules
`);

dreams
  .command("view [agent-id]")
  .description("View dream reports for an agent")
  .option("-d, --detailed", "Show detailed report with all actions")
  .option("-l, --latest", "Show only the latest report")
  .action(async (agentId, _options) => {
    try {
      await viewDreamsCommand(agentId);
    } catch (error) {
      console.error(chalk.red("Error viewing dreams:"), error);
      process.exit(1);
    }
  });

dreams
  .command("trigger <agent-id>")
  .description("Manually trigger a dream session")
  .option("-f, --force", "Skip approval threshold (execute all actions)")
  .option("--dry-run", "Simulate dream without executing actions")
  .action(async (agentId, options) => {
    try {
      await triggerDreamCommand(agentId, options);
    } catch (error) {
      console.error(chalk.red("Error triggering dream:"), error);
      process.exit(1);
    }
  });

dreams
  .command("schedule <agent-id>")
  .description("Schedule recurring dream sessions")
  .option("-t, --time <time>", "Time to run dreams (HH:MM format)", "02:00")
  .option("-f, --frequency <freq>", "Frequency: daily, weekly, custom", "daily")
  .option("--disable", "Disable dream schedule for this agent")
  .action(async (agentId, options) => {
    try {
      await scheduleDreamCommand(agentId, options);
    } catch (error) {
      console.error(chalk.red("Error scheduling dream:"), error);
      process.exit(1);
    }
  });

dreams
  .command("list")
  .description("List all dream schedules")
  .action(async () => {
    try {
      await listDreamsCommand();
    } catch (error) {
      console.error(chalk.red("Error listing dreams:"), error);
      process.exit(1);
    }
  });

// Time Travel Debug (Steps 112-115)
const timeTravel = program
  .command("time-travel")
  .description("Debug conversations by replaying with different parameters")
  .addHelpText("after", `

Examples:
  $ panda time-travel list                        # List replayable events
  $ panda time-travel replay evt_123 --model claude-haiku  # Replay with cheaper model
  $ panda time-travel diff evt_123 replay_456     # Compare original vs replay
`);

timeTravel
  .command("list")
  .description("List replayable conversation events")
  .option("-a, --agent <id>", "Filter by agent ID")
  .option("-l, --limit <number>", "Limit results (default: 50)", parseInt)
  .option("-r, --replayable", "Show only replayable events")
  .action(async (options) => {
    try {
      await listEventsCommand(options);
    } catch (error) {
      console.error(chalk.red("Error listing events:"), error);
      process.exit(1);
    }
  });

timeTravel
  .command("replay <event-id>")
  .description("Replay a conversation event with different parameters")
  .option("-m, --model <model>", "Use different AI model")
  .option("-t, --temperature <temp>", "Use different temperature", parseFloat)
  .option("-s, --save-as <id>", "Save replay with custom ID")
  .option("-c, --compare", "Show cost comparison after replay")
  .action(async (eventId, options) => {
    try {
      await replayCommand(eventId, options);
    } catch (error) {
      console.error(chalk.red("Error replaying event:"), error);
      process.exit(1);
    }
  });

timeTravel
  .command("diff <before-id> <after-id>")
  .description("Show diff between two events (original vs replay)")
  .action(async (beforeId, afterId) => {
    try {
      await diffCommand(beforeId, afterId);
    } catch (error) {
      console.error(chalk.red("Error showing diff:"), error);
      process.exit(1);
    }
  });

// Workspace Management (Steps 120-123)
const workspace = program
  .command("workspace")
  .description("Manage workspaces (multi-tenancy)")
  .addHelpText("after", `

Examples:
  $ panda workspace create production     # Create new workspace
  $ panda workspace list                  # List all workspaces
  $ panda workspace switch production     # Switch to workspace
  $ panda workspace delete staging --force  # Delete workspace
`);

workspace
  .command("create <name>")
  .description("Create a new workspace")
  .option("-d, --description <desc>", "Workspace description")
  .option("-i, --isolate", "Enable full isolation (separate agent instances)")
  .option("-q, --quota <amount>", "Monthly cost quota in USD", parseFloat)
  .action(async (name, options) => {
    try {
      await createWorkspaceCommand(name, options);
    } catch (error) {
      console.error(chalk.red("Error creating workspace:"), error);
      process.exit(1);
    }
  });

workspace
  .command("list")
  .description("List all workspaces")
  .action(async () => {
    try {
      await listWorkspacesCommand();
    } catch (error) {
      console.error(chalk.red("Error listing workspaces:"), error);
      process.exit(1);
    }
  });

workspace
  .command("switch <name>")
  .description("Switch to a different workspace")
  .action(async (name) => {
    try {
      await switchWorkspaceCommand(name);
    } catch (error) {
      console.error(chalk.red("Error switching workspace:"), error);
      process.exit(1);
    }
  });

workspace
  .command("delete <name>")
  .description("Delete a workspace (permanent)")
  .option("-f, --force", "Skip confirmation prompt")
  .action(async (name, options) => {
    try {
      await deleteWorkspaceCommand(name, options);
    } catch (error) {
      console.error(chalk.red("Error deleting workspace:"), error);
      process.exit(1);
    }
  });

// Metrics & Monitoring (Steps 124-125)
const metrics = program
  .command("metrics")
  .description("View and export metrics")
  .addHelpText("after", `

Examples:
  $ panda metrics view                            # View current metrics
  $ panda metrics export --format prometheus      # Export for Prometheus
  $ panda metrics export --format json -o metrics.json  # Export to file
`);

metrics
  .command("view")
  .description("View current metrics in terminal")
  .action(async () => {
    try {
      await viewMetricsCommand();
    } catch (error) {
      console.error(chalk.red("Error viewing metrics:"), error);
      process.exit(1);
    }
  });

metrics
  .command("export")
  .description("Export metrics for external monitoring")
  .option("-f, --format <format>", "Format: prometheus, json, csv", "prometheus")
  .option("-o, --output <file>", "Output file path")
  .action(async (options) => {
    try {
      await exportMetricsCommand(options);
    } catch (error) {
      console.error(chalk.red("Error exporting metrics:"), error);
      process.exit(1);
    }
  });

// Deployment Helpers (Steps 120-123)
const deploy = program
  .command("deploy")
  .description("Deployment helpers for Docker and Kubernetes")
  .addHelpText("after", `

Examples:
  $ panda deploy docker                   # Generate Docker config
  $ panda deploy docker --prod            # Production Docker config
  $ panda deploy k8s                      # Generate Kubernetes manifests
  $ panda deploy status                   # Check deployment status
`);

deploy
  .command("docker")
  .description("Generate Docker deployment files")
  .option("-o, --output <dir>", "Output directory", "./deploy")
  .option("-p, --prod", "Production configuration")
  .action(async (options) => {
    try {
      await deployDockerCommand(options);
    } catch (error) {
      console.error(chalk.red("Error generating Docker config:"), error);
      process.exit(1);
    }
  });

deploy
  .command("k8s")
  .description("Generate Kubernetes deployment manifests")
  .option("-o, --output <dir>", "Output directory", "./k8s")
  .option("-n, --namespace <name>", "Kubernetes namespace", "agentik-os")
  .action(async (options) => {
    try {
      await deployK8sCommand(options);
    } catch (error) {
      console.error(chalk.red("Error generating K8s manifests:"), error);
      process.exit(1);
    }
  });

deploy
  .command("status")
  .description("Show current deployment status")
  .action(async () => {
    try {
      await deployStatusCommand();
    } catch (error) {
      console.error(chalk.red("Error checking deployment status:"), error);
      process.exit(1);
    }
  });

// Show welcome message on no command
program.on("--help", () => {
  console.log("");
  console.log(chalk.cyan("🐼 Welcome to Agentik OS!"));
  console.log(chalk.dim("  The AI Agent Operating System"));
  console.log("");
  console.log(chalk.bold("Quick Start:"));
  console.log("  $ panda init            # First-time setup (run once)");
  console.log("  $ panda agent create    # Create your first AI agent");
  console.log("  $ panda chat            # Start chatting with your agent");
  console.log("");
  console.log(chalk.bold("Common Commands:"));
  console.log("  $ panda agent list      # View all your agents");
  console.log("  $ panda skill install   # Add skills to agents");
  console.log("  $ panda logs            # View conversation history");
  console.log("  $ panda doctor          # Check system health");
  console.log("");
  console.log(chalk.bold("Resources:"));
  console.log(chalk.dim("  Docs:     https://docs.agentik-os.com"));
  console.log(chalk.dim("  GitHub:   https://github.com/agentik-os/agentik-os"));
  console.log(chalk.dim("  Discord:  https://discord.gg/agentik-os"));
  console.log("");
});

// Parse arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}
