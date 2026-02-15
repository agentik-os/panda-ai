/**
 * Agent Dreams - Convex Functions
 *
 * Phase 3: Nightly processing, memory consolidation, morning insights.
 * Used by ConvexAdapter.saveDream() and ConvexAdapter.getDreams().
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save a dream for an agent
 */
export const save = mutation({
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

/**
 * Get dreams for an agent
 */
export const list = query({
  args: {
    agentId: v.string(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("dreams")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get a single dream by ID
 */
export const get = query({
  args: {
    id: v.id("dreams"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Approve a dream (after human review)
 */
export const approve = mutation({
  args: {
    id: v.id("dreams"),
  },
  handler: async (ctx, args) => {
    const dream = await ctx.db.get(args.id);
    if (!dream) {
      throw new Error("Dream not found");
    }

    await ctx.db.patch(args.id, { approved: true });
    return { success: true };
  },
});

/**
 * Delete old dreams for an agent
 */
export const cleanup = mutation({
  args: {
    agentId: v.string(),
    olderThan: v.number(), // Timestamp
  },
  handler: async (ctx, args) => {
    const oldDreams = await ctx.db
      .query("dreams")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .filter((q) => q.lt(q.field("timestamp"), args.olderThan))
      .collect();

    for (const dream of oldDreams) {
      await ctx.db.delete(dream._id);
    }

    return { success: true, deletedCount: oldDreams.length };
  },
});
