"use client";

import { ReactNode } from "react";
import { ConvexProvider, convex } from "@/lib/convex";

/**
 * Convex Client Provider
 *
 * Wraps the application with Convex real-time database context.
 *
 * @note Awaiting Convex initialization via `npx convex dev`
 *       Once initialized, replace placeholder URL with actual deployment URL
 *       in NEXT_PUBLIC_CONVEX_URL environment variable.
 */
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}
