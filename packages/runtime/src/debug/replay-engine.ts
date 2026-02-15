/**
 * Replay Engine for Time Travel Debug
 *
 * Reconstruct agent state from any point in time.
 * "What-if" analysis: replay with different model/config.
 *
 * Steps 114: Replay engine with state reconstruction
 */

import type { EventStore, AgentEvent, LLMRequestEvent, LLMResponseEvent, ToolCallEvent, AgentDecisionEvent, MemoryEvent, ErrorEvent } from "./event-store.js";
import { ConvexAdapter } from "../storage/convex-adapter.js";

// ============================================================================
// Types
// ============================================================================

export interface ReplayConfig {
  sessionId: string;
  fromEventId?: string; // Start replay from this event (default: first event)
  toEventId?: string; // Stop replay at this event (default: last event)
  whatIf?: WhatIfConfig; // Alternative configuration
}

export interface WhatIfConfig {
  model?: string; // Use different model
  provider?: string; // Use different provider
  temperature?: number;
  maxTokens?: number;
  systemPrompt?: string;
}

export interface ReplayState {
  eventCount: number;
  currentEventId: string;
  timestamp: string;
  agentState: {
    conversationHistory: Array<{ role: string; content: string }>;
    memory: string[];
    toolCalls: number;
    decisions: string[];
  };
  cost: {
    totalUsd: number;
    inputTokens: number;
    outputTokens: number;
    byModel: Record<string, { cost: number; tokens: number }>;
  };
  errors: Array<{ eventId: string; error: string }>;
}

export interface ReplayResult {
  sessionId: string;
  startTime: string;
  endTime: string;
  totalEvents: number;
  finalState: ReplayState;
  cost: {
    original: number;
    replayed?: number; // If whatIf was used
    savings?: number; // Difference
  };
  timeline: Array<{
    eventId: string;
    type: string;
    timestamp: string;
    description: string;
  }>;
}

export interface ComparisonResult {
  original: ReplayResult;
  replayed: ReplayResult;
  diff: {
    costDifference: number; // replayed - original (negative = savings)
    tokenDifference: number;
    qualityChange?: string; // "better", "worse", "similar"
  };
}

// ============================================================================
// Replay Engine
// ============================================================================

export class ReplayEngine {
  private eventStore: EventStore;
  private adapter: ConvexAdapter;

  constructor(eventStore: EventStore, adapter: ConvexAdapter) {
    this.eventStore = eventStore;
    this.adapter = adapter;
  }

  // ============================================================================
  // Replay Methods
  // ============================================================================

  /**
   * Replay a session from start to finish
   */
  async replay(config: ReplayConfig): Promise<ReplayResult> {
    const events = await this.eventStore.getSessionEvents(config.sessionId);

    if (events.length === 0) {
      throw new Error(`No events found for session ${config.sessionId}`);
    }

    // Filter events by range if specified
    let filteredEvents = events;
    if (config.fromEventId) {
      const startIndex = events.findIndex((e) => e.id === config.fromEventId);
      if (startIndex >= 0) {
        filteredEvents = events.slice(startIndex);
      }
    }
    if (config.toEventId) {
      const endIndex = filteredEvents.findIndex(
        (e) => e.id === config.toEventId
      );
      if (endIndex >= 0) {
        filteredEvents = filteredEvents.slice(0, endIndex + 1);
      }
    }

    // Build state
    const state = this.reconstructState(filteredEvents);

    // Calculate cost
    const originalCost = await this.eventStore.getSessionCost(config.sessionId);
    let replayedCost: number | undefined;

    if (config.whatIf) {
      replayedCost = this.calculateWhatIfCost(filteredEvents, config.whatIf);
    }

    return {
      sessionId: config.sessionId,
      startTime: filteredEvents[0]!.timestamp,
      endTime: filteredEvents[filteredEvents.length - 1]!.timestamp,
      totalEvents: filteredEvents.length,
      finalState: state,
      cost: {
        original: originalCost,
        replayed: replayedCost,
        savings:
          replayedCost !== undefined
            ? originalCost - replayedCost
            : undefined,
      },
      timeline: this.buildTimeline(filteredEvents),
    };
  }

