/**
 * CLI Command: panda dev
 * Step-129: Hot-reload development server for skills
 *
 * Watches skill files for changes, recompiles TypeScript,
 * and provides live feedback during development.
 */

import chalk from "chalk";
import { existsSync, readFileSync, watch, statSync } from "fs";
import { join, resolve, relative, extname } from "path";
import { execSync, spawn, type ChildProcess } from "child_process";

// ============================================================================
// Types
// ============================================================================

export interface DevOptions {
  port?: number;
  watch?: boolean;
  test?: boolean;
  verbose?: boolean;
}

interface SkillManifest {
  id: string;
  name: string;
  version: string;
  description: string;
}

// ============================================================================
// Dev Server
// ============================================================================

class SkillDevServer {
  private skillDir: string;
  private manifest: SkillManifest | null = null;
  private watchers: ReturnType<typeof watch>[] = [];
  private testProcess: ChildProcess | null = null;
  private compileCount = 0;
  private errorCount = 0;
  private startTime: number;
  private options: DevOptions;

  constructor(skillDir: string, options: DevOptions = {}) {
    this.skillDir = resolve(skillDir);
    this.startTime = Date.now();
    this.options = options;
  }

  async start(): Promise<void> {
    console.log(chalk.cyan("\n🔧 Agentik OS Skill Dev Server\n"));

    // Validate skill directory
    this.validateSkillDir();

    // Load manifest
    this.loadManifest();

    // Show skill info
    this.showSkillInfo();

    // Initial compile check
    await this.compile();

    // Start watching
    if (this.options.watch !== false) {
      this.startWatching();
    }

    // Start test watcher if enabled
    if (this.options.test) {
      this.startTestWatcher();
    }

    console.log(chalk.dim("\nPress Ctrl+C to stop the dev server.\n"));

    // Handle graceful shutdown
    process.on("SIGINT", () => this.stop());
    process.on("SIGTERM", () => this.stop());

    // Keep process alive
    await new Promise(() => {
      // Intentionally never resolves - dev server runs until killed
    });
  }

  private validateSkillDir(): void {
    if (!existsSync(this.skillDir)) {
      console.error(chalk.red(`Error: Directory not found: ${this.skillDir}`));
      process.exit(1);
    }

    const indexPath = join(this.skillDir, "index.ts");
    if (!existsSync(indexPath)) {
      console.error(
        chalk.red(`Error: No index.ts found in ${this.skillDir}`)
      );
      console.log(chalk.dim("Run 'panda skill create' to scaffold a skill."));
      process.exit(1);
    }
  }

  private loadManifest(): void {
    const manifestPath = join(this.skillDir, "skill.json");
    if (existsSync(manifestPath)) {
      try {
        const raw = readFileSync(manifestPath, "utf-8");
        this.manifest = JSON.parse(raw) as SkillManifest;
      } catch {
        console.warn(
          chalk.yellow("Warning: Could not parse skill.json, using defaults")
        );
      }
    }
  }

  private showSkillInfo(): void {
    if (this.manifest) {
      console.log(chalk.bold(`  Skill: ${this.manifest.name}`));
      console.log(chalk.dim(`  ID:    ${this.manifest.id}`));
      console.log(chalk.dim(`  Ver:   ${this.manifest.version}`));
    } else {
      console.log(chalk.bold(`  Directory: ${this.skillDir}`));
    }
    console.log(chalk.dim(`  Path:  ${this.skillDir}`));
    console.log("");
  }

  private async compile(): Promise<boolean> {
    const startTime = Date.now();
    this.compileCount++;

    try {
      // Check if tsconfig exists
      const hasTsConfig = existsSync(join(this.skillDir, "tsconfig.json"));
      const tscCmd = hasTsConfig ? "tsc --noEmit" : "tsc --noEmit --strict";

      if (this.options.verbose) {
        console.log(chalk.dim(`  Running: ${tscCmd}`));
      }

      execSync(tscCmd, {
        cwd: this.skillDir,
        stdio: "pipe",
        encoding: "utf-8",
      });

      const elapsed = Date.now() - startTime;
      console.log(
        chalk.green(`  ✓ Compiled successfully`) +
          chalk.dim(` (${elapsed}ms)`)
      );
      this.errorCount = 0;
      return true;
    } catch (error: unknown) {
      const elapsed = Date.now() - startTime;
      const err = error as { stdout?: string; stderr?: string };
      const output = err.stdout || err.stderr || "";

      // Parse TypeScript errors
      const errorLines = output
        .split("\n")
        .filter((line: string) => line.includes("error TS"));
      this.errorCount = errorLines.length;

      console.log(
        chalk.red(`  ✗ ${this.errorCount} TypeScript error(s)`) +
          chalk.dim(` (${elapsed}ms)`)
      );

      // Show first 5 errors
      for (const line of errorLines.slice(0, 5)) {
        const relPath = line.replace(this.skillDir + "/", "");
        console.log(chalk.red(`    ${relPath}`));
      }

      if (errorLines.length > 5) {
        console.log(
          chalk.dim(`    ... and ${errorLines.length - 5} more errors`)
        );
      }

      return false;
    }
  }

