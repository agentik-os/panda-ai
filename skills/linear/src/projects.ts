/**
 * Linear Project Operations
 */

import { LinearClient } from "@linear/sdk";
import { LinearOutput } from "./index.js";

export async function listProjects(
  linear: LinearClient,
  params: {
    teamId?: string;
    limit?: number;
  }
): Promise<LinearOutput> {
  try {
    const filter = params.teamId
      ? ({ team: { id: { eq: params.teamId } } } as any)
      : undefined;

    const projects = await linear.projects({
      filter,
      first: params.limit || 50,
    });

    return {
      success: true,
      data: {
        projects: projects.nodes,
        totalCount: projects.nodes.length,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getProject(
  linear: LinearClient,
  params: {
    projectId: string;
  }
): Promise<LinearOutput> {
  if (!params.projectId) {
    throw new Error("projectId is required");
  }

  try {
    const project = await linear.project(params.projectId);

    return {
      success: true,
      data: { project },
    };
  } catch (error) {
    throw error;
  }
}

export async function createProject(
  linear: LinearClient,
  params: {
    name: string;
    teamId: string;
    description?: string;
  }
): Promise<LinearOutput> {
  if (!params.name || !params.teamId) {
    throw new Error("name and teamId are required");
  }

  try {
    const payload = await linear.createProject({
      name: params.name,
      teamIds: [params.teamId],
      description: params.description,
    });

    const project = await payload.project;

    return {
      success: true,
      data: {
        project,
        projectId: project?.id,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function listTeams(
  linear: LinearClient,
  params: {
    limit?: number;
  }
): Promise<LinearOutput> {
  try {
    const teams = await linear.teams({
      first: params.limit || 50,
    });

    return {
      success: true,
      data: {
        teams: teams.nodes,
        totalCount: teams.nodes.length,
      },
    };
  } catch (error) {
    throw error;
  }
}
