/**
 * Agent Memory Search Queries
 * Step-073: Semantic search across agent conversation history
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Search agent memories using semantic vector search
 */
export const search = query({
  args: {
    query: v.string(),
    embedding: v.array(v.float64()), // Pre-computed embedding from client
    agentId: v.optional(v.id("agents")),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 20;

    // Build filter for vector search
    const filter = (q: any) => {
      let query = q;

      // Filter by agent if specified
      if (args.agentId) {
        query = query.eq("agentId", args.agentId);
      }

      // Filter by date range if specified
      if (args.startDate) {
        query = query.gte("timestamp", args.startDate);
      }
      if (args.endDate) {
        query = query.lte("timestamp", args.endDate);
      }

      return query;
    };

    // Perform vector search
    const results = await ctx.db
      .query("conversations")
      .withIndex("by_embedding", (q) =>
        filter(q).nearestVector("embedding", args.embedding, limit)
      )
      .collect();

    // Enrich results with agent info
    const enriched = await Promise.all(
      results.map(async (conv) => {
        const agent = await ctx.db.get(conv.agentId);
        return {
          ...conv,
          agentName: agent?.name ?? "Unknown Agent",
          score: 0, // Convex doesn't return similarity score yet
        };
      })
    );

    return enriched;
  },
});

/**
 * Get conversation context around a specific message
 */
export const getContext = query({
  args: {
    messageId: v.id("conversations"),
    contextSize: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const contextSize = args.contextSize ?? 5;

    // Get the target message
    const message = await ctx.db.get(args.messageId);
    if (!message) {
      return null;
    }

    // Get surrounding messages in the same session
    const context = await ctx.db
      .query("conversations")
      .withIndex("by_agent_and_session", (q) =>
        q
          .eq("agentId", message.agentId)
          .eq("sessionId", message.sessionId ?? "")
      )
      .filter((q) => {
        const timeDiff = Math.abs(q.field("timestamp") - message.timestamp);
        return timeDiff <= 60 * 60 * 1000; // 1 hour window
      })
      .order("asc")
      .take(contextSize * 2 + 1);

    return {
      message,
      context,
      agent: await ctx.db.get(message.agentId),
    };
  },
});

/**
 * Get recent conversations for an agent
 */
export const recentConversations = query({
  args: {
    agentId: v.optional(v.id("agents")),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    let query = ctx.db.query("conversations");

    if (args.agentId) {
      query = query.withIndex("by_agent", (q) => q.eq("agentId", args.agentId));
    } else {
      query = query.withIndex("by_timestamp");
    }

    const conversations = await query
      .order("desc")
      .take(limit);

    // Enrich with agent info
    const enriched = await Promise.all(
      conversations.map(async (conv) => {
        const agent = await ctx.db.get(conv.agentId);
        return {
          ...conv,
          agentName: agent?.name ?? "Unknown Agent",
        };
      })
    );

    return enriched;
  },
});

/**
 * Get memory statistics for an agent
 */
export const stats = query({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    const total = conversations.length;
    const withEmbeddings = conversations.filter((c) => c.embedding).length;
    const byRole = conversations.reduce(
      (acc, c) => {
        acc[c.role] = (acc[c.role] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    const oldestMessage = conversations.length > 0
      ? Math.min(...conversations.map((c) => c.timestamp))
      : null;
    const newestMessage = conversations.length > 0
      ? Math.max(...conversations.map((c) => c.timestamp))
      : null;

    return {
      total,
      withEmbeddings,
      byRole,
      oldestMessage,
      newestMessage,
      indexingProgress: total > 0 ? (withEmbeddings / total) * 100 : 0,
    };
  },
});
