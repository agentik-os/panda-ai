/**
 * Budget Configuration and Tracking
 *
 * Manages per-agent budget limits and alerts.
 * Integrated with cost tracking (costs.ts) for real-time monitoring.
 */

import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

/**
 * Budget period types
 */
export const BudgetPeriod = v.union(
  v.literal("daily"),
  v.literal("weekly"),
  v.literal("monthly"),
  v.literal("per-conversation"),
);

/**
 * Notification channel types
 */
export const NotificationChannel = v.union(
  v.literal("email"),
  v.literal("webhook"),
  v.literal("telegram"),
  v.literal("in-app"),
);

/**
 * Enforcement action when budget exceeded
 */
export const EnforcementAction = v.union(
  v.literal("warn"), // Just send notification
  v.literal("pause"), // Pause agent execution
  v.literal("block"), // Block all agent requests
);

/**
 * Alert threshold (percentage of budget)
 */
export const AlertThreshold = v.union(
  v.literal(50),
  v.literal(75),
  v.literal(90),
  v.literal(100),
);

/**
 * Create a new budget configuration
 */
export const create = mutation({
  args: {
    agentId: v.id("agents"),
    limitAmount: v.number(), // USD
    period: BudgetPeriod,
    thresholds: v.array(AlertThreshold),
    notificationChannels: v.array(NotificationChannel),
    enforcementAction: EnforcementAction,
    resetDay: v.optional(v.number()), // Day of month (1-31) for monthly reset
    webhookUrl: v.optional(v.string()), // For webhook notifications
    emailAddress: v.optional(v.string()), // For email notifications
    telegramChatId: v.optional(v.string()), // For Telegram notifications
  },
  handler: async (ctx, args) => {
    // Validate that agent exists
    const agent = await ctx.db.get(args.agentId);
    if (!agent) {
      throw new Error(`Agent ${args.agentId} not found`);
    }

    // Check if budget already exists for this agent
    const existingBudget = await ctx.db
      .query("budgets")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (existingBudget) {
      throw new Error(`Budget already exists for agent ${args.agentId}`);
    }

    // Calculate reset time based on period
    const now = Date.now();
    const resetTime = calculateNextReset(now, args.period, args.resetDay);

    // Create budget
    const budgetId = await ctx.db.insert("budgets", {
      agentId: args.agentId,
      limitAmount: args.limitAmount,
      period: args.period,
      thresholds: args.thresholds,
      notificationChannels: args.notificationChannels,
      enforcementAction: args.enforcementAction,
      resetDay: args.resetDay,
      webhookUrl: args.webhookUrl,
      emailAddress: args.emailAddress,
      telegramChatId: args.telegramChatId,
      currentSpend: 0,
      resetTime,
      lastAlertThreshold: 0,
      isPaused: false,
      createdAt: now,
      updatedAt: now,
    });

    return budgetId;
  },
});

/**
 * Update budget configuration
 */
export const update = mutation({
  args: {
    budgetId: v.id("budgets"),
    limitAmount: v.optional(v.number()),
    thresholds: v.optional(v.array(AlertThreshold)),
    notificationChannels: v.optional(v.array(NotificationChannel)),
    enforcementAction: v.optional(EnforcementAction),
    webhookUrl: v.optional(v.string()),
    emailAddress: v.optional(v.string()),
    telegramChatId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { budgetId, ...updates } = args;

    await ctx.db.patch(budgetId, {
      ...updates,
      updatedAt: Date.now(),
    });

    return budgetId;
  },
});

/**
 * Record cost against budget
 */
