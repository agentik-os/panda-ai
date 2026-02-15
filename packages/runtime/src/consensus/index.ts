/**
 * Multi-AI Consensus System
 * Steps 90-92: Deliberation, Synthesis, Debate
 */

export { ParallelQueryEngine, type ProviderConfig, type ParallelQueryConfig } from "./parallel-query";
export { QuorumManager } from "./quorum";
export { DeliberationEngine, type DeliberationConfig } from "./deliberation";
export { AgreementDetector } from "./agreement-detector";
export { SynthesisAgent, type SynthesisConfig } from "./synthesis";
export { RoundManager, type RoundConfig } from "./round-manager";
export { DebateProtocol } from "./debate";

// Re-export consensus types from shared
export type {
  QuorumConfig,
  QuorumResponse,
  ModelQuery,
  DeliberationResult,
  AgreementDetection,
  SynthesisResult,
  DebateRoundConfig,
  DebateTurn,
  DebateRound,
  DebateResult,
  ConsensusMethod,
} from "@agentik-os/shared";
