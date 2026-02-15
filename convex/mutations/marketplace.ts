/**
 * Marketplace Mutations
 *
 * Convex mutations for modifying marketplace data (publishing, purchases, reviews, payouts)
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Publish an agent to the marketplace
 *
 * @param agentData - Agent details (name, description, system prompt, etc.)
 * @returns Agent ID
 */
export const publishAgent = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    tagline: v.string(),
    category: v.string(),
    publisherId: v.string(),
    publisherName: v.string(),
    version: v.string(),
    systemPrompt: v.string(),
    model: v.string(),
    provider: v.string(),
    temperature: v.optional(v.number()),
    maxTokens: v.optional(v.number()),
    channels: v.array(v.string()),
    skills: v.array(v.string()),
    tags: v.array(v.string()),
    icon: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    demoVideo: v.optional(v.string()),
    pricingModel: v.union(
      v.literal("free"),
      v.literal("freemium"),
      v.literal("paid"),
    ),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const agentId = await ctx.db.insert("marketplace_agents", {
      name: args.name,
      description: args.description,
      tagline: args.tagline,
      category: args.category,
      publisherId: args.publisherId,
      publisherName: args.publisherName,
      version: args.version,
      systemPrompt: args.systemPrompt,
      model: args.model,
      provider: args.provider,
      temperature: args.temperature,
      maxTokens: args.maxTokens,
      channels: args.channels,
      skills: args.skills,
      tags: args.tags,
      icon: args.icon,
      screenshots: args.screenshots,
      demoVideo: args.demoVideo,
      pricingModel: args.pricingModel,
      price: args.price,
      installCount: 0,
      averageRating: 0,
      ratingCount: 0,
      reviewCount: 0,
      status: "pending", // Requires moderation before published
      createdAt: now,
      updatedAt: now,
    });

    return agentId;
  },
});

/**
 * Publish a skill to the marketplace
 */
export const publishSkill = mutation({
  args: {
    name: v.string(),
    description: v.string(),
    tagline: v.string(),
    category: v.string(),
    publisherId: v.string(),
    publisherName: v.string(),
    version: v.string(),
    permissions: v.array(v.string()),
    executionType: v.union(
      v.literal("function"),
      v.literal("wasm"),
      v.literal("api"),
    ),
    packageUrl: v.optional(v.string()),
    repositoryUrl: v.optional(v.string()),
    tags: v.array(v.string()),
    icon: v.optional(v.string()),
    screenshots: v.optional(v.array(v.string())),
    pricingModel: v.union(
      v.literal("free"),
      v.literal("freemium"),
      v.literal("paid"),
    ),
    price: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const skillId = await ctx.db.insert("marketplace_skills", {
      name: args.name,
      description: args.description,
      tagline: args.tagline,
      category: args.category,
      publisherId: args.publisherId,
      publisherName: args.publisherName,
      version: args.version,
      permissions: args.permissions,
      executionType: args.executionType,
      packageUrl: args.packageUrl,
      repositoryUrl: args.repositoryUrl,
      tags: args.tags,
      icon: args.icon,
      screenshots: args.screenshots,
      pricingModel: args.pricingModel,
      price: args.price,
      installCount: 0,
      averageRating: 0,
      ratingCount: 0,
      reviewCount: 0,
      status: "pending",
      createdAt: now,
      updatedAt: now,
    });

    return skillId;
  },
});

/**
 * Create a purchase/installation record
 *
 * @returns Purchase ID
 */
