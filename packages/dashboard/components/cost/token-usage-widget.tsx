"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap } from "lucide-react";
import { useQuery, api } from "@/lib/convex";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

export default function TokenUsageWidget() {
  // Fetch all costs to calculate token breakdown
  const costData = useQuery(api.queries.costs.summary);

  if (costData === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Token Usage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Calculate total input/output tokens from cost data
  // Note: We'll need to add a query to get token breakdown
  // For now, using mock data structure - will be replaced with real query
  const tokenData = [
    { name: "Input Tokens", value: 125000, color: "hsl(var(--chart-1))" },
    { name: "Output Tokens", value: 75000, color: "hsl(var(--chart-2))" },
  ];

  const totalTokens = tokenData.reduce((sum, item) => sum + item.value, 0);

  // Calculate cost per 1M tokens (approximate)
  const costPer1M = totalTokens > 0 ? (costData.month / totalTokens) * 1_000_000 : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Token Usage
        </CardTitle>
      </CardHeader>
      <CardContent>
        {totalTokens === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Zap className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No token usage data yet.
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={tokenData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {tokenData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const percentage = ((payload[0].value as number) / totalTokens * 100).toFixed(1);
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                {payload[0].name}
                              </span>
                              <span className="font-bold">
                                {(payload[0].value as number).toLocaleString()} ({percentage}%)
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  content={({ payload }) => (
                    <div className="flex justify-center gap-4 text-sm">
                      {payload?.map((entry, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <div
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: entry.color }}
                          />
                          <span className="text-muted-foreground">{entry.value}</span>
                        </div>
                      ))}
                    </div>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>

            {/* Stats */}
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Total Tokens</span>
                <span className="text-sm font-bold">{totalTokens.toLocaleString()}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Cost per 1M Tokens</span>
                <span className="text-sm font-bold">${costPer1M.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                <span className="text-sm text-muted-foreground">Input:Output Ratio</span>
                <span className="text-sm font-bold">
                  {tokenData[0] && tokenData[1] ? (tokenData[0].value / tokenData[1].value).toFixed(2) : "0.00"}:1
                </span>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
