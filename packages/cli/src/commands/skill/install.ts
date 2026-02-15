/**
 * Skill Installation Command
 * Step-065: Implement Skill Installation Flow
 */

import inquirer from "inquirer";
import chalk from "chalk";
import ora from "ora";
import { SkillInstaller } from "@agentik-os/runtime";
import type { Skill } from "@agentik-os/shared";
import { loadAgents } from "../agent/create.js";

export interface InstallSkillOptions {
  agent?: string;
  allAgents?: boolean;
  yes?: boolean;
}

/**
 * Install a skill via interactive wizard or direct command
 *
 * Usage:
 *   panda skill install                    # Interactive mode
 *   panda skill install web-search         # Direct mode
 *   panda skill install web-search --agent "My Agent"
 *   panda skill install web-search --all-agents
 *   panda skill install web-search --yes   # Skip confirmations
 */
export async function installSkillCommand(
  skillName?: string,
  options: InstallSkillOptions = {}
): Promise<void> {
  const installer = new SkillInstaller();

  // Step 1: Get skill to install
  let skill: Skill;

  if (skillName) {
    // Direct mode: install specified skill
    try {
      skill = await installer.getSkill(skillName);
    } catch (error) {
      console.error(chalk.red(`Error: Skill '${skillName}' not found`));
      console.log(chalk.dim("\nAvailable skills:"));
      const available = await installer.listAvailable();
      available.forEach((s: Skill) => {
        console.log(chalk.dim(`  - ${s.id}`));
      });
      process.exit(1);
    }
  } else {
    // Interactive mode: show list of available skills
    const available = await installer.listAvailable();

    if (available.length === 0) {
      console.log(chalk.yellow("No skills available to install"));
      return;
    }

    const { selectedSkill } = await inquirer.prompt([
      {
        type: "list",
        name: "selectedSkill",
        message: "Which skill would you like to install?",
        choices: available.map((s: Skill) => ({
          name: `${s.name} - ${s.description}`,
          value: s.id
        })),
        pageSize: 10
      }
    ]);

    skill = await installer.getSkill(selectedSkill);
  }

  // Step 2: Show skill details and permissions
  console.log(chalk.cyan(`\n📦 ${skill.name} v${skill.version}`));
  console.log(`   ${skill.description}`);
  console.log(chalk.dim(`   Author: ${skill.author}`));

  console.log(chalk.bold("\n   Permissions Required:"));
  if (skill.permissions.length === 0) {
    console.log(chalk.dim("   (none)"));
  } else {
    skill.permissions.forEach((perm: string) => {
      console.log(`   - ${perm}`);
    });
  }

  // Step 3: Confirm installation
  if (!options.yes) {
    const { confirm } = await inquirer.prompt([
      {
        type: "confirm",
        name: "confirm",
        message: "Install this skill?",
        default: true
      }
    ]);

    if (!confirm) {
      console.log(chalk.yellow("Installation cancelled"));
      return;
    }
  }

  // Step 4: Install skill
  const spinner = ora("Installing skill...").start();

  try {
    await installer.install(skill.id);
    spinner.succeed(`Installed ${skill.name} v${skill.version}`);
  } catch (error) {
    if (error instanceof Error) {
      spinner.fail("Installation failed");
      console.error(chalk.red(error.message));
      process.exit(1);
    }
    throw error;
  }

  // Step 5: Add to agents
  if (!options.agent && !options.allAgents) {
    // Interactive: ask which agents
    const agentsData = await loadAgents();

    if (agentsData.agents.length === 0) {
      console.log(chalk.dim("\nNo agents found. Create one with:"));
      console.log(chalk.dim("  panda agent create"));
      return;
    }

    const { selectedAgents } = await inquirer.prompt([
      {
        type: "checkbox",
        name: "selectedAgents",
        message: "Add to which agents?",
        choices: agentsData.agents.map(a => ({
          name: a.name,
          value: a.id
        })),
        pageSize: 10
      }
    ]);

    if (selectedAgents.length === 0) {
      console.log(chalk.dim("\nSkipped adding to agents"));
      return;
    }

    // Add to selected agents
    for (const agentId of selectedAgents) {
      await installer.addToAgent(skill.id, agentId);
    }

    console.log(chalk.green(`✅ Added ${skill.name} to ${selectedAgents.length} agent(s)`));

  } else if (options.allAgents) {
    // Add to all agents
    const agentsData = await loadAgents();

    if (agentsData.agents.length === 0) {
      console.log(chalk.dim("\nNo agents found. Skill installed but not added to any agents."));
      return;
    }

    for (const agent of agentsData.agents) {
      await installer.addToAgent(skill.id, agent.id);
    }

    console.log(chalk.green(`✅ Added ${skill.name} to all ${agentsData.agents.length} agent(s)`));

  } else if (options.agent) {
    // Add to specific agent
    try {
      await installer.addToAgent(skill.id, options.agent);
      console.log(chalk.green(`✅ Added ${skill.name} to agent`));
    } catch (error) {
      if (error instanceof Error) {
        console.error(chalk.red(`Error adding skill to agent: ${error.message}`));
        process.exit(1);
      }
      throw error;
    }
  }
}
