/**
 * Agent creation prompts
 * Reusable inquirer question definitions for the agent create wizard
 */

export const agentBasicQuestions = [
  {
    type: "input",
    name: "name",
    message: "Agent name:",
    validate: (input: string) => {
      if (!input.trim()) {
        return "Agent name is required";
      }
      if (input.length < 2) {
        return "Agent name must be at least 2 characters";
      }
      if (input.length > 50) {
        return "Agent name must be less than 50 characters";
      }
      return true;
    },
  },
  {
    type: "input",
    name: "description",
    message: "Agent description:",
    validate: (input: string) => {
      if (!input.trim()) {
        return "Description is required";
      }
      if (input.length < 10) {
        return "Description must be at least 10 characters";
      }
      return true;
    },
  },
  {
    type: "editor",
    name: "systemPrompt",
    message: "System prompt (opens editor):",
    default: `You are a helpful AI assistant.

Your role:
- Assist the user with their requests
- Provide accurate and helpful information
- Be concise and clear in your responses

Communication style:
- Professional but friendly
- Clear and direct
- Ask clarifying questions when needed`,
    validate: (input: string) => {
      if (!input.trim()) {
        return "System prompt is required";
      }
      if (input.length < 20) {
        return "System prompt must be at least 20 characters";
      }
      return true;
    },
  },
];

export const agentModelQuestions: any[] = [
  {
    type: "list",
    name: "model",
    message: "Default model:",
    choices: [
      { name: "Claude Sonnet 4.5 (Recommended)", value: "claude-sonnet-4.5" },
      { name: "Claude Opus 4.6", value: "claude-opus-4.6" },
      { name: "Claude Haiku 4.5", value: "claude-haiku-4.5" },
      { name: "GPT-4o", value: "gpt-4o" },
      { name: "GPT-4o-mini", value: "gpt-4o-mini" },
      { name: "Gemini 2.0 Flash", value: "gemini-2.0-flash-exp" },
      { name: "Ollama (Local)", value: "ollama/llama3.1" },
    ],
    default: "claude-sonnet-4.5",
  },
  {
    type: "number",
    name: "temperature",
    message: "Temperature (0-2):",
    default: 0.7,
    validate: (input: number) => {
      if (input < 0 || input > 2) {
        return "Temperature must be between 0 and 2";
      }
      return true;
    },
  },
  {
    type: "number",
    name: "maxTokens",
    message: "Max tokens:",
    default: 4096,
    validate: (input: number) => {
      if (input < 100 || input > 200000) {
        return "Max tokens must be between 100 and 200,000";
      }
      return true;
    },
  },
];

export const agentChannelsQuestions: any[] = [
  {
    type: "checkbox",
    name: "channels",
    message: "Select channels (use space to select):",
    choices: [
      { name: "CLI (Command Line)", value: "cli", checked: true },
      { name: "Web Dashboard", value: "web" },
      { name: "Discord", value: "discord" },
      { name: "Slack", value: "slack" },
      { name: "Telegram", value: "telegram" },
      { name: "WhatsApp", value: "whatsapp" },
      { name: "Webhook", value: "webhook" },
      { name: "API", value: "api" },
    ],
    validate: (input: string[]) => {
      if (input.length === 0) {
        return "Select at least one channel";
      }
      return true;
    },
  },
];

export const agentSkillsQuestions: any[] = [
  {
    type: "checkbox",
    name: "skills",
    message: "Select built-in skills (optional):",
    choices: [
      { name: "Web Search", value: "web-search" },
      { name: "Code Execution", value: "code-execution" },
      { name: "File Management", value: "file-management" },
      { name: "Database Query", value: "database-query" },
      { name: "API Calls", value: "api-calls" },
      { name: "Image Generation", value: "image-generation" },
    ],
  },
];

export const agentConfirmQuestion: any[] = [
  {
    type: "confirm",
    name: "confirm",
    message: "Create this agent?",
    default: true,
  },
];
