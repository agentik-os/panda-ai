/**
 * Pattern Detector - Analyzes conversation history for recurring themes
 *
 * Identifies:
 * - Recurring topics and themes
 * - User preferences and habits
 * - Common errors or issues
 * - Frequently used skills
 */

import type { ConversationMessage } from "../storage/convex-adapter";

export interface Pattern {
  type: "topic" | "preference" | "error" | "skill";
  description: string;
  frequency: number;
  confidence: number; // 0-1
  examples: string[]; // Sample conversations that show this pattern
  firstSeen: number; // timestamp
  lastSeen: number; // timestamp
}

export interface PatternDetectionOptions {
  minFrequency?: number; // Minimum occurrences to be considered a pattern (default: 3)
  minConfidence?: number; // Minimum confidence score (default: 0.6)
  lookbackDays?: number; // How many days to analyze (default: 7)
}

/**
 * Analyzes conversation history to detect patterns
 */
export class PatternDetector {
  private readonly minFrequency: number;
  private readonly minConfidence: number;
  private readonly lookbackDays: number;

  constructor(options: PatternDetectionOptions = {}) {
    this.minFrequency = options.minFrequency ?? 3;
    this.minConfidence = options.minConfidence ?? 0.6;
    this.lookbackDays = options.lookbackDays ?? 7;
  }

  /**
   * Detect patterns in conversation history
   */
  async detectPatterns(conversations: ConversationMessage[]): Promise<Pattern[]> {
    const cutoffTime = Date.now() - this.lookbackDays * 24 * 60 * 60 * 1000;
    const recentConversations = conversations.filter((c) => c.timestamp >= cutoffTime);

    if (recentConversations.length === 0) {
      return [];
    }

    const patterns: Pattern[] = [];

    // Detect topic patterns
    patterns.push(...this.detectTopicPatterns(recentConversations));

    // Detect user preference patterns
    patterns.push(...this.detectPreferencePatterns(recentConversations));

    // Detect error patterns
    patterns.push(...this.detectErrorPatterns(recentConversations));

    // Detect skill usage patterns
    patterns.push(...this.detectSkillPatterns(recentConversations));

    // Filter by minimum frequency and confidence
    return patterns.filter(
      (p) => p.frequency >= this.minFrequency && p.confidence >= this.minConfidence,
    );
  }

  /**
   * Detect recurring topics in conversations
   */
  private detectTopicPatterns(conversations: ConversationMessage[]): Pattern[] {
    const topicMap = new Map<
      string,
      { count: number; examples: string[]; firstSeen: number; lastSeen: number }
    >();

    // Simple keyword extraction (in production, use NLP/embeddings)
    const keywords = this.extractKeywords(conversations);

    for (const [keyword, data] of keywords.entries()) {
      if (data.count >= this.minFrequency) {
        topicMap.set(keyword, data);
      }
    }

    return Array.from(topicMap.entries()).map(([topic, data]) => ({
      type: "topic" as const,
      description: `User frequently discusses "${topic}"`,
      frequency: data.count,
      confidence: Math.min(data.count / 10, 1), // Scale confidence (10+ = 100%)
      examples: data.examples.slice(0, 3), // Top 3 examples
      firstSeen: data.firstSeen,
      lastSeen: data.lastSeen,
    }));
  }

  /**
   * Detect user preference patterns
   */
  private detectPreferencePatterns(conversations: ConversationMessage[]): Pattern[] {
    const patterns: Pattern[] = [];
    const preferenceKeywords = ["prefer", "like", "always", "usually", "favorite"];

    const preferenceMessages = conversations.filter((c) =>
      preferenceKeywords.some((kw) => c.content.toLowerCase().includes(kw)),
    );

    if (preferenceMessages.length >= this.minFrequency) {
      // Group by preference type
      const preferences = this.groupPreferences(preferenceMessages);

      for (const [pref, messages] of preferences.entries()) {
        patterns.push({
          type: "preference",
          description: pref,
          frequency: messages.length,
          confidence: Math.min(messages.length / 5, 1),
          examples: messages.slice(0, 3).map((m) => m.content),
          firstSeen: Math.min(...messages.map((m) => m.timestamp)),
          lastSeen: Math.max(...messages.map((m) => m.timestamp)),
        });
      }
    }

    return patterns;
  }

