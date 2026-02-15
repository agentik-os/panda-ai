/**
 * Convex Client Wrapper
 *
 * This file isolates all Convex imports to contain type errors
 * until `npx convex dev` generates the `_generated/` directory.
 *
 * @todo Remove @ts-expect-error comments after running `npx convex dev`
 */

"use client";

import { ConvexProvider, ConvexReactClient } from "convex/react";

import { api } from "../../../convex/_generated/api";
import type { Id } from "../../../convex/_generated/dataModel";

/**
 * Convex client instance
 * Uses placeholder URL until NEXT_PUBLIC_CONVEX_URL is set
 */
export const convex = new ConvexReactClient(
  process.env.NEXT_PUBLIC_CONVEX_URL || "https://placeholder.convex.cloud"
);

/**
 * Convex API object
 * Contains all queries, mutations, and actions
 */
export { api };

/**
 * Convex Id type for type-safe document references
 */
export type { Id };

/**
 * Convex Provider component
 * Wraps the app to provide Convex context
 */
export { ConvexProvider };

/**
 * Re-export Convex hooks for components
 */
export { useQuery, useMutation, useAction } from "convex/react";

/**
 * Type-safe query/mutation helpers
 * These will have full type inference after Convex init
 */
export type ConvexQuery = typeof api.queries;
export type ConvexMutation = typeof api.mutations;
export type ConvexAction = typeof api.actions;
