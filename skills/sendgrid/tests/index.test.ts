/**
 * SendGrid Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { SendGridSkill } from "../src/index.js";

// Mock @sendgrid/mail
vi.mock("@sendgrid/mail", () => {
  const mockSend = vi.fn();
  const mockSetApiKey = vi.fn();
  const mockSendMultiple = vi.fn();

  return {
    default: {
      setApiKey: mockSetApiKey,
      send: mockSend,
      sendMultiple: mockSendMultiple,
    },
    __getMocks: () => ({
      mockSend,
      mockSetApiKey,
      mockSendMultiple,
    }),
  };
});

describe("SendGridSkill", () => {
  let skill: SendGridSkill;
  const mockConfig = {
    apiKey: "SG.test-api-key",
  };

  beforeEach(() => {
    skill = new SendGridSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("sendgrid");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("SendGrid Email");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("SendGrid");
      expect(skill.description).toContain("email");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "send" } as any)).toBe(false);
    });

    it("should accept valid send input", async () => {
      expect(
        await skill.validate({
          action: "send",
          params: {
            to: "user@example.com",
            from: "sender@example.com",
            subject: "Test",
            text: "Hello",
          },
        })
      ).toBe(true);
    });

    it("should accept valid sendBulk input", async () => {
      expect(
        await skill.validate({
          action: "sendBulk",
          params: {
            to: ["user1@example.com", "user2@example.com"],
            from: "sender@example.com",
            subject: "Bulk Test",
            text: "Hello everyone",
          },
        })
      ).toBe(true);
    });

    it("should accept valid sendTemplate input", async () => {
      expect(
        await skill.validate({
          action: "sendTemplate",
          params: {
            to: "user@example.com",
            from: "sender@example.com",
            templateId: "d-123456789",
            dynamicTemplateData: { name: "John" },
          },
        })
      ).toBe(true);
    });
  });

  describe("execute() - send", () => {
    it("should send email successfully", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockResolvedValue([
        {
          statusCode: 202,
          headers: {},
          body: {},
        },
        {},
      ]);

      const result = await skill.execute({
        action: "send",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          subject: "Test Email",
          text: "Hello World",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("statusCode", 202);

      expect(mockSend).toHaveBeenCalledWith({
        to: "user@example.com",
        from: "sender@example.com",
        subject: "Test Email",
        text: "Hello World",
      });
    });

    it("should send email with HTML content", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockResolvedValue([{ statusCode: 202 }, {}]);

      await skill.execute({
        action: "send",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          subject: "HTML Email",
          html: "<h1>Hello</h1>",
        },
      });

      expect(mockSend).toHaveBeenCalledWith({
        to: "user@example.com",
        from: "sender@example.com",
        subject: "HTML Email",
        html: "<h1>Hello</h1>",
      });
    });

    it("should handle send errors", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockRejectedValue(new Error("Invalid email address"));

      const result = await skill.execute({
        action: "send",
        params: {
          to: "invalid-email",
          from: "sender@example.com",
          subject: "Test",
          text: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Invalid email address");
    });

    it("should handle rate limit errors", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockRejectedValue(new Error("Rate limit exceeded"));

      const result = await skill.execute({
        action: "send",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          subject: "Test",
          text: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Rate limit");
    });
  });

  describe("execute() - sendBulk", () => {
    it("should send bulk emails successfully", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSendMultiple } = __getMocks();

      mockSendMultiple.mockResolvedValue([
        {
          statusCode: 202,
          headers: {},
          body: {},
        },
        {},
      ]);

      const result = await skill.execute({
        action: "sendBulk",
        params: {
          to: ["user1@example.com", "user2@example.com"],
          from: "sender@example.com",
          subject: "Bulk Email",
          text: "Hello everyone",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("statusCode", 202);

      expect(mockSendMultiple).toHaveBeenCalledWith({
        to: ["user1@example.com", "user2@example.com"],
        from: "sender@example.com",
        subject: "Bulk Email",
        text: "Hello everyone",
      });
    });

    it("should handle bulk send errors", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSendMultiple } = __getMocks();

      mockSendMultiple.mockRejectedValue(new Error("Bulk send failed"));

      const result = await skill.execute({
        action: "sendBulk",
        params: {
          to: ["user1@example.com", "user2@example.com"],
          from: "sender@example.com",
          subject: "Bulk",
          text: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Bulk send failed");
    });
  });

  describe("execute() - sendTemplate", () => {
    it("should send template email successfully", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockResolvedValue([
        {
          statusCode: 202,
          headers: {},
          body: {},
        },
        {},
      ]);

      const result = await skill.execute({
        action: "sendTemplate",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          templateId: "d-123456789",
          dynamicTemplateData: {
            name: "John Doe",
            order_id: "12345",
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("statusCode", 202);

      expect(mockSend).toHaveBeenCalledWith({
        to: "user@example.com",
        from: "sender@example.com",
        templateId: "d-123456789",
        dynamicTemplateData: {
          name: "John Doe",
          order_id: "12345",
        },
      });
    });

    it("should handle template send errors", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockRejectedValue(new Error("Template not found"));

      const result = await skill.execute({
        action: "sendTemplate",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          templateId: "d-invalid",
          dynamicTemplateData: {},
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Template not found");
    });
  });

  describe("Error Handling", () => {
    it("should return error for unknown action", async () => {
      const result = await skill.execute({
        action: "invalidAction" as any,
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
      expect(result.error).toContain("invalidAction");
    });

    it("should handle non-Error exceptions", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockRejectedValue("String error");

      const result = await skill.execute({
        action: "send",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          subject: "Test",
          text: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle 401 authentication errors", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await skill.execute({
        action: "send",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          subject: "Test",
          text: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("401");
    });

    it("should handle 403 forbidden errors", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSend } = __getMocks();

      mockSend.mockRejectedValue(new Error("403 Forbidden"));

      const result = await skill.execute({
        action: "send",
        params: {
          to: "user@example.com",
          from: "sender@example.com",
          subject: "Test",
          text: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("403");
    });
  });

  describe("Configuration", () => {
    it("should set API key on initialization", async () => {
      const { default: sgMail, __getMocks } = await import("@sendgrid/mail");
      const { mockSetApiKey } = __getMocks();

      new SendGridSkill({ apiKey: "SG.custom-key" });

      expect(mockSetApiKey).toHaveBeenCalledWith("SG.custom-key");
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createSendGridSkill } = await import("../src/index.js");
      const factorySkill = createSendGridSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(SendGridSkill);
      expect(factorySkill.id).toBe("sendgrid");
    });
  });
});
