/**
 * Deliberation Engine
 * Step-090: Multi-AI Consensus - Deliberation Engine
 *
 * Orchestrates multi-AI deliberation process using parallel queries and quorum
 */

import type { QuorumConfig, QuorumResponse } from "@agentik-os/shared";
import { ParallelQueryEngine, type ProviderConfig } from "./parallel-query";
import { QuorumManager } from "./quorum";

export interface DeliberationConfig {
  query: string;
  models: string[];
  threshold?: number; // Agreement threshold (0-1), defaults to recommended
  systemPrompt?: string;
  temperature?: number;
  timeout?: number;
}

export class DeliberationEngine {
  private queryEngine: ParallelQueryEngine;
  private quorumManager: QuorumManager;

  constructor(providerConfig: ProviderConfig) {
    this.queryEngine = new ParallelQueryEngine(providerConfig);
    this.quorumManager = new QuorumManager();
  }

  /**
   * Execute full deliberation process
   * 1. Query multiple models in parallel
   * 2. Analyze agreement via quorum
   * 3. Return consensus or identify disagreements
   */
  async deliberate(config: DeliberationConfig): Promise<QuorumResponse> {
    // Validate input
    if (config.models.length < 2) {
      throw new Error("Deliberation requires at least 2 models");
    }

    // Step 1: Execute parallel queries
    const deliberationResult = await this.queryEngine.execute({
      query: config.query,
      models: config.models,
      systemPrompt: config.systemPrompt,
      temperature: config.temperature,
      timeout: config.timeout,
    });

    // Check if we have enough successful responses
    if (deliberationResult.responses.length < 2) {
      throw new Error(
        `Deliberation failed: Only ${deliberationResult.responses.length} successful responses (minimum 2 required)`
      );
    }

    // Step 2: Calculate quorum and consensus
    const threshold = config.threshold ?? this.quorumManager.getRecommendedThreshold(config.models.length);

    const quorumConfig: QuorumConfig = {
      models: deliberationResult.models,
      threshold,
      timeout: config.timeout,
    };

    const quorumResponse = await this.quorumManager.checkQuorum(
      config.query,
      deliberationResult.responses,
      quorumConfig
    );

    return quorumResponse;
  }

  /**
   * Execute multi-round deliberation
   * Each round builds on previous round's consensus/disagreements
   */
  async deliberateMultiRound(
    config: DeliberationConfig,
    rounds: number
  ): Promise<QuorumResponse[]> {
    const results: QuorumResponse[] = [];
    let currentQuery = config.query;

    for (let round = 0; round < rounds; round++) {
      const result = await this.deliberate({
        ...config,
        query: currentQuery,
      });

      results.push(result);

      // If consensus reached, stop early
      if (result.consensus) {
        console.log(`Consensus reached in round ${round + 1}`);
        break;
      }

      // For next round, focus on disagreements
      if (result.disagreements.length > 0) {
        currentQuery = this.formulateFollowUpQuery(config.query, result.disagreements);
      } else {
        // No clear disagreements, stop
        break;
      }
    }

    return results;
  }

  /**
   * Formulate follow-up query based on disagreements
   */
  private formulateFollowUpQuery(originalQuery: string, disagreements: string[]): string {
    return `${originalQuery}\n\nIn the previous round, there were disagreements on: ${disagreements.join(", ")}. Please address these specifically.`;
  }

  /**
   * Get available models from configured providers
   */
  async getAvailableModels(): Promise<string[]> {
    return await this.queryEngine.getAvailableModels();
  }

  /**
   * Validate model availability before deliberation
   */
  async validateModels(models: string[]): Promise<{
    available: string[];
    unavailable: string[];
  }> {
    const availableModels = await this.getAvailableModels();
    const availableSet = new Set(availableModels);

    return {
      available: models.filter((m) => availableSet.has(m)),
      unavailable: models.filter((m) => !availableSet.has(m)),
    };
  }
}
