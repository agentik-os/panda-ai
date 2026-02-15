/**
 * Marketplace Agents Queries
 * Step-071: Design Marketplace Database Schema
 */

import { query } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Browse published agents in the marketplace
 */
export const browse = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("popular"),
        v.literal("newest"),
        v.literal("topRated"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { category, search, sortBy = "popular", limit = 20 } = args;

    // Build query
    let agents = ctx.db.query("marketplace_agents");

    // Filter by status (only published)
    agents = agents.filter((q) => q.eq(q.field("status"), "published"));

    // Filter by category if specified
    if (category) {
      agents = agents.filter((q) => q.eq(q.field("category"), category));
    }

    // Execute query
    let results = await agents.collect();

    // Filter by search term if specified
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower) ||
          agent.tagline.toLowerCase().includes(searchLower) ||
          agent.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    // Sort results
    if (sortBy === "popular") {
      results.sort((a, b) => b.installCount - a.installCount);
    } else if (sortBy === "newest") {
      results.sort((a, b) => (b.publishedAt || 0) - (a.publishedAt || 0));
    } else if (sortBy === "topRated") {
      results.sort((a, b) => b.averageRating - a.averageRating);
    }

    // Limit results
    return results.slice(0, limit);
  },
});

/**
 * Get detailed information about a specific marketplace agent
 */
export const getById = query({
  args: {
    agentId: v.id("marketplace_agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);

    if (!agent) {
      throw new Error("Agent not found");
    }

    // Only return published agents to public
    if (agent.status !== "published") {
      throw new Error("Agent not available");
    }

    return agent;
  },
});

/**
 * Get categories and their counts
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("marketplace_agents")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Count agents per category
    const categoryCounts: Record<string, number> = {};

    for (const agent of agents) {
      categoryCounts[agent.category] = (categoryCounts[agent.category] || 0) + 1;
    }

    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));
  },
});

/**
 * Get popular/featured agents for homepage
 */
export const getFeatured = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;

    const agents = await ctx.db
      .query("marketplace_agents")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Sort by combination of rating and install count
    const scored = agents.map((agent) => ({
      ...agent,
      score: agent.averageRating * agent.installCount,
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((agent) => {
      const { score, ...rest } = agent;
      return rest;
    });
  },
});
