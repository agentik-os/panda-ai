/**
 * GitHub Actions Skill Comprehensive Tests
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import { GitHubActionsSkill } from "../src/index.js";

// Mock @octokit/rest
vi.mock("@octokit/rest", () => {
  const mockCreateWorkflowDispatch = vi.fn();
  const mockListWorkflows = vi.fn();
  const mockListWorkflowRuns = vi.fn();

  return {
    Octokit: vi.fn(() => ({
      rest: {
        actions: {
          createWorkflowDispatch: mockCreateWorkflowDispatch,
          listRepoWorkflows: mockListWorkflows,
          listWorkflowRuns: mockListWorkflowRuns,
        },
      },
    })),
    __getMocks: () => ({
      mockCreateWorkflowDispatch,
      mockListWorkflows,
      mockListWorkflowRuns,
    }),
  };
});

describe("GitHubActionsSkill", () => {
  let skill: GitHubActionsSkill;
  const mockConfig = {
    token: "ghp_test-github-token",
  };

  beforeEach(() => {
    skill = new GitHubActionsSkill(mockConfig);
    vi.clearAllMocks();
  });

  describe("Metadata", () => {
    it("should have correct id", () => {
      expect(skill.id).toBe("github-actions");
    });

    it("should have correct name", () => {
      expect(skill.name).toBe("GitHub Actions");
    });

    it("should have correct version", () => {
      expect(skill.version).toBe("1.0.0");
    });

    it("should have description", () => {
      expect(skill.description).toContain("GitHub Actions");
      expect(skill.description).toContain("workflows");
    });
  });

  describe("validate()", () => {
    it("should reject missing action", async () => {
      expect(await skill.validate({} as any)).toBe(false);
    });

    it("should reject missing params", async () => {
      expect(await skill.validate({ action: "triggerWorkflow" } as any)).toBe(
        false
      );
    });

    it("should accept valid triggerWorkflow input", async () => {
      expect(
        await skill.validate({
          action: "triggerWorkflow",
          params: {
            repo: "owner/repo",
            workflowId: "build.yml",
            ref: "main",
          },
        })
      ).toBe(true);
    });

    it("should accept valid listWorkflows input", async () => {
      expect(
        await skill.validate({
          action: "listWorkflows",
          params: {
            repo: "owner/repo",
          },
        })
      ).toBe(true);
    });

    it("should accept valid getWorkflowRuns input", async () => {
      expect(
        await skill.validate({
          action: "getWorkflowRuns",
          params: {
            repo: "owner/repo",
            workflowId: "build.yml",
          },
        })
      ).toBe(true);
    });
  });

  describe("execute() - triggerWorkflow", () => {
    it("should trigger workflow successfully", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockCreateWorkflowDispatch } = __getMocks();

      mockCreateWorkflowDispatch.mockResolvedValue({
        status: 204,
        data: null,
      });

      const result = await skill.execute({
        action: "triggerWorkflow",
        params: {
          repo: "octocat/hello-world",
          workflowId: "build.yml",
          ref: "main",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveProperty("status", "triggered");

      expect(mockCreateWorkflowDispatch).toHaveBeenCalledWith({
        owner: "octocat",
        repo: "hello-world",
        workflow_id: "build.yml",
        ref: "main",
      });
    });

    it("should trigger workflow with inputs", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockCreateWorkflowDispatch } = __getMocks();

      mockCreateWorkflowDispatch.mockResolvedValue({
        status: 204,
        data: null,
      });

      await skill.execute({
        action: "triggerWorkflow",
        params: {
          repo: "owner/repo",
          workflowId: "deploy.yml",
          ref: "main",
          inputs: {
            environment: "production",
            version: "1.0.0",
          },
        },
      });

      expect(mockCreateWorkflowDispatch).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        workflow_id: "deploy.yml",
        ref: "main",
        inputs: {
          environment: "production",
          version: "1.0.0",
        },
      });
    });

    it("should handle workflow not found errors", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockCreateWorkflowDispatch } = __getMocks();

      mockCreateWorkflowDispatch.mockRejectedValue(
        new Error("Workflow not found")
      );

      const result = await skill.execute({
        action: "triggerWorkflow",
        params: {
          repo: "owner/repo",
          workflowId: "invalid.yml",
          ref: "main",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Workflow not found");
    });

    it("should handle invalid ref errors", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockCreateWorkflowDispatch } = __getMocks();

      mockCreateWorkflowDispatch.mockRejectedValue(
        new Error("Reference does not exist")
      );

      const result = await skill.execute({
        action: "triggerWorkflow",
        params: {
          repo: "owner/repo",
          workflowId: "build.yml",
          ref: "invalid-branch",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Reference does not exist");
    });
  });

  describe("execute() - listWorkflows", () => {
    it("should list workflows successfully", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflows } = __getMocks();

      const mockResponse = {
        data: {
          workflows: [
            {
              id: 123,
              name: "Build",
              path: ".github/workflows/build.yml",
              state: "active",
            },
            {
              id: 456,
              name: "Deploy",
              path: ".github/workflows/deploy.yml",
              state: "active",
            },
          ],
        },
      };

      mockListWorkflows.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "listWorkflows",
        params: {
          repo: "owner/repo",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data.workflows);

      expect(mockListWorkflows).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
      });
    });

    it("should handle repository not found errors", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflows } = __getMocks();

      mockListWorkflows.mockRejectedValue(new Error("Not Found"));

      const result = await skill.execute({
        action: "listWorkflows",
        params: {
          repo: "invalid/repo",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Not Found");
    });
  });

  describe("execute() - getWorkflowRuns", () => {
    it("should get workflow runs successfully", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflowRuns } = __getMocks();

      const mockResponse = {
        data: {
          workflow_runs: [
            {
              id: 789,
              status: "completed",
              conclusion: "success",
              created_at: "2024-02-14T10:00:00Z",
            },
            {
              id: 790,
              status: "in_progress",
              conclusion: null,
              created_at: "2024-02-14T11:00:00Z",
            },
          ],
        },
      };

      mockListWorkflowRuns.mockResolvedValue(mockResponse);

      const result = await skill.execute({
        action: "getWorkflowRuns",
        params: {
          repo: "owner/repo",
          workflowId: "build.yml",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toEqual(mockResponse.data.workflow_runs);

      expect(mockListWorkflowRuns).toHaveBeenCalledWith({
        owner: "owner",
        repo: "repo",
        workflow_id: "build.yml",
      });
    });

    it("should handle workflow runs errors", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflowRuns } = __getMocks();

      mockListWorkflowRuns.mockRejectedValue(
        new Error("Workflow not accessible")
      );

      const result = await skill.execute({
        action: "getWorkflowRuns",
        params: {
          repo: "owner/repo",
          workflowId: "build.yml",
        },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Workflow not accessible");
    });
  });

  describe("Error Handling", () => {
    it("should return error for unknown action", async () => {
      const result = await skill.execute({
        action: "invalidAction" as any,
        params: {},
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("Unknown action");
      expect(result.error).toContain("invalidAction");
    });

    it("should handle non-Error exceptions", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflows } = __getMocks();

      mockListWorkflows.mockRejectedValue("String error");

      const result = await skill.execute({
        action: "listWorkflows",
        params: { repo: "owner/repo" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Unknown error");
    });

    it("should handle 401 authentication errors", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflows } = __getMocks();

      mockListWorkflows.mockRejectedValue(new Error("401 Unauthorized"));

      const result = await skill.execute({
        action: "listWorkflows",
        params: { repo: "owner/repo" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("401");
    });

    it("should handle 403 forbidden errors", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflows } = __getMocks();

      mockListWorkflows.mockRejectedValue(new Error("403 Forbidden"));

      const result = await skill.execute({
        action: "listWorkflows",
        params: { repo: "owner/repo" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("403");
    });

    it("should handle rate limit errors", async () => {
      const { Octokit, __getMocks } = await import("@octokit/rest");
      const { mockListWorkflows } = __getMocks();

      mockListWorkflows.mockRejectedValue(
        new Error("API rate limit exceeded")
      );

      const result = await skill.execute({
        action: "listWorkflows",
        params: { repo: "owner/repo" },
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain("rate limit");
    });
  });

  describe("Configuration", () => {
    it("should use provided GitHub token", () => {
      const customSkill = new GitHubActionsSkill({
        token: "ghp_custom-token",
      });

      expect((customSkill as any).config.token).toBe("ghp_custom-token");
    });
  });

  describe("Helper Methods", () => {
    it("should parse repo string correctly", () => {
      const parsed = (skill as any).parseRepo("octocat/hello-world");

      expect(parsed).toEqual({
        owner: "octocat",
        repo: "hello-world",
      });
    });

    it("should handle repo parsing errors", () => {
      expect(() => {
        (skill as any).parseRepo("invalid-repo-format");
      }).toThrow();
    });
  });

  describe("Factory Function", () => {
    it("should create skill instance via factory", async () => {
      const { createGitHubActionsSkill } = await import("../src/index.js");
      const factorySkill = createGitHubActionsSkill(mockConfig);

      expect(factorySkill).toBeInstanceOf(GitHubActionsSkill);
      expect(factorySkill.id).toBe("github-actions");
    });
  });
});
