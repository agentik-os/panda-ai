/**
 * Synthesis Agent
 * Step-091: Multi-AI Consensus - Synthesis Agent
 *
 * Meta-agent that synthesizes responses from multiple AI models into a unified answer
 */

import type { ModelResponse, SynthesisResult } from "@agentik-os/shared";
import { AgreementDetector } from "./agreement-detector";
import { AnthropicProvider } from "../router/providers/anthropic";

export interface SynthesisConfig {
  responses: ModelResponse[];
  query: string;
  synthesisModel?: string; // Model to use for synthesis (default: claude-4-opus)
  anthropicApiKey?: string;
}

export class SynthesisAgent {
  private agreementDetector: AgreementDetector;
  private synthesisProvider: AnthropicProvider | null;

  constructor(anthropicApiKey?: string) {
    this.agreementDetector = new AgreementDetector();
    this.synthesisProvider = anthropicApiKey
      ? new AnthropicProvider({ apiKey: anthropicApiKey })
      : null;
  }

  /**
   * Synthesize multiple AI responses into a unified answer
   */
  async synthesize(config: SynthesisConfig): Promise<SynthesisResult> {
    if (config.responses.length < 2) {
      throw new Error("Synthesis requires at least 2 responses");
    }

    // Step 1: Detect agreement patterns
    const agreementAnalysis = this.agreementDetector.detectAgreement(config.responses);

    // Step 2: Generate synthesis
    const synthesis = await this.generateSynthesis(
      config.query,
      config.responses,
      agreementAnalysis,
      config.synthesisModel
    );

    // Step 3: Generate recommendations
    const recommendations = this.generateRecommendations(agreementAnalysis);

    return {
      originalResponses: config.responses,
      synthesis,
      agreementAnalysis,
      recommendations,
      timestamp: new Date(),
    };
  }

  /**
   * Generate synthesized response
   */
  private async generateSynthesis(
    query: string,
    responses: ModelResponse[],
    agreementAnalysis: any,
    synthesisModel = "claude-4-opus-20250514"
  ): Promise<string> {
    // If no synthesis provider, use rule-based synthesis
    if (!this.synthesisProvider) {
      return this.ruleBasedSynthesis(responses, agreementAnalysis);
    }

    // Use AI to synthesize responses
    const synthesisPrompt = this.buildSynthesisPrompt(query, responses, agreementAnalysis);

    const systemPrompt = `You are a meta-AI that synthesizes responses from multiple AI models.
Your goal is to create a unified, comprehensive answer that:
1. Incorporates all common points where models agree
2. Addresses disagreements by presenting multiple perspectives
3. Provides clear, actionable recommendations
4. Maintains objectivity and acknowledges uncertainty where appropriate`;

    try {
      const result = await this.synthesisProvider.chat(
        [{ role: "user" as const, content: synthesisPrompt }],
        synthesisModel,
        systemPrompt,
        0.5 // Lower temperature for more consistent synthesis
      );

      return result.content;
    } catch (error) {
      console.warn("AI synthesis failed, falling back to rule-based synthesis:", error);
      return this.ruleBasedSynthesis(responses, agreementAnalysis);
    }
  }

  /**
   * Build synthesis prompt for AI
   */
  private buildSynthesisPrompt(
    query: string,
    responses: ModelResponse[],
    agreementAnalysis: any
  ): string {
    let prompt = `Original question: "${query}"\n\n`;

    prompt += `I have received ${responses.length} responses from different AI models.\n\n`;

    // Add individual responses
    prompt += `## Individual Responses:\n\n`;
    responses.forEach((r, idx) => {
      prompt += `### Model ${idx + 1} (${r.model}):\n${r.content}\n\n`;
    });

    // Add agreement analysis
    prompt += `## Agreement Analysis:\n`;
    prompt += `- Agreement Score: ${agreementAnalysis.agreementScore}\n`;
    prompt += `- Confidence: ${agreementAnalysis.confidence}\n\n`;

    if (agreementAnalysis.commonPoints.length > 0) {
      prompt += `Common Points:\n`;
      agreementAnalysis.commonPoints.forEach((point: string) => {
        prompt += `- ${point}\n`;
      });
      prompt += `\n`;
    }

    if (agreementAnalysis.disagreements.length > 0) {
      prompt += `Disagreements:\n`;
      agreementAnalysis.disagreements.forEach((dis: any) => {
        prompt += `- Topic: ${dis.topic}\n`;
        dis.positions.forEach((pos: any) => {
          prompt += `  - ${pos.model}: ${pos.position}\n`;
        });
      });
      prompt += `\n`;
    }

    prompt += `Please synthesize these responses into a unified, comprehensive answer that addresses the original question.`;

    return prompt;
  }

