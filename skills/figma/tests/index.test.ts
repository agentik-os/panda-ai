import { describe, it, expect } from "vitest";
import { FigmaSkill, createFigmaSkill } from "../src/index.js";

describe("FigmaSkill", () => {
  const skill = createFigmaSkill({ accessToken: "test-token" });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("figma");
    expect(skill.name).toBe("Figma");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate getFile correctly", async () => {
    const valid = await skill.validate({
      action: "getFile",
      params: { fileKey: "test-key" },
    });
    expect(valid).toBe(true);
  });
});
