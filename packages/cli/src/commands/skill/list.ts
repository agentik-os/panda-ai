/**
 * Skill List Command
 * Step-065: Implement Skill Installation Flow
 */

import chalk from "chalk";
import { SkillInstaller } from "@agentik-os/runtime";
import type { Skill } from "@agentik-os/shared";

export interface ListSkillsOptions {
  detailed?: boolean;
  unused?: boolean;
}

/**
 * List all installed skills
 *
 * Usage:
 *   panda skill list                 # Summary view
 *   panda skill list --detailed      # Show full details
 *   panda skill list --unused        # Show skills not used by any agent
 */
export async function listSkillsCommand(
  options: ListSkillsOptions = {}
): Promise<void> {
  const installer = new SkillInstaller();

  try {
    const installedSkills = await installer.listInstalled();

    if (installedSkills.length === 0) {
      console.log(chalk.yellow("\nNo skills installed yet"));
      console.log(chalk.dim("\nInstall a skill with:"));
      console.log(chalk.dim("  panda skill install"));
      return;
    }

    // Get agent counts for each skill
    const agentCounts = new Map<string, number>();
    for (const skill of installedSkills) {
      const agents = await installer.getAgentsUsingSkill(skill.id);
      agentCounts.set(skill.id, agents.length);
    }

    // Filter if --unused flag
    let skills = installedSkills;
    if (options.unused) {
      skills = skills.filter((s: Skill) => agentCounts.get(s.id) === 0);

      if (skills.length === 0) {
        console.log(chalk.green("\n✅ All installed skills are in use!"));
        return;
      }
    }

    // Display header
    console.log(chalk.cyan(`\nInstalled Skills (${skills.length}):\n`));

    // Display each skill
    for (const skill of skills) {
      const agentCount = agentCounts.get(skill.id) || 0;

      console.log(chalk.bold(`  ${skill.name}`) + chalk.dim(` (v${skill.version})`));

      if (options.detailed) {
        console.log(`    Description: ${skill.description}`);
        console.log(chalk.dim(`    Author: ${skill.author}`));
        console.log(chalk.dim(`    Type: ${skill.type}`));

        if (skill.permissions.length > 0) {
          console.log(`    Permissions:`);
          skill.permissions.forEach((perm: string) => {
            console.log(chalk.dim(`      - ${perm}`));
          });
        }

        console.log(`    Used by: ${agentCount} agent(s)`);

        if (skill.installedAt) {
          const installedDate = new Date(skill.installedAt);
          console.log(chalk.dim(`    Installed: ${installedDate.toLocaleString()}`));
        }

        console.log(""); // Empty line between skills
      } else {
        // Summary view
        console.log(`    ${skill.description}`);

        // Permissions summary
        if (skill.permissions.length > 0) {
          const permSummary = skill.permissions.slice(0, 2).join(", ");
          const more = skill.permissions.length > 2 ? ` +${skill.permissions.length - 2} more` : "";
          console.log(chalk.dim(`    Permissions: ${permSummary}${more}`));
        }

        // Usage info
        const usageColor = agentCount > 0 ? chalk.green : chalk.dim;
        console.log(usageColor(`    Used by: ${agentCount} agent(s)`));

        console.log(""); // Empty line between skills
      }
    }

    // Footer with tips
    console.log(chalk.dim("Commands:"));
    console.log(chalk.dim("  panda skill install         # Install a new skill"));
    console.log(chalk.dim("  panda skill uninstall <id>  # Remove a skill"));
    console.log(chalk.dim("  panda skill list --detailed # Show full details"));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red("Error listing skills:"), error.message);
      process.exit(1);
    }
    throw error;
  }
}
