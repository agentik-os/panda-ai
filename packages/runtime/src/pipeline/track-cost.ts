import type { ModelResponse, CostEvent } from "@agentik-os/shared";
import { MODEL_COSTS, calculateCost } from "@agentik-os/shared";
import type { ModelSelection } from "../router/selector";
import { storeCostEvent } from "../cost/event-store";
import { publishCostEvent } from "../websocket/publishers";
import type { Id } from "../../../../convex/_generated/dataModel";

export function createCostEvent(
  agentId: string,
  userId: string,
  modelSelection: ModelSelection,
  modelResponse: ModelResponse
): CostEvent {
  // Get cost per 1M tokens for this model
  const modelKey = modelResponse.model as keyof typeof MODEL_COSTS;
  const costs = MODEL_COSTS[modelKey];

  const cost = costs
    ? calculateCost(
        modelResponse.usage.promptTokens,
        modelResponse.usage.completionTokens,
        costs.input,
        costs.output
      )
    : 0;

  return {
    id: `cost_${Date.now()}`,
    agentId,
    userId,
    provider: modelSelection.provider,
    model: modelResponse.model,
    promptTokens: modelResponse.usage.promptTokens,
    completionTokens: modelResponse.usage.completionTokens,
    totalTokens: modelResponse.usage.totalTokens,
    cost,
    timestamp: new Date(),
    metadata: {
      selectionReason: modelSelection.reason,
    },
  };
}

/**
 * Track cost event to Convex
 *
 * Persists the cost event to the Convex database for analytics and billing.
 * The cost is immediately visible in the dashboard via real-time subscriptions.
 *
 * @param costEvent - Cost event from pipeline
 * @param channel - Channel where the message was sent (e.g., "cli", "telegram")
 * @param conversationId - Optional conversation ID
 * @param responseTime - Optional response time in milliseconds
 */
export async function trackCost(
  costEvent: CostEvent,
  channel: string = "unknown",
  conversationId?: Id<"conversations">,
  responseTime?: number
): Promise<void> {
  try {
    // Convert CostEvent to CostEventData format for Convex
    // Calculate inputCost and outputCost from total cost
    const modelKey = costEvent.model as keyof typeof MODEL_COSTS;
    const costs = MODEL_COSTS[modelKey];

    let inputCost = 0;
    let outputCost = 0;

    if (costs) {
      inputCost = calculateCost(
        costEvent.promptTokens,
        0,
        costs.input,
        costs.output
      );
      outputCost = calculateCost(
        0,
        costEvent.completionTokens,
        costs.input,
        costs.output
      );
    }

    const costId = await storeCostEvent({
      agentId: costEvent.agentId as Id<"agents">,
      conversationId,
      model: costEvent.model,
      provider: costEvent.provider,
      inputTokens: costEvent.promptTokens,
      outputTokens: costEvent.completionTokens,
      totalTokens: costEvent.totalTokens,
      inputCost,
      outputCost,
      totalCost: costEvent.cost,
      channel,
      responseTime,
    });

    // Publish WebSocket event for real-time dashboard updates
    publishCostEvent({
      id: costId,
      agentId: costEvent.agentId as Id<"agents">,
      conversationId,
      model: costEvent.model,
      provider: costEvent.provider,
      inputTokens: costEvent.promptTokens,
      outputTokens: costEvent.completionTokens,
      totalTokens: costEvent.totalTokens,
      inputCost,
      outputCost,
      totalCost: costEvent.cost,
      channel,
      timestamp: Date.now(),
    });

    console.log(
      `[Cost] ${costEvent.model}: ${costEvent.totalTokens} tokens = $${costEvent.cost.toFixed(4)}`
    );
  } catch (error) {
    // Log error but don't fail the entire request if cost tracking fails
    console.error("[Cost] Failed to track cost event:", error);
  }
}
