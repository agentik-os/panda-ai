/**
 * Jira Skill
 */

import { Version3Client } from "jira.js";
import { SkillBase } from "@agentik-os/sdk";
import * as issues from "./issues.js";
import * as projects from "./projects.js";

export interface JiraConfig extends Record<string, unknown> {
  host: string;
  email: string;
  apiToken: string;
}

export interface JiraInput {
  action:
    | "listProjects"
    | "getProject"
    | "listIssues"
    | "getIssue"
    | "createIssue"
    | "updateIssue"
    | "transitionIssue"
    | "addComment"
    | "listBoards"
    | "listSprints";
  params: {
    // Project params
    projectIdOrKey?: string;
    maxResults?: number;

    // Issue params
    issueIdOrKey?: string;
    jql?: string;
    projectKey?: string;
    summary?: string;
    issueType?: string;
    description?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];

    // Transition params
    transitionId?: string;

    // Comment params
    body?: string;

    // Board params
    projectKeyOrId?: string;

    // Sprint params
    boardId?: number;
    state?: string;
  };
  [key: string]: unknown;
}

export interface JiraOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class JiraSkill extends SkillBase<JiraInput, JiraOutput> {
  readonly id = "jira";
  readonly name = "Jira";
  readonly version = "1.0.0";
  readonly description =
    "Jira project management integration - Issues, projects, sprints, boards";

  protected config: JiraConfig;
  private client?: Version3Client;

  constructor(config: JiraConfig) {
    super();
    this.config = config;
  }

  private getClient(): Version3Client {
    if (!this.client) {
      this.client = new Version3Client({
        host: this.config.host,
        authentication: {
          basic: {
            email: this.config.email,
            apiToken: this.config.apiToken,
          },
        },
      });
    }
    return this.client;
  }

  async execute(input: JiraInput): Promise<JiraOutput> {
    try {
      const jira = this.getClient();
      // Runtime validation in validate() ensures required params exist per action
      const params = input.params as any;

      switch (input.action) {
        case "listProjects":
          return await projects.listProjects(jira, params);

        case "getProject":
          return await projects.getProject(jira, params);

        case "listIssues":
          return await issues.listIssues(jira, params);

        case "getIssue":
          return await issues.getIssue(jira, params);

        case "createIssue":
          return await issues.createIssue(jira, params);

        case "updateIssue":
          return await issues.updateIssue(jira, params);

        case "transitionIssue":
          return await issues.transitionIssue(jira, params);

        case "addComment":
          return await issues.addComment(jira, params);

        case "listBoards":
          return await projects.listBoards(jira, params);

        case "listSprints":
          return await projects.listSprints(jira, params);

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

  async validate(input: JiraInput): Promise<boolean> {
    if (!input?.action || !input?.params) {
      return false;
    }

    // Validate action-specific required params
    switch (input.action) {
      case "getProject":
        return !!input.params.projectIdOrKey;

      case "getIssue":
        return !!input.params.issueIdOrKey;

      case "createIssue":
        return !!(
          input.params.projectKey &&
          input.params.summary &&
          input.params.issueType
        );

      case "updateIssue":
        return !!input.params.issueIdOrKey;

      case "transitionIssue":
        return !!(input.params.issueIdOrKey && input.params.transitionId);

      case "addComment":
        return !!(input.params.issueIdOrKey && input.params.body);

      case "listSprints":
        return !!input.params.boardId;

      default:
        return true;
    }
  }
}

export function createJiraSkill(config: JiraConfig): JiraSkill {
  return new JiraSkill(config);
}
