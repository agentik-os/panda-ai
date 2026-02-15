/**
 * Mode Stacking - Run multiple OS Modes simultaneously
 * Step-088: Implement Mode Stacking
 */

import type { OSMode, ActiveModeStack } from "@agentik-os/shared";
import { SharedMemoryManager } from "./shared-memory";

export class ModeStacker {
  private activeStack: ActiveModeStack;
  private sharedMemory: SharedMemoryManager;
  private loadedModes: Map<string, OSMode>;

  constructor() {
    this.activeStack = {
      modes: [],
      sharedMemoryEnabled: true,
      crossModeAutomations: true,
    };
    this.sharedMemory = new SharedMemoryManager();
    this.loadedModes = new Map();
  }

  /**
   * Add a mode to the active stack
   */
  async addMode(mode: OSMode): Promise<void> {
    if (this.activeStack.modes.includes(mode.id)) {
      throw new Error(`Mode ${mode.id} is already in the stack`);
    }

    // Check for conflicts (e.g., same agent roles)
    this.checkModeConflicts(mode);

    // Load mode
    this.loadedModes.set(mode.id, mode);
    this.activeStack.modes.push(mode.id);

    // Register mode's memory categories in shared memory
    if (this.activeStack.sharedMemoryEnabled) {
      mode.memoryCategories.forEach((category) => {
        this.sharedMemory.registerCategory(category, mode.id);
      });
    }

    // Merge automations if cross-mode enabled
    if (this.activeStack.crossModeAutomations) {
      this.mergeAutomations(mode);
    }
  }

  /**
   * Remove a mode from the active stack
   */
  async removeMode(modeId: string): Promise<void> {
    const index = this.activeStack.modes.indexOf(modeId);
    if (index === -1) {
      throw new Error(`Mode ${modeId} is not in the stack`);
    }

    // Unregister memory categories
    const mode = this.loadedModes.get(modeId);
    if (mode && this.activeStack.sharedMemoryEnabled) {
      mode.memoryCategories.forEach((category) => {
        this.sharedMemory.unregisterCategory(category, modeId);
      });
    }

    // Remove from stack
    this.activeStack.modes.splice(index, 1);
    this.loadedModes.delete(modeId);
  }

  /**
   * Get all active modes
   */
  getActiveModes(): OSMode[] {
    return Array.from(this.loadedModes.values());
  }

  /**
   * Get all agents from active modes
   */
  getAllAgents(): Array<{ mode: string; agent: OSMode["agents"][0] }> {
    const agents: Array<{ mode: string; agent: OSMode["agents"][0] }> = [];

    for (const mode of this.loadedModes.values()) {
      for (const agent of mode.agents) {
        agents.push({ mode: mode.id, agent });
      }
    }

    return agents;
  }

  /**
   * Get all skills from active modes
   */
  getAllSkills(): Set<string> {
    const skills = new Set<string>();

    for (const mode of this.loadedModes.values()) {
      mode.skills.forEach((skill) => skills.add(skill));
    }

    return skills;
  }

  /**
   * Get all automations from active modes
   */
  getAllAutomations(): Array<{
    mode: string;
    automation: OSMode["automations"][0];
  }> {
    const automations: Array<{
      mode: string;
      automation: OSMode["automations"][0];
    }> = [];

    for (const mode of this.loadedModes.values()) {
      for (const automation of mode.automations) {
        automations.push({ mode: mode.id, automation });
      }
    }

    return automations;
  }

  /**
   * Get shared memory manager
   */
  getSharedMemory(): SharedMemoryManager {
    return this.sharedMemory;
  }

  /**
   * Enable/disable shared memory
   */
  setSharedMemoryEnabled(enabled: boolean): void {
    this.activeStack.sharedMemoryEnabled = enabled;
  }

  /**
   * Enable/disable cross-mode automations
   */
  setCrossModeAutomations(enabled: boolean): void {
    this.activeStack.crossModeAutomations = enabled;
  }

  /**
   * Get active stack configuration
   */
  getStackConfig(): ActiveModeStack {
    return { ...this.activeStack };
  }

  /**
   * Clear the entire stack
   */
  clearStack(): void {
    this.activeStack.modes = [];
    this.loadedModes.clear();
    this.sharedMemory.clear();
  }

  /**
   * Check for conflicts between modes
   */
  private checkModeConflicts(newMode: OSMode): void {
    const existingAgentRoles = new Set<string>();

    for (const mode of this.loadedModes.values()) {
      mode.agents.forEach((agent) => existingAgentRoles.add(agent.role));
    }

    for (const agent of newMode.agents) {
      if (existingAgentRoles.has(agent.role)) {
        throw new Error(
          `Agent role conflict: ${agent.role} already exists in stack. Consider using unique agent names or removing conflicting mode.`
        );
      }
    }
  }

  /**
   * Merge automations from new mode (placeholder for cross-mode automation logic)
   */
  private mergeAutomations(_mode: OSMode): void {
    // In a full implementation, this would handle:
    // - Detecting automation conflicts (same trigger, different actions)
    // - Chaining automations across modes
    // - Priority/ordering of automations
    // For now, we just track them via getAllAutomations()
  }

  /**
   * Find agent by role across all modes
   */
  findAgentByRole(
    role: string
  ): { mode: string; agent: OSMode["agents"][0] } | null {
    for (const mode of this.loadedModes.values()) {
      const agent = mode.agents.find((a) => a.role === role);
      if (agent) {
        return { mode: mode.id, agent };
      }
    }
    return null;
  }

  /**
   * Get modes that share a specific skill
   */
  getModesWithSkill(skillId: string): string[] {
    const modeIds: string[] = [];

    for (const mode of this.loadedModes.values()) {
      if (mode.skills.includes(skillId)) {
        modeIds.push(mode.id);
      }
    }

    return modeIds;
  }
}