  /**
   * Replay from a specific event ID
   */
  async replayFrom(sessionId: string, fromEventId: string): Promise<ReplayResult> {
    return this.replay({ sessionId, fromEventId });
  }

  /**
   * Replay up to a specific event ID
   */
  async replayTo(sessionId: string, toEventId: string): Promise<ReplayResult> {
    return this.replay({ sessionId, toEventId });
  }

  /**
   * "What-if" analysis: replay with different configuration
   */
  async whatIf(
    sessionId: string,
    whatIfConfig: WhatIfConfig
  ): Promise<ComparisonResult> {
    // Original replay
    const original = await this.replay({ sessionId });

    // Replay with what-if config
    const replayed = await this.replay({
      sessionId,
      whatIf: whatIfConfig,
    });

    return {
      original,
      replayed,
      diff: {
        costDifference: replayed.cost.replayed! - original.cost.original,
        tokenDifference:
          replayed.finalState.cost.inputTokens +
          replayed.finalState.cost.outputTokens -
          (original.finalState.cost.inputTokens +
            original.finalState.cost.outputTokens),
        qualityChange: this.estimateQualityChange(original, replayed),
      },
    };
  }

  /**
   * Compare multiple what-if scenarios
   */
  async compareScenarios(
    sessionId: string,
    scenarios: Array<{ name: string; config: WhatIfConfig }>
  ): Promise<
    Array<{
      name: string;
      result: ReplayResult;
      costVsOriginal: number;
      tokensVsOriginal: number;
    }>
  > {
    const original = await this.replay({ sessionId });

    const results = await Promise.all(
      scenarios.map(async (scenario) => {
        const result = await this.replay({
          sessionId,
          whatIf: scenario.config,
        });

        return {
          name: scenario.name,
          result,
          costVsOriginal: result.cost.replayed! - original.cost.original,
          tokensVsOriginal:
            result.finalState.cost.inputTokens +
            result.finalState.cost.outputTokens -
            (original.finalState.cost.inputTokens +
              original.finalState.cost.outputTokens),
        };
      })
    );

    return results;
  }

  // ============================================================================
  // Replay using ConvexAdapter's replayFromEvent
  // ============================================================================