export const createPurchase = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Or marketplace_skills (polymorphic)
    userId: v.string(),
    agentId: v.optional(v.id("agents")),
    pricePaid: v.number(),
    paymentMethod: v.optional(v.string()),
    transactionId: v.optional(v.string()),
    licenseType: v.union(
      v.literal("free"),
      v.literal("trial"),
      v.literal("paid"),
      v.literal("subscription"),
    ),
    licenseKey: v.optional(v.string()),
    expiresAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Create purchase record
    const purchaseId = await ctx.db.insert("marketplace_purchases", {
      itemType: args.itemType,
      itemId: args.itemId,
      userId: args.userId,
      agentId: args.agentId,
      pricePaid: args.pricePaid,
      paymentMethod: args.paymentMethod,
      transactionId: args.transactionId,
      licenseType: args.licenseType,
      licenseKey: args.licenseKey,
      expiresAt: args.expiresAt,
      installStatus: "pending",
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
    });

    // Update install count on the item
    const table =
      args.itemType === "agent" ? "marketplace_agents" : "marketplace_skills";
    const item = await ctx.db.get(args.itemId);

    if (item) {
      await ctx.db.patch(args.itemId, {
        installCount: item.installCount + 1,
        updatedAt: now,
      });
    }

    return purchaseId;
  },
});

/**
 * Update purchase install status
 */
export const updatePurchaseStatus = mutation({
  args: {
    purchaseId: v.id("marketplace_purchases"),
    installStatus: v.union(
      v.literal("pending"),
      v.literal("installed"),
      v.literal("failed"),
      v.literal("uninstalled"),
    ),
    installError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const purchase = await ctx.db.get(args.purchaseId);

    if (!purchase) {
      throw new Error(`Purchase ${args.purchaseId} not found`);
    }

    await ctx.db.patch(args.purchaseId, {
      installStatus: args.installStatus,
      installError: args.installError,
      installedAt:
        args.installStatus === "installed" ? now : purchase.installedAt,
      uninstalledAt:
        args.installStatus === "uninstalled" ? now : purchase.uninstalledAt,
      updatedAt: now,
    });
  },
});

/**
 * Submit or update a rating for an item
 */
export const submitRating = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
    userId: v.string(),
    rating: v.number(), // 1-5
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Check if user already rated this item
    const existingRating = await ctx.db
      .query("marketplace_ratings")
      .withIndex("by_user_and_item", (q) =>
        q.eq("userId", args.userId).eq("itemId", args.itemId),
      )
      .first();

    if (existingRating) {
      // Update existing rating
      await ctx.db.patch(existingRating._id, {
        rating: args.rating,
        updatedAt: now,
      });
    } else {
      // Create new rating
      await ctx.db.insert("marketplace_ratings", {
        itemType: args.itemType,
        itemId: args.itemId,
        userId: args.userId,
        rating: args.rating,
        createdAt: now,
        updatedAt: now,
      });
    }

    // Recalculate average rating for the item
    await recalculateItemRating(ctx, args.itemType, args.itemId);
  },
});

/**
 * Submit a review for an item
 */
export const submitReview = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
    userId: v.string(),
    userName: v.string(),
    userAvatar: v.optional(v.string()),
    rating: v.number(),
    title: v.string(),
    content: v.string(),
    isVerifiedPurchase: v.boolean(),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Validate rating
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    // Create review
    const reviewId = await ctx.db.insert("marketplace_reviews", {
      itemType: args.itemType,
      itemId: args.itemId,
      userId: args.userId,
      userName: args.userName,
      userAvatar: args.userAvatar,
      rating: args.rating,
      title: args.title,
      content: args.content,
      helpfulCount: 0,
      notHelpfulCount: 0,
      isVerifiedPurchase: args.isVerifiedPurchase,
      status: "pending", // Requires moderation
      createdAt: now,
      updatedAt: now,
    });

    // Update review count on the item
    const table =
      args.itemType === "agent" ? "marketplace_agents" : "marketplace_skills";
    const item = await ctx.db.get(args.itemId);

    if (item) {
      await ctx.db.patch(args.itemId, {
        reviewCount: item.reviewCount + 1,
        updatedAt: now,
      });
    }

    return reviewId;
  },
});

/**
 * Vote a review as helpful/not helpful
 */
