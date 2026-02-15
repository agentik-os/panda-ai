import { describe, it, expect } from "vitest";
import { YouTubeSkill, createYouTubeSkill } from "../src/index.js";

describe("YouTubeSkill", () => {
  const skill = createYouTubeSkill({ apiKey: "test-key" });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("youtube");
    expect(skill.name).toBe("YouTube");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate searchVideos correctly", async () => {
    const valid = await skill.validate({
      action: "searchVideos",
      params: { query: "test" },
    });
    expect(valid).toBe(true);
  });
});
