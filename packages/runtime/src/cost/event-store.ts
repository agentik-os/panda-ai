/**
 * Cost Event Store
 *
 * Event-sourced cost tracking with immutable append-only writes to Convex.
 * All cost events are persisted to the Convex `costs` table for analytics and billing.
 *
 * Architecture:
 * - Event-sourced: Every AI model call creates an immutable cost event
 * - Append-only: Events are never updated or deleted (except cleanup)
 * - Real-time: Dashboard automatically updates via Convex subscriptions
 */

import { getConvexClient, api } from "../convex-client";
import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * Cost event to be stored
 */
export interface CostEventData {
  agentId: Id<"agents">;
  conversationId?: Id<"conversations">;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  channel: string;
  endpoint?: string;
  responseTime?: number;
}

/**
 * Store a cost event to Convex
 *
 * Creates an immutable record of AI model usage and cost.
 * The event is immediately visible in the dashboard via real-time subscriptions.
 *
 * @param eventData - Cost event data
 * @returns Cost event ID
 *
 * @example
 * ```ts
 * const costId = await storeCostEvent({
 *   agentId: "j57abc123",
 *   model: "claude-opus-4",
 *   provider: "anthropic",
 *   inputTokens: 1500,
 *   outputTokens: 800,
 *   totalTokens: 2300,
 *   inputCost: 0.045,
 *   outputCost: 0.12,
 *   totalCost: 0.165,
 *   channel: "telegram",
 * });
 * ```
 */
export async function storeCostEvent(
  eventData: CostEventData
): Promise<Id<"costs">> {
  const client = getConvexClient();

  try {
    const costId = await client.mutation(api.mutations.costs.create, {
      agentId: eventData.agentId,
      conversationId: eventData.conversationId,
      model: eventData.model,
      provider: eventData.provider,
      inputTokens: eventData.inputTokens,
      outputTokens: eventData.outputTokens,
      totalTokens: eventData.totalTokens,
      inputCost: eventData.inputCost,
      outputCost: eventData.outputCost,
      totalCost: eventData.totalCost,
      channel: eventData.channel,
      endpoint: eventData.endpoint,
      responseTime: eventData.responseTime,
    });

    return costId as Id<"costs">;
  } catch (error) {
    console.error("[Cost Event Store] Failed to store cost event:", error);
    throw new Error("Failed to persist cost event to Convex");
  }
}

/**
 * Clean up old cost events
 *
 * Deletes cost events older than the specified timestamp.
 * Use this for compliance (e.g., GDPR data retention) or storage optimization.
 *
 * @param olderThan - Unix timestamp (milliseconds)
 * @returns Number of deleted events
 *
 * @example
 * ```ts
 * // Delete events older than 90 days
 * const ninetyDaysAgo = Date.now() - (90 * 24 * 60 * 60 * 1000);
 * const deleted = await cleanupOldEvents(ninetyDaysAgo);
 * console.log(`Deleted ${deleted} old cost events`);
 * ```
 */
export async function cleanupOldEvents(
  olderThan: number
): Promise<number> {
  const client = getConvexClient();

  try {
    const result = await client.mutation(api.mutations.costs.cleanup, {
      olderThan,
    });

    return result.deletedCount;
  } catch (error) {
    console.error("[Cost Event Store] Failed to cleanup old events:", error);
    throw new Error("Failed to cleanup cost events from Convex");
  }
}

/**
 * Remove all cost events for an agent
 *
 * Deletes all cost records associated with a specific agent.
 * Typically used when an agent is permanently deleted.
 *
 * @param agentId - Agent ID
 * @returns Number of deleted events
 */
export async function removeEventsForAgent(
  agentId: Id<"agents">
): Promise<number> {
  const client = getConvexClient();

  try {
    const result = await client.mutation(api.mutations.costs.removeForAgent, {
      agentId,
    });

    return result.deletedCount;
  } catch (error) {
    console.error(
      "[Cost Event Store] Failed to remove events for agent:",
      error
    );
    throw new Error("Failed to remove agent cost events from Convex");
  }
}
