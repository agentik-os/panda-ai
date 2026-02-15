import { describe, it, expect } from "vitest";
import { GoogleDriveSkill, createGoogleDriveSkill } from "../src/index.js";

describe("GoogleDriveSkill", () => {
  const skill = createGoogleDriveSkill({ accessToken: "test-token" });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("google-drive");
    expect(skill.name).toBe("Google Drive");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate createFile correctly", async () => {
    const valid = await skill.validate({
      action: "createFile",
      params: { name: "test.txt", mimeType: "text/plain" },
    });
    expect(valid).toBe(true);
  });
});
