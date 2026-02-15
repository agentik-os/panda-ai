/**
 * Agreement Detector
 * Step-091: Multi-AI Consensus - Synthesis Agent
 *
 * Analyzes AI responses to detect agreement/disagreement patterns
 */

import type { ModelResponse, AgreementDetection } from "@agentik-os/shared";

export class AgreementDetector {
  /**
   * Analyze responses to detect agreement patterns
   */
  detectAgreement(responses: ModelResponse[]): AgreementDetection {
    if (responses.length < 2) {
      throw new Error("Agreement detection requires at least 2 responses");
    }

    // Extract structured points from each response
    const responsePoints = responses.map((r) => ({
      model: r.model,
      points: this.extractPoints(r.content),
    }));

    // Find common points
    const commonPoints = this.findCommonPoints(responsePoints);

    // Find disagreements
    const disagreements = this.findDisagreements(responsePoints);

    // Calculate overall agreement score
    const agreementScore = this.calculateAgreementScore(responsePoints, commonPoints, disagreements);

    // Calculate confidence in detection
    const confidence = this.calculateConfidence(responses);

    return {
      agreementScore,
      commonPoints,
      disagreements,
      confidence,
    };
  }

  /**
   * Extract key points from response content
   */
  private extractPoints(content: string): string[] {
    // Split by common delimiters (bullets, numbers, newlines)
    const lines = content.split(/\n+/);

    const points: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip empty lines or very short lines
      if (trimmed.length < 10) continue;

      // Extract numbered points (1., 2., etc.)
      if (/^\d+\./.test(trimmed)) {
        points.push(trimmed.replace(/^\d+\.\s*/, ""));
        continue;
      }

      // Extract bullet points (-, *, •, etc.)
      if (/^[-*•]\s/.test(trimmed)) {
        points.push(trimmed.replace(/^[-*•]\s*/, ""));
        continue;
      }

      // Extract sentences that look like key points (contain keywords)
      if (this.isKeyPoint(trimmed)) {
        points.push(trimmed);
      }
    }

