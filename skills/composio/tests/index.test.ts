/**
 * Composio Skill Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { ComposioSkill } from "../src/index.js";

const mockConfig = {
  apiKey: "test-api-key",
  entityId: "test-entity",
};

describe("ComposioSkill", () => {
  let skill: ComposioSkill;

  beforeEach(() => {
    skill = new ComposioSkill(mockConfig);
    vi.restoreAllMocks();
  });

  describe("metadata", () => {
    it("should have correct id and name", () => {
      expect(skill.id).toBe("composio");
      expect(skill.name).toBe("Composio App Integrations");
      expect(skill.version).toBe("1.0.0");
    });
  });

  describe("validate", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "connect" } as any)).toBe(false);
    });

    it("should reject connect without appId", async () => {
      expect(await skill.validate({ action: "connect", params: {} })).toBe(
        false
      );
    });

    it("should reject disconnect without connectionId", async () => {
      expect(await skill.validate({ action: "disconnect", params: {} })).toBe(
        false
      );
    });

    it("should reject executeAction without appId or actionId", async () => {
      expect(
        await skill.validate({
          action: "executeAction",
          params: { appId: "github" },
        })
      ).toBe(false);
      expect(
        await skill.validate({
          action: "executeAction",
          params: { actionId: "create-issue" },
        })
      ).toBe(false);
    });

    it("should reject listActions without appId", async () => {
      expect(await skill.validate({ action: "listActions", params: {} })).toBe(
        false
      );
    });

    it("should accept valid listApps", async () => {
      expect(await skill.validate({ action: "listApps", params: {} })).toBe(
        true
      );
    });

    it("should accept valid listConnections", async () => {
      expect(
        await skill.validate({ action: "listConnections", params: {} })
      ).toBe(true);
    });

    it("should accept valid connect", async () => {
      expect(
        await skill.validate({ action: "connect", params: { appId: "github" } })
      ).toBe(true);
    });

    it("should accept valid executeAction", async () => {
      expect(
        await skill.validate({
          action: "executeAction",
          params: {
            appId: "github",
            actionId: "create-issue",
            input: { title: "Test" },
          },
        })
      ).toBe(true);
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

    it("should handle API errors gracefully", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("API unavailable"));
      vi.stubGlobal("fetch", mockFetch);
      const result = await skill.execute({
        action: "listApps",
        params: {},
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("API unavailable");
    });

    it("should handle successful API response", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({ apps: [{ id: "github", name: "GitHub" }] }),
      } as Response);
      vi.stubGlobal("fetch", mockFetch);
      const result = await skill.execute({ action: "listApps", params: {} });
      expect(result.success).toBe(true);
      expect(result.data.apps).toHaveLength(1);
      expect(result.data.apps[0].id).toBe("github");
    });
  });
});
