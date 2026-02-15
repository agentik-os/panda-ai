/**
 * Jira Project Operations
 */

import { Version3Client } from "jira.js";
import { JiraOutput } from "./index.js";

export async function listProjects(
  jira: Version3Client,
  params: {
    maxResults?: number;
  }
): Promise<JiraOutput> {
  try {
    const projects = await jira.projects.searchProjects({
      maxResults: params.maxResults || 50,
    });

    return {
      success: true,
      data: {
        projects: projects.values,
        total: projects.total,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getProject(
  jira: Version3Client,
  params: {
    projectIdOrKey: string;
  }
): Promise<JiraOutput> {
  if (!params.projectIdOrKey) {
    throw new Error("projectIdOrKey is required");
  }

  try {
    const project = await jira.projects.getProject({
      projectIdOrKey: params.projectIdOrKey,
    });

    return {
      success: true,
      data: { project },
    };
  } catch (error) {
    throw error;
  }
}

export async function listBoards(
  jira: Version3Client,
  params: {
    projectKeyOrId?: string;
    maxResults?: number;
  }
): Promise<JiraOutput> {
  try {
    const boards = await (jira as any).board.getAllBoards({
      projectKeyOrId: params.projectKeyOrId,
      maxResults: params.maxResults || 50,
    });

    return {
      success: true,
      data: {
        boards: boards.values,
        total: boards.total,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function listSprints(
  jira: Version3Client,
  params: {
    boardId: number;
    state?: string;
  }
): Promise<JiraOutput> {
  if (!params.boardId) {
    throw new Error("boardId is required");
  }

  try {
    const sprints = await (jira as any).board.getAllSprints({
      boardId: params.boardId,
      state: params.state,
    });

    return {
      success: true,
      data: {
        sprints: sprints.values,
        total: sprints.total,
      },
    };
  } catch (error) {
    throw error;
  }
}
