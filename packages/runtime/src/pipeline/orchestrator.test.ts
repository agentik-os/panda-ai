import { describe, it, expect, beforeEach } from "vitest";
import { MessagePipeline } from "./orchestrator";
import type { RawMessage } from "./normalize";

describe("MessagePipeline (Integration)", () => {
  // Note: These tests would require API keys to run fully
  // For now, we test the structure and flow

  it("should create pipeline with config", () => {
    const pipeline = new MessagePipeline({
      route: {
        defaultAgentId: "test-agent",
      },
      modelSelect: {
        preferences: {
          budgetMode: "cost-effective",
        },
      },
      execute: {
        anthropicApiKey: "test-key",
      },
    });

    expect(pipeline).toBeInstanceOf(MessagePipeline);
  });

  // Full integration tests would go here
  // They would mock the API calls or use test API keys
});
