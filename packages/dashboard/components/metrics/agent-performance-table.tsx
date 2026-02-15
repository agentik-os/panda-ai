"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bot, TrendingUp, TrendingDown } from "lucide-react";

interface AgentPerformance {
  agentId: string;
  name: string;
  executions: number;
  avgDurationMs: number;
  errorRate: number;
  totalCostUsd: number;
  trend: "up" | "down" | "stable";
}

interface AgentPerformanceTableProps {
  agents: AgentPerformance[];
}

export function AgentPerformanceTable({
  agents,
}: AgentPerformanceTableProps) {
  const sorted = [...agents].sort(
    (a, b) => b.executions - a.executions,
  );

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm font-medium">
          <Bot className="h-4 w-4" />
          Agent Performance
        </CardTitle>
      </CardHeader>
      <CardContent>
        {sorted.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No agent performance data yet.
          </p>
        ) : (
          <div className="space-y-3">
            {/* Header */}
            <div className="grid grid-cols-5 gap-2 text-xs font-medium text-muted-foreground">
              <span>Agent</span>
              <span className="text-right">Executions</span>
              <span className="text-right">Avg Duration</span>
              <span className="text-right">Error Rate</span>
              <span className="text-right">Cost</span>
            </div>

            {/* Rows */}
            {sorted.map((agent) => (
              <div
                key={agent.agentId}
                className="grid grid-cols-5 items-center gap-2 rounded-md border p-2 text-sm"
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-primary/10">
                    <Bot className="h-3 w-3 text-primary" />
                  </div>
                  <span className="truncate font-medium">{agent.name}</span>
                </div>

                <div className="flex items-center justify-end gap-1">
                  <span>{agent.executions.toLocaleString()}</span>
                  {agent.trend === "up" && (
                    <TrendingUp className="h-3 w-3 text-green-500" />
                  )}
                  {agent.trend === "down" && (
                    <TrendingDown className="h-3 w-3 text-red-500" />
                  )}
                </div>

                <span className="text-right text-muted-foreground">
                  {agent.avgDurationMs < 1000
                    ? `${agent.avgDurationMs.toFixed(0)}ms`
                    : `${(agent.avgDurationMs / 1000).toFixed(1)}s`}
                </span>

                <div className="text-right">
                  <Badge
                    variant={
                      agent.errorRate > 10
                        ? "destructive"
                        : agent.errorRate > 5
                          ? "secondary"
                          : "default"
                    }
                    className="text-xs"
                  >
                    {agent.errorRate.toFixed(1)}%
                  </Badge>
                </div>

                <span className="text-right font-medium">
                  ${agent.totalCostUsd.toFixed(4)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
