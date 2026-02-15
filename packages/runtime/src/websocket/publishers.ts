/**
 * WebSocket Real-Time Updates - Event Publishers
 *
 * Functions to publish events to WebSocket clients.
 * Called by cost tracking and budget systems to send real-time updates.
 */

import { randomUUID } from "node:crypto";
import { getWebSocketServer } from "./server";
import type {
  WebSocketMessage,
  WebSocketChannel,
  CostEventPayload,
  BudgetAlertPayload,
  AgentStatusPayload,
} from "./types";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * Publish new cost event
 *
 * Called after cost is recorded to notify subscribers of new spend.
 *
 * @param cost - Cost event data
 *
 * @example
 * ```ts
 * await storeCostEvent(costData);
 * publishCostEvent(costData);
 * ```
 */
export function publishCostEvent(cost: CostEventPayload): void {
  const server = getWebSocketServer();

  const message: WebSocketMessage<CostEventPayload> = {
    type: "cost:new",
    channel: `agent:${cost.agentId}`,
    payload: cost,
    timestamp: Date.now(),
    messageId: randomUUID(),
  };

  // Broadcast to agent channel
  server.broadcastToChannel(`agent:${cost.agentId}`, message);

  // Also broadcast to user channel if conversationId present
  // (requires userId lookup - TODO: implement after user system)

  console.log(
    `[WebSocket Publishers] Published cost event for agent ${cost.agentId}: $${cost.totalCost.toFixed(4)}`
  );
}

/**
 * Publish budget alert
 *
 * Called when budget threshold is reached or exceeded.
 *
 * @param alert - Budget alert data
 *
 * @example
 * ```ts
 * const status = await recordCostAgainstBudget(agentId, cost);
 * if (status.shouldAlert) {
 *   publishBudgetAlert({
 *     budgetId: status.budgetId,
 *     agentId,
 *     threshold: status.threshold,
 *     currentSpend: status.currentSpend,
 *     limitAmount: status.limitAmount,
 *     percentUsed: status.percentUsed,
 *     period: budget.period,
 *     enforcementAction: budget.enforcementAction,
 *     isPaused: status.exceeded && budget.enforcementAction !== "warn",
 *     message: `Budget ${status.threshold}% threshold reached`,
 *   });
 * }
 * ```
 */
export function publishBudgetAlert(alert: BudgetAlertPayload): void {
  const server = getWebSocketServer();

  const eventType =
    alert.threshold === 100
      ? "budget:exceeded"
      : ("budget:alert" as const);

  const message: WebSocketMessage<BudgetAlertPayload> = {
    type: eventType,
    channel: `agent:${alert.agentId}`,
    payload: alert,
    timestamp: Date.now(),
    messageId: randomUUID(),
  };

  // Broadcast to agent channel
  server.broadcastToChannel(`agent:${alert.agentId}`, message);

  // Also broadcast to budget channel
  server.broadcastToChannel(`budget:${alert.budgetId}`, message);

  console.log(
    `[WebSocket Publishers] Published budget alert for agent ${alert.agentId}: ${alert.threshold}% (${alert.message})`
  );
}

/**
 * Publish budget reset event
 *
 * Called when budget period resets (daily/weekly/monthly).
 *
 * @param budgetId - Budget ID
 * @param agentId - Agent ID
 * @param period - Budget period
 *
 * @example
 * ```ts
 * await resetBudget(ctx, budgetId);
 * publishBudgetReset(budgetId, agentId, "daily");
 * ```
 */
export function publishBudgetReset(
  budgetId: Id<"budgets">,
  agentId: Id<"agents">,
  period: "daily" | "weekly" | "monthly" | "per-conversation"
): void {
  const server = getWebSocketServer();

  const message: WebSocketMessage<BudgetAlertPayload> = {
    type: "budget:reset",
    channel: `agent:${agentId}`,
    payload: {
      budgetId,
      agentId,
      threshold: 0 as 50, // Type workaround for reset event
      currentSpend: 0,
      limitAmount: 0, // Will be updated by client from budget query
      percentUsed: 0,
      period,
      enforcementAction: "warn",
      isPaused: false,
      message: `Budget reset for ${period} period`,
    },
    timestamp: Date.now(),
    messageId: randomUUID(),
  };

  server.broadcastToChannel(`agent:${agentId}`, message);
  server.broadcastToChannel(`budget:${budgetId}`, message);

  console.log(
    `[WebSocket Publishers] Published budget reset for agent ${agentId}`
  );
}

/**
 * Publish agent status change
 *
 * Called when agent is paused/resumed due to budget or other reasons.
 *
 * @param status - Agent status data
 *
 * @example
 * ```ts
 * // When budget exceeded with pause enforcement
 * if (exceeded && budget.enforcementAction === "pause") {
 *   publishAgentStatus({
 *     agentId,
 *     status: "paused",
 *     reason: "Budget limit exceeded",
 *     budgetId: budget.id,
 *     timestamp: Date.now(),
 *   });
 * }
 *
 * // When budget resets
 * if (wasPaused) {
 *   publishAgentStatus({
 *     agentId,
 *     status: "active",
 *     reason: "Budget reset",
 *     budgetId: budget.id,
 *     timestamp: Date.now(),
 *   });
 * }
 * ```
 */
export function publishAgentStatus(status: AgentStatusPayload): void {
  const server = getWebSocketServer();

  const eventType =
    status.status === "paused"
      ? "agent:paused"
      : status.status === "active"
        ? "agent:resumed"
        : ("agent:status" as const);

  const message: WebSocketMessage<AgentStatusPayload> = {
    type: eventType,
    channel: `agent:${status.agentId}`,
    payload: status,
    timestamp: Date.now(),
    messageId: randomUUID(),
  };

  server.broadcastToChannel(`agent:${status.agentId}`, message);

  // Use descriptive event name for logging
  const eventName =
    status.status === "paused"
      ? "paused"
      : status.status === "active"
        ? "resumed"
        : status.status;

  console.log(
    `[WebSocket Publishers] Published agent status for ${status.agentId}: ${eventName}${status.reason ? ` (${status.reason})` : ""}`
  );
}

/**
 * Test WebSocket publishing
 *
 * Used for development/debugging to verify WebSocket connectivity.
 *
 * @param channel - Channel to test
 *
 * @example
 * ```ts
 * testPublish("agent:j57abc123");
 * ```
 */
export function testPublish(channel: WebSocketChannel): void {
  const server = getWebSocketServer();

  const message: WebSocketMessage = {
    type: "connection:established",
    channel,
    payload: {
      test: true,
      message: "Test publish from runtime",
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
    messageId: randomUUID(),
  };

  server.broadcastToChannel(channel, message);

  console.log(`[WebSocket Publishers] Test publish to ${channel}`);
}

/**
 * Publish system-wide announcement
 *
 * For maintenance notifications, system updates, etc.
 *
 * @param message - Announcement message
 *
 * @example
 * ```ts
 * publishSystemAnnouncement("System maintenance in 5 minutes");
 * ```
 */
export function publishSystemAnnouncement(messageText: string): void {
  const server = getWebSocketServer();

  const message: WebSocketMessage = {
    type: "connection:established", // Using generic type for announcements
    channel: "system",
    payload: {
      announcement: messageText,
      timestamp: Date.now(),
    },
    timestamp: Date.now(),
    messageId: randomUUID(),
  };

  server.broadcastToAll(message);

  console.log(`[WebSocket Publishers] System announcement: ${messageText}`);
}
