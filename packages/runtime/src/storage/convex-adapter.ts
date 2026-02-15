/**
 * Convex Backend Adapter
 *
 * Provides persistence for agents, conversations, memory, costs, dreams,
 * and time-travel events using Convex as the backend storage.
 *
 * Steps 104-105: Full CRUD operations for all Convex tables.
 * This is the CRITICAL foundation for Phase 3 - Enterprise & Scale.
 * Tasks #92 (Dreams), #94 (Time Travel), #96 (Auth) all depend on this.
 */

import { ConvexHttpClient } from "convex/browser";
import type { Agent } from "@agentik-os/shared";

// ============================================================================
// Types
// ============================================================================

export interface Dream {
  id?: string;
  agentId: string;
  timestamp: number;
  insights: string[];
  stateSnapshot: unknown;
  approved: boolean;
}

export interface TimelineEvent {
  id?: string;
  agentId: string;
  eventType: string;
  timestamp: number;
  data: unknown;
  cost: number;
}

export interface EventFilters {
  agentId?: string;
  eventType?: string;
  startTime?: number;
  endTime?: number;
  limit?: number;
}

export interface AgentFilters {
  status?: string;
  model?: string;
  provider?: string;
  limit?: number;
}

export interface ConversationMessage {
  id?: string;
  agentId: string;
  channel: string;
  sessionId?: string;
  role: string;
  content: string;
  timestamp: number;
  userId?: string;
  model?: string;
  tokensUsed?: number;
  cost?: number;
  attachments?: { type: string; url: string; name?: string }[];
  skillsUsed?: string[];
  responseTime?: number;
  error?: string;
}

export interface ConversationFilters {
  agentId?: string;
  sessionId?: string;
  limit?: number;
}

export interface CostEntry {
  id?: string;
  agentId: string;
  conversationId?: string;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  timestamp: number;
  channel: string;
  endpoint?: string;
  responseTime?: number;
}

export interface CostFilters {
  agentId?: string;
  startDate?: number;
  endDate?: number;
}

export interface CostSummary {
  today: number;
  month: number;
  total: number;
  modelBreakdown: { model: string; cost: number }[];
}

export interface ReplayResult {
  events: TimelineEvent[];
  totalCost: number;
  duration: number;
  startState: unknown;
  endState: unknown;
}

export interface ConvexAdapterConfig {
  url?: string;
  client?: ConvexHttpClient;
}

// ============================================================================
// Adapter
// ============================================================================

export class ConvexAdapter {
  private client: ConvexHttpClient;
  private api: any; // Convex API reference (typed after codegen)

