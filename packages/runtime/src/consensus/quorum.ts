/**
 * Quorum Manager
 * Step-090: Multi-AI Consensus - Deliberation Engine
 *
 * Determines consensus from multiple AI responses based on agreement thresholds
 */

import type { ModelResponse, QuorumConfig, QuorumResponse } from "@agentik-os/shared";

export class QuorumManager {
  /**
   * Check if responses meet quorum threshold
   */
  async checkQuorum(
    query: string,
    responses: ModelResponse[],
    config: QuorumConfig
  ): Promise<QuorumResponse> {
    if (responses.length < 2) {
      throw new Error("Quorum requires at least 2 responses");
    }

    // Calculate agreement between responses
    const agreement = this.calculateAgreement(responses);

    // Identify common points and disagreements
    const { commonPoints, disagreements } = this.analyzeResponses(responses);

    // Generate consensus if threshold is met
    let consensus: string | null = null;
    if (agreement >= config.threshold) {
      consensus = this.synthesizeConsensus(responses, commonPoints);
    }

    return {
      query,
      responses,
      agreement,
      consensus,
      disagreements,
      timestamp: new Date(),
    };
  }

  /**
   * Calculate agreement score between responses
   * Uses semantic similarity (simplified version)
   */
  private calculateAgreement(responses: ModelResponse[]): number {
    if (responses.length < 2) return 1.0;

    // Extract key phrases and concepts from each response
    const responseConcepts = responses.map((r) => this.extractConcepts(r.content));

    // Calculate pairwise similarity
    let totalSimilarity = 0;
    let pairCount = 0;

    for (let i = 0; i < responseConcepts.length; i++) {
      for (let j = i + 1; j < responseConcepts.length; j++) {
        const similarity = this.calculateConceptSimilarity(
          responseConcepts[i]!,
          responseConcepts[j]!
        );
        totalSimilarity += similarity;
        pairCount++;
      }
    }

    return pairCount > 0 ? totalSimilarity / pairCount : 0;
  }

  /**
   * Extract key concepts from response content
   * Simplified: splits into sentences and normalizes
   */
  private extractConcepts(content: string): string[] {
    // Split into sentences
    const sentences = content
      .split(/[.!?]+/)
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 10); // Filter out very short sentences

    return sentences;
  }

  /**
   * Calculate similarity between two sets of concepts
   * Uses Jaccard similarity (intersection over union)
   */
  private calculateConceptSimilarity(concepts1: string[], concepts2: string[]): number {
    if (concepts1.length === 0 || concepts2.length === 0) return 0;

    // Convert to word sets for comparison
    const words1 = new Set(concepts1.flatMap((c) => c.split(/\s+/)));
    const words2 = new Set(concepts2.flatMap((c) => c.split(/\s+/)));

    // Calculate intersection
    const intersection = new Set([...words1].filter((w) => words2.has(w)));

    // Calculate union
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Analyze responses to find common points and disagreements
   */
  private analyzeResponses(responses: ModelResponse[]): {
    commonPoints: string[];
    disagreements: string[];
  } {
    const allConcepts = responses.map((r) => this.extractConcepts(r.content));

    // Find concepts that appear in majority of responses
    const conceptFrequency = new Map<string, number>();

    for (const concepts of allConcepts) {
      for (const concept of concepts) {
        const normalizedConcept = this.normalizeConcept(concept);
        conceptFrequency.set(normalizedConcept, (conceptFrequency.get(normalizedConcept) || 0) + 1);
      }
    }

    // Common points: concepts appearing in >= 50% of responses
    const commonPoints: string[] = [];
    const disagreements: string[] = [];
    const majorityThreshold = Math.ceil(responses.length / 2);

    for (const [concept, count] of conceptFrequency.entries()) {
      if (count >= majorityThreshold) {
        commonPoints.push(concept);
      } else if (count === 1) {
        disagreements.push(concept);
      }
    }

    return {
      commonPoints: commonPoints.slice(0, 10), // Top 10 common points
      disagreements: disagreements.slice(0, 5), // Top 5 disagreements
    };
  }

  /**
   * Normalize a concept for comparison
   */
  private normalizeConcept(concept: string): string {
    return concept
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .trim();
  }

  /**
   * Synthesize consensus from responses
   */
  private synthesizeConsensus(responses: ModelResponse[], commonPoints: string[]): string {
    // Prioritize the most comprehensive response that includes common points
    let bestResponse = responses[0];
    let maxCommonPointsIncluded = 0;

    for (const response of responses) {
      const content = response.content.toLowerCase();
      const includedPoints = commonPoints.filter((point) =>
        content.includes(point.toLowerCase())
      ).length;

      if (includedPoints > maxCommonPointsIncluded) {
        maxCommonPointsIncluded = includedPoints;
        bestResponse = response;
      }
    }

    // Add summary of common points
    const consensusPrefix = `Consensus (${Math.round(
      (maxCommonPointsIncluded / commonPoints.length) * 100
    )}% agreement):\n\n`;

    return consensusPrefix + (bestResponse?.content ?? "");
  }

  /**
   * Check if responses meet minimum quorum size
   */
  isValidQuorum(responses: ModelResponse[], minSize = 2): boolean {
    return responses.length >= minSize;
  }

  /**
   * Get recommended threshold based on number of models
   */
  getRecommendedThreshold(modelCount: number): number {
    if (modelCount <= 2) return 0.7; // 70% agreement for 2 models
    if (modelCount <= 4) return 0.6; // 60% agreement for 3-4 models
    return 0.5; // 50% agreement for 5+ models (majority rule)
  }
}
