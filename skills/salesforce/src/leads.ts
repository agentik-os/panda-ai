/**
 * Salesforce Lead Operations
 */

import { Connection } from "jsforce";
import { SalesforceOutput } from "./index.js";

export async function getLead(
  conn: Connection,
  params: {
    id: string;
  }
): Promise<SalesforceOutput> {
  if (!params.id) {
    throw new Error("id is required");
  }

  try {
    const lead = await conn.sobject("Lead").retrieve(params.id);

    return {
      success: true,
      data: { lead },
    };
  } catch (error) {
    throw error;
  }
}

export async function createLead(
  conn: Connection,
  params: {
    lastName: string;
    company: string;
    firstName?: string;
    email?: string;
    status?: string;
  }
): Promise<SalesforceOutput> {
  if (!params.lastName || !params.company) {
    throw new Error("lastName and company are required");
  }

  try {
    const result = await conn.sobject("Lead").create({
      LastName: params.lastName,
      Company: params.company,
      FirstName: params.firstName,
      Email: params.email,
      Status: params.status || "Open - Not Contacted",
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
