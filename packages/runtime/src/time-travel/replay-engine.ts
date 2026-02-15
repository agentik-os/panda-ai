/**
 * Time Travel Replay Engine
 *
 * Replays agent execution from any timeline event with parameter overrides.
 * Enables debugging: "What if I used Sonnet instead of Opus?" or "What if temperature was 0.5?"
 *
 * Step 112: Core replay engine with model/temperature/maxTokens override support
 */

import type { ConvexAdapter, TimelineEvent } from "../storage/convex-adapter";

/** Model router interface for replay execution */
interface ModelRouter {
  route(params: {
    messages: unknown[];
    model?: string;
    temperature?: number;
    maxTokens?: number;
    topP?: number;
    topK?: number;
  }): Promise<{ inputTokens?: number; outputTokens?: number; model?: string }>;
}

// ============================================================================
// Types
// ============================================================================

/**
 * Parameters that can be overridden during replay
 */
export interface ReplayParams {
  /** Override model (e.g., "claude-opus-4" → "claude-sonnet-4") */
  model?: string;

  /** Override temperature (0.0-1.0) */
  temperature?: number;

  /** Override max tokens */
  maxTokens?: number;

  /** Override top_p sampling */
  topP?: number;

  /** Override top_k sampling (for some providers) */
  topK?: number;

  /** Stop early at specific event ID (for partial replay) */
  stopAtEventId?: string;
}

/**
 * Result of a replay operation
 */
export interface ReplayResult {
  /** Original timeline event (anchor point) */
  originalEvent: TimelineEvent;

  /** All events replayed from this point */
  replayedEvents: TimelineEvent[];

  /** State at start of replay */
  startState: unknown;

  /** State at end of replay */
  endState: unknown;

  /** Total cost of original execution */
  originalCost: number;

  /** Total cost of replayed execution */
  replayCost: number;

  /** Cost savings (negative = more expensive) */
  costSavings: number;

  /** Percentage savings */
  costSavingsPercent: number;

  /** Duration of replay in milliseconds */
  duration: number;

  /** Parameters used for replay */
  params: ReplayParams;

  /** Timestamp when replay started */
  timestamp: number;
}

/**
 * Comparison between original and replayed execution
 */
export interface ExecutionComparison {
  /** Original events */
  original: TimelineEvent[];

  /** Replayed events */
  replayed: TimelineEvent[];

  /** Events that differ (id → { original, replayed }) */
  diff: Map<string, { original: TimelineEvent; replayed: TimelineEvent }>;

  /** Cost comparison */
  cost: {
    original: number;
    replayed: number;
    savings: number;
    savingsPercent: number;
  };
}

// ============================================================================
// Replay Engine
// ============================================================================

export class ReplayEngine {
  constructor(
    private adapter: ConvexAdapter,
    private router: ModelRouter,
  ) {}

  /**
   * Replay execution from a specific timeline event
   *
   * @param eventId - ID of the timeline event to replay from
   * @param params - Parameters to override during replay
   * @returns Replay result with cost comparison
   *
   * @example
   * ```ts
   * const result = await engine.replay("evt_abc123", {
   *   model: "claude-sonnet-4-5", // Changed from opus
   *   temperature: 0.3, // Lower temperature for consistency
   * });
   *
   * console.log(`Savings: $${result.costSavings.toFixed(4)}`);
   * ```
   */
  async replay(eventId: string, params: ReplayParams = {}): Promise<ReplayResult> {
    const startTime = Date.now();

    // 1. Get original execution from Convex
    const originalResult = await this.adapter.replayFromEvent(eventId);

    if (!originalResult.events || originalResult.events.length === 0) {
      throw new Error(`No events found for replay from: ${eventId}`);
    }

    const originalEvent = originalResult.events[0]!;
    const originalCost = originalResult.totalCost;

    // 2. Replay with overridden parameters
    const replayedEvents: TimelineEvent[] = [];
    let replayCost = 0;

    for (const event of originalResult.events) {
      // Stop early if requested
      if (params.stopAtEventId && event.id === params.stopAtEventId) {
        break;
      }

      // Re-execute event with overridden params
      const replayedEvent = await this.executeEventWithOverrides(event, params);

      replayedEvents.push(replayedEvent);
      replayCost += replayedEvent.cost;
    }

    // 3. Calculate savings
    const costSavings = originalCost - replayCost;
    const costSavingsPercent = originalCost > 0 ? (costSavings / originalCost) * 100 : 0;

    // 4. Get end states
    const endState =
      replayedEvents.length > 0
        ? replayedEvents[replayedEvents.length - 1]!.data
        : originalResult.startState;

    const duration = Date.now() - startTime;

    return {
      originalEvent,
      replayedEvents,
      startState: originalResult.startState,
      endState,
      originalCost,
      replayCost,
      costSavings,
      costSavingsPercent,
      duration,
      params,
      timestamp: Date.now(),
    };
  }

