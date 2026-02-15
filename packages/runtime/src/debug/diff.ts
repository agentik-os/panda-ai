/**
 * State Diff Viewer for Time Travel Debug
 *
 * Compare states between original and replayed sessions.
 * Identify what changed, cost differences, response quality.
 *
 * Steps 115: Diff viewer with state comparison
 */

import type { ReplayState, ReplayResult } from "./replay-engine.js";

// ============================================================================
// Types
// ============================================================================

export interface StateDiff {
  type: "conversation" | "cost" | "tools" | "memory" | "decisions" | "errors";
  field: string;
  original: any;
  replayed: any;
  change: "added" | "removed" | "modified" | "unchanged";
  impact: "high" | "medium" | "low";
  description: string;
}

export interface DiffReport {
  summary: {
    totalDifferences: number;
    highImpact: number;
    mediumImpact: number;
    lowImpact: number;
  };
  differences: StateDiff[];
  costAnalysis: {
    originalCost: number;
    replayedCost: number;
    difference: number;
    percentageChange: number;
    savings: number; // Negative if more expensive
  };
  qualityAnalysis: {
    responseLength: { original: number; replayed: number; change: number };
    toolCalls: { original: number; replayed: number; change: number };
    decisions: { original: number; replayed: number; change: number };
    errors: { original: number; replayed: number; change: number };
  };
  recommendations: string[];
}

export interface ConversationDiff {
  index: number;
  role: "user" | "assistant";
  original: string;
  replayed: string;
  similarity: number; // 0-1
  changes: Array<{
    type: "added" | "removed" | "modified";
    text: string;
    position: number;
  }>;
}

// ============================================================================
// Diff Viewer
// ============================================================================

export class DiffViewer {
  /**
   * Compare two replay results
   */
  static compare(original: ReplayResult, replayed: ReplayResult): DiffReport {
    const differences: StateDiff[] = [];

    // Compare conversation history
    const conversationDiffs = this.compareConversations(
      original.finalState.agentState.conversationHistory,
      replayed.finalState.agentState.conversationHistory
    );
    differences.push(...conversationDiffs);

    // Compare cost
    const costDiff = this.compareCosts(
      original.finalState.cost,
      replayed.finalState.cost
    );
    differences.push(costDiff);

    // Compare tool calls
    const toolDiff = this.compareToolCalls(
      original.finalState.agentState.toolCalls,
      replayed.finalState.agentState.toolCalls
    );
    differences.push(toolDiff);

    // Compare decisions
    const decisionDiffs = this.compareDecisions(
      original.finalState.agentState.decisions,
      replayed.finalState.agentState.decisions
    );
    differences.push(...decisionDiffs);

    // Compare errors
    const errorDiff = this.compareErrors(
      original.finalState.errors,
      replayed.finalState.errors
    );
    differences.push(errorDiff);

    // Calculate summary
    const summary = {
      totalDifferences: differences.length,
      highImpact: differences.filter((d) => d.impact === "high").length,
      mediumImpact: differences.filter((d) => d.impact === "medium").length,
      lowImpact: differences.filter((d) => d.impact === "low").length,
    };

    // Cost analysis
    const costAnalysis = {
      originalCost: original.cost.original,
      replayedCost: replayed.cost.replayed ?? original.cost.original,
      difference:
        (replayed.cost.replayed ?? original.cost.original) -
        original.cost.original,
      percentageChange:
        ((replayed.cost.replayed ?? original.cost.original) -
          original.cost.original) /
        original.cost.original,
      savings:
        original.cost.original -
        (replayed.cost.replayed ?? original.cost.original),
    };

    // Quality analysis
    const qualityAnalysis = {
      responseLength: {
        original: original.finalState.agentState.conversationHistory.length,
        replayed: replayed.finalState.agentState.conversationHistory.length,
        change:
          replayed.finalState.agentState.conversationHistory.length -
          original.finalState.agentState.conversationHistory.length,
      },
      toolCalls: {
        original: original.finalState.agentState.toolCalls,
        replayed: replayed.finalState.agentState.toolCalls,
        change:
          replayed.finalState.agentState.toolCalls -
          original.finalState.agentState.toolCalls,
      },
      decisions: {
        original: original.finalState.agentState.decisions.length,
        replayed: replayed.finalState.agentState.decisions.length,
        change:
          replayed.finalState.agentState.decisions.length -
          original.finalState.agentState.decisions.length,
      },
      errors: {
        original: original.finalState.errors.length,
        replayed: replayed.finalState.errors.length,
        change:
          replayed.finalState.errors.length -
          original.finalState.errors.length,
      },
    };

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      costAnalysis,
      qualityAnalysis,
      differences
    );

