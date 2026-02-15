"use client";

// Force dynamic rendering (prevents build-time SSG errors with Convex)
export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Bot,
  DollarSign,
  Zap,
  Activity,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";
import { useQuery, api } from "@/lib/convex";
import CostSummaryWidget from "@/components/cost/cost-summary-widget";
import CostByAgentWidget from "@/components/cost/cost-by-agent-widget";
import TokenUsageWidget from "@/components/cost/token-usage-widget";
import BudgetAlertWidget from "@/components/cost/budget-alert-widget";

export default function DashboardPage() {
  // Fetch agent statistics
  const agentStats = useQuery(api.queries.agents.stats, {});

  // Fetch recent agents (limit 4 for overview)
  const recentAgents = useQuery(api.queries.agents.list, {
    limit: 4,
  });

  // Fetch cost summary
  const costSummary = useQuery(api.queries.costs.summary);

  // Loading state
  const isLoading = agentStats === undefined || recentAgents === undefined || costSummary === undefined;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Overview</h1>
        <p className="text-sm text-muted-foreground sm:text-base">
          Monitor your AI agents, costs, and system performance.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                <div className="text-2xl font-bold">{agentStats?.activeAgents ?? 0}</div>
                <p className="text-xs text-muted-foreground">
                  {agentStats?.totalAgents ?? 0} total agents
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Cost
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  ${(costSummary?.month ?? 0).toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">
                  ${(costSummary?.today ?? 0).toFixed(2)} today
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Total Messages
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {agentStats?.totalMessages?.toLocaleString() ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  {agentStats?.totalConversations ?? 0} conversations
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Active Skills
            </CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            ) : (
              <>
                <div className="text-2xl font-bold">
                  {recentAgents?.reduce((acc: number, agent: any) => acc + agent.skills.length, 0) ?? 0}
                </div>
                <p className="text-xs text-muted-foreground">
                  across all agents
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cost Widgets */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <CostSummaryWidget />
        <CostByAgentWidget />
        <TokenUsageWidget />
        <BudgetAlertWidget />
      </div>

      {/* Recent Activity & Quick Actions */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Agents */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Recent Agents</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/agents">
                  View all
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : recentAgents && recentAgents.length > 0 ? (
              <div className="space-y-4">
                {recentAgents.map((agent: any) => (
                  <div key={agent._id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                        <Bot className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{agent.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {agent.messageCount ?? 0} messages
                        </p>
                      </div>
                    </div>
                    <Badge
                      variant={agent.status === "active" ? "default" : "secondary"}
                    >
                      {agent.status}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No agents yet. Create your first agent!
              </p>
            )}
          </CardContent>
        </Card>

        {/* Cost Breakdown */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Cost Breakdown</CardTitle>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/dashboard/costs">
                  View details
                  <ArrowRight className="ml-1 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : costSummary && costSummary.modelBreakdown.length > 0 ? (
              <div className="space-y-4">
                {costSummary.modelBreakdown.slice(0, 4).map((item: any, i: number) => {
                  const percentage = costSummary.month > 0
                    ? (item.cost / costSummary.month) * 100
                    : 0;
                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="font-medium">{item.model}</span>
                        <span className="text-muted-foreground">
                          ${item.cost.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No cost data yet. Start using agents to see costs.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
