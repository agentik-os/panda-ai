"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bot } from "lucide-react";
import { useQuery, api } from "@/lib/convex";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import Link from "next/link";

export default function CostByAgentWidget() {
  const costsByAgent = useQuery(api.queries.costs.byAgent, {});
  const agents = useQuery(api.queries.agents.list, {});

  if (costsByAgent === undefined || agents === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost by Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  // Get top 5 agents by cost
  const top5 = costsByAgent.slice(0, 5);

  // Map agent IDs to names
  const agentMap = new Map(agents.map((a: any) => [a._id, a.name]));

  const chartData = top5.map((item: any) => ({
    name: agentMap.get(item.agentId) || item.agentId.substring(0, 8),
    cost: parseFloat(item.totalCost.toFixed(4)),
    agentId: item.agentId,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="h-5 w-5" />
          Cost by Agent (Top 5)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Bot className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-sm text-muted-foreground">
              No agent cost data yet.
            </p>
          </div>
        ) : (
          <>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <XAxis
                  dataKey="name"
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="#888888"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `$${value}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      return (
                        <div className="rounded-lg border bg-background p-2 shadow-sm">
                          <div className="grid gap-2">
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Agent
                              </span>
                              <span className="font-bold text-muted-foreground">
                                {payload[0].payload.name}
                              </span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[0.70rem] uppercase text-muted-foreground">
                                Cost
                              </span>
                              <span className="font-bold">
                                ${payload[0].value}
                              </span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="cost"
                  fill="hsl(var(--primary))"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>

            {/* Agent List */}
            <div className="mt-4 space-y-2">
              {top5.map((item: any, i: number) => (
                <Link
                  key={item.agentId}
                  href={`/dashboard/agents/${item.agentId}`}
                  className="flex items-center justify-between p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold">
                      {i + 1}
                    </div>
                    <span className="text-sm font-medium truncate max-w-[150px]">
                      {agentMap.get(item.agentId) || item.agentId.substring(0, 8)}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">${item.totalCost.toFixed(4)}</p>
                    <p className="text-xs text-muted-foreground">
                      {item.requestCount} requests
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
