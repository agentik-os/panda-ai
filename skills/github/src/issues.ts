/**
 * GitHub Issues Operations
 */

import { Octokit } from "@octokit/rest";
import { GitHubOutput } from "./index.js";

export async function listIssues(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    state?: string;
    labels?: string[];
    perPage?: number;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo) {
    throw new Error("owner and repo are required");
  }

  try {
    const response = await octokit.issues.listForRepo({
      owner: params.owner,
      repo: params.repo,
      state: params.state as any,
      labels: params.labels?.join(","),
      per_page: params.perPage || 30,
    });

    return {
      success: true,
      data: {
        issues: response.data,
        totalCount: response.data.length,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getIssue(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    issueNumber: number;
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo || !params.issueNumber) {
    throw new Error("owner, repo, and issueNumber are required");
  }

  try {
    const response = await octokit.issues.get({
      owner: params.owner,
      repo: params.repo,
      issue_number: params.issueNumber,
    });

    return {
      success: true,
      data: {
        issue: response.data,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function createIssue(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    title: string;
    body?: string;
    labels?: string[];
    assignees?: string[];
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo || !params.title) {
    throw new Error("owner, repo, and title are required");
  }

  try {
    const response = await octokit.issues.create({
      owner: params.owner,
      repo: params.repo,
      title: params.title,
      body: params.body,
      labels: params.labels,
      assignees: params.assignees,
    });

    return {
      success: true,
      data: {
        issue: response.data,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function updateIssue(
  octokit: Octokit,
  params: {
    owner: string;
    repo: string;
    issueNumber: number;
    title?: string;
    body?: string;
    state?: string;
    labels?: string[];
  }
): Promise<GitHubOutput> {
  if (!params.owner || !params.repo || !params.issueNumber) {
    throw new Error("owner, repo, and issueNumber are required");
  }

  try {
    const response = await octokit.issues.update({
      owner: params.owner,
      repo: params.repo,
      issue_number: params.issueNumber,
      title: params.title,
      body: params.body,
      state: params.state as any,
      labels: params.labels,
    });

    return {
      success: true,
      data: {
        issue: response.data,
      },
    };
  } catch (error) {
    throw error;
  }
}