export const recordCost = mutation({
  args: {
    agentId: v.id("agents"),
    costAmount: v.number(), // USD
  },
  handler: async (ctx, args) => {
    const budget = await ctx.db
      .query("budgets")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();

    if (!budget) {
      // No budget configured for this agent - allow execution
      return { exceeded: false, shouldAlert: false };
    }

    const now = Date.now();

    // Check if budget period has expired and needs reset
    if (now >= budget.resetTime) {
      await resetBudget(ctx, budget._id);
      // After reset, currentSpend is 0
      await ctx.db.patch(budget._id, {
        currentSpend: args.costAmount,
        updatedAt: now,
      });

      return { exceeded: false, shouldAlert: false };
    }

    // Add cost to current spend
    const newSpend = budget.currentSpend + args.costAmount;
    const percentUsed = (newSpend / budget.limitAmount) * 100;

    // Determine if we should alert
    let shouldAlert = false;
    let alertThreshold = budget.lastAlertThreshold;

    for (const threshold of budget.thresholds.sort((a, b) => a - b)) {
      if (percentUsed >= threshold && threshold > budget.lastAlertThreshold) {
        shouldAlert = true;
        alertThreshold = threshold;
        break;
      }
    }

    // Check if budget exceeded
    const exceeded = newSpend >= budget.limitAmount;

    // Update budget
    await ctx.db.patch(budget._id, {
      currentSpend: newSpend,
      lastAlertThreshold: shouldAlert ? alertThreshold : budget.lastAlertThreshold,
      isPaused: exceeded && budget.enforcementAction !== "warn",
      updatedAt: now,
    });

    return {
      exceeded,
      shouldAlert,
      threshold: shouldAlert ? alertThreshold : undefined,
      currentSpend: newSpend,
      limitAmount: budget.limitAmount,
      percentUsed,
    };
  },
});

/**
 * Reset budget spend to zero
 */
const resetBudget = async (
  ctx: any,
  budgetId: Id<"budgets">,
): Promise<void> => {
  const budget = await ctx.db.get(budgetId);
  if (!budget) return;

  const now = Date.now();
  const nextReset = calculateNextReset(now, budget.period, budget.resetDay);

  await ctx.db.patch(budgetId, {
    currentSpend: 0,
    resetTime: nextReset,
    lastAlertThreshold: 0,
    isPaused: false,
    updatedAt: now,
  });
};

/**
 * Manually reset a budget
 */
export const reset = mutation({
  args: {
    budgetId: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    await resetBudget(ctx, args.budgetId);
    return { success: true };
  },
});

/**
 * Get budget for an agent
 */
export const getByAgent = query({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("budgets")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .first();
  },
});

/**
 * List all budgets
 */
export const list = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("budgets").collect();
  },
});

/**
 * Get budgets that need reset
 */
export const getNeedingReset = query({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const allBudgets = await ctx.db.query("budgets").collect();

    return allBudgets.filter((budget) => now >= budget.resetTime);
  },
});

/**
 * Delete a budget
 */
export const remove = mutation({
  args: {
    budgetId: v.id("budgets"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.budgetId);
    return { success: true };
  },
});

/**
 * Calculate next reset time based on period
 */
function calculateNextReset(
  currentTime: number,
  period: "daily" | "weekly" | "monthly" | "per-conversation",
  resetDay?: number,
): number {
  const now = new Date(currentTime);

  switch (period) {
    case "daily":
      // Reset at midnight tomorrow
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return tomorrow.getTime();

    case "weekly":
      // Reset at midnight next Monday
      const nextMonday = new Date(now);
      const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7;
      nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
      nextMonday.setHours(0, 0, 0, 0);
      return nextMonday.getTime();

    case "monthly":
      // Reset on specified day of next month
      const nextMonth = new Date(now);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      nextMonth.setDate(resetDay ?? 1);
      nextMonth.setHours(0, 0, 0, 0);
      return nextMonth.getTime();

    case "per-conversation":
      // Reset immediately after each conversation ends
      // This is handled separately by the conversation end event
      return currentTime + 24 * 60 * 60 * 1000; // Default to 24h

    default:
      return currentTime + 24 * 60 * 60 * 1000;
  }
}
