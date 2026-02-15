"use client";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge"; // Unused for now
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Activity,
  RefreshCw,
  Server,
  AlertTriangle,
  Bot,
  DollarSign,
  Loader2,
  Clock,
  Zap,
  // MemoryStick, // Unused for now
} from "lucide-react";
import { MetricsChart } from "@/components/metrics/metrics-chart";
import { ErrorRateGraph } from "@/components/metrics/error-rate-graph";
import { AgentPerformanceTable } from "@/components/metrics/agent-performance-table";
import { CostBreakdown } from "@/components/metrics/cost-breakdown";
import { RecentErrors } from "@/components/metrics/recent-errors";

interface MetricsData {
  status: string;
  metrics: {
    agentExecutions: number;
    agentErrors: number;
    messagesProcessed: number;
    activeAgents: number;
    totalCostUsd: number;
    avgExecutionMs: number;
    memoryUsageBytes: number;
    uptime: number;
    timestamp: string;
  };
  errors: {
    total: number;
    recent: Array<{
      id: string;
      message: string;
      timestamp: string;
      level: string;
    }>;
  };
}

// Generate demo time-series data points
function generateTimeSeries(
  count: number,
  baseValue: number,
  variance: number,
): Array<{ timestamp: string; value: number }> {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i) * 60000).toISOString(),
    value: Math.max(0, baseValue + (Math.random() - 0.5) * variance),
  }));
}

