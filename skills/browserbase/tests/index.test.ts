/**
 * Browserbase Skill Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { BrowserbaseSkill } from "../src/index.js";

const mockConfig = {
  apiKey: "test-api-key",
  projectId: "test-project-id",
  timeout: 15000,
};

describe("BrowserbaseSkill", () => {
  let skill: BrowserbaseSkill;

  beforeEach(() => {
    skill = new BrowserbaseSkill(mockConfig);
    vi.restoreAllMocks();
  });

  describe("metadata", () => {
    it("should have correct id and name", () => {
      expect(skill.id).toBe("browserbase");
      expect(skill.name).toBe("Browserbase Browser Automation");
      expect(skill.version).toBe("1.0.0");
    });
  });

  describe("validate", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "navigate" } as any)).toBe(false);
    });

    it("should reject navigate without url", async () => {
      expect(
        await skill.validate({
          action: "navigate",
          params: { sessionId: "s1" },
        })
      ).toBe(false);
    });

    it("should reject click without selector", async () => {
      expect(
        await skill.validate({ action: "click", params: { sessionId: "s1" } })
      ).toBe(false);
    });

    it("should reject session actions without sessionId", async () => {
      expect(
        await skill.validate({
          action: "navigate",
          params: { url: "https://example.com" },
        })
      ).toBe(false);
    });

    it("should accept valid createSession", async () => {
      expect(
        await skill.validate({ action: "createSession", params: {} })
      ).toBe(true);
    });

    it("should accept valid navigate", async () => {
      expect(
        await skill.validate({
          action: "navigate",
          params: { sessionId: "s1", url: "https://example.com" },
        })
      ).toBe(true);
    });

    it("should accept valid listSessions", async () => {
      expect(await skill.validate({ action: "listSessions", params: {} })).toBe(
        true
      );
    });
  });

  describe("execute", () => {
    it("should return error for unknown action", async () => {
      const result = await skill.execute({
        action: "unknown" as any,
        params: {},
      });
      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
    });

    it("should list sessions (empty initially)", async () => {
      const result = await skill.execute({
        action: "listSessions",
        params: {},
      });
      expect(result.success).toBe(true);
      expect(result.data.sessions).toEqual([]);
    });

    it("should handle API errors gracefully", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Network error"));
      vi.stubGlobal("fetch", mockFetch);
      const result = await skill.execute({
        action: "createSession",
        params: {},
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Network error");
    });
  });
});
