/**
 * Agent Memory Mutations
 * Step-073: Store embeddings for semantic search
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Store embedding for a conversation message
 */
export const storeEmbedding = mutation({
  args: {
    messageId: v.id("conversations"),
    embedding: v.array(v.float64()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      embedding: args.embedding,
    });

    return { success: true };
  },
});

/**
 * Clear embedding from a message
 */
export const clearEmbedding = mutation({
  args: {
    messageId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.messageId, {
      embedding: undefined,
    });

    return { success: true };
  },
});

/**
 * Re-index all messages for an agent
 */
export const reindexAgent = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    // Clear all existing embeddings for this agent
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const conv of conversations) {
      await ctx.db.patch(conv._id, {
        embedding: undefined,
      });
    }

    return {
      success: true,
      messagesCleared: conversations.length,
    };
  },
});
