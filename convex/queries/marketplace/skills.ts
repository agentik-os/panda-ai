/**
 * Marketplace Skills Queries
 * Step-071: Design Marketplace Database Schema
 */

import { query } from "../../_generated/server";
import { v } from "convex/values";

/**
 * Browse published skills in the marketplace
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
    let skills = ctx.db.query("marketplace_skills");

    // Filter by status (only published)
    skills = skills.filter((q) => q.eq(q.field("status"), "published"));

    // Filter by category if specified
    if (category) {
      skills = skills.filter((q) => q.eq(q.field("category"), category));
    }

    // Execute query
    let results = await skills.collect();

    // Filter by search term if specified
    if (search) {
      const searchLower = search.toLowerCase();
      results = results.filter(
        (skill) =>
          skill.name.toLowerCase().includes(searchLower) ||
          skill.description.toLowerCase().includes(searchLower) ||
          skill.tagline.toLowerCase().includes(searchLower) ||
          skill.tags.some((tag) => tag.toLowerCase().includes(searchLower)),
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
 * Get detailed information about a specific marketplace skill
 */
export const getById = query({
  args: {
    skillId: v.id("marketplace_skills"),
  },
  handler: async (ctx, args) => {
    const skill = await ctx.db.get(args.skillId);

    if (!skill) {
      throw new Error("Skill not found");
    }

    // Only return published skills to public
    if (skill.status !== "published") {
      throw new Error("Skill not available");
    }

    return skill;
  },
});

/**
 * Get categories and their counts
 */
export const getCategories = query({
  args: {},
  handler: async (ctx) => {
    const skills = await ctx.db
      .query("marketplace_skills")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Count skills per category
    const categoryCounts: Record<string, number> = {};

    for (const skill of skills) {
      categoryCounts[skill.category] = (categoryCounts[skill.category] || 0) + 1;
    }

    return Object.entries(categoryCounts).map(([name, count]) => ({
      name,
      count,
    }));
  },
});

/**
 * Get popular/featured skills for homepage
 */
export const getFeatured = query({
  args: {
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 6;

    const skills = await ctx.db
      .query("marketplace_skills")
      .filter((q) => q.eq(q.field("status"), "published"))
      .collect();

    // Sort by combination of rating and install count
    const scored = skills.map((skill) => ({
      ...skill,
      score: skill.averageRating * skill.installCount,
    }));

    scored.sort((a, b) => b.score - a.score);

    return scored.slice(0, limit).map((skill) => {
      const { score, ...rest } = skill;
      return rest;
    });
  },
});
