import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Track a new cost entry
 */
export const create = mutation({
  args: {
    agentId: v.id("agents"),
    conversationId: v.optional(v.id("conversations")),
    model: v.string(),
    provider: v.string(),
    inputTokens: v.number(),
    outputTokens: v.number(),
    totalTokens: v.number(),
    inputCost: v.number(),
    outputCost: v.number(),
    totalCost: v.number(),
    channel: v.string(),
    endpoint: v.optional(v.string()),
    responseTime: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const costId = await ctx.db.insert("costs", {
      agentId: args.agentId,
      conversationId: args.conversationId,
      model: args.model,
      provider: args.provider,
      inputTokens: args.inputTokens,
      outputTokens: args.outputTokens,
      totalTokens: args.totalTokens,
      inputCost: args.inputCost,
      outputCost: args.outputCost,
      totalCost: args.totalCost,
      timestamp: Date.now(),
      channel: args.channel,
      endpoint: args.endpoint,
      responseTime: args.responseTime,
    });

    return costId;
  },
});

/**
 * Delete cost entries older than a certain date
 */
export const cleanup = mutation({
  args: {
    olderThan: v.number(), // Timestamp
  },
  handler: async (ctx, args) => {
    const oldCosts = await ctx.db
      .query("costs")
      .withIndex("by_timestamp")
      .filter((q) => q.lt(q.field("timestamp"), args.olderThan))
      .collect();

    for (const cost of oldCosts) {
      await ctx.db.delete(cost._id);
    }

    return { success: true, deletedCount: oldCosts.length };
  },
});

/**
 * Delete all cost entries for an agent
 */
export const removeForAgent = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const costs = await ctx.db
      .query("costs")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const cost of costs) {
      await ctx.db.delete(cost._id);
    }

    return { success: true, deletedCount: costs.length };
  },
});
