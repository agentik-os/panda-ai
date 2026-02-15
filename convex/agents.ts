import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// ============================================================================
// AGENT QUERIES
// ============================================================================

export const getAgent = query({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const getAgentByStringId = query({
  args: { id: v.string() },
  handler: async (ctx, args) => {
    const agents = await ctx.db
      .query("agents")
      .collect();
    return agents.find((a) => a._id === args.id) ?? null;
  },
});

export const listAgents = query({
  args: {
    status: v.optional(v.string()),
    limit: v.optional(v.number()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("agents");

    if (args.status) {
      q = q.withIndex("by_status", (idx) => idx.eq("status", args.status!));
    }

    const agents = await q.order("desc").take(args.limit ?? 100);

    // Apply in-memory filters for model/provider
    let filtered = agents;
    if (args.model) {
      filtered = filtered.filter((a) => a.model === args.model);
    }
    if (args.provider) {
      filtered = filtered.filter((a) => a.provider === args.provider);
    }

    return filtered;
  },
});

// ============================================================================
// AGENT MUTATIONS
// ============================================================================

export const createAgent = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    systemPrompt: v.string(),
    model: v.string(),
    provider: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    channels: v.array(v.string()),
    skills: v.array(v.string()),
    memoryEnabled: v.optional(v.boolean()),
    contextWindow: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    mode: v.optional(
      v.union(
        v.literal("focus"),
        v.literal("creative"),
        v.literal("research"),
        v.literal("balanced"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const agentId = await ctx.db.insert("agents", {
      name: args.name,
      description: args.description,
      systemPrompt: args.systemPrompt,
      model: args.model,
      provider: args.provider,
      temperature: args.temperature ?? 0.7,
      maxTokens: args.maxTokens ?? 4096,
      channels: args.channels,
      skills: args.skills,
      status: "active",
      createdAt: now,
      updatedAt: now,
      messageCount: 0,
      totalCost: 0,
      memoryEnabled: args.memoryEnabled,
      contextWindow: args.contextWindow,
      tags: args.tags,
      mode: args.mode,
    });
    return agentId;
  },
});

export const updateAgent = mutation({
  args: {
    id: v.id("agents"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    systemPrompt: v.optional(v.string()),
    model: v.optional(v.string()),
    provider: v.optional(v.string()),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    channels: v.optional(v.array(v.string())),
    skills: v.optional(v.array(v.string())),
    status: v.optional(v.string()),
    memoryEnabled: v.optional(v.boolean()),
    contextWindow: v.optional(v.number()),
    tags: v.optional(v.array(v.string())),
    mode: v.optional(
      v.union(
        v.literal("focus"),
        v.literal("creative"),
        v.literal("research"),
        v.literal("balanced"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;
    const agent = await ctx.db.get(id);
    if (!agent) {
      throw new Error(`Agent not found: ${id}`);
    }

    // Filter out undefined values
    const cleanUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined) {
        cleanUpdates[key] = value;
      }
    }
    cleanUpdates.updatedAt = Date.now();

    await ctx.db.patch(id, cleanUpdates);
    return id;
  },
});

export const deleteAgent = mutation({
  args: { id: v.id("agents") },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) {
      throw new Error(`Agent not found: ${args.id}`);
    }
    await ctx.db.delete(args.id);
    return { success: true };
  },
});

// ============================================================================
// DREAMS QUERIES & MUTATIONS
// ============================================================================

export const getDreams = query({
  args: {
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const dreams = await ctx.db
      .query("dreams")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(args.limit ?? 50);
    return dreams;
  },
});

export const saveDream = mutation({
  args: {
    agentId: v.string(),
    timestamp: v.number(),
    insights: v.array(v.string()),
    stateSnapshot: v.any(),
    approved: v.boolean(),
  },
  handler: async (ctx, args) => {
    const dreamId = await ctx.db.insert("dreams", {
      agentId: args.agentId,
      timestamp: args.timestamp,
      insights: args.insights,
      stateSnapshot: args.stateSnapshot,
      approved: args.approved,
    });
    return dreamId;
  },
});

// ============================================================================
// TIMELINE EVENTS QUERIES & MUTATIONS
// ============================================================================

export const getTimelineEvents = query({
  args: {
    agentId: v.optional(v.string()),
    eventType: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let q = ctx.db.query("timelineEvents");

    if (args.agentId) {
      q = q.withIndex("by_agent_time", (idx) => {
        let chain = idx.eq("agentId", args.agentId!);
        if (args.startTime !== undefined) {
          chain = chain.gte("timestamp", args.startTime);
        }
        if (args.endTime !== undefined) {
          chain = chain.lte("timestamp", args.endTime);
        }
        return chain;
      });
    }

    let events = await q.order("desc").take(args.limit ?? 100);

    if (args.eventType) {
      events = events.filter((e) => e.eventType === args.eventType);
    }

    return events;
  },
});

export const saveTimelineEvent = mutation({
  args: {
    agentId: v.string(),
    eventType: v.string(),
    timestamp: v.number(),
    data: v.any(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("timelineEvents", {
      agentId: args.agentId,
      eventType: args.eventType,
      timestamp: args.timestamp,
      data: args.data,
      cost: args.cost,
    });
    return eventId;
  },
});

export const getTimelineEvent = query({
  args: { id: v.id("timelineEvents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});