    return {
      summary,
      differences,
      costAnalysis,
      qualityAnalysis,
      recommendations,
    };
  }

  /**
   * Compare states directly
   */
  static compareStates(original: ReplayState, replayed: ReplayState): DiffReport {
    return this.compare(
      {
        sessionId: "original",
        startTime: original.timestamp,
        endTime: original.timestamp,
        totalEvents: original.eventCount,
        finalState: original,
        cost: {
          original: original.cost.totalUsd,
        },
        timeline: [],
      },
      {
        sessionId: "replayed",
        startTime: replayed.timestamp,
        endTime: replayed.timestamp,
        totalEvents: replayed.eventCount,
        finalState: replayed,
        cost: {
          original: original.cost.totalUsd,
          replayed: replayed.cost.totalUsd,
        },
        timeline: [],
      }
    );
  }

  /**
   * Get detailed conversation diff with line-by-line changes
   */
  static getConversationDiff(
    original: Array<{ role: string; content: string }>,
    replayed: Array<{ role: string; content: string }>
  ): ConversationDiff[] {
    const diffs: ConversationDiff[] = [];
    const maxLength = Math.max(original.length, replayed.length);

    for (let i = 0; i < maxLength; i++) {
      const orig = original[i];
      const repl = replayed[i];

      if (!orig && repl) {
        // Added in replay
        diffs.push({
          index: i,
          role: repl.role as "user" | "assistant",
          original: "",
          replayed: repl.content,
          similarity: 0,
          changes: [
            {
              type: "added",
              text: repl.content,
              position: 0,
            },
          ],
        });
      } else if (orig && !repl) {
        // Removed in replay
        diffs.push({
          index: i,
          role: orig.role as "user" | "assistant",
          original: orig.content,
          replayed: "",
          similarity: 0,
          changes: [
            {
              type: "removed",
              text: orig.content,
              position: 0,
            },
          ],
        });
      } else if (orig && repl) {
        // Both exist - compare
        const similarity = this.calculateSimilarity(
          orig.content,
          repl.content
        );
        const changes = this.getTextChanges(orig.content, repl.content);

        diffs.push({
          index: i,
          role: orig.role as "user" | "assistant",
          original: orig.content,
          replayed: repl.content,
          similarity,
          changes,
        });
      }
    }

    return diffs;
  }

  // ============================================================================
  // Private Helpers
  // ============================================================================

  private static compareConversations(
    original: Array<{ role: string; content: string }>,
    replayed: Array<{ role: string; content: string }>
  ): StateDiff[] {
    const diffs: StateDiff[] = [];

    if (original.length !== replayed.length) {
      diffs.push({
        type: "conversation",
        field: "length",
        original: original.length,
        replayed: replayed.length,
        change: "modified",
        impact: "medium",
        description: `Conversation length changed from ${original.length} to ${replayed.length} messages`,
      });
    }

    // Compare each message
    for (let i = 0; i < Math.min(original.length, replayed.length); i++) {
      const origMsg = original[i]!;
      const replMsg = replayed[i]!;
      if (origMsg.content !== replMsg.content) {
        diffs.push({
          type: "conversation",
          field: `message[${i}]`,
          original: origMsg.content,
          replayed: replMsg.content,
          change: "modified",
          impact: origMsg.role === "assistant" ? "high" : "low",
          description: `Message ${i} (${origMsg.role}) changed`,
        });
      }
    }

    return diffs;
  }

  private static compareCosts(
    original: ReplayState["cost"],
    replayed: ReplayState["cost"]
  ): StateDiff {
    const diff = replayed.totalUsd - original.totalUsd;
    const percentChange = (diff / original.totalUsd) * 100;

    return {
      type: "cost",
      field: "totalUsd",
      original: original.totalUsd,
      replayed: replayed.totalUsd,
      change: diff === 0 ? "unchanged" : "modified",
      impact: Math.abs(percentChange) > 20 ? "high" : "medium",
      description: `Cost ${diff > 0 ? "increased" : "decreased"} by $${Math.abs(diff).toFixed(4)} (${Math.abs(percentChange).toFixed(1)}%)`,
    };
  }

  private static compareToolCalls(
    original: number,
    replayed: number
  ): StateDiff {
    return {
      type: "tools",
      field: "toolCalls",
      original,
      replayed,
      change: original === replayed ? "unchanged" : "modified",
      impact: Math.abs(original - replayed) > 2 ? "medium" : "low",
      description: `Tool calls changed from ${original} to ${replayed}`,
    };
  }

  private static compareDecisions(
    original: string[],
    replayed: string[]
  ): StateDiff[] {
    const diffs: StateDiff[] = [];

    if (original.length !== replayed.length) {
      diffs.push({
        type: "decisions",
        field: "count",
        original: original.length,
        replayed: replayed.length,
        change: "modified",
        impact: "low",
        description: `Decision count changed from ${original.length} to ${replayed.length}`,
      });
    }

    return diffs;
  }

  private static compareErrors(
    original: Array<{ eventId: string; error: string }>,
    replayed: Array<{ eventId: string; error: string }>
  ): StateDiff {
    return {
      type: "errors",
      field: "count",
      original: original.length,
      replayed: replayed.length,
      change: original.length === replayed.length ? "unchanged" : "modified",
      impact:
        replayed.length < original.length
          ? "high" // Fewer errors is good
          : replayed.length > original.length
            ? "high" // More errors is bad
            : "low",
      description:
        replayed.length < original.length
          ? `Errors reduced from ${original.length} to ${replayed.length} ✅`
          : replayed.length > original.length
            ? `Errors increased from ${original.length} to ${replayed.length} ⚠️`
            : `Error count unchanged (${original.length})`,
    };
  }

  private static generateRecommendations(
    costAnalysis: DiffReport["costAnalysis"],
    qualityAnalysis: DiffReport["qualityAnalysis"],
    _differences: StateDiff[]
  ): string[] {
    const recommendations: string[] = [];

    // Cost recommendations
    if (costAnalysis.savings > 0.01) {
      recommendations.push(
        `✅ Switch to replayed configuration to save $${costAnalysis.savings.toFixed(4)} per session`
      );
    } else if (costAnalysis.savings < -0.01) {
      recommendations.push(
        `⚠️ Replayed configuration costs $${Math.abs(costAnalysis.savings).toFixed(4)} more - consider if quality improvement justifies cost`
      );
    }

    // Quality recommendations
    if (qualityAnalysis.errors.change < 0) {
      recommendations.push(
        `✅ Replayed configuration reduced errors by ${Math.abs(qualityAnalysis.errors.change)}`
      );
    }

    if (qualityAnalysis.responseLength.change > 0) {
      recommendations.push(
        `📝 Replayed responses are ${qualityAnalysis.responseLength.change} messages longer - may be more detailed`
      );
    }

    // Tool usage recommendations
    if (qualityAnalysis.toolCalls.change < 0) {
      recommendations.push(
        `⚡ Replayed configuration uses ${Math.abs(qualityAnalysis.toolCalls.change)} fewer tool calls - may be more efficient`
      );
    }

    return recommendations;
  }

  private static calculateSimilarity(text1: string, text2: string): number {
    // Simple Jaccard similarity on words
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));

    const intersection = new Set(
      [...words1].filter((word) => words2.has(word))
    );
    const union = new Set([...words1, ...words2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  private static getTextChanges(
    original: string,
    replayed: string
  ): Array<{ type: "added" | "removed" | "modified"; text: string; position: number }> {
    // Simple diff: if texts are identical, no changes
    if (original === replayed) {
      return [];
    }

    // Otherwise, mark as modified
    return [
      {
        type: "modified",
        text: replayed,
        position: 0,
      },
    ];
  }
}
