/**
 * Composio App Integrations Skill
 *
 * Provides access to 200+ app integrations via the Composio MCP protocol.
 * Agents can interact with GitHub, Slack, Notion, Jira, Gmail, Google Sheets,
 * Trello, Linear, and many more services through a unified API.
 */

import { SkillBase } from "../../../packages/sdk/src/index.js";

export interface ComposioConfig extends Record<string, unknown> {
  apiKey: string;
  entityId?: string;
}

export type ComposioAction =
  | "listApps"
  | "listConnections"
  | "connect"
  | "disconnect"
  | "executeAction"
  | "listActions"
  | "getTriggers"
  | "setupTrigger";

export interface ComposioInput {
  action: ComposioAction;
  params: Record<string, any>;
  [key: string]: unknown;
}

export interface AppInfo {
  id: string;
  name: string;
  description: string;
  category: string;
  connected: boolean;
}

export interface ConnectionInfo {
  id: string;
  appId: string;
  appName: string;
  status: "active" | "expired" | "revoked";
  createdAt: string;
}

export interface ActionResult {
  success: boolean;
  output: any;
  executionTimeMs: number;
}

export interface ComposioOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class ComposioSkill extends SkillBase<ComposioInput, ComposioOutput> {
  readonly id = "composio";
  readonly name = "Composio App Integrations";
  readonly version = "1.0.0";
  readonly description = "Connect to 200+ apps via Composio";

  protected config: ComposioConfig;
  private baseUrl = "https://api.composio.dev/v1";

  constructor(config: ComposioConfig) {
    super();
    this.config = config;
  }

  async execute(input: ComposioInput): Promise<ComposioOutput> {
    try {
      switch (input.action) {
        case "listApps":
          return await this.listApps(input.params);
        case "listConnections":
          return await this.listConnections();
        case "connect":
          return await this.connectApp(input.params.appId, input.params);
        case "disconnect":
          return await this.disconnectApp(input.params.connectionId);
        case "executeAction":
          return await this.executeAction(
            input.params.appId,
            input.params.actionId,
            input.params.input
          );
        case "listActions":
          return await this.listActions(input.params.appId);
        case "getTriggers":
          return await this.getTriggers(input.params.appId);
        case "setupTrigger":
          return await this.setupTrigger(
            input.params.appId,
            input.params.triggerId,
            input.params.config
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

  async validate(input: ComposioInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    if (input.action === "connect" && !input.params.appId) return false;
    if (input.action === "disconnect" && !input.params.connectionId)
      return false;
    if (
      input.action === "executeAction" &&
      (!input.params.appId || !input.params.actionId)
    )
      return false;
    if (input.action === "listActions" && !input.params.appId) return false;
    if (input.action === "getTriggers" && !input.params.appId) return false;
    if (
      input.action === "setupTrigger" &&
      (!input.params.appId || !input.params.triggerId)
    )
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
      "X-Entity-Id": this.config.entityId || "default",
    };

    const options: RequestInit = { method, headers };
    if (body) options.body = JSON.stringify(body);

    const response = await fetch(url, options);
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Composio API error ${response.status}: ${errorText}`);
    }
    return response.json();
  }

  private async listApps(params: Record<string, any>): Promise<ComposioOutput> {
    const query = params.category ? `?category=${params.category}` : "";
    const result = await this.apiRequest("GET", `/apps${query}`);
    return { success: true, data: { apps: result.apps || result } };
  }

  private async listConnections(): Promise<ComposioOutput> {
    const result = await this.apiRequest("GET", "/connections");
    return {
      success: true,
      data: { connections: result.connections || result },
    };
  }

  private async connectApp(
    appId: string,
    params: Record<string, any>
  ): Promise<ComposioOutput> {
    const result = await this.apiRequest("POST", "/connections", {
      appId,
      entityId: this.config.entityId || "default",
      redirectUrl: params.redirectUrl,
      config: params.authConfig,
    });
    return {
      success: true,
      data: {
        connectionId: result.id,
        authUrl: result.authUrl,
        status: result.status,
      },
    };
  }

  private async disconnectApp(connectionId: string): Promise<ComposioOutput> {
    await this.apiRequest("DELETE", `/connections/${connectionId}`);
    return { success: true, data: { disconnected: connectionId } };
  }

  private async executeAction(
    appId: string,
    actionId: string,
    input?: any
  ): Promise<ComposioOutput> {
    const result = await this.apiRequest(
      "POST",
      `/actions/${appId}/${actionId}/execute`,
      {
        entityId: this.config.entityId || "default",
        input: input || {},
      }
    );

    const actionResult: ActionResult = {
      success: result.success ?? true,
      output: result.output || result.data,
      executionTimeMs: result.executionTimeMs || 0,
    };
    return { success: true, data: actionResult };
  }

  private async listActions(appId: string): Promise<ComposioOutput> {
    const result = await this.apiRequest("GET", `/actions/${appId}`);
    return { success: true, data: { actions: result.actions || result } };
  }

  private async getTriggers(appId: string): Promise<ComposioOutput> {
    const result = await this.apiRequest("GET", `/triggers/${appId}`);
    return { success: true, data: { triggers: result.triggers || result } };
  }

  private async setupTrigger(
    appId: string,
    triggerId: string,
    config?: any
  ): Promise<ComposioOutput> {
    const result = await this.apiRequest(
      "POST",
      `/triggers/${appId}/${triggerId}`,
      {
        entityId: this.config.entityId || "default",
        config: config || {},
      }
    );
    return { success: true, data: result };
  }
}

export function createComposioSkill(config: ComposioConfig): ComposioSkill {
  return new ComposioSkill(config);
}
