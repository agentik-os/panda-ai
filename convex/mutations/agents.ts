import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new agent
 */
export const create = mutation({
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
    });

    return agentId;
  },
});

/**
 * Update an existing agent
 */
export const update = mutation({
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
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    // Get existing agent
    const agent = await ctx.db.get(id);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Update with new values
    await ctx.db.patch(id, {
      ...updates,
      updatedAt: Date.now(),
    });

    return id;
  },
});

/**
 * Delete an agent
 */
export const remove = mutation({
  args: {
    id: v.id("agents"),
  },
  handler: async (ctx, args) => {
    // Check if agent exists
    const agent = await ctx.db.get(args.id);
    if (!agent) {
      throw new Error("Agent not found");
    }

    // Delete the agent
    await ctx.db.delete(args.id);

    // Note: Conversations and costs are kept for historical records
    // They can be cleaned up separately if needed

    return { success: true };
  },
});

/**
 * Update agent activity timestamp
 */
export const updateActivity = mutation({
  args: {
    id: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(args.id, {
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

/**
 * Increment agent message count and cost
 */
export const updateStats = mutation({
  args: {
    id: v.id("agents"),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(args.id, {
      messageCount: (agent.messageCount ?? 0) + 1,
      totalCost: (agent.totalCost ?? 0) + args.cost,
      lastActiveAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});
