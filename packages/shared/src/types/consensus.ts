import type { ModelResponse } from "./model";

/**
 * Consensus Types - Multi-AI deliberation, synthesis, and debate
 * Steps 90-92: Multi-AI Consensus System
 */

export interface QuorumConfig {
  models: string[]; // Model IDs to participate in quorum
  threshold: number; // Minimum agreement threshold (0-1)
  timeout?: number; // Optional timeout in milliseconds
}

export interface ModelQuery {
  model: string;
  prompt: string;
  systemPrompt?: string;
  temperature?: number;
}

export interface QuorumResponse {
  query: string;
  responses: ModelResponse[];
  agreement: number; // 0-1 (percentage of agreement)
  consensus: string | null; // Synthesized consensus if agreement >= threshold
  disagreements: string[]; // Points of disagreement
  timestamp: Date;
}

export interface DeliberationResult {
  query: string;
  models: string[];
  responses: ModelResponse[];
  parallelDuration: number; // Time taken for parallel queries (ms)
  timestamp: Date;
}

export interface AgreementDetection {
  agreementScore: number; // 0-1 (0 = complete disagreement, 1 = complete agreement)
  commonPoints: string[]; // Points where all models agree
  disagreements: {
    topic: string;
    positions: { model: string; position: string }[];
  }[];
  confidence: number; // Confidence in agreement detection (0-1)
}

export interface SynthesisResult {
  originalResponses: ModelResponse[];
  synthesis: string; // Synthesized response combining all perspectives
  agreementAnalysis: AgreementDetection;
  recommendations: string[]; // Synthesizer's recommendations
  timestamp: Date;
}

export interface DebateRoundConfig {
  models: string[]; // Models participating in debate
  topic: string; // Debate topic/question
  rounds: number; // Number of debate rounds
  roundDuration?: number; // Max duration per round (ms)
  judgeModel?: string; // Optional model to judge the debate
}

export interface DebateTurn {
  model: string;
  round: number;
  content: string; // The argument or response
  timestamp: Date;
  referencedTurns?: number[]; // Turn indices this response references
}

export interface DebateRound {
  roundNumber: number;
  turns: DebateTurn[];
  summary: string; // Summary of the round
  keyPoints: string[]; // Key points raised
}

export interface DebateResult {
  topic: string;
  models: string[];
  rounds: DebateRound[];
  finalSynthesis: string; // Synthesis after all rounds
  winner?: string; // Optional: model deemed to have "won" the debate
  judgeReasoning?: string; // Optional: judge's reasoning
  duration: number; // Total debate duration (ms)
  timestamp: Date;
}

export interface ConsensusMethod {
  type: "deliberation" | "synthesis" | "debate";
  config: QuorumConfig | DebateRoundConfig;
}
