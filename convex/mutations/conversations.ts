import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Create a new conversation message
 */
export const create = mutation({
  args: {
    agentId: v.id("agents"),
    channel: v.string(),
    sessionId: v.optional(v.string()),
    role: v.string(),
    content: v.string(),
    userId: v.optional(v.string()),
    model: v.optional(v.string()),
    tokensUsed: v.optional(v.number()),
    cost: v.optional(v.number()),
    attachments: v.optional(v.array(v.object({
      type: v.string(),
      url: v.string(),
      name: v.optional(v.string()),
    }))),
    skillsUsed: v.optional(v.array(v.string())),
    responseTime: v.optional(v.number()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const conversationId = await ctx.db.insert("conversations", {
      agentId: args.agentId,
      channel: args.channel,
      sessionId: args.sessionId,
      role: args.role,
      content: args.content,
      timestamp: Date.now(),
      userId: args.userId,
      model: args.model,
      tokensUsed: args.tokensUsed,
      cost: args.cost,
      attachments: args.attachments,
      skillsUsed: args.skillsUsed,
      responseTime: args.responseTime,
      error: args.error,
    });

    return conversationId;
  },
});

/**
 * Delete a conversation message
 */
export const remove = mutation({
  args: {
    id: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    const conversation = await ctx.db.get(args.id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.delete(args.id);

    return { success: true };
  },
});

/**
 * Delete all conversations for a session
 */
export const removeSession = mutation({
  args: {
    agentId: v.id("agents"),
    sessionId: v.string(),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_agent_and_session", (q) =>
        q.eq("agentId", args.agentId).eq("sessionId", args.sessionId)
      )
      .collect();

    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }

    return { success: true, deletedCount: conversations.length };
  },
});

/**
 * Delete all conversations for an agent
 */
export const removeAllForAgent = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const conversations = await ctx.db
      .query("conversations")
      .withIndex("by_agent", (q) => q.eq("agentId", args.agentId))
      .collect();

    for (const conversation of conversations) {
      await ctx.db.delete(conversation._id);
    }

    return { success: true, deletedCount: conversations.length };
  },
});

/**
 * Update a conversation message (for editing)
 */
export const update = mutation({
  args: {
    id: v.id("conversations"),
    content: v.optional(v.string()),
    error: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { id, ...updates } = args;

    const conversation = await ctx.db.get(id);
    if (!conversation) {
      throw new Error("Conversation not found");
    }

    await ctx.db.patch(id, updates);

    return id;
  },
});