  constructor(config: ConvexAdapterConfig = {}) {
    if (config.client) {
      this.client = config.client;
    } else {
      const url = config.url || process.env.CONVEX_URL || "https://placeholder.convex.cloud";
      if (url === "https://placeholder.convex.cloud") {
        console.warn(
          "[ConvexAdapter] CONVEX_URL not set - using placeholder. Run `npx convex dev` first.",
        );
      }
      this.client = new ConvexHttpClient(url);
    }

    // Dynamic import of API to avoid import errors when _generated doesn't exist
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      this.api = require("../../../../convex/_generated/api").api;
    } catch {
      // Fallback: api will be set dynamically
      this.api = null;
    }
  }

  private ensureApi(): void {
    if (!this.api) throw new Error("Convex API not initialized. Run `npx convex dev` first.");
  }

  // --------------------------------------------------------------------------
  // Agent CRUD
  // --------------------------------------------------------------------------

  async createAgent(agent: Omit<Agent, "id" | "createdAt" | "updatedAt">): Promise<string> {
    this.ensureApi();

    try {
      const agentId = await this.client.mutation(this.api.agents.createAgent, {
        name: agent.name,
        description: agent.description || undefined,
        systemPrompt: agent.systemPrompt,
        model: agent.model,
        provider: agent.model.startsWith("claude")
          ? "anthropic"
          : agent.model.startsWith("gpt")
            ? "openai"
            : agent.model.startsWith("gemini")
              ? "google"
              : "ollama",
        temperature: agent.temperature ?? 0.7,
        maxTokens: agent.maxTokens ?? 4096,
        channels: agent.channels || [],
        skills: agent.skills || [],
      });
      return String(agentId);
    } catch (error) {
      throw new ConvexAdapterError("Failed to create agent", error);
    }
  }

  async getAgent(id: string): Promise<Agent | null> {
    this.ensureApi();

    try {
      const doc = await this.client.query(this.api.agents.getAgentByStringId, { id });
      if (!doc) return null;
      return this.docToAgent(doc);
    } catch (error) {
      throw new ConvexAdapterError(`Failed to get agent: ${id}`, error);
    }
  }

  async listAgents(filters?: AgentFilters): Promise<Agent[]> {
    this.ensureApi();

    try {
      const docs = await this.client.query(this.api.agents.listAgents, {
        status: filters?.status,
        limit: filters?.limit,
        model: filters?.model,
        provider: filters?.provider,
      });
      return docs.map((doc: any) => this.docToAgent(doc));
    } catch (error) {
      throw new ConvexAdapterError("Failed to list agents", error);
    }
  }

  async updateAgent(id: string, updates: Partial<Agent>): Promise<void> {
    this.ensureApi();

    try {
      await this.client.mutation(this.api.agents.updateAgent, {
        id,
        name: updates.name,
        description: updates.description,
        systemPrompt: updates.systemPrompt,
        model: updates.model,
        temperature: updates.temperature,
        maxTokens: updates.maxTokens,
        channels: updates.channels,
        skills: updates.skills,
        status: updates.active !== undefined ? (updates.active ? "active" : "inactive") : undefined,
      });
    } catch (error) {
      throw new ConvexAdapterError(`Failed to update agent: ${id}`, error);
    }
  }

  async deleteAgent(id: string): Promise<void> {
    this.ensureApi();

    try {
      await this.client.mutation(this.api.agents.deleteAgent, { id });
    } catch (error) {
      throw new ConvexAdapterError(`Failed to delete agent: ${id}`, error);
    }
  }

  // --------------------------------------------------------------------------
  // Conversations (Step 105)
  // --------------------------------------------------------------------------

  async createConversation(message: Omit<ConversationMessage, "id" | "timestamp">): Promise<string> {
    this.ensureApi();

    try {
      const convId = await this.client.mutation(this.api.mutations.conversations.create, {
        agentId: message.agentId,
        channel: message.channel,
        sessionId: message.sessionId,
        role: message.role,
        content: message.content,
        userId: message.userId,
        model: message.model,
        tokensUsed: message.tokensUsed,
        cost: message.cost,
        attachments: message.attachments,
        skillsUsed: message.skillsUsed,
        responseTime: message.responseTime,
        error: message.error,
      });
      return String(convId);
    } catch (error) {
      throw new ConvexAdapterError("Failed to create conversation message", error);
    }
  }

  async getConversation(id: string): Promise<ConversationMessage | null> {
    this.ensureApi();

    try {
      const doc = await this.client.query(this.api.queries.conversations.getById, { id });
      if (!doc) return null;
      return this.docToConversation(doc);
    } catch (error) {
      throw new ConvexAdapterError(`Failed to get conversation: ${id}`, error);
    }
  }

  async listConversations(filters: ConversationFilters): Promise<ConversationMessage[]> {
    this.ensureApi();

    try {
      let docs: any[];

      if (filters.agentId && filters.sessionId) {
        docs = await this.client.query(this.api.queries.conversations.listBySession, {
          agentId: filters.agentId,
          sessionId: filters.sessionId,
        });
      } else if (filters.agentId) {
        docs = await this.client.query(this.api.queries.conversations.listByAgent, {
          agentId: filters.agentId,
          limit: filters.limit,
        });
      } else {
        docs = await this.client.query(this.api.queries.memory.recentConversations, {
          limit: filters.limit,
        });
      }

      return docs.map((doc: any) => this.docToConversation(doc));
    } catch (error) {
      throw new ConvexAdapterError("Failed to list conversations", error);
    }
  }

  async deleteConversation(id: string): Promise<void> {
    this.ensureApi();

    try {
      await this.client.mutation(this.api.mutations.conversations.remove, { id });
    } catch (error) {
      throw new ConvexAdapterError(`Failed to delete conversation: ${id}`, error);
    }
  }

  async deleteSession(agentId: string, sessionId: string): Promise<number> {
    this.ensureApi();

    try {
      const result = await this.client.mutation(this.api.mutations.conversations.removeSession, {
        agentId,
        sessionId,
      });
      return result.deletedCount;
    } catch (error) {
      throw new ConvexAdapterError(`Failed to delete session: ${sessionId}`, error);
    }
  }

  // --------------------------------------------------------------------------
  // Memory / Semantic Search (Step 105)
  // --------------------------------------------------------------------------

  async storeEmbedding(messageId: string, embedding: number[]): Promise<void> {
    this.ensureApi();

    try {
      await this.client.mutation(this.api.mutations.memory.storeEmbedding, {
        messageId,
        embedding,
      });
    } catch (error) {
      throw new ConvexAdapterError(`Failed to store embedding: ${messageId}`, error);
    }
  }

  async searchMemory(
    query: string,
    embedding: number[],
    agentId?: string,
    limit?: number,
  ): Promise<ConversationMessage[]> {
    this.ensureApi();

    try {
      const docs = await this.client.query(this.api.queries.memory.search, {
        query,
        embedding,
        agentId,
        limit,
      });
      return docs.map((doc: any) => this.docToConversation(doc));
    } catch (error) {
      throw new ConvexAdapterError("Failed to search memory", error);
    }
  }

  async getMemoryStats(agentId: string): Promise<{
    total: number;
    withEmbeddings: number;
    byRole: Record<string, number>;
    indexingProgress: number;
  }> {
    this.ensureApi();

    try {
      return await this.client.query(this.api.queries.memory.stats, { agentId });
    } catch (error) {
      throw new ConvexAdapterError(`Failed to get memory stats: ${agentId}`, error);
    }
  }

  // --------------------------------------------------------------------------
  // Cost Tracking (Step 105)
  // --------------------------------------------------------------------------

  async trackCost(cost: Omit<CostEntry, "id" | "timestamp">): Promise<string> {
    this.ensureApi();

    try {
      const costId = await this.client.mutation(this.api.mutations.costs.create, {
        agentId: cost.agentId,
        conversationId: cost.conversationId,
        model: cost.model,
        provider: cost.provider,
        inputTokens: cost.inputTokens,
        outputTokens: cost.outputTokens,
        totalTokens: cost.totalTokens,
        inputCost: cost.inputCost,
        outputCost: cost.outputCost,
        totalCost: cost.totalCost,
        channel: cost.channel,
        endpoint: cost.endpoint,
        responseTime: cost.responseTime,
      });
      return String(costId);
    } catch (error) {
      throw new ConvexAdapterError("Failed to track cost", error);
    }
  }

  async getCostSummary(): Promise<CostSummary> {
    this.ensureApi();

    try {
      return await this.client.query(this.api.queries.costs.summary, {});
    } catch (error) {
      throw new ConvexAdapterError("Failed to get cost summary", error);
    }
  }

  async getCostsByAgent(filters?: CostFilters): Promise<{
    agentId: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
  }[]> {
    this.ensureApi();

    try {
      return await this.client.query(this.api.queries.costs.byAgent, {
        agentId: filters?.agentId,
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });
    } catch (error) {
      throw new ConvexAdapterError("Failed to get costs by agent", error);
    }
  }

  async getCostsByModel(filters?: Omit<CostFilters, "agentId">): Promise<{
    model: string;
    provider: string;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
    avgCostPerRequest: number;
  }[]> {
    this.ensureApi();

    try {
      return await this.client.query(this.api.queries.costs.byModel, {
        startDate: filters?.startDate,
        endDate: filters?.endDate,
      });
    } catch (error) {
      throw new ConvexAdapterError("Failed to get costs by model", error);
    }
  }

  async getCostHistory(
    agentId?: string,
    granularity?: "hour" | "day" | "week" | "month",
    startDate?: number,
    endDate?: number,
  ): Promise<{
    timestamp: number;
    totalCost: number;
    totalTokens: number;
    requestCount: number;
  }[]> {
    this.ensureApi();

    try {
      return await this.client.query(this.api.queries.costs.history, {
        agentId,
        granularity,
        startDate,
        endDate,
      });
    } catch (error) {
      throw new ConvexAdapterError("Failed to get cost history", error);
    }
  }

  // --------------------------------------------------------------------------
  // Dreams (needed by Task #92)
  // --------------------------------------------------------------------------

  async saveDream(agentId: string, dream: Omit<Dream, "id" | "agentId">): Promise<string> {
    this.ensureApi();

    try {
      const dreamId = await this.client.mutation(this.api.agents.saveDream, {
        agentId,
        timestamp: dream.timestamp,
        insights: dream.insights,
        stateSnapshot: dream.stateSnapshot ?? null,
        approved: dream.approved,
      });
      return String(dreamId);
    } catch (error) {
      throw new ConvexAdapterError(`Failed to save dream for agent: ${agentId}`, error);
    }
  }

  async getDreams(agentId: string, limit: number = 50): Promise<Dream[]> {
    this.ensureApi();

    try {
      const docs = await this.client.query(this.api.agents.getDreams, {
        agentId,
        limit,
      });
      return docs.map((doc: any) => ({
        id: String(doc._id),
        agentId: doc.agentId,
        timestamp: doc.timestamp,
        insights: doc.insights,
        stateSnapshot: doc.stateSnapshot,
        approved: doc.approved,
      }));
    } catch (error) {
      throw new ConvexAdapterError(`Failed to get dreams for agent: ${agentId}`, error);
    }
  }

  // --------------------------------------------------------------------------
  // Time Travel Events (needed by Task #94)
  // --------------------------------------------------------------------------

  async saveEvent(event: Omit<TimelineEvent, "id">): Promise<string> {
    this.ensureApi();

    try {
      const eventId = await this.client.mutation(this.api.agents.saveTimelineEvent, {
        agentId: event.agentId,
        eventType: event.eventType,
        timestamp: event.timestamp,
        data: event.data ?? null,
        cost: event.cost,
      });
      return String(eventId);
    } catch (error) {
      throw new ConvexAdapterError("Failed to save timeline event", error);
    }
  }

  async getEvents(filters: EventFilters): Promise<TimelineEvent[]> {
    this.ensureApi();

    try {
      const docs = await this.client.query(this.api.agents.getTimelineEvents, {
        agentId: filters.agentId,
        eventType: filters.eventType,
        startTime: filters.startTime,
        endTime: filters.endTime,
        limit: filters.limit,
      });
      return docs.map((doc: any) => ({
        id: String(doc._id),
        agentId: doc.agentId,
        eventType: doc.eventType,
        timestamp: doc.timestamp,
        data: doc.data,
        cost: doc.cost,
      }));
    } catch (error) {
      throw new ConvexAdapterError("Failed to get timeline events", error);
    }
  }

  async replayFromEvent(eventId: string): Promise<ReplayResult> {
    this.ensureApi();

    try {
      // Get the anchor event
      const anchorEvent = await this.client.query(this.api.agents.getTimelineEvent, {
        id: eventId,
      });

      if (!anchorEvent) {
        throw new Error(`Timeline event not found: ${eventId}`);
      }

      // Get all events from this point forward for the same agent
      const events = await this.client.query(this.api.agents.getTimelineEvents, {
        agentId: anchorEvent.agentId,
        startTime: anchorEvent.timestamp,
      });

      const totalCost = events.reduce((sum: number, e: any) => sum + (e.cost || 0), 0);
      const timestamps = events.map((e: any) => e.timestamp);
      const duration =
        timestamps.length > 1 ? Math.max(...timestamps) - Math.min(...timestamps) : 0;

      return {
        events: events.map((doc: any) => ({
          id: String(doc._id),
          agentId: doc.agentId,
          eventType: doc.eventType,
          timestamp: doc.timestamp,
          data: doc.data,
          cost: doc.cost,
        })),
        totalCost,
        duration,
        startState: anchorEvent.data,
        endState: events.length > 0 ? events[events.length - 1].data : anchorEvent.data,
      };
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        throw error;
      }
      throw new ConvexAdapterError(`Failed to replay from event: ${eventId}`, error);
    }
  }

  // --------------------------------------------------------------------------
  // Helpers
  // --------------------------------------------------------------------------

  private docToAgent(doc: any): Agent {
    return {
      id: String(doc._id),
      name: doc.name,
      description: doc.description || "",
      systemPrompt: doc.systemPrompt,
      model: doc.model,
      temperature: doc.temperature ?? 0.7,
      maxTokens: doc.maxTokens ?? 4096,
      active: doc.status === "active",
      channels: doc.channels || [],
      skills: doc.skills || [],
      createdAt: new Date(doc.createdAt),
      updatedAt: new Date(doc.updatedAt),
    };
  }

  private docToConversation(doc: any): ConversationMessage {
    return {
      id: String(doc._id),
      agentId: String(doc.agentId),
      channel: doc.channel,
      sessionId: doc.sessionId,
      role: doc.role,
      content: doc.content,
      timestamp: doc.timestamp,
      userId: doc.userId,
      model: doc.model,
      tokensUsed: doc.tokensUsed,
      cost: doc.cost,
      attachments: doc.attachments,
      skillsUsed: doc.skillsUsed,
      responseTime: doc.responseTime,
      error: doc.error,
    };
  }
}

// ============================================================================
// Error
// ============================================================================

export class ConvexAdapterError extends Error {
  public readonly cause: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = "ConvexAdapterError";
    this.cause = cause;
  }
}
