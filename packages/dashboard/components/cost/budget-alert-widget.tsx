"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle, TrendingUp, Settings } from "lucide-react";
import { useQuery, api } from "@/lib/convex";
import Link from "next/link";

// Mock budget settings - in real app, this would come from user settings
const BUDGET_SETTINGS = {
  monthly: 100, // $100/month budget
  warning: 0.75, // 75% warning threshold
  critical: 0.9, // 90% critical threshold
};

export default function BudgetAlertWidget() {
  const summary = useQuery(api.queries.costs.summary);

  if (summary === undefined) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Budget Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[200px] animate-pulse bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  const monthSpend = summary.month;
  const budgetUsed = (monthSpend / BUDGET_SETTINGS.monthly) * 100;
  const remaining = BUDGET_SETTINGS.monthly - monthSpend;

  // Determine status
  const getStatus = () => {
    if (budgetUsed >= BUDGET_SETTINGS.critical * 100) {
      return { level: "critical", color: "destructive", icon: AlertCircle, text: "Critical" };
    } else if (budgetUsed >= BUDGET_SETTINGS.warning * 100) {
      return { level: "warning", color: "default", icon: TrendingUp, text: "Warning" };
    } else {
      return { level: "healthy", color: "secondary", icon: CheckCircle, text: "Healthy" };
    }
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Calculate daily burn rate
  const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate();
  const currentDay = new Date().getDate();
  const dailyBurnRate = monthSpend / currentDay;
  const projectedMonthEnd = dailyBurnRate * daysInMonth;

  const willExceedBudget = projectedMonthEnd > BUDGET_SETTINGS.monthly;

  return (
    <Card className={status.level === "critical" ? "border-destructive" : ""}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <StatusIcon className="h-5 w-5" />
            Budget Status
          </CardTitle>
          <Badge variant={status.color as any}>{status.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Budget Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Monthly Budget</span>
            <span className="text-sm text-muted-foreground">
              {budgetUsed.toFixed(1)}% used
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full transition-all ${
                status.level === "critical"
                  ? "bg-destructive"
                  : status.level === "warning"
                    ? "bg-orange-500"
                    : "bg-primary"
              }`}
              style={{ width: `${Math.min(budgetUsed, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs">
            <span className="text-muted-foreground">
              ${monthSpend.toFixed(2)} spent
            </span>
            <span className="text-muted-foreground">
              ${BUDGET_SETTINGS.monthly.toFixed(2)} budget
            </span>
          </div>
        </div>

        {/* Remaining */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Remaining</p>
          <p className={`text-2xl font-bold ${remaining < 0 ? "text-destructive" : ""}`}>
            ${Math.max(remaining, 0).toFixed(2)}
          </p>
        </div>

        {/* Projection */}
        <div className="p-3 rounded-lg bg-muted/50">
          <p className="text-sm text-muted-foreground">Projected Month-End</p>
          <p className={`text-lg font-bold ${willExceedBudget ? "text-destructive" : ""}`}>
            ${projectedMonthEnd.toFixed(2)}
          </p>
          {willExceedBudget && (
            <p className="text-xs text-destructive mt-1">
              ⚠️ Will exceed budget by ${(projectedMonthEnd - BUDGET_SETTINGS.monthly).toFixed(2)}
            </p>
          )}
        </div>

        {/* Daily Burn Rate */}
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Daily Burn Rate</span>
          <span className="font-medium">${dailyBurnRate.toFixed(4)}/day</span>
        </div>

        {/* Warning Messages */}
        {status.level === "critical" && (
          <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <p className="text-sm text-destructive font-medium">
              ⚠️ Budget exceeded! Consider pausing non-essential agents.
            </p>
          </div>
        )}

        {status.level === "warning" && (
          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              ⚠️ Approaching budget limit. Monitor usage carefully.
            </p>
          </div>
        )}

        {/* Settings Link */}
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link href="/dashboard/settings">
            <Settings className="mr-2 h-4 w-4" />
            Configure Budget
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
