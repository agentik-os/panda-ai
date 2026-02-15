import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";
import { homedir } from "os";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Use process.env.HOME for testability, fall back to os.homedir()
const getConfigDir = () => join(process.env.HOME || homedir(), ".agentik-os");
const getConfigFile = () => join(getConfigDir(), "config.json");

interface ModelConfig {
  apiKey: string;
  defaultModel: string;
  enabled: boolean;
}

interface Config {
  version: string;
  runtime: {
    port: number;
    host: string;
    dataDir: string;
  };
  models: {
    anthropic: ModelConfig;
    openai: ModelConfig;
    google: ModelConfig;
    ollama: {
      baseUrl: string;
      defaultModel: string;
      enabled: boolean;
    };
  };
  router: {
    enabled: boolean;
    strategy: string;
    fallbackModel: string;
  };
  memory: {
    enabled: boolean;
    backend: string;
    vectorDimensions: number;
  };
  security: {
    sandboxMode: string;
    allowedDomains: string[];
    maxExecutionTime: number;
  };
  dashboard: {
    enabled: boolean;
    port: number;
    auth: boolean;
  };
}

export async function initCommand(): Promise<void> {
  console.log(chalk.cyan.bold("\n🐼 Agentik OS - Configuration Setup\n"));

  // Check if config already exists
  if (existsSync(getConfigFile())) {
    const { overwrite } = await inquirer.prompt([
      {
        type: "confirm",
        name: "overwrite",
        message: chalk.yellow(
          "Configuration file already exists. Overwrite?"
        ),
        default: false,
      },
    ]);

    if (!overwrite) {
      console.log(chalk.dim("\nConfiguration unchanged. Exiting.\n"));
      return;
    }
  }

  // Load template
  const templatePath = join(__dirname, "../../templates/config.template.json");
  const template: Config = JSON.parse(readFileSync(templatePath, "utf-8"));

  console.log(chalk.dim("Let's set up your AI models...\n"));

  // Step 1: API Keys
  const modelAnswers = await inquirer.prompt([
    {
      type: "confirm",
      name: "useAnthropic",
      message: "Do you have an Anthropic API key (for Claude)?",
      default: true,
    },
    {
      type: "password",
      name: "anthropicKey",
      message: "Enter your Anthropic API key:",
      when: (answers) => answers.useAnthropic,
      validate: (input) =>
        input.startsWith("sk-ant-") || "Invalid Anthropic API key format",
    },
    {
      type: "confirm",
      name: "useOpenAI",
      message: "Do you have an OpenAI API key?",
      default: false,
    },
    {
      type: "password",
      name: "openaiKey",
      message: "Enter your OpenAI API key:",
      when: (answers) => answers.useOpenAI,
      validate: (input) =>
        input.startsWith("sk-") || "Invalid OpenAI API key format",
    },
    {
      type: "confirm",
      name: "useGoogle",
      message: "Do you have a Google AI API key?",
      default: false,
    },
    {
      type: "password",
      name: "googleKey",
      message: "Enter your Google AI API key:",
      when: (answers) => answers.useGoogle,
    },
    {
      type: "confirm",
      name: "useOllama",
      message: "Do you want to use Ollama (local models)?",
      default: false,
    },
    {
      type: "input",
      name: "ollamaUrl",
      message: "Ollama base URL:",
      default: "http://localhost:11434",
      when: (answers) => answers.useOllama,
    },
  ]);

  // Step 2: Router settings
  console.log(chalk.dim("\nConfigure the model router...\n"));
  const routerAnswers = await inquirer.prompt([
    {
      type: "confirm",
      name: "enableRouter",
      message:
        "Enable smart model routing (automatically chooses best/cheapest model)?",
      default: true,
    },
    {
      type: "list",
      name: "routerStrategy",
      message: "Router strategy:",
      choices: [
        { name: "Cost-aware (cheapest capable model)", value: "cost-aware" },
        { name: "Performance (fastest model)", value: "performance" },
        { name: "Balanced (cost + performance)", value: "balanced" },
      ],
      default: "cost-aware",
      when: (answers) => answers.enableRouter,
    },
  ]);

  // Step 3: Dashboard
  console.log(chalk.dim("\nDashboard settings...\n"));
  const dashboardAnswers = await inquirer.prompt([
    {
      type: "confirm",
      name: "enableDashboard",
      message: "Enable web dashboard?",
      default: true,
    },
    {
      type: "number",
      name: "dashboardPort",
      message: "Dashboard port:",
      default: 3001,
      when: (answers) => answers.enableDashboard,
    },
  ]);

  // Build final config
  const spinner = ora("Creating configuration...").start();

  // Update config with answers
  if (modelAnswers.useAnthropic) {
    template.models.anthropic.apiKey = modelAnswers.anthropicKey;
    template.models.anthropic.enabled = true;
  }
  if (modelAnswers.useOpenAI) {
    template.models.openai.apiKey = modelAnswers.openaiKey;
    template.models.openai.enabled = true;
  }
  if (modelAnswers.useGoogle) {
    template.models.google.apiKey = modelAnswers.googleKey;
    template.models.google.enabled = true;
  }
  if (modelAnswers.useOllama) {
    template.models.ollama.baseUrl = modelAnswers.ollamaUrl;
    template.models.ollama.enabled = true;
  }

  template.router.enabled = routerAnswers.enableRouter ?? true;
  template.router.strategy = routerAnswers.routerStrategy ?? "cost-aware";

  template.dashboard.enabled = dashboardAnswers.enableDashboard ?? true;
  template.dashboard.port = dashboardAnswers.dashboardPort ?? 3001;

  // Create config directory if it doesn't exist
  if (!existsSync(getConfigDir())) {
    mkdirSync(getConfigDir(), { recursive: true });
  }

  // Write config file
  writeFileSync(getConfigFile(), JSON.stringify(template, null, 2));

  spinner.succeed(chalk.green("Configuration created successfully!"));

  // Summary
  console.log(chalk.cyan("\n📋 Configuration Summary:"));
  console.log(chalk.dim(`   Location: ${getConfigFile()}\n`));

  const enabledModels = [
    template.models.anthropic.enabled && "Claude (Anthropic)",
    template.models.openai.enabled && "GPT (OpenAI)",
    template.models.google.enabled && "Gemini (Google)",
    template.models.ollama.enabled && "Ollama (Local)",
  ].filter(Boolean);

  console.log(
    chalk.green(`   ✓ Models: ${enabledModels.join(", ") || "None"}`)
  );
  console.log(
    chalk.green(
      `   ✓ Router: ${template.router.enabled ? "Enabled (" + template.router.strategy + ")" : "Disabled"}`
    )
  );
  console.log(
    chalk.green(
      `   ✓ Dashboard: ${template.dashboard.enabled ? `Enabled (port ${template.dashboard.port})` : "Disabled"}`
    )
  );

  console.log(chalk.cyan("\n🚀 Next steps:"));
  console.log(chalk.dim("   1. panda agent create   # Create your first agent"));
  console.log(chalk.dim("   2. panda chat           # Start chatting\n"));
}
