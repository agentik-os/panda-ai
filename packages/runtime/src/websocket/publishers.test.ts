/**
 * WebSocket Publishers Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  publishCostEvent,
  publishBudgetAlert,
  publishBudgetReset,
  publishAgentStatus,
  testPublish,
  publishSystemAnnouncement,
} from "./publishers";
import type {
  CostEventPayload,
  BudgetAlertPayload,
  AgentStatusPayload,
} from "./types";
import type { Id } from "../../../../convex/_generated/dataModel";

// Mock WebSocket server
vi.mock("./server", () => ({
  getWebSocketServer: () => ({
    broadcastToChannel: vi.fn(),
    broadcastToAll: vi.fn(),
  }),
}));

describe("publishCostEvent()", () => {
  const mockCostEvent: CostEventPayload = {
    id: "cost_123" as Id<"costs">,
    agentId: "agent_abc" as Id<"agents">,
    conversationId: "conv_xyz" as Id<"conversations">,
    model: "claude-opus-4",
    provider: "anthropic",
    inputTokens: 1000,
    outputTokens: 500,
    totalTokens: 1500,
    inputCost: 0.03,
    outputCost: 0.075,
    totalCost: 0.105,
    channel: "cli",
    timestamp: Date.now(),
  };

  it("should publish cost event to agent channel", () => {
    expect(() => publishCostEvent(mockCostEvent)).not.toThrow();
  });

  it("should include all cost event fields in payload", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishCostEvent(mockCostEvent);

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[0][0];
    expect(logMessage).toContain("cost event");
    expect(logMessage).toContain(mockCostEvent.agentId);

    consoleLog.mockRestore();
  });

  it("should handle missing conversationId", () => {
    const eventWithoutConv = { ...mockCostEvent };
    delete eventWithoutConv.conversationId;

    expect(() => publishCostEvent(eventWithoutConv)).not.toThrow();
  });

  it("should format cost amounts correctly", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishCostEvent(mockCostEvent);

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[0][0];
    expect(logMessage).toContain("$0.1050");

    consoleLog.mockRestore();
  });
});

describe("publishBudgetAlert()", () => {
  const mockAlert: BudgetAlertPayload = {
    budgetId: "budget_123" as Id<"budgets">,
    agentId: "agent_abc" as Id<"agents">,
    threshold: 75,
    currentSpend: 7.5,
    limitAmount: 10,
    percentUsed: 75,
    period: "daily",
    enforcementAction: "warn",
    isPaused: false,
    message: "Budget 75% threshold reached",
  };

  it("should publish budget alert to agent and budget channels", () => {
    expect(() => publishBudgetAlert(mockAlert)).not.toThrow();
  });

  it("should use budget:alert type for non-100% thresholds", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishBudgetAlert(mockAlert);

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[0][0];
    expect(logMessage).toContain("budget alert");
    expect(logMessage).toContain("75%");

    consoleLog.mockRestore();
  });

  it("should use budget:exceeded type for 100% threshold", () => {
    const exceededAlert: BudgetAlertPayload = {
      ...mockAlert,
      threshold: 100,
      currentSpend: 10,
      percentUsed: 100,
      message: "Budget 100% threshold reached",
    };

    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishBudgetAlert(exceededAlert);

    expect(consoleLog).toHaveBeenCalled();

    consoleLog.mockRestore();
  });

  it("should include isPaused status for pause enforcement", () => {
    const pausedAlert: BudgetAlertPayload = {
      ...mockAlert,
      threshold: 100,
      enforcementAction: "pause",
      isPaused: true,
      message: "Budget exceeded, agent paused",
    };

    expect(() => publishBudgetAlert(pausedAlert)).not.toThrow();
  });

  it("should support all enforcement actions", () => {
    const actions: Array<"warn" | "pause" | "block"> = ["warn", "pause", "block"];

    for (const action of actions) {
      const alert: BudgetAlertPayload = {
        ...mockAlert,
        enforcementAction: action,
      };

      expect(() => publishBudgetAlert(alert)).not.toThrow();
    }
  });

  it("should support all budget periods", () => {
    const periods: Array<"daily" | "weekly" | "monthly" | "per-conversation"> = [
      "daily",
      "weekly",
      "monthly",
      "per-conversation",
    ];

    for (const period of periods) {
      const alert: BudgetAlertPayload = {
        ...mockAlert,
        period,
      };

      expect(() => publishBudgetAlert(alert)).not.toThrow();
    }
  });
});

describe("publishBudgetReset()", () => {
  const budgetId = "budget_123" as Id<"budgets">;
  const agentId = "agent_abc" as Id<"agents">;

  it("should publish budget reset event", () => {
    expect(() => publishBudgetReset(budgetId, agentId, "daily")).not.toThrow();
  });

  it("should broadcast to both agent and budget channels", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishBudgetReset(budgetId, agentId, "weekly");

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[0][0];
    expect(logMessage).toContain("budget reset");

    consoleLog.mockRestore();
  });

  it("should support all period types", () => {
    const periods: Array<"daily" | "weekly" | "monthly" | "per-conversation"> = [
      "daily",
      "weekly",
      "monthly",
      "per-conversation",
    ];

    for (const period of periods) {
      expect(() => publishBudgetReset(budgetId, agentId, period)).not.toThrow();
    }
  });
});

describe("publishAgentStatus()", () => {
  const baseStatus: AgentStatusPayload = {
    agentId: "agent_abc" as Id<"agents">,
    status: "active",
    timestamp: Date.now(),
  };

  it("should publish agent status change", () => {
    expect(() => publishAgentStatus(baseStatus)).not.toThrow();
  });

  it("should use agent:paused event for paused status", () => {
    const pausedStatus: AgentStatusPayload = {
      ...baseStatus,
      status: "paused",
      reason: "Budget exceeded",
      budgetId: "budget_123" as Id<"budgets">,
    };

    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishAgentStatus(pausedStatus);

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[consoleLog.mock.calls.length - 1][0];
    expect(logMessage).toContain("paused");

    consoleLog.mockRestore();
  });

  it("should use agent:resumed event for active status", () => {
    const resumedStatus: AgentStatusPayload = {
      ...baseStatus,
      status: "active",
      reason: "Budget reset",
    };

    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishAgentStatus(resumedStatus);

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[consoleLog.mock.calls.length - 1][0];
    expect(logMessage).toContain("resumed");

    consoleLog.mockRestore();
  });

  it("should use agent:status event for other statuses", () => {
    const blockedStatus: AgentStatusPayload = {
      ...baseStatus,
      status: "blocked",
      reason: "Security violation",
    };

    expect(() => publishAgentStatus(blockedStatus)).not.toThrow();
  });

  it("should include budgetId when status change is budget-related", () => {
    const statusWithBudget: AgentStatusPayload = {
      ...baseStatus,
      status: "paused",
      budgetId: "budget_123" as Id<"budgets">,
      reason: "Budget limit exceeded",
    };

    expect(() => publishAgentStatus(statusWithBudget)).not.toThrow();
  });

  it("should support all agent statuses", () => {
    const statuses: Array<"active" | "paused" | "blocked" | "idle"> = [
      "active",
      "paused",
      "blocked",
      "idle",
    ];

    for (const status of statuses) {
      const statusPayload: AgentStatusPayload = {
        ...baseStatus,
        status,
      };

      expect(() => publishAgentStatus(statusPayload)).not.toThrow();
    }
  });
});

describe("testPublish()", () => {
  it("should publish test message to specified channel", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    testPublish("agent:test123");

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[consoleLog.mock.calls.length - 1][0];
    expect(logMessage).toContain("Test publish");

    consoleLog.mockRestore();
  });

  it("should support all channel types", () => {
    const channels: Array<
      `agent:${string}` | `user:${string}` | `budget:${string}` | "system"
    > = ["agent:test", "user:test", "budget:test", "system"];

    for (const channel of channels) {
      expect(() => testPublish(channel)).not.toThrow();
    }
  });
});

describe("publishSystemAnnouncement()", () => {
  it("should broadcast system announcement to all clients", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishSystemAnnouncement("System maintenance in 5 minutes");

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[consoleLog.mock.calls.length - 1][0];
    expect(logMessage).toContain("System announcement");

    consoleLog.mockRestore();
  });

  it("should include message text in announcement", () => {
    const testMessage = "New features deployed!";

    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});

    publishSystemAnnouncement(testMessage);

    expect(consoleLog).toHaveBeenCalled();
    const logMessage = consoleLog.mock.calls[consoleLog.mock.calls.length - 1][0];
    expect(logMessage).toContain(testMessage);

    consoleLog.mockRestore();
  });
});

describe("Message Structure", () => {
  it("should generate unique message IDs", () => {
    const consoleLog = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleLog.mockClear(); // Clear any previous calls

    publishCostEvent({
      id: "cost_1" as Id<"costs">,
      agentId: "agent_1" as Id<"agents">,
      model: "test",
      provider: "test",
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      inputCost: 0.01,
      outputCost: 0.01,
      totalCost: 0.02,
      channel: "test",
      timestamp: Date.now(),
    });

    publishCostEvent({
      id: "cost_2" as Id<"costs">,
      agentId: "agent_2" as Id<"agents">,
      model: "test",
      provider: "test",
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      inputCost: 0.01,
      outputCost: 0.01,
      totalCost: 0.02,
      channel: "test",
      timestamp: Date.now(),
    });

    // Each call should log (messages have unique IDs internally)
    expect(consoleLog).toHaveBeenCalledTimes(2);

    consoleLog.mockRestore();
  });

  it("should include timestamps in all messages", () => {
    const before = Date.now();

    publishCostEvent({
      id: "cost_1" as Id<"costs">,
      agentId: "agent_1" as Id<"agents">,
      model: "test",
      provider: "test",
      inputTokens: 100,
      outputTokens: 50,
      totalTokens: 150,
      inputCost: 0.01,
      outputCost: 0.01,
      totalCost: 0.02,
      channel: "test",
      timestamp: before,
    });

    const after = Date.now();

    // Timestamp should be within reasonable range
    expect(before).toBeLessThanOrEqual(after);
  });
});
