/**
 * Event Store for Time Travel Debug
 *
 * Captures all agent actions as immutable events for replay, debugging, and audit.
 * Based on Event Sourcing architecture (see docs/EVENT-SOURCING.md).
 *
 * Steps 112-113: Event store with query capabilities
 */

import { ConvexAdapter } from "../storage/convex-adapter.js";
import { randomUUID } from "crypto";

// ============================================================================
// Event Types (from EVENT-SOURCING.md)
// ============================================================================

export type EventType =
  | "session.start"
  | "session.end"
  | "llm.request"
  | "llm.response"
  | "tool.request"
  | "tool.response"
  | "agent.decision"
  | "memory.stored"
  | "error.occurred";

export interface BaseEvent {
  id: string; // UUID
  type: EventType;
  timestamp: string; // ISO 8601
  sessionId: string; // Agent session
  agentId: string; // Which agent
  correlationId: string; // Links related events
  version: number; // Schema version
  metadata: {
    userId?: string; // Who initiated
    traceId?: string; // OpenTelemetry
    [key: string]: any;
  };
}

export interface LLMRequestEvent extends BaseEvent {
  type: "llm.request";
  payload: {
    model: string; // "claude-opus-4-6"
    provider: string; // "anthropic"
    prompt: string; // User message
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
  };
}

export interface LLMResponseEvent extends BaseEvent {
  type: "llm.response";
  payload: {
    model: string;
    provider: string;
    response: string; // Agent response
    inputTokens: number;
    outputTokens: number;
    costUsd: number; // Calculated at write time
    latencyMs: number;
  };
}

export interface ToolCallEvent extends BaseEvent {
  type: "tool.request" | "tool.response";
  payload: {
    toolName: string; // "fs_read_file"
    mcpServer?: string; // Which MCP server
    arguments?: any;
    result?: any;
    userApproved?: boolean; // Consent tracking
    error?: string;
  };
}

export interface AgentDecisionEvent extends BaseEvent {
  type: "agent.decision";
  payload: {
    decision: string; // "Use web search to find information"
    reasoning: string;
    confidence: number; // 0-1
  };
}

export interface MemoryEvent extends BaseEvent {
  type: "memory.stored";
  payload: {
    fact: string; // Extracted fact
    embedding?: number[]; // Vector embedding
    importance: number; // 0-1
  };
}

export interface ErrorEvent extends BaseEvent {
  type: "error.occurred";
  payload: {
    error: string;
    stack?: string;
    recoverable: boolean;
  };
}

export type AgentEvent =
  | LLMRequestEvent
  | LLMResponseEvent
  | ToolCallEvent
  | AgentDecisionEvent
  | MemoryEvent
  | ErrorEvent;

// ============================================================================
// Event Store
// ============================================================================

export interface EventStoreConfig {
  adapter: ConvexAdapter;
  version?: number; // Schema version (default: 1)
}

export interface EventQuery {
  sessionId?: string;
  agentId?: string;
  type?: EventType | EventType[];
  startTime?: string; // ISO 8601
  endTime?: string;
  limit?: number;
  correlationId?: string;
}

export interface EventStats {
  totalEvents: number;
  eventsByType: Record<EventType, number>;
  totalCost: number;
  avgLatency: number;
  sessionCount: number;
}

export class EventStore {
  private adapter: ConvexAdapter;
  private version: number;

  constructor(config: EventStoreConfig) {
    this.adapter = config.adapter;
    this.version = config.version ?? 1;
  }

  // ============================================================================
  // Event Creation (append-only)
  // ============================================================================

  /**
   * Record session start
   */
  async recordSessionStart(
    agentId: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const event: BaseEvent = {
      id: randomUUID(),
      type: "session.start",
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId: randomUUID(),
      version: this.version,
      metadata,
    };

    return this.saveEvent(event);
  }

  /**
   * Record LLM request
   */
  async recordLLMRequest(
    agentId: string,
    sessionId: string,
    payload: LLMRequestEvent["payload"],
    correlationId?: string
  ): Promise<string> {
    const event: LLMRequestEvent = {
      id: randomUUID(),
      type: "llm.request",
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId: correlationId ?? randomUUID(),
      version: this.version,
      metadata: {},
      payload,
    };

    return this.saveEvent(event);
  }

  /**
   * Record LLM response
   */
  async recordLLMResponse(
    agentId: string,
    sessionId: string,
    payload: LLMResponseEvent["payload"],
    correlationId: string // Must match request
  ): Promise<string> {
    const event: LLMResponseEvent = {
      id: randomUUID(),
      type: "llm.response",
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId,
      version: this.version,
      metadata: {},
      payload,
    };

    return this.saveEvent(event);
  }

  /**
   * Record tool call (request or response)
   */
  async recordToolCall(
    agentId: string,
    sessionId: string,
    type: "tool.request" | "tool.response",
    payload: ToolCallEvent["payload"],
    correlationId?: string
  ): Promise<string> {
    const event: ToolCallEvent = {
      id: randomUUID(),
      type,
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId: correlationId ?? randomUUID(),
      version: this.version,
      metadata: {},
      payload,
    };

    return this.saveEvent(event);
  }

