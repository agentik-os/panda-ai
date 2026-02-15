/**
 * Linear Issue Operations
 */

import { LinearClient } from "@linear/sdk";
import { LinearOutput } from "./index.js";

export async function listIssues(
  linear: LinearClient,
  params: {
    teamId?: string;
    assigneeId?: string;
    projectId?: string;
    state?: string;
    limit?: number;
  }
): Promise<LinearOutput> {
  try {
    const filter: any = {};
    if (params.teamId) filter.team = { id: { eq: params.teamId } };
    if (params.assigneeId)
      filter.assignee = { id: { eq: params.assigneeId } };
    if (params.projectId) filter.project = { id: { eq: params.projectId } };
    if (params.state) filter.state = { name: { eq: params.state } };

    const issues = await linear.issues({
      filter: Object.keys(filter).length > 0 ? filter : undefined,
      first: params.limit || 50,
    });

    return {
      success: true,
      data: {
        issues: issues.nodes,
        totalCount: issues.nodes.length,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getIssue(
  linear: LinearClient,
  params: {
    issueId: string;
  }
): Promise<LinearOutput> {
  if (!params.issueId) {
    throw new Error("issueId is required");
  }

  try {
    const issue = await linear.issue(params.issueId);

    return {
      success: true,
      data: { issue },
    };
  } catch (error) {
    throw error;
  }
}

export async function createIssue(
  linear: LinearClient,
  params: {
    title: string;
    teamId: string;
    description?: string;
    assigneeId?: string;
    priority?: number;
    stateId?: string;
    projectId?: string;
  }
): Promise<LinearOutput> {
  if (!params.title || !params.teamId) {
    throw new Error("title and teamId are required");
  }

  try {
    const payload = await linear.createIssue({
      title: params.title,
      teamId: params.teamId,
      description: params.description,
      assigneeId: params.assigneeId,
      priority: params.priority,
      stateId: params.stateId,
      projectId: params.projectId,
    });

    const issue = await payload.issue;

    return {
      success: true,
      data: {
        issue,
        issueId: issue?.id,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function updateIssue(
  linear: LinearClient,
  params: {
    issueId: string;
    title?: string;
    description?: string;
    assigneeId?: string;
    priority?: number;
    stateId?: string;
  }
): Promise<LinearOutput> {
  if (!params.issueId) {
    throw new Error("issueId is required");
  }

  try {
    const updatePayload: any = {};
    if (params.title) updatePayload.title = params.title;
    if (params.description) updatePayload.description = params.description;
    if (params.assigneeId) updatePayload.assigneeId = params.assigneeId;
    if (params.priority !== undefined) updatePayload.priority = params.priority;
    if (params.stateId) updatePayload.stateId = params.stateId;

    const payload = await linear.updateIssue(params.issueId, updatePayload);
    const issue = await payload.issue;

    return {
      success: true,
      data: { issue },
    };
  } catch (error) {
    throw error;
  }
}
