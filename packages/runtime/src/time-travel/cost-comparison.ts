/**
 * Cost Comparison
 *
 * Compare costs between original and replayed executions.
 * Answers: "How much would I save if I used Sonnet instead of Opus?"
 *
 * Step 113: Detailed cost analysis with breakdowns
 */

import type { TimelineEvent } from "../storage/convex-adapter";

// ============================================================================
// Types
// ============================================================================

export interface CostComparison {
  /** Original cost entry */
  original: CostBreakdown;

  /** Replayed cost entry */
  replayed: CostBreakdown;

  /** Absolute savings (negative = more expensive) */
  savings: number;

  /** Percentage savings */
  savingsPercent: number;

  /** Recommendations */
  recommendations: string[];
}

export interface CostBreakdown {
  /** Total cost */
  total: number;

  /** Input tokens cost */
  inputCost: number;

  /** Output tokens cost */
  outputCost: number;

  /** Input tokens count */
  inputTokens: number;

  /** Output tokens count */
  outputTokens: number;

  /** Model used */
  model: string;

  /** Provider */
  provider: string;

  /** Cost per 1M input tokens */
  inputPricePerMillion: number;

  /** Cost per 1M output tokens */
  outputPricePerMillion: number;
}

export interface BatchCostComparison {
  /** Individual comparisons */
  comparisons: CostComparison[];

  /** Aggregate totals */
  totals: {
    originalCost: number;
    replayedCost: number;
    savings: number;
    savingsPercent: number;
  };

  /** Best savings found */
  bestSavings: CostComparison | null;

  /** Worst savings (most expensive) */
  worstSavings: CostComparison | null;
}

// ============================================================================
// Cost Comparator
// ============================================================================

export class CostComparator {
  /**
   * Compare costs between two executions
   *
   * @param originalEvents - Original timeline events
   * @param replayedEvents - Replayed timeline events
   * @returns Cost comparison with savings analysis
   *
   * @example
   * ```ts
   * const comparison = comparator.compare(originalEvents, replayedEvents);
   *
   * console.log(`Savings: $${comparison.savings.toFixed(4)} (${comparison.savingsPercent.toFixed(1)}%)`);
   * console.log(`Recommendations:`);
   * comparison.recommendations.forEach(rec => console.log(`  - ${rec}`));
   * ```
   */
  compare(originalEvents: TimelineEvent[], replayedEvents: TimelineEvent[]): CostComparison {
    // Calculate breakdowns
    const original = this.calculateBreakdown(originalEvents);
    const replayed = this.calculateBreakdown(replayedEvents);

    // Calculate savings
    const savings = original.total - replayed.total;
    const savingsPercent = original.total > 0 ? (savings / original.total) * 100 : 0;

    // Generate recommendations
    const recommendations = this.generateRecommendations(original, replayed, savings);

    return {
      original,
      replayed,
      savings,
      savingsPercent,
      recommendations,
    };
  }

  /**
   * Compare multiple executions (batch analysis)
   *
   * @param comparisons - Array of original/replayed event pairs
   * @returns Batch comparison with aggregates
   */
  batchCompare(
    comparisons: Array<{
      original: TimelineEvent[];
      replayed: TimelineEvent[];
    }>,
  ): BatchCostComparison {
    const results: CostComparison[] = comparisons.map((c) =>
      this.compare(c.original, c.replayed),
    );

    // Calculate totals
    const originalCost = results.reduce((sum, r) => sum + r.original.total, 0);
    const replayedCost = results.reduce((sum, r) => sum + r.replayed.total, 0);
    const savings = originalCost - replayedCost;
    const savingsPercent = originalCost > 0 ? (savings / originalCost) * 100 : 0;

    // Find best and worst
    const sortedBySavings = [...results].sort((a, b) => b.savings - a.savings);
    const bestSavings = sortedBySavings[0] || null;
    const worstSavings = sortedBySavings[sortedBySavings.length - 1] || null;

    return {
      comparisons: results,
      totals: {
        originalCost,
        replayedCost,
        savings,
        savingsPercent,
      },
      bestSavings,
      worstSavings,
    };
  }

  /**
   * Calculate cost breakdown from timeline events
   *
   * @param events - Timeline events with cost data
   * @returns Detailed cost breakdown
   */
  private calculateBreakdown(events: TimelineEvent[]): CostBreakdown {
    let totalCost = 0;
    let inputCost = 0;
    let outputCost = 0;
    let inputTokens = 0;
    let outputTokens = 0;
    let model = "unknown";
    let provider = "unknown";

    for (const event of events) {
      const data = event.data as any;

      // Accumulate costs
      totalCost += event.cost || 0;

      if (data?.inputTokens) inputTokens += data.inputTokens;
      if (data?.outputTokens) outputTokens += data.outputTokens;

      if (data?.inputCost) inputCost += data.inputCost;
      if (data?.outputCost) outputCost += data.outputCost;

      // Use first event's model/provider
      if (model === "unknown" && data?.model) model = data.model;
      if (provider === "unknown" && data?.provider) provider = data.provider;
    }

    // Calculate per-million prices
    const inputPricePerMillion = inputTokens > 0 ? (inputCost / inputTokens) * 1_000_000 : 0;
    const outputPricePerMillion = outputTokens > 0 ? (outputCost / outputTokens) * 1_000_000 : 0;

    return {
      total: totalCost,
      inputCost,
      outputCost,
      inputTokens,
      outputTokens,
      model,
      provider,
      inputPricePerMillion,
      outputPricePerMillion,
    };
  }

