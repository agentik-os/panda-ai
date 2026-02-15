/**
 * GitHub Actions Operations
 */

import { Octokit } from "@octokit/rest";
import { GitHubOutput } from "./index.js";

export async function listWorkflows(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo) {
    throw new Error("owner and repo are required");
  }

  try {
    const response = await octokit.actions.listRepoWorkflows({
      owner: params.owner,
      repo: params.repo,
    });

    return {
      success: true,
      data: {
        workflows: response.data.workflows,
        totalCount: response.data.total_count,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function listWorkflowRuns(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    workflowId?: string;
    status?: string;
    perPage?: number;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo) {
    throw new Error("owner and repo are required");
  }

  try {
    if (params.workflowId) {
      // List runs for specific workflow
      const response = await octokit.actions.listWorkflowRuns({
        owner: params.owner,
        repo: params.repo,
        workflow_id: params.workflowId,
        status: params.status as any,
        per_page: params.perPage || 30,
      });

      return {
        success: true,
        data: {
          workflowRuns: response.data.workflow_runs,
          totalCount: response.data.total_count,
        },
      };
    } else {
      // List all workflow runs for repo
      const response = await octokit.actions.listWorkflowRunsForRepo({
        owner: params.owner,
        repo: params.repo,
        status: params.status as any,
        per_page: params.perPage || 30,
      });

      return {
        success: true,
        data: {
          workflowRuns: response.data.workflow_runs,
          totalCount: response.data.total_count,
        },
      };
    }
  } catch (error) {
    throw error;
  }
}

export async function triggerWorkflow(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    workflowId: string;
    ref: string;
    inputs?: Record<string, any>;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo || !params.workflowId || !params.ref) {
    throw new Error("owner, repo, workflowId, and ref are required");
  }

  try {
    await octokit.actions.createWorkflowDispatch({
      owner: params.owner,
      repo: params.repo,
      workflow_id: params.workflowId,
      ref: params.ref,
      inputs: params.inputs,
    });

    return {
      success: true,
      data: {
        message: `Workflow ${params.workflowId} triggered successfully on ${params.ref}`,
      },
    };
  } catch (error) {
    throw error;
  }
}
