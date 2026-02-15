/**
 * Tests for Real-Time Cost Calculator
 */

import { describe, it, expect } from "vitest";
import {
  getModelPricing,
  calculateModelCost,
  estimateCost,
  getAllPricing,
  getCheapestModel,
  formatCost,
  type ModelPricing,
} from "./calculator";

describe("Cost Calculator", () => {
  describe("getModelPricing", () => {
    it("should get pricing for Claude Opus", () => {
      const pricing = getModelPricing("anthropic", "claude-opus-4");

      expect(pricing).toBeDefined();
      expect(pricing?.input).toBe(15.0);
      expect(pricing?.output).toBe(75.0);
      expect(pricing?.contextWindow).toBe(200000);
    });

    it("should get pricing for GPT-4o", () => {
      const pricing = getModelPricing("openai", "gpt-4o");

      expect(pricing).toBeDefined();
      expect(pricing?.input).toBe(5.0);
      expect(pricing?.output).toBe(15.0);
    });

    it("should get pricing for Gemini Pro", () => {
      const pricing = getModelPricing("google", "gemini-pro");

      expect(pricing).toBeDefined();
      expect(pricing?.input).toBe(0.5);
      expect(pricing?.output).toBe(1.5);
    });

    it("should return null for unknown provider", () => {
      const pricing = getModelPricing("unknown-provider", "some-model");

      expect(pricing).toBeNull();
    });

    it("should return null for unknown model", () => {
      const pricing = getModelPricing("anthropic", "unknown-model");

      expect(pricing).toBeNull();
    });
  });

  describe("calculateModelCost", () => {
    it("should calculate cost for Claude Opus", () => {
      const cost = calculateModelCost({
        provider: "anthropic",
        model: "claude-opus-4",
        inputTokens: 1500,
        outputTokens: 800,
      });

      // Input: 1500 / 1M * 15 = 0.0225
      // Output: 800 / 1M * 75 = 0.06
      // Total: 0.0825
      expect(cost.inputCost).toBeCloseTo(0.0225, 5);
      expect(cost.outputCost).toBeCloseTo(0.06, 5);
      expect(cost.totalCost).toBeCloseTo(0.0825, 5);
      expect(cost.totalTokens).toBe(2300);
      expect(cost.model).toBe("claude-opus-4");
      expect(cost.provider).toBe("anthropic");
    });

    it("should calculate cost for GPT-4o Mini", () => {
      const cost = calculateModelCost({
        provider: "openai",
        model: "gpt-4o-mini",
        inputTokens: 10000,
        outputTokens: 5000,
      });

      // Input: 10000 / 1M * 0.15 = 0.0015
      // Output: 5000 / 1M * 0.6 = 0.003
      // Total: 0.0045
      expect(cost.inputCost).toBeCloseTo(0.0015, 6);
      expect(cost.outputCost).toBeCloseTo(0.003, 6);
      expect(cost.totalCost).toBeCloseTo(0.0045, 6);
    });

    it("should calculate zero cost for Ollama models", () => {
      const cost = calculateModelCost({
        provider: "ollama",
        model: "llama-3-70b",
        inputTokens: 5000,
        outputTokens: 2000,
      });

      expect(cost.inputCost).toBe(0);
      expect(cost.outputCost).toBe(0);
      expect(cost.totalCost).toBe(0);
    });

    it("should throw error for unknown model", () => {
      expect(() => {
        calculateModelCost({
          provider: "anthropic",
          model: "unknown-model",
          inputTokens: 1000,
          outputTokens: 500,
        });
      }).toThrow(/Pricing not found/);
    });

    it("should handle zero tokens", () => {
      const cost = calculateModelCost({
        provider: "anthropic",
        model: "claude-haiku-4-5",
        inputTokens: 0,
        outputTokens: 0,
      });

      expect(cost.inputCost).toBe(0);
      expect(cost.outputCost).toBe(0);
      expect(cost.totalCost).toBe(0);
    });

    it("should handle large token counts", () => {
      const cost = calculateModelCost({
        provider: "anthropic",
        model: "claude-opus-4",
        inputTokens: 150000,
        outputTokens: 50000,
      });

      // Input: 150000 / 1M * 15 = 2.25
      // Output: 50000 / 1M * 75 = 3.75
      // Total: 6.0
      expect(cost.inputCost).toBeCloseTo(2.25, 2);
      expect(cost.outputCost).toBeCloseTo(3.75, 2);
      expect(cost.totalCost).toBeCloseTo(6.0, 2);
    });
  });

  describe("estimateCost", () => {
    it("should estimate cost before execution", () => {
      const estimate = estimateCost(
        "anthropic",
        "claude-sonnet-4-5",
        2000,
        1000
      );

      // Input: 2000 / 1M * 3 = 0.006
      // Output: 1000 / 1M * 15 = 0.015
      // Total: 0.021
      expect(estimate.inputCost).toBeCloseTo(0.006, 6);
      expect(estimate.outputCost).toBeCloseTo(0.015, 6);
      expect(estimate.totalCost).toBeCloseTo(0.021, 6);
    });

    it("should provide same result as calculateModelCost", () => {
      const estimate = estimateCost("openai", "gpt-4o", 1500, 800);
      const calculated = calculateModelCost({
        provider: "openai",
        model: "gpt-4o",
        inputTokens: 1500,
        outputTokens: 800,
      });

      expect(estimate.totalCost).toBeCloseTo(calculated.totalCost, 10);
    });
  });

  describe("getAllPricing", () => {
    it("should return all pricing data", () => {
      const allPricing = getAllPricing();

      expect(allPricing).toBeDefined();
      expect(allPricing.anthropic).toBeDefined();
      expect(allPricing.openai).toBeDefined();
      expect(allPricing.google).toBeDefined();
      expect(allPricing.ollama).toBeDefined();
    });

    it("should have all expected Anthropic models", () => {
      const allPricing = getAllPricing();

      expect(allPricing.anthropic["claude-opus-4"]).toBeDefined();
      expect(allPricing.anthropic["claude-sonnet-4-5"]).toBeDefined();
      expect(allPricing.anthropic["claude-haiku-4-5"]).toBeDefined();
    });

    it("should have all expected OpenAI models", () => {
      const allPricing = getAllPricing();

      expect(allPricing.openai["gpt-4o"]).toBeDefined();
      expect(allPricing.openai["gpt-4o-mini"]).toBeDefined();
      expect(allPricing.openai["gpt-4-turbo"]).toBeDefined();
      expect(allPricing.openai["gpt-3.5-turbo"]).toBeDefined();
    });
  });

  describe("getCheapestModel", () => {
    it("should find cheapest Anthropic model", () => {
      const cheapest = getCheapestModel("anthropic", 1000, 500);

      // Haiku should be cheapest
      expect(cheapest).toBeDefined();
      expect(cheapest?.model).toBe("claude-haiku-4-5");
    });

    it("should find cheapest OpenAI model", () => {
      const cheapest = getCheapestModel("openai", 1000, 500);

      // GPT-4o Mini should be cheapest
      expect(cheapest).toBeDefined();
      expect(cheapest?.model).toBe("gpt-4o-mini");
    });

    it("should calculate cost for cheapest model", () => {
      const cheapest = getCheapestModel("anthropic", 10000, 5000);

      expect(cheapest).toBeDefined();
      expect(cheapest?.cost).toBeGreaterThan(0);

      // Verify it's actually the cheapest
      const opus = calculateModelCost({
        provider: "anthropic",
        model: "claude-opus-4",
        inputTokens: 10000,
        outputTokens: 5000,
      });

      expect(cheapest!.cost).toBeLessThan(opus.totalCost);
    });

    it("should return null for unknown provider", () => {
      const cheapest = getCheapestModel("unknown", 1000, 500);

      expect(cheapest).toBeNull();
    });

    it("should find Ollama models as free (cost = 0)", () => {
      const cheapest = getCheapestModel("ollama", 1000, 500);

      expect(cheapest).toBeDefined();
      expect(cheapest?.cost).toBe(0);
    });
  });

  describe("formatCost", () => {
    it("should format zero cost", () => {
      expect(formatCost(0)).toBe("$0.00");
    });

    it("should format small costs in cents", () => {
      expect(formatCost(0.005)).toBe("$0.5000¢");
      expect(formatCost(0.0025)).toBe("$0.2500¢");
    });

    it("should format regular costs in dollars", () => {
      expect(formatCost(0.0825)).toBe("$0.0825");
      expect(formatCost(1.5)).toBe("$1.5000");
      expect(formatCost(10.0)).toBe("$10.0000");
    });

    it("should format large costs", () => {
      expect(formatCost(123.456)).toBe("$123.4560");
    });

    it("should format micro costs", () => {
      expect(formatCost(0.000015)).toBe("$0.0015¢");
    });
  });

  describe("Edge Cases", () => {
    it("should handle fractional tokens (shouldn't happen but defensive)", () => {
      const cost = calculateModelCost({
        provider: "anthropic",
        model: "claude-haiku-4-5",
        inputTokens: 123.456, // Fractional tokens (shouldn't happen)
        outputTokens: 78.9,
      });

      expect(cost.totalCost).toBeGreaterThan(0);
      expect(cost.totalTokens).toBeCloseTo(202.356, 3);
    });

    it("should handle very large numbers", () => {
      const cost = calculateModelCost({
        provider: "anthropic",
        model: "claude-opus-4",
        inputTokens: 1_000_000, // 1M tokens
        outputTokens: 500_000, // 500K tokens
      });

      // Input: 1M / 1M * 15 = 15
      // Output: 500K / 1M * 75 = 37.5
      // Total: 52.5
      expect(cost.inputCost).toBeCloseTo(15, 2);
      expect(cost.outputCost).toBeCloseTo(37.5, 2);
      expect(cost.totalCost).toBeCloseTo(52.5, 2);
    });
  });
});