  /**
   * Detect error patterns
   */
  private detectErrorPatterns(conversations: ConversationMessage[]): Pattern[] {
    const patterns: Pattern[] = [];
    const errorMessages = conversations.filter((c) => c.error);

    if (errorMessages.length === 0) return [];

    // Group errors by type
    const errorGroups = new Map<
      string,
      { count: number; examples: string[]; firstSeen: number; lastSeen: number }
    >();

    for (const msg of errorMessages) {
      const errorType = this.categorizeError(msg.error!);

      const existing = errorGroups.get(errorType) || {
        count: 0,
        examples: [],
        firstSeen: msg.timestamp,
        lastSeen: msg.timestamp,
      };

      existing.count++;
      if (existing.examples.length < 3) {
        existing.examples.push(msg.error!);
      }
      existing.lastSeen = Math.max(existing.lastSeen, msg.timestamp);

      errorGroups.set(errorType, existing);
    }

    for (const [errorType, data] of errorGroups.entries()) {
      if (data.count >= this.minFrequency) {
        patterns.push({
          type: "error",
          description: `Recurring error: ${errorType}`,
          frequency: data.count,
          confidence: 0.9, // High confidence for errors
          examples: data.examples,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
        });
      }
    }

    return patterns;
  }

  /**
   * Detect skill usage patterns
   */
  private detectSkillPatterns(conversations: ConversationMessage[]): Pattern[] {
    const patterns: Pattern[] = [];
    const skillUsage = new Map<
      string,
      { count: number; examples: string[]; firstSeen: number; lastSeen: number }
    >();

    for (const msg of conversations) {
      if (!msg.skillsUsed || msg.skillsUsed.length === 0) continue;

      for (const skill of msg.skillsUsed) {
        const existing = skillUsage.get(skill) || {
          count: 0,
          examples: [],
          firstSeen: msg.timestamp,
          lastSeen: msg.timestamp,
        };

        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(msg.content.slice(0, 100)); // First 100 chars
        }
        existing.lastSeen = Math.max(existing.lastSeen, msg.timestamp);

        skillUsage.set(skill, existing);
      }
    }

    for (const [skill, data] of skillUsage.entries()) {
      if (data.count >= this.minFrequency) {
        patterns.push({
          type: "skill",
          description: `Frequently uses "${skill}" skill`,
          frequency: data.count,
          confidence: Math.min(data.count / 10, 1),
          examples: data.examples,
          firstSeen: data.firstSeen,
          lastSeen: data.lastSeen,
        });
      }
    }

    return patterns;
  }

  /**
   * Extract keywords from conversations (simple word frequency)
   */
  private extractKeywords(
    conversations: ConversationMessage[],
  ): Map<string, { count: number; examples: string[]; firstSeen: number; lastSeen: number }> {
    const keywords = new Map<
      string,
      { count: number; examples: string[]; firstSeen: number; lastSeen: number }
    >();

    // Common stop words to ignore
    const stopWords = new Set([
      "the",
      "a",
      "an",
      "and",
      "or",
      "but",
      "in",
      "on",
      "at",
      "to",
      "for",
      "of",
      "with",
      "by",
      "from",
      "is",
      "was",
      "are",
      "were",
      "be",
      "been",
      "being",
      "have",
      "has",
      "had",
      "do",
      "does",
      "did",
      "will",
      "would",
      "could",
      "should",
      "can",
      "may",
      "might",
    ]);

    for (const msg of conversations) {
      const words = msg.content
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 3 && !stopWords.has(w));

      for (const word of words) {
        const existing = keywords.get(word) || {
          count: 0,
          examples: [],
          firstSeen: msg.timestamp,
          lastSeen: msg.timestamp,
        };

        existing.count++;
        if (existing.examples.length < 3) {
          existing.examples.push(msg.content.slice(0, 100));
        }
        existing.lastSeen = Math.max(existing.lastSeen, msg.timestamp);

        keywords.set(word, existing);
      }
    }

    return keywords;
  }

  /**
   * Group preference messages by preference type
   */
  private groupPreferences(
    messages: ConversationMessage[],
  ): Map<string, ConversationMessage[]> {
    const groups = new Map<string, ConversationMessage[]>();

    for (const msg of messages) {
      // Extract preference statement (simple heuristic)
      const match = msg.content.match(/(?:prefer|like|always|usually)\s+(.{10,50})/i);
      if (match && match[1]) {
        const pref = match[1].trim();
        const existing = groups.get(pref) || [];
        existing.push(msg);
        groups.set(pref, existing);
      }
    }

    return groups;
  }

  /**
   * Categorize error by type
   */
  private categorizeError(error: string): string {
    const lower = error.toLowerCase();

    if (lower.includes("timeout") || lower.includes("timed out")) return "Timeout";
    if (lower.includes("rate limit")) return "Rate Limit";
    if (lower.includes("not found") || lower.includes("404")) return "Not Found";
    if (lower.includes("unauthorized") || lower.includes("401")) return "Unauthorized";
    if (lower.includes("forbidden") || lower.includes("403")) return "Forbidden";
    if (lower.includes("network") || lower.includes("connection")) return "Network";
    if (lower.includes("parse") || lower.includes("json")) return "Parse Error";

    return "Unknown Error";
  }
}
