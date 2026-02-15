"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, TrendingUp, TrendingDown } from "lucide-react";
import { useQuery, api } from "@/lib/convex";

export default function CostSummaryWidget() {
  const summary = useQuery(api.queries.costs.summary);
  const history = useQuery(api.queries.costs.history, {
    granularity: "day",
    startDate: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
  });

  if (summary === undefined || history === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Cost Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="h-20 animate-pulse bg-muted rounded" />
            <div className="h-20 animate-pulse bg-muted rounded" />
            <div className="h-20 animate-pulse bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate trends (compare today vs yesterday, this week vs last week)
  const yesterday = history && history.length >= 2 ? history[history.length - 2]?.totalCost ?? 0 : 0;
  const todayTrend = summary.today > yesterday
    ? { direction: "up", percentage: yesterday > 0 ? ((summary.today - yesterday) / yesterday) * 100 : 0 }
    : { direction: "down", percentage: yesterday > 0 ? ((yesterday - summary.today) / yesterday) * 100 : 0 };

  const lastWeek = history && history.length >= 7
    ? history.slice(0, 7).reduce((sum: number, day: any) => sum + day.totalCost, 0)
    : 0;
  const thisWeek = history && history.length >= 7
    ? history.slice(-7).reduce((sum: number, day: any) => sum + day.totalCost, 0)
    : summary.month;
  const weekTrend = thisWeek > lastWeek
    ? { direction: "up", percentage: lastWeek > 0 ? ((thisWeek - lastWeek) / lastWeek) * 100 : 0 }
    : { direction: "down", percentage: lastWeek > 0 ? ((lastWeek - thisWeek) / lastWeek) * 100 : 0 };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Cost Summary
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Today */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">Today</p>
            {todayTrend.percentage > 0 && (
              <div className={`flex items-center gap-1 text-xs ${
                todayTrend.direction === "up" ? "text-red-500" : "text-green-500"
              }`}>
                {todayTrend.direction === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {todayTrend.percentage.toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold">${summary.today.toFixed(4)}</p>
        </div>

        {/* This Week */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">This Week</p>
            {weekTrend.percentage > 0 && (
              <div className={`flex items-center gap-1 text-xs ${
                weekTrend.direction === "up" ? "text-red-500" : "text-green-500"
              }`}>
                {weekTrend.direction === "up" ? (
                  <TrendingUp className="h-3 w-3" />
                ) : (
                  <TrendingDown className="h-3 w-3" />
                )}
                {weekTrend.percentage.toFixed(1)}%
              </div>
            )}
          </div>
          <p className="text-2xl font-bold">${thisWeek.toFixed(4)}</p>
        </div>

        {/* This Month */}
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-bold">${summary.month.toFixed(2)}</p>
        </div>

        {/* Spend by Provider */}
        <div className="pt-4 border-t">
          <p className="text-sm font-medium mb-3">Top Models</p>
          <div className="space-y-2">
            {summary.modelBreakdown.slice(0, 3).map((item: any, i: number) => (
              <div key={i} className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground truncate max-w-[150px]">
                  {item.model}
                </span>
                <span className="font-medium">${item.cost.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
