"use client";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  BarChart3,
  Bot,
  Zap,
  Loader2,
  FileText,
} from "lucide-react";
import { useQuery, api } from "@/lib/convex";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { toast } from "sonner";
import { Toaster } from "sonner";
import { exportCompleteCostCSV } from "@/lib/export-csv";
// TODO: Re-enable after upgrading jspdf to remove core-js dependency
// import { exportCostPDF } from "@/lib/export-pdf";

export default function CostAnalyticsPage() {
  // State for filters and exports
  const [timeRange, setTimeRange] = useState<"day" | "week" | "month">("month");
  const [isExporting, setIsExporting] = useState(false);

  // Calculate date ranges
  const now = Date.now();
  const startDate =
    timeRange === "day"
      ? now - 24 * 60 * 60 * 1000
      : timeRange === "week"
        ? now - 7 * 24 * 60 * 60 * 1000
        : now - 30 * 24 * 60 * 60 * 1000;

  // Fetch data
  const summary = useQuery(api.queries.costs.summary);
  const costHistory = useQuery(api.queries.costs.history, {
    granularity: timeRange === "day" ? "hour" : "day",
    startDate,
  });
  const costsByAgent = useQuery(api.queries.costs.byAgent, { startDate });
  const costsByModel = useQuery(api.queries.costs.byModel, { startDate });
  const agents = useQuery(api.queries.agents.list, {});

  const isLoading =
    summary === undefined ||
    costHistory === undefined ||
    costsByAgent === undefined ||
    costsByModel === undefined ||
    agents === undefined;

  // Export functions
  const handleExportCSV = () => {
    if (!costsByAgent || !agents) {
      toast.error("No data available to export");
      return;
    }

    setIsExporting(true);
    try {
      exportCompleteCostCSV(costsByAgent, agents);
      toast.success("Cost data exported to CSV successfully");
    } catch (error) {
      console.error("CSV export error:", error);
      toast.error("Failed to export CSV");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPDF = () => {
    // TODO: Re-enable after upgrading jspdf to remove core-js dependency
    // See: packages/dashboard/lib/export-pdf.ts
    toast.info("PDF export coming soon! Use CSV export for now.");
  };

  // Calculate trends
  const getTrend = () => {
    if (!costHistory || costHistory.length < 2) return null;

    const latest = costHistory[costHistory.length - 1];
    const previous = costHistory[costHistory.length - 2];

    if (!latest || !previous) return null;

    const change = latest.totalCost - previous.totalCost;
    const percentChange = previous.totalCost > 0 ? (change / previous.totalCost) * 100 : 0;

    return {
      change,
      percentChange,
      direction: change >= 0 ? "up" : "down",
    };
  };

  const trend = getTrend();

  // Chart colors
  const COLORS = [
    "hsl(var(--chart-1))",
    "hsl(var(--chart-2))",
    "hsl(var(--chart-3))",
    "hsl(var(--chart-4))",
    "hsl(var(--chart-5))",
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Cost Analytics</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Deep dive into your AI spending with advanced analytics.
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            size="default"
            onClick={handleExportCSV}
            disabled={isExporting || isLoading}
            className="h-11 min-w-[44px]"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Download className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Export CSV</span>
            <span className="sm:hidden">CSV</span>
          </Button>
          <Button
            variant="outline"
            size="default"
            onClick={handleExportPDF}
            disabled={isExporting || isLoading}
            className="h-11 min-w-[44px]"
          >
            {isExporting ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <FileText className="mr-2 h-4 w-4" />
            )}
            <span className="hidden sm:inline">Export PDF</span>
            <span className="sm:hidden">PDF</span>
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Time Range:</span>
        </div>
        <Tabs value={timeRange} onValueChange={(v) => setTimeRange(v as any)}>
          <TabsList className="grid w-full grid-cols-3 sm:w-auto">
            <TabsTrigger value="day" className="min-h-[44px]">Last 24h</TabsTrigger>
            <TabsTrigger value="week" className="min-h-[44px]">Last 7 days</TabsTrigger>
            <TabsTrigger value="month" className="min-h-[44px]">Last 30 days</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(summary?.month ?? 0).toFixed(2)}
                </div>
                {trend && (
                  <div className={`flex items-center gap-1 text-xs ${
                    trend.direction === "up" ? "text-red-500" : "text-green-500"
                  }`}>
                    {trend.direction === "up" ? (
                      <TrendingUp className="h-3 w-3" />
                    ) : (
                      <TrendingDown className="h-3 w-3" />
                    )}
                    {Math.abs(trend.percentChange).toFixed(1)}%
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Avg / Request</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  $
                  {costHistory && costHistory.length > 0
                    ? (
                        costHistory.reduce((sum: number, h: any) => sum + h.totalCost, 0) /
                        costHistory.reduce((sum: number, h: any) => sum + h.requestCount, 0)
                      ).toFixed(4)
                    : "0.0000"}
                </div>
                <p className="text-xs text-muted-foreground">per API call</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Tokens</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {costHistory
                    ? (
                        costHistory.reduce((sum: number, h: any) => sum + h.totalTokens, 0) /
                        1000000
                      ).toFixed(2)
                    : "0.00"}
                  M
                </div>
                <p className="text-xs text-muted-foreground">tokens processed</p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Agents</CardTitle>
            <Bot className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {costsByAgent?.length ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  agents with activity
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Main Analytics Sections */}
      <Tabs defaultValue="timeline" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:grid-cols-4">
          <TabsTrigger value="timeline" className="min-h-[44px]">
            <span className="hidden sm:inline">Time Analysis</span>
            <span className="sm:hidden">Time</span>
          </TabsTrigger>
          <TabsTrigger value="agents" className="min-h-[44px]">
            <span className="hidden sm:inline">Agent Analytics</span>
            <span className="sm:hidden">Agents</span>
          </TabsTrigger>
          <TabsTrigger value="models" className="min-h-[44px]">
            <span className="hidden sm:inline">Model Analytics</span>
            <span className="sm:hidden">Models</span>
          </TabsTrigger>
          <TabsTrigger value="tokens" className="min-h-[44px]">
            <span className="hidden sm:inline">Token Analytics</span>
            <span className="sm:hidden">Tokens</span>
          </TabsTrigger>
        </TabsList>

        {/* SECTION 1: Time-based Analysis */}
        <TabsContent value="timeline" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost Trend Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : costHistory && costHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <LineChart data={costHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) =>
                        new Date(ts).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tickFormatter={(value) => `$${value.toFixed(2)}`} />
                    <Tooltip
                      labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      formatter={(value: any) => [`$${value.toFixed(4)}`, "Cost"]}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="totalCost"
                      stroke="hsl(var(--primary))"
                      strokeWidth={2}
                      name="Total Cost"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">
                  No cost data available for the selected time range.
                </p>
              )}
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Requests Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : costHistory && costHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={costHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="timestamp"
                        tickFormatter={(ts) =>
                          new Date(ts).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })
                        }
                      />
                      <YAxis />
                      <Tooltip
                        labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      />
                      <Bar
                        dataKey="requestCount"
                        fill="hsl(var(--primary))"
                        name="Requests"
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No data available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cost Forecast</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : costHistory && costHistory.length >= 2 ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        Projected Monthly Cost
                      </p>
                      <p className="text-2xl font-bold">
                        $
                        {(() => {
                          const avgDailyCost =
                            costHistory.reduce(
                              (sum: number, h: any) => sum + h.totalCost,
                              0
                            ) / costHistory.length;
                          return (avgDailyCost * 30).toFixed(2);
                        })()}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Based on current usage patterns
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        Average Daily Spend
                      </p>
                      <p className="text-2xl font-bold">
                        $
                        {(
                          costHistory.reduce(
                            (sum: number, h: any) => sum + h.totalCost,
                            0
                          ) / costHistory.length
                        ).toFixed(4)}
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    Need more data for forecasting.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* SECTION 2: Agent-level Analytics */}
        <TabsContent value="agents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cost by Agent</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : costsByAgent && costsByAgent.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <BarChart
                      data={costsByAgent.slice(0, 10).map((item: any) => ({
                        ...item,
                        name:
                          agents?.find((a: any) => a._id === item.agentId)?.name ||
                          item.agentId.substring(0, 8),
                      }))}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis tickFormatter={(value) => `$${value}`} />
                      <Tooltip formatter={(value: any) => `$${value.toFixed(4)}`} />
                      <Bar
                        dataKey="totalCost"
                        fill="hsl(var(--primary))"
                        name="Total Cost"
                      />
                    </BarChart>
                  </ResponsiveContainer>

                  <div className="mt-6 overflow-x-auto">
                    <table className="w-full min-w-[600px] text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left p-2 whitespace-nowrap">Agent</th>
                          <th className="text-right p-2 whitespace-nowrap">Total Cost</th>
                          <th className="text-right p-2 whitespace-nowrap">Requests</th>
                          <th className="text-right p-2 whitespace-nowrap">Tokens</th>
                          <th className="text-right p-2 whitespace-nowrap">Avg / Request</th>
                          <th className="text-right p-2 whitespace-nowrap">Efficiency</th>
                        </tr>
                      </thead>
                      <tbody>
                        {costsByAgent.map((item: any) => {
                          const agent = agents?.find((a: any) => a._id === item.agentId);
                          const avgCost = item.totalCost / item.requestCount;
                          const costPerToken = item.totalCost / item.totalTokens;

                          return (
                            <tr key={item.agentId} className="border-b hover:bg-muted/50">
                              <td className="p-2 font-medium">
                                {agent?.name || item.agentId.substring(0, 12)}
                              </td>
                              <td className="text-right p-2">
                                ${item.totalCost.toFixed(4)}
                              </td>
                              <td className="text-right p-2">
                                {item.requestCount.toLocaleString()}
                              </td>
                              <td className="text-right p-2">
                                {(item.totalTokens / 1000).toFixed(1)}K
                              </td>
                              <td className="text-right p-2">
                                ${avgCost.toFixed(4)}
                              </td>
                              <td className="text-right p-2">
                                <span
                                  className={
                                    costPerToken < 0.00001
                                      ? "text-green-600"
                                      : costPerToken < 0.0001
                                        ? "text-yellow-600"
                                        : "text-red-600"
                                  }
                                >
                                  ${(costPerToken * 1000000).toFixed(2)}/1M
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">
                  No agent cost data available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 3: Model-level Analytics */}
        <TabsContent value="models" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Cost by Model</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : costsByModel && costsByModel.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <PieChart>
                      <Pie
                        data={costsByModel}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={(entry: any) =>
                          `${entry.model}: $${entry.totalCost.toFixed(2)}`
                        }
                        outerRadius={100}
                        fill="#8884d8"
                        dataKey="totalCost"
                      >
                        {costsByModel.map((_entry: any, index: number) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `$${value.toFixed(4)}`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No model cost data available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Model Usage Patterns</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : costsByModel && costsByModel.length > 0 ? (
                  <div className="space-y-4">
                    {costsByModel.map((item: any, index: number) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">{item.model}</span>
                          <span className="text-muted-foreground">
                            {item.requestCount} requests
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>Avg: ${item.avgCostPerRequest.toFixed(4)}</span>
                          <span>{(item.totalTokens / 1000).toFixed(1)}K tokens</span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                          <div
                            className="h-full transition-all"
                            style={{
                              width: `${(item.requestCount / costsByModel.reduce((sum: number, m: any) => sum + m.requestCount, 0)) * 100}%`,
                              backgroundColor: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No data available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Cost Optimization Recommendations</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : costsByModel && costsByModel.length > 0 ? (
                <div className="space-y-4">
                  {(() => {
                    // Find most expensive model
                    const mostExpensive = [...costsByModel].sort(
                      (a: any, b: any) => b.totalCost - a.totalCost
                    )[0];

                    // Find least efficient model (highest cost per token)
                    const leastEfficient = [...costsByModel].sort(
                      (a: any, b: any) =>
                        b.totalCost / b.totalTokens - a.totalCost / a.totalTokens
                    )[0];

                    const recommendations = [];

                    if (mostExpensive && (mostExpensive.model.includes("opus") || mostExpensive.model.includes("gpt-4"))) {
                      recommendations.push({
                        title: "Consider using smaller models for simple tasks",
                        description: `Your most expensive model is ${mostExpensive.model} ($${mostExpensive.totalCost.toFixed(2)}). For simple tasks like classification or extraction, consider using Haiku or GPT-3.5-turbo.`,
                        impact: "High",
                      });
                    }

                    if (leastEfficient && leastEfficient.totalCost / leastEfficient.totalTokens > 0.00005) {
                      recommendations.push({
                        title: "Optimize token usage",
                        description: `${leastEfficient.model} has high cost per token ($${(leastEfficient.totalCost / leastEfficient.totalTokens * 1000000).toFixed(2)}/1M tokens). Consider reducing system prompt length or using caching.`,
                        impact: "Medium",
                      });
                    }

                    recommendations.push({
                      title: "Enable prompt caching",
                      description: "For agents with long system prompts or repeated context, enable prompt caching to reduce costs by up to 90%.",
                      impact: "High",
                    });

                    return recommendations.map((rec, index) => (
                      <div key={index} className="p-4 rounded-lg border">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium">{rec.title}</h4>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              rec.impact === "High"
                                ? "bg-red-100 text-red-700"
                                : "bg-yellow-100 text-yellow-700"
                            }`}
                          >
                            {rec.impact} Impact
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{rec.description}</p>
                      </div>
                    ));
                  })()}
                </div>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">
                  Not enough data for recommendations.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* SECTION 4: Token Analytics */}
        <TabsContent value="tokens" className="space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Input vs Output Tokens</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : costHistory && costHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                    <PieChart>
                      <Pie
                        data={[
                          {
                            name: "Input Tokens",
                            value: costHistory.reduce(
                              (sum: number, h: any) => sum + (h.totalTokens * 0.6),
                              0
                            ),
                          },
                          {
                            name: "Output Tokens",
                            value: costHistory.reduce(
                              (sum: number, h: any) => sum + (h.totalTokens * 0.4),
                              0
                            ),
                          },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={100}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        <Cell fill={COLORS[0]} />
                        <Cell fill={COLORS[1]} />
                      </Pie>
                      <Tooltip
                        formatter={(value: any) => (value / 1000).toFixed(1) + "K"}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No token data available.
                  </p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Token Cost Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : costHistory && costHistory.length > 0 ? (
                  <div className="space-y-4">
                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        Total Tokens Processed
                      </p>
                      <p className="text-2xl font-bold">
                        {(
                          costHistory.reduce(
                            (sum: number, h: any) => sum + h.totalTokens,
                            0
                          ) / 1000000
                        ).toFixed(2)}
                        M
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        Average Cost per 1M Tokens
                      </p>
                      <p className="text-2xl font-bold">
                        $
                        {(() => {
                          const totalCost = costHistory.reduce(
                            (sum: number, h: any) => sum + h.totalCost,
                            0
                          );
                          const totalTokens = costHistory.reduce(
                            (sum: number, h: any) => sum + h.totalTokens,
                            0
                          );
                          return totalTokens > 0
                            ? ((totalCost / totalTokens) * 1000000).toFixed(2)
                            : "0.00";
                        })()}
                      </p>
                    </div>

                    <div className="p-4 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground mb-2">
                        Estimated Input:Output Ratio
                      </p>
                      <p className="text-2xl font-bold">1.5:1</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Typical for conversational AI
                      </p>
                    </div>
                  </div>
                ) : (
                  <p className="text-center text-sm text-muted-foreground py-12">
                    No data available.
                  </p>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Token Usage Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : costHistory && costHistory.length > 0 ? (
                <ResponsiveContainer width="100%" height={250} className="sm:h-[300px]">
                  <BarChart data={costHistory}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="timestamp"
                      tickFormatter={(ts) =>
                        new Date(ts).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })
                      }
                    />
                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}K`} />
                    <Tooltip
                      labelFormatter={(ts) => new Date(ts).toLocaleString()}
                      formatter={(value: any) => [(value / 1000).toFixed(1) + "K", "Tokens"]}
                    />
                    <Bar
                      dataKey="totalTokens"
                      fill="hsl(var(--primary))"
                      name="Total Tokens"
                    />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-center text-sm text-muted-foreground py-12">
                  No data available.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Toast notifications */}
      <Toaster position="bottom-right" />
    </div>
  );
}
