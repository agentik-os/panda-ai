/**
 * Tests for Budget Alert Notifications
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import {
  sendAlert,
  testNotifications,
  type NotificationPayload,
} from "./notifications";
import type { BudgetStatus, BudgetConfig } from "./budget-checker";
import type { Id } from "../../../../convex/_generated/dataModel";

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch as any;

// Mock environment variables
const originalEnv = process.env;

describe("Budget Alert Notifications", () => {
  const mockAgentId = "agent123" as Id<"agents">;
  const mockBudgetId = "budget123" as Id<"budgets">;

  const baseBudgetConfig: BudgetConfig = {
    id: mockBudgetId,
    agentId: mockAgentId,
    limitAmount: 10.0,
    period: "monthly",
    thresholds: [50, 75, 90, 100],
    notificationChannels: [],
    enforcementAction: "warn",
    currentSpend: 7.5,
    resetTime: Date.now() + 86400000,
    lastAlertThreshold: 50,
    isPaused: false,
  };

  beforeEach(() => {
    mockFetch.mockClear();
    mockFetch.mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "OK",
      json: async () => ({ id: "test-id" }),
    } as Response);

    // Set up environment variables
    process.env = {
      ...originalEnv,
      RESEND_API_KEY: "re_test_key",
      TELEGRAM_BOT_TOKEN: "test_bot_token",
      BUDGET_ALERT_FROM_EMAIL: "alerts@test.com",
    };

    vi.spyOn(console, "log").mockImplementation(() => {});
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.restoreAllMocks();
  });

  describe("sendAlert", () => {
    it("should not send alert when shouldAlert is false", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: "test@example.com",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: false,
      };

      await sendAlert(budget, status);

      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should send email alert when threshold crossed", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: "test@example.com",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.resend.com/emails",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            Authorization: "Bearer re_test_key",
          }),
        }),
      );
    });

    it("should send webhook alert", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["webhook"],
        webhookUrl: "https://example.com/webhook",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(mockFetch).toHaveBeenCalledWith(
        "https://example.com/webhook",
        expect.objectContaining({
          method: "POST",
          headers: expect.objectContaining({
            "Content-Type": "application/json",
          }),
        }),
      );
    });

    it("should send Telegram alert", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["telegram"],
        telegramChatId: "123456789",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("api.telegram.org"),
        expect.objectContaining({
          method: "POST",
        }),
      );
    });

    it("should send to multiple channels", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email", "webhook", "telegram"],
        emailAddress: "test@example.com",
        webhookUrl: "https://example.com/webhook",
        telegramChatId: "123456789",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 90,
        currentSpend: 9.0,
        limitAmount: 10.0,
        percentUsed: 90,
      };

      await sendAlert(budget, status);

      // Should have called fetch 3 times (email, webhook, telegram)
      expect(mockFetch).toHaveBeenCalledTimes(3);
    });

    it("should handle missing email address", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: undefined,
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("No email address"),
      );
    });

    it("should handle missing webhook URL", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["webhook"],
        webhookUrl: undefined,
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("No webhook URL"),
      );
    });

    it("should handle missing Telegram chat ID", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["telegram"],
        telegramChatId: undefined,
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("No Telegram chat ID"),
      );
    });

    it("should handle missing API keys", async () => {
      process.env.RESEND_API_KEY = "";
      process.env.TELEGRAM_BOT_TOKEN = "";

      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email", "telegram"],
        emailAddress: "test@example.com",
        telegramChatId: "123456789",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(mockFetch).not.toHaveBeenCalled();
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("RESEND_API_KEY not configured"),
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining("TELEGRAM_BOT_TOKEN not configured"),
      );
    });

    it("should handle API failures gracefully", async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 500,
        statusText: "Internal Server Error",
        text: async () => "Server error",
      } as Response);

      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: "test@example.com",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      // Should not throw
      await expect(sendAlert(budget, status, 75)).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalled();
    });

    it("should handle network errors", async () => {
      mockFetch.mockRejectedValue(new Error("Network error"));

      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: "test@example.com",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      // Should not throw
      await expect(sendAlert(budget, status, 75)).resolves.toBeUndefined();

      expect(console.error).toHaveBeenCalled();
    });
  });

  describe("testNotifications", () => {
    it("should test all configured channels", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email", "webhook"],
        emailAddress: "test@example.com",
        webhookUrl: "https://example.com/webhook",
      };

      const results = await testNotifications(budget);

      expect(results.email).toBe(true);
      expect(results.webhook).toBe(true);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it("should handle test failures", async () => {
      mockFetch.mockRejectedValue(new Error("Test error"));

      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: "test@example.com",
      };

      const results = await testNotifications(budget);

      expect(results.email).toBe(false);
    });
  });

  describe("Email Content", () => {
    it("should include correct subject for warning", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: "test@example.com",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.subject).toContain("WARNING");
      expect(body.subject).toContain("75%");
    });

    it("should include correct subject for critical", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["email"],
        emailAddress: "test@example.com",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: true,
        shouldAlert: true,
        threshold: 100,
        currentSpend: 10.5,
        limitAmount: 10.0,
        percentUsed: 105,
        isPaused: true,
      };

      await sendAlert(budget, status);

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.subject).toContain("CRITICAL");
      expect(body.html).toContain("Agent Paused");
    });
  });

  describe("Webhook Payload", () => {
    it("should send correct webhook payload", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["webhook"],
        webhookUrl: "https://example.com/webhook",
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 90,
        currentSpend: 9.0,
        limitAmount: 10.0,
        percentUsed: 90,
      };

      await sendAlert(budget, status);

      const fetchCall = mockFetch.mock.calls[0];
      const body = JSON.parse(fetchCall[1].body as string);

      expect(body.event).toBe("budget.alert");
      expect(body.data.threshold).toBe(90);
      expect(body.data.percentUsed).toBe(90);
      expect(body.data.agentId).toBe(mockAgentId);
    });
  });

  describe("In-app Notifications", () => {
    it("should log in-app notification", async () => {
      const budget: BudgetConfig = {
        ...baseBudgetConfig,
        notificationChannels: ["in-app"],
      };

      const status: BudgetStatus = {
        hasBudget: true,
        exceeded: false,
        shouldAlert: true,
        threshold: 75,
        currentSpend: 7.5,
        limitAmount: 10.0,
        percentUsed: 75,
      };

      await sendAlert(budget, status);

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining("In-app alert"),
      );
    });
  });
});
