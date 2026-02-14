/**
 * E2B Skill Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { E2BSkill } from "../src/index.js";

const mockConfig = {
  apiKey: "test-api-key",
  defaultTemplate: "python",
  maxExecutionTime: 15000,
};

describe("E2BSkill", () => {
  let skill: E2BSkill;

  beforeEach(() => {
    skill = new E2BSkill(mockConfig);
    vi.restoreAllMocks();
  });

  describe("metadata", () => {
    it("should have correct id and name", () => {
      expect(skill.id).toBe("e2b");
      expect(skill.name).toBe("E2B Sandboxed Code Execution");
      expect(skill.version).toBe("1.0.0");
    });
  });

  describe("validate", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "runCode" } as any)).toBe(false);
    });

    it("should reject runCode without code", async () => {
      expect(
        await skill.validate({ action: "runCode", params: { sandboxId: "s1" } })
      ).toBe(false);
    });

    it("should reject runCommand without command", async () => {
      expect(
        await skill.validate({
          action: "runCommand",
          params: { sandboxId: "s1" },
        })
      ).toBe(false);
    });

    it("should reject sandbox actions without sandboxId", async () => {
      expect(
        await skill.validate({
          action: "runCode",
          params: { code: "print(1)" },
        })
      ).toBe(false);
    });

    it("should reject writeFile without path", async () => {
      expect(
        await skill.validate({
          action: "writeFile",
          params: { sandboxId: "s1", content: "x" },
        })
      ).toBe(false);
    });

    it("should accept valid createSandbox", async () => {
      expect(
        await skill.validate({ action: "createSandbox", params: {} })
      ).toBe(true);
    });

    it("should accept valid runCode", async () => {
      expect(
        await skill.validate({
          action: "runCode",
          params: { sandboxId: "s1", code: 'print("hello")' },
        })
      ).toBe(true);
    });

    it("should accept valid listSandboxes", async () => {
      expect(
        await skill.validate({ action: "listSandboxes", params: {} })
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

    it("should list sandboxes (empty initially)", async () => {
      const result = await skill.execute({
        action: "listSandboxes",
        params: {},
      });
      expect(result.success).toBe(true);
      expect(result.data.sandboxes).toEqual([]);
    });

    it("should handle API errors gracefully", async () => {
      const mockFetch = vi
        .fn()
        .mockRejectedValueOnce(new Error("Connection refused"));
      vi.stubGlobal("fetch", mockFetch);
      const result = await skill.execute({
        action: "createSandbox",
        params: { template: "python" },
      });
      expect(result.success).toBe(false);
      expect(result.error).toBe("Connection refused");
    });
  });
});
