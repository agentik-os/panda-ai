import { describe, it, expect, vi, beforeEach } from "vitest";
import { createCostEvent, trackCost } from "./track-cost";
import type { ModelResponse, CostEvent } from "@agentik-os/shared";
import type { ModelSelection } from "../router/selector";

// Mock Convex cost storage
vi.mock("../cost/event-store", () => ({
  storeCostEvent: vi.fn().mockResolvedValue("cost_mock_id"),
}));

// Mock WebSocket publishers
vi.mock("../websocket/publishers", () => ({
  publishCostEvent: vi.fn(),
}));

// Mock console.log to avoid polluting test output (but allow spying in tests)
const consoleLogMock = vi.spyOn(console, "log").mockImplementation(() => {});
const consoleErrorMock = vi.spyOn(console, "error").mockImplementation(() => {});

beforeEach(() => {
  // Clear mock call history before each test
  consoleLogMock.mockClear();
  consoleErrorMock.mockClear();
});

describe("createCostEvent", () => {
  const modelSelection: ModelSelection = {
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    reason: "balanced",
    complexity: "medium",
  };

  const modelResponse: ModelResponse = {
    content: "Test response",
    model: "claude-sonnet-4-5",
    usage: {
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
    },
  };

  it("should create cost event with correct structure", () => {
    const event = createCostEvent("agent_1", "user_1", modelSelection, modelResponse);

    expect(event).toMatchObject({
      id: expect.stringContaining("cost_"),
      agentId: "agent_1",
      userId: "user_1",
      provider: "anthropic",
      model: "claude-sonnet-4-5",
      promptTokens: 1000,
      completionTokens: 500,
      totalTokens: 1500,
      timestamp: expect.any(Date),
      metadata: {
        selectionReason: "balanced",
      },
    });
  });

  it("should calculate cost correctly for Claude Sonnet 4.5", () => {
    const event = createCostEvent("agent_1", "user_1", modelSelection, modelResponse);

    // Claude Sonnet 4.5: $0.003/1M input, $0.015/1M output
    // 1000 input + 500 output = (1000/1M)*0.003 + (500/1M)*0.015 = 0.000003 + 0.0000075 = 0.0000105
    expect(event.cost).toBeCloseTo(0.0000105, 7);
  });

  it("should calculate cost correctly for GPT-4o", () => {
    const gptSelection: ModelSelection = {
      provider: "openai",
      model: "gpt-4o",
      reason: "high-quality",
      complexity: "high",
    };

    const gptResponse: ModelResponse = {
      content: "Test response",
      model: "gpt-4o",
      usage: {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      },
    };

    const event = createCostEvent("agent_1", "user_1", gptSelection, gptResponse);

    // GPT-4o: $0.005/1M input, $0.015/1M output
    // 1000 input + 500 output = (1000/1M)*0.005 + (500/1M)*0.015 = 0.000005 + 0.0000075 = 0.0000125
    expect(event.cost).toBeCloseTo(0.0000125, 7);
  });

  it("should calculate cost correctly for GPT-4o-mini", () => {
    const gptMiniSelection: ModelSelection = {
      provider: "openai",
      model: "gpt-4o-mini",
      reason: "cheap",
      complexity: "low",
    };

    const gptMiniResponse: ModelResponse = {
      content: "Test response",
      model: "gpt-4o-mini",
      usage: {
        promptTokens: 10000,
        completionTokens: 5000,
        totalTokens: 15000,
      },
    };

    const event = createCostEvent("agent_1", "user_1", gptMiniSelection, gptMiniResponse);

    // GPT-4o-mini: $0.00015/1M input, $0.0006/1M output
    // 10000 input + 5000 output = (10000/1M)*0.00015 + (5000/1M)*0.0006 = 0.0000015 + 0.000003 = 0.0000045
    expect(event.cost).toBeCloseTo(0.0000045, 7);
  });

  it("should handle unknown model gracefully", () => {
    const unknownSelection: ModelSelection = {
      provider: "anthropic",
      model: "unknown-model" as any,
      reason: "test",
      complexity: "medium",
    };

    const unknownResponse: ModelResponse = {
      content: "Test response",
      model: "unknown-model" as any,
      usage: {
        promptTokens: 1000,
        completionTokens: 500,
        totalTokens: 1500,
      },
    };

    const event = createCostEvent("agent_1", "user_1", unknownSelection, unknownResponse);

    expect(event.cost).toBe(0);
  });

  it("should handle zero tokens", () => {
    const zeroTokenResponse: ModelResponse = {
      content: "",
      model: "claude-sonnet-4-5",
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
    };

    const event = createCostEvent("agent_1", "user_1", modelSelection, zeroTokenResponse);

    expect(event.cost).toBe(0);
    expect(event.totalTokens).toBe(0);
  });

  it("should generate unique IDs", async () => {
    const event1 = createCostEvent("agent_1", "user_1", modelSelection, modelResponse);
    // Add small delay to ensure different timestamps
    await new Promise(resolve => setTimeout(resolve, 2));
    const event2 = createCostEvent("agent_1", "user_1", modelSelection, modelResponse);

    expect(event1.id).not.toBe(event2.id);
  });

  it("should include selection reason in metadata", () => {
    const complexSelection: ModelSelection = {
      provider: "anthropic",
      model: "claude-opus-4",
      reason: "complex-task",
      complexity: "very-high",
    };

    const event = createCostEvent("agent_1", "user_1", complexSelection, modelResponse);

    expect(event.metadata.selectionReason).toBe("complex-task");
  });

  it("should preserve all token counts", () => {
    const largeResponse: ModelResponse = {
      content: "Large response",
      model: "claude-sonnet-4-5",
      usage: {
        promptTokens: 50000,
        completionTokens: 25000,
        totalTokens: 75000,
      },
    };

    const event = createCostEvent("agent_1", "user_1", modelSelection, largeResponse);

    expect(event.promptTokens).toBe(50000);
    expect(event.completionTokens).toBe(25000);
    expect(event.totalTokens).toBe(75000);
  });
});

describe("trackCost", () => {
  const mockCostEvent: CostEvent = {
    id: "cost_123",
    agentId: "agent_1",
    userId: "user_1",
    provider: "anthropic",
    model: "claude-sonnet-4-5",
    promptTokens: 1000,
    completionTokens: 500,
    totalTokens: 1500,
    cost: 0.0000105,
    timestamp: new Date(),
    metadata: {
      selectionReason: "balanced",
    },
  };

  it("should log cost event (stub implementation)", async () => {
    await trackCost(mockCostEvent);

    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("[Cost]")
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("claude-sonnet-4-5")
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("1500 tokens")
    );
    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("$0.0000")
    );
  });

  it("should complete without errors", async () => {
    await expect(trackCost(mockCostEvent)).resolves.toBeUndefined();
  });

  it("should handle high-cost events", async () => {
    const expensiveEvent: CostEvent = {
      ...mockCostEvent,
      promptTokens: 100000,
      completionTokens: 50000,
      totalTokens: 150000,
      cost: 1.05,
    };

    await trackCost(expensiveEvent);

    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("$1.0500")
    );
  });

  it("should handle zero-cost events", async () => {
    const freeevent: CostEvent = {
      ...mockCostEvent,
      cost: 0,
    };

    await trackCost(freeevent);

    expect(consoleLogMock).toHaveBeenCalledWith(
      expect.stringContaining("$0.0000")
    );
  });
});
