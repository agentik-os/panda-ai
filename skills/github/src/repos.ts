/**
 * GitHub Repository Operations
 */

import { Octokit } from "@octokit/rest";
import { GitHubOutput } from "./index.js";

export async function listRepos(
  octokit: Octokit,
  params: {
    type?: string;
    org?: string;
    sort?: string;
    perPage?: number;
  }
): Promise<GitHubOutput> {
  try {
    if (params.org) {
      // List organization repositories
      const response = await octokit.repos.listForOrg({
        org: params.org,
        type: params.type as any,
        sort: params.sort as any,
        per_page: params.perPage || 30,
      });

      return {
        success: true,
        data: {
          repositories: response.data,
          totalCount: response.data.length,
        },
      };
    } else {
      // List authenticated user's repositories
      const response = await octokit.repos.listForAuthenticatedUser({
        type: params.type as any,
        sort: params.sort as any,
        per_page: params.perPage || 30,
      });

      return {
        success: true,
        data: {
          repositories: response.data,
          totalCount: response.data.length,
        },
      };
    }
  } catch (error) {
    throw error;
  }
}

export async function getRepo(
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
    const response = await octokit.repos.get({
      owner: params.owner,
      repo: params.repo,
    });

    return {
      success: true,
      data: {
        repository: response.data,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function createRepo(
  octokit: Octokit,
  params: {
    name: string;
    description?: string;
    private?: boolean;
    org?: string;
  }
): Promise<GitHubOutput> {
  if (!params.name) {
    throw new Error("name is required");
  }

  try {
    if (params.org) {
      // Create organization repository
      const response = await octokit.repos.createInOrg({
        org: params.org,
        name: params.name,
        description: params.description,
        private: params.private,
      });

      return {
        success: true,
        data: {
          repository: response.data,
        },
      };
    } else {
      // Create user repository
      const response = await octokit.repos.createForAuthenticatedUser({
        name: params.name,
        description: params.description,
        private: params.private,
      });

      return {
        success: true,
        data: {
          repository: response.data,
        },
      };
    }
  } catch (error) {
    throw error;
  }
}

export async function deleteRepo(
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
    await octokit.repos.delete({
      owner: params.owner,
      repo: params.repo,
    });

    return {
      success: true,
      data: {
        message: `Repository ${params.owner}/${params.repo} deleted successfully`,
      },
    };
  } catch (error) {
    throw error;
  }
}