export const voteReview = mutation({
  args: {
    reviewId: v.id("marketplace_reviews"),
    helpful: v.boolean(),
  },
  handler: async (ctx, args) => {
    const review = await ctx.db.get(args.reviewId);

    if (!review) {
      throw new Error(`Review ${args.reviewId} not found`);
    }

    await ctx.db.patch(args.reviewId, {
      helpfulCount: args.helpful
        ? review.helpfulCount + 1
        : review.helpfulCount,
      notHelpfulCount: !args.helpful
        ? review.notHelpfulCount + 1
        : review.notHelpfulCount,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Approve marketplace item for publishing
 * (Admin/moderator only)
 */
export const approveItem = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
    moderationNotes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.itemId, {
      status: "published",
      publishedAt: now,
      moderationNotes: args.moderationNotes,
      updatedAt: now,
    });
  },
});

/**
 * Reject marketplace item
 * (Admin/moderator only)
 */
export const rejectItem = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"),
    moderationNotes: v.string(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.itemId, {
      status: "rejected",
      moderationNotes: args.moderationNotes,
      updatedAt: Date.now(),
    });
  },
});

/**
 * Create a payout record for a publisher
 */
export const createPayout = mutation({
  args: {
    publisherId: v.string(),
    publisherName: v.string(),
    periodStart: v.number(),
    periodEnd: v.number(),
    totalRevenue: v.number(),
    itemsSold: v.array(
      v.object({
        itemType: v.union(v.literal("agent"), v.literal("skill")),
        itemId: v.string(),
        itemName: v.string(),
        salesCount: v.number(),
        revenue: v.number(),
      }),
    ),
    paymentMethod: v.union(
      v.literal("bank_transfer"),
      v.literal("stripe_connect"),
      v.literal("paypal"),
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Calculate revenue split: 70% creator, 30% platform
    const platformFee = args.totalRevenue * 0.3;
    const creatorPayout = args.totalRevenue * 0.7;

    const payoutId = await ctx.db.insert("marketplace_payouts", {
      publisherId: args.publisherId,
      publisherName: args.publisherName,
      periodStart: args.periodStart,
      periodEnd: args.periodEnd,
      totalRevenue: args.totalRevenue,
      platformFee,
      creatorPayout,
      itemsSold: args.itemsSold,
      status: "pending",
      paymentMethod: args.paymentMethod,
      createdAt: now,
      updatedAt: now,
    });

    return payoutId;
  },
});

/**
 * Update payout status
 * (Used by payment processor)
 */
export const updatePayoutStatus = mutation({
  args: {
    payoutId: v.id("marketplace_payouts"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("paid"),
      v.literal("failed"),
      v.literal("on-hold"),
    ),
    stripePayoutId: v.optional(v.string()),
    stripeTransferId: v.optional(v.string()),
    failureReason: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    await ctx.db.patch(args.payoutId, {
      status: args.status,
      stripePayoutId: args.stripePayoutId,
      stripeTransferId: args.stripeTransferId,
      failureReason: args.failureReason,
      paidAt: args.status === "paid" ? now : undefined,
      updatedAt: now,
    });
  },
});

/**
 * Helper: Recalculate average rating for an item
 */
async function recalculateItemRating(
  ctx: any,
  itemType: "agent" | "skill",
  itemId: any,
) {
  // Get all ratings for this item
  const ratings = await ctx.db
    .query("marketplace_ratings")
    .withIndex("by_item", (q: any) =>
      q.eq("itemType", itemType).eq("itemId", itemId),
    )
    .collect();

  if (ratings.length === 0) {
    return;
  }

  // Calculate average
  const sum = ratings.reduce((acc: number, r: any) => acc + r.rating, 0);
  const average = sum / ratings.length;

  // Update item
  await ctx.db.patch(itemId, {
    averageRating: average,
    ratingCount: ratings.length,
    updatedAt: Date.now(),
  });
}
