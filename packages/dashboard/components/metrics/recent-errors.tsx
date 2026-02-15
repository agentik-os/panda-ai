"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, AlertTriangle, Info } from "lucide-react";

interface ErrorEvent {
  id: string;
  timestamp: string;
  level: "fatal" | "error" | "warning" | "info";
  message: string;
  type?: string;
  agentId?: string;
}

interface RecentErrorsProps {
  errors: ErrorEvent[];
}

const levelConfig = {
  fatal: {
    icon: AlertCircle,
    variant: "destructive" as const,
    label: "Fatal",
  },
  error: {
    icon: AlertCircle,
    variant: "destructive" as const,
    label: "Error",
  },
  warning: {
    icon: AlertTriangle,
    variant: "secondary" as const,
    label: "Warning",
  },
  info: {
    icon: Info,
    variant: "default" as const,
    label: "Info",
  },
};

export function RecentErrors({ errors }: RecentErrorsProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertCircle className="h-4 w-4" />
            Recent Errors
          </CardTitle>
          <Badge variant="secondary">{errors.length}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {errors.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
              <AlertCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="mt-3 text-sm font-medium">No recent errors</p>
            <p className="text-xs text-muted-foreground">
              Your system is running smoothly
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {errors.map((error) => {
                const config = levelConfig[error.level];
                const Icon = config.icon;
                const timeAgo = getTimeAgo(error.timestamp);

                return (
                  <div
                    key={error.id}
                    className="rounded-md border p-3 text-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-start gap-2">
                        <Icon className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                        <div className="min-w-0">
                          <p className="break-words font-medium leading-tight">
                            {error.message}
                          </p>
                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <Badge
                              variant={config.variant}
                              className="text-xs"
                            >
                              {config.label}
                            </Badge>
                            {error.type && (
                              <span className="text-xs text-muted-foreground">
                                {error.type}
                              </span>
                            )}
                            {error.agentId && (
                              <span className="text-xs text-muted-foreground">
                                Agent: {error.agentId}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {timeAgo}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
