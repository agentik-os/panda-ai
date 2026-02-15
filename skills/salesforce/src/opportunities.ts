/**
 * Salesforce Opportunity Operations
 */

import { Connection } from "jsforce";
import { SalesforceOutput } from "./index.js";

export async function getOpportunity(
  conn: Connection,
  params: {
    id: string;
  }
): Promise<SalesforceOutput> {
  if (!params.id) {
    throw new Error("id is required");
  }

  try {
    const opportunity = await conn.sobject("Opportunity").retrieve(params.id);

    return {
      success: true,
      data: { opportunity },
    };
  } catch (error) {
    throw error;
  }
}

export async function createOpportunity(
  conn: Connection,
  params: {
    name: string;
    accountId: string;
    closeDate: string;
    stage: string;
    amount?: number;
  }
): Promise<SalesforceOutput> {
  if (!params.name || !params.accountId || !params.closeDate || !params.stage) {
    throw new Error("name, accountId, closeDate, and stage are required");
  }

  try {
    const result = await conn.sobject("Opportunity").create({
      Name: params.name,
      AccountId: params.accountId,
      CloseDate: params.closeDate,
      StageName: params.stage,
      Amount: params.amount,
    });

    return {
      success: true,
      data: {
        id: (result as any).id,
        success: (result as any).success,
      },
    };
  } catch (error) {
    throw error;
  }
}
