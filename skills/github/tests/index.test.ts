/**
 * GitHub Skill Tests
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  GitHubSkill,
  createGitHubSkill,
  type GitHubConfig,
  type GitHubInput,
} from "../src/index.js";

// Mock @octokit/rest
vi.mock("@octokit/rest", () => {
  const Octokit = vi.fn(() => ({
    repos: {
      listForAuthenticatedUser: vi.fn(),
      listForOrg: vi.fn(),
      get: vi.fn(),
      createForAuthenticatedUser: vi.fn(),
      createInOrg: vi.fn(),
      delete: vi.fn(),
    },
    issues: {
      listForRepo: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    pulls: {
      list: vi.fn(),
      get: vi.fn(),
      create: vi.fn(),
      merge: vi.fn(),
    },
    actions: {
      listRepoWorkflows: vi.fn(),
      listWorkflowRuns: vi.fn(),
      listWorkflowRunsForRepo: vi.fn(),
      createWorkflowDispatch: vi.fn(),
    },
  }));

  return { Octokit };
});

describe("GitHubSkill", () => {
  let skill: GitHubSkill;
  const mockConfig: GitHubConfig = {
    token: "test-github-token",
  };

  beforeEach(() => {
    skill = new GitHubSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("github");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("GitHub");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have correct description", () => {
      expect(skill.description).toBe(
        "Manage repositories, issues, pull requests, and workflows via GitHub API"
      );
    });
  });

  describe("validate()", () => {
    it("should return false for missing input", () => {
      expect(skill.validate(null as any)).toBe(false);
      expect(skill.validate(undefined as any)).toBe(false);
    });

    it("should return false for missing action", () => {
      const input: GitHubInput = { action: "" as any, params: {} };
      expect(skill.validate(input)).toBe(false);
    });

    it("should return false for missing params", () => {
      const input: GitHubInput = {
        action: "listRepos",
        params: null as any,
      };
      expect(skill.validate(input)).toBe(false);
    });

    describe("Repository actions", () => {
      it("should validate listRepos", () => {
        const input: GitHubInput = { action: "listRepos", params: {} };
        expect(skill.validate(input)).toBe(true);
      });

      it("should validate getRepo with required params", () => {
        const input: GitHubInput = {
          action: "getRepo",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should invalidate getRepo without owner", () => {
        const input: GitHubInput = {
          action: "getRepo",
          params: { repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(false);
      });

      it("should validate createRepo with required params", () => {
        const input: GitHubInput = {
          action: "createRepo",
          params: { name: "new-repo" },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should invalidate createRepo without name", () => {
        const input: GitHubInput = { action: "createRepo", params: {} };
        expect(skill.validate(input)).toBe(false);
      });

      it("should validate deleteRepo with required params", () => {
        const input: GitHubInput = {
          action: "deleteRepo",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(true);
      });
    });

    describe("Issue actions", () => {
      it("should validate listIssues with required params", () => {
        const input: GitHubInput = {
          action: "listIssues",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should validate getIssue with required params", () => {
        const input: GitHubInput = {
          action: "getIssue",
          params: { owner: "test", repo: "test-repo", issueNumber: 1 },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should invalidate getIssue without issueNumber", () => {
        const input: GitHubInput = {
          action: "getIssue",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(false);
      });

      it("should validate createIssue with required params", () => {
        const input: GitHubInput = {
          action: "createIssue",
          params: { owner: "test", repo: "test-repo", title: "Test issue" },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should invalidate createIssue without title", () => {
        const input: GitHubInput = {
          action: "createIssue",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(false);
      });

      it("should validate updateIssue with required params", () => {
        const input: GitHubInput = {
          action: "updateIssue",
          params: { owner: "test", repo: "test-repo", issueNumber: 1 },
        };
        expect(skill.validate(input)).toBe(true);
      });
    });

    describe("Pull Request actions", () => {
      it("should validate listPullRequests with required params", () => {
        const input: GitHubInput = {
          action: "listPullRequests",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should validate getPullRequest with required params", () => {
        const input: GitHubInput = {
          action: "getPullRequest",
          params: { owner: "test", repo: "test-repo", pullNumber: 1 },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should invalidate getPullRequest without pullNumber", () => {
        const input: GitHubInput = {
          action: "getPullRequest",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(false);
      });

      it("should validate createPullRequest with required params", () => {
        const input: GitHubInput = {
          action: "createPullRequest",
          params: {
            owner: "test",
            repo: "test-repo",
            title: "Test PR",
            head: "feature",
            base: "main",
          },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should invalidate createPullRequest without head", () => {
        const input: GitHubInput = {
          action: "createPullRequest",
          params: {
            owner: "test",
            repo: "test-repo",
            title: "Test PR",
            base: "main",
          },
        };
        expect(skill.validate(input)).toBe(false);
      });

      it("should validate mergePullRequest with required params", () => {
        const input: GitHubInput = {
          action: "mergePullRequest",
          params: { owner: "test", repo: "test-repo", pullNumber: 1 },
        };
        expect(skill.validate(input)).toBe(true);
      });
    });

    describe("Workflow actions", () => {
      it("should validate listWorkflows with required params", () => {
        const input: GitHubInput = {
          action: "listWorkflows",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should validate listWorkflowRuns with required params", () => {
        const input: GitHubInput = {
          action: "listWorkflowRuns",
          params: { owner: "test", repo: "test-repo" },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should validate triggerWorkflow with required params", () => {
        const input: GitHubInput = {
          action: "triggerWorkflow",
          params: {
            owner: "test",
            repo: "test-repo",
            workflowId: "build.yml",
            ref: "main",
          },
        };
        expect(skill.validate(input)).toBe(true);
      });

      it("should invalidate triggerWorkflow without ref", () => {
        const input: GitHubInput = {
          action: "triggerWorkflow",
          params: {
            owner: "test",
            repo: "test-repo",
            workflowId: "build.yml",
          },
        };
        expect(skill.validate(input)).toBe(false);
      });
    });
  });

  describe("execute() - Repository actions", () => {
    it("should list repositories for authenticated user", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.listForAuthenticatedUser.mockResolvedValue({
        data: [{ id: 1, name: "repo1" }, { id: 2, name: "repo2" }],
      });

      const result = await skill.execute({
        action: "listRepos",
        params: {},
      });

      expect(result.success).toBe(true);
      expect(result.data.repositories).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);
    });

    it("should list repositories for organization", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.listForOrg.mockResolvedValue({
        data: [{ id: 1, name: "org-repo" }],
      });

      const result = await skill.execute({
        action: "listRepos",
        params: { org: "test-org" },
      });

      expect(result.success).toBe(true);
      expect(result.data.repositories).toHaveLength(1);
    });

    it("should get repository details", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.get.mockResolvedValue({
        data: { id: 1, name: "test-repo", full_name: "test/test-repo" },
      });

      const result = await skill.execute({
        action: "getRepo",
        params: { owner: "test", repo: "test-repo" },
      });

      expect(result.success).toBe(true);
      expect(result.data.repository.name).toBe("test-repo");
    });

    it("should create user repository", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.createForAuthenticatedUser.mockResolvedValue({
        data: { id: 1, name: "new-repo" },
      });

      const result = await skill.execute({
        action: "createRepo",
        params: { name: "new-repo", description: "Test repo" },
      });

      expect(result.success).toBe(true);
      expect(result.data.repository.name).toBe("new-repo");
    });

    it("should create organization repository", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.createInOrg.mockResolvedValue({
        data: { id: 1, name: "org-repo" },
      });

      const result = await skill.execute({
        action: "createRepo",
        params: { name: "org-repo", org: "test-org" },
      });

      expect(result.success).toBe(true);
      expect(result.data.repository.name).toBe("org-repo");
    });

    it("should delete repository", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.delete.mockResolvedValue({});

      const result = await skill.execute({
        action: "deleteRepo",
        params: { owner: "test", repo: "test-repo" },
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toContain("deleted successfully");
    });
  });

  describe("execute() - Issue actions", () => {
    it("should list issues", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.issues.listForRepo.mockResolvedValue({
        data: [
          { id: 1, number: 1, title: "Issue 1" },
          { id: 2, number: 2, title: "Issue 2" },
        ],
      });

      const result = await skill.execute({
        action: "listIssues",
        params: { owner: "test", repo: "test-repo" },
      });

      expect(result.success).toBe(true);
      expect(result.data.issues).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);
    });

    it("should get issue details", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.issues.get.mockResolvedValue({
        data: { id: 1, number: 1, title: "Test issue" },
      });

      const result = await skill.execute({
        action: "getIssue",
        params: { owner: "test", repo: "test-repo", issueNumber: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.data.issue.title).toBe("Test issue");
    });

    it("should create issue", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.issues.create.mockResolvedValue({
        data: { id: 1, number: 1, title: "New issue" },
      });

      const result = await skill.execute({
        action: "createIssue",
        params: {
          owner: "test",
          repo: "test-repo",
          title: "New issue",
          body: "Issue body",
          labels: ["bug"],
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.issue.title).toBe("New issue");
    });

    it("should update issue", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.issues.update.mockResolvedValue({
        data: { id: 1, number: 1, title: "Updated issue" },
      });

      const result = await skill.execute({
        action: "updateIssue",
        params: {
          owner: "test",
          repo: "test-repo",
          issueNumber: 1,
          title: "Updated issue",
          state: "closed",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.issue.title).toBe("Updated issue");
    });
  });

  describe("execute() - Pull Request actions", () => {
    it("should list pull requests", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.pulls.list.mockResolvedValue({
        data: [
          { id: 1, number: 1, title: "PR 1" },
          { id: 2, number: 2, title: "PR 2" },
        ],
      });

      const result = await skill.execute({
        action: "listPullRequests",
        params: { owner: "test", repo: "test-repo" },
      });

      expect(result.success).toBe(true);
      expect(result.data.pullRequests).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);
    });

    it("should get pull request details", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.pulls.get.mockResolvedValue({
        data: { id: 1, number: 1, title: "Test PR" },
      });

      const result = await skill.execute({
        action: "getPullRequest",
        params: { owner: "test", repo: "test-repo", pullNumber: 1 },
      });

      expect(result.success).toBe(true);
      expect(result.data.pullRequest.title).toBe("Test PR");
    });

    it("should create pull request", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.pulls.create.mockResolvedValue({
        data: { id: 1, number: 1, title: "New PR" },
      });

      const result = await skill.execute({
        action: "createPullRequest",
        params: {
          owner: "test",
          repo: "test-repo",
          title: "New PR",
          head: "feature",
          base: "main",
          body: "PR description",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.pullRequest.title).toBe("New PR");
    });

    it("should merge pull request", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.pulls.merge.mockResolvedValue({
        data: { merged: true, message: "Pull Request successfully merged", sha: "abc123" },
      });

      const result = await skill.execute({
        action: "mergePullRequest",
        params: {
          owner: "test",
          repo: "test-repo",
          pullNumber: 1,
          mergeMethod: "squash",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.merged).toBe(true);
      expect(result.data.sha).toBe("abc123");
    });
  });

  describe("execute() - Workflow actions", () => {
    it("should list workflows", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.actions.listRepoWorkflows.mockResolvedValue({
        data: {
          workflows: [
            { id: 1, name: "Build" },
            { id: 2, name: "Test" },
          ],
          total_count: 2,
        },
      });

      const result = await skill.execute({
        action: "listWorkflows",
        params: { owner: "test", repo: "test-repo" },
      });

      expect(result.success).toBe(true);
      expect(result.data.workflows).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);
    });

    it("should list workflow runs for specific workflow", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.actions.listWorkflowRuns.mockResolvedValue({
        data: {
          workflow_runs: [
            { id: 1, status: "completed" },
            { id: 2, status: "in_progress" },
          ],
          total_count: 2,
        },
      });

      const result = await skill.execute({
        action: "listWorkflowRuns",
        params: {
          owner: "test",
          repo: "test-repo",
          workflowId: "build.yml",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.workflowRuns).toHaveLength(2);
      expect(result.data.totalCount).toBe(2);
    });

    it("should list all workflow runs for repo", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.actions.listWorkflowRunsForRepo.mockResolvedValue({
        data: {
          workflow_runs: [{ id: 1, status: "completed" }],
          total_count: 1,
        },
      });

      const result = await skill.execute({
        action: "listWorkflowRuns",
        params: { owner: "test", repo: "test-repo" },
      });

      expect(result.success).toBe(true);
      expect(result.data.workflowRuns).toHaveLength(1);
    });

    it("should trigger workflow", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.actions.createWorkflowDispatch.mockResolvedValue({});

      const result = await skill.execute({
        action: "triggerWorkflow",
        params: {
          owner: "test",
          repo: "test-repo",
          workflowId: "build.yml",
          ref: "main",
          inputs: { environment: "production" },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data.message).toContain("triggered successfully");
    });
  });

  describe("Error handling", () => {
    it("should handle unknown action", async () => {
      const result = await skill.execute({
        action: "unknownAction" as any,
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
    });

    it("should handle API errors", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.get.mockRejectedValue(new Error("Repository not found"));

      const result = await skill.execute({
        action: "getRepo",
        params: { owner: "test", repo: "nonexistent" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Repository not found");
    });

    it("should handle non-Error exceptions", async () => {
      const { Octokit } = await import("@octokit/rest");
      const mockOctokit = new (Octokit as any)();

      mockOctokit.repos.get.mockRejectedValue("String error");

      const result = await skill.execute({
        action: "getRepo",
        params: { owner: "test", repo: "test-repo" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });
  });

  describe("Configuration", () => {
    it("should accept token configuration", () => {
      const config: GitHubConfig = {
        token: "test-token",
      };
      const customSkill = new GitHubSkill(config);
      expect(customSkill["config"].token).toBe("test-token");
    });

    it("should accept baseUrl configuration for GitHub Enterprise", () => {
      const config: GitHubConfig = {
        token: "test-token",
        baseUrl: "https://github.enterprise.com/api/v3",
      };
      const customSkill = new GitHubSkill(config);
      expect(customSkill["config"].baseUrl).toBe(
        "https://github.enterprise.com/api/v3"
      );
    });
  });

  describe("Factory function", () => {
    it("should create GitHub skill instance", () => {
      const config: GitHubConfig = {
        token: "test-token",
      };
      const createdSkill = createGitHubSkill(config);

      expect(createdSkill).toBeInstanceOf(GitHubSkill);
      expect(createdSkill.id).toBe("github");
      expect(createdSkill.name).toBe("GitHub");
    });
  });
});
