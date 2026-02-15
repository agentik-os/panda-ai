/**
 * GitHub Skill
 */

import { Octokit } from "@octokit/rest";
import { SkillBase } from "@agentik-os/sdk";
import * as repos from "./repos.js";
import * as issues from "./issues.js";
import * as prs from "./prs.js";
import * as actions from "./actions.js";

export interface GitHubConfig extends Record<string, unknown> {
  token: string;
  baseUrl?: string;
}

export interface GitHubInput {
  action:
    | "listRepos"
    | "getRepo"
    | "createRepo"
    | "deleteRepo"
    | "listIssues"
    | "getIssue"
    | "createIssue"
    | "updateIssue"
    | "listPullRequests"
    | "getPullRequest"
    | "createPullRequest"
    | "mergePullRequest"
    | "listWorkflows"
    | "listWorkflowRuns"
    | "triggerWorkflow";
  params: {
    // Common params
    owner?: string;
    repo?: string;

    // Repository params
    type?: string;
    org?: string;
    sort?: string;
    name?: string;
    description?: string;
    private?: boolean;

    // Issue params
    state?: string;
    labels?: string[];
    assignees?: string[];
    issueNumber?: number;
    title?: string;
    body?: string;

    // Pull request params
    pullNumber?: number;
    head?: string;
    base?: string;
    draft?: boolean;
    mergeMethod?: string;
    commitMessage?: string;

    // Workflow params
    workflowId?: string;
    status?: string;
    ref?: string;
    inputs?: Record<string, any>;

    // Pagination
    perPage?: number;
  };
  [key: string]: unknown;
}

export interface GitHubOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class GitHubSkill extends SkillBase<GitHubInput, GitHubOutput> {
  readonly id = "github";
  readonly name = "GitHub";
  readonly version = "1.0.0";
  readonly description =
    "Manage repositories, issues, pull requests, and workflows via GitHub API";

  protected config: GitHubConfig;
  private octokit?: Octokit;

  constructor(config: GitHubConfig) {
    super();
    this.config = config;
  }

  private getOctokit(): Octokit {
    if (!this.octokit) {
      this.octokit = new Octokit({
        auth: this.config.token,
        baseUrl: this.config.baseUrl,
      });
    }
    return this.octokit;
  }

  async execute(input: GitHubInput): Promise<GitHubOutput> {
    try {
      const octokit = this.getOctokit();
      // Runtime validation in validate() ensures required params exist per action
      const params = input.params as any;

      switch (input.action) {
        case "listRepos":
          return await repos.listRepos(octokit, params);

        case "getRepo":
          return await repos.getRepo(octokit, params);

        case "createRepo":
          return await repos.createRepo(octokit, params);

        case "deleteRepo":
          return await repos.deleteRepo(octokit, params);

        case "listIssues":
          return await issues.listIssues(octokit, params);

        case "getIssue":
          return await issues.getIssue(octokit, params);

        case "createIssue":
          return await issues.createIssue(octokit, params);

        case "updateIssue":
          return await issues.updateIssue(octokit, params);

        case "listPullRequests":
          return await prs.listPullRequests(octokit, params);

        case "getPullRequest":
          return await prs.getPullRequest(octokit, params);

        case "createPullRequest":
          return await prs.createPullRequest(octokit, params);

        case "mergePullRequest":
          return await prs.mergePullRequest(octokit, params);

        case "listWorkflows":
          return await actions.listWorkflows(octokit, params);

        case "listWorkflowRuns":
          return await actions.listWorkflowRuns(octokit, params);

        case "triggerWorkflow":
          return await actions.triggerWorkflow(octokit, params);

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

  async validate(input: GitHubInput): Promise<boolean> {
    if (!input?.action || !input?.params) {
      return false;
    }

    // Validate action-specific required params
    switch (input.action) {
      case "getRepo":
      case "deleteRepo":
        return !!(input.params.owner && input.params.repo);

      case "createRepo":
        return !!input.params.name;

      case "listIssues":
      case "listPullRequests":
      case "listWorkflows":
        return !!(input.params.owner && input.params.repo);

      case "getIssue":
      case "createIssue":
      case "updateIssue":
        if (!input.params.owner || !input.params.repo) return false;
        if (
          input.action === "getIssue" ||
          input.action === "updateIssue"
        ) {
          return !!input.params.issueNumber;
        }
        if (input.action === "createIssue") {
          return !!input.params.title;
        }
        return true;

      case "getPullRequest":
      case "mergePullRequest":
        return !!(
          input.params.owner &&
          input.params.repo &&
          input.params.pullNumber
        );

      case "createPullRequest":
        return !!(
          input.params.owner &&
          input.params.repo &&
          input.params.title &&
          input.params.head &&
          input.params.base
        );

      case "listWorkflowRuns":
        return !!(input.params.owner && input.params.repo);

      case "triggerWorkflow":
        return !!(
          input.params.owner &&
          input.params.repo &&
          input.params.workflowId &&
          input.params.ref
        );

      default:
        return true;
    }
  }
}

export function createGitHubSkill(config: GitHubConfig): GitHubSkill {
  return new GitHubSkill(config);
}
