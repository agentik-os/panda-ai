/**
 * Marketplace Installation Mutations
 * Step-071: Design Marketplace Database Schema
 */

import { mutation } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Install an agent or skill from the marketplace
 */
export const install = mutation({
  args: {
    itemType: v.union(v.literal("agent"), v.literal("skill")),
    itemId: v.id("marketplace_agents"), // Or marketplace_skills (polymorphic)
    userId: v.string(),
    agentId: v.optional(v.id("agents")), // Optional: install to specific agent
  },
  handler: async (ctx, args) => {
    const { itemType, itemId, userId, agentId } = args;

    // Check if already purchased
    const existing = await ctx.db
      .query("marketplace_purchases")
      .filter((q) =>
        q.and(
          q.eq(q.field("itemType"), itemType),
          q.eq(q.field("itemId"), itemId),
          q.eq(q.field("userId"), userId),
        ),
      )
      .first();

    if (existing) {
      // Already purchased, just update status
      await ctx.db.patch(existing._id, {
        installStatus: "installed",
        installedAt: Date.now(),
        updatedAt: Date.now(),
      });

      return existing._id;
    }

    // Get item details
    const item = await ctx.db.get(itemId);
    if (!item) {
      throw new Error("Item not found");
    }

    // Create new purchase record
    const purchaseId = await ctx.db.insert("marketplace_purchases", {
      itemType,
      itemId,
      userId,
      agentId,
      pricePaid: item.price || 0,
      licenseType: item.pricingModel === "free" ? "free" : "paid",
      installStatus: "installed",
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      installedAt: Date.now(),
    });

    // Increment install count on the item
    if (itemType === "agent") {
      await ctx.db.patch(itemId, {
        installCount: (item.installCount || 0) + 1,
        updatedAt: Date.now(),
      });
    } else {
      await ctx.db.patch(itemId, {
        installCount: (item.installCount || 0) + 1,
        updatedAt: Date.now(),
      });
    }

    return purchaseId;
  },
});

/**
 * Uninstall an agent or skill
 */
export const uninstall = mutation({
  args: {
    purchaseId: v.id("marketplace_purchases"),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    await ctx.db.patch(args.purchaseId, {
      installStatus: "uninstalled",
      uninstalledAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

/**
 * Track usage of an installed item
 */
export const trackUsage = mutation({
  args: {
    purchaseId: v.id("marketplace_purchases"),
  },
  handler: async (ctx, args) => {
    const purchase = await ctx.db.get(args.purchaseId);

    if (!purchase) {
      throw new Error("Purchase not found");
    }

    await ctx.db.patch(args.purchaseId, {
      usageCount: purchase.usageCount + 1,
      lastUsedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});
