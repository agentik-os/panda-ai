/**
 * Debate Protocol
 * Step-092: Multi-AI Consensus - Debate Protocol
 *
 * Structured debate system where AI models challenge and refine each other's arguments
 */

import type { DebateRoundConfig, DebateResult, DebateRound } from "@agentik-os/shared";
import { RoundManager } from "./round-manager";
import { SynthesisAgent } from "./synthesis";
import { ParallelQueryEngine, type ProviderConfig } from "./parallel-query";

export class DebateProtocol {
  private roundManager: RoundManager;
  private queryEngine: ParallelQueryEngine;
  private synthesisAgent: SynthesisAgent;

  constructor(providerConfig: ProviderConfig) {
    this.roundManager = new RoundManager();
    this.queryEngine = new ParallelQueryEngine(providerConfig);
    this.synthesisAgent = new SynthesisAgent(providerConfig.anthropicApiKey);
  }

  /**
   * Execute full debate protocol
   */
  async debate(config: DebateRoundConfig): Promise<DebateResult> {
    if (config.models.length < 2) {
      throw new Error("Debate requires at least 2 models");
    }

    const startTime = Date.now();
    const rounds: DebateRound[] = [];

    // Execute debate rounds
    for (let roundNum = 1; roundNum <= config.rounds; roundNum++) {
      console.log(`Executing debate round ${roundNum}/${config.rounds}...`);

      const round = await this.roundManager.executeRound(
        {
          models: config.models,
          roundNumber: roundNum,
          topic: config.topic,
          previousRounds: rounds,
          roundDuration: config.roundDuration,
        },
        (model, prompt) => this.queryModel(model, prompt)
      );

      rounds.push(round);

      // Check for early consensus
      if (this.roundManager.hasConsensus(rounds)) {
        console.log(`Consensus reached in round ${roundNum}`);
        break;
      }

      // Check if should continue
      if (!this.roundManager.shouldContinueRound(round, config.rounds)) {
        console.log(`Debate naturally concluded after round ${roundNum}`);
        break;
      }
    }

    // Synthesize final outcome
    const finalSynthesis = await this.synthesizeDebate(config.topic, rounds);

    // Optional: Get judge verdict
    let winner: string | undefined;
    let judgeReasoning: string | undefined;

    if (config.judgeModel) {
      const verdict = await this.judgeDebate(config.topic, rounds, config.judgeModel);
      winner = verdict.winner;
      judgeReasoning = verdict.reasoning;
    }

    const duration = Date.now() - startTime;

    return {
      topic: config.topic,
      models: config.models,
      rounds,
      finalSynthesis,
      winner,
      judgeReasoning,
      duration,
      timestamp: new Date(),
    };
  }

  /**
   * Query a single model
   */
  private async queryModel(modelId: string, prompt: string): Promise<string> {
    const result = await this.queryEngine.execute({
      query: prompt,
      models: [modelId],
      temperature: 0.7,
    });

    if (result.responses.length === 0) {
      throw new Error(`No response from model: ${modelId}`);
    }

    return result.responses[0]!.content;
  }

  /**
   * Synthesize debate into final summary
   */
  private async synthesizeDebate(topic: string, rounds: DebateRound[]): Promise<string> {
    // Collect all turns from all rounds
    const allTurns = rounds.flatMap((r) => r.turns);

    // Convert to model responses format
    const responses = allTurns.map((turn) => ({
      content: turn.content,
      model: turn.model,
      usage: { promptTokens: 0, completionTokens: 0, totalTokens: 0 },
      finishReason: "stop",
    }));

    // Use synthesis agent
    try {
      const synthesis = await this.synthesisAgent.synthesize({
        responses,
        query: topic,
      });

      return this.formatDebateSynthesis(rounds, synthesis.synthesis);
    } catch (error) {
      console.warn("Failed to synthesize debate, using fallback:", error);
      return this.fallbackSynthesis(rounds);
    }
  }

  /**
   * Format debate synthesis
   */
  private formatDebateSynthesis(rounds: DebateRound[], synthesis: string): string {
    let formatted = `# Debate Summary: ${rounds.length} Rounds\n\n`;

    formatted += `## Round-by-Round Overview:\n\n`;
    rounds.forEach((round) => {
      formatted += `**Round ${round.roundNumber}:** ${round.summary}\n`;
      formatted += `Key Points:\n`;
      round.keyPoints.forEach((kp: string) => {
        formatted += `- ${kp}\n`;
      });
      formatted += `\n`;
    });

    formatted += `## Final Synthesis:\n\n${synthesis}`;

    return formatted;
  }

