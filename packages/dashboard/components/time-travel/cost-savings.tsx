"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { DollarSign, TrendingDown, Zap, Target } from "lucide-react";

// Mock analytics data
const savingsByModel = [
  { model: "haiku-4", replays: 25, originalCost: 120.5, replayCost: 22.4, savings: 98.1 },
  { model: "sonnet-4", replays: 15, originalCost: 85.2, replayCost: 34.8, savings: 50.4 },
  { model: "gpt-4o-mini", replays: 7, originalCost: 45.8, replayCost: 12.3, savings: 33.5 },
];

const savingsOverTime = [
  { date: "Feb 8", savings: 12.5 },
  { date: "Feb 9", savings: 18.2 },
  { date: "Feb 10", savings: 24.8 },
  { date: "Feb 11", savings: 15.6 },
  { date: "Feb 12", savings: 22.1 },
  { date: "Feb 13", savings: 19.7 },
  { date: "Feb 14", savings: 11.6 },
];

const modelDistribution = [
  { name: "Haiku 4", value: 25, color: "#8b5cf6" },
  { name: "Sonnet 4", value: 15, color: "#3b82f6" },
  { name: "GPT-4o Mini", value: 7, color: "#10b981" },
];

const CHART_COLORS = ["#8b5cf6", "#3b82f6", "#10b981", "#f59e0b", "#ef4444"];

export function CostSavingsAnalytics() {
  const totalSavings = savingsByModel.reduce((sum, model) => sum + model.savings, 0);
  const totalReplays = savingsByModel.reduce((sum, model) => sum + model.replays, 0);
  const avgSavingsPerReplay = totalSavings / totalReplays;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Savings</p>
              <p className="text-2xl font-bold">${totalSavings.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20">
              <Zap className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Replays</p>
              <p className="text-2xl font-bold">{totalReplays}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/20">
              <Target className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg per Replay</p>
              <p className="text-2xl font-bold">${avgSavingsPerReplay.toFixed(2)}</p>
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/20">
              <TrendingDown className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Avg Reduction</p>
              <p className="text-2xl font-bold">73%</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Savings by Model */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Savings by Model</CardTitle>
                <CardDescription>
                  Cost reduction per cheaper model
                </CardDescription>
              </div>
              <Select defaultValue="7d">
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">7 days</SelectItem>
                  <SelectItem value="30d">30 days</SelectItem>
                  <SelectItem value="90d">90 days</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={savingsByModel}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="model"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                />
                <Bar dataKey="savings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            {/* Model Details */}
            <div className="mt-4 space-y-2">
              {savingsByModel.map((model, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div
                      className="h-3 w-3 rounded"
                      style={{ backgroundColor: CHART_COLORS[i] }}
                    />
                    <span className="font-medium">{model.model}</span>
                  </div>
                  <div className="flex gap-4 text-muted-foreground">
                    <span>{model.replays} replays</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      ${model.savings.toFixed(2)} saved
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Model Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Replay Distribution</CardTitle>
            <CardDescription>
              Breakdown by cheaper model used
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={modelDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(props: any) =>
                    `${props.name ?? ""} ${((props.percent ?? 0) * 100).toFixed(0)}%`
                  }
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {modelDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>

            {/* Legend */}
            <div className="mt-4 flex flex-wrap justify-center gap-4">
              {modelDistribution.map((model, i) => (
                <div key={i} className="flex items-center gap-2 text-sm">
                  <div
                    className="h-3 w-3 rounded-full"
                    style={{ backgroundColor: model.color }}
                  />
                  <span className="text-muted-foreground">
                    {model.name}: {model.value}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Savings Over Time */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Savings Trend</CardTitle>
            <CardDescription>
              Daily cost reduction from replays
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={savingsOverTime}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                  dataKey="date"
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <YAxis
                  className="text-xs"
                  tick={{ fill: "hsl(var(--muted-foreground))" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--background))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "var(--radius)",
                  }}
                  formatter={(value: any) => [`$${Number(value ?? 0).toFixed(2)}`, "Savings"]}
                />
                <Bar dataKey="savings" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>

            <div className="mt-4 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
              <div className="flex items-center gap-2 text-sm text-green-900 dark:text-green-100">
                <TrendingDown className="h-4 w-4" />
                <span className="font-semibold">
                  Average daily savings: $
                  {(
                    savingsOverTime.reduce((sum, day) => sum + day.savings, 0) /
                    savingsOverTime.length
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            Optimization Recommendations
          </CardTitle>
          <CardDescription>
            Suggestions to maximize cost savings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex gap-3 rounded-lg border p-4">
              <Badge variant="default">High Impact</Badge>
              <div className="flex-1">
                <p className="font-medium">
                  Replay customer support conversations with Haiku
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Support conversations average 81% savings with Haiku while
                  maintaining 95%+ quality. Estimated monthly savings: $230.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border p-4">
              <Badge variant="secondary">Medium Impact</Badge>
              <div className="flex-1">
                <p className="font-medium">
                  Use Sonnet for code reviews instead of Opus
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Code reviews show 58% cost reduction with Sonnet while keeping
                  quality above 92%. Estimated monthly savings: $145.
                </p>
              </div>
            </div>

            <div className="flex gap-3 rounded-lg border p-4">
              <Badge variant="outline">Experimental</Badge>
              <div className="flex-1">
                <p className="font-medium">
                  Test GPT-4o Mini for simple research queries
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Simple research tasks could save 85% with GPT-4o Mini. Run
                  replays to validate quality before switching.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
