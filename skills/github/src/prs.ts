/**
 * GitHub Pull Requests Operations
 */

import { Octokit } from "@octokit/rest";
import { GitHubOutput } from "./index.js";

export async function listPullRequests(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    state?: string;
    perPage?: number;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo) {
    throw new Error("owner and repo are required");
  }

  try {
    const response = await octokit.pulls.list({
      owner: params.owner,
      repo: params.repo,
      state: params.state as any,
      per_page: params.perPage || 30,
    });

    return {
      success: true,
      data: {
        pullRequests: response.data,
        totalCount: response.data.length,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getPullRequest(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    pullNumber: number;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo || !params.pullNumber) {
    throw new Error("owner, repo, and pullNumber are required");
  }

  try {
    const response = await octokit.pulls.get({
      owner: params.owner,
      repo: params.repo,
      pull_number: params.pullNumber,
    });

    return {
      success: true,
      data: {
        pullRequest: response.data,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function createPullRequest(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    title: string;
    head: string;
    base: string;
    body?: string;
    draft?: boolean;
  }
): Promise<GitHubOutput> {
  if (
    !params.owner ||
    !params.repo ||
    !params.title ||
    !params.head ||
    !params.base
  ) {
    throw new Error("owner, repo, title, head, and base are required");
  }

  try {
    const response = await octokit.pulls.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      head: params.head,
      base: params.base,
      body: params.body,
      draft: params.draft,
    });

    return {
      success: true,
      data: {
        pullRequest: response.data,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function mergePullRequest(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    pullNumber: number;
    mergeMethod?: string;
    commitMessage?: string;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo || !params.pullNumber) {
    throw new Error("owner, repo, and pullNumber are required");
  }

  try {
    const response = await octokit.pulls.merge({
      owner: params.owner,
      repo: params.repo,
      pull_number: params.pullNumber,
      merge_method: params.mergeMethod as any,
      commit_message: params.commitMessage,
    });

    return {
      success: true,
      data: {
        merged: response.data.merged,
        message: response.data.message,
        sha: response.data.sha,
      },
    };
  } catch (error) {
    throw error;
  }
}
