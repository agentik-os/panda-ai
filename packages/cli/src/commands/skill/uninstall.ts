/**
 * Skill Uninstall Command
 * Step-065: Implement Skill Installation Flow
 */

import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { SkillInstaller } from "@agentik-os/runtime";
import type { Skill } from "@agentik-os/shared";

export interface UninstallSkillOptions {
  force?: boolean;
}

/**
 * Uninstall a skill
 *
 * Usage:
 *   panda skill uninstall web-search        # Interactive confirmation
 *   panda skill uninstall web-search --force # Skip confirmation
 */
export async function uninstallSkillCommand(
  skillName: string,
  options: UninstallSkillOptions = {}
): Promise<void> {
  const installer = new SkillInstaller();

  try {
    // Step 1: Verify skill exists and is installed
    const skill = await installer.getSkill(skillName);
    const installedSkills = await installer.listInstalled();
    const isInstalled = installedSkills.some((s: Skill) => s.id === skillName);

    if (!isInstalled) {
      console.error(chalk.red(`Error: Skill '${skillName}' is not installed`));
      console.log(chalk.dim("\nInstalled skills:"));
      installedSkills.forEach((s: Skill) => {
        console.log(chalk.dim(`  - ${s.id}`));
      });
      process.exit(1);
    }

    // Step 2: Check which agents are using this skill
    const agentsUsingSkill = await installer.getAgentsUsingSkill(skillName);

    // Step 3: Show warning if skill is in use
    if (agentsUsingSkill.length > 0) {
      console.log(chalk.yellow(`\n⚠️  Warning: This skill is used by ${agentsUsingSkill.length} agent(s):`));
      agentsUsingSkill.forEach((agentId: string) => {
        console.log(chalk.dim(`  - ${agentId}`));
      });
      console.log(chalk.dim("\nUninstalling will remove it from all agents."));
    }

    // Step 4: Confirm uninstallation
    if (!options.force) {
      const message = agentsUsingSkill.length > 0
        ? `Remove ${skill.name} from all agents and uninstall?`
        : `Uninstall ${skill.name}?`;

      const { confirm } = await inquirer.prompt([
        {
          type: "confirm",
          name: "confirm",
          message,
          default: false
        }
      ]);

      if (!confirm) {
        console.log(chalk.yellow("Uninstallation cancelled"));
        return;
      }
    }

    // Step 5: Remove from all agents
    if (agentsUsingSkill.length > 0) {
      const spinner = ora(`Removing from ${agentsUsingSkill.length} agent(s)...`).start();

      for (const agentId of agentsUsingSkill) {
        await installer.removeFromAgent(skillName, agentId);
      }

      spinner.succeed(`Removed from ${agentsUsingSkill.length} agent(s)`);
    }

    // Step 6: Uninstall skill
    const spinner = ora("Uninstalling skill...").start();

    await installer.uninstall(skillName);

    spinner.succeed(`Uninstalled ${skill.name}`);

    console.log(chalk.dim("\nYou can reinstall it anytime with:"));
    console.log(chalk.dim(`  panda skill install ${skillName}`));

  } catch (error) {
    if (error instanceof Error) {
      console.error(chalk.red("Error uninstalling skill:"), error.message);
      process.exit(1);
    }
    throw error;
  }
}
