/**
 * OS Modes - System-level agent team configurations
 *
 * IMPORTANT: Do NOT confuse with AgentMode (modes.ts).
 * - AgentMode = per-agent behavior modifier (focus/creative/research/balanced)
 * - OSMode = system-level mode with pre-configured agent team, skills, automations
 */

// ============================================================================
// Core Types
// ============================================================================

export type OSModeType = "official" | "community" | "custom";

export interface OSMode {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  agents: OSModeAgent[];
  skills: string[];
  automations: OSModeAutomation[];
  dashboardWidgets: OSModeDashboardWidget[];
  memoryCategories: string[];
  type: OSModeType;
  price?: number;
  author: string;
  version: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface OSModeAgent {
  name: string;
  role: string;
  description: string;
  systemPrompt: string;
  skills: string[];
  tools: string[];
  defaultModel?: string;
  temperature?: number;
}

export interface OSModeAutomation {
  id: string;
  name: string;
  description: string;
  trigger: OSModeAutomationTrigger;
  action: string;
  enabled: boolean;
}

export type OSModeAutomationTrigger =
  | { type: "cron"; schedule: string }
  | { type: "event"; event: string }
  | { type: "webhook"; path: string };

export interface OSModeDashboardWidget {
  id: string;
  name: string;
  type: "chart" | "list" | "metric" | "timeline" | "kanban" | "custom";
  size: "small" | "medium" | "large";
  config: Record<string, unknown>;
}

// ============================================================================
// Mode Stacking
// ============================================================================

export interface ActiveModeStack {
  modes: string[];
  sharedMemoryEnabled: boolean;
  crossModeAutomations: boolean;
}

// ============================================================================
// Official Mode IDs
// ============================================================================

export const OFFICIAL_MODE_IDS = [
  "human-os",
  "business-os",
  "dev-os",
  "marketing-os",
  "sales-os",
  "design-os",
  "art-os",
  "ask-os",
  "finance-os",
  "learning-os",
] as const;

export type OfficialModeId = (typeof OFFICIAL_MODE_IDS)[number];
