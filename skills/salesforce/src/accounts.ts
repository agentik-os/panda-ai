/**
 * Salesforce Account Operations
 */

import { Connection } from "jsforce";
import { SalesforceOutput } from "./index.js";

export async function getAccount(
  conn: Connection,
  params: {
    id: string;
  }
): Promise<SalesforceOutput> {
  if (!params.id) {
    throw new Error("id is required");
  }

  try {
    const account = await conn.sobject("Account").retrieve(params.id);

    return {
      success: true,
      data: { account },
    };
  } catch (error) {
    throw error;
  }
}

export async function createAccount(
  conn: Connection,
  params: {
    name: string;
    industry?: string;
    phone?: string;
    website?: string;
  }
): Promise<SalesforceOutput> {
  if (!params.name) {
    throw new Error("name is required");
  }

  try {
    const result = await conn.sobject("Account").create({
      Name: params.name,
      Industry: params.industry,
      Phone: params.phone,
      Website: params.website,
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

export async function updateAccount(
  conn: Connection,
  params: {
    id: string;
    updates: Record<string, any>;
  }
): Promise<SalesforceOutput> {
  if (!params.id || !params.updates) {
    throw new Error("id and updates are required");
  }

  try {
    const result = await conn.sobject("Account").update({
      Id: params.id,
      ...params.updates,
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