  private startWatching(): void {
    console.log(chalk.dim("  Watching for file changes..."));

    const watcher = watch(
      this.skillDir,
      { recursive: true },
      (eventType, filename) => {
        if (!filename) return;

        // Only watch TypeScript and JSON files
        const ext = extname(filename);
        if (![".ts", ".tsx", ".json"].includes(ext)) return;

        // Ignore node_modules and dist
        if (
          filename.includes("node_modules") ||
          filename.includes("dist")
        ) {
          return;
        }

        // Ignore test files for compile (they'll be handled by test watcher)
        const isTest = filename.includes(".test.") || filename.includes(".spec.");

        const relPath = relative(this.skillDir, join(this.skillDir, filename));
        const time = new Date().toLocaleTimeString();
        console.log(
          chalk.dim(`\n  [${time}] `) +
            chalk.yellow(`${eventType}: ${relPath}`)
        );

        // Recompile
        this.compile().then((success) => {
          if (success && this.options.test && !isTest) {
            // Run tests if compile succeeded and tests are enabled
            this.runTests();
          }
        });
      }
    );

    this.watchers.push(watcher);
  }

  private startTestWatcher(): void {
    console.log(chalk.dim("  Test watcher enabled (--test)"));
    this.runTests();
  }

  private runTests(): void {
    // Kill previous test process
    if (this.testProcess) {
      this.testProcess.kill();
      this.testProcess = null;
    }

    console.log(chalk.dim("  Running tests..."));

    this.testProcess = spawn("npx", ["vitest", "run", "--reporter=verbose"], {
      cwd: this.skillDir,
      stdio: "pipe",
    });

    let output = "";

    this.testProcess.stdout?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    this.testProcess.stderr?.on("data", (data: Buffer) => {
      output += data.toString();
    });

    this.testProcess.on("close", (code: number | null) => {
      if (code === 0) {
        // Extract test summary
        const summaryMatch = output.match(/Tests\s+(\d+)\s+passed/);
        const count = summaryMatch ? summaryMatch[1] : "?";
        console.log(chalk.green(`  ✓ Tests passed (${count} tests)`));
      } else {
        // Show failed test output
        const failedLines = output
          .split("\n")
          .filter(
            (line: string) =>
              line.includes("FAIL") ||
              line.includes("✗") ||
              line.includes("×") ||
              line.includes("AssertionError") ||
              line.includes("Error:")
          );

        console.log(chalk.red(`  ✗ Tests failed`));
        for (const line of failedLines.slice(0, 5)) {
          console.log(chalk.red(`    ${line.trim()}`));
        }
      }
      this.testProcess = null;
    });
  }

  stop(): void {
    console.log(chalk.dim("\n\nStopping dev server..."));

    // Close file watchers
    for (const watcher of this.watchers) {
      watcher.close();
    }

    // Kill test process
    if (this.testProcess) {
      this.testProcess.kill();
    }

    const elapsed = Math.round((Date.now() - this.startTime) / 1000);
    console.log(
      chalk.cyan(
        `\n📊 Session: ${this.compileCount} compiles, ${elapsed}s total\n`
      )
    );

    process.exit(0);
  }
}

// ============================================================================
// Main Command
// ============================================================================

export async function devCommand(
  skillPath?: string,
  options: DevOptions = {}
): Promise<void> {
  // Resolve skill directory
  let skillDir: string;

  if (skillPath) {
    skillDir = resolve(skillPath);
  } else {
    // Try current directory
    skillDir = process.cwd();

    // Check if we're in a skill directory (has skill.json or index.ts)
    const hasSkillJson = existsSync(join(skillDir, "skill.json"));
    const hasIndex = existsSync(join(skillDir, "index.ts"));

    if (!hasSkillJson && !hasIndex) {
      console.error(
        chalk.red("Error: Not in a skill directory.")
      );
      console.log(
        chalk.dim(
          "Run this command from a skill directory, or provide a path:"
        )
      );
      console.log(chalk.dim("  panda dev ./skills/my-skill"));
      process.exit(1);
    }
  }

  // Validate directory exists
  if (!existsSync(skillDir) || !statSync(skillDir).isDirectory()) {
    console.error(chalk.red(`Error: Not a valid directory: ${skillDir}`));
    process.exit(1);
  }

  const server = new SkillDevServer(skillDir, options);
  await server.start();
}
