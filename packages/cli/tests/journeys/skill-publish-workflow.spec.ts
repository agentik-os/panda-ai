import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { mockHomeDir } from "../setup";
import * as fs from "node:fs";
import * as path from "node:path";

/**
 * CLI E2E Journey: Skill Publish Workflow
 *
 * Tests the complete skill development and publishing workflow:
 * 1. `panda skill create` - Create a new skill
 * 2. Develop skill logic
 * 3. `panda skill test` - Test the skill
 * 4. `panda skill publish` - Publish to marketplace
 *
 * Target: Validate skill development lifecycle
 */

vi.mock("inquirer", () => ({
  default: {
    prompt: vi.fn(),
  },
}));

vi.mock("ora", () => ({
  default: vi.fn(() => ({
    start: vi.fn().mockReturnThis(),
    succeed: vi.fn().mockReturnThis(),
    fail: vi.fn().mockReturnThis(),
    stop: vi.fn().mockReturnThis(),
    text: "",
  })),
}));

// Mock uploader for marketplace publishing
vi.mock("../../src/utils/uploader", () => ({
  uploadToMarketplace: vi.fn().mockResolvedValue({
    packageId: "skill-test-123",
    version: "1.0.0",
    downloadUrl: "https://marketplace.agentik-os.com/skills/test-123.tar.gz",
  }),
}));