  /**
   * Compare original execution vs replayed execution
   *
   * Identifies which events produced different outputs.
   *
   * @param original - Original timeline events
   * @param replayed - Replayed timeline events
   * @returns Comparison with diff map
   */
  compare(original: TimelineEvent[], replayed: TimelineEvent[]): ExecutionComparison {
    const diff = new Map<string, { original: TimelineEvent; replayed: TimelineEvent }>();

    // Compare events by index (assumes same sequence)
    const maxLength = Math.max(original.length, replayed.length);

    for (let i = 0; i < maxLength; i++) {
      const origEvent = original[i];
      const replayEvent = replayed[i];

      if (!origEvent || !replayEvent) {
        // One sequence is shorter - skip incomplete pairs
        continue;
      }

      // Compare event data (deep equality check)
      if (!this.areEventsEqual(origEvent, replayEvent)) {
        diff.set(origEvent.id!, { original: origEvent, replayed: replayEvent });
      }
    }

    // Calculate costs
    const originalCost = original.reduce((sum, e) => sum + (e.cost || 0), 0);
    const replayedCost = replayed.reduce((sum, e) => sum + (e.cost || 0), 0);
    const savings = originalCost - replayedCost;
    const savingsPercent = originalCost > 0 ? (savings / originalCost) * 100 : 0;

    return {
      original,
      replayed,
      diff,
      cost: {
        original: originalCost,
        replayed: replayedCost,
        savings,
        savingsPercent,
      },
    };
  }

  /**
   * Batch replay multiple events with the same params
   *
   * Useful for testing: "What if I used Sonnet for the entire conversation?"
   *
   * @param eventIds - Array of event IDs to replay
   * @param params - Parameters to override
   * @returns Array of replay results
   */
  async batchReplay(eventIds: string[], params: ReplayParams = {}): Promise<ReplayResult[]> {
    const results: ReplayResult[] = [];

    for (const eventId of eventIds) {
      try {
        const result = await this.replay(eventId, params);
        results.push(result);
      } catch (error) {
        console.error(`[ReplayEngine] Failed to replay event ${eventId}:`, error);
        // Continue with other events
      }
    }

    return results;
  }

  // --------------------------------------------------------------------------
  // Private Methods
  // --------------------------------------------------------------------------

  /**
   * Execute a single event with parameter overrides
   */
  private async executeEventWithOverrides(
    event: TimelineEvent,
    params: ReplayParams,
  ): Promise<TimelineEvent> {
    // Extract original event data
    const eventData = event.data as any;

    // Build execution params with overrides
    const executionParams = {
      model: params.model || eventData?.model,
      temperature: params.temperature ?? eventData?.temperature,
      maxTokens: params.maxTokens ?? eventData?.maxTokens,
      topP: params.topP ?? eventData?.topP,
      topK: params.topK ?? eventData?.topK,
    };

    // Re-execute through model router
    const result = await this.router.route({
      messages: eventData?.messages || [],
      ...executionParams,
    });

    // Calculate new cost
    const cost = this.calculateCost(result);

    // Return new timeline event
    return {
      id: `replay-${event.id}`,
      agentId: event.agentId,
      eventType: event.eventType,
      timestamp: Date.now(),
      data: {
        ...eventData,
        ...executionParams,
        result,
        replayed: true,
        originalEventId: event.id,
      },
      cost,
    };
  }

  /**
   * Calculate cost for a model execution result
   */
  private calculateCost(result: any): number {
    const { inputTokens = 0, outputTokens = 0, model } = result;

    // Get pricing from router (simplified - real implementation would use router.getPricing())
    const pricing = this.getModelPricing(model);

    const inputCost = (inputTokens / 1_000_000) * pricing.inputPricePerMillion;
    const outputCost = (outputTokens / 1_000_000) * pricing.outputPricePerMillion;

    return inputCost + outputCost;
  }

  /**
   * Get model pricing (simplified - in production, use router.getPricing())
   */
  private getModelPricing(model: string): {
    inputPricePerMillion: number;
    outputPricePerMillion: number;
  } {
    // Simplified pricing table
    const pricing: Record<string, { inputPricePerMillion: number; outputPricePerMillion: number }> =
      {
        "claude-opus-4": { inputPricePerMillion: 15, outputPricePerMillion: 75 },
        "claude-sonnet-4-5": { inputPricePerMillion: 3, outputPricePerMillion: 15 },
        "claude-haiku-4-5": { inputPricePerMillion: 0.25, outputPricePerMillion: 1.25 },
        "gpt-4o": { inputPricePerMillion: 2.5, outputPricePerMillion: 10 },
        "gpt-4o-mini": { inputPricePerMillion: 0.15, outputPricePerMillion: 0.6 },
        "gemini-2.0-flash-exp": { inputPricePerMillion: 0, outputPricePerMillion: 0 }, // Free
      };

    return (
      pricing[model] || {
        inputPricePerMillion: 1,
        outputPricePerMillion: 3,
      }
    );
  }

  /**
   * Deep equality check for timeline events
   */
  private areEventsEqual(a: TimelineEvent, b: TimelineEvent): boolean {
    // Compare critical fields
    if (a.eventType !== b.eventType) return false;
    if (a.agentId !== b.agentId) return false;
    if (Math.abs((a.cost || 0) - (b.cost || 0)) > 0.0001) return false;

    // Deep compare data (simplified - real implementation would use deep-equal library)
    return JSON.stringify(a.data) === JSON.stringify(b.data);
  }
}
