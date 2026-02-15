import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * List all agents with optional filtering
 */
export const list = query({
  args: {
    status: v.optional(v.string()), // Filter by status: "active", "inactive", "paused"
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("agents");

    // Filter by status if provided
    if (args.status) {
      query = query.withIndex("by_status", (q) => q.eq("status", args.status));
    } else {
      // Default: order by most recently active
      query = query.withIndex("by_last_active");
    }

    // Apply limit
    const agents = await query
      .order("desc")
      .take(args.limit ?? 100);

    return agents;
  },
});

/**
 * Get a single agent by ID
 */
export const get = query({
  args: {
    id: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.id);
    return agent;
  },
});

/**
 * Get agent statistics
 * - If `id` provided: returns stats for that specific agent
 * - If no `id`: returns global stats for all agents
 */
export const stats = query({
  args: {
    id: v.optional(v.id("agents")),
  },
  handler: async (ctx, args) => {
    // If ID provided, return agent-specific stats
    if (args.id) {
      const agent = await ctx.db.get(args.id);
      if (!agent) {
        throw new Error("Agent not found");
      }

      // Count conversations for this agent
      const conversations = await ctx.db
        .query("conversations")
        .withIndex("by_agent", (q) => q.eq("agentId", args.id!))
        .collect();

      // Get total cost
      const costs = await ctx.db
        .query("costs")
        .withIndex("by_agent", (q) => q.eq("agentId", args.id!))
        .collect();

      const totalCost = costs.reduce((sum, cost) => sum + cost.totalCost, 0);
      const totalTokens = costs.reduce((sum, cost) => sum + cost.totalTokens, 0);

      return {
        messageCount: conversations.length,
        totalCost,
        totalTokens,
        avgCostPerMessage: conversations.length > 0 ? totalCost / conversations.length : 0,
        activeAgents: 0, // Not applicable for single agent
        totalAgents: 0, // Not applicable for single agent
        totalMessages: 0, // Not applicable for single agent
        totalConversations: 0, // Not applicable for single agent
      };
    }

    // No ID provided - return global stats
    const allAgents = await ctx.db.query("agents").collect();
    const activeAgents = allAgents.filter((a) => a.status === "active").length;
    const allConversations = await ctx.db.query("conversations").collect();
    const allCosts = await ctx.db.query("costs").collect();

    const totalCost = allCosts.reduce((sum, cost) => sum + cost.totalCost, 0);
    const totalTokens = allCosts.reduce((sum, cost) => sum + cost.totalTokens, 0);

    return {
      messageCount: allConversations.length,
      totalCost,
      totalTokens,
      avgCostPerMessage: allConversations.length > 0 ? totalCost / allConversations.length : 0,
      activeAgents,
      totalAgents: allAgents.length,
      totalMessages: allConversations.length,
      totalConversations: allConversations.length,
    };
  },
});

/**
 * Search agents by name or description
 */
export const search = query({
  args: {
    query: v.string(),
  },
  handler: async (ctx, args) => {
    const allAgents = await ctx.db.query("agents").collect();

    const searchQuery = args.query.toLowerCase();
    const filtered = allAgents.filter(
      (agent) =>
        agent.name.toLowerCase().includes(searchQuery) ||
        (agent.description && agent.description.toLowerCase().includes(searchQuery))
    );

    return filtered;
  },
});
