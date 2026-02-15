import { query } from "../_generated/server";
import { v } from "convex/values";

/**
 * Get cost summary for dashboard
 */
export const summary = query({
  args: {},
  handler: async (ctx) => {
    const allCosts = await ctx.db.query("costs").collect();

    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    const thirtyDaysAgo = now - 30 * 24 * 60 * 60 * 1000;

    // Calculate today's costs
    const todayCosts = allCosts.filter((c) => c.timestamp >= oneDayAgo);
    const todayTotal = todayCosts.reduce((sum, c) => sum + c.totalCost, 0);

    // Calculate this month's costs
    const monthCosts = allCosts.filter((c) => c.timestamp >= thirtyDaysAgo);
    const monthTotal = monthCosts.reduce((sum, c) => sum + c.totalCost, 0);

    // Calculate total costs
    const totalCost = allCosts.reduce((sum, c) => sum + c.totalCost, 0);

    // Group by model
    const costByModel = new Map<string, number>();
    for (const cost of monthCosts) {
      const current = costByModel.get(cost.model) ?? 0;
      costByModel.set(cost.model, current + cost.totalCost);
    }

    // Convert to array and sort by cost
    const modelBreakdown = Array.from(costByModel.entries())
      .map(([model, cost]) => ({ model, cost }))
      .sort((a, b) => b.cost - a.cost);

    return {
      today: todayTotal,
      month: monthTotal,
      total: totalCost,
      modelBreakdown,
    };
  },
});

/**
 * Get cost breakdown by agent
 */
export const byAgent = query({
  args: {
    agentId: v.optional(v.id("agents")),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("costs");

    // Filter by agent if provided
    if (args.agentId) {
      query = query.withIndex("by_agent", (q) => q.eq("agentId", args.agentId));
    }

    let costs = await query.collect();

    // Filter by date range if provided
    if (args.startDate) {
      costs = costs.filter((c) => c.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      costs = costs.filter((c) => c.timestamp <= args.endDate!);
    }

    // Group by agent
    const costByAgent = new Map<string, {
      agentId: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>();

    for (const cost of costs) {
      const agentId = cost.agentId;
      const existing = costByAgent.get(agentId);

      if (!existing) {
        costByAgent.set(agentId, {
          agentId,
          totalCost: cost.totalCost,
          totalTokens: cost.totalTokens,
          requestCount: 1,
        });
      } else {
        existing.totalCost += cost.totalCost;
        existing.totalTokens += cost.totalTokens;
        existing.requestCount++;
      }
    }

    return Array.from(costByAgent.values()).sort(
      (a, b) => b.totalCost - a.totalCost
    );
  },
});

/**
 * Get cost breakdown by model
 */
export const byModel = query({
  args: {
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let costs = await ctx.db.query("costs").collect();

    // Filter by date range if provided
    if (args.startDate) {
      costs = costs.filter((c) => c.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      costs = costs.filter((c) => c.timestamp <= args.endDate!);
    }

    // Group by model
    const costByModel = new Map<string, {
      model: string;
      provider: string;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
      avgCostPerRequest: number;
    }>();

    for (const cost of costs) {
      const existing = costByModel.get(cost.model);

      if (!existing) {
        costByModel.set(cost.model, {
          model: cost.model,
          provider: cost.provider,
          totalCost: cost.totalCost,
          totalTokens: cost.totalTokens,
          requestCount: 1,
          avgCostPerRequest: cost.totalCost,
        });
      } else {
        existing.totalCost += cost.totalCost;
        existing.totalTokens += cost.totalTokens;
        existing.requestCount++;
        existing.avgCostPerRequest = existing.totalCost / existing.requestCount;
      }
    }

    return Array.from(costByModel.values()).sort(
      (a, b) => b.totalCost - a.totalCost
    );
  },
});

/**
 * Get cost history over time (for charts)
 */
export const history = query({
  args: {
    agentId: v.optional(v.id("agents")),
    granularity: v.optional(v.string()), // "hour", "day", "week", "month"
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let query = ctx.db.query("costs");

    if (args.agentId) {
      query = query.withIndex("by_agent", (q) => q.eq("agentId", args.agentId));
    }

    let costs = await query.collect();

    // Filter by date range
    if (args.startDate) {
      costs = costs.filter((c) => c.timestamp >= args.startDate!);
    }
    if (args.endDate) {
      costs = costs.filter((c) => c.timestamp <= args.endDate!);
    }

    // Group by time period
    const granularity = args.granularity ?? "day";
    const bucketSize =
      granularity === "hour" ? 60 * 60 * 1000 :
      granularity === "day" ? 24 * 60 * 60 * 1000 :
      granularity === "week" ? 7 * 24 * 60 * 60 * 1000 :
      30 * 24 * 60 * 60 * 1000; // month

    const costByPeriod = new Map<number, {
      timestamp: number;
      totalCost: number;
      totalTokens: number;
      requestCount: number;
    }>();

    for (const cost of costs) {
      const bucket = Math.floor(cost.timestamp / bucketSize) * bucketSize;
      const existing = costByPeriod.get(bucket);

      if (!existing) {
        costByPeriod.set(bucket, {
          timestamp: bucket,
          totalCost: cost.totalCost,
          totalTokens: cost.totalTokens,
          requestCount: 1,
        });
      } else {
        existing.totalCost += cost.totalCost;
        existing.totalTokens += cost.totalTokens;
        existing.requestCount++;
      }
    }

    return Array.from(costByPeriod.values()).sort(
      (a, b) => a.timestamp - b.timestamp
    );
  },
});
