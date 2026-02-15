/**
 * Jira Issue Operations
 */

import { Version3Client } from "jira.js";
import { JiraOutput } from "./index.js";

export async function listIssues(
  jira: Version3Client,
  params: {
    jql?: string;
    projectKey?: string;
    maxResults?: number;
  }
): Promise<JiraOutput> {
  try {
    let jql = params.jql || "";

    if (!jql && params.projectKey) {
      jql = `project = ${params.projectKey}`;
    }

    const issues = await jira.issueSearch.searchForIssuesUsingJql({
      jql,
      maxResults: params.maxResults || 50,
    });

    return {
      success: true,
      data: {
        issues: issues.issues,
        total: issues.total,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getIssue(
  jira: Version3Client,
  params: {
    issueIdOrKey: string;
  }
): Promise<JiraOutput> {
  if (!params.issueIdOrKey) {
    throw new Error("issueIdOrKey is required");
  }

  try {
    const issue = await jira.issues.getIssue({
      issueIdOrKey: params.issueIdOrKey,
    });

    return {
      success: true,
      data: { issue },
    };
  } catch (error) {
    throw error;
  }
}

export async function createIssue(
  jira: Version3Client,
  params: {
    projectKey: string;
    summary: string;
    issueType: string;
    description?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
  }
): Promise<JiraOutput> {
  if (!params.projectKey || !params.summary || !params.issueType) {
    throw new Error("projectKey, summary, and issueType are required");
  }

  try {
    const fields: any = {
      project: {
        key: params.projectKey,
      },
      summary: params.summary,
      issuetype: {
        name: params.issueType,
      },
    };

    if (params.description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: params.description,
              },
            ],
          },
        ],
      };
    }

    if (params.assignee) {
      fields.assignee = {
        accountId: params.assignee,
      };
    }

    if (params.priority) {
      fields.priority = {
        name: params.priority,
      };
    }

    if (params.labels) {
      fields.labels = params.labels;
    }

    const issue = await jira.issues.createIssue({
      fields,
    });

    return {
      success: true,
      data: {
        issue,
        issueKey: issue.key,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function updateIssue(
  jira: Version3Client,
  params: {
    issueIdOrKey: string;
    summary?: string;
    description?: string;
    assignee?: string;
    priority?: string;
    labels?: string[];
  }
): Promise<JiraOutput> {
  if (!params.issueIdOrKey) {
    throw new Error("issueIdOrKey is required");
  }

  try {
    const fields: any = {};

    if (params.summary) {
      fields.summary = params.summary;
    }

    if (params.description) {
      fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: params.description,
              },
            ],
          },
        ],
      };
    }

    if (params.assignee) {
      fields.assignee = {
        accountId: params.assignee,
      };
    }

    if (params.priority) {
      fields.priority = {
        name: params.priority,
      };
    }

    if (params.labels) {
      fields.labels = params.labels;
    }

    await jira.issues.editIssue({
      issueIdOrKey: params.issueIdOrKey,
      fields,
    });

    return {
      success: true,
      data: { message: "Issue updated successfully" },
    };
  } catch (error) {
    throw error;
  }
}

export async function transitionIssue(
  jira: Version3Client,
  params: {
    issueIdOrKey: string;
    transitionId: string;
  }
): Promise<JiraOutput> {
  if (!params.issueIdOrKey || !params.transitionId) {
    throw new Error("issueIdOrKey and transitionId are required");
  }

  try {
    await jira.issues.doTransition({
      issueIdOrKey: params.issueIdOrKey,
      transition: {
        id: params.transitionId,
      },
    });

    return {
      success: true,
      data: { message: "Issue transitioned successfully" },
    };
  } catch (error) {
    throw error;
  }
}

export async function addComment(
  jira: Version3Client,
  params: {
    issueIdOrKey: string;
    body: string;
  }
): Promise<JiraOutput> {
  if (!params.issueIdOrKey || !params.body) {
    throw new Error("issueIdOrKey and body are required");
  }

  try {
    const comment = await (jira.issueComments as any).addComment({
      issueIdOrKey: params.issueIdOrKey,
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: params.body,
              },
            ],
          },
        ],
      },
    });

    return {
      success: true,
      data: {
        comment,
        commentId: comment?.id,
      },
    };
  } catch (error) {
    throw error;
  }
}
