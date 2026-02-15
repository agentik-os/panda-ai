/**
 * Marketplace Reviews Mutations
 * Step-071: Design Marketplace Database Schema
 */

import { mutation } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Submit a review for an agent or skill
 */
export const submit = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Or marketplace_skills (polymorphic)
    userId: v.string(),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    rating: v.number(),
    title: v.string(),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const { itemType, itemId, userId, userName, userAvatar, rating, title, content } = args;

    // Validate rating
    if (rating < 1 || rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if user already reviewed this item
    const existing = await ctx.db
      .query("marketplace_reviews")
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), itemType),
          q.eq(q.field("itemId"), itemId),
          q.eq(q.field("userId"), userId),
        ),
      )
      .first();

    if (existing) {
      throw new Error("You have already reviewed this item");
    }

    // Check if user purchased this item
    const purchase = await ctx.db
      .query("marketplace_purchases")
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), itemType),
          q.eq(q.field("itemId"), itemId),
          q.eq(q.field("userId"), userId),
        ),
      )
      .first();

    const isVerifiedPurchase = !!purchase;

    // Create review
    const reviewId = await ctx.db.insert("marketplace_reviews", {
      itemType,
      itemId,
      userId,
      userName,
      userAvatar,
      rating,
      title,
      content,
      helpfulCount: 0,
      notHelpfulCount: 0,
      isVerifiedPurchase,
      status: "pending", // Needs moderation
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create rating entry
    await ctx.db.insert("marketplace_ratings", {
      itemType,
      itemId,
      userId,
      rating,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return reviewId;
  },
});

/**
 * Mark a review as helpful
 */
export const markHelpful = mutation({
  args: {
    reviewId: v.id("marketplace_reviews"),
    helpful: v.boolean(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error("Review not found");
    }

    if (args.helpful) {
      await ctx.db.patch(args.reviewId, {
        helpfulCount: review.helpfulCount + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(args.reviewId, {
        notHelpfulCount: review.notHelpfulCount + 1,
        updatedAt: Date.now(),
      });
    }
  },
});

/**
 * Update review rating (recalculate average)
 */
export const updateItemRating = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
  },
  handler: async (ctx, args) => {
    const { itemType, itemId } = args;

    // Get all approved reviews
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

    const total = reviews.length;
    const average =
      total > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / total
        : 0;

    // Update item with new rating
    await ctx.db.patch(itemId, {
      averageRating: Math.round(average * 10) / 10, // Round to 1 decimal
      ratingCount: total,
      reviewCount: total,
      updatedAt: Date.now(),
    });
  },
});
