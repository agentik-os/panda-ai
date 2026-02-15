/**
 * Automation Types
 * Steps 94-97: Natural Language Automations, Scheduling, Visual Builder
 *
 * Shared types for automation engine, UI builder, and execution history.
 * NOTE: OSModeAutomation (os-mode.ts) is a lightweight mode-embedded config.
 * These types are for the full standalone automation system.
 */

// ============================================================================
// Core Automation
// ============================================================================

export interface Automation {
  id: string;
  name: string;
  description: string;
  modeId?: string; // Optional: which OS Mode it belongs to
  enabled: boolean;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  retryPolicy?: RetryPolicy;
  timeout?: number; // ms
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
}

// ============================================================================
// Triggers
// ============================================================================

export type AutomationTrigger =
  | CronTrigger
  | EventTrigger
  | WebhookTrigger
  | ManualTrigger;

export interface CronTrigger {
  type: "cron";
  schedule: string; // Cron expression (e.g., "0 9 * * *")
  timezone?: string;
}

export interface EventTrigger {
  type: "event";
  event: string; // Event name (e.g., "user.created", "payment.received")
  filter?: Record<string, unknown>; // Optional event payload filter
}

export interface WebhookTrigger {
  type: "webhook";
  path: string; // e.g., "/api/webhooks/github"
  method?: "GET" | "POST" | "PUT";
  secret?: string;
}

export interface ManualTrigger {
  type: "manual";
}

// ============================================================================
// Conditions
// ============================================================================

export interface AutomationCondition {
  field: string;
  operator: "eq" | "neq" | "gt" | "gte" | "lt" | "lte" | "contains" | "not_contains" | "exists" | "not_exists";
  value: unknown;
}

// ============================================================================
// Actions
// ============================================================================

export type AutomationAction =
  | SendNotificationAction
  | ExecuteSkillAction
  | RunAIAction
  | WebhookCallAction
  | CreateRecordAction
  | UpdateRecordAction
  | CustomAction;

export interface SendNotificationAction {
  type: "send_notification";
  channel: "email" | "slack" | "telegram" | "discord";
  template?: string;
  recipients: string[];
  message: string;
}

export interface ExecuteSkillAction {
  type: "execute_skill";
  skillId: string;
  params: Record<string, unknown>;
}

export interface RunAIAction {
  type: "run_ai";
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface WebhookCallAction {
  type: "webhook_call";
  url: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  headers?: Record<string, string>;
  body?: unknown;
}

export interface CreateRecordAction {
  type: "create_record";
  table: string;
  data: Record<string, unknown>;
}

export interface UpdateRecordAction {
  type: "update_record";
  table: string;
  filter: Record<string, unknown>;
  data: Record<string, unknown>;
}

export interface CustomAction {
  type: "custom";
  handler: string;
  params: Record<string, unknown>;
}

// ============================================================================
// Retry Policy
// ============================================================================

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number; // Initial backoff in ms
  backoffMultiplier?: number; // Exponential backoff multiplier (default 2)
}

// ============================================================================
// Execution
// ============================================================================

export type AutomationExecutionStatus =
  | "pending"
  | "running"
  | "success"
  | "failed"
  | "cancelled"
  | "retrying";

export interface AutomationExecution {
  id: string;
  automationId: string;
  automationName: string;
  trigger: AutomationTrigger;
  status: AutomationExecutionStatus;
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // ms
  output?: unknown;
  error?: AutomationError;
  retryCount: number;
  logs: AutomationLog[];
}

export interface AutomationError {
  code: string;
  message: string;
  stack?: string;
  actionIndex?: number; // Which action in the chain failed
}

export interface AutomationLog {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  message: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Intent Classification (used by NL parser)
// ============================================================================

export type AutomationIntent =
  | "schedule_task"
  | "event_trigger"
  | "webhook_listener"
  | "condition_check"
  | "data_sync"
  | "notification"
  | "unknown";

export interface ClassifiedIntent {
  intent: AutomationIntent;
  confidence: number; // 0-1
  entities: {
    trigger?: {
      type: "cron" | "event" | "webhook";
      value: string;
    };
    action?: {
      type: string;
      target?: string;
      params?: Record<string, unknown>;
    };
    schedule?: string;
    event?: string;
    webhook?: string;
  };
  suggestions?: string[];
}

// ============================================================================
// Automation Builder (UI state)
// ============================================================================

export type AutomationBuilderStep = "trigger" | "conditions" | "actions" | "review";

export type AutomationBuilderMode = "natural-language" | "visual" | "form";

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  popularity: number;
}
