"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertTriangle, AlertCircle, Info, Shield } from "lucide-react";
import type { MarketplaceSecurityScan, MarketplaceSecurityFinding } from "@agentik-os/shared";

interface SecurityReportProps {
  scan: MarketplaceSecurityScan;
}

const SEVERITY_CONFIG: Record<
  MarketplaceSecurityFinding["severity"],
  {
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
    variant: "default" | "destructive" | "secondary" | "outline";
  }
> = {
  critical: {
    icon: AlertCircle,
    color: "text-red-600",
    bgColor: "bg-red-50",
    variant: "destructive",
  },
  high: {
    icon: AlertTriangle,
    color: "text-orange-600",
    bgColor: "bg-orange-50",
    variant: "destructive",
  },
  medium: {
    icon: AlertTriangle,
    color: "text-amber-600",
    bgColor: "bg-amber-50",
    variant: "secondary",
  },
  low: {
    icon: Info,
    color: "text-blue-600",
    bgColor: "bg-blue-50",
    variant: "outline",
  },
  info: {
    icon: Info,
    color: "text-gray-600",
    bgColor: "bg-gray-50",
    variant: "outline",
  },
};

export function SecurityReport({ scan }: SecurityReportProps) {
  const getStatusBadgeVariant = (status: MarketplaceSecurityScan["status"]): "default" | "destructive" | "secondary" => {
    if (status === "passed") return "default";
    if (status === "failed") return "destructive";
    return "secondary";
  };

  const countBySeverity = (severity: MarketplaceSecurityFinding["severity"]) => {
    return scan.findings.filter((f: MarketplaceSecurityFinding) => f.severity === severity).length;
  };

  return (
    <ScrollArea className="h-full">
      <div className="space-y-4 pr-4">
        {/* Overall Summary */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Security Scan Status</CardTitle>
              <Badge variant={getStatusBadgeVariant(scan.status)} className="text-xs">
                {scan.status.toUpperCase()}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {scan.scannedAt && (
                <div>
                  <span className="text-muted-foreground">Scanned:</span>
                  <span className="ml-2 font-medium">
                    {scan.scannedAt.toLocaleString()}
                  </span>
                </div>
              )}
              <div className="col-span-2">
                <div className="flex gap-2">
                  <Badge variant="destructive" className="text-xs">
                    {countBySeverity("critical")} Critical
                  </Badge>
                  <Badge variant="destructive" className="text-xs">
                    {countBySeverity("high")} High
                  </Badge>
                  <Badge variant="secondary" className="text-xs">
                    {countBySeverity("medium")} Medium
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {countBySeverity("low")} Low
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {countBySeverity("info")} Info
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Findings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              <CardTitle className="text-base">Security Findings</CardTitle>
              <Badge variant="outline" className="text-xs">
                {scan.findings.length} issues
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {scan.findings.map((finding: MarketplaceSecurityFinding, index: number) => {
                const config = SEVERITY_CONFIG[finding.severity];
                const FindingIcon = config.icon;

                return (
                  <div
                    key={index}
                    className={`rounded-lg p-3 ${config.bgColor}`}
                  >
                    <div className="flex items-start gap-3">
                      <FindingIcon className={`h-5 w-5 mt-0.5 shrink-0 ${config.color}`} />
                      <div className="flex-1 min-w-0 space-y-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-semibold text-sm">{finding.title}</h4>
                          <Badge variant={config.variant} className="text-xs">
                            {finding.severity}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {finding.description}
                        </p>
                        {finding.location && (
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-muted-foreground">Location:</span>
                            <code className="px-2 py-0.5 rounded bg-background text-xs">
                              {finding.location}
                            </code>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {scan.findings.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-muted-foreground">
                    No security findings - all checks passed!
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

      </div>
    </ScrollArea>
  );
}
