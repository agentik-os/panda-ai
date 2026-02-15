/**
 * Skill Installer
 * Step-065: Implement Skill Installation Flow
 *
 * Dependencies:
 * - ✅ Step-060: WASM Sandbox (completed)
 * - ✅ Step-061: Permission System (completed)
 * - ✅ Step-062: Web Search Skill (completed)
 * - ✅ Step-063: File Operations Skill (completed)
 * - ✅ Step-064: Calendar Skill (completed)
 *
 * @packageDocumentation
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync } from "fs";
import { join } from "path";
import { homedir } from "os";
import type { Skill, SkillType } from "@agentik-os/shared";
import type { Agent } from "@agentik-os/shared";

// Storage paths (consistent with CLI agent storage)
const getDataDir = () => join(process.env.HOME || homedir(), ".agentik-os", "data");
const getSkillsFile = () => join(getDataDir(), "skills.json");
const getAgentsFile = () => join(getDataDir(), "agents.json");

interface SkillData {
  skills: Skill[];
}

interface AgentData {
  agents: Agent[];
}

/**
 * Skill Installer
 *
 * Manages skill discovery, installation, and assignment to agents.
 *
 * @example
 * ```typescript
 * const installer = new SkillInstaller();
 *
 * // List available skills
 * const available = await installer.listAvailable();
 *
 * // Install a skill
 * await installer.install("web-search");
 *
 * // Add to agent
 * await installer.addToAgent("web-search", "agent-123");
 * ```
 */
export class SkillInstaller {
  /**
   * List all available skills (built-in + marketplace + MCP)
   */
  async listAvailable(): Promise<Skill[]> {
    const skills: Skill[] = [];

    // 1. Built-in skills from registry
    skills.push(...BUILTIN_SKILLS);

    // 2. Scan skills directory for additional skills
    try {
      const skillsDir = join(process.cwd(), "skills");

      if (existsSync(skillsDir)) {
        const entries = readdirSync(skillsDir, { withFileTypes: true });

        for (const entry of entries) {
          if (entry.isDirectory()) {
            const skillJsonPath = join(skillsDir, entry.name, "skill.json");

            if (existsSync(skillJsonPath)) {
              try {
                const skillJson = JSON.parse(readFileSync(skillJsonPath, "utf-8"));

                // Check if already in built-in list
                const alreadyExists = skills.some(s => s.id === skillJson.id);

                if (!alreadyExists) {
                  const skill: Skill = {
                    ...skillJson,
                    path: join(skillsDir, entry.name),
                    createdAt: new Date(),
                    updatedAt: new Date(),
                  };

                  skills.push(skill);
                }
              } catch (err) {
                // Skip invalid skill.json files
                console.warn(`Warning: Invalid skill.json in ${entry.name}`);
              }
            }
          }
        }
      }
    } catch (err) {
      // Skills directory might not exist, that's okay
    }

    return skills;
  }

  /**
   * List all installed skills
   */
  async listInstalled(): Promise<Skill[]> {
    const data = this.loadSkillsData();
    return data.skills;
  }

  /**
   * Get a specific skill by ID
   */
  async getSkill(skillId: string): Promise<Skill> {
    const available = await this.listAvailable();
    const skill = available.find(s => s.id === skillId);

    if (!skill) {
      throw new Error(`Skill '${skillId}' not found`);
    }

    return skill;
  }

  /**
   * Install a skill
   *
   * @param skillId - Skill identifier
   */
  async install(skillId: string): Promise<void> {
    // 1. Verify skill exists in available skills
    const skill = await this.getSkill(skillId);

    // 2. Check if already installed
    const installed = await this.listInstalled();
    const alreadyInstalled = installed.some(s => s.id === skillId);

    if (alreadyInstalled) {
      throw new Error(`Skill '${skillId}' is already installed`);
    }

    // 3. Add installedAt timestamp
    const installedSkill: Skill = {
      ...skill,
      installedAt: new Date(),
    };

    // 4. Add to installed skills registry
    const data = this.loadSkillsData();
    data.skills.push(installedSkill);
    this.saveSkillsData(data);

    // Note: WASM loading and MCP registration handled by runtime when agent uses the skill
  }

  /**
   * Uninstall a skill
   *
   * @param skillId - Skill identifier
   */
  async uninstall(skillId: string): Promise<void> {
    // 1. Check if skill is installed
    const data = this.loadSkillsData();
    const skillIndex = data.skills.findIndex(s => s.id === skillId);

    if (skillIndex === -1) {
      throw new Error(`Skill '${skillId}' is not installed`);
    }

    // 2. Check if skill is used by any agents
    const agentsUsing = await this.getAgentsUsingSkill(skillId);

    if (agentsUsing.length > 0) {
      throw new Error(
        `Cannot uninstall '${skillId}': used by ${agentsUsing.length} agent(s). ` +
        `Remove from agents first.`
      );
    }

    // 3. Remove from installed skills registry
    data.skills.splice(skillIndex, 1);
    this.saveSkillsData(data);

    // Note: WASM cleanup and MCP unregistration handled by runtime
  }

