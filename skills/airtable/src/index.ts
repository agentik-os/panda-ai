import Airtable from "airtable";
import { SkillBase } from "@agentik-os/sdk";

export interface AirtableConfig extends Record<string, unknown> {
  apiKey: string;
}

export interface AirtableInput {
  action: "listRecords" | "getRecord" | "createRecord" | "updateRecord" | "deleteRecord";
  params: {
    baseId?: string;
    tableId?: string;
    recordId?: string;
    fields?: Record<string, any>;
    maxRecords?: number;
  };
  [key: string]: unknown;
}

export interface AirtableOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class AirtableSkill extends SkillBase<AirtableInput, AirtableOutput> {
  readonly id = "airtable";
  readonly name = "Airtable";
  readonly version = "1.0.0";
  readonly description = "Airtable database integration - Tables, records, bases";

  protected config: AirtableConfig;
  private airtable?: Airtable;

  constructor(config: AirtableConfig) {
    super();
    this.config = config;
  }

  private getAirtable(): Airtable {
    if (!this.airtable) {
      this.airtable = new Airtable({ apiKey: this.config.apiKey });
    }
    return this.airtable;
  }

  async execute(input: AirtableInput): Promise<AirtableOutput> {
    try {
      const airtable = this.getAirtable();
      const params = input.params as any;

      const base = airtable.base(params.baseId);
      const table = base(params.tableId);

      switch (input.action) {
        case "listRecords":
          const records = await table.select({
            maxRecords: params.maxRecords || 100,
          }).all();
          return {
            success: true,
            data: {
              records: records.map((r) => ({ id: r.id, fields: r.fields })),
              count: records.length,
            },
          };

        case "getRecord":
          const record = await table.find(params.recordId);
          return {
            success: true,
            data: { record: { id: record.id, fields: record.fields } },
          };

        case "createRecord":
          const newRecord = await table.create(params.fields);
          return {
            success: true,
            data: {
              record: { id: (newRecord as any).id, fields: (newRecord as any).fields },
              recordId: (newRecord as any).id,
            },
          };

        case "updateRecord":
          const updatedRecord = await table.update(params.recordId, params.fields);
          return {
            success: true,
            data: { record: { id: updatedRecord.id, fields: updatedRecord.fields } },
          };

        case "deleteRecord":
          await table.destroy(params.recordId);
          return {
            success: true,
            data: { message: "Record deleted successfully" },
          };

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

  async validate(input: AirtableInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    switch (input.action) {
      case "listRecords":
        return !!(input.params.baseId && input.params.tableId);
      case "getRecord":
      case "deleteRecord":
        return !!(input.params.baseId && input.params.tableId && input.params.recordId);
      case "createRecord":
        return !!(input.params.baseId && input.params.tableId && input.params.fields);
      case "updateRecord":
        return !!(input.params.baseId && input.params.tableId && input.params.recordId && input.params.fields);
      default:
        return true;
    }
  }
}

export function createAirtableSkill(config: AirtableConfig): AirtableSkill {
  return new AirtableSkill(config);
}