  /**
   * Rule-based synthesis (fallback when no AI synthesis available)
   */
  private ruleBasedSynthesis(responses: ModelResponse[], agreementAnalysis: any): string {
    let synthesis = `Synthesis of ${responses.length} AI responses:\n\n`;

    // Add common points
    if (agreementAnalysis.commonPoints.length > 0) {
      synthesis += `**Common Ground (Agreement: ${agreementAnalysis.agreementScore}):**\n`;
      agreementAnalysis.commonPoints.forEach((point: string) => {
        synthesis += `- ${point}\n`;
      });
      synthesis += `\n`;
    }

    // Add disagreements
    if (agreementAnalysis.disagreements.length > 0) {
      synthesis += `**Areas of Disagreement:**\n`;
      agreementAnalysis.disagreements.forEach((dis: any) => {
        synthesis += `\nTopic: ${dis.topic}\n`;
        dis.positions.forEach((pos: any) => {
          synthesis += `- ${pos.model}: ${pos.position}\n`;
        });
      });
      synthesis += `\n`;
    }

    // Add most comprehensive response
    const longestResponse = responses.reduce((prev, current) =>
      current.content.length > prev.content.length ? current : prev
    );

    synthesis += `**Detailed Response (from ${longestResponse.model}):**\n`;
    synthesis += longestResponse.content;

    return synthesis;
  }

  /**
   * Generate recommendations based on agreement analysis
   */
  private generateRecommendations(agreementAnalysis: any): string[] {
    const recommendations: string[] = [];

    // Recommendation based on agreement score
    if (agreementAnalysis.agreementScore >= 0.8) {
      recommendations.push("High agreement across models - proceed with confidence");
    } else if (agreementAnalysis.agreementScore >= 0.5) {
      recommendations.push("Moderate agreement - consider addressing disagreements");
    } else {
      recommendations.push("Low agreement - significant divergence in responses, recommend further investigation");
    }

    // Recommendation based on confidence
    if (agreementAnalysis.confidence >= 0.8) {
      recommendations.push("High confidence in agreement analysis");
    } else if (agreementAnalysis.confidence < 0.5) {
      recommendations.push("Low confidence - consider gathering more responses");
    }

    // Recommendation for disagreements
    if (agreementAnalysis.disagreements.length > 0) {
      recommendations.push(
        `${agreementAnalysis.disagreements.length} disagreements identified - review each perspective`
      );
    }

    // Recommendation based on common points
    if (agreementAnalysis.commonPoints.length === 0) {
      recommendations.push("No clear common points - responses may be addressing different aspects");
    }

    return recommendations;
  }

  /**
   * Compare synthesis quality across different synthesis models
   */
  async compareSynthesisMethods(
    config: SynthesisConfig,
    synthesisModels: string[]
  ): Promise<Map<string, SynthesisResult>> {
    const results = new Map<string, SynthesisResult>();

    for (const model of synthesisModels) {
      try {
        const result = await this.synthesize({
          ...config,
          synthesisModel: model,
        });
        results.set(model, result);
      } catch (error) {
        console.warn(`Synthesis with model ${model} failed:`, error);
      }
    }

    return results;
  }
}
