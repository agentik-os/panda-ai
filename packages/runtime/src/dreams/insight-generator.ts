/**
 * Insight Generator - Generates actionable morning insights from patterns
 *
 * Transforms detected patterns into structured insights with recommendations
 */

import type { Pattern } from "./pattern-detector";

export interface Insight {
  type: "optimization" | "pattern" | "anomaly" | "recommendation";
  title: string;
  description: string;
  confidence: number; // 0-1
  priority: "high" | "medium" | "low";
  actionable: boolean;
  recommendation?: string;
  relatedPatterns: Pattern[];
}

export interface InsightGenerationOptions {
  minConfidence?: number; // Minimum confidence to generate insight (default: 0.7)
  maxInsights?: number; // Maximum insights to generate (default: 10)
}

/**
 * Generates actionable insights from detected patterns
 */
export class InsightGenerator {
  private readonly minConfidence: number;
  private readonly maxInsights: number;

  constructor(options: InsightGenerationOptions = {}) {
    this.minConfidence = options.minConfidence ?? 0.7;
    this.maxInsights = options.maxInsights ?? 10;
  }

  /**
   * Generate insights from patterns
   */
  generateInsights(patterns: Pattern[]): Insight[] {
    const insights: Insight[] = [];

    // Generate optimization insights
    insights.push(...this.generateOptimizationInsights(patterns));

    // Generate pattern insights
    insights.push(...this.generatePatternInsights(patterns));

    // Generate anomaly insights
    insights.push(...this.generateAnomalyInsights(patterns));

    // Generate recommendations
    insights.push(...this.generateRecommendations(patterns));

    // Filter by confidence and limit
    return insights
      .filter((i) => i.confidence >= this.minConfidence)
      .sort((a, b) => {
        // Sort by priority then confidence
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
        if (priorityDiff !== 0) return priorityDiff;
        return b.confidence - a.confidence;
      })
      .slice(0, this.maxInsights);
  }

  /**
   * Generate optimization insights (cost, performance, efficiency)
   */
  private generateOptimizationInsights(patterns: Pattern[]): Insight[] {
    const insights: Insight[] = [];

    // Check for frequently used skills (optimization opportunity)
    const skillPatterns = patterns.filter((p) => p.type === "skill");
    if (skillPatterns.length > 0) {
      const topSkill = skillPatterns.sort((a, b) => b.frequency - a.frequency)[0];

      if (topSkill) {
        insights.push({
          type: "optimization",
          title: "High Skill Usage Detected",
          description: `The "${topSkill.description}" is used ${topSkill.frequency} times. Consider caching results or optimizing its performance.`,
          confidence: topSkill.confidence,
          priority: topSkill.frequency > 10 ? "high" : "medium",
          actionable: true,
          recommendation:
            "Review skill implementation for caching opportunities or performance improvements.",
          relatedPatterns: [topSkill],
        });
      }
    }

    // Check for error patterns (reliability optimization)
    const errorPatterns = patterns.filter((p) => p.type === "error");
    if (errorPatterns.length > 0) {
      const mostFrequentError = errorPatterns.sort((a, b) => b.frequency - a.frequency)[0];

      if (mostFrequentError) {
        insights.push({
          type: "optimization",
          title: "Recurring Error Detected",
          description: `${mostFrequentError.description} occurred ${mostFrequentError.frequency} times.`,
          confidence: mostFrequentError.confidence,
          priority: "high",
          actionable: true,
          recommendation: "Investigate root cause and add error handling or retry logic.",
          relatedPatterns: [mostFrequentError],
        });
      }
    }

    return insights;
  }

  /**
   * Generate pattern insights (user behavior, trends)
   */
  private generatePatternInsights(patterns: Pattern[]): Insight[] {
    const insights: Insight[] = [];

    // Topic patterns
    const topicPatterns = patterns.filter((p) => p.type === "topic");
    if (topicPatterns.length > 0) {
      const strongTopics = topicPatterns.filter((p) => p.confidence > 0.8);

      if (strongTopics.length > 0) {
        insights.push({
          type: "pattern",
          title: "Strong Topic Affinity Detected",
          description: `User shows strong interest in: ${strongTopics.map((t) => t.description).join(", ")}`,
          confidence: Math.max(...strongTopics.map((t) => t.confidence)),
          priority: "medium",
          actionable: true,
          recommendation: "Proactively suggest related content or features in these areas.",
          relatedPatterns: strongTopics,
        });
      }
    }

    // Preference patterns
    const preferencePatterns = patterns.filter((p) => p.type === "preference");
    if (preferencePatterns.length >= 2) {
      insights.push({
        type: "pattern",
        title: "User Preferences Identified",
        description: `Identified ${preferencePatterns.length} user preferences that can inform personalization.`,
        confidence: 0.8,
        priority: "low",
        actionable: true,
        recommendation: "Use these preferences to customize responses and recommendations.",
        relatedPatterns: preferencePatterns,
      });
    }

    return insights;
  }