  /**
   * Generate recommendations based on cost comparison
   *
   * @param original - Original cost breakdown
   * @param replayed - Replayed cost breakdown
   * @param savings - Absolute savings
   * @returns Array of recommendations
   */
  private generateRecommendations(
    original: CostBreakdown,
    replayed: CostBreakdown,
    savings: number,
  ): string[] {
    const recommendations: string[] = [];

    // Savings/cost increase
    if (savings > 0) {
      const percent = ((savings / original.total) * 100).toFixed(1);
      recommendations.push(`💰 Using ${replayed.model} saves $${savings.toFixed(4)} (${percent}%)`);
    } else if (savings < 0) {
      const percent = ((Math.abs(savings) / original.total) * 100).toFixed(1);
      recommendations.push(
        `⚠️ Using ${replayed.model} costs $${Math.abs(savings).toFixed(4)} more (${percent}%)`,
      );
    } else {
      recommendations.push(`✅ Costs are identical`);
    }

    // Token usage
    const tokenDiff = replayed.inputTokens + replayed.outputTokens - (original.inputTokens + original.outputTokens);
    if (tokenDiff < -100) {
      recommendations.push(
        `📉 ${replayed.model} uses ${Math.abs(tokenDiff)} fewer tokens (more concise)`,
      );
    } else if (tokenDiff > 100) {
      recommendations.push(`📈 ${replayed.model} uses ${tokenDiff} more tokens (more verbose)`);
    }

    // Output quality (heuristic based on output tokens)
    if (replayed.outputTokens < original.outputTokens * 0.5) {
      recommendations.push(
        `⚠️ ${replayed.model} produces significantly shorter output - verify quality`,
      );
    } else if (replayed.outputTokens > original.outputTokens * 2) {
      recommendations.push(
        `⚠️ ${replayed.model} produces significantly longer output - may be overly verbose`,
      );
    }

    // Model tier recommendations
    if (original.model.includes("opus") && replayed.model.includes("sonnet")) {
      if (savings > 0) {
        recommendations.push(`✨ Opus → Sonnet downgrade saved money - consider using Sonnet by default`);
      }
    } else if (original.model.includes("sonnet") && replayed.model.includes("haiku")) {
      if (savings > 0) {
        recommendations.push(`⚡ Sonnet → Haiku downgrade saved money - consider for simple tasks`);
      }
    }

    // Free tier recommendations
    if (replayed.model.includes("gemini") && replayed.model.includes("flash")) {
      recommendations.push(`🎁 Gemini Flash is free - massive savings possible for high-volume tasks`);
    }

    return recommendations;
  }

  /**
   * Format cost comparison as human-readable text
   *
   * @param comparison - Cost comparison result
   * @returns Formatted string
   */
  format(comparison: CostComparison): string {
    const lines: string[] = [];

    lines.push(`=== Cost Comparison ===`);
    lines.push(``);
    lines.push(`Original (${comparison.original.model}):`);
    lines.push(`  Total: $${comparison.original.total.toFixed(6)}`);
    lines.push(`  Input: ${comparison.original.inputTokens} tokens @ $${comparison.original.inputCost.toFixed(6)}`);
    lines.push(`  Output: ${comparison.original.outputTokens} tokens @ $${comparison.original.outputCost.toFixed(6)}`);
    lines.push(``);
    lines.push(`Replayed (${comparison.replayed.model}):`);
    lines.push(`  Total: $${comparison.replayed.total.toFixed(6)}`);
    lines.push(`  Input: ${comparison.replayed.inputTokens} tokens @ $${comparison.replayed.inputCost.toFixed(6)}`);
    lines.push(`  Output: ${comparison.replayed.outputTokens} tokens @ $${comparison.replayed.outputCost.toFixed(6)}`);
    lines.push(``);

    const savingsIcon = comparison.savings > 0 ? "💰" : comparison.savings < 0 ? "⚠️" : "➖";
    const savingsText =
      comparison.savings > 0
        ? `Savings: $${comparison.savings.toFixed(6)} (${comparison.savingsPercent.toFixed(1)}%)`
        : comparison.savings < 0
          ? `Extra cost: $${Math.abs(comparison.savings).toFixed(6)} (${Math.abs(comparison.savingsPercent).toFixed(1)}%)`
          : `No cost difference`;

    lines.push(`${savingsIcon} ${savingsText}`);
    lines.push(``);

    if (comparison.recommendations.length > 0) {
      lines.push(`Recommendations:`);
      comparison.recommendations.forEach((rec) => lines.push(`  ${rec}`));
    }

    return lines.join("\n");
  }
}
