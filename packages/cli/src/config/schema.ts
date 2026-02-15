import { z } from "zod";

/**
 * Zod schema for Agentik OS configuration
 */

// Model provider schemas
const AnthropicConfigSchema = z.object({
  apiKey: z.string(),
  defaultModel: z.string().default("claude-sonnet-4.5"),
  enabled: z.boolean().default(false),
});

const OpenAIConfigSchema = z.object({
  apiKey: z.string(),
  defaultModel: z.string().default("gpt-4o"),
  enabled: z.boolean().default(false),
});

const GoogleConfigSchema = z.object({
  apiKey: z.string(),
  defaultModel: z.string().default("gemini-2.0-flash-exp"),
  enabled: z.boolean().default(false),
});

const OllamaConfigSchema = z.object({
  baseUrl: z.string().url().default("http://localhost:11434"),
  defaultModel: z.string().default("llama3.1"),
  enabled: z.boolean().default(false),
});

// Runtime configuration
const RuntimeConfigSchema = z.object({
  port: z.number().int().min(1).max(65535).default(3000),
  host: z.string().default("localhost"),
  dataDir: z.string().default("~/.agentik-os/data"),
});

// Router configuration
const RouterConfigSchema = z.object({
  enabled: z.boolean().default(true),
  strategy: z.enum(["cost-aware", "performance", "balanced"]).default("cost-aware"),
  fallbackModel: z.string().default("ollama/llama3.1"),
});

// Memory configuration
const MemoryConfigSchema = z.object({
  enabled: z.boolean().default(true),
  backend: z.enum(["convex", "local"]).default("convex"),
  vectorDimensions: z.number().int().default(1536),
});

// Security configuration
const SecurityConfigSchema = z.object({
  sandboxMode: z.enum(["wasm", "docker", "none"]).default("wasm"),
  allowedDomains: z.array(z.string()).default([]),
  maxExecutionTime: z.number().int().min(1000).max(300000).default(30000),
});

// Dashboard configuration
const DashboardConfigSchema = z.object({
  enabled: z.boolean().default(true),
  port: z.number().int().min(1).max(65535).default(3001),
  auth: z.boolean().default(false),
});

// Main configuration schema
export const ConfigSchema = z.object({
  $schema: z.string().optional(),
  version: z.string().default("1.0.0"),
  runtime: RuntimeConfigSchema,
  models: z.object({
    anthropic: AnthropicConfigSchema,
    openai: OpenAIConfigSchema,
    google: GoogleConfigSchema,
    ollama: OllamaConfigSchema,
  }),
  router: RouterConfigSchema,
  memory: MemoryConfigSchema,
  security: SecurityConfigSchema,
  dashboard: DashboardConfigSchema,
});

/**
 * Inferred TypeScript type from Zod schema
 */
export type Config = z.infer<typeof ConfigSchema>;

/**
 * Get default configuration
 */
export function getDefaultConfig(): Config {
  return {
    version: "1.0.0",
    runtime: {
      port: 3000,
      host: "localhost",
      dataDir: "~/.agentik-os/data",
    },
    models: {
      anthropic: {
        apiKey: "",
        defaultModel: "claude-sonnet-4.5",
        enabled: false,
      },
      openai: {
        apiKey: "",
        defaultModel: "gpt-4o",
        enabled: false,
      },
      google: {
        apiKey: "",
        defaultModel: "gemini-2.0-flash-exp",
        enabled: false,
      },
      ollama: {
        baseUrl: "http://localhost:11434",
        defaultModel: "llama3.1",
        enabled: false,
      },
    },
    router: {
      enabled: true,
      strategy: "cost-aware",
      fallbackModel: "ollama/llama3.1",
    },
    memory: {
      enabled: true,
      backend: "convex",
      vectorDimensions: 1536,
    },
    security: {
      sandboxMode: "wasm",
      allowedDomains: [],
      maxExecutionTime: 30000,
    },
    dashboard: {
      enabled: true,
      port: 3001,
      auth: false,
    },
  };
}
