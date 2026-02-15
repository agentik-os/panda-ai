import { describe, it, expect } from "vitest";
import { HubSpotSkill, createHubSpotSkill } from "../src/index.js";

describe("HubSpotSkill", () => {
  const skill = createHubSpotSkill({ accessToken: "test-token" });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("hubspot");
    expect(skill.name).toBe("HubSpot");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate createContact correctly", async () => {
    const valid = await skill.validate({
      action: "createContact",
      params: { email: "test@example.com" },
    });
    expect(valid).toBe(true);
  });
});
