/**
 * GitHub Actions Skill
 */

import { Octokit } from '@octokit/rest';
import { SkillBase } from '../../../packages/sdk/src/index.js';

export interface GitHubActionsConfig {
  personalAccessToken: string;
  repository?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface GitHubActionsInput {
  action: 'triggerWorkflow' | 'listWorkflows' | 'getWorkflowRuns';
  params: Record<string, any>;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface GitHubActionsOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export class GitHubActionsSkill extends SkillBase<GitHubActionsInput, GitHubActionsOutput> {
  readonly id = 'github-actions';
  readonly name = 'GitHub Actions';
  readonly version = '1.0.0';
  readonly description = 'Trigger and manage GitHub Actions workflows';
  
  private octokit: Octokit;
  private defaultRepo?: string;

  constructor(config: GitHubActionsConfig) {
    super();
    this.octokit = new Octokit({ auth: config.personalAccessToken });
    this.defaultRepo = config.repository;
  }

  async execute(input: GitHubActionsInput): Promise<GitHubActionsOutput> {
    try {
      const [owner, repo] = this.parseRepo(input.params.repository || this.defaultRepo);

      switch (input.action) {
        case 'triggerWorkflow':
          await this.octokit.actions.createWorkflowDispatch({
            owner,
            repo,
            workflow_id: input.params.workflowId,
            ref: input.params.ref || 'main',
            inputs: input.params.inputs || {}
          });
          return { success: true, data: { triggered: true } };
          
        case 'listWorkflows':
          const workflows = await this.octokit.actions.listRepoWorkflows({ owner, repo });
          return { success: true, data: workflows.data.workflows };
          
        case 'getWorkflowRuns':
          const runs = await this.octokit.actions.listWorkflowRuns({
            owner,
            repo,
            workflow_id: input.params.workflowId
          });
          return { success: true, data: runs.data.workflow_runs };
          
        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validate(input: GitHubActionsInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }

  private parseRepo(repo?: string): [string, string] {
    if (!repo) throw new Error('Repository not specified');
    const [owner, name] = repo.split('/');
    if (!owner || !name) throw new Error('Invalid repository format. Use owner/repo');
    return [owner, name];
  }
}

export function createGitHubActionsSkill(config: GitHubActionsConfig): GitHubActionsSkill {
  return new GitHubActionsSkill(config);
}