  /**
   * Use Convex adapter's built-in replay (from Task #91)
   */
  async replayUsingConvex(eventId: string): Promise<{
    events: any[];
    totalCost: number;
    duration: number;
    startState: unknown;
    endState: unknown;
  }> {
    return this.adapter.replayFromEvent(eventId);
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  /**
   * Reconstruct agent state from events
   */
  private reconstructState(events: AgentEvent[]): ReplayState {
    const state: ReplayState = {
      eventCount: events.length,
      currentEventId: events[events.length - 1]?.id ?? "",
      timestamp: events[events.length - 1]?.timestamp ?? "",
      agentState: {
        conversationHistory: [],
        memory: [],
        toolCalls: 0,
        decisions: [],
      },
      cost: {
        totalUsd: 0,
        inputTokens: 0,
        outputTokens: 0,
        byModel: {},
      },
      errors: [],
    };

    for (const event of events) {
      switch (event.type) {
        case "llm.request":
          const req = event as LLMRequestEvent;
          state.agentState.conversationHistory.push({
            role: "user",
            content: req.payload.prompt,
          });
          break;

        case "llm.response":
          const res = event as LLMResponseEvent;
          state.agentState.conversationHistory.push({
            role: "assistant",
            content: res.payload.response,
          });
          state.cost.totalUsd += res.payload.costUsd;
          state.cost.inputTokens += res.payload.inputTokens;
          state.cost.outputTokens += res.payload.outputTokens;

          // Track by model
          const modelKey = `${res.payload.provider}/${res.payload.model}`;
          if (!state.cost.byModel[modelKey]) {
            state.cost.byModel[modelKey] = { cost: 0, tokens: 0 };
          }
          state.cost.byModel[modelKey].cost += res.payload.costUsd;
          state.cost.byModel[modelKey].tokens +=
            res.payload.inputTokens + res.payload.outputTokens;
          break;

        case "tool.request":
        case "tool.response":
          state.agentState.toolCalls++;
          break;

        case "agent.decision":
          state.agentState.decisions.push(event.payload.decision);
          break;

        case "memory.stored":
          state.agentState.memory.push(event.payload.fact);
          break;

        case "error.occurred":
          state.errors.push({
            eventId: event.id,
            error: event.payload.error,
          });
          break;
      }
    }

    return state;
  }

  /**
   * Calculate cost with different model
   */
  private calculateWhatIfCost(
    events: AgentEvent[],
    whatIfConfig: WhatIfConfig
  ): number {
    let totalCost = 0;

    for (const event of events) {
      if (event.type === "llm.response") {
        const e = event as LLMResponseEvent;

        // If model specified, recalculate with that model's pricing
        if (whatIfConfig.model) {
          // Simple estimation: different models have different costs
          const costMultiplier = this.getModelCostMultiplier(
            e.payload.model,
            whatIfConfig.model
          );
          totalCost += e.payload.costUsd * costMultiplier;
        } else {
          totalCost += e.payload.costUsd;
        }
      }
    }

    return totalCost;
  }

  /**
   * Build timeline of events
   */
  private buildTimeline(
    events: AgentEvent[]
  ): Array<{ eventId: string; type: string; timestamp: string; description: string }> {
    return events.map((event) => ({
      eventId: event.id,
      type: event.type,
      timestamp: event.timestamp,
      description: this.getEventDescription(event),
    }));
  }

  /**
   * Get human-readable event description
   */
  private getEventDescription(event: AgentEvent): string {
    const eventType = event.type as string;
    switch (eventType) {
      case "session.start":
        return "Session started";
      case "session.end":
        return "Session ended";
      case "llm.request":
        return `LLM request: ${(event as LLMRequestEvent).payload.model}`;
      case "llm.response":
        const res = event as LLMResponseEvent;
        return `LLM response: ${res.payload.outputTokens} tokens, $${res.payload.costUsd.toFixed(4)}`;
      case "tool.request":
        return `Tool call: ${(event as ToolCallEvent).payload.toolName}`;
      case "tool.response":
        return `Tool result: ${(event as ToolCallEvent).payload.toolName}`;
      case "agent.decision":
        return `Decision: ${(event as AgentDecisionEvent).payload.decision}`;
      case "memory.stored":
        return `Memory stored: ${(event as MemoryEvent).payload.fact.substring(0, 50)}...`;
      case "error.occurred":
        return `Error: ${(event as ErrorEvent).payload.error}`;
      default:
        return "Unknown event";
    }
  }

  /**
   * Estimate quality change between models
   */
  private estimateQualityChange(
    original: ReplayResult,
    replayed: ReplayResult
  ): string {
    // Simple heuristic: compare response lengths and decision counts
    const originalWords =
      original.finalState.agentState.conversationHistory.length;
    const replayedWords =
      replayed.finalState.agentState.conversationHistory.length;

    const diff = replayedWords - originalWords;

    if (Math.abs(diff) < originalWords * 0.1) {
      return "similar";
    } else if (diff > 0) {
      return "more detailed";
    } else {
      return "less detailed";
    }
  }

  /**
   * Get cost multiplier for model change
   */
  private getModelCostMultiplier(
    originalModel: string,
    newModel: string
  ): number {
    // Model cost ratios (relative to opus)
    const costs: Record<string, number> = {
      "claude-opus-4-6": 1.0,
      "claude-sonnet-4-5": 0.2, // 5x cheaper
      "claude-haiku-4-5": 0.025, // 40x cheaper
      "gpt-4o": 0.5,
      "gpt-4o-mini": 0.03,
      "gemini-pro": 0.05,
    };

    const originalCost = costs[originalModel] ?? 1.0;
    const newCost = costs[newModel] ?? 1.0;

    return newCost / originalCost;
  }
}