    return points.slice(0, 20); // Limit to top 20 points
  }

  /**
   * Check if a sentence is a key point
   */
  private isKeyPoint(sentence: string): boolean {
    const keywordPatterns = [
      /important|critical|essential|key|main|primary|fundamental/i,
      /recommend|suggest|advise|propose/i,
      /should|must|need to|have to/i,
      /therefore|thus|consequently|as a result/i,
      /first|second|third|finally/i,
    ];

    return keywordPatterns.some((pattern) => pattern.test(sentence));
  }

  /**
   * Find points that appear across multiple responses
   */
  private findCommonPoints(
    responsePoints: Array<{ model: string; points: string[] }>
  ): string[] {
    const commonPoints: string[] = [];
    const allPoints: string[] = [];

    // Collect all points
    for (const rp of responsePoints) {
      allPoints.push(...rp.points);
    }

    // Find points mentioned in multiple responses
    const pointCounts = new Map<string, number>();

    for (const point of allPoints) {
      const normalized = this.normalizePoint(point);
      pointCounts.set(normalized, (pointCounts.get(normalized) || 0) + 1);
    }

    // Common points = mentioned in majority of responses
    const majorityThreshold = Math.ceil(responsePoints.length / 2);

    for (const [point, count] of pointCounts.entries()) {
      if (count >= majorityThreshold) {
        commonPoints.push(point);
      }
    }

    return commonPoints.slice(0, 10); // Top 10 common points
  }

  /**
   * Find disagreements between responses
   */
  private findDisagreements(
    responsePoints: Array<{ model: string; points: string[] }>
  ): Array<{ topic: string; positions: Array<{ model: string; position: string }> }> {
    const disagreements: Array<{
      topic: string;
      positions: Array<{ model: string; position: string }>;
    }> = [];

    // Look for contradictory keywords
    const contradictionPatterns = [
      { positive: /\b(yes|agree|correct|true|should)\b/i, negative: /\b(no|disagree|incorrect|false|should not)\b/i },
      { positive: /\b(beneficial|advantage|positive)\b/i, negative: /\b(harmful|disadvantage|negative)\b/i },
      { positive: /\b(increase|more|higher)\b/i, negative: /\b(decrease|less|lower)\b/i },
    ];

    // Extract topics from first response
    const topics = this.extractTopics(responsePoints[0]?.points || []);

    for (const topic of topics) {
      const positions: Array<{ model: string; position: string }> = [];

      for (const rp of responsePoints) {
        // Find points related to this topic
        const relatedPoints = rp.points.filter((p) =>
          this.normalizePoint(p).includes(this.normalizePoint(topic))
        );

        if (relatedPoints.length > 0) {
          // Check for contradictions
          const hasPositive = relatedPoints.some((p) =>
            contradictionPatterns.some((cp) => cp.positive.test(p))
          );
          const hasNegative = relatedPoints.some((p) =>
            contradictionPatterns.some((cp) => cp.negative.test(p))
          );

          if ((hasPositive || hasNegative) && relatedPoints[0]) {
            positions.push({
              model: rp.model,
              position: relatedPoints[0], // First related point
            });
          }
        }
      }

      // If we have different positions on this topic, it's a disagreement
      if (positions.length >= 2) {
        disagreements.push({ topic, positions });
      }
    }

    return disagreements.slice(0, 5); // Top 5 disagreements
  }

  /**
   * Extract topics from points (simplified: use first few words)
   */
  private extractTopics(points: string[]): string[] {
    return points.map((p) => {
      // Take first 3-5 words as topic
      const words = p.split(/\s+/).slice(0, 4).join(" ");
      return words;
    });
  }

  /**
   * Normalize point for comparison
   */
  private normalizePoint(point: string): string {
    return point
      .toLowerCase()
      .replace(/[^\w\s]/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  /**
   * Calculate overall agreement score
   */
  private calculateAgreementScore(
    responsePoints: Array<{ model: string; points: string[] }>,
    commonPoints: string[],
    disagreements: Array<{ topic: string; positions: any[] }>
  ): number {
    const totalPoints = responsePoints.reduce((sum, rp) => sum + rp.points.length, 0);
    const avgPointsPerResponse = totalPoints / responsePoints.length;

    // Agreement score based on ratio of common points to total points
    const commonPointsRatio = commonPoints.length / Math.max(avgPointsPerResponse, 1);

    // Penalty for disagreements
    const disagreementPenalty = disagreements.length * 0.1;

    // Final score (0-1)
    const score = Math.max(0, Math.min(1, commonPointsRatio - disagreementPenalty));

    return Math.round(score * 100) / 100; // Round to 2 decimals
  }

  /**
   * Calculate confidence in agreement detection
   */
  private calculateConfidence(responses: ModelResponse[]): number {
    // Confidence based on:
    // 1. Number of responses (more = higher confidence)
    // 2. Response length consistency (similar lengths = higher confidence)
    // 3. Token count (more tokens = more data to analyze)

    const responseCount = responses.length;
    const lengths = responses.map((r) => r.content.length);
    const avgLength = lengths.reduce((sum, l) => sum + l, 0) / lengths.length;

    // Length consistency (lower variance = higher confidence)
    const variance = lengths.reduce((sum, l) => sum + Math.pow(l - avgLength, 2), 0) / lengths.length;
    const lengthConsistency = Math.max(0, 1 - variance / (avgLength * avgLength));

    // Base confidence from response count
    const countConfidence = Math.min(1, responseCount / 5); // Max at 5 responses

    // Token availability (assuming 4 chars = 1 token)
    const avgTokens = avgLength / 4;
    const tokenConfidence = Math.min(1, avgTokens / 500); // Max at 500 tokens

    // Combined confidence
    const confidence = (countConfidence + lengthConsistency + tokenConfidence) / 3;

    return Math.round(confidence * 100) / 100; // Round to 2 decimals
  }
}
