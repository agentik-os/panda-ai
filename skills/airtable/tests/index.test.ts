import { describe, it, expect } from "vitest";
import { AirtableSkill, createAirtableSkill } from "../src/index.js";

describe("AirtableSkill", () => {
  const skill = createAirtableSkill({ apiKey: "test-key" });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("airtable");
    expect(skill.name).toBe("Airtable");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate listRecords correctly", async () => {
    const valid = await skill.validate({
      action: "listRecords",
      params: { baseId: "app123", tableId: "tbl123" },
    });
    expect(valid).toBe(true);
  });
});
