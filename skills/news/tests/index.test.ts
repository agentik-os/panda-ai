/**
 * News Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NewsSkill } from "../src/index.js";
import axios from "axios";

// Mock axios
vi.mock("axios");
const mockedAxios = vi.mocked(axios, true);

describe("NewsSkill", () => {
  let skill: NewsSkill;
  const mockConfig = {
    apiKey: "test-news-api-key",
  };

  beforeEach(() => {
    skill = new NewsSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("news");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("News API");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("News");
      expect(skill.description).toContain("articles");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "getTopHeadlines" } as any)).toBe(
        false
      );
    });

    it("should accept valid getTopHeadlines input", async () => {
      expect(
        await skill.validate({
          action: "getTopHeadlines",
          params: {
            country: "us",
            category: "technology",
          },
        })
      ).toBe(true);
    });

    it("should accept valid searchNews input", async () => {
      expect(
        await skill.validate({
          action: "searchNews",
          params: {
            query: "artificial intelligence",
          },
        })
      ).toBe(true);
    });

    it("should accept valid getSources input", async () => {
      expect(
        await skill.validate({
          action: "getSources",
          params: {},
        })
      ).toBe(true);
    });
  });

  describe("execute() - getTopHeadlines", () => {
    it("should get top headlines successfully", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          totalResults: 2,
          articles: [
            {
              source: { id: "techcrunch", name: "TechCrunch" },
              title: "AI Breakthrough",
              description: "Major AI advancement",
              url: "https://example.com/article1",
              publishedAt: "2024-02-14T10:00:00Z",
            },
            {
              source: { id: "wired", name: "Wired" },
              title: "Tech Innovation",
              description: "New technology announced",
              url: "https://example.com/article2",
              publishedAt: "2024-02-14T11:00:00Z",
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "getTopHeadlines",
        params: {
          country: "us",
          category: "technology",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("top-headlines"),
        expect.objectContaining({
          params: {
            country: "us",
            category: "technology",
            apiKey: "test-news-api-key",
          },
        })
      );
    });

    it("should get headlines with page size", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          totalResults: 1,
          articles: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await skill.execute({
        action: "getTopHeadlines",
        params: {
          country: "us",
          pageSize: 10,
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            pageSize: 10,
          }),
        })
      );
    });

    it("should handle invalid country errors", async () => {
      mockedAxios.get.mockRejectedValue(
        new Error("Invalid country parameter")
      );

      const result = await skill.execute({
        action: "getTopHeadlines",
        params: {
          country: "invalid",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid country");
    });

    it("should handle invalid category errors", async () => {
      mockedAxios.get.mockRejectedValue(
        new Error("Invalid category parameter")
      );

      const result = await skill.execute({
        action: "getTopHeadlines",
        params: {
          country: "us",
          category: "invalid",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid category");
    });
  });

  describe("execute() - searchNews", () => {
    it("should search news successfully", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          totalResults: 1,
          articles: [
            {
              source: { id: null, name: "Example" },
              title: "AI Article",
              description: "About AI",
              url: "https://example.com/ai",
              publishedAt: "2024-02-14T10:00:00Z",
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "searchNews",
        params: {
          query: "artificial intelligence",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("everything"),
        expect.objectContaining({
          params: {
            q: "artificial intelligence",
            apiKey: "test-news-api-key",
          },
        })
      );
    });

    it("should search with date range", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          totalResults: 0,
          articles: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await skill.execute({
        action: "searchNews",
        params: {
          query: "AI",
          from: "2024-01-01",
          to: "2024-12-31",
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            from: "2024-01-01",
            to: "2024-12-31",
          }),
        })
      );
    });

    it("should search with sorting", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          totalResults: 0,
          articles: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await skill.execute({
        action: "searchNews",
        params: {
          query: "technology",
          sortBy: "popularity",
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            sortBy: "popularity",
          }),
        })
      );
    });

    it("should handle empty query errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Query parameter missing"));

      const result = await skill.execute({
        action: "searchNews",
        params: {
          query: "",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Query parameter");
    });

    it("should handle invalid date errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Invalid date format"));

      const result = await skill.execute({
        action: "searchNews",
        params: {
          query: "AI",
          from: "invalid-date",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Invalid date");
    });
  });

  describe("execute() - getSources", () => {
    it("should get sources successfully", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          sources: [
            {
              id: "techcrunch",
              name: "TechCrunch",
              description: "Tech news",
              url: "https://techcrunch.com",
              category: "technology",
              language: "en",
              country: "us",
            },
            {
              id: "wired",
              name: "Wired",
              description: "Technology news",
              url: "https://wired.com",
              category: "technology",
              language: "en",
              country: "us",
            },
          ],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "getSources",
        params: {},
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data);

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.stringContaining("sources"),
        expect.objectContaining({
          params: {
            apiKey: "test-news-api-key",
          },
        })
      );
    });

    it("should get sources by category", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          sources: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await skill.execute({
        action: "getSources",
        params: {
          category: "business",
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            category: "business",
          }),
        })
      );
    });

    it("should get sources by language and country", async () => {
      const mockResponse = {
        data: {
          status: "ok",
          sources: [],
        },
      };

      mockedAxios.get.mockResolvedValue(mockResponse);

      await skill.execute({
        action: "getSources",
        params: {
          language: "fr",
          country: "fr",
        },
      });

      expect(mockedAxios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            language: "fr",
            country: "fr",
          }),
        })
      );
    });

    it("should handle sources fetch errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Service unavailable"));

      const result = await skill.execute({
        action: "getSources",
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
      mockedAxios.get.mockRejectedValue("String error");

      const result = await skill.execute({
        action: "getTopHeadlines",
        params: { country: "us" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle 401 authentication errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await skill.execute({
        action: "getTopHeadlines",
        params: { country: "us" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("401");
    });

    it("should handle 429 rate limit errors", async () => {
      mockedAxios.get.mockRejectedValue(
        new Error("429 Too Many Requests - Rate limit exceeded")
      );

      const result = await skill.execute({
        action: "searchNews",
        params: { query: "test" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("429");
    });

    it("should handle network errors", async () => {
      mockedAxios.get.mockRejectedValue(new Error("Network error"));

      const result = await skill.execute({
        action: "getSources",
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });

  describe("Configuration", () => {
    it("should use provided API key", () => {
      const customSkill = new NewsSkill({
        apiKey: "custom-news-api-key",
      });

      expect((customSkill as any).config.apiKey).toBe("custom-news-api-key");
    });

    it("should use correct base URL", () => {
      expect((skill as any).baseUrl).toBe("https://newsapi.org/v2");
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createNewsSkill } = await import("../src/index.js");
      const factorySkill = createNewsSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(NewsSkill);
      expect(factorySkill.id).toBe("news");
    });
  });
});