  /**
   * Fallback synthesis when AI synthesis fails
   */
  private fallbackSynthesis(rounds: DebateRound[]): string {
    let synthesis = `Debate Summary (${rounds.length} rounds):\n\n`;

    rounds.forEach((round) => {
      synthesis += `Round ${round.roundNumber}: ${round.summary}\n`;
    });

    synthesis += `\n`;
    synthesis += `Key Points Across All Rounds:\n`;

    const allKeyPoints = rounds.flatMap((r) => r.keyPoints);
    allKeyPoints.slice(0, 15).forEach((kp) => {
      synthesis += `- ${kp}\n`;
    });

    return synthesis;
  }

  /**
   * Judge debate and determine winner
   */
  private async judgeDebate(
    topic: string,
    rounds: DebateRound[],
    judgeModel: string
  ): Promise<{ winner: string; reasoning: string }> {
    const judgePrompt = this.buildJudgePrompt(topic, rounds);

    try {
      const judgement = await this.queryModel(judgeModel, judgePrompt);

      // Parse judgement (look for winner declaration)
      const winner = this.parseWinner(judgement, rounds);

      return {
        winner: winner || "No clear winner",
        reasoning: judgement,
      };
    } catch (error) {
      console.warn("Failed to get judge verdict:", error);
      return {
        winner: "Judgement failed",
        reasoning: "Unable to render verdict",
      };
    }
  }

  /**
   * Build judge prompt
   */
  private buildJudgePrompt(topic: string, rounds: DebateRound[]): string {
    let prompt = `You are an impartial judge evaluating a debate on: "${topic}"\n\n`;

    prompt += `The debate had ${rounds.length} rounds with the following participants:\n`;

    // List unique participants
    const participants = new Set<string>();
    rounds.forEach((r) => r.turns.forEach((t: { model: string }) => participants.add(t.model)));
    participants.forEach((p: string) => {
      prompt += `- ${p}\n`;
    });

    prompt += `\n## Debate Transcript:\n\n`;

    rounds.forEach((round) => {
      prompt += `### Round ${round.roundNumber}:\n\n`;
      round.turns.forEach((turn: { model: string; content: string }, idx: number) => {
        prompt += `${idx + 1}. **${turn.model}:**\n${turn.content}\n\n`;
      });
    });

    prompt += `\n## Your Task:\n`;
    prompt += `Evaluate the debate and determine:\n`;
    prompt += `1. Which participant made the strongest arguments\n`;
    prompt += `2. Who provided the best evidence and reasoning\n`;
    prompt += `3. Who addressed counterarguments most effectively\n\n`;
    prompt += `Declare a winner and provide your reasoning.`;

    return prompt;
  }

  /**
   * Parse winner from judge's response
   */
  private parseWinner(judgement: string, rounds: DebateRound[]): string | undefined {
    // Get list of participants
    const participants = new Set<string>();
    rounds.forEach((r) => r.turns.forEach((t) => participants.add(t.model)));

    // Look for winner declaration
    for (const participant of participants) {
      const winnerPatterns = [
        new RegExp(`${participant}\\s+(?:wins|won|is the winner)`, "i"),
        new RegExp(`winner\\s+is\\s+${participant}`, "i"),
        new RegExp(`declare\\s+${participant}\\s+(?:as\\s+)?(?:the\\s+)?winner`, "i"),
      ];

      if (winnerPatterns.some((pattern: RegExp) => pattern.test(judgement))) {
        return participant;
      }
    }

    return undefined;
  }

  /**
   * Validate debate configuration
   */
  validateConfig(config: DebateRoundConfig): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (config.models.length < 2) {
      errors.push("Debate requires at least 2 models");
    }

    if (config.rounds < 1) {
      errors.push("Debate requires at least 1 round");
    }

    if (config.rounds > 10) {
      errors.push("Maximum 10 rounds allowed");
    }

    if (!config.topic || config.topic.trim().length === 0) {
      errors.push("Debate topic cannot be empty");
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
