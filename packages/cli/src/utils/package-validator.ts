/**
 * Package Validator
 * Validates agents and skills before publishing to marketplace
 */

import fs from "fs/promises";
import path from "path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
  metadata?: {
    name: string;
    version: string;
    description: string;
    author?: string;
    license?: string;
    [key: string]: any;
  };
}

/**
 * Validate a package (agent or skill) before publishing
 */
export async function validatePackage(
  packagePath: string,
  type: "agent" | "skill"
): Promise<ValidationResult> {
  const errors: string[] = [];
  const warnings: string[] = [];
  let metadata: any = {};

  try {
    // 1. Check for package manifest
    const manifestPath = path.join(
      packagePath,
      type === "skill" ? "skill.json" : "agent.json"
    );

    try {
      const manifestContent = await fs.readFile(manifestPath, "utf-8");
      metadata = JSON.parse(manifestContent);
    } catch (error) {
      errors.push(
        `Missing or invalid ${type === "skill" ? "skill.json" : "agent.json"}`
      );
      return { valid: false, errors, warnings };
    }

    // 2. Validate required fields
    const requiredFields = ["name", "version", "description"];
    for (const field of requiredFields) {
      if (!metadata[field]) {
        errors.push(`Missing required field: ${field}`);
      }
    }

    // 3. Validate version format (semver)
    if (metadata.version && !/^\d+\.\d+\.\d+$/.test(metadata.version)) {
      errors.push("Version must follow semantic versioning (e.g., 1.0.0)");
    }

    // 4. Check for README
    try {
      await fs.access(path.join(packagePath, "README.md"));
    } catch {
      warnings.push("No README.md found - consider adding documentation");
    }

    // 5. Check for LICENSE
    try {
      await fs.access(path.join(packagePath, "LICENSE"));
    } catch {
      warnings.push("No LICENSE file found");
    }

    // 6. Type-specific validation
    if (type === "skill") {
      await validateSkill(packagePath, metadata, errors, warnings);
    } else {
      await validateAgent(packagePath, metadata, errors, warnings);
    }

    // 7. Check package size
    const size = await getDirectorySize(packagePath);
    const maxSize = 50 * 1024 * 1024; // 50MB
    if (size > maxSize) {
      errors.push(`Package size (${formatBytes(size)}) exceeds limit (50MB)`);
    } else if (size > 25 * 1024 * 1024) {
      warnings.push(
        `Package is large (${formatBytes(size)}) - consider optimizing`
      );
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
      metadata,
    };
  } catch (error) {
    errors.push(
      `Validation error: ${error instanceof Error ? error.message : "Unknown error"}`
    );
    return { valid: false, errors, warnings };
  }
}

/**
 * Validate skill-specific requirements
 */
async function validateSkill(
  packagePath: string,
  metadata: any,
  errors: string[],
  warnings: string[]
): Promise<void> {
  // Check for index.ts or index.js
  const hasIndex =
    (await fileExists(path.join(packagePath, "index.ts"))) ||
    (await fileExists(path.join(packagePath, "index.js")));

  if (!hasIndex) {
    errors.push("Skills must have an index.ts or index.js entry point");
  }

  // Check for package.json
  if (!(await fileExists(path.join(packagePath, "package.json")))) {
    errors.push("Skills must have a package.json");
  }

  // Check for tests
  const hasTests =
    (await fileExists(path.join(packagePath, "test"))) ||
    (await fileExists(path.join(packagePath, "tests"))) ||
    (await fileExists(path.join(packagePath, "__tests__")));

  if (!hasTests) {
    warnings.push("No tests found - consider adding tests");
  }

  // Validate permissions if specified
  if (metadata.permissions) {
    if (!Array.isArray(metadata.permissions)) {
      errors.push("permissions must be an array");
    } else {
      const validPermissions = [
        "network",
        "filesystem",
        "environment",
        "process",
      ];
      const invalidPerms = metadata.permissions.filter(
        (p: string) => !validPermissions.includes(p)
      );
      if (invalidPerms.length > 0) {
        errors.push(`Invalid permissions: ${invalidPerms.join(", ")}`);
      }
    }
  }
}

/**
 * Validate agent-specific requirements
 */
async function validateAgent(
  packagePath: string,
  metadata: any,
  errors: string[],
  warnings: string[]
): Promise<void> {
  // Check for required agent fields
  if (!metadata.systemPrompt && !metadata.prompt) {
    errors.push("Agent must have a systemPrompt or prompt field");
  }

  if (!metadata.model) {
    errors.push("Agent must specify a model");
  }

  // Validate model format
  const validProviders = ["anthropic", "openai", "google", "ollama"];
  if (metadata.provider && !validProviders.includes(metadata.provider)) {
    warnings.push(
      `Unknown provider: ${metadata.provider}. Supported: ${validProviders.join(", ")}`
    );
  }

  // Check for skills configuration
  if (metadata.skills && !Array.isArray(metadata.skills)) {
    errors.push("skills must be an array");
  }

  // Check for example conversations
  if (!(await fileExists(path.join(packagePath, "examples")))) {
    warnings.push("No examples directory - consider adding example conversations");
  }
}

/**
 * Check if a file exists
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get total size of a directory
 */
async function getDirectorySize(dirPath: string): Promise<number> {
  let totalSize = 0;

  async function traverse(currentPath: string) {
    const entries = await fs.readdir(currentPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry.name);

      // Skip node_modules and common ignored directories
      if (
        entry.name === "node_modules" ||
        entry.name === ".git" ||
        entry.name === "dist" ||
        entry.name === ".next"
      ) {
        continue;
      }

      if (entry.isDirectory()) {
        await traverse(fullPath);
      } else {
        const stats = await fs.stat(fullPath);
        totalSize += stats.size;
      }
    }
  }

  await traverse(dirPath);
  return totalSize;
}

/**
 * Format bytes to human-readable string
 */
function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}
