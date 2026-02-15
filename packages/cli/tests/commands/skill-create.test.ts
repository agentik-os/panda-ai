import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { createSkillCommand } from "../../src/commands/skill/create";
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";

// Mock dependencies
vi.mock("chalk", () => ({
  default: {
    cyan: Object.assign((str: string) => str, {
      bold: (str: string) => str,
    }),
    green: (str: string) => str,
    yellow: (str: string) => str,
    red: (str: string) => str,
    dim: (str: string) => str,
    bold: (str: string) => str,
  },
}));

vi.mock("fs", () => ({
  readFileSync: vi.fn(),
  writeFileSync: vi.fn(),
  existsSync: vi.fn(),
  mkdirSync: vi.fn(),
}));

describe("Skill Create Command", () => {
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>;
  let processExitSpy: ReturnType<typeof vi.spyOn>;
  let processCwdSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    processExitSpy = vi.spyOn(process, "exit").mockImplementation(() => {
      throw new Error("process.exit called");
    });
    processCwdSpy = vi.spyOn(process, "cwd").mockReturnValue("/tmp/test-dir");

    (existsSync as any).mockReturnValue(false);
    (mkdirSync as any).mockImplementation(() => {});
    (writeFileSync as any).mockImplementation(() => {});

    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    processExitSpy.mockRestore();
    processCwdSpy.mockRestore();
  });

  describe("Skill Name Validation", () => {
    it("should reject empty skill name", async () => {
      await expect(createSkillCommand()).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skill name is required")
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should accept valid kebab-case names", async () => {
      await createSkillCommand("my-skill");
      expect((mkdirSync as any)).toHaveBeenCalled();
      expect((writeFileSync as any)).toHaveBeenCalledTimes(6); // 6 files generated
    });

    it("should reject names with uppercase letters", async () => {
      await expect(createSkillCommand("MySkill")).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("kebab-case")
      );
    });

    it("should reject names with underscores", async () => {
      await expect(createSkillCommand("my_skill")).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("kebab-case")
      );
    });

    it("should reject names starting with number", async () => {
      await expect(createSkillCommand("1-skill")).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("kebab-case")
      );
    });

    it("should reject names longer than 50 characters", async () => {
      const longName = "a".repeat(51);
      await expect(createSkillCommand(longName)).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("50 characters or less")
      );
    });

    it("should accept single-word names", async () => {
      await createSkillCommand("search");
      expect((mkdirSync as any)).toHaveBeenCalled();
    });

    it("should accept multi-word kebab-case names", async () => {
      await createSkillCommand("web-search-api");
      expect((mkdirSync as any)).toHaveBeenCalled();
    });
  });

  describe("Directory Creation", () => {
    it("should create skill directory if it doesn't exist", async () => {
      (existsSync as any).mockReturnValue(false);
      await createSkillCommand("test-skill");

      expect((mkdirSync as any)).toHaveBeenCalledWith(
        expect.stringContaining("skills/test-skill"),
        { recursive: true }
      );
    });

    it("should error if directory already exists", async () => {
      (existsSync as any).mockReturnValue(true);

      await expect(createSkillCommand("existing-skill")).rejects.toThrow("process.exit called");
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        expect.stringContaining("Directory already exists")
      );
      expect(processExitSpy).toHaveBeenCalledWith(1);
    });

    it("should use custom output directory when provided", async () => {
      await createSkillCommand("test-skill", { outputDir: "/custom/path" });

      expect((mkdirSync as any)).toHaveBeenCalledWith(
        expect.stringContaining("/custom/path"),
        { recursive: true }
      );
    });

    it("should default to cwd/skills/{name} when no output dir", async () => {
      processCwdSpy.mockReturnValue("/tmp/test-dir");
      await createSkillCommand("my-skill");

      expect((mkdirSync as any)).toHaveBeenCalledWith(
        expect.stringContaining("/tmp/test-dir/skills/my-skill"),
        { recursive: true }
      );
    });
  });

  describe("File Generation", () => {
    it("should generate all 6 required files", async () => {
      await createSkillCommand("test-skill");

      expect((writeFileSync as any)).toHaveBeenCalledTimes(6);

      const filenames = (writeFileSync as any).mock.calls.map((call: any) => {
        const path = call[0] as string;
        return path.split("/").pop();
      });

      expect(filenames).toContain("index.ts");
      expect(filenames).toContain("index.test.ts");
      expect(filenames).toContain("skill.json");
      expect(filenames).toContain("README.md");
      expect(filenames).toContain("package.json");
      expect(filenames).toContain("tsconfig.json");
    });

    it("should generate index.ts with correct class name", async () => {
      await createSkillCommand("web-search");

      const indexTsCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.ts")
      );
      expect(indexTsCall).toBeDefined();

      const content = indexTsCall[1];
      expect(content).toContain("class WebSearchSkill");
      expect(content).toContain('readonly id = "web-search"');
      expect(content).toContain('readonly name = "Web Search"');
    });

    it("should generate skill.json with correct metadata", async () => {
      await createSkillCommand("test-skill", {
        description: "My test skill",
        author: "Test Author",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      expect(skillJsonCall).toBeDefined();

      const content = JSON.parse(skillJsonCall[1]);
      expect(content.id).toBe("test-skill");
      expect(content.name).toBe("Test Skill");
      expect(content.description).toBe("My test skill");
      expect(content.author).toBe("Test Author");
      expect(content.version).toBe("1.0.0");
    });

    it("should generate package.json with correct dependencies", async () => {
      await createSkillCommand("test-skill");

      const packageJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("package.json")
      );
      expect(packageJsonCall).toBeDefined();

      const content = JSON.parse(packageJsonCall[1]);
      expect(content.name).toBe("@agentik-os/skill-test-skill");
      expect(content.dependencies).toHaveProperty("@agentik-os/sdk");
      expect(content.devDependencies).toHaveProperty("vitest");
      expect(content.scripts).toHaveProperty("test");
    });

    it("should generate README.md with skill details", async () => {
      await createSkillCommand("test-skill");

      const readmeCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("README.md")
      );
      expect(readmeCall).toBeDefined();

      const content = readmeCall[1];
      expect(content).toContain("# Test Skill");
      expect(content).toContain("panda skill install test-skill");
    });

    it("should generate test file with basic tests", async () => {
      await createSkillCommand("test-skill");

      const testCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.test.ts")
      );
      expect(testCall).toBeDefined();

      const content = testCall[1];
      expect(content).toContain("describe(\"TestSkillSkill\"");
      expect(content).toContain("should have correct id");
      expect(content).toContain("should execute successfully");
    });
  });

  describe("Options Handling", () => {
    it("should use default description if not provided", async () => {
      await createSkillCommand("test-skill");

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.description).toBe("Test Skill skill for Agentik OS");
    });

    it("should use custom description when provided", async () => {
      await createSkillCommand("test-skill", {
        description: "Custom description",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.description).toBe("Custom description");
    });

    it("should use default author if not provided", async () => {
      await createSkillCommand("test-skill");

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.author).toBe("Agentik OS Community");
    });

    it("should use custom author when provided", async () => {
      await createSkillCommand("test-skill", {
        author: "John Doe",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.author).toBe("John Doe");
    });
  });

  describe("Permissions Handling", () => {
    it("should parse permissions from comma-separated string", async () => {
      await createSkillCommand("test-skill", {
        permissions: "fs:read, network:http, api:openai",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.permissions).toEqual(["fs:read", "network:http", "api:openai"]);
    });

    it("should filter out invalid permissions", async () => {
      await createSkillCommand("test-skill", {
        permissions: "fs:read, invalid, network:http",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.permissions).toEqual(["fs:read", "network:http"]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("invalid permission 'invalid'")
      );
    });

    it("should accept valid permission categories", async () => {
      const validPermissions = "fs:read, network:http, system:exec, api:test, ai:model, kv:get, env:read, memory:access, external:call";
      await createSkillCommand("test-skill", {
        permissions: validPermissions,
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.permissions).toHaveLength(9);
    });

    it("should reject permissions without colon", async () => {
      await createSkillCommand("test-skill", {
        permissions: "fs, network:http",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.permissions).toEqual(["network:http"]);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining("invalid permission 'fs'")
      );
    });

    it("should include permissions in generated index.ts", async () => {
      await createSkillCommand("test-skill", {
        permissions: "fs:read, network:http",
      });

      const indexTsCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.ts")
      );
      const content = indexTsCall[1];
      expect(content).toContain('readonly permissions = ["fs:read","network:http"]');
    });

    it("should not include permissions field if empty", async () => {
      await createSkillCommand("test-skill");

      const indexTsCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.ts")
      );
      const content = indexTsCall[1];
      expect(content).not.toContain("readonly permissions =");
    });
  });

  describe("Tags Handling", () => {
    it("should parse tags from comma-separated string", async () => {
      await createSkillCommand("test-skill", {
        tags: "web, search, api",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.tags).toEqual(["web", "search", "api"]);
    });

    it("should trim whitespace from tags", async () => {
      await createSkillCommand("test-skill", {
        tags: " web , search  , api ",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.tags).toEqual(["web", "search", "api"]);
    });

    it("should filter out empty tags", async () => {
      await createSkillCommand("test-skill", {
        tags: "web,,search, ,api",
      });

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.tags).toEqual(["web", "search", "api"]);
    });

    it("should include tags in generated index.ts", async () => {
      await createSkillCommand("test-skill", {
        tags: "web, search",
      });

      const indexTsCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.ts")
      );
      const content = indexTsCall[1];
      expect(content).toContain('readonly tags = ["web","search"]');
    });

    it("should not include tags field if empty", async () => {
      await createSkillCommand("test-skill");

      const indexTsCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.ts")
      );
      const content = indexTsCall[1];
      expect(content).not.toContain("readonly tags =");
    });
  });

  describe("Name Conversion", () => {
    it("should convert kebab-case to Title Case", async () => {
      await createSkillCommand("web-search-api");

      const skillJsonCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("skill.json")
      );
      const content = JSON.parse(skillJsonCall[1]);
      expect(content.name).toBe("Web Search Api");
    });

    it("should convert kebab-case to ClassName", async () => {
      await createSkillCommand("web-search-api");

      const indexTsCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.ts")
      );
      const content = indexTsCall[1];
      expect(content).toContain("class WebSearchApiSkill");
    });

    it("should handle single-word names", async () => {
      await createSkillCommand("search");

      const indexTsCall = (writeFileSync as any).mock.calls.find(
        (call: any) => call[0].endsWith("index.ts")
      );
      const content = indexTsCall[1];
      expect(content).toContain("class SearchSkill");
    });
  });

  describe("Console Output", () => {
    it("should display skill configuration before creating", async () => {
      await createSkillCommand("test-skill");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skill Configuration:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("test-skill")
      );
    });

    it("should show success message after creation", async () => {
      await createSkillCommand("test-skill");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Skill \"Test Skill\" created successfully")
      );
    });

    it("should show next steps after creation", async () => {
      await createSkillCommand("test-skill");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Next Steps:")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda dev")
      );
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("panda publish")
      );
    });

    it("should show file creation progress", async () => {
      await createSkillCommand("test-skill");

      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining("Creating skill files")
      );
    });
  });
});
