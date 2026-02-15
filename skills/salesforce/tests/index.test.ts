import { describe, it, expect } from "vitest";
import { SalesforceSkill, createSalesforceSkill } from "../src/index.js";

describe("SalesforceSkill", () => {
  const skill = createSalesforceSkill({
    instanceUrl: "https://test.salesforce.com",
    accessToken: "test-token",
  });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("salesforce");
    expect(skill.name).toBe("Salesforce");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate createAccount correctly", async () => {
    const valid = await skill.validate({
      action: "createAccount",
      params: { name: "Test Account" },
    });
    expect(valid).toBe(true);
  });
});