  /**
   * Record agent decision
   */
  async recordDecision(
    agentId: string,
    sessionId: string,
    payload: AgentDecisionEvent["payload"],
    correlationId?: string
  ): Promise<string> {
    const event: AgentDecisionEvent = {
      id: randomUUID(),
      type: "agent.decision",
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId: correlationId ?? randomUUID(),
      version: this.version,
      metadata: {},
      payload,
    };

    return this.saveEvent(event);
  }

  /**
   * Record memory storage
   */
  async recordMemory(
    agentId: string,
    sessionId: string,
    payload: MemoryEvent["payload"],
    correlationId?: string
  ): Promise<string> {
    const event: MemoryEvent = {
      id: randomUUID(),
      type: "memory.stored",
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId: correlationId ?? randomUUID(),
      version: this.version,
      metadata: {},
      payload,
    };

    return this.saveEvent(event);
  }

  /**
   * Record error
   */
  async recordError(
    agentId: string,
    sessionId: string,
    payload: ErrorEvent["payload"],
    correlationId?: string
  ): Promise<string> {
    const event: ErrorEvent = {
      id: randomUUID(),
      type: "error.occurred",
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId: correlationId ?? randomUUID(),
      version: this.version,
      metadata: {},
      payload,
    };

    return this.saveEvent(event);
  }

  /**
   * Record session end
   */
  async recordSessionEnd(
    agentId: string,
    sessionId: string,
    metadata: Record<string, any> = {}
  ): Promise<string> {
    const event: BaseEvent = {
      id: randomUUID(),
      type: "session.end",
      timestamp: new Date().toISOString(),
      sessionId,
      agentId,
      correlationId: randomUUID(),
      version: this.version,
      metadata,
    };

    return this.saveEvent(event);
  }

  // ============================================================================
  // Query Methods (read-only)
  // ============================================================================

  /**
   * Get events by query
   */
  async query(query: EventQuery): Promise<AgentEvent[]> {
    const events = await this.adapter.getEvents({
      agentId: query.agentId,
      eventType: Array.isArray(query.type) ? query.type[0] : query.type,
      startTime: query.startTime ? Date.parse(query.startTime) : undefined,
      endTime: query.endTime ? Date.parse(query.endTime) : undefined,
      limit: query.limit ?? 1000,
    });

    // Filter by additional criteria
    let filtered = events as unknown as AgentEvent[];

    if (query.sessionId) {
      filtered = filtered.filter((e) => e.sessionId === query.sessionId);
    }

    if (query.correlationId) {
      filtered = filtered.filter(
        (e) => e.correlationId === query.correlationId
      );
    }

    if (Array.isArray(query.type) && query.type.length > 1) {
      filtered = filtered.filter((e) => query.type!.includes(e.type));
    }

    return filtered;
  }

  /**
   * Get all events for a session (for replay)
   */
  async getSessionEvents(
    sessionId: string,
    limit: number = 10000
  ): Promise<AgentEvent[]> {
    return this.query({ sessionId, limit });
  }

  /**
   * Get events by correlation ID (related events)
   */
  async getCorrelatedEvents(correlationId: string): Promise<AgentEvent[]> {
    return this.query({ correlationId });
  }

  /**
   * Get events by time range
   */
  async getEventsByTimeRange(
    agentId: string,
    startTime: string,
    endTime: string,
    limit: number = 1000
  ): Promise<AgentEvent[]> {
    return this.query({ agentId, startTime, endTime, limit });
  }

  /**
   * Get cost for a session
   */
  async getSessionCost(sessionId: string): Promise<number> {
    const events = await this.getSessionEvents(sessionId);
    const llmResponses = events.filter(
      (e): e is LLMResponseEvent => e.type === "llm.response"
    );

    return llmResponses.reduce((sum, e) => sum + e.payload.costUsd, 0);
  }

  /**
   * Get statistics for an agent
   */
  async getAgentStats(
    agentId: string,
    startTime?: string,
    endTime?: string
  ): Promise<EventStats> {
    const events = await this.query({
      agentId,
      startTime,
      endTime,
      limit: 100000,
    });

    const eventsByType: Record<EventType, number> = {
      "session.start": 0,
      "session.end": 0,
      "llm.request": 0,
      "llm.response": 0,
      "tool.request": 0,
      "tool.response": 0,
      "agent.decision": 0,
      "memory.stored": 0,
      "error.occurred": 0,
    };

    let totalCost = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    const sessions = new Set<string>();

    for (const event of events) {
      eventsByType[event.type]++;
      sessions.add(event.sessionId);

      if (event.type === "llm.response") {
        const e = event as LLMResponseEvent;
        totalCost += e.payload.costUsd;
        totalLatency += e.payload.latencyMs;
        latencyCount++;
      }
    }

    return {
      totalEvents: events.length,
      eventsByType,
      totalCost,
      avgLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      sessionCount: sessions.size,
    };
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private async saveEvent(event: BaseEvent | AgentEvent): Promise<string> {
    const cost =
      event.type === "llm.response"
        ? (event as LLMResponseEvent).payload.costUsd
        : undefined;

    return this.adapter.saveEvent({
      agentId: event.agentId,
      eventType: event.type,
      timestamp: Date.parse(event.timestamp),
      data: event,
      cost: cost ?? 0,
    });
  }
}
