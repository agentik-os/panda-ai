/**
 * Budget Checker
 *
 * Checks agent budgets against cost limits and triggers alerts.
 * Integrates with Cost Calculator (calculator.ts) and Cost Events (event-store.ts).
 */

import { getConvexClient } from "../convex-client";
import { api } from "../../../../convex/_generated/api";
import type { Id } from "../../../../convex/_generated/dataModel";
import {
  publishBudgetAlert,
  publishAgentStatus,
} from "../websocket/publishers";

/**
 * Budget status result
 */
export interface BudgetStatus {
  /** Whether budget exists for this agent */
  hasBudget: boolean;
  /** Whether budget limit is exceeded */
  exceeded: boolean;
  /** Whether alert should be sent */
  shouldAlert: boolean;
  /** Alert threshold percentage (if shouldAlert is true) */
  threshold?: number;
  /** Current spend in USD */
  currentSpend?: number;
  /** Budget limit in USD */
  limitAmount?: number;
  /** Percentage of budget used */
  percentUsed?: number;
  /** Whether agent is paused due to budget */
  isPaused?: boolean;
  /** Enforcement action (warn, pause, block) */
  enforcementAction?: "warn" | "pause" | "block";
}

/**
 * Budget configuration
 */
export interface BudgetConfig {
  id: Id<"budgets">;
  agentId: Id<"agents">;
  limitAmount: number;
  period: "daily" | "weekly" | "monthly" | "per-conversation";
  thresholds: Array<50 | 75 | 90 | 100>;
  notificationChannels: Array<"email" | "webhook" | "telegram" | "in-app">;
  enforcementAction: "warn" | "pause" | "block";
  currentSpend: number;
  resetTime: number;
  lastAlertThreshold: number;
  isPaused: boolean;
  emailAddress?: string;
  webhookUrl?: string;
  telegramChatId?: string;
}

/**
 * Check budget for an agent before executing a request
 *
 * @param agentId - Agent ID to check
 * @returns Budget status
 */
export async function checkBudget(
  agentId: Id<"agents">,
): Promise<BudgetStatus> {
  const client = getConvexClient();

  // Get budget for agent
  const budget = await client.query(api.budgets.getByAgent, { agentId });

  if (!budget) {
    // No budget configured - allow execution
    return {
      hasBudget: false,
      exceeded: false,
      shouldAlert: false,
    };
  }

  const percentUsed = (budget.currentSpend / budget.limitAmount) * 100;
  const exceeded = budget.currentSpend >= budget.limitAmount;

  return {
    hasBudget: true,
    exceeded,
    shouldAlert: false, // Alert is determined after cost is recorded
    currentSpend: budget.currentSpend,
    limitAmount: budget.limitAmount,
    percentUsed,
    isPaused: budget.isPaused,
    enforcementAction: budget.enforcementAction as
      | "warn"
      | "pause"
      | "block",
  };
}

/**
 * Record cost against budget and determine if alert needed
 *
 * @param agentId - Agent ID
 * @param costAmount - Cost amount in USD
 * @returns Budget status after recording cost
 */
export async function recordCostAgainstBudget(
  agentId: Id<"agents">,
  costAmount: number,
): Promise<BudgetStatus> {
  const client = getConvexClient();

  try {
    const result = await client.mutation(api.budgets.recordCost, {
      agentId,
      costAmount,
    });

    // Get budget details for WebSocket events
    const budget = await client.query(api.budgets.getByAgent, { agentId });

    // Publish budget alert if threshold crossed
    if (result.shouldAlert && result.threshold && budget) {
      publishBudgetAlert({
        budgetId: budget._id,
        agentId,
        threshold: result.threshold,
        currentSpend: result.currentSpend!,
        limitAmount: result.limitAmount!,
        percentUsed: result.percentUsed!,
        period: budget.period as "daily" | "weekly" | "monthly" | "per-conversation",
        enforcementAction: budget.enforcementAction as "warn" | "pause" | "block",
        isPaused: result.exceeded && budget.enforcementAction !== "warn",
        message: `Budget ${result.threshold}% threshold reached`,
      });
    }

    // Publish agent status change if paused due to budget
    if (result.exceeded && budget && budget.enforcementAction !== "warn") {
      publishAgentStatus({
        agentId,
        status: "paused",
        reason: "Budget limit exceeded",
        budgetId: budget._id,
        timestamp: Date.now(),
      });
    }

    return {
      hasBudget: true,
      exceeded: result.exceeded,
      shouldAlert: result.shouldAlert,
      threshold: result.threshold,
      currentSpend: result.currentSpend,
      limitAmount: result.limitAmount,
      percentUsed: result.percentUsed,
      isPaused: result.exceeded,
    };
  } catch (error) {
    // Budget might not exist
    if (error instanceof Error && error.message.includes("not found")) {
      return {
        hasBudget: false,
        exceeded: false,
        shouldAlert: false,
      };
    }
    throw error;
  }
}