  /**
   * Generate anomaly insights (unusual patterns, outliers)
   */
  private generateAnomalyInsights(patterns: Pattern[]): Insight[] {
    const insights: Insight[] = [];

    // Check for sudden spikes in error frequency
    const recentErrors = patterns.filter(
      (p) => p.type === "error" && Date.now() - p.lastSeen < 24 * 60 * 60 * 1000, // Last 24h
    );

    if (recentErrors.length > 0) {
      insights.push({
        type: "anomaly",
        title: "Recent Error Spike",
        description: `${recentErrors.length} error pattern(s) detected in the last 24 hours.`,
        confidence: 0.9,
        priority: "high",
        actionable: true,
        recommendation: "Review recent changes or external dependencies that may have caused errors.",
        relatedPatterns: recentErrors,
      });
    }

    // Check for patterns that stopped appearing
    const stalePatterns = patterns.filter(
      (p) => Date.now() - p.lastSeen > 7 * 24 * 60 * 60 * 1000, // Not seen in 7 days
    );

    if (stalePatterns.length > 0 && stalePatterns.length < patterns.length / 2) {
      insights.push({
        type: "anomaly",
        title: "User Behavior Change Detected",
        description: `${stalePatterns.length} previously common pattern(s) have stopped appearing.`,
        confidence: 0.7,
        priority: "low",
        actionable: false,
        recommendation: "Monitor for potential user churn or changing needs.",
        relatedPatterns: stalePatterns,
      });
    }

    return insights;
  }

  /**
   * Generate general recommendations
   */
  private generateRecommendations(patterns: Pattern[]): Insight[] {
    const insights: Insight[] = [];

    // Overall health recommendation
    const errorPatterns = patterns.filter((p) => p.type === "error");
    const totalPatterns = patterns.length;

    if (totalPatterns > 0) {
      const errorRatio = errorPatterns.length / totalPatterns;

      if (errorRatio < 0.1) {
        insights.push({
          type: "recommendation",
          title: "System Health: Excellent",
          description: `Only ${(errorRatio * 100).toFixed(1)}% of patterns are errors. System is performing well.`,
          confidence: 0.95,
          priority: "low",
          actionable: false,
          relatedPatterns: [],
        });
      } else if (errorRatio > 0.3) {
        insights.push({
          type: "recommendation",
          title: "System Health: Needs Attention",
          description: `${(errorRatio * 100).toFixed(1)}% of patterns are errors. Review error handling and stability.`,
          confidence: 0.9,
          priority: "high",
          actionable: true,
          recommendation: "Prioritize error reduction and improve reliability.",
          relatedPatterns: errorPatterns,
        });
      }
    }

    // Engagement recommendation
    const topicPatterns = patterns.filter((p) => p.type === "topic");
    if (topicPatterns.length >= 5) {
      insights.push({
        type: "recommendation",
        title: "High User Engagement",
        description: `User is actively engaging across ${topicPatterns.length} different topics.`,
        confidence: 0.85,
        priority: "low",
        actionable: true,
        recommendation: "Continue providing diverse and relevant content to maintain engagement.",
        relatedPatterns: topicPatterns,
      });
    }

    return insights;
  }

  /**
   * Format insights as a morning report
   */
  formatMorningReport(insights: Insight[]): string {
    if (insights.length === 0) {
      return "No significant insights to report today. Continue monitoring.";
    }

    const sections: string[] = [];

    // Header
    sections.push("# Morning Insights Report");
    sections.push(`Generated: ${new Date().toISOString()}`);
    sections.push(`Total Insights: ${insights.length}\n`);

    // Group by priority
    const highPriority = insights.filter((i) => i.priority === "high");
    const mediumPriority = insights.filter((i) => i.priority === "medium");
    const lowPriority = insights.filter((i) => i.priority === "low");

    if (highPriority.length > 0) {
      sections.push("## 🔴 High Priority");
      for (const insight of highPriority) {
        sections.push(`### ${insight.title}`);
        sections.push(`**Type:** ${insight.type}`);
        sections.push(`**Confidence:** ${(insight.confidence * 100).toFixed(0)}%`);
        sections.push(`**Description:** ${insight.description}`);
        if (insight.recommendation) {
          sections.push(`**Recommendation:** ${insight.recommendation}`);
        }
        sections.push("");
      }
    }

    if (mediumPriority.length > 0) {
      sections.push("## 🟡 Medium Priority");
      for (const insight of mediumPriority) {
        sections.push(`### ${insight.title}`);
        sections.push(`**Description:** ${insight.description}`);
        if (insight.recommendation) {
          sections.push(`**Recommendation:** ${insight.recommendation}`);
        }
        sections.push("");
      }
    }

    if (lowPriority.length > 0) {
      sections.push("## 🟢 Low Priority / Informational");
      for (const insight of lowPriority) {
        sections.push(`- ${insight.title}: ${insight.description}`);
      }
      sections.push("");
    }

    return sections.join("\n");
  }
}
