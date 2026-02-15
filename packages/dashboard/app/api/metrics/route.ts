import { NextRequest, NextResponse } from "next/server";

/**
 * GET /api/metrics
 *
 * Returns metrics in Prometheus text exposition format
 * or JSON format based on Accept header.
 */

// In-memory metrics store (shared with runtime via API calls in production)
// For now, serves as an independent metrics endpoint
interface MetricSnapshot {
  agentExecutions: number;
  agentErrors: number;
  messagesProcessed: number;
  activeAgents: number;
  totalCostUsd: number;
  avgExecutionMs: number;
  memoryUsageBytes: number;
  uptime: number;
  timestamp: string;
}

// Simulated metrics (in production, these come from the runtime)
function collectMetrics(): MetricSnapshot {
  const memUsage = typeof process !== "undefined" && process.memoryUsage
    ? process.memoryUsage().rss
    : 0;

  return {
    agentExecutions: metricsStore.agentExecutions,
    agentErrors: metricsStore.agentErrors,
    messagesProcessed: metricsStore.messagesProcessed,
    activeAgents: metricsStore.activeAgents,
    totalCostUsd: metricsStore.totalCostUsd,
    avgExecutionMs: metricsStore.avgExecutionMs,
    memoryUsageBytes: memUsage,
    uptime: (Date.now() - startTime) / 1000,
    timestamp: new Date().toISOString(),
  };
}

// Internal metrics accumulator
const startTime = Date.now();
const metricsStore = {
  agentExecutions: 0,
  agentErrors: 0,
  messagesProcessed: 0,
  activeAgents: 0,
  totalCostUsd: 0,
  avgExecutionMs: 0,
};

function toPrometheusFormat(snapshot: MetricSnapshot): string {
  return [
    "# HELP agent_execution_total Total number of agent executions",
    "# TYPE agent_execution_total counter",
    `agent_execution_total ${snapshot.agentExecutions}`,
    "",
    "# HELP agent_execution_errors_total Total agent execution errors",
    "# TYPE agent_execution_errors_total counter",
    `agent_execution_errors_total ${snapshot.agentErrors}`,
    "",
    "# HELP messages_processed_total Total messages processed",
    "# TYPE messages_processed_total counter",
    `messages_processed_total ${snapshot.messagesProcessed}`,
    "",
    "# HELP agents_active_total Currently active agents",
    "# TYPE agents_active_total gauge",
    `agents_active_total ${snapshot.activeAgents}`,
    "",
    "# HELP agent_cost_total_usd Total cost in USD",
    "# TYPE agent_cost_total_usd gauge",
    `agent_cost_total_usd ${snapshot.totalCostUsd}`,
    "",
    "# HELP agent_execution_avg_duration_ms Average execution duration",
    "# TYPE agent_execution_avg_duration_ms gauge",
    `agent_execution_avg_duration_ms ${snapshot.avgExecutionMs}`,
    "",
    "# HELP memory_usage_bytes Current memory usage in bytes",
    "# TYPE memory_usage_bytes gauge",
    `memory_usage_bytes ${snapshot.memoryUsageBytes}`,
    "",
    "# HELP process_uptime_seconds Process uptime in seconds",
    "# TYPE process_uptime_seconds gauge",
    `process_uptime_seconds ${snapshot.uptime.toFixed(2)}`,
    "",
  ].join("\n");
}

export async function GET(request: NextRequest) {
  const accept = request.headers.get("accept") ?? "";
  const snapshot = collectMetrics();

  // Prometheus text format
  if (
    accept.includes("text/plain") ||
    accept.includes("application/openmetrics-text")
  ) {
    return new NextResponse(toPrometheusFormat(snapshot), {
      headers: {
        "Content-Type": "text/plain; version=0.0.4; charset=utf-8",
      },
    });
  }

  // JSON format (default, for dashboard)
  return NextResponse.json({
    status: "ok",
    metrics: snapshot,
    errors: {
      total: metricsStore.agentErrors,
      recent: [] as Array<{
        id: string;
        message: string;
        timestamp: string;
        level: string;
      }>,
    },
  });
}

/**
 * POST /api/metrics
 *
 * Accepts metric updates from the runtime
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.agentExecutions !== undefined) {
      metricsStore.agentExecutions += body.agentExecutions;
    }
    if (body.agentErrors !== undefined) {
      metricsStore.agentErrors += body.agentErrors;
    }
    if (body.messagesProcessed !== undefined) {
      metricsStore.messagesProcessed += body.messagesProcessed;
    }
    if (body.activeAgents !== undefined) {
      metricsStore.activeAgents = body.activeAgents;
    }
    if (body.totalCostUsd !== undefined) {
      metricsStore.totalCostUsd += body.totalCostUsd;
    }
    if (body.avgExecutionMs !== undefined) {
      metricsStore.avgExecutionMs = body.avgExecutionMs;
    }

    return NextResponse.json({ status: "ok" });
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 },
    );
  }
}