/**
 * Determine if alert should be sent
 *
 * @param agentId - Agent ID
 * @param currentCost - Current total cost
 * @param lastAlertThreshold - Last threshold that triggered alert
 * @returns Whether alert should be sent and at what threshold
 */
export async function shouldAlert(
  agentId: Id<"agents">,
  currentCost: number,
  lastAlertThreshold: number,
): Promise<{ shouldAlert: boolean; threshold?: number }> {
  const client = getConvexClient();

  const budget = await client.query(api.budgets.getByAgent, { agentId });

  if (!budget) {
    return { shouldAlert: false };
  }

  const percentUsed = (currentCost / budget.limitAmount) * 100;

  // Find the highest threshold that has been crossed
  for (const threshold of budget.thresholds.sort(
    (a: number, b: number) => b - a,
  )) {
    if (percentUsed >= threshold && threshold > lastAlertThreshold) {
      return { shouldAlert: true, threshold };
    }
  }

  return { shouldAlert: false };
}

/**
 * Enforce budget limit for an agent
 *
 * @param agentId - Agent ID
 * @param status - Budget status
 * @throws Error if budget is exceeded and enforcement action is block
 */
export function enforceLimit(agentId: Id<"agents">, status: BudgetStatus): void {
  if (!status.hasBudget || !status.exceeded) {
    return; // No budget or not exceeded - allow execution
  }

  switch (status.enforcementAction) {
    case "warn":
      // Just warn - allow execution
      console.warn(
        `[Budget] Agent ${agentId} has exceeded budget (${status.percentUsed?.toFixed(1)}%)`,
      );
      break;

    case "pause":
      // Pause agent - throw error to prevent execution
      throw new Error(
        `Agent ${agentId} is paused due to budget limit. ` +
          `Spent $${status.currentSpend?.toFixed(4)} of $${status.limitAmount?.toFixed(4)} limit.`,
      );

    case "block":
      // Block agent - throw error to prevent execution
      throw new Error(
        `Agent ${agentId} is blocked due to budget limit. ` +
          `Spent $${status.currentSpend?.toFixed(4)} of $${status.limitAmount?.toFixed(4)} limit.`,
      );
  }
}

/**
 * Check if agent is paused due to budget
 *
 * @param agentId - Agent ID
 * @returns Whether agent is paused
 */
export async function isPaused(agentId: Id<"agents">): Promise<boolean> {
  const status = await checkBudget(agentId);
  return status.isPaused === true;
}

/**
 * Get budget config for an agent
 *
 * @param agentId - Agent ID
 * @returns Budget config or null if not configured
 */
export async function getBudgetConfig(
  agentId: Id<"agents">,
): Promise<BudgetConfig | null> {
  const client = getConvexClient();
  const budget = await client.query(api.budgets.getByAgent, { agentId });

  if (!budget) {
    return null;
  }

  return {
    id: budget._id,
    agentId: budget.agentId,
    limitAmount: budget.limitAmount,
    period: budget.period as "daily" | "weekly" | "monthly" | "per-conversation",
    thresholds: budget.thresholds as Array<50 | 75 | 90 | 100>,
    notificationChannels: budget.notificationChannels as Array<
      "email" | "webhook" | "telegram" | "in-app"
    >,
    enforcementAction: budget.enforcementAction as "warn" | "pause" | "block",
    currentSpend: budget.currentSpend,
    resetTime: budget.resetTime,
    lastAlertThreshold: budget.lastAlertThreshold,
    isPaused: budget.isPaused,
  };
}

/**
 * Reset budget for an agent manually
 *
 * @param budgetId - Budget ID
 */
export async function resetBudget(budgetId: Id<"budgets">): Promise<void> {
  const client = getConvexClient();
  await client.mutation(api.budgets.reset, { budgetId });
}

/**
 * Format budget status message
 *
 * @param status - Budget status
 * @returns Human-readable status message
 */
export function formatBudgetStatus(status: BudgetStatus): string {
  if (!status.hasBudget) {
    return "No budget configured";
  }

  const percent = status.percentUsed?.toFixed(1) ?? "0.0";
  const spent = status.currentSpend?.toFixed(4) ?? "0.0000";
  const limit = status.limitAmount?.toFixed(4) ?? "0.0000";

  if (status.exceeded) {
    return `⚠️ Budget exceeded: $${spent} / $${limit} (${percent}%)`;
  }

  if (status.percentUsed && status.percentUsed >= 75) {
    return `⚠️ Budget warning: $${spent} / $${limit} (${percent}%)`;
  }

  return `✅ Budget OK: $${spent} / $${limit} (${percent}%)`;
}
