/**
 * Notion Skill Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NotionSkill, createNotionSkill } from "../src/index.js";

// Mock @notionhq/client
vi.mock("@notionhq/client", () => {
  return {
    Client: vi.fn().mockImplementation(() => ({
      databases: {
        retrieve: vi.fn(),
        query: vi.fn(),
      },
      pages: {
        create: vi.fn(),
        retrieve: vi.fn(),
        update: vi.fn(),
      },
      blocks: {
        children: {
          list: vi.fn(),
          append: vi.fn(),
        },
      },
      search: vi.fn(),
    })),
  };
});

describe("NotionSkill", () => {
  let skill: NotionSkill;
  const mockConfig = { token: "test-token" };

  beforeEach(() => {
    skill = createNotionSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("notion");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("Notion");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toBeTruthy();
      expect(skill.description).toContain("Notion");
    });
  });

  describe("validate()", () => {
    it("should reject input without action", async () => {
      const valid = await skill.validate({} as any);
      expect(valid).toBe(false);
    });

    it("should reject input without params", async () => {
      const valid = await skill.validate({ action: "listDatabases" } as any);
      expect(valid).toBe(false);
    });

    describe("listDatabases", () => {
      it("should validate listDatabases with minimal params", async () => {
        const valid = await skill.validate({
          action: "listDatabases",
          params: {},
        });
        expect(valid).toBe(true);
      });
    });

    describe("getDatabase", () => {
      it("should validate getDatabase with databaseId", async () => {
        const valid = await skill.validate({
          action: "getDatabase",
          params: { databaseId: "db-123" },
        });
        expect(valid).toBe(true);
      });

      it("should reject getDatabase without databaseId", async () => {
        const valid = await skill.validate({
          action: "getDatabase",
          params: {},
        });
        expect(valid).toBe(false);
      });
    });

    describe("queryDatabase", () => {
      it("should validate queryDatabase with databaseId", async () => {
        const valid = await skill.validate({
          action: "queryDatabase",
          params: { databaseId: "db-123" },
        });
        expect(valid).toBe(true);
      });

      it("should validate queryDatabase with filters and sorts", async () => {
        const valid = await skill.validate({
          action: "queryDatabase",
          params: {
            databaseId: "db-123",
            filter: { property: "Status", status: { equals: "Done" } },
            sorts: [{ property: "Name", direction: "ascending" }],
          },
        });
        expect(valid).toBe(true);
      });

      it("should reject queryDatabase without databaseId", async () => {
        const valid = await skill.validate({
          action: "queryDatabase",
          params: {},
        });
        expect(valid).toBe(false);
      });
    });

    describe("createPage", () => {
      it("should validate createPage with parent and properties", async () => {
        const valid = await skill.validate({
          action: "createPage",
          params: {
            parent: { database_id: "db-123" },
            properties: { Name: { title: [{ text: { content: "Test" } }] } },
          },
        });
        expect(valid).toBe(true);
      });

      it("should reject createPage without parent", async () => {
        const valid = await skill.validate({
          action: "createPage",
          params: {
            properties: { Name: { title: [{ text: { content: "Test" } }] } },
          },
        });
        expect(valid).toBe(false);
      });

      it("should reject createPage without properties", async () => {
        const valid = await skill.validate({
          action: "createPage",
          params: { parent: { database_id: "db-123" } },
        });
        expect(valid).toBe(false);
      });
    });

    describe("getPage", () => {
      it("should validate getPage with pageId", async () => {
        const valid = await skill.validate({
          action: "getPage",
          params: { pageId: "page-123" },
        });
        expect(valid).toBe(true);
      });

      it("should reject getPage without pageId", async () => {
        const valid = await skill.validate({
          action: "getPage",
          params: {},
        });
        expect(valid).toBe(false);
      });
    });

    describe("updatePage", () => {
      it("should validate updatePage with pageId and properties", async () => {
        const valid = await skill.validate({
          action: "updatePage",
          params: {
            pageId: "page-123",
            properties: { Status: { status: { name: "Done" } } },
          },
        });
        expect(valid).toBe(true);
      });

      it("should reject updatePage without pageId", async () => {
        const valid = await skill.validate({
          action: "updatePage",
          params: { properties: {} },
        });
        expect(valid).toBe(false);
      });

      it("should reject updatePage without properties", async () => {
        const valid = await skill.validate({
          action: "updatePage",
          params: { pageId: "page-123" },
        });
        expect(valid).toBe(false);
      });
    });

    describe("archivePage", () => {
      it("should validate archivePage with pageId", async () => {
        const valid = await skill.validate({
          action: "archivePage",
          params: { pageId: "page-123" },
        });
        expect(valid).toBe(true);
      });

      it("should reject archivePage without pageId", async () => {
        const valid = await skill.validate({
          action: "archivePage",
          params: {},
        });
        expect(valid).toBe(false);
      });
    });

    describe("getPageBlocks", () => {
      it("should validate getPageBlocks with blockId", async () => {
        const valid = await skill.validate({
          action: "getPageBlocks",
          params: { blockId: "block-123" },
        });
        expect(valid).toBe(true);
      });

      it("should reject getPageBlocks without blockId", async () => {
        const valid = await skill.validate({
          action: "getPageBlocks",
          params: {},
        });
        expect(valid).toBe(false);
      });
    });

    describe("appendBlocks", () => {
      it("should validate appendBlocks with blockId and children", async () => {
        const valid = await skill.validate({
          action: "appendBlocks",
          params: {
            blockId: "block-123",
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: { rich_text: [{ type: "text", text: { content: "Hello" } }] },
              },
            ],
          },
        });
        expect(valid).toBe(true);
      });

      it("should reject appendBlocks without blockId", async () => {
        const valid = await skill.validate({
          action: "appendBlocks",
          params: { children: [] },
        });
        expect(valid).toBe(false);
      });

      it("should reject appendBlocks without children", async () => {
        const valid = await skill.validate({
          action: "appendBlocks",
          params: { blockId: "block-123" },
        });
        expect(valid).toBe(false);
      });
    });

    describe("search", () => {
      it("should validate search with minimal params", async () => {
        const valid = await skill.validate({
          action: "search",
          params: {},
        });
        expect(valid).toBe(true);
      });

      it("should validate search with query", async () => {
        const valid = await skill.validate({
          action: "search",
          params: { query: "test" },
        });
        expect(valid).toBe(true);
      });
    });
  });

  describe("execute()", () => {
    describe("listDatabases", () => {
      it("should list databases", async () => {
        const mockResponse = {
          results: [{ id: "db-1" }, { id: "db-2" }],
          has_more: false,
          next_cursor: null,
        };

        const mockClient = (skill as any).getClient();
        mockClient.search.mockResolvedValueOnce(mockResponse);

        const result = await skill.execute({
          action: "listDatabases",
          params: { pageSize: 10 },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          databases: mockResponse.results,
          hasMore: false,
          nextCursor: null,
        });
        expect(mockClient.search).toHaveBeenCalledWith({
          filter: { property: "object", value: "database" },
          page_size: 10,
        });
      });
    });

    describe("getDatabase", () => {
      it("should get database by ID", async () => {
        const mockDatabase = { id: "db-123", title: [{ plain_text: "My Database" }] };
        const mockClient = (skill as any).getClient();
        mockClient.databases.retrieve.mockResolvedValueOnce(mockDatabase);

        const result = await skill.execute({
          action: "getDatabase",
          params: { databaseId: "db-123" },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ database: mockDatabase });
        expect(mockClient.databases.retrieve).toHaveBeenCalledWith({
          database_id: "db-123",
        });
      });
    });

    describe("queryDatabase", () => {
      it("should query database with filters", async () => {
        const mockResponse = {
          results: [{ id: "page-1" }],
          has_more: false,
          next_cursor: null,
        };

        const mockClient = (skill as any).getClient();
        mockClient.databases.query.mockResolvedValueOnce(mockResponse);

        const result = await skill.execute({
          action: "queryDatabase",
          params: {
            databaseId: "db-123",
            filter: { property: "Status", status: { equals: "Done" } },
            sorts: [{ property: "Name", direction: "ascending" }],
          },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          results: mockResponse.results,
          hasMore: false,
          nextCursor: null,
        });
      });
    });

    describe("createPage", () => {
      it("should create a page", async () => {
        const mockPage = { id: "page-123" };
        const mockClient = (skill as any).getClient();
        mockClient.pages.create.mockResolvedValueOnce(mockPage);

        const result = await skill.execute({
          action: "createPage",
          params: {
            parent: { database_id: "db-123" },
            properties: { Name: { title: [{ text: { content: "Test Page" } }] } },
          },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ page: mockPage });
      });
    });

    describe("getPage", () => {
      it("should get page by ID", async () => {
        const mockPage = { id: "page-123" };
        const mockClient = (skill as any).getClient();
        mockClient.pages.retrieve.mockResolvedValueOnce(mockPage);

        const result = await skill.execute({
          action: "getPage",
          params: { pageId: "page-123" },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ page: mockPage });
      });
    });

    describe("updatePage", () => {
      it("should update page properties", async () => {
        const mockPage = { id: "page-123" };
        const mockClient = (skill as any).getClient();
        mockClient.pages.update.mockResolvedValueOnce(mockPage);

        const result = await skill.execute({
          action: "updatePage",
          params: {
            pageId: "page-123",
            properties: { Status: { status: { name: "Done" } } },
          },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ page: mockPage });
      });
    });

    describe("archivePage", () => {
      it("should archive a page", async () => {
        const mockClient = (skill as any).getClient();
        mockClient.pages.update.mockResolvedValueOnce({});

        const result = await skill.execute({
          action: "archivePage",
          params: { pageId: "page-123" },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ archived: true, pageId: "page-123" });
        expect(mockClient.pages.update).toHaveBeenCalledWith({
          page_id: "page-123",
          archived: true,
        });
      });
    });

    describe("getPageBlocks", () => {
      it("should get page blocks", async () => {
        const mockResponse = {
          results: [{ id: "block-1" }],
          has_more: false,
          next_cursor: null,
        };

        const mockClient = (skill as any).getClient();
        mockClient.blocks.children.list.mockResolvedValueOnce(mockResponse);

        const result = await skill.execute({
          action: "getPageBlocks",
          params: { blockId: "page-123" },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          blocks: mockResponse.results,
          hasMore: false,
          nextCursor: null,
        });
      });
    });

    describe("appendBlocks", () => {
      it("should append blocks to a page", async () => {
        const mockResponse = { results: [{ id: "block-new" }] };
        const mockClient = (skill as any).getClient();
        mockClient.blocks.children.append.mockResolvedValueOnce(mockResponse);

        const result = await skill.execute({
          action: "appendBlocks",
          params: {
            blockId: "page-123",
            children: [
              {
                object: "block",
                type: "paragraph",
                paragraph: { rich_text: [{ type: "text", text: { content: "New paragraph" } }] },
              },
            ],
          },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({ blocks: mockResponse.results });
      });
    });

    describe("search", () => {
      it("should search all pages and databases", async () => {
        const mockResponse = {
          results: [{ id: "page-1" }, { id: "db-1" }],
          has_more: false,
          next_cursor: null,
        };

        const mockClient = (skill as any).getClient();
        mockClient.search.mockResolvedValueOnce(mockResponse);

        const result = await skill.execute({
          action: "search",
          params: { query: "test" },
        });

        expect(result.success).toBe(true);
        expect(result.data).toEqual({
          results: mockResponse.results,
          hasMore: false,
          nextCursor: null,
        });
      });
    });

    describe("Error Handling", () => {
      it("should handle unknown action", async () => {
        const result = await skill.execute({
          action: "unknownAction" as any,
          params: {},
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Unknown action");
      });

      it("should handle API errors", async () => {
        const mockClient = (skill as any).getClient();
        mockClient.pages.retrieve.mockRejectedValueOnce(
          new Error("API Error: Invalid page ID")
        );

        const result = await skill.execute({
          action: "getPage",
          params: { pageId: "invalid" },
        });

        expect(result.success).toBe(false);
        expect(result.error).toContain("Invalid page ID");
      });
    });
  });

  describe("Configuration", () => {
    it("should initialize with token", () => {
      const skill = createNotionSkill({ token: "test-token" });
      expect(skill).toBeInstanceOf(NotionSkill);
    });

    it("should create client with token", () => {
      const skill = createNotionSkill({ token: "test-token-123" });
      const client = (skill as any).getClient();
      expect(client).toBeDefined();
    });
  });

  describe("Factory Function", () => {
    it("should create NotionSkill instance", () => {
      const skill = createNotionSkill(mockConfig);
      expect(skill).toBeInstanceOf(NotionSkill);
      expect(skill.id).toBe("notion");
    });
  });
});