  /**
   * Add skill to an agent
   *
   * @param skillId - Skill identifier
   * @param agentId - Agent identifier
   */
  async addToAgent(skillId: string, agentId: string): Promise<void> {
    // 1. Verify skill is installed
    const installed = await this.listInstalled();
    const skill = installed.find(s => s.id === skillId);

    if (!skill) {
      throw new Error(`Skill '${skillId}' is not installed. Install it first with 'panda skill install ${skillId}'`);
    }

    // 2. Load agents
    const agentData = this.loadAgentData();
    const agent = agentData.agents.find(a => a.id === agentId);

    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    // 3. Check if already added
    if (agent.skills && agent.skills.includes(skillId)) {
      // Already added, skip silently
      return;
    }

    // 4. Add skill ID to agent's skills array
    if (!agent.skills) {
      agent.skills = [];
    }

    agent.skills.push(skillId);

    // 5. Update agent in storage
    this.saveAgentData(agentData);
  }

  /**
   * Remove skill from an agent
   *
   * @param skillId - Skill identifier
   * @param agentId - Agent identifier
   */
  async removeFromAgent(skillId: string, agentId: string): Promise<void> {
    // 1. Load agents
    const agentData = this.loadAgentData();
    const agent = agentData.agents.find(a => a.id === agentId);

    if (!agent) {
      throw new Error(`Agent '${agentId}' not found`);
    }

    // 2. Remove skill ID from agent's skills array
    if (!agent.skills) {
      return; // No skills, nothing to remove
    }

    const skillIndex = agent.skills.indexOf(skillId);

    if (skillIndex === -1) {
      return; // Skill not in agent, nothing to remove
    }

    agent.skills.splice(skillIndex, 1);

    // 3. Update agent in storage
    this.saveAgentData(agentData);
  }

  /**
   * Get all agents using a specific skill
   *
   * @param skillId - Skill identifier
   * @returns Array of agent IDs
   */
  async getAgentsUsingSkill(skillId: string): Promise<string[]> {
    // 1. Load all agents
    const agentData = this.loadAgentData();

    // 2. Filter agents that have this skill ID in their skills array
    const agentsUsing = agentData.agents.filter(
      agent => agent.skills && agent.skills.includes(skillId)
    );

    // 3. Return agent IDs
    return agentsUsing.map(agent => agent.id);
  }

  /**
   * Load skills data from file
   * @private
   */
  private loadSkillsData(): SkillData {
    if (!existsSync(getSkillsFile())) {
      return { skills: [] };
    }

    try {
      const data = readFileSync(getSkillsFile(), "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.warn("Warning: Failed to load skills data, starting fresh");
      return { skills: [] };
    }
  }

  /**
   * Save skills data to file
   * @private
   */
  private saveSkillsData(data: SkillData): void {
    // Ensure data directory exists
    if (!existsSync(getDataDir())) {
      mkdirSync(getDataDir(), { recursive: true });
    }

    writeFileSync(getSkillsFile(), JSON.stringify(data, null, 2));
  }

  /**
   * Load agent data from file
   * @private
   */
  private loadAgentData(): AgentData {
    if (!existsSync(getAgentsFile())) {
      return { agents: [] };
    }

    try {
      const data = readFileSync(getAgentsFile(), "utf-8");
      return JSON.parse(data);
    } catch (error) {
      console.warn("Warning: Failed to load agents data");
      return { agents: [] };
    }
  }

  /**
   * Save agent data to file
   * @private
   */
  private saveAgentData(data: AgentData): void {
    // Ensure data directory exists
    if (!existsSync(getDataDir())) {
      mkdirSync(getDataDir(), { recursive: true });
    }

    writeFileSync(getAgentsFile(), JSON.stringify(data, null, 2));
  }
}

/**
 * Built-in skills registry
 */
export const BUILTIN_SKILLS: Skill[] = [
  // Step-062: Web Search Skill
  {
    id: "web-search",
    name: "Web Search",
    version: "1.0.0",
    description: "Search the web using Brave Search API",
    author: "Agentik OS",
    tags: ["web", "search", "internet"],
    entrypoint: "index.ts",
    permissions: ["network:http", "api:brave"],
    type: "builtin" as SkillType,
    path: join(process.cwd(), "skills", "web-search"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Step-063: File Operations Skill
  {
    id: "file-ops",
    name: "File Operations",
    version: "1.0.0",
    description: "Sandboxed file operations with permission-based access control. Read, write, list, and manage files within secure boundaries.",
    author: "Agentik OS",
    tags: ["filesystem", "files", "io", "storage"],
    entrypoint: "index.ts",
    permissions: [
      "fs:read:/data/*",
      "fs:write:/data/*",
      "fs:list:/data/*",
      "fs:delete:/data/*"
    ],
    type: "builtin" as SkillType,
    path: join(process.cwd(), "skills", "file-ops"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },

  // Step-064: Google Calendar Skill
  {
    id: "calendar",
    name: "Google Calendar",
    version: "1.0.0",
    description: "Manage Google Calendar events - create, list, update, and delete calendar events.",
    author: "Agentik OS",
    tags: ["calendar", "google", "scheduling", "events"],
    entrypoint: "index.ts",
    permissions: ["network:http", "api:google"],
    type: "builtin" as SkillType,
    path: join(process.cwd(), "skills", "calendar"),
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
