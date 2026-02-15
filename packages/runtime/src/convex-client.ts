/**
 * Convex Client for Runtime
 *
 * Server-side Convex client for the AI agent runtime.
 * Uses Node.js ConvexHttpClient for backend-to-backend communication.
 *
 * Environment Variables:
 * - CONVEX_URL: Convex deployment URL (e.g., https://xxx.convex.cloud)
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../convex/_generated/api";

/**
 * Get Convex client instance (singleton)
 */
let convexClient: ConvexHttpClient | null = null;

export function getConvexClient(): ConvexHttpClient {
  if (!convexClient) {
    const convexUrl =
      process.env.CONVEX_URL || "https://placeholder.convex.cloud";

    if (convexUrl === "https://placeholder.convex.cloud") {
      console.warn(
        "[Convex] CONVEX_URL not set - using placeholder. Run `npx convex dev` first."
      );
    }

    convexClient = new ConvexHttpClient(convexUrl);
  }

  return convexClient;
}

/**
 * Convex API object
 * Contains all queries, mutations, and actions
 */
export { api };

/**
 * Type-safe mutation/query helpers
 * These will have full type inference after Convex init
 */
export type ConvexMutation = typeof api.mutations;
export type ConvexQuery = typeof api.queries;
export type ConvexAction = typeof api.actions;
