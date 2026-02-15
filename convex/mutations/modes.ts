/**
 * Agent Mode Mutations
 * Step-072: OS Modes (Focus/Creative/Research)
 */

import { mutation } from "../_generated/server";
import { v } from "convex/values";

/**
 * Switch agent mode
 */
export const switchMode = mutation({
  args: {
    agentId: v.id("agents"),
    mode: v.union(
      v.literal("focus"),
      v.literal("creative"),
      v.literal("research"),
      v.literal("balanced"),
    ),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);

    if (!agent) {
      throw new Error("Agent not found");
    }

    await ctx.db.patch(args.agentId, {
      mode: args.mode,
      updatedAt: Date.now(),
    });

    return {
      agentId: args.agentId,
      previousMode: agent.mode || "balanced",
      newMode: args.mode,
    };
  },
});

/**
 * Reset agent mode to balanced (default)
 */
export const resetMode = mutation({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.agentId, {
      mode: "balanced",
      updatedAt: Date.now(),
    });

    return { agentId: args.agentId, mode: "balanced" };
  },
});
