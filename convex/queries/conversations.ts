/**
 * Conversation Queries
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get a conversation message by ID
 */
export const getById = query({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get conversations for an agent
 */
export const listByAgent = query({
  args: {
    agentId: v.id("agents"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 50;

    return await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .order("desc")
      .take(limit);
  },
});

/**
 * Get conversations by session
 */
export const listBySession = query({
  args: {
    agentId: v.id("agents"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("conversations")
      .withIndex("by_agent_and_session", (q) =>
        q.eq("agentId", args.agentId).eq("sessionId", args.sessionId)
      )
      .order("asc")
      .collect();
  },
});

/**
 * List all sessions for an agent (returns unique session IDs with metadata)
 */
export const listSessions = query({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    // Get all conversations for this agent
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    // Group by sessionId and extract session metadata
    const sessionMap = new Map<
      string,
      {
        sessionId: string;
        messageCount: number;
        lastMessage: number;
        channel: string;
      }
    >();

    for (const conv of conversations) {
      const sessionId = conv.sessionId ?? "default";
      const existing = sessionMap.get(sessionId);
      const timestamp = conv.timestamp ?? conv._creationTime;

      if (!existing) {
        sessionMap.set(sessionId, {
          sessionId,
          messageCount: 1,
          lastMessage: timestamp,
          channel: conv.channel,
        });
      } else {
        existing.messageCount++;
        existing.lastMessage = Math.max(existing.lastMessage, timestamp);
      }
    }

    // Convert to array and sort by most recent activity
    return Array.from(sessionMap.values()).sort(
      (a, b) => b.lastMessage - a.lastMessage
    );
  },
});
