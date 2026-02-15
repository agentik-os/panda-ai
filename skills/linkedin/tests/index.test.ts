/**
 * LinkedIn Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { LinkedInSkill } from "../src/index.js";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("LinkedInSkill", () => {
  let skill: LinkedInSkill;
  const mockConfig = {
    clientId: "test-client-id",
    clientSecret: "test-client-secret",
    accessToken: "test-access-token",
  };

  beforeEach(() => {
    skill = new LinkedInSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("linkedin");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("LinkedIn API");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("LinkedIn");
      expect(skill.description).toContain("networking");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "post" } as any)).toBe(false);
    });

    it("should accept valid post input", async () => {
      expect(
        await skill.validate({
          action: "post",
          params: { authorId: "123", text: "Hello" },
        })
      ).toBe(true);
    });

    it("should accept valid getProfile input", async () => {
      expect(
        await skill.validate({ action: "getProfile", params: {} })
      ).toBe(true);
    });

    it("should accept valid share input", async () => {
      expect(
        await skill.validate({
          action: "share",
          params: { authorId: "123", text: "Share" },
        })
      ).toBe(true);
    });
  });

  describe("execute() - createPost", () => {
    it("should create post successfully", async () => {
      const mockResponse = {
        data: {
          id: "post123",
          created: "2024-02-14",
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "post",
        params: {
          authorId: "user123",
          text: "Hello LinkedIn!",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);

      expect(mockedAxios.post).toHaveBeenCalledWith(
        "https://api.linkedin.com/v2/ugcPosts",
        expect.objectContaining({
          author: "urn:li:person:user123",
          lifecycleState: "PUBLISHED",
          specificContent: {
            "com.linkedin.ugc.ShareContent": {
              shareCommentary: {
                text: "Hello LinkedIn!",
              },
              shareMediaCategory: "NONE",
            },
          },
          visibility: {
            "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
          },
        }),
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-access-token",
            "Content-Type": "application/json",
          },
        })
      );
    });

    it("should handle post creation errors", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Rate limit exceeded"));

      const result = await skill.execute({
        action: "post",
        params: {
          authorId: "user123",
          text: "Test",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Rate limit exceeded");
    });

    it("should handle network errors", async () => {
      mockedAxios.post.mockRejectedValue(new Error("Network error"));

      const result = await skill.execute({
        action: "post",
        params: { authorId: "123", text: "Test" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("execute() - getProfile", () => {
    it("should get profile successfully", async () => {
      const mockProfile = {
        data: {
          id: "user123",
          firstName: { localized: { en_US: "John" } },
          lastName: { localized: { en_US: "Doe" } },
        },
      };

      mockedAxios.get.mockResolvedValue(mockProfile);

      const result = await skill.execute({
        action: "getProfile",
        params: {},
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockProfile.data);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        "https://api.linkedin.com/v2/me",
        expect.objectContaining({
          headers: {
            Authorization: "Bearer test-access-token",
          },
        })
      );
    });

    it("should handle unauthorized profile access", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Unauthorized"));

      const result = await skill.execute({
        action: "getProfile",
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unauthorized");
    });
  });

  describe("execute() - shareContent", () => {
    it("should share content successfully", async () => {
      const mockResponse = {
        data: {
          id: "share123",
          created: "2024-02-14",
        },
      };

      mockedAxios.post.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "share",
        params: {
          authorId: "user123",
          text: "Check this out!",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);
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
      mockedAxios.post.mockRejectedValue("String error");

      const result = await skill.execute({
        action: "post",
        params: { authorId: "123", text: "Test" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle 401 authentication errors", async () => {
      mockedAxios.post.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await skill.execute({
        action: "post",
        params: { authorId: "123", text: "Test" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("401");
    });

    it("should handle 429 rate limit errors", async () => {
      mockedAxios.post.mockRejectedValue(new Error("429 Too Many Requests"));

      const result = await skill.execute({
        action: "post",
        params: { authorId: "123", text: "Test" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("429");
    });
  });

  describe("Configuration", () => {
    it("should use provided access token", () => {
      const customSkill = new LinkedInSkill({
        clientId: "custom-id",
        clientSecret: "custom-secret",
        accessToken: "custom-token",
      });

      expect((customSkill as any).config.accessToken).toBe("custom-token");
    });

    it("should use correct base URL", () => {
      expect((skill as any).baseUrl).toBe("https://api.linkedin.com/v2");
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createLinkedInSkill } = await import("../src/index.js");
      const factorySkill = createLinkedInSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(LinkedInSkill);
      expect(factorySkill.id).toBe("linkedin");
    });
  });
});
