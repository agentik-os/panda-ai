/**
 * Marketplace Reviews Queries
 * Step-071: Design Marketplace Database Schema
 */

import { query } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Get reviews for a specific item (agent or skill)
 */
export const getForItem = query({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Or marketplace_skills (polymorphic)
    limit: v.optional(v.number()),
    sortBy: v.optional(
      v.union(v.literal("newest"), v.literal("helpful"), v.literal("rating")),
    ),
  },
  handler: async (ctx, args) => {
    const { itemType, itemId, limit = 10, sortBy = "newest" } = args;

    // Get all approved reviews for this item
    let reviews = await ctx.db
      .query("marketplace_reviews")
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), itemType),
          q.eq(q.field("itemId"), itemId),
          q.eq(q.field("status"), "approved"),
        ),
      )
      .collect();

    // Sort reviews
    if (sortBy === "newest") {
      reviews.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === "helpful") {
      reviews.sort((a, b) => b.helpfulCount - a.helpfulCount);
    } else if (sortBy === "rating") {
      reviews.sort((a, b) => b.rating - a.rating);
    }

    // Limit results
    return reviews.slice(0, limit);
  },
});

/**
 * Get rating breakdown for an item
 */
export const getRatingBreakdown = query({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
  },
  handler: async (ctx, args) => {
    const { itemType, itemId } = args;

    const reviews = await ctx.db
      .query("marketplace_reviews")
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), itemType),
          q.eq(q.field("itemId"), itemId),
          q.eq(q.field("status"), "approved"),
        ),
      )
      .collect();

    // Count ratings by star level
    const breakdown = {
      5: 0,
      4: 0,
      3: 0,
      2: 0,
      1: 0,
    };

    for (const review of reviews) {
      const rating = Math.floor(review.rating) as 1 | 2 | 3 | 4 | 5;
      breakdown[rating]++;
    }

    const total = reviews.length;
    const average =
      total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    return {
      breakdown,
      total,
      average,
    };
  },
});

/**
 * Check if user has already reviewed an item
 */
export const getUserReview = query({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
    userId: v.string(),
  },
  handler: async (ctx, args) => {
    const { itemType, itemId, userId } = args;

    const review = await ctx.db
      .query("marketplace_reviews")
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), itemType),
          q.eq(q.field("itemId"), itemId),
          q.eq(q.field("userId"), userId),
        ),
      )
      .first();

    return review || null;
  },
});
