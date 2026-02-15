"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { LogViewer } from "@/components/automations/log-viewer";
import { FileText, CheckCircle2, XCircle, Loader2, Clock } from "lucide-react";
import { useState } from "react";
import type { AutomationExecution, AutomationExecutionStatus } from "@agentik-os/shared";

interface HistoryTableProps {
  executions: AutomationExecution[];
}

const STATUS_CONFIG: Record<
  AutomationExecutionStatus,
  {
    icon: React.ComponentType<{ className?: string }>;
    variant: "default" | "destructive" | "secondary" | "outline";
    color: string;
  }
> = {
  success: {
    icon: CheckCircle2,
    variant: "default",
    color: "text-green-500",
  },
  failed: {
    icon: XCircle,
    variant: "destructive",
    color: "text-red-500",
  },
  running: {
    icon: Loader2,
    variant: "secondary",
    color: "text-blue-500",
  },
  pending: {
    icon: Clock,
    variant: "outline",
    color: "text-gray-500",
  },
  cancelled: {
    icon: XCircle,
    variant: "outline",
    color: "text-gray-500",
  },
  retrying: {
    icon: Loader2,
    variant: "secondary",
    color: "text-amber-500",
  },
};

export function HistoryTable({ executions }: HistoryTableProps) {
  const [selectedExecution, setSelectedExecution] = useState<AutomationExecution | null>(null);

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  };

  const formatTimestamp = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) return "Just now";
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (executions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-sm text-muted-foreground">No executions found</p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Automation
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Status
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Trigger
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Started
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Duration
              </th>
              <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">
                Retries
              </th>
              <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {executions.map((execution) => {
              const statusConfig = STATUS_CONFIG[execution.status];
              const StatusIcon = statusConfig.icon;

              return (
                <tr key={execution.id} className="border-b hover:bg-accent/50">
                  <td className="py-3 px-4">
                    <div className="font-medium text-sm">{execution.automationName}</div>
                    <div className="text-xs text-muted-foreground">{execution.automationId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <Badge variant={statusConfig.variant} className="gap-1">
                      <StatusIcon
                        className={`h-3 w-3 ${execution.status === "running" || execution.status === "retrying" ? "animate-spin" : ""}`}
                      />
                      {execution.status}
                    </Badge>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-sm">
                      {execution.trigger.type === "cron" && (
                        <Badge variant="outline" className="text-xs">
                          Schedule: {execution.trigger.schedule}
                        </Badge>
                      )}
                      {execution.trigger.type === "event" && (
                        <Badge variant="outline" className="text-xs">
                          Event: {execution.trigger.event}
                        </Badge>
                      )}
                      {execution.trigger.type === "webhook" && (
                        <Badge variant="outline" className="text-xs">
                          Webhook: {execution.trigger.path}
                        </Badge>
                      )}
                      {execution.trigger.type === "manual" && (
                        <Badge variant="outline" className="text-xs">
                          Manual
                        </Badge>
                      )}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {formatTimestamp(execution.startedAt)}
                  </td>
                  <td className="py-3 px-4 text-sm">
                    {execution.duration ? (
                      formatDuration(execution.duration)
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    {execution.retryCount > 0 ? (
                      <Badge variant="outline" className="text-xs">
                        {execution.retryCount}
                      </Badge>
                    ) : (
                      <span className="text-sm text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedExecution(execution)}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      View Logs
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Log Viewer Modal */}
      {selectedExecution && (
        <LogViewer
          execution={selectedExecution}
          isOpen={!!selectedExecution}
          onClose={() => setSelectedExecution(null)}
        />
      )}
    </>
  );
}
