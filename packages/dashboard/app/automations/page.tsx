"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { HistoryTable } from "@/components/automations/history-table";
import { Plus, RefreshCw } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AutomationExecution } from "@agentik-os/shared";

export default function AutomationsPage() {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Mock data - will be replaced with Convex query
  const executions: AutomationExecution[] = [
    {
      id: "exec-001",
      automationId: "auto-001",
      automationName: "Daily Report Generator",
      trigger: { type: "cron", schedule: "0 9 * * *" },
      status: "success",
      startedAt: new Date(Date.now() - 3600000), // 1 hour ago
      completedAt: new Date(Date.now() - 3540000),
      duration: 60000,
      output: { report: "Generated successfully" },
      retryCount: 0,
      logs: [
        {
          timestamp: new Date(Date.now() - 3600000),
          level: "info",
          message: "Starting daily report generation",
        },
        {
          timestamp: new Date(Date.now() - 3570000),
          level: "info",
          message: "Fetching analytics data",
        },
        {
          timestamp: new Date(Date.now() - 3550000),
          level: "info",
          message: "Generating AI summary",
        },
        {
          timestamp: new Date(Date.now() - 3540000),
          level: "info",
          message: "Report sent successfully",
        },
      ],
    },
    {
      id: "exec-002",
      automationId: "auto-002",
      automationName: "User Onboarding",
      trigger: { type: "event", event: "user.created" },
      status: "failed",
      startedAt: new Date(Date.now() - 7200000), // 2 hours ago
      completedAt: new Date(Date.now() - 7180000),
      duration: 20000,
      error: {
        code: "EMAIL_SEND_FAILED",
        message: "Failed to send welcome email",
        stack: "Error: SMTP connection timeout\n  at sendEmail (email.ts:42)",
        actionIndex: 2,
      },
      retryCount: 3,
      logs: [
        {
          timestamp: new Date(Date.now() - 7200000),
          level: "info",
          message: "New user created: john@example.com",
        },
        {
          timestamp: new Date(Date.now() - 7190000),
          level: "info",
          message: "Creating Slack channel",
        },
        {
          timestamp: new Date(Date.now() - 7180000),
          level: "error",
          message: "Failed to send email: SMTP timeout",
        },
      ],
    },
    {
      id: "exec-003",
      automationId: "auto-001",
      automationName: "Daily Report Generator",
      trigger: { type: "cron", schedule: "0 9 * * *" },
      status: "running",
      startedAt: new Date(Date.now() - 300000), // 5 minutes ago
      retryCount: 0,
      logs: [
        {
          timestamp: new Date(Date.now() - 300000),
          level: "info",
          message: "Starting daily report generation",
        },
        {
          timestamp: new Date(Date.now() - 270000),
          level: "info",
          message: "Fetching analytics data",
        },
      ],
    },
  ];

  const handleRefresh = async () => {
    setIsRefreshing(true);
    // TODO: Refresh executions from Convex
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRefreshing(false);
  };

  const handleCreateNew = () => {
    router.push("/dashboard/automations/create");
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Automations</h1>
          <p className="text-sm text-muted-foreground sm:text-base">
            Manage your automation workflows and view execution history
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={handleRefresh}
            disabled={isRefreshing}
            variant="outline"
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-2 h-4 w-4" />
            Create Automation
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="history" className="space-y-4">
        <TabsList>
          <TabsTrigger value="history">Execution History</TabsTrigger>
          <TabsTrigger value="active">Active Automations</TabsTrigger>
          <TabsTrigger value="failed">Failed</TabsTrigger>
        </TabsList>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Executions</CardTitle>
              <CardDescription>
                View all automation execution history with logs and error tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryTable executions={executions} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Active Automations</CardTitle>
              <CardDescription>
                Automations that are currently enabled and running
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryTable
                executions={executions.filter((e) => e.status === "running")}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="failed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Failed Executions</CardTitle>
              <CardDescription>
                Automations that failed and need attention
              </CardDescription>
            </CardHeader>
            <CardContent>
              <HistoryTable
                executions={executions.filter((e) => e.status === "failed")}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
