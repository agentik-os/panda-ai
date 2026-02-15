/**
 * WebSocket Real-Time Updates - Type Definitions
 *
 * Shared types for WebSocket communication between runtime and dashboard.
 * Supports real-time updates for cost tracking, budget alerts, and agent status.
 */

import type { Id } from "../../../../convex/_generated/dataModel";

/**
 * WebSocket event types
 */
export type WebSocketEventType =
  | "cost:new" // New cost event recorded
  | "cost:updated" // Cost event updated
  | "budget:alert" // Budget threshold alert
  | "budget:exceeded" // Budget limit exceeded
  | "budget:reset" // Budget period reset
  | "agent:status" // Agent status change
  | "agent:paused" // Agent paused due to budget
  | "agent:resumed" // Agent resumed after budget reset
  | "connection:established" // Connection successful
  | "connection:error" // Connection error
  | "subscription:confirmed" // Subscription confirmed
  | "subscription:error"; // Subscription error

/**
 * WebSocket channel/room types
 */
export type WebSocketChannel =
  | `agent:${string}` // Per-agent channel (agent:j57abc123)
  | `user:${string}` // Per-user channel (user:j57xyz789)
  | `budget:${string}` // Per-budget channel (budget:j57budget1)
  | "system"; // System-wide broadcasts

/**
 * Base WebSocket message structure
 */
export interface WebSocketMessage<T = unknown> {
  type: WebSocketEventType;
  channel: WebSocketChannel;
  payload: T;
  timestamp: number;
  messageId: string; // Unique message ID for deduplication
}

/**
 * Cost event payload
 */
export interface CostEventPayload {
  id: Id<"costs">;
  agentId: Id<"agents">;
  conversationId?: Id<"conversations">;
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  inputCost: number;
  outputCost: number;
  totalCost: number;
  channel: string;
  timestamp: number;
}

/**
 * Budget alert payload
 */
export interface BudgetAlertPayload {
  budgetId: Id<"budgets">;
  agentId: Id<"agents">;
  threshold: 50 | 75 | 90 | 100;
  currentSpend: number;
  limitAmount: number;
  percentUsed: number;
  period: "daily" | "weekly" | "monthly" | "per-conversation";
  enforcementAction: "warn" | "pause" | "block";
  isPaused: boolean;
  message: string;
}

/**
 * Agent status payload
 */
export interface AgentStatusPayload {
  agentId: Id<"agents">;
  status: "active" | "paused" | "blocked" | "idle";
  reason?: string; // Reason for pause/block
  budgetId?: Id<"budgets">; // Related budget if status change due to budget
  timestamp: number;
}

/**
 * Connection established payload
 */
export interface ConnectionEstablishedPayload {
  clientId: string;
  userId?: Id<"users">;
  channels: WebSocketChannel[];
  timestamp: number;
}

/**
 * Subscription confirmation payload
 */
export interface SubscriptionConfirmedPayload {
  channel: WebSocketChannel;
  timestamp: number;
}

/**
 * Client-to-server messages
 */
export interface ClientMessage {
  type: "subscribe" | "unsubscribe" | "ping";
  channels?: WebSocketChannel[];
  timestamp: number;
}

/**
 * WebSocket connection authentication data
 */
export interface WebSocketAuth {
  userId?: Id<"users">;
  token?: string; // JWT or session token
  agentId?: Id<"agents">; // For agent-specific subscriptions
}

/**
 * WebSocket server configuration
 */
export interface WebSocketServerConfig {
  port: number;
  path: string;
  corsOrigins: string[];
  heartbeatInterval: number; // ms
  connectionTimeout: number; // ms
  maxConnections: number;
  enableCompression: boolean;
}

/**
 * Default WebSocket server configuration
 */
export const DEFAULT_WS_CONFIG: WebSocketServerConfig = {
  port: Number.parseInt(process.env.WS_PORT || "8080", 10),
  path: "/ws",
  corsOrigins: [
    "http://localhost:3000",
    "http://localhost:11005",
    "https://*.agentik-os.com",
  ],
  heartbeatInterval: 30000, // 30s
  connectionTimeout: 60000, // 60s
  maxConnections: 10000,
  enableCompression: true,
};

/**
 * Type guards
 */
export function isCostEvent(
  message: WebSocketMessage
): message is WebSocketMessage<CostEventPayload> {
  return message.type === "cost:new" || message.type === "cost:updated";
}

export function isBudgetAlert(
  message: WebSocketMessage
): message is WebSocketMessage<BudgetAlertPayload> {
  return (
    message.type === "budget:alert" ||
    message.type === "budget:exceeded" ||
    message.type === "budget:reset"
  );
}

export function isAgentStatus(
  message: WebSocketMessage
): message is WebSocketMessage<AgentStatusPayload> {
  return (
    message.type === "agent:status" ||
    message.type === "agent:paused" ||
    message.type === "agent:resumed"
  );
}
