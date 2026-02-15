import type { ComplexityScore } from "@agentik-os/shared";
import { COMPLEXITY_THRESHOLDS } from "@agentik-os/shared";

export interface ModelPreferences {
  preferredProvider?: "anthropic" | "openai" | "google" | "ollama";
  budgetMode?: "cost-effective" | "balanced" | "performance";
  maxCostPerMessage?: number; // USD
}

export interface ModelSelection {
  provider: "anthropic" | "openai" | "google" | "ollama";
  model: string;
  reason: string;
}

export function selectModel(
  complexity: ComplexityScore,
  preferences: ModelPreferences = {}
): ModelSelection {
  const { budgetMode = "balanced", preferredProvider } = preferences;

  // If user has a strong preference, honor it (unless budget constraint)
  if (preferredProvider) {
    return selectForProvider(preferredProvider, complexity, budgetMode);
  }

  // Default: Anthropic (Claude) based selection
  return selectAnthropicModel(complexity, budgetMode);
}

function selectForProvider(
  provider: "anthropic" | "openai" | "google" | "ollama",
  complexity: ComplexityScore,
  budgetMode: string
): ModelSelection {
  switch (provider) {
    case "anthropic":
      return selectAnthropicModel(complexity, budgetMode);
    case "openai":
      return selectOpenAIModel(complexity, budgetMode);
    case "google":
      return {
        provider: "google",
        model: "gemini-2.0-flash-exp",
        reason: "Google Gemini preferred",
      };
    case "ollama":
      return {
        provider: "ollama",
        model: "llama3.1:70b",
        reason: "Local Ollama preferred",
      };
  }
}

function selectAnthropicModel(
  complexity: ComplexityScore,
  budgetMode: string
): ModelSelection {
  // Cost-effective mode: Always use Haiku
  if (budgetMode === "cost-effective") {
    return {
      provider: "anthropic",
      model: "claude-haiku-4-5",
      reason: "Cost-effective mode enabled",
    };
  }

  // Performance mode: Use Opus for medium+ complexity
  if (budgetMode === "performance") {
    if (complexity.score >= COMPLEXITY_THRESHOLDS.MEDIUM) {
      return {
        provider: "anthropic",
        model: "claude-opus-4",
        reason: "High performance for complex task",
      };
    }
    return {
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      reason: "Performance mode, medium complexity",
    };
  }

  // Balanced mode (default): Smart routing
  if (complexity.score >= COMPLEXITY_THRESHOLDS.COMPLEX) {
    return {
      provider: "anthropic",
      model: "claude-opus-4",
      reason: `Very complex task (score: ${complexity.score})`,
    };
  }

  if (complexity.score >= COMPLEXITY_THRESHOLDS.MEDIUM) {
    return {
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      reason: `Medium complexity (score: ${complexity.score})`,
    };
  }

  return {
    provider: "anthropic",
    model: "claude-haiku-4-5",
    reason: `Simple task (score: ${complexity.score})`,
  };
}

function selectOpenAIModel(
  complexity: ComplexityScore,
  budgetMode: string
): ModelSelection {
  if (budgetMode === "cost-effective") {
    return {
      provider: "openai",
      model: "gpt-4o-mini",
      reason: "Cost-effective OpenAI model",
    };
  }

  if (complexity.score >= COMPLEXITY_THRESHOLDS.COMPLEX) {
    return {
      provider: "openai",
      model: "o1",
      reason: "Complex reasoning task",
    };
  }

  return {
    provider: "openai",
    model: "gpt-4o",
    reason: `OpenAI GPT-4o (score: ${complexity.score})`,
  };
}
