import { describe, it, expect } from "vitest";
import { LinearSkill, createLinearSkill } from "../src/index.js";

describe("LinearSkill", () => {
  const skill = createLinearSkill({ apiKey: "test-key" });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("linear");
    expect(skill.name).toBe("Linear");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate createIssue correctly", async () => {
    const valid = await skill.validate({
      action: "createIssue",
      params: { title: "Test", teamId: "team-123" },
    });
    expect(valid).toBe(true);
  });
});
