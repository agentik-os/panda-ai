import { describe, it, expect } from "vitest";
import { JiraSkill, createJiraSkill } from "../src/index.js";

describe("JiraSkill", () => {
  const skill = createJiraSkill({
    host: "test.atlassian.net",
    email: "test@example.com",
    apiToken: "test-token",
  });

  it("should have correct metadata", () => {
    expect(skill.id).toBe("jira");
    expect(skill.name).toBe("Jira");
    expect(skill.version).toBe("1.0.0");
  });

  it("should validate createIssue correctly", async () => {
    const valid = await skill.validate({
      action: "createIssue",
      params: {
        projectKey: "TEST",
        summary: "Test issue",
        issueType: "Bug",
      },
    });
    expect(valid).toBe(true);
  });
});
