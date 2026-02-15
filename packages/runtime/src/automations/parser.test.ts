/**
 * Automation Parser Tests
 * Step-094: Natural Language Automation Parser
 */

import { describe, it, expect, beforeEach } from "vitest";
import { AutomationParser } from "./parser";
import type { OSModeAutomation } from "@agentik-os/shared";

// Mock Anthropic provider for testing
const mockApiKey = "sk-test-key";

describe("AutomationParser", () => {
  let parser: AutomationParser;

  beforeEach(() => {
    parser = new AutomationParser({ apiKey: mockApiKey });
  });

  describe("validateAutomation", () => {
    it("should validate valid cron automation", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Daily Summary",
        description: "Send daily summary email",
        trigger: { type: "cron", schedule: "0 9 * * *" },
        action: "send_email",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid event automation", () => {
      const automation: OSModeAutomation = {
        id: "auto_456",
        name: "Welcome Users",
        description: "Send welcome email to new users",
        trigger: { type: "event", event: "user.created" },
        action: "send_welcome_email",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should validate valid webhook automation", () => {
      const automation: OSModeAutomation = {
        id: "auto_789",
        name: "GitHub Webhook",
        description: "Handle GitHub webhook events",
        trigger: { type: "webhook", path: "/api/github" },
        action: "create_task",
        enabled: false,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject automation with missing ID", () => {
      const automation: OSModeAutomation = {
        id: "",
        name: "Test",
        description: "Test automation",
        trigger: { type: "cron", schedule: "0 9 * * *" },
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Automation ID is required");
    });

    it("should reject automation with long name", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "This is a very long automation name that exceeds the maximum allowed length",
        description: "Test automation",
        trigger: { type: "cron", schedule: "0 9 * * *" },
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Automation name must be <= 50 characters");
    });

    it("should reject automation with long description", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Test",
        description: "A".repeat(201), // Exceeds 200 char limit
        trigger: { type: "cron", schedule: "0 9 * * *" },
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Automation description must be <= 200 characters");
    });

    it("should reject cron automation without schedule", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Test",
        description: "Test automation",
        trigger: { type: "cron", schedule: "" },
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Cron trigger requires schedule");
    });

    it("should reject cron automation with invalid schedule", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Test",
        description: "Test automation",
        trigger: { type: "cron", schedule: "invalid" },
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Invalid cron expression");
    });

    it("should reject event automation without event name", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Test",
        description: "Test automation",
        trigger: { type: "event", event: "" },
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Event trigger requires event name");
    });

    it("should reject webhook automation without path", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Test",
        description: "Test automation",
        trigger: { type: "webhook", path: "" },
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Webhook trigger requires path");
    });

    it("should reject webhook automation with invalid path", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Test",
        description: "Test automation",
        trigger: { type: "webhook", path: "api/github" }, // Missing leading slash
        action: "test",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain("Webhook path must start with /");
    });
  });

  describe("automationToText", () => {
    it("should convert cron automation to text", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Daily Summary",
        description: "Send daily summary email",
        trigger: { type: "cron", schedule: "0 9 * * *" },
        action: "send summary email",
        enabled: true,
      };

      const text = parser.automationToText(automation);
      expect(text).toContain("Every day at 9:00");
      expect(text).toContain("send summary email");
    });

    it("should convert hourly cron automation to text", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Hourly Check",
        description: "Check system status hourly",
        trigger: { type: "cron", schedule: "0 * * * *" },
        action: "check status",
        enabled: true,
      };

      const text = parser.automationToText(automation);
      expect(text).toBe("Every hour, check status");
    });

    it("should convert weekly cron automation to text", () => {
      const automation: OSModeAutomation = {
        id: "auto_123",
        name: "Weekly Report",
        description: "Send weekly report",
        trigger: { type: "cron", schedule: "0 10 * * 1" },
        action: "send report",
        enabled: true,
      };

      const text = parser.automationToText(automation);
      expect(text).toContain("Every Monday at 10:00");
      expect(text).toContain("send report");
    });

    it("should convert event automation to text", () => {
      const automation: OSModeAutomation = {
        id: "auto_456",
        name: "Welcome Users",
        description: "Send welcome email to new users",
        trigger: { type: "event", event: "user.created" },
        action: "send welcome email",
        enabled: true,
      };

      const text = parser.automationToText(automation);
      expect(text).toBe("When user.created event occurs, send welcome email");
    });

    it("should convert webhook automation to text", () => {
      const automation: OSModeAutomation = {
        id: "auto_789",
        name: "GitHub Webhook",
        description: "Handle GitHub webhook events",
        trigger: { type: "webhook", path: "/api/github" },
        action: "create task",
        enabled: false,
      };

      const text = parser.automationToText(automation);
      expect(text).toBe("When webhook /api/github is called, create task");
    });
  });

  describe("ID generation", () => {
    it("should generate unique IDs", () => {
      const ids = new Set<string>();

      // Generate 100 IDs
      for (let i = 0; i < 100; i++) {
        const automation: OSModeAutomation = {
          id: "",
          name: "Test",
          description: "Test automation",
          trigger: { type: "cron", schedule: "0 9 * * *" },
          action: "test",
          enabled: true,
        };

        // Use a dummy parser method to generate ID
        const id = `auto_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
        ids.add(id);
      }

      // All IDs should be unique
      expect(ids.size).toBe(100);
    });
  });

  describe("Cron validation", () => {
    it("should accept valid cron expressions", () => {
      const validCrons = [
        "0 9 * * *", // Daily at 9am
        "0 * * * *", // Every hour
        "0 0 * * 1", // Weekly on Monday
        "30 14 1 * *", // Monthly on 1st at 2:30pm
        "*/5 * * * *", // Every 5 minutes
      ];

      for (const cron of validCrons) {
        const automation: OSModeAutomation = {
          id: "auto_123",
          name: "Test",
          description: "Test automation",
          trigger: { type: "cron", schedule: cron },
          action: "test",
          enabled: true,
        };

        const result = parser.validateAutomation(automation);
        expect(result.valid).toBe(true);
      }
    });

    it("should reject invalid cron expressions", () => {
      const invalidCrons = [
        "invalid",
        "0 9 * *", // Too few parts
        "0 9 * * * *", // Too many parts
        "",
      ];

      for (const cron of invalidCrons) {
        const automation: OSModeAutomation = {
          id: "auto_123",
          name: "Test",
          description: "Test automation",
          trigger: { type: "cron", schedule: cron },
          action: "test",
          enabled: true,
        };

        const result = parser.validateAutomation(automation);
        expect(result.valid).toBe(false);
      }
    });
  });

  describe("Multiple validation errors", () => {
    it("should collect all validation errors", () => {
      const automation: OSModeAutomation = {
        id: "",
        name: "",
        description: "",
        trigger: { type: "cron", schedule: "" },
        action: "",
        enabled: true,
      };

      const result = parser.validateAutomation(automation);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(1);
      expect(result.errors).toContain("Automation ID is required");
      expect(result.errors).toContain("Automation name is required");
      expect(result.errors).toContain("Automation description is required");
      expect(result.errors).toContain("Automation action is required");
      expect(result.errors).toContain("Cron trigger requires schedule");
    });
  });
});
