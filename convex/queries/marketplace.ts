/**
 * Marketplace Queries
 *
 * Convex queries for fetching marketplace data (agents, skills, ratings, reviews, purchases)
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * List published agents in marketplace
 *
 * @param filters - Optional filters (category, search, sort)
 * @returns List of published agents with stats
 */
export const listAgents = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("popular"),
        v.literal("recent"),
        v.literal("rating"),
        v.literal("installs"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let agents = await ctx.db
      .query("marketplace_agents")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Filter by category
    if (args.category) {
      agents = agents.filter((agent) => agent.category === args.category);
    }

    // Filter by search
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      agents = agents.filter(
        (agent) =>
          agent.name.toLowerCase().includes(searchLower) ||
          agent.description.toLowerCase().includes(searchLower) ||
          agent.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    // Sort
    if (args.sortBy === "popular" || args.sortBy === "installs") {
      agents.sort((a, b) => b.installCount - a.installCount);
    } else if (args.sortBy === "rating") {
      agents.sort((a, b) => b.averageRating - a.averageRating);
    } else if (args.sortBy === "recent") {
      agents.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    }

    // Limit
    if (args.limit) {
      agents = agents.slice(0, args.limit);
    }

    return agents;
  },
});

/**
 * Get agent details by ID
 */
export const getAgent = query({
  args: { id: v.id("marketplace_agents") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * List published skills in marketplace
 */
export const listSkills = query({
  args: {
    category: v.optional(v.string()),
    search: v.optional(v.string()),
    sortBy: v.optional(
      v.union(
        v.literal("popular"),
        v.literal("recent"),
        v.literal("rating"),
        v.literal("installs"),
      ),
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let skills = await ctx.db
      .query("marketplace_skills")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Filter by category
    if (args.category) {
      skills = skills.filter((skill) => skill.category === args.category);
    }

    // Filter by search
    if (args.search) {
      const searchLower = args.search.toLowerCase();
      skills = skills.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchLower) ||
          skill.description.toLowerCase().includes(searchLower) ||
          skill.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
      );
    }

    // Sort
    if (args.sortBy === "popular" || args.sortBy === "installs") {
      skills.sort((a, b) => b.installCount - a.installCount);
    } else if (args.sortBy === "rating") {
      skills.sort((a, b) => b.averageRating - a.averageRating);
    } else if (args.sortBy === "recent") {
      skills.sort((a, b) => (b.publishedAt ?? 0) - (a.publishedAt ?? 0));
    }

    // Limit
    if (args.limit) {
      skills = skills.slice(0, args.limit);
    }

    return skills;
  },
});

/**
 * Get skill details by ID
 */
export const getSkill = query({
  args: { id: v.id("marketplace_skills") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get reviews for an item (agent or skill)
 */
export const getReviews = query({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Also works for skills
    limit: v.optional(v.number()),
    sortBy: v.optional(
      v.union(v.literal("recent"), v.literal("helpful"), v.literal("rating")),
    ),
  },
  handler: async (ctx, args) => {
    let reviews = await ctx.db
      .query("marketplace_reviews")
      .withIndex("by_item", (q) =>
        q.eq("itemType", args.itemType).eq("itemId", args.itemId),
      )
      .filter((q) => q.eq(q.field("status"), "approved"))
      .collect();

    // Sort
    if (args.sortBy === "helpful") {
      reviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
    } else if (args.sortBy === "rating") {
      reviews.sort((a, b) => b.rating - a.rating);
    } else {
      // Default: recent
      reviews.sort((a, b) => b.createdAt - a.createdAt);
    }

    // Limit
    if (args.limit) {
      reviews = reviews.slice(0, args.limit);
    }

    return reviews;
  },
});

/**
 * Check if user has purchased/installed an item
 */
export const hasPurchased = query({
  args: {
    userId: v.string(),
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db
      .query("marketplace_purchases")
      .withIndex("by_user_and_item", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.itemId),
      )
      .first();

    return purchase !== null;
  },
});

/**
 * Get user's purchases
 */
export const getUserPurchases = query({
  args: {
    userId: v.string(),
    itemType: v.optional(v.union(v.literal("agent"), v.literal("skill"))),
  },
  handler: async (ctx, args) => {
    let purchases = await ctx.db
      .query("marketplace_purchases")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .collect();

    // Filter by item type if provided
    if (args.itemType) {
      purchases = purchases.filter((p) => p.itemType === args.itemType);
    }

    return purchases;
  },
});

/**
 * Get publisher's published items
 */
export const getPublisherItems = query({
  args: {
    publisherId: v.string(),
    itemType: v.optional(v.union(v.literal("agent"), v.literal("skill"))),
  },
  handler: async (ctx, args) => {
    if (!args.itemType || args.itemType === "agent") {
      const agents = await ctx.db
        .query("marketplace_agents")
        .withIndex("by_publisher", (q) => q.eq("publisherId", args.publisherId))
        .collect();

      if (args.itemType === "agent") {
        return { agents, skills: [] };
      }

      const skills = await ctx.db
        .query("marketplace_skills")
        .withIndex("by_publisher", (q) => q.eq("publisherId", args.publisherId))
        .collect();

      return { agents, skills };
    } else {
      const skills = await ctx.db
        .query("marketplace_skills")
        .withIndex("by_publisher", (q) => q.eq("publisherId", args.publisherId))
        .collect();

      return { agents: [], skills };
    }
  },
});

/**
 * Get publisher payouts
 */
export const getPublisherPayouts = query({
  args: {
    publisherId: v.string(),
    status: v.optional(
      v.union(
        v.literal("pending"),
        v.literal("processing"),
        v.literal("paid"),
        v.literal("failed"),
        v.literal("on-hold"),
      ),
    ),
  },
  handler: async (ctx, args) => {
    let payouts = await ctx.db
      .query("marketplace_payouts")
      .withIndex("by_publisher", (q) => q.eq("publisherId", args.publisherId))
      .collect();

    // Filter by status
    if (args.status) {
      payouts = payouts.filter((p) => p.status === args.status);
    }

    // Sort by created date (newest first)
    payouts.sort((a, b) => b.createdAt - a.createdAt);

    return payouts;
  },
});

/**
 * Get marketplace stats (for admin dashboard)
 */
export const getMarketplaceStats = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db
      .query("marketplace_agents")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const skills = await ctx.db
      .query("marketplace_skills")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    const purchases = await ctx.db.query("marketplace_purchases").collect();

    const totalRevenue = purchases.reduce((sum, p) => sum + p.pricePaid, 0);
    const platformFee = totalRevenue * 0.3;
    const creatorPayouts = totalRevenue * 0.7;

    return {
      totalAgents: agents.length,
      totalSkills: skills.length,
      totalInstalls: purchases.length,
      totalRevenue,
      platformFee,
      creatorPayouts,
      avgAgentRating:
        agents.reduce((sum, a) => sum + a.averageRating, 0) / agents.length ||
        0,
      avgSkillRating:
        skills.reduce((sum, s) => sum + s.averageRating, 0) / skills.length ||
        0,
    };
  },
});
