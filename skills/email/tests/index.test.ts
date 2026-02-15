/**
 * Email Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { EmailSkill } from "../src/index.js";
import { google } from "googleapis";
import { Client } from "@microsoft/microsoft-graph-client";

// Mock googleapis
vi.mock("googleapis", () => ({
  google: {
    auth: {
      OAuth2: vi.fn().mockImplementation(() => ({
        setCredentials: vi.fn(),
      })),
    },
    gmail: vi.fn(),
  },
}));

// Mock @microsoft/microsoft-graph-client
vi.mock("@microsoft/microsoft-graph-client", () => ({
  Client: {
    init: vi.fn(),
  },
}));

describe("EmailSkill", () => {
  let skill: EmailSkill;
  const mockConfig = {
    gmail: {
      clientId: "test-gmail-client-id",
      clientSecret: "test-gmail-client-secret",
      refreshToken: "test-gmail-refresh-token",
    },
    outlook: {
      clientId: "test-outlook-client-id",
      clientSecret: "test-outlook-client-secret",
      accessToken: "test-outlook-access-token",
    },
  };

  beforeEach(() => {
    skill = new EmailSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("email");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("Email (Gmail/Outlook)");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("email");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "sendEmail" } as any)).toBe(false);
    });

    it("should reject missing provider", async () => {
      expect(
        await skill.validate({
          action: "sendEmail",
          params: {},
        } as any)
      ).toBe(false);
    });

    it("should reject invalid provider", async () => {
      expect(
        await skill.validate({
          action: "sendEmail",
          params: { provider: "invalid" },
        } as any)
      ).toBe(false);
    });

    it("should accept valid sendEmail input with gmail", async () => {
      expect(
        await skill.validate({
          action: "sendEmail",
          params: {
            provider: "gmail",
            to: "test@example.com",
            subject: "Test",
            body: "Hello",
          },
        })
      ).toBe(true);
    });

    it("should accept valid sendEmail input with outlook", async () => {
      expect(
        await skill.validate({
          action: "sendEmail",
          params: {
            provider: "outlook",
            to: "test@example.com",
            subject: "Test",
            body: "Hello",
          },
        })
      ).toBe(true);
    });

    it("should reject sendEmail without to", async () => {
      expect(
        await skill.validate({
          action: "sendEmail",
          params: {
            provider: "gmail",
            subject: "Test",
            body: "Hello",
          },
        } as any)
      ).toBe(false);
    });

    it("should reject sendEmail without subject", async () => {
      expect(
        await skill.validate({
          action: "sendEmail",
          params: {
            provider: "gmail",
            to: "test@example.com",
            body: "Hello",
          },
        } as any)
      ).toBe(false);
    });

    it("should reject sendEmail without body", async () => {
      expect(
        await skill.validate({
          action: "sendEmail",
          params: {
            provider: "gmail",
            to: "test@example.com",
            subject: "Test",
          },
        } as any)
      ).toBe(false);
    });

    it("should accept valid readEmails input", async () => {
      expect(
        await skill.validate({
          action: "readEmails",
          params: {
            provider: "gmail",
          },
        })
      ).toBe(true);
    });

    it("should accept valid searchEmails input", async () => {
      expect(
        await skill.validate({
          action: "searchEmails",
          params: {
            provider: "gmail",
            query: "from:test@example.com",
          },
        })
      ).toBe(true);
    });

    it("should reject searchEmails without query", async () => {
      expect(
        await skill.validate({
          action: "searchEmails",
          params: {
            provider: "gmail",
          },
        } as any)
      ).toBe(false);
    });
  });

  describe("execute() - sendEmail (Gmail)", () => {
    it("should send email via Gmail successfully", async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: {
          id: "msg123",
          threadId: "thread456",
          labelIds: ["SENT"],
        },
      });

      const mockGmail = {
        users: {
          messages: {
            send: mockSend,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "gmail",
          to: "recipient@example.com",
          subject: "Test Email",
          body: "This is a test email",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({
        id: "msg123",
        threadId: "thread456",
        labelIds: ["SENT"],
      });

      expect(mockSend).toHaveBeenCalledWith({
        userId: "me",
        requestBody: {
          raw: expect.any(String),
        },
      });
    });

    it("should send email with cc and bcc via Gmail", async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: "msg123" },
      });

      const mockGmail = {
        users: {
          messages: {
            send: mockSend,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "gmail",
          to: "recipient@example.com",
          subject: "Test",
          body: "Body",
          cc: "cc@example.com",
          bcc: "bcc@example.com",
        },
      });

      expect(result.success).toBe(true);
    });

    it("should send HTML email via Gmail", async () => {
      const mockSend = vi.fn().mockResolvedValue({
        data: { id: "msg123" },
      });

      const mockGmail = {
        users: {
          messages: {
            send: mockSend,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "gmail",
          to: "recipient@example.com",
          subject: "HTML Email",
          body: "<h1>Hello</h1>",
          html: true,
        },
      });

      expect(result.success).toBe(true);
    });

    it("should handle Gmail send errors", async () => {
      const mockSend = vi
        .fn()
        .mockRejectedValue(new Error("Gmail API error"));

      const mockGmail = {
        users: {
          messages: {
            send: mockSend,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "gmail",
          to: "recipient@example.com",
          subject: "Test",
          body: "Body",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Gmail API error");
    });
  });

  describe("execute() - sendEmail (Outlook)", () => {
    it("should send email via Outlook successfully", async () => {
      const mockPost = vi.fn().mockResolvedValue({
        id: "msg123",
      });

      const mockClient = {
        api: vi.fn().mockReturnValue({
          post: mockPost,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "outlook",
          to: "recipient@example.com",
          subject: "Test Email",
          body: "This is a test email",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual({ id: "msg123" });

      expect(mockClient.api).toHaveBeenCalledWith("/me/sendMail");
      expect(mockPost).toHaveBeenCalledWith({
        message: expect.objectContaining({
          subject: "Test Email",
          body: {
            contentType: "Text",
            content: "This is a test email",
          },
        }),
        saveToSentItems: true,
      });
    });

    it("should send HTML email via Outlook", async () => {
      const mockPost = vi.fn().mockResolvedValue({ id: "msg123" });

      const mockClient = {
        api: vi.fn().mockReturnValue({
          post: mockPost,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "outlook",
          to: "recipient@example.com",
          subject: "HTML Email",
          body: "<h1>Hello</h1>",
          html: true,
        },
      });

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            body: {
              contentType: "HTML",
              content: "<h1>Hello</h1>",
            },
          }),
        })
      );
    });

    it("should send email with cc and bcc via Outlook", async () => {
      const mockPost = vi.fn().mockResolvedValue({ id: "msg123" });

      const mockClient = {
        api: vi.fn().mockReturnValue({
          post: mockPost,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "outlook",
          to: "recipient@example.com",
          subject: "Test",
          body: "Body",
          cc: "cc1@example.com,cc2@example.com",
          bcc: "bcc@example.com",
        },
      });

      expect(result.success).toBe(true);
      expect(mockPost).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.objectContaining({
            ccRecipients: [
              { emailAddress: { address: "cc1@example.com" } },
              { emailAddress: { address: "cc2@example.com" } },
            ],
            bccRecipients: [{ emailAddress: { address: "bcc@example.com" } }],
          }),
        })
      );
    });

    it("should handle Outlook send errors", async () => {
      const mockPost = vi
        .fn()
        .mockRejectedValue(new Error("Outlook API error"));

      const mockClient = {
        api: vi.fn().mockReturnValue({
          post: mockPost,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "outlook",
          to: "recipient@example.com",
          subject: "Test",
          body: "Body",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Outlook API error");
    });
  });

  describe("execute() - readEmails (Gmail)", () => {
    it("should read emails from Gmail successfully", async () => {
      const mockList = vi.fn().mockResolvedValue({
        data: {
          messages: [{ id: "msg1" }, { id: "msg2" }],
        },
      });

      const mockGet = vi.fn().mockImplementation(({ id }) => ({
        data: {
          id,
          payload: {
            headers: [
              { name: "From", value: "sender@example.com" },
              { name: "Subject", value: "Test" },
            ],
          },
        },
      }));

      const mockGmail = {
        users: {
          messages: {
            list: mockList,
            get: mockGet,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "readEmails",
        params: {
          provider: "gmail",
          maxResults: 10,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.emails).toHaveLength(2);
      expect(result.data.totalResults).toBe(2);

      expect(mockList).toHaveBeenCalledWith({
        userId: "me",
        maxResults: 10,
        q: "",
      });
    });

    it("should read emails with query filter", async () => {
      const mockList = vi.fn().mockResolvedValue({
        data: { messages: [] },
      });

      const mockGmail = {
        users: {
          messages: {
            list: mockList,
            get: vi.fn(),
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      await skill.execute({
        action: "readEmails",
        params: {
          provider: "gmail",
          query: "from:test@example.com",
        },
      });

      expect(mockList).toHaveBeenCalledWith({
        userId: "me",
        maxResults: 10,
        q: "from:test@example.com",
      });
    });

    it("should handle Gmail read errors", async () => {
      const mockList = vi
        .fn()
        .mockRejectedValue(new Error("Gmail API error"));

      const mockGmail = {
        users: {
          messages: {
            list: mockList,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "readEmails",
        params: {
          provider: "gmail",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Gmail API error");
    });
  });

  describe("execute() - readEmails (Outlook)", () => {
    it("should read emails from Outlook successfully", async () => {
      const mockGet = vi.fn().mockResolvedValue({
        value: [
          {
            id: "msg1",
            subject: "Test 1",
            from: { emailAddress: { address: "sender1@example.com" } },
          },
          {
            id: "msg2",
            subject: "Test 2",
            from: { emailAddress: { address: "sender2@example.com" } },
          },
        ],
      });

      const mockClient = {
        api: vi.fn().mockReturnValue({
          top: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          filter: vi.fn().mockReturnThis(),
          get: mockGet,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      const result = await skill.execute({
        action: "readEmails",
        params: {
          provider: "outlook",
          maxResults: 5,
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.emails).toHaveLength(2);
      expect(result.data.totalResults).toBe(2);

      expect(mockClient.api).toHaveBeenCalledWith("/me/messages");
    });

    it("should read emails with query filter from Outlook", async () => {
      const mockGet = vi.fn().mockResolvedValue({ value: [] });

      const mockFilter = vi.fn().mockReturnThis();
      const mockClient = {
        api: vi.fn().mockReturnValue({
          top: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          filter: mockFilter,
          get: mockGet,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      await skill.execute({
        action: "readEmails",
        params: {
          provider: "outlook",
          query: "test",
        },
      });

      expect(mockFilter).toHaveBeenCalledWith("contains(subject,'test')");
    });

    it("should handle Outlook read errors", async () => {
      const mockGet = vi
        .fn()
        .mockRejectedValue(new Error("Outlook API error"));

      const mockClient = {
        api: vi.fn().mockReturnValue({
          top: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          get: mockGet,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      const result = await skill.execute({
        action: "readEmails",
        params: {
          provider: "outlook",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Outlook API error");
    });
  });

  describe("execute() - searchEmails (Gmail)", () => {
    it("should search emails in Gmail", async () => {
      const mockList = vi.fn().mockResolvedValue({
        data: {
          messages: [{ id: "msg1" }],
        },
      });

      const mockGet = vi.fn().mockResolvedValue({
        data: {
          id: "msg1",
          payload: { headers: [] },
        },
      });

      const mockGmail = {
        users: {
          messages: {
            list: mockList,
            get: mockGet,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "searchEmails",
        params: {
          provider: "gmail",
          query: "subject:important",
        },
      });

      expect(result.success).toBe(true);
      expect(mockList).toHaveBeenCalledWith({
        userId: "me",
        maxResults: 10,
        q: "subject:important",
      });
    });

    it("should reject search without query", async () => {
      const result = await skill.execute({
        action: "searchEmails",
        params: {
          provider: "gmail",
        } as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Query parameter is required");
    });
  });

  describe("execute() - searchEmails (Outlook)", () => {
    it("should search emails in Outlook", async () => {
      const mockGet = vi.fn().mockResolvedValue({
        value: [{ id: "msg1", subject: "Important" }],
      });

      const mockFilter = vi.fn().mockReturnThis();
      const mockClient = {
        api: vi.fn().mockReturnValue({
          top: vi.fn().mockReturnThis(),
          select: vi.fn().mockReturnThis(),
          filter: mockFilter,
          get: mockGet,
        }),
      };

      (Client.init as any).mockReturnValue(mockClient);

      const result = await skill.execute({
        action: "searchEmails",
        params: {
          provider: "outlook",
          query: "important",
        },
      });

      expect(result.success).toBe(true);
      expect(mockFilter).toHaveBeenCalledWith("contains(subject,'important')");
    });

    it("should reject search without query", async () => {
      const result = await skill.execute({
        action: "searchEmails",
        params: {
          provider: "outlook",
        } as any,
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Query parameter is required");
    });
  });

  describe("Error Handling", () => {
    it("should return error for unknown action", async () => {
      const result = await skill.execute({
        action: "invalidAction" as any,
        params: { provider: "gmail" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
    });

    it("should return error for invalid provider", async () => {
      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "invalid" as any,
          to: "test@example.com",
          subject: "Test",
          body: "Body",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid provider");
    });

    it("should handle non-Error exceptions", async () => {
      const mockSend = vi.fn().mockRejectedValue("String error");

      const mockGmail = {
        users: {
          messages: {
            send: mockSend,
          },
        },
      };

      (google.gmail as any).mockReturnValue(mockGmail);

      const result = await skill.execute({
        action: "sendEmail",
        params: {
          provider: "gmail",
          to: "test@example.com",
          subject: "Test",
          body: "Body",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should throw error if Gmail config missing", () => {
      const skillWithoutGmail = new EmailSkill({ outlook: mockConfig.outlook });

      expect(() => (skillWithoutGmail as any).getGmailClient()).toThrow(
        "Gmail configuration not provided"
      );
    });

    it("should throw error if Outlook config missing", () => {
      const skillWithoutOutlook = new EmailSkill({ gmail: mockConfig.gmail });

      expect(() => (skillWithoutOutlook as any).getOutlookClient()).toThrow(
        "Outlook configuration not provided"
      );
    });
  });

  describe("Configuration", () => {
    it("should use provided Gmail config", () => {
      const customConfig = {
        gmail: {
          clientId: "custom-id",
          clientSecret: "custom-secret",
          refreshToken: "custom-token",
        },
      };

      const customSkill = new EmailSkill(customConfig);
      expect((customSkill as any).config.gmail.clientId).toBe("custom-id");
    });

    it("should use provided Outlook config", () => {
      const customConfig = {
        outlook: {
          clientId: "custom-id",
          clientSecret: "custom-secret",
          accessToken: "custom-token",
        },
      };

      const customSkill = new EmailSkill(customConfig);
      expect((customSkill as any).config.outlook.accessToken).toBe(
        "custom-token"
      );
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createEmailSkill } = await import("../src/index.js");
      const factorySkill = createEmailSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(EmailSkill);
      expect(factorySkill.id).toBe("email");
    });
  });
});
