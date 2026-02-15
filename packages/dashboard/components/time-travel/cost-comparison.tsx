"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, TrendingDown } from "lucide-react";

interface CostComparisonProps {
  original: {
    model: string;
    cost: string;
    tokens: number;
  };
  replayed: {
    model: string;
    cost: string;
    tokens: number;
  };
}

export function CostComparison({ original, replayed }: CostComparisonProps) {
  // Parse costs
  const originalCost = parseFloat(original.cost.replace("$", ""));
  const replayedCost = parseFloat(replayed.cost.replace("$", ""));
  const savings = originalCost - replayedCost;
  const savingsPercent = ((savings / originalCost) * 100).toFixed(0);

  // Token efficiency
  const originalCostPerK = ((originalCost / original.tokens) * 1000).toFixed(4);
  const replayedCostPerK = ((replayedCost / replayed.tokens) * 1000).toFixed(4);

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Original Cost */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Original Cost</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{original.cost}</span>
            <Badge variant="outline" className="text-xs">
              {original.model}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {original.tokens.toLocaleString()} tokens • ${originalCostPerK}/1K
          </div>
        </div>
      </Card>

      {/* Replayed Cost */}
      <Card className="p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Replayed Cost</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold">{replayed.cost}</span>
            <Badge variant="secondary" className="text-xs">
              {replayed.model}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">
            {replayed.tokens.toLocaleString()} tokens • ${replayedCostPerK}/1K
          </div>
        </div>
      </Card>

      {/* Savings */}
      <Card className="border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/20">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <TrendingDown className="h-4 w-4 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-900 dark:text-green-100">
              Cost Savings
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-green-900 dark:text-green-100">
              ${savings.toFixed(2)}
            </span>
            <Badge
              variant="default"
              className="bg-green-600 text-xs text-white dark:bg-green-500"
            >
              -{savingsPercent}%
            </Badge>
          </div>
          <div className="text-xs text-green-700 dark:text-green-300">
            {savings > 0 ? "Cheaper model with similar quality" : "No savings"}
          </div>
        </div>
      </Card>
    </div>
  );
}
