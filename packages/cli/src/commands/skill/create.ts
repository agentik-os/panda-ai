/**
 * CLI Command: panda skill create
 * Step-128: Create a new skill from templates
 *
 * Interactive wizard that scaffolds a complete skill project
 * with SkillBase implementation, manifest, tests, and README.
 */

import chalk from "chalk";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join, resolve } from "path";

// ============================================================================
// Types
// ============================================================================

export interface CreateSkillOptions {
  name?: string;
  description?: string;
  author?: string;
  permissions?: string;
  tags?: string;
  outputDir?: string;
  yes?: boolean;
}

interface SkillConfig {
  id: string;
  name: string;
  className: string;
  description: string;
  author: string;
  permissions: string[];
  tags: string[];
  outputDir: string;
}

// ============================================================================
// Validation
// ============================================================================

const KEBAB_CASE_REGEX = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;

const PERMISSION_CATEGORIES = [
  "fs",
  "network",
  "system",
  "api",
  "ai",
  "kv",
  "env",
  "memory",
  "external",
];

function validateSkillName(name: string): string | null {
  if (!name || name.trim().length === 0) {
    return "Skill name cannot be empty";
  }
  if (name.length > 50) {
    return "Skill name must be 50 characters or less";
  }
  if (!KEBAB_CASE_REGEX.test(name)) {
    return "Skill name must be kebab-case (e.g., my-skill, web-search)";
  }
  return null;
}

function validatePermission(perm: string): boolean {
  const parts = perm.split(":");
  const category = parts[0];
  return parts.length >= 2 && category !== undefined && PERMISSION_CATEGORIES.includes(category);
}

function toClassName(kebabName: string): string {
  return kebabName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join("")
    .concat("Skill");
}

