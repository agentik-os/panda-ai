/**
 * Timeline Events - Convex Functions
 *
 * Phase 3: Time Travel Debug - Event Store & Replay Engine.
 * Used by ConvexAdapter.saveEvent(), getEvents(), and replayFromEvent().
 */

import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * Save a timeline event
 */
export const save = mutation({
  args: {
    agentId: v.string(),
    eventType: v.string(),
    timestamp: v.number(),
    data: v.any(),
    cost: v.number(),
  },
  handler: async (ctx, args) => {
    const eventId = await ctx.db.insert("timelineEvents", {
      agentId: args.agentId,
      eventType: args.eventType,
      timestamp: args.timestamp,
      data: args.data,
      cost: args.cost,
    });

    return eventId;
  },
});

/**
 * Get a single timeline event by ID
 */
export const get = query({
  args: {
    id: v.id("timelineEvents"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

/**
 * Get timeline events with filtering
 */
export const list = query({
  args: {
    agentId: v.optional(v.string()),
    eventType: v.optional(v.string()),
    startTime: v.optional(v.number()),
    endTime: v.optional(v.number()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;

    let q;
    if (args.agentId) {
      q = ctx.db
        .query("timelineEvents")
        .withIndex("by_agent_time", (idx) => idx.eq("agentId", args.agentId!));
    } else {
      q = ctx.db.query("timelineEvents");
    }

    // Apply filters
    if (args.eventType || args.startTime || args.endTime) {
      q = q.filter((f) => {
        const conditions = [];

        if (args.eventType) {
          conditions.push(f.eq(f.field("eventType"), args.eventType));
        }
        if (args.startTime) {
          conditions.push(f.gte(f.field("timestamp"), args.startTime));
        }
        if (args.endTime) {
          conditions.push(f.lte(f.field("timestamp"), args.endTime));
        }

        if (conditions.length === 1) return conditions[0];
        if (conditions.length === 2) return f.and(conditions[0], conditions[1]);
        return f.and(conditions[0], f.and(conditions[1], conditions[2]));
      });
    }

    return await q.order("asc").take(limit);
  },
});

/**
 * Get events for replay starting from a timestamp
 */
export const listFromTimestamp = query({
  args: {
    agentId: v.string(),
    startTime: v.number(),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit ?? 1000;

    return await ctx.db
      .query("timelineEvents")
      .withIndex("by_agent_time", (q) => q.eq("agentId", args.agentId))
      .filter((f) => f.gte(f.field("timestamp"), args.startTime))
      .order("asc")
      .take(limit);
  },
});

/**
 * Delete old timeline events
 */
export const cleanup = mutation({
  args: {
    agentId: v.string(),
    olderThan: v.number(),
  },
  handler: async (ctx, args) => {
    const oldEvents = await ctx.db
      .query("timelineEvents")
      .withIndex("by_agent_time", (q) => q.eq("agentId", args.agentId))
      .filter((f) => f.lt(f.field("timestamp"), args.olderThan))
      .collect();

    for (const event of oldEvents) {
      await ctx.db.delete(event._id);
    }

    return { success: true, deletedCount: oldEvents.length };
  },
});

/**
 * Get event count and cost summary for an agent
 */
export const stats = query({
  args: {
    agentId: v.string(),
  },
  handler: async (ctx, args) => {
    const events = await ctx.db
      .query("timelineEvents")
      .withIndex("by_agent_time", (q) => q.eq("agentId", args.agentId))
      .collect();

    const totalCost = events.reduce((sum, e) => sum + (e.cost || 0), 0);
    const eventTypes = events.reduce(
      (acc, e) => {
        acc[e.eventType] = (acc[e.eventType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      totalEvents: events.length,
      totalCost,
      eventTypes,
      oldestEvent: events.length > 0 ? events[0].timestamp : null,
      newestEvent: events.length > 0 ? events[events.length - 1].timestamp : null,
    };
  },
});
