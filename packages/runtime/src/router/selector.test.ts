import { describe, it, expect } from "vitest";
import { selectModel } from "./selector";
import type { ComplexityScore } from "@agentik-os/shared";

const createComplexity = (score: number): ComplexityScore => ({
  score,
  factors: {
    length: score,
    hasCode: score > 60,
    hasAttachments: false,
    keywords: [],
  },
});

describe("selectModel", () => {
  describe("Anthropic (default)", () => {
    it("should select Haiku for simple tasks", () => {
      const complexity = createComplexity(20);
      const selection = selectModel(complexity);

      expect(selection.provider).toBe("anthropic");
      expect(selection.model).toBe("claude-haiku-4-5");
    });

    it("should select Sonnet for medium complexity", () => {
      const complexity = createComplexity(65);
      const selection = selectModel(complexity);

      expect(selection.provider).toBe("anthropic");
      expect(selection.model).toBe("claude-sonnet-4-5");
    });

    it("should select Opus for high complexity", () => {
      const complexity = createComplexity(100);
      const selection = selectModel(complexity);

      expect(selection.provider).toBe("anthropic");
      expect(selection.model).toBe("claude-opus-4");
    });
  });

  describe("Budget modes", () => {
    it("should use Haiku in cost-effective mode", () => {
      const complexity = createComplexity(90);
      const selection = selectModel(complexity, {
        budgetMode: "cost-effective",
      });

      expect(selection.model).toBe("claude-haiku-4-5");
    });

    it("should prefer Opus in performance mode", () => {
      const complexity = createComplexity(65);
      const selection = selectModel(complexity, {
        budgetMode: "performance",
      });

      expect(selection.model).toBe("claude-opus-4");
    });
  });

  describe("Provider preferences", () => {
    it("should respect OpenAI preference", () => {
      const complexity = createComplexity(50);
      const selection = selectModel(complexity, {
        preferredProvider: "openai",
      });

      expect(selection.provider).toBe("openai");
      expect(selection.model).toBe("gpt-4o");
    });

    it("should select o1 for complex tasks on OpenAI", () => {
      const complexity = createComplexity(100);
      const selection = selectModel(complexity, {
        preferredProvider: "openai",
      });

      expect(selection.model).toBe("o1");
    });

    it("should respect Google preference", () => {
      const complexity = createComplexity(50);
      const selection = selectModel(complexity, {
        preferredProvider: "google",
      });

      expect(selection.provider).toBe("google");
    });
  });
});