describe("CLI E2E Journey: Skill Publish Workflow", () => {
  let homeSetup: ReturnType<typeof mockHomeDir>;

  beforeEach(() => {
    homeSetup = mockHomeDir();
    vi.clearAllMocks();
  });

  afterEach(() => {
    homeSetup.cleanup();
  });

  describe("Complete Skill Development Lifecycle", () => {
    it("should complete skill creation, testing, and publishing", async () => {
      const inquirer = await import("inquirer");

      // STEP 1: Create a new skill
      const { skillCreateCommand } = await import("../../src/commands/skill-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "weather-forecast",
        description: "Get weather forecasts for any location",
        category: "utility",
        permissions: ["network"],
        language: "typescript",
      });

      await skillCreateCommand();

      // Verify skill scaffolded
      const skillPath = path.join(process.cwd(), "skills", "weather-forecast");
      expect(fs.existsSync(skillPath)).toBe(true);
      expect(fs.existsSync(path.join(skillPath, "src", "index.ts"))).toBe(true);
      expect(fs.existsSync(path.join(skillPath, "package.json"))).toBe(true);

      // STEP 2: Develop skill logic (simulated by updating files)
      const skillCode = `
import { SkillBase } from "@agentik-os/sdk";

export interface WeatherInput {
  action: "getForecast";
  params: {
    location: string;
  };
}

export interface WeatherOutput {
  success: boolean;
  data?: {
    temperature: number;
    conditions: string;
    location: string;
  };
  error?: string;
}

export class WeatherForecastSkill extends SkillBase<WeatherInput, WeatherOutput> {
  readonly id = "weather-forecast";
  readonly name = "Weather Forecast";
  readonly version = "1.0.0";
  readonly description = "Get weather forecasts";

  async execute(input: WeatherInput): Promise<WeatherOutput> {
    if (input.action === "getForecast") {
      // Mock weather data for testing
      return {
        success: true,
        data: {
          temperature: 72,
          conditions: "Sunny",
          location: input.params.location,
        },
      };
    }
    return { success: false, error: "Unknown action" };
  }

  async validate(input: WeatherInput): Promise<boolean> {
    return Boolean(input?.action && input?.params?.location);
  }
}
`;

      fs.writeFileSync(path.join(skillPath, "src", "index.ts"), skillCode);

      // STEP 3: Test the skill
      const { skillTestCommand } = await import("../../src/commands/skill-test.js");

      const testResult = await skillTestCommand({ skill: "weather-forecast" });

      // Verify skill tests passed
      expect(testResult).toContain("pass" || "success" || "✓");

      // STEP 4: Publish to marketplace
      const { skillPublishCommand } = await import("../../src/commands/skill-publish.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        version: "1.0.0",
        releaseNotes: "Initial release",
        tags: ["weather", "utility"],
        confirm: true,
      });

      const publishResult = await skillPublishCommand({ skill: "weather-forecast" });

      // Verify publish successful
      expect(publishResult).toContain("published" || "success");
      expect(publishResult).toContain("1.0.0");

      // Verify uploader was called
      const { uploadToMarketplace } = await import("../../src/utils/uploader");
      expect(uploadToMarketplace).toHaveBeenCalledWith(
        skillPath,
        "skill",
        expect.objectContaining({
          name: "weather-forecast",
          version: "1.0.0",
        })
      );
    });

    it("should validate skill before publishing", async () => {
      const inquirer = await import("inquirer");

      // Create skill with missing required fields
      const { skillCreateCommand } = await import("../../src/commands/skill-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "invalid-skill",
        description: "", // Invalid: empty description
        category: "utility",
        permissions: [],
        language: "typescript",
      });

      await expect(skillCreateCommand()).rejects.toThrow();
    });

    it("should support skill versioning and updates", async () => {
      const inquirer = await import("inquirer");

      // STEP 1: Create and publish initial version
      const { skillCreateCommand } = await import("../../src/commands/skill-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "versioned-skill",
        description: "A skill with versioning",
        category: "utility",
        permissions: ["network"],
        language: "typescript",
      });

      await skillCreateCommand();

      const skillPath = path.join(process.cwd(), "skills", "versioned-skill");

      // Write initial skill code
      const initialCode = `
export class VersionedSkill {
  readonly version = "1.0.0";
}
`;
      fs.writeFileSync(path.join(skillPath, "src", "index.ts"), initialCode);

      // Publish v1.0.0
      const { skillPublishCommand } = await import("../../src/commands/skill-publish.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        version: "1.0.0",
        releaseNotes: "Initial release",
        tags: ["test"],
        confirm: true,
      });

      await skillPublishCommand({ skill: "versioned-skill" });

      // STEP 2: Update skill code
      const updatedCode = `
export class VersionedSkill {
  readonly version = "1.1.0";
  // New feature added
  newFeature() {
    return "Updated!";
  }
}
`;
      fs.writeFileSync(path.join(skillPath, "src", "index.ts"), updatedCode);

      // Publish v1.1.0
      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        version: "1.1.0",
        releaseNotes: "Added new feature",
        tags: ["test", "updated"],
        confirm: true,
      });

      const updateResult = await skillPublishCommand({ skill: "versioned-skill" });

      // Verify version update
      expect(updateResult).toContain("1.1.0");

      const { uploadToMarketplace } = await import("../../src/utils/uploader");
      expect(uploadToMarketplace).toHaveBeenLastCalledWith(
        skillPath,
        "skill",
        expect.objectContaining({
          version: "1.1.0",
        })
      );
    });
  });

  describe("Security Scanning", () => {
    it("should scan skill for security issues before publishing", async () => {
      const inquirer = await import("inquirer");

      // Create skill
      const { skillCreateCommand } = await import("../../src/commands/skill-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "secure-skill",
        description: "A skill with security checks",
        category: "utility",
        permissions: ["network"],
        language: "typescript",
      });

      await skillCreateCommand();

      const skillPath = path.join(process.cwd(), "skills", "secure-skill");

      // Write skill code with potential security issue
      const skillCode = `
export class SecureSkill {
  async execute(input: any) {
    // Potential security issue: eval
    const result = eval(input.code);
    return { success: true, result };
  }
}
`;
      fs.writeFileSync(path.join(skillPath, "src", "index.ts"), skillCode);

      // Attempt to publish - should detect security issue
      const { skillPublishCommand } = await import("../../src/commands/skill-publish.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        version: "1.0.0",
        releaseNotes: "Initial release",
        tags: ["test"],
        confirm: true,
      });

      // Should warn about security issue or reject
      const result = await skillPublishCommand({ skill: "secure-skill" });
      expect(result).toContain("security" || "warning" || "scan");
    });
  });

  describe("Testing Integration", () => {
    it("should run automated tests before publishing", async () => {
      const inquirer = await import("inquirer");

      // Create skill with tests
      const { skillCreateCommand } = await import("../../src/commands/skill-create.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        name: "tested-skill",
        description: "A skill with automated tests",
        category: "utility",
        permissions: [],
        language: "typescript",
      });

      await skillCreateCommand();

      const skillPath = path.join(process.cwd(), "skills", "tested-skill");

      // Write skill code
      const skillCode = `
export class TestedSkill {
  add(a: number, b: number): number {
    return a + b;
  }
}
`;
      fs.writeFileSync(path.join(skillPath, "src", "index.ts"), skillCode);

      // Write test file
      const testCode = `
import { test, expect } from "vitest";
import { TestedSkill } from "./index";

test("should add numbers correctly", () => {
  const skill = new TestedSkill();
  expect(skill.add(2, 3)).toBe(5);
});
`;
      fs.mkdirSync(path.join(skillPath, "tests"), { recursive: true });
      fs.writeFileSync(path.join(skillPath, "tests", "index.test.ts"), testCode);

      // Run tests
      const { skillTestCommand } = await import("../../src/commands/skill-test.js");
      const testResult = await skillTestCommand({ skill: "tested-skill" });

      // Verify tests passed
      expect(testResult).toContain("pass" || "✓");

      // Publish - should require tests to pass
      const { skillPublishCommand } = await import("../../src/commands/skill-publish.js");

      vi.mocked(inquirer.default.prompt).mockResolvedValueOnce({
        version: "1.0.0",
        releaseNotes: "Initial tested release",
        tags: ["tested", "quality"],
        confirm: true,
      });

      const publishResult = await skillPublishCommand({ skill: "tested-skill" });

      // Verify publish succeeded after tests passed
      expect(publishResult).toContain("published" || "success");
    });
  });
});
