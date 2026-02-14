/**
 * Browserbase Browser Automation Skill
 *
 * Provides cloud-based browser automation via the Browserbase MCP protocol.
 * Agents can navigate pages, take screenshots, extract content, fill forms,
 * and interact with any web page programmatically.
 */

import { SkillBase } from "../../../packages/sdk/src/index.js";

export interface BrowserbaseConfig extends Record<string, unknown> {
  apiKey: string;
  projectId: string;
  timeout?: number;
}

export type BrowserbaseAction =
  | "navigate"
  | "screenshot"
  | "extractContent"
  | "click"
  | "fillForm"
  | "evaluate"
  | "listSessions"
  | "createSession"
  | "closeSession";

export interface BrowserbaseInput {
  action: BrowserbaseAction;
  params: Record<string, any>;
  [key: string]: unknown;
}

export interface BrowserbaseOutput {
  success: boolean;
  data?: any;
  error?: string;
  sessionId?: string;
  [key: string]: unknown;
}

interface BrowserSession {
  id: string;
  status: "active" | "closed";
  createdAt: string;
  url?: string;
}

export class BrowserbaseSkill extends SkillBase<
  BrowserbaseInput,
  BrowserbaseOutput
> {
  readonly id = "browserbase";
  readonly name = "Browserbase Browser Automation";
  readonly version = "1.0.0";
  readonly description =
    "Cloud browser automation - navigate, screenshot, extract, interact";

  protected config: BrowserbaseConfig;
  private baseUrl = "https://api.browserbase.com/v1";
  private sessions: Map<string, BrowserSession> = new Map();

  constructor(config: BrowserbaseConfig) {
    super();
    this.config = config;
  }

  async execute(input: BrowserbaseInput): Promise<BrowserbaseOutput> {
    try {
      switch (input.action) {
        case "createSession":
          return await this.createSession(input.params);
        case "closeSession":
          return await this.closeSession(input.params.sessionId);
        case "listSessions":
          return await this.listSessions();
        case "navigate":
          return await this.navigate(input.params.sessionId, input.params.url);
        case "screenshot":
          return await this.takeScreenshot(
            input.params.sessionId,
            input.params
          );
        case "extractContent":
          return await this.extractContent(
            input.params.sessionId,
            input.params.selector
          );
        case "click":
          return await this.clickElement(
            input.params.sessionId,
            input.params.selector
          );
        case "fillForm":
          return await this.fillForm(
            input.params.sessionId,
            input.params.fields
          );
        case "evaluate":
          return await this.evaluateScript(
            input.params.sessionId,
            input.params.script
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

  async validate(input: BrowserbaseInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    const sessionActions: BrowserbaseAction[] = [
      "navigate",
      "screenshot",
      "extractContent",
      "click",
      "fillForm",
      "evaluate",
      "closeSession",
    ];
    if (sessionActions.includes(input.action) && !input.params.sessionId) {
      return false;
    }

    if (input.action === "navigate" && !input.params.url) return false;
    if (input.action === "click" && !input.params.selector) return false;
    if (input.action === "fillForm" && !input.params.fields) return false;
    if (input.action === "evaluate" && !input.params.script) return false;

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
      "X-Project-Id": this.config.projectId,
    };

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Browserbase API error ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  private async createSession(
    params: Record<string, any>
  ): Promise<BrowserbaseOutput> {
    const result = await this.apiRequest("POST", "/sessions", {
      projectId: this.config.projectId,
      browserSettings: {
        viewport: params.viewport || { width: 1280, height: 720 },
      },
    });

    const session: BrowserSession = {
      id: result.id,
      status: "active",
      createdAt: new Date().toISOString(),
    };
    this.sessions.set(session.id, session);

    return { success: true, data: { session }, sessionId: result.id };
  }

  private async closeSession(sessionId: string): Promise<BrowserbaseOutput> {
    await this.apiRequest("DELETE", `/sessions/${sessionId}`);
    const session = this.sessions.get(sessionId);
    if (session) session.status = "closed";
    return { success: true, data: { closed: sessionId } };
  }

  private async listSessions(): Promise<BrowserbaseOutput> {
    const activeSessions = Array.from(this.sessions.values()).filter(
      (s) => s.status === "active"
    );
    return { success: true, data: { sessions: activeSessions } };
  }

  private async navigate(
    sessionId: string,
    url: string
  ): Promise<BrowserbaseOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sessions/${sessionId}/navigate`,
      {
        url,
        timeout: this.config.timeout || 30000,
      }
    );
    const session = this.sessions.get(sessionId);
    if (session) session.url = url;
    return { success: true, data: result, sessionId };
  }

  private async takeScreenshot(
    sessionId: string,
    params: Record<string, any>
  ): Promise<BrowserbaseOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sessions/${sessionId}/screenshot`,
      {
        fullPage: params.fullPage ?? false,
        format: params.format || "png",
        selector: params.selector,
      }
    );
    return { success: true, data: result, sessionId };
  }

  private async extractContent(
    sessionId: string,
    selector?: string
  ): Promise<BrowserbaseOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sessions/${sessionId}/extract`,
      {
        selector: selector || "body",
      }
    );
    return { success: true, data: result, sessionId };
  }

  private async clickElement(
    sessionId: string,
    selector: string
  ): Promise<BrowserbaseOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sessions/${sessionId}/click`,
      {
        selector,
      }
    );
    return { success: true, data: result, sessionId };
  }

  private async fillForm(
    sessionId: string,
    fields: Record<string, string>
  ): Promise<BrowserbaseOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sessions/${sessionId}/fill`,
      {
        fields,
      }
    );
    return { success: true, data: result, sessionId };
  }

  private async evaluateScript(
    sessionId: string,
    script: string
  ): Promise<BrowserbaseOutput> {
    const result = await this.apiRequest(
      "POST",
      `/sessions/${sessionId}/evaluate`,
      {
        expression: script,
      }
    );
    return { success: true, data: result, sessionId };
  }
}

export function createBrowserbaseSkill(
  config: BrowserbaseConfig
): BrowserbaseSkill {
  return new BrowserbaseSkill(config);
}
