import { SkillBase } from "@agentik-os/sdk";
import { Client } from "@hubspot/api-client";

export interface HubSpotConfig extends Record<string, unknown> {
  accessToken: string;
}

export interface HubSpotInput {
  action: "getContact" | "createContact" | "updateContact" | "getCompany" | "createCompany";
  params: {
    contactId?: string;
    companyId?: string;
    email?: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    name?: string;
    domain?: string;
    properties?: Record<string, any>;
  };
  [key: string]: unknown;
}

export interface HubSpotOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class HubSpotSkill extends SkillBase<HubSpotInput, HubSpotOutput> {
  readonly id = "hubspot";
  readonly name = "HubSpot";
  readonly version = "1.0.0";
  readonly description = "HubSpot CRM integration - Contacts, companies, deals";

  protected config: HubSpotConfig;
  private client?: Client;

  constructor(config: HubSpotConfig) {
    super();
    this.config = config;
  }

  private getClient(): Client {
    if (!this.client) {
      this.client = new Client({ accessToken: this.config.accessToken });
    }
    return this.client;
  }

  async execute(input: HubSpotInput): Promise<HubSpotOutput> {
    try {
      const client = this.getClient();
      const params = input.params as any;

      switch (input.action) {
        case "getContact":
          const contact = await client.crm.contacts.basicApi.getById(params.contactId);
          return { success: true, data: { contact } };

        case "createContact":
          const newContact = await client.crm.contacts.basicApi.create({
            properties: {
              email: params.email,
              firstname: params.firstName,
              lastname: params.lastName,
              phone: params.phone,
            },
          });
          return { success: true, data: { contact: newContact, contactId: newContact.id } };

        case "updateContact":
          const updatedContact = await client.crm.contacts.basicApi.update(
            params.contactId,
            { properties: params.properties }
          );
          return { success: true, data: { contact: updatedContact } };

        case "getCompany":
          const company = await client.crm.companies.basicApi.getById(params.companyId);
          return { success: true, data: { company } };

        case "createCompany":
          const newCompany = await client.crm.companies.basicApi.create({
            properties: {
              name: params.name,
              domain: params.domain,
            },
          });
          return { success: true, data: { company: newCompany, companyId: newCompany.id } };

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

  async validate(input: HubSpotInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    switch (input.action) {
      case "getContact":
        return !!input.params.contactId;
      case "createContact":
        return !!input.params.email;
      case "updateContact":
        return !!(input.params.contactId && input.params.properties);
      case "getCompany":
        return !!input.params.companyId;
      case "createCompany":
        return !!input.params.name;
      default:
        return true;
    }
  }
}

export function createHubSpotSkill(config: HubSpotConfig): HubSpotSkill {
  return new HubSpotSkill(config);
}
