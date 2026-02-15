/**
 * Salesforce Skill
 */

import { Connection } from "jsforce";
import { SkillBase } from "@agentik-os/sdk";
import * as accounts from "./accounts.js";
import * as contacts from "./contacts.js";
import * as leads from "./leads.js";
import * as opportunities from "./opportunities.js";

export interface SalesforceConfig extends Record<string, unknown> {
  instanceUrl: string;
  accessToken: string;
}

export interface SalesforceInput {
  action:
    | "query"
    | "getAccount"
    | "createAccount"
    | "updateAccount"
    | "getContact"
    | "createContact"
    | "getLead"
    | "createLead"
    | "getOpportunity"
    | "createOpportunity";
  params: {
    // Query params
    soql?: string;

    // Common params
    id?: string;

    // Account params
    name?: string;
    industry?: string;
    phone?: string;
    website?: string;
    updates?: Record<string, any>;

    // Contact params
    lastName?: string;
    firstName?: string;
    email?: string;
    accountId?: string;

    // Lead params
    company?: string;
    status?: string;

    // Opportunity params
    closeDate?: string;
    stage?: string;
    amount?: number;
  };
  [key: string]: unknown;
}

export interface SalesforceOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class SalesforceSkill extends SkillBase<
  SalesforceInput,
  SalesforceOutput
> {
  readonly id = "salesforce";
  readonly name = "Salesforce";
  readonly version = "1.0.0";
  readonly description =
    "Salesforce CRM integration - Accounts, contacts, leads, opportunities";

  protected config: SalesforceConfig;
  private conn?: Connection;

  constructor(config: SalesforceConfig) {
    super();
    this.config = config;
  }

  private getConnection(): Connection {
    if (!this.conn) {
      this.conn = new Connection({
        instanceUrl: this.config.instanceUrl,
        accessToken: this.config.accessToken,
      });
    }
    return this.conn;
  }

  async execute(input: SalesforceInput): Promise<SalesforceOutput> {
    try {
      const conn = this.getConnection();
      // Runtime validation in validate() ensures required params exist per action
      const params = input.params as any;

      switch (input.action) {
        case "query":
          const result = await conn.query(params.soql);
          return {
            success: true,
            data: {
              records: result.records,
              totalSize: result.totalSize,
            },
          };

        case "getAccount":
          return await accounts.getAccount(conn, params);

        case "createAccount":
          return await accounts.createAccount(conn, params);

        case "updateAccount":
          return await accounts.updateAccount(conn, params);

        case "getContact":
          return await contacts.getContact(conn, params);

        case "createContact":
          return await contacts.createContact(conn, params);

        case "getLead":
          return await leads.getLead(conn, params);

        case "createLead":
          return await leads.createLead(conn, params);

        case "getOpportunity":
          return await opportunities.getOpportunity(conn, params);

        case "createOpportunity":
          return await opportunities.createOpportunity(conn, params);

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

  async validate(input: SalesforceInput): Promise<boolean> {
    if (!input?.action || !input?.params) {
      return false;
    }

    // Validate action-specific required params
    switch (input.action) {
      case "query":
        return !!input.params.soql;

      case "getAccount":
      case "getContact":
      case "getLead":
      case "getOpportunity":
        return !!input.params.id;

      case "createAccount":
        return !!input.params.name;

      case "updateAccount":
        return !!(input.params.id && input.params.updates);

      case "createContact":
        return !!input.params.lastName;

      case "createLead":
        return !!(input.params.lastName && input.params.company);

      case "createOpportunity":
        return !!(
          input.params.name &&
          input.params.accountId &&
          input.params.closeDate &&
          input.params.stage
        );

      default:
        return true;
    }
  }
}

export function createSalesforceSkill(
  config: SalesforceConfig
): SalesforceSkill {
  return new SalesforceSkill(config);
}
