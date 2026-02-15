"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { AlertTriangle } from "lucide-react";

interface ErrorDataPoint {
  timestamp: string;
  errors: number;
  warnings: number;
}

interface ErrorRateGraphProps {
  data: ErrorDataPoint[];
  currentRate: number;
}

export function ErrorRateGraph({ data, currentRate }: ErrorRateGraphProps) {
  const formattedData = data.map((d) => ({
    ...d,
    time: new Date(d.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    }),
  }));

  const rateStatus =
    currentRate > 5
      ? "critical"
      : currentRate > 1
        ? "warning"
        : "healthy";

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm font-medium">
            <AlertTriangle className="h-4 w-4" />
            Error Rate
          </CardTitle>
          <Badge
            variant={
              rateStatus === "critical"
                ? "destructive"
                : rateStatus === "warning"
                  ? "secondary"
                  : "default"
            }
          >
            {currentRate.toFixed(1)}/min
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-[200px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={formattedData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 12 }}
                className="text-muted-foreground"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "var(--radius)",
                  color: "hsl(var(--popover-foreground))",
                }}
              />
              <Bar
                dataKey="errors"
                fill="hsl(var(--destructive))"
                name="Errors"
                radius={[2, 2, 0, 0]}
              />
              <Bar
                dataKey="warnings"
                fill="hsl(var(--chart-4, 43 74% 66%))"
                name="Warnings"
                radius={[2, 2, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
