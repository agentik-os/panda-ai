/**
 * Real-Time Cost Calculator
 *
 * Computes AI model costs on every message in real-time.
 * Uses pricing.json for accurate, up-to-date pricing across all providers.
 *
 * @example
 * ```ts
 * const cost = calculateModelCost({
 *   model: "claude-opus-4",
 *   provider: "anthropic",
 *   inputTokens: 1500,
 *   outputTokens: 800
 * });
 * // Returns: { input: 0.0225, output: 0.06, total: 0.0825 }
 * ```
 */

import pricingData from "./pricing.json";

/**
 * Pricing information for a specific model
 */
export interface ModelPricing {
  input: number; // USD per 1M tokens
  output: number; // USD per 1M tokens
  contextWindow: number;
  description: string;
}

/**
 * Cost breakdown for a model request
 */
export interface CostBreakdown {
  inputCost: number; // USD
  outputCost: number; // USD
  totalCost: number; // USD
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  model: string;
  provider: string;
}

/**
 * Input for cost calculation
 */
export interface CostCalculationInput {
  model: string;
  provider: string;
  inputTokens: number;
  outputTokens: number;
}

/**
 * Get pricing for a specific model
 *
 * @param provider - Model provider (e.g., "anthropic", "openai")
 * @param model - Model name (e.g., "claude-opus-4")
 * @returns Model pricing or null if not found
 */
export function getModelPricing(
  provider: string,
  model: string
): ModelPricing | null {
  const providerPricing = (pricingData.models as Record<string, any>)[provider];
  if (!providerPricing) {
    return null;
  }

  const modelPricing = providerPricing[model];
  if (!modelPricing) {
    return null;
  }

  return modelPricing as ModelPricing;
}

/**
 * Calculate cost for a model request
 *
 * Computes input cost, output cost, and total cost based on token usage
 * and the model's pricing from pricing.json.
 *
 * @param input - Model, provider, and token counts
 * @returns Cost breakdown with input/output/total costs
 * @throws Error if model pricing not found
 */
export function calculateModelCost(
  input: CostCalculationInput
): CostBreakdown {
  const pricing = getModelPricing(input.provider, input.model);

  if (!pricing) {
    throw new Error(
      `Pricing not found for ${input.provider}/${input.model}. Update pricing.json.`
    );
  }

  // Calculate costs (pricing is per 1M tokens)
  const inputCost = (input.inputTokens / 1_000_000) * pricing.input;
  const outputCost = (input.outputTokens / 1_000_000) * pricing.output;
  const totalCost = inputCost + outputCost;

  return {
    inputCost,
    outputCost,
    totalCost,
    inputTokens: input.inputTokens,
    outputTokens: input.outputTokens,
    totalTokens: input.inputTokens + input.outputTokens,
    model: input.model,
    provider: input.provider,
  };
}

/**
 * Estimate cost for a request before execution
 *
 * Useful for budget checks and cost predictions.
 *
 * @param provider - Model provider
 * @param model - Model name
 * @param estimatedInputTokens - Estimated input tokens
 * @param estimatedOutputTokens - Estimated output tokens
 * @returns Estimated cost breakdown
 */
export function estimateCost(
  provider: string,
  model: string,
  estimatedInputTokens: number,
  estimatedOutputTokens: number
): CostBreakdown {
  return calculateModelCost({
    provider,
    model,
    inputTokens: estimatedInputTokens,
    outputTokens: estimatedOutputTokens,
  });
}

/**
 * Get all available models and their pricing
 *
 * @returns Map of provider -> model -> pricing
 */
export function getAllPricing(): Record<string, Record<string, ModelPricing>> {
  return pricingData.models as Record<string, Record<string, ModelPricing>>;
}

/**
 * Get cheapest model for a given provider
 *
 * Compares total cost (input + output) to determine cheapest model.
 *
 * @param provider - Model provider
 * @param inputTokens - Number of input tokens
 * @param outputTokens - Number of output tokens
 * @returns Model name and cost, or null if provider not found
 */
export function getCheapestModel(
  provider: string,
  inputTokens: number,
  outputTokens: number
): { model: string; cost: number } | null {
  const providerPricing = (pricingData.models as Record<string, any>)[provider];
  if (!providerPricing) {
    return null;
  }

  let cheapest: { model: string; cost: number } | null = null;

  for (const [modelName, _pricing] of Object.entries(providerPricing)) {
    const cost = calculateModelCost({
      provider,
      model: modelName,
      inputTokens,
      outputTokens,
    });

    if (!cheapest || cost.totalCost < cheapest.cost) {
      cheapest = {
        model: modelName,
        cost: cost.totalCost,
      };
    }
  }

  return cheapest;
}

/**
 * Format cost for display
 *
 * @param cost - Cost in USD
 * @returns Formatted cost string
 */
export function formatCost(cost: number): string {
  if (cost === 0) {
    return "$0.00";
  }

  if (cost < 0.01) {
    return `$${(cost * 100).toFixed(4)}¢`;
  }

  return `$${cost.toFixed(4)}`;
}
