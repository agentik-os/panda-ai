/**
 * Round Manager
 * Step-092: Multi-AI Consensus - Debate Protocol
 *
 * Manages debate rounds and turn-taking between AI models
 */

import type { DebateRound, DebateTurn } from "@agentik-os/shared";

export interface RoundConfig {
  models: string[];
  roundNumber: number;
  topic: string;
  previousRounds?: DebateRound[];
  roundDuration?: number;
}

export class RoundManager {
  /**
   * Execute a single debate round
   */
  async executeRound(
    config: RoundConfig,
    queryModel: (model: string, prompt: string) => Promise<string>
  ): Promise<DebateRound> {
    const turns: DebateTurn[] = [];

    // Build context from previous rounds
    const context = this.buildRoundContext(config.topic, config.previousRounds);

    // Each model gets a turn
    for (let i = 0; i < config.models.length; i++) {
      const model = config.models[i]!;
      const isFirstTurn = turns.length === 0;

      // Build prompt for this turn
      const prompt = this.buildTurnPrompt(
        config.topic,
        context,
        turns,
        config.roundNumber,
        isFirstTurn
      );

      try {
        const content = await queryModel(model, prompt);

        const turn: DebateTurn = {
          model,
          round: config.roundNumber,
          content,
          timestamp: new Date(),
          referencedTurns: this.detectReferences(content, turns),
        };

        turns.push(turn);
      } catch (error) {
        console.warn(`Model ${model} failed in round ${config.roundNumber}:`, error);
        // Continue with other models
      }
    }

    // Generate round summary
    const summary = this.summarizeRound(turns);

    // Extract key points
    const keyPoints = this.extractKeyPoints(turns);

    return {
      roundNumber: config.roundNumber,
      turns,
      summary,
      keyPoints,
    };
  }

  /**
   * Build context from previous rounds
   */
  private buildRoundContext(topic: string, previousRounds?: DebateRound[]): string {
    if (!previousRounds || previousRounds.length === 0) {
      return `Debate Topic: ${topic}\n\nThis is the first round of debate.`;
    }

    let context = `Debate Topic: ${topic}\n\n`;
    context += `Previous Rounds (${previousRounds.length}):\n\n`;

    for (const round of previousRounds) {
      context += `## Round ${round.roundNumber}:\n`;
      context += `Summary: ${round.summary}\n`;
      context += `Key Points:\n`;
      round.keyPoints.forEach((kp: string) => {
        context += `- ${kp}\n`;
      });
      context += `\n`;
    }

    return context;
  }

  /**
   * Build prompt for a debate turn
   */
  private buildTurnPrompt(
    topic: string,
    context: string,
    previousTurns: DebateTurn[],
    roundNumber: number,
    isFirstTurn: boolean
  ): string {
    let prompt = context + `\n`;

    if (isFirstTurn) {
      prompt += `You are the first to speak in Round ${roundNumber}.\n`;
      prompt += `Present your position on: "${topic}"\n`;
      prompt += `Provide clear arguments and reasoning.`;
    } else {
      prompt += `\nPrevious arguments in this round:\n\n`;
      previousTurns.forEach((turn, idx) => {
        prompt += `${idx + 1}. ${turn.model}:\n${turn.content}\n\n`;
      });

      prompt += `Now it's your turn.\n`;
      prompt += `Respond to the previous arguments, either:\n`;
      prompt += `- Supporting and building on them\n`;
      prompt += `- Challenging them with counterarguments\n`;
      prompt += `- Offering a different perspective\n`;
      prompt += `\nBe specific about which points you're addressing.`;
    }

    return prompt;
  }

  /**
   * Detect which previous turns are referenced in this turn
   */
  private detectReferences(content: string, previousTurns: DebateTurn[]): number[] {
    const references: number[] = [];

    previousTurns.forEach((turn, idx) => {
      // Check if model name is mentioned
      if (content.includes(turn.model)) {
        references.push(idx);
        return;
      }

      // Check for explicit references like "Point 1", "Argument 2", etc.
      const refPatterns = [
        new RegExp(`\\b(?:point|argument|position)\\s*${idx + 1}\\b`, "i"),
        new RegExp(`\\b(?:previous|earlier)\\s+(?:point|argument)`, "i"),
      ];

      if (refPatterns.some((pattern) => pattern.test(content))) {
        references.push(idx);
      }
    });

    return references;
  }

  /**
   * Summarize round
   */
  private summarizeRound(turns: DebateTurn[]): string {
    if (turns.length === 0) return "No turns in this round";

    const turnCount = turns.length;

    let summary = `${turnCount} participants contributed. `;

    // Check for agreement vs disagreement
    const hasAgreement = turns.some((t) => /\b(agree|support|concur)\b/i.test(t.content));
    const hasDisagreement = turns.some((t) =>
      /\b(disagree|challenge|counter|however|but)\b/i.test(t.content)
    );

    if (hasAgreement && hasDisagreement) {
      summary += "Mixed perspectives with both agreement and counterarguments.";
    } else if (hasAgreement) {
      summary += "General agreement among participants.";
    } else if (hasDisagreement) {
      summary += "Significant debate with differing viewpoints.";
    } else {
      summary += "Diverse perspectives presented.";
    }

    return summary;
  }

  /**
   * Extract key points from round
   */
  private extractKeyPoints(turns: DebateTurn[]): string[] {
    const keyPoints: string[] = [];

    for (const turn of turns) {
      // Extract sentences with key indicators
      const sentences = turn.content.split(/[.!?]+/).map((s: string) => s.trim());

      for (const sentence of sentences) {
        if (sentence.length < 20) continue;

        // Key indicators
        const isKeyPoint =
          /\b(argue|claim|assert|believe|propose|suggest|recommend)\b/i.test(sentence) ||
          /\b(important|critical|essential|key|main)\b/i.test(sentence) ||
          /\b(therefore|thus|consequently|as a result)\b/i.test(sentence) ||
          /\b(first|second|third|finally)\b/i.test(sentence);

        if (isKeyPoint) {
          keyPoints.push(`${turn.model}: ${sentence}`);
        }
      }
    }

    return keyPoints.slice(0, 10); // Top 10 key points
  }

  /**
   * Check if round should continue
   */
  shouldContinueRound(round: DebateRound, maxRounds: number): boolean {
    // Don't exceed max rounds
    if (round.roundNumber >= maxRounds) return false;

    // Continue if there are significant disagreements
    const hasDisagreement = round.turns.some((t: { content: string }) =>
      /\b(disagree|challenge|counter|however|but)\b/i.test(t.content)
    );

    // Continue if new points are being raised
    const newPointsRaised = round.keyPoints.length > 0;

    return hasDisagreement || newPointsRaised;
  }

  /**
   * Determine if consensus has been reached
   */
  hasConsensus(rounds: DebateRound[]): boolean {
    if (rounds.length === 0) return false;

    const lastRound = rounds[rounds.length - 1]!;

    // Check if last round shows agreement
    const agreementCount = lastRound.turns.filter((t: { content: string }) =>
      /\b(agree|support|concur|consensus)\b/i.test(t.content)
    ).length;

    const consensusRatio = agreementCount / lastRound.turns.length;

    return consensusRatio >= 0.66; // 2/3 agreement = consensus
  }
}
