/**
 * Publish Command
 * Publishes agents or skills to the Agentik OS marketplace
 */

import { Command } from "commander";
import chalk from "chalk";
import ora from "ora";
import { validatePackage } from "../utils/package-validator";
import { uploadToMarketplace } from "../utils/uploader";
import { runSecurityScan } from "@agentik-os/runtime/src/security/semgrep";
import path from "path";
import fs from "fs/promises";

interface PublishOptions {
  type?: "agent" | "skill";
  skipSecurity?: boolean;
  dryRun?: boolean;
}

/**
 * Main publish logic (exported for testing)
 */
export async function publish(cwd: string, options: PublishOptions = {}): Promise<void> {
  const spinner = ora();

  try {

      // Step 1: Detect package type
      spinner.start("Detecting package type...");
      const type = await detectPackageType(cwd, options.type);
      spinner.succeed(`Package type: ${chalk.cyan(type)}`);

      // Step 2: Validate package
      spinner.start("Validating package...");
      const validation = await validatePackage(cwd, type);

      if (!validation.valid) {
        spinner.fail("Package validation failed:");
        validation.errors.forEach((error: string) => {
          console.log(chalk.red(`  ✗ ${error}`));
        });
        process.exit(1);
      }

      spinner.succeed("Package validation passed");
      validation.warnings?.forEach((warning: string) => {
        console.log(chalk.yellow(`  ⚠ ${warning}`));
      });

      // Step 3: Security scanning
      if (!options.skipSecurity) {
        spinner.start("Running security scan...");
        const securityResult = await runSecurityScan(cwd);

        if (securityResult.criticalIssues > 0) {
          spinner.fail(
            `Security scan found ${securityResult.criticalIssues} critical issue(s):`
          );
          securityResult.issues
            .filter((i: any) => i.severity === "critical")
            .forEach((issue: any) => {
              console.log(chalk.red(`  ✗ ${issue.message} (${issue.file})`));
            });
          process.exit(1);
        }

        if (securityResult.highIssues > 0) {
          spinner.warn(
            `Security scan found ${securityResult.highIssues} high severity issue(s)`
          );
          securityResult.issues
            .filter((i: any) => i.severity === "high")
            .forEach((issue: any) => {
              console.log(chalk.yellow(`  ⚠ ${issue.message} (${issue.file})`));
            });

          // Ask user to confirm
          const { confirm } = await import("@inquirer/prompts");
          const proceed = await confirm({
            message: "Continue publishing despite security warnings?",
            default: false,
          });

          if (!proceed) {
            console.log(chalk.gray("Publishing cancelled."));
            process.exit(0);
          }
        } else {
          spinner.succeed("Security scan passed");
        }
      } else {
        console.log(chalk.yellow("⚠ Security scan skipped (not recommended)"));
      }

      // Step 4: Dry run check
      if (options.dryRun) {
        spinner.succeed("Dry run completed successfully");
        console.log(
          chalk.green("\n✓ Package is ready to publish (use without --dry-run)")
        );
        return;
      }

      // Step 5: Upload to marketplace
      spinner.start("Uploading to marketplace...");
      const uploadResult = await uploadToMarketplace(cwd, type, validation.metadata);

      spinner.succeed(
        `Published successfully! Package ID: ${chalk.cyan(uploadResult.packageId)}`
      );

      console.log(chalk.green("\n✓ Your package is now live on the marketplace!"));
      console.log(
        chalk.gray(`  View at: https://marketplace.agentik-os.com/${type}s/${uploadResult.packageId}`)
      );
  } catch (error) {
    spinner.fail("Publishing failed");
    if (error instanceof Error) {
      console.error(chalk.red(`\nError: ${error.message}`));
    }
    process.exit(1);
  }
}

/**
 * Commander command wrapper
 */
export const publishCommand = new Command("publish")
  .description("Publish an agent or skill to the marketplace")
  .option("-t, --type <type>", "Type of package (agent or skill)")
  .option("--skip-security", "Skip security scanning (not recommended)")
  .option("--dry-run", "Validate without actually publishing")
  .action(async (options: PublishOptions) => {
    await publish(process.cwd(), options);
  });

/**
 * Detect package type from directory structure
 */
async function detectPackageType(
  cwd: string,
  providedType?: string
): Promise<"agent" | "skill"> {
  if (providedType) {
    if (providedType !== "agent" && providedType !== "skill") {
      throw new Error(`Invalid type: ${providedType}. Must be "agent" or "skill"`);
    }
    return providedType;
  }

  // Check for skill.json
  try {
    await fs.access(path.join(cwd, "skill.json"));
    return "skill";
  } catch {
    // Not a skill
  }

  // Check for agent.json
  try {
    await fs.access(path.join(cwd, "agent.json"));
    return "agent";
  } catch {
    // Not an agent
  }

  throw new Error(
    "Could not detect package type. Ensure skill.json or agent.json exists, or specify --type"
  );
}
