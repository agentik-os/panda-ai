/**
 * Notion Skill
 */

import { Client } from "@notionhq/client";
import { SkillBase } from "@agentik-os/sdk";
import * as databases from "./databases.js";
import * as pages from "./pages.js";

export interface NotionConfig extends Record<string, unknown> {
  token: string;
}

export interface NotionInput {
  action:
    | "listDatabases"
    | "getDatabase"
    | "queryDatabase"
    | "createPage"
    | "getPage"
    | "updatePage"
    | "archivePage"
    | "getPageBlocks"
    | "appendBlocks"
    | "search";
  params: {
    // Database params
    databaseId?: string;
    filter?: any;
    sorts?: any[];
    pageSize?: number;

    // Page params
    pageId?: string;
    parent?: any;
    properties?: any;
    children?: any[];

    // Block params
    blockId?: string;

    // Search params
    query?: string;
  };
  [key: string]: unknown;
}

export interface NotionOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class NotionSkill extends SkillBase<NotionInput, NotionOutput> {
  readonly id = "notion";
  readonly name = "Notion";
  readonly version = "1.0.0";
  readonly description = "Create, read, update Notion pages and databases";

  protected config: NotionConfig;
  private client?: Client;

  constructor(config: NotionConfig) {
    super();
    this.config = config;
  }

  private getClient(): Client {
    if (!this.client) {
      this.client = new Client({ auth: this.config.token });
    }
    return this.client;
  }

  async execute(input: NotionInput): Promise<NotionOutput> {
    try {
      const notion = this.getClient();
      // Runtime validation in validate() ensures required params exist per action
      const params = input.params as any;

      switch (input.action) {
        case "listDatabases":
          return await databases.listDatabases(notion, params);

        case "getDatabase":
          return await databases.getDatabase(notion, params);

        case "queryDatabase":
          return await databases.queryDatabase(notion, params);

        case "createPage":
          return await pages.createPage(notion, params);

        case "getPage":
          return await pages.getPage(notion, params);

        case "updatePage":
          return await pages.updatePage(notion, params);

        case "archivePage":
          return await pages.archivePage(notion, params);

        case "getPageBlocks":
          return await pages.getPageBlocks(notion, params);

        case "appendBlocks":
          return await pages.appendBlocks(notion, params);

        case "search":
          return await pages.search(notion, params);

        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async validate(input: NotionInput): Promise<boolean> {
    if (!input?.action || !input?.params) {
      return false;
    }

    // Validate action-specific required params
    switch (input.action) {
      case "getDatabase":
      case "queryDatabase":
        return !!input.params.databaseId;

      case "createPage":
        return !!(input.params.parent && input.params.properties);

      case "getPage":
      case "archivePage":
        return !!input.params.pageId;

      case "updatePage":
        return !!(input.params.pageId && input.params.properties);

      case "getPageBlocks":
        return !!input.params.blockId;

      case "appendBlocks":
        return !!(input.params.blockId && input.params.children);

      default:
        return true;
    }
  }
}

export function createNotionSkill(config: NotionConfig): NotionSkill {
  return new NotionSkill(config);
}
