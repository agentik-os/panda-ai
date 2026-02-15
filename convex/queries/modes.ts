/**
 * Agent Mode Queries
 * Step-072: OS Modes (Focus/Creative/Research)
 */

import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get current mode for an agent
 */
export const getCurrentMode = query({
  args: {
    agentId: v.id("agents"),
  },
  handler: async (ctx, args) => {
    const agent = await ctx.db.get(args.agentId);

    if (!agent) {
      throw new Error("Agent not found");
    }

    return {
      agentId: args.agentId,
      mode: agent.mode || "balanced",
      agentName: agent.name,
    };
  },
});

/**
 * Get agents grouped by mode
 */
export const getAgentsByMode = query({
  args: {},
  handler: async (ctx) => {
    const agents = await ctx.db.query("agents").collect();

    const byMode: Record<
      string,
      Array<{ _id: string; name: string }>
    > = {
      focus: [],
      creative: [],
      research: [],
      balanced: [],
    };

    for (const agent of agents) {
      const mode = agent.mode || "balanced";
      byMode[mode].push({
        _id: agent._id,
        name: agent.name,
      });
    }

    return byMode;
  },
});
