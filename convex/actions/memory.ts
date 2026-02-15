/**
 * Agent Memory Actions
 * Step-073: Embedding generation for semantic search
 */

import { action } from "../_generated/server";
import { v } from "convex/values";
import { api } from "../_generated/api";

/**
 * Generate embedding for a message using OpenAI
 */
export const generateEmbedding = action({
  args: {
    text: v.string(),
  },
  handler: async (ctx, args) => {
    // Use OpenAI embeddings API
    // In production, this would call OpenAI's API
    // For now, return a mock embedding

    // TODO: Replace with actual OpenAI API call
    // const response = await fetch("https://api.openai.com/v1/embeddings", {
    //   method: "POST",
    //   headers: {
    //     "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
    //     "Content-Type": "application/json",
    //   },
    //   body: JSON.stringify({
    //     input: args.text,
    //     model: "text-embedding-3-small",
    //   }),
    // });
    // const data = await response.json();
    // return data.data[0].embedding;

    // Mock embedding (1536 dimensions)
    return Array.from({ length: 1536 }, () => Math.random());
  },
});

/**
 * Index a conversation message (generate and store embedding)
 */
export const indexMessage = action({
  args: {
    messageId: v.id("conversations"),
  },
  handler: async (ctx, args) => {
    // Get the message
    const message = await ctx.runQuery(api.queries.conversations.getById, {
      id: args.messageId,
    });

    if (!message || message.embedding) {
      // Already indexed or doesn't exist
      return { indexed: false, reason: "already_indexed_or_not_found" };
    }

    // Generate embedding
    const embedding = await ctx.runAction(api.actions.memory.generateEmbedding, {
      text: message.content,
    });

    // Store embedding
    await ctx.runMutation(api.mutations.memory.storeEmbedding, {
      messageId: args.messageId,
      embedding,
    });

    return { indexed: true };
  },
});

/**
 * Batch index multiple messages
 */
export const batchIndexMessages = action({
  args: {
    messageIds: v.array(v.id("conversations")),
  },
  handler: async (ctx, args) => {
    const results = [];

    for (const messageId of args.messageIds) {
      try {
        const result = await ctx.runAction(api.actions.memory.indexMessage, {
          messageId,
        });
        results.push({ messageId, ...result });
      } catch (error) {
        results.push({
          messageId,
          indexed: false,
          reason: error instanceof Error ? error.message : "unknown_error",
        });
      }
    }

    return {
      total: args.messageIds.length,
      indexed: results.filter((r) => r.indexed).length,
      failed: results.filter((r) => !r.indexed).length,
      results,
    };
  },
});

/**
 * Search with automatic embedding generation
 */
export const semanticSearch = action({
  args: {
    query: v.string(),
    agentId: v.optional(v.id("agents")),
    limit: v.optional(v.number()),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Generate embedding for query
    const embedding = await ctx.runAction(api.actions.memory.generateEmbedding, {
      text: args.query,
    });

    // Run vector search
    const results = await ctx.runQuery(api.queries.memory.search, {
      query: args.query,
      embedding,
      agentId: args.agentId,
      limit: args.limit,
      startDate: args.startDate,
      endDate: args.endDate,
    });

    return results;
  },
});
