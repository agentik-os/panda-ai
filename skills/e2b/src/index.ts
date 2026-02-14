/**
 * E2B Sandboxed Code Execution Skill
 *
 * Provides secure, isolated code execution via E2B cloud sandboxes.
 * Agents can run Python, JavaScript, Bash, and other languages safely
 * without affecting the host system.
 */

import type { SkillInput } from "../../../packages/sdk/src/index.js";
import { SkillBase } from "../../../packages/sdk/src/index.js";

export interface E2BConfig extends Record<string, unknown> {
  apiKey: string;
  defaultTemplate?: string;
  maxExecutionTime?: number;
}

export type E2BAction =
  | "createSandbox"
  | "closeSandbox"
  | "listSandboxes"
  | "runCode"
  | "runCommand"
  | "writeFile"
  | "readFile"
  | "installPackages";

export interface E2BInput extends SkillInput {
  action: E2BAction;
  params: Record<string, any>;
  [key: string]: unknown;
}

export interface CodeExecutionResult {
  stdout: string;
  stderr: string;
  exitCode: number;
  executionTimeMs: number;
}

export interface E2BOutput {
  success: boolean;
  data?: any;
  error?: string;
  sandboxId?: string;
  [key: string]: unknown;
}

interface Sandbox {
  id: string;
  template: string;
  status: "running" | "stopped";
  createdAt: string;
}

export class E2BSkill extends SkillBase<E2BInput, E2BOutput> {
  readonly id = "e2b";
  readonly name = "E2B Sandboxed Code Execution";
  readonly version = "1.0.0";
  readonly description = "Execute code safely in cloud sandboxes";

  protected config: E2BConfig;
  private baseUrl = "https://api.e2b.dev/v1";
  private sandboxes: Map<string, Sandbox> = new Map();

  constructor(config: E2BConfig) {
    super();
    this.config = config;
  }

  async execute(input: E2BInput): Promise<E2BOutput> {
    try {
      switch (input.action) {
        case "createSandbox":
          return await this.createSandbox(input.params);
        case "closeSandbox":
          return await this.closeSandbox(input.params.sandboxId);
        case "listSandboxes":
          return await this.listSandboxes();
        case "runCode":
          return await this.runCode(
            input.params.sandboxId,
            input.params.code,
            input.params.language
          );
        case "runCommand":
          return await this.runCommand(
            input.params.sandboxId,
            input.params.command
          );
        case "writeFile":
          return await this.writeFile(
            input.params.sandboxId,
            input.params.path,
            input.params.content
          );
        case "readFile":
          return await this.readFile(input.params.sandboxId, input.params.path);
        case "installPackages":
          return await this.installPackages(
            input.params.sandboxId,
            input.params.packages,
            input.params.language
          );
        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  async validate(input: E2BInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    const sandboxActions: E2BAction[] = [
      "runCode",
      "runCommand",
      "writeFile",
      "readFile",
      "installPackages",
      "closeSandbox",
    ];
    if (sandboxActions.includes(input.action) && !input.params.sandboxId) {
      return false;
    }

    if (input.action === "runCode" && !input.params.code) return false;
    if (input.action === "runCommand" && !input.params.command) return false;
    if (
      input.action === "writeFile" &&
      (!input.params.path || input.params.content === undefined)
    )
      return false;
    if (input.action === "readFile" && !input.params.path) return false;
    if (input.action === "installPackages" && !input.params.packages)
      return false;

    return true;
  }

  private async apiRequest(
    method: string,
    path: string,
    body?: any
  ): Promise<any> {
    const url = `${this.baseUrl}${path}`;
    const headers: Record<string, string> = {
      Authorization: `Bearer ${this.config.apiKey}`,
      "Content-Type": "application/json",
    };

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`E2B API error ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  private async createSandbox(params: Record<string, any>): Promise<E2BOutput> {
    const template = params.template || this.config.defaultTemplate || "base";
    const result = await this.apiRequest("POST", "/sandboxes", {
      template,
      metadata: params.metadata,
    });

    const sandbox: Sandbox = {
      id: result.id,
      template,
      status: "running",
      createdAt: new Date().toISOString(),
    };
    this.sandboxes.set(sandbox.id, sandbox);

    return { success: true, data: { sandbox }, sandboxId: result.id };
  }

  private async closeSandbox(sandboxId: string): Promise<E2BOutput> {
    await this.apiRequest("DELETE", `/sandboxes/${sandboxId}`);
    const sandbox = this.sandboxes.get(sandboxId);
    if (sandbox) sandbox.status = "stopped";
    return { success: true, data: { closed: sandboxId } };
  }

  private async listSandboxes(): Promise<E2BOutput> {
    const active = Array.from(this.sandboxes.values()).filter(
      (s) => s.status === "running"
    );
    return { success: true, data: { sandboxes: active } };
  }

  private async runCode(
    sandboxId: string,
    code: string,
    language?: string
  ): Promise<E2BOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sandboxes/${sandboxId}/execute`,
      {
        code,
        language: language || "python",
        timeout: this.config.maxExecutionTime || 30000,
      }
    );

    const execution: CodeExecutionResult = {
      stdout: result.stdout || "",
      stderr: result.stderr || "",
      exitCode: result.exitCode ?? 0,
      executionTimeMs: result.executionTimeMs || 0,
    };

    return { success: true, data: execution, sandboxId };
  }

  private async runCommand(
    sandboxId: string,
    command: string
  ): Promise<E2BOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sandboxes/${sandboxId}/commands`,
      {
        command,
        timeout: this.config.maxExecutionTime || 30000,
      }
    );

    return {
      success: true,
      data: {
        stdout: result.stdout || "",
        stderr: result.stderr || "",
        exitCode: result.exitCode ?? 0,
      },
      sandboxId,
    };
  }

  private async writeFile(
    sandboxId: string,
    path: string,
    content: string
  ): Promise<E2BOutput> {
    await this.apiRequest("POST", `/sandboxes/${sandboxId}/files`, {
      path,
      content,
    });
    return { success: true, data: { written: path }, sandboxId };
  }

  private async readFile(sandboxId: string, path: string): Promise<E2BOutput> {
    const result = await this.apiRequest(
      "GET",
      `/sandboxes/${sandboxId}/files?path=${encodeURIComponent(path)}`
    );
    return {
      success: true,
      data: { path, content: result.content },
      sandboxId,
    };
  }

  private async installPackages(
    sandboxId: string,
    packages: string[],
    language?: string
  ): Promise<E2BOutput> {
    const lang = language || "python";
    const command =
      lang === "python"
        ? `pip install ${packages.join(" ")}`
        : `npm install ${packages.join(" ")}`;

    return this.runCommand(sandboxId, command);
  }
}

export function createE2BSkill(config: E2BConfig): E2BSkill {
  return new E2BSkill(config);
}
