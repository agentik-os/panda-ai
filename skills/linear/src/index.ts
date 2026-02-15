/**
 * Linear Skill
 */

import { LinearClient } from "@linear/sdk";
import { SkillBase } from "@agentik-os/sdk";
import * as issues from "./issues.js";
import * as projects from "./projects.js";

export interface LinearConfig extends Record<string, unknown> {
  apiKey: string;
}

export interface LinearInput {
  action:
    | "listIssues"
    | "getIssue"
    | "createIssue"
    | "updateIssue"
    | "listProjects"
    | "getProject"
    | "createProject"
    | "listTeams";
  params: {
    // Issue params
    issueId?: string;
    title?: string;
    description?: string;
    assigneeId?: string;
    priority?: number;
    stateId?: string;
    state?: string;

    // Project params
    projectId?: string;
    name?: string;

    // Team params
    teamId?: string;

    // Common params
    limit?: number;
  };
  [key: string]: unknown;
}

export interface LinearOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class LinearSkill extends SkillBase<LinearInput, LinearOutput> {
  readonly id = "linear";
  readonly name = "Linear";
  readonly version = "1.0.0";
  readonly description = "Manage issues, projects, teams via Linear API";

  protected config: LinearConfig;
  private client?: LinearClient;

  constructor(config: LinearConfig) {
    super();
    this.config = config;
  }

  private getClient(): LinearClient {
    if (!this.client) {
      this.client = new LinearClient({ apiKey: this.config.apiKey });
    }
    return this.client;
  }

  async execute(input: LinearInput): Promise<LinearOutput> {
    try {
      const linear = this.getClient();
      // Runtime validation in validate() ensures required params exist per action
      const params = input.params as any;

      switch (input.action) {
        case "listIssues":
          return await issues.listIssues(linear, params);

        case "getIssue":
          return await issues.getIssue(linear, params);

        case "createIssue":
          return await issues.createIssue(linear, params);

        case "updateIssue":
          return await issues.updateIssue(linear, params);

        case "listProjects":
          return await projects.listProjects(linear, params);

        case "getProject":
          return await projects.getProject(linear, params);

        case "createProject":
          return await projects.createProject(linear, params);

        case "listTeams":
          return await projects.listTeams(linear, params);

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

  async validate(input: LinearInput): Promise<boolean> {
    if (!input?.action || !input?.params) {
      return false;
    }

    // Validate action-specific required params
    switch (input.action) {
      case "getIssue":
        return !!input.params.issueId;

      case "createIssue":
        return !!(input.params.title && input.params.teamId);

      case "updateIssue":
        return !!input.params.issueId;

      case "getProject":
        return !!input.params.projectId;

      case "createProject":
        return !!(input.params.name && input.params.teamId);

      default:
        return true;
    }
  }
}

export function createLinearSkill(config: LinearConfig): LinearSkill {
  return new LinearSkill(config);
}
