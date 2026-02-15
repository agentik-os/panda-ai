/**
 * OS Mode Loader - Load mode definitions from JSON files
 */

import type { OSMode } from "@agentik-os/shared";
import fs from "node:fs/promises";
import path from "node:path";

// Import all official mode JSON files
import humanOS from "./human-os.json";
import businessOS from "./business-os.json";
import devOS from "./dev-os.json";
import marketingOS from "./marketing-os.json";
import salesOS from "./sales-os.json";
import designOS from "./design-os.json";
import artOS from "./art-os.json";
import askOS from "./ask-os.json";
import financeOS from "./finance-os.json";
import learningOS from "./learning-os.json";

export class ModeLoader {
  private modes: Map<string, OSMode>;

  constructor() {
    this.modes = new Map();
    this.loadOfficialModes();
  }

  /**
   * Load official modes from imported JSON
   */
  private loadOfficialModes(): void {
    const officialModes = [
      humanOS,
      businessOS,
      devOS,
      marketingOS,
      salesOS,
      designOS,
      artOS,
      askOS,
      financeOS,
      learningOS,
    ];

    for (const modeData of officialModes) {
      const mode = this.parseMode(modeData);
      this.modes.set(mode.id, mode);
    }
  }

  /**
   * Parse mode data and convert dates
   */
  private parseMode(data: any): OSMode {
    return {
      ...data,
      createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
      updatedAt: data.updatedAt ? new Date(data.updatedAt) : new Date(),
    };
  }

  /**
   * Get a mode by ID
   */
  getMode(id: string): OSMode | null {
    return this.modes.get(id) || null;
  }

  /**
   * Get all modes
   */
  getAllModes(): OSMode[] {
    return Array.from(this.modes.values());
  }

  /**
   * Get official modes only
   */
  getOfficialModes(): OSMode[] {
    return this.getAllModes().filter((mode) => mode.type === "official");
  }

  /**
   * Get community modes only
   */
  getCommunityModes(): OSMode[] {
    return this.getAllModes().filter((mode) => mode.type === "community");
  }

  /**
   * Get custom modes only
   */
  getCustomModes(): OSMode[] {
    return this.getAllModes().filter((mode) => mode.type === "custom");
  }

  /**
   * Search modes by tag
   */
  searchByTag(tag: string): OSMode[] {
    return this.getAllModes().filter((mode) =>
      mode.tags.some((t) => t.toLowerCase().includes(tag.toLowerCase()))
    );
  }

  /**
   * Search modes by name or description
   */
  search(query: string): OSMode[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllModes().filter(
      (mode) =>
        mode.name.toLowerCase().includes(lowerQuery) ||
        mode.description.toLowerCase().includes(lowerQuery)
    );
  }

  /**
   * Load a custom mode from file path
   */
  async loadCustomMode(filePath: string): Promise<OSMode> {
    const content = await fs.readFile(filePath, "utf-8");
    const data = JSON.parse(content);
    const mode = this.parseMode(data);

    // Validate mode structure
    this.validateMode(mode);

    // Add to modes map
    this.modes.set(mode.id, mode);

    return mode;
  }

  /**
   * Load custom modes from a directory
   */
  async loadCustomModesFromDir(dirPath: string): Promise<OSMode[]> {
    const modes: OSMode[] = [];

    try {
      const files = await fs.readdir(dirPath);

      for (const file of files) {
        if (file.endsWith(".json")) {
          const filePath = path.join(dirPath, file);
          try {
            const mode = await this.loadCustomMode(filePath);
            modes.push(mode);
          } catch (error) {
            console.error(`Failed to load mode from ${file}:`, error);
          }
        }
      }
    } catch (error) {
      console.error(`Failed to read directory ${dirPath}:`, error);
    }

    return modes;
  }

  /**
   * Validate mode structure
   */
  private validateMode(mode: OSMode): void {
    if (!mode.id) throw new Error("Mode must have an id");
    if (!mode.name) throw new Error("Mode must have a name");
    if (!mode.type) throw new Error("Mode must have a type");
    if (!Array.isArray(mode.agents)) throw new Error("Mode must have agents array");
    if (!Array.isArray(mode.skills)) throw new Error("Mode must have skills array");
    if (!Array.isArray(mode.automations))
      throw new Error("Mode must have automations array");
    if (!Array.isArray(mode.dashboardWidgets))
      throw new Error("Mode must have dashboardWidgets array");
    if (!Array.isArray(mode.memoryCategories))
      throw new Error("Mode must have memoryCategories array");
  }

  /**
   * Register a mode programmatically
   */
  registerMode(mode: OSMode): void {
    this.validateMode(mode);
    this.modes.set(mode.id, mode);
  }

  /**
   * Unregister a mode
   */
  unregisterMode(id: string): boolean {
    return this.modes.delete(id);
  }

  /**
   * Check if mode exists
   */
  hasMode(id: string): boolean {
    return this.modes.has(id);
  }

  /**
   * Get mode count
   */
  getModeCount(): number {
    return this.modes.size;
  }

  /**
   * Get modes by author
   */
  getModesByAuthor(author: string): OSMode[] {
    return this.getAllModes().filter((mode) => mode.author === author);
  }
}

// Singleton instance
export const modeLoader = new ModeLoader();