function toTitleCase(kebabName: string): string {
  return kebabName
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

// ============================================================================
// Templates
// ============================================================================

function generateSkillTs(config: SkillConfig): string {
  const permissionsStr =
    config.permissions.length > 0
      ? `\n  readonly permissions = ${JSON.stringify(config.permissions)};`
      : "";
  const tagsStr =
    config.tags.length > 0
      ? `\n  readonly tags = ${JSON.stringify(config.tags)};`
      : "";

  return `/**
 * ${config.name}
 * ${config.description}
 */

import { SkillBase, type SkillInput, type SkillOutput } from "@agentik-os/sdk";

// ============================================================================
// Types
// ============================================================================

export interface ${config.className}Input extends SkillInput {
  /** Primary input for the skill */
  query: string;
  /** Optional configuration overrides */
  options?: Record<string, unknown>;
}

export interface ${config.className}Output extends SkillOutput {
  /** Result data from skill execution */
  data: unknown;
  /** Execution time in milliseconds */
  executionTime: number;
}

// ============================================================================
// Skill Implementation
// ============================================================================

export class ${config.className} extends SkillBase<${config.className}Input, ${config.className}Output> {
  readonly id = "${config.id}";
  readonly name = "${config.name}";
  readonly description = "${config.description}";
  readonly version = "1.0.0";
  readonly author = "${config.author}";${permissionsStr}${tagsStr}

  async execute(input: ${config.className}Input): Promise<${config.className}Output> {
    const startTime = Date.now();

    this.log("info", \`Executing ${config.name}\`, { query: input.query });

    // Validate input
    if (!input.query || input.query.trim().length === 0) {
      return {
        success: false,
        error: "Query is required",
        data: null,
        executionTime: Date.now() - startTime,
      };
    }

    try {
      // TODO: Implement your skill logic here
      const result = await this.process(input.query, input.options);

      this.log("info", \`${config.name} completed\`, {
        executionTime: Date.now() - startTime,
      });

      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.log("error", \`${config.name} failed: \${message}\`);

      return {
        success: false,
        error: message,
        data: null,
        executionTime: Date.now() - startTime,
      };
    }
  }

  /**
   * Core processing logic - implement your skill here
   */
  private async process(
    query: string,
    _options?: Record<string, unknown>
  ): Promise<unknown> {
    // TODO: Replace with actual implementation
    return { query, message: "Skill not yet implemented" };
  }
}

// ============================================================================
// Convenience Exports
// ============================================================================

/**
 * Execute ${config.name} with a simple function call
 */
export async function execute(
  query: string,
  options?: Record<string, unknown>
): Promise<unknown> {
  const skill = new ${config.className}();
  const result = await skill.execute({ query, ...options });
  if (!result.success) {
    throw new Error(result.error || "Skill execution failed");
  }
  return result.data;
}

export default ${config.className};
`;
}

function generateSkillJson(config: SkillConfig): string {
  return JSON.stringify(
    {
      id: config.id,
      name: config.name,
      version: "1.0.0",
      description: config.description,
      author: config.author,
      type: "community",
      permissions: config.permissions,
      tags: config.tags,
      config: {},
      dependencies: {},
    },
    null,
    2
  );
}

function generateTestTs(config: SkillConfig): string {
  return `/**
 * Tests for ${config.name}
 */

import { describe, it, expect } from "vitest";
import { ${config.className} } from "./index.js";

describe("${config.className}", () => {
  const skill = new ${config.className}();

  describe("metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("${config.id}");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("${config.name}");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should return metadata via getMetadata()", () => {
      const meta = skill.getMetadata();
      expect(meta.id).toBe("${config.id}");
      expect(meta.name).toBe("${config.name}");
    });
  });

  describe("execute", () => {
    it("should return error for empty query", async () => {
      const result = await skill.execute({ query: "" });
      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it("should return error for whitespace-only query", async () => {
      const result = await skill.execute({ query: "   " });
      expect(result.success).toBe(false);
    });

    it("should execute successfully with valid input", async () => {
      const result = await skill.execute({ query: "test query" });
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });

    it("should track execution time", async () => {
      const result = await skill.execute({ query: "test" });
      expect(typeof result.executionTime).toBe("number");
      expect(result.executionTime).toBeGreaterThanOrEqual(0);
    });
  });
});
`;
}

function generateReadme(config: SkillConfig): string {
  return `# ${config.name}

${config.description}

## Installation

\`\`\`bash
panda skill install ${config.id}
\`\`\`

## Usage

### As a skill in an agent

Add \`${config.id}\` to your agent's skills list, then the agent can use it automatically.

### Programmatic usage

\`\`\`typescript
import { ${config.className} } from "./${config.id}";

const skill = new ${config.className}();
const result = await skill.execute({
  query: "your input here",
});

if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
\`\`\`

### Convenience function

\`\`\`typescript
import { execute } from "./${config.id}";

const data = await execute("your input here");
\`\`\`

## Configuration

Edit \`skill.json\` to customize:

| Field | Type | Description |
|-------|------|-------------|
| permissions | string[] | Required runtime permissions |
| config | object | Default configuration values |

## Permissions

${
  config.permissions.length > 0
    ? config.permissions.map((p) => `- \`${p}\``).join("\n")
    : "No special permissions required."
}

## Development

\`\`\`bash
# Run tests
pnpm test

# Start dev mode with hot-reload
panda dev

# Publish to marketplace
panda publish
\`\`\`

## License

MIT
`;
}

function generatePackageJson(config: SkillConfig): string {
  return JSON.stringify(
    {
      name: `@agentik-os/skill-${config.id}`,
      version: "1.0.0",
      description: config.description,
      type: "module",
      main: "index.ts",
      scripts: {
        test: "vitest run",
        "test:watch": "vitest",
        "type-check": "tsc --noEmit",
      },
      dependencies: {
        "@agentik-os/sdk": "workspace:*",
      },
      devDependencies: {
        vitest: "^3.1.3",
        typescript: "^5.7.2",
      },
    },
    null,
    2
  );
}

function generateTsConfig(): string {
  return JSON.stringify(
    {
      extends: "../../packages/tsconfig/node.json",
      compilerOptions: {
        outDir: "./dist",
        rootDir: ".",
      },
      include: ["."],
      exclude: ["node_modules", "dist"],
    },
    null,
    2
  );
}

// ============================================================================
// Main Command
// ============================================================================

