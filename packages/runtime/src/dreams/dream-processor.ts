/**
 * Dream Processor - Main orchestrator for Agent Dreams
 *
 * Coordinates nightly dream processing:
 * 1. Fetch conversation history
 * 2. Detect patterns
 * 3. Generate insights
 * 4. Save dream report
 */

import { ConvexAdapter, type ConversationMessage, type Dream } from "../storage/convex-adapter";
import { PatternDetector, type Pattern } from "./pattern-detector";
import { InsightGenerator, type Insight } from "./insight-generator";

export interface DreamSession {
  agentId: string;
  timestamp: number;
  patterns: Pattern[];
  insights: Insight[];
  conversationCount: number;
  processingTimeMs: number;
}

export interface DreamProcessorOptions {
  convexAdapter: ConvexAdapter;
  lookbackDays?: number; // Days of history to analyze (default: 7)
  minPatternFrequency?: number; // Minimum pattern frequency (default: 3)
  minInsightConfidence?: number; // Minimum insight confidence (default: 0.7)
  maxInsights?: number; // Max insights per dream (default: 10)
}

/**
 * Main dream processor orchestrator
 */
export class DreamProcessor {
  private readonly adapter: ConvexAdapter;
  private readonly patternDetector: PatternDetector;
  private readonly insightGenerator: InsightGenerator;

  constructor(options: DreamProcessorOptions) {
    this.adapter = options.convexAdapter;

    this.patternDetector = new PatternDetector({
      lookbackDays: options.lookbackDays ?? 7,
      minFrequency: options.minPatternFrequency ?? 3,
      minConfidence: 0.6,
    });

    this.insightGenerator = new InsightGenerator({
      minConfidence: options.minInsightConfidence ?? 0.7,
      maxInsights: options.maxInsights ?? 10,
    });
  }

  /**
   * Process a dream session for an agent
   */
  async processDream(agentId: string): Promise<DreamSession> {
    const startTime = Date.now();

    // 1. Fetch conversation history
    const conversations = await this.fetchConversationHistory(agentId);

    if (conversations.length === 0) {
      throw new Error(`No conversation history found for agent: ${agentId}`);
    }

    // 2. Detect patterns
    const patterns = await this.patternDetector.detectPatterns(conversations);

    // 3. Generate insights
    const insights = this.insightGenerator.generateInsights(patterns);

    // 4. Create dream session
    const session: DreamSession = {
      agentId,
      timestamp: Date.now(),
      patterns,
      insights,
      conversationCount: conversations.length,
      processingTimeMs: Date.now() - startTime,
    };

    // 5. Save dream to Convex
    await this.saveDream(session);

    return session;
  }

  /**
   * Fetch conversation history for an agent
   */
  private async fetchConversationHistory(agentId: string): Promise<ConversationMessage[]> {
    try {
      return await this.adapter.listConversations({
        agentId,
        limit: 1000, // Last 1000 messages
      });
    } catch (error) {
      throw new Error(`Failed to fetch conversation history: ${error}`);
    }
  }

  /**
   * Save dream session to Convex
   */
  private async saveDream(session: DreamSession): Promise<string> {
    const dream: Omit<Dream, "id"> = {
      agentId: session.agentId,
      timestamp: session.timestamp,
      insights: session.insights.map((i) => `[${i.priority}] ${i.title}: ${i.description}`),
      stateSnapshot: {
        patterns: session.patterns,
        insights: session.insights,
        conversationCount: session.conversationCount,
        processingTimeMs: session.processingTimeMs,
      },
      approved: false, // Dreams require approval (future feature)
    };

    try {
      return await this.adapter.saveDream(session.agentId, dream);
    } catch (error) {
      throw new Error(`Failed to save dream: ${error}`);
    }
  }

  /**
   * Get recent dreams for an agent
   */
  async getRecentDreams(agentId: string, limit: number = 10): Promise<Dream[]> {
    try {
      return await this.adapter.getDreams(agentId, limit);
    } catch (error) {
      throw new Error(`Failed to get recent dreams: ${error}`);
    }
  }

  /**
   * Generate morning report from latest dream
   */
  async generateMorningReport(agentId: string): Promise<string> {
    const dreams = await this.getRecentDreams(agentId, 1);

    if (dreams.length === 0) {
      return "No dream sessions available. Run a dream session first.";
    }

    const latestDream = dreams[0];
    if (!latestDream) {
      return "No dream sessions available. Run a dream session first.";
    }

    const snapshot = latestDream.stateSnapshot as DreamSession | null;

    if (!snapshot || !snapshot.insights) {
      return "Dream session data incomplete.";
    }

    return this.insightGenerator.formatMorningReport(snapshot.insights);
  }

  /**
   * Process multiple agents in batch
   */
  async processBatch(agentIds: string[]): Promise<Map<string, DreamSession | Error>> {
    const results = new Map<string, DreamSession | Error>();

    // Process all agents in parallel
    const promises = agentIds.map(async (agentId) => {
      try {
        const session = await this.processDream(agentId);
        results.set(agentId, session);
      } catch (error) {
        results.set(agentId, error as Error);
      }
    });

    await Promise.all(promises);

    return results;
  }

  /**
   * Get dream statistics
   */
  async getDreamStats(agentId: string): Promise<{
    totalDreams: number;
    avgPatternsPerDream: number;
    avgInsightsPerDream: number;
    avgProcessingTimeMs: number;
    lastDreamTime: number | null;
  }> {
    const dreams = await this.getRecentDreams(agentId, 50);

    if (dreams.length === 0) {
      return {
        totalDreams: 0,
        avgPatternsPerDream: 0,
        avgInsightsPerDream: 0,
        avgProcessingTimeMs: 0,
        lastDreamTime: null,
      };
    }

    const snapshots = dreams
      .map((d) => d.stateSnapshot as DreamSession | null)
      .filter((s): s is DreamSession => s !== null);

    const totalPatterns = snapshots.reduce((sum, s) => sum + s.patterns.length, 0);
    const totalInsights = snapshots.reduce((sum, s) => sum + s.insights.length, 0);
    const totalProcessingTime = snapshots.reduce((sum, s) => sum + s.processingTimeMs, 0);

    const snapshotCount = snapshots.length || 1; // Avoid division by zero

    return {
      totalDreams: dreams.length,
      avgPatternsPerDream: totalPatterns / snapshotCount,
      avgInsightsPerDream: totalInsights / snapshotCount,
      avgProcessingTimeMs: totalProcessingTime / snapshotCount,
      lastDreamTime: dreams[0]?.timestamp ?? null,
    };
  }
}
