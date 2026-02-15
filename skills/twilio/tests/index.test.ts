/**
 * Twilio Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { TwilioSkill } from "../src/index.js";

// Mock twilio
vi.mock("twilio", () => {
  const mockCreate = vi.fn();
  const mockList = vi.fn();

  return {
    default: vi.fn(() => ({
      messages: {
        create: mockCreate,
        list: mockList,
      },
      calls: {
        create: mockCreate,
      },
    })),
    __getMocks: () => ({
      mockCreate,
      mockList,
    }),
  };
});

describe("TwilioSkill", () => {
  let skill: TwilioSkill;
  const mockConfig = {
    accountSid: "AC-test-account-sid",
    authToken: "test-auth-token",
  };

  beforeEach(() => {
    skill = new TwilioSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("twilio");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("Twilio SMS & Voice");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("Twilio");
      expect(skill.description).toContain("SMS");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "sendSMS" } as any)).toBe(false);
    });

    it("should accept valid sendSMS input", async () => {
      expect(
        await skill.validate({
          action: "sendSMS",
          params: {
            to: "+1234567890",
            from: "+0987654321",
            body: "Hello",
          },
        })
      ).toBe(true);
    });

    it("should accept valid makeCall input", async () => {
      expect(
        await skill.validate({
          action: "makeCall",
          params: {
            to: "+1234567890",
            from: "+0987654321",
            url: "https://example.com/twiml",
          },
        })
      ).toBe(true);
    });

    it("should accept valid listMessages input", async () => {
      expect(
        await skill.validate({
          action: "listMessages",
          params: {},
        })
      ).toBe(true);
    });
  });

  describe("execute() - sendSMS", () => {
    it("should send SMS successfully", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      const mockMessage = {
        sid: "SM123456",
        status: "sent",
        to: "+1234567890",
        from: "+0987654321",
        body: "Hello World",
      };

      mockCreate.mockResolvedValue(mockMessage);

      const result = await skill.execute({
        action: "sendSMS",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          body: "Hello World",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessage);

      expect(mockCreate).toHaveBeenCalledWith({
        to: "+1234567890",
        from: "+0987654321",
        body: "Hello World",
      });
    });

    it("should handle invalid phone number errors", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue(
        new Error("The 'To' number is not a valid phone number")
      );

      const result = await skill.execute({
        action: "sendSMS",
        params: {
          to: "invalid",
          from: "+0987654321",
          body: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not a valid phone number");
    });

    it("should handle insufficient balance errors", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue(new Error("Insufficient balance"));

      const result = await skill.execute({
        action: "sendSMS",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          body: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Insufficient balance");
    });
  });

  describe("execute() - makeCall", () => {
    it("should make call successfully", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      const mockCall = {
        sid: "CA123456",
        status: "queued",
        to: "+1234567890",
        from: "+0987654321",
      };

      mockCreate.mockResolvedValue(mockCall);

      const result = await skill.execute({
        action: "makeCall",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          url: "https://example.com/twiml",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockCall);

      expect(mockCreate).toHaveBeenCalledWith({
        to: "+1234567890",
        from: "+0987654321",
        url: "https://example.com/twiml",
      });
    });

    it("should handle call creation errors", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue(new Error("Invalid TwiML URL"));

      const result = await skill.execute({
        action: "makeCall",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          url: "invalid-url",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid TwiML URL");
    });

    it("should handle unauthorized number errors", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue(
        new Error("The number is not authorized for outbound calls")
      );

      const result = await skill.execute({
        action: "makeCall",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          url: "https://example.com/twiml",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("not authorized");
    });
  });

  describe("execute() - listMessages", () => {
    it("should list messages successfully", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockList } = __getMocks();

      const mockMessages = [
        {
          sid: "SM123",
          to: "+1234567890",
          from: "+0987654321",
          body: "Message 1",
          status: "delivered",
        },
        {
          sid: "SM456",
          to: "+1234567890",
          from: "+0987654321",
          body: "Message 2",
          status: "sent",
        },
      ];

      mockList.mockResolvedValue(mockMessages);

      const result = await skill.execute({
        action: "listMessages",
        params: {},
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockMessages);

      expect(mockList).toHaveBeenCalled();
    });

    it("should list messages with limit", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockList } = __getMocks();

      mockList.mockResolvedValue([]);

      await skill.execute({
        action: "listMessages",
        params: {
          limit: 10,
        },
      });

      expect(mockList).toHaveBeenCalledWith({ limit: 10 });
    });

    it("should handle list messages errors", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockList } = __getMocks();

      mockList.mockRejectedValue(new Error("Service unavailable"));

      const result = await skill.execute({
        action: "listMessages",
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Service unavailable");
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
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue("String error");

      const result = await skill.execute({
        action: "sendSMS",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          body: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle 401 authentication errors", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await skill.execute({
        action: "sendSMS",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          body: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("401");
    });

    it("should handle rate limit errors", async () => {
      const { default: Twilio, __getMocks } = await import("twilio");
      const { mockCreate } = __getMocks();

      mockCreate.mockRejectedValue(new Error("429 Too Many Requests"));

      const result = await skill.execute({
        action: "sendSMS",
        params: {
          to: "+1234567890",
          from: "+0987654321",
          body: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("429");
    });
  });

  describe("Configuration", () => {
    it("should use provided account SID", () => {
      const customSkill = new TwilioSkill({
        accountSid: "AC-custom-sid",
        authToken: "custom-token",
      });

      expect((customSkill as any).config.accountSid).toBe("AC-custom-sid");
    });

    it("should use provided auth token", () => {
      const customSkill = new TwilioSkill({
        accountSid: "AC-sid",
        authToken: "custom-auth-token",
      });

      expect((customSkill as any).config.authToken).toBe("custom-auth-token");
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createTwilioSkill } = await import("../src/index.js");
      const factorySkill = createTwilioSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(TwilioSkill);
      expect(factorySkill.id).toBe("twilio");
    });
  });
});