export async function createSkillCommand(
  nameArg?: string,
  options: CreateSkillOptions = {}
): Promise<void> {
  console.log(chalk.cyan("\n🔧 Create a New Skill\n"));

  // Resolve skill name
  const skillId = nameArg || options.name;

  if (!skillId) {
    console.error(
      chalk.red("Error: Skill name is required.")
    );
    console.log(chalk.dim("Usage: panda skill create <name>"));
    console.log(chalk.dim('Example: panda skill create my-awesome-skill'));
    process.exit(1);
  }

  // Validate name
  const nameError = validateSkillName(skillId);
  if (nameError) {
    console.error(chalk.red(`Error: ${nameError}`));
    process.exit(1);
  }

  // Build config
  const config: SkillConfig = {
    id: skillId,
    name: toTitleCase(skillId),
    className: toClassName(skillId),
    description:
      options.description || `${toTitleCase(skillId)} skill for Agentik OS`,
    author: options.author || "Agentik OS Community",
    permissions: options.permissions
      ? options.permissions
          .split(",")
          .map((p) => p.trim())
          .filter((p) => {
            if (!validatePermission(p)) {
              console.warn(
                chalk.yellow(`Warning: Skipping invalid permission '${p}'`)
              );
              return false;
            }
            return true;
          })
      : [],
    tags: options.tags
      ? options.tags
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      : [],
    outputDir: options.outputDir
      ? resolve(options.outputDir)
      : resolve(process.cwd(), "skills", skillId),
  };

  // Check if directory already exists
  if (existsSync(config.outputDir)) {
    console.error(
      chalk.red(`Error: Directory already exists: ${config.outputDir}`)
    );
    console.log(chalk.dim("Choose a different name or remove the directory."));
    process.exit(1);
  }

  // Show plan
  console.log(chalk.bold("Skill Configuration:"));
  console.log(`  ${chalk.dim("ID:")}          ${config.id}`);
  console.log(`  ${chalk.dim("Name:")}        ${config.name}`);
  console.log(`  ${chalk.dim("Class:")}       ${config.className}`);
  console.log(`  ${chalk.dim("Description:")} ${config.description}`);
  console.log(`  ${chalk.dim("Author:")}      ${config.author}`);
  console.log(
    `  ${chalk.dim("Permissions:")} ${config.permissions.length > 0 ? config.permissions.join(", ") : "none"}`
  );
  console.log(
    `  ${chalk.dim("Tags:")}        ${config.tags.length > 0 ? config.tags.join(", ") : "none"}`
  );
  console.log(`  ${chalk.dim("Output:")}      ${config.outputDir}`);
  console.log("");

  // Create directory structure
  console.log(chalk.dim("Creating skill files..."));

  mkdirSync(config.outputDir, { recursive: true });

  // Generate and write files
  const files: Array<{ name: string; content: string }> = [
    { name: "index.ts", content: generateSkillTs(config) },
    { name: "index.test.ts", content: generateTestTs(config) },
    { name: "skill.json", content: generateSkillJson(config) },
    { name: "README.md", content: generateReadme(config) },
    { name: "package.json", content: generatePackageJson(config) },
    { name: "tsconfig.json", content: generateTsConfig() },
  ];

  for (const file of files) {
    const filePath = join(config.outputDir, file.name);
    writeFileSync(filePath, file.content, "utf-8");
    console.log(`  ${chalk.green("✓")} ${file.name}`);
  }

  // Success message
  console.log(
    chalk.green(`\n✅ Skill "${config.name}" created successfully!\n`)
  );

  console.log(chalk.bold("Next Steps:"));
  console.log(`  ${chalk.cyan("1.")} cd ${config.outputDir}`);
  console.log(`  ${chalk.cyan("2.")} Edit ${chalk.bold("index.ts")} to implement your skill logic`);
  console.log(`  ${chalk.cyan("3.")} Run ${chalk.bold("pnpm test")} to verify tests pass`);
  console.log(`  ${chalk.cyan("4.")} Run ${chalk.bold("panda dev")} for hot-reload development`);
  console.log(`  ${chalk.cyan("5.")} Run ${chalk.bold("panda publish")} to share on the marketplace`);
  console.log("");
  console.log(
    chalk.dim("Documentation: https://docs.agentik-os.com/skills/create")
  );
  console.log("");
}