function generateErrorTimeSeries(
  count: number,
): Array<{ timestamp: string; errors: number; warnings: number }> {
  const now = Date.now();
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(now - (count - i) * 60000).toISOString(),
    errors: Math.floor(Math.random() * 5),
    warnings: Math.floor(Math.random() * 8),
  }));
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function MetricsPage() {
  const [data, setData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchMetrics = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch("/api/metrics", {
        headers: { Accept: "application/json" },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch {
      // Silently handle - metrics endpoint may not be running
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => fetchMetrics(), 30000);
    return () => clearInterval(interval);
  }, [autoRefresh, fetchMetrics]);

  const metricsSnapshot = data?.metrics;
  const errorRate =
    metricsSnapshot && metricsSnapshot.agentExecutions > 0
      ? (metricsSnapshot.agentErrors / metricsSnapshot.agentExecutions) * 100
      : 0;

  // Demo data for charts
  const executionTimeSeries = generateTimeSeries(30, metricsSnapshot?.agentExecutions ?? 0, 10);
  const latencyTimeSeries = generateTimeSeries(30, metricsSnapshot?.avgExecutionMs ?? 250, 100);
  const errorTimeSeries = generateErrorTimeSeries(24);
  const memoryTimeSeries = generateTimeSeries(
    30,
    (metricsSnapshot?.memoryUsageBytes ?? 50_000_000) / 1_000_000,
    20,
  );

  const demoAgents = [
    {
      agentId: "agent-1",
      name: "Customer Support",
      executions: 1247,
      avgDurationMs: 850,
      errorRate: 0.8,
      totalCostUsd: 12.45,
      trend: "up" as const,
    },
    {
      agentId: "agent-2",
      name: "Code Reviewer",
      executions: 523,
      avgDurationMs: 2100,
      errorRate: 2.1,
      totalCostUsd: 28.90,
      trend: "stable" as const,
    },
    {
      agentId: "agent-3",
      name: "Data Analyst",
      executions: 892,
      avgDurationMs: 1500,
      errorRate: 0.3,
      totalCostUsd: 18.70,
      trend: "up" as const,
    },
    {
      agentId: "agent-4",
      name: "Email Drafter",
      executions: 315,
      avgDurationMs: 450,
      errorRate: 5.2,
      totalCostUsd: 4.20,
      trend: "down" as const,
    },
  ];

  const costBreakdownData = [
    { name: "Claude", value: 32.50 },
    { name: "GPT-5", value: 18.20 },
    { name: "Gemini", value: 8.70 },
    { name: "Ollama", value: 0.00 },
  ];

  const demoErrors = [
    {
      id: "err-1",
      timestamp: new Date(Date.now() - 120000).toISOString(),
      level: "error" as const,
      message: "Agent execution timeout after 60s",
      type: "TimeoutError",
      agentId: "agent-4",
    },
    {
      id: "err-2",
      timestamp: new Date(Date.now() - 300000).toISOString(),
      level: "warning" as const,
      message: "Rate limit approaching for Claude API",
      type: "RateLimitWarning",
    },
    {
      id: "err-3",
      timestamp: new Date(Date.now() - 600000).toISOString(),
      level: "error" as const,
      message: "Failed to save agent memory: connection reset",
      type: "ConnectionError",
      agentId: "agent-2",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Metrics & Monitoring
          </h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Real-time system performance, errors, and cost tracking.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
          >
            {autoRefresh ? "Auto-refresh ON" : "Auto-refresh OFF"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => fetchMetrics(true)}
            disabled={refreshing}
          >
            <RefreshCw
              className={`mr-1 h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Agents
            </CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {metricsSnapshot?.activeAgents ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricsSnapshot?.agentExecutions ?? 0} total executions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{errorRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              {metricsSnapshot?.agentErrors ?? 0} errors total
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Avg Latency
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(metricsSnapshot?.avgExecutionMs ?? 0) < 1000
                ? `${(metricsSnapshot?.avgExecutionMs ?? 0).toFixed(0)}ms`
                : `${((metricsSnapshot?.avgExecutionMs ?? 0) / 1000).toFixed(1)}s`}
            </div>
            <p className="text-xs text-muted-foreground">
              {metricsSnapshot?.messagesProcessed ?? 0} messages processed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">System</CardTitle>
            <Server className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatBytes(metricsSnapshot?.memoryUsageBytes ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Uptime: {formatUptime(metricsSnapshot?.uptime ?? 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs: Overview | Performance | Errors */}
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview" className="gap-1">
            <Activity className="h-4 w-4" />
            <span className="hidden sm:inline">Overview</span>
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1">
            <Zap className="h-4 w-4" />
            <span className="hidden sm:inline">Performance</span>
          </TabsTrigger>
          <TabsTrigger value="errors" className="gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span className="hidden sm:inline">Errors</span>
          </TabsTrigger>
          <TabsTrigger value="costs" className="gap-1">
            <DollarSign className="h-4 w-4" />
            <span className="hidden sm:inline">Costs</span>
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <MetricsChart
              title="Agent Executions"
              data={executionTimeSeries}
              color="hsl(var(--primary))"
              valueFormatter={(v) => Math.round(v).toString()}
            />
            <MetricsChart
              title="Average Latency (ms)"
              data={latencyTimeSeries}
              color="hsl(var(--chart-2, 173 58% 39%))"
              type="line"
              valueFormatter={(v) => `${v.toFixed(0)}ms`}
              yAxisLabel="ms"
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ErrorRateGraph data={errorTimeSeries} currentRate={errorRate} />
            <MetricsChart
              title="Memory Usage (MB)"
              data={memoryTimeSeries}
              color="hsl(var(--chart-3, 197 37% 24%))"
              valueFormatter={(v) => `${v.toFixed(1)} MB`}
              yAxisLabel="MB"
            />
          </div>
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-4">
          <AgentPerformanceTable agents={demoAgents} />
          <div className="grid gap-4 md:grid-cols-2">
            <MetricsChart
              title="Execution Duration (ms)"
              data={latencyTimeSeries}
              color="hsl(var(--chart-2, 173 58% 39%))"
              type="line"
              valueFormatter={(v) => `${v.toFixed(0)}ms`}
            />
            <MetricsChart
              title="Messages Processed"
              data={generateTimeSeries(30, metricsSnapshot?.messagesProcessed ?? 50, 20)}
              color="hsl(var(--chart-4, 43 74% 66%))"
              valueFormatter={(v) => Math.round(v).toString()}
            />
          </div>
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <ErrorRateGraph data={errorTimeSeries} currentRate={errorRate} />
            <RecentErrors errors={demoErrors} />
          </div>
        </TabsContent>

        {/* Costs Tab */}
        <TabsContent value="costs" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <CostBreakdown
              data={costBreakdownData}
              totalCost={costBreakdownData.reduce((s, d) => s + d.value, 0)}
            />
            <MetricsChart
              title="Daily Cost (USD)"
              data={generateTimeSeries(30, 2.5, 1.5)}
              color="hsl(var(--chart-5, 27 87% 67%))"
              valueFormatter={(v) => `$${v.toFixed(2)}`}
              yAxisLabel="USD"
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
