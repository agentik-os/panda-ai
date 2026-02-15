/**
 * Salesforce Contact Operations
 */

import { Connection } from "jsforce";
import { SalesforceOutput } from "./index.js";

export async function getContact(
  conn: Connection,
  params: {
    id: string;
  }
): Promise<SalesforceOutput> {
  if (!params.id) {
    throw new Error("id is required");
  }

  try {
    const contact = await conn.sobject("Contact").retrieve(params.id);

    return {
      success: true,
      data: { contact },
    };
  } catch (error) {
    throw error;
  }
}

export async function createContact(
  conn: Connection,
  params: {
    lastName: string;
    firstName?: string;
    email?: string;
    phone?: string;
    accountId?: string;
  }
): Promise<SalesforceOutput> {
  if (!params.lastName) {
    throw new Error("lastName is required");
  }

  try {
    const result = await conn.sobject("Contact").create({
      LastName: params.lastName,
      FirstName: params.firstName,
      Email: params.email,
      Phone: params.phone,
      AccountId: params.accountId,
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
