"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Info, AlertTriangle, Bug } from "lucide-react";
import type { AutomationExecution, AutomationLog } from "@agentik-os/shared";

interface LogViewerProps {
  execution: AutomationExecution;
  isOpen: boolean;
  onClose: () => void;
}

const LOG_LEVEL_CONFIG: Record<
  AutomationLog["level"],
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
  }
> = {
  info: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
  },
  warn: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
  },
  error: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
  },
  debug: {
    icon: Bug,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
  },
};

export function LogViewer({ execution, isOpen, onClose }: LogViewerProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: false,
    });
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    return `${(ms / 60000).toFixed(2)}m`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{execution.automationName}</DialogTitle>
          <DialogDescription>
            Execution ID: {execution.id}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Execution Summary */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Status:</span>
                  <Badge className="ml-2" variant={execution.status === "success" ? "default" : execution.status === "failed" ? "destructive" : "secondary"}>
                    {execution.status}
                  </Badge>
                </div>
                <div>
                  <span className="text-muted-foreground">Started:</span>
                  <span className="ml-2 font-medium">
                    {execution.startedAt.toLocaleString()}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Duration:</span>
                  <span className="ml-2 font-medium">
                    {execution.duration ? formatDuration(execution.duration) : "In progress"}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">Retries:</span>
                  <span className="ml-2 font-medium">{execution.retryCount}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Error Details */}
          {execution.error && (
            <Card className="border-destructive">
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-destructive" />
                    <h3 className="font-semibold text-sm">Error Details</h3>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div>
                      <span className="text-muted-foreground">Code:</span>
                      <code className="ml-2 px-2 py-0.5 rounded bg-muted">
                        {execution.error.code}
                      </code>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Message:</span>
                      <p className="ml-2 font-medium text-destructive">
                        {execution.error.message}
                      </p>
                    </div>
                    {execution.error.actionIndex !== undefined && (
                      <div>
                        <span className="text-muted-foreground">Failed at action:</span>
                        <span className="ml-2 font-medium">#{execution.error.actionIndex}</span>
                      </div>
                    )}
                    {execution.error.stack && (
                      <div className="mt-2">
                        <span className="text-muted-foreground">Stack trace:</span>
                        <pre className="mt-1 p-2 rounded bg-muted text-xs overflow-x-auto">
                          {execution.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs */}
          <Card className="flex-1 overflow-hidden flex flex-col">
            <CardContent className="pt-6 flex-1 overflow-hidden flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-sm">Execution Logs</h3>
                <Badge variant="outline" className="text-xs">
                  {execution.logs.length} entries
                </Badge>
              </div>
              <ScrollArea className="flex-1">
                <div className="space-y-2">
                  {execution.logs.map((log, index) => {
                    const config = LOG_LEVEL_CONFIG[log.level];
                    const LogIcon = config.icon;

                    return (
                      <div
                        key={index}
                        className={`flex gap-3 p-3 rounded-lg ${config.bgColor}`}
                      >
                        <LogIcon className={`h-4 w-4 mt-0.5 shrink-0 ${config.color}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline gap-2 mb-1">
                            <span className="text-xs font-mono text-muted-foreground">
                              {formatTime(log.timestamp)}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {log.level}
                            </Badge>
                          </div>
                          <p className="text-sm break-words">{log.message}</p>
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <pre className="mt-2 text-xs bg-background/50 p-2 rounded overflow-x-auto">
                              {JSON.stringify(log.metadata, null, 2)}
                            </pre>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Output */}
          {execution.output !== undefined && (
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-semibold text-sm mb-2">Execution Output</h3>
                <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                  {String(JSON.stringify(execution.output, null, 2))}
                </pre>
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
