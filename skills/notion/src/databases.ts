/**
 * Notion Database Operations
 */

import { Client } from "@notionhq/client";
import { NotionOutput } from "./index.js";

export async function listDatabases(
  notion: Client,
  params: {
    pageSize?: number;
  }
): Promise<NotionOutput> {
  try {
    const response = await notion.search({
      filter: { property: "object", value: "database" },
      page_size: params.pageSize || 100,
    });

    return {
      success: true,
      data: {
        databases: response.results,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getDatabase(
  notion: Client,
  params: {
    databaseId: string;
  }
): Promise<NotionOutput> {
  if (!params.databaseId) {
    throw new Error("databaseId is required");
  }

  try {
    const response = await notion.databases.retrieve({
      database_id: params.databaseId,
    });

    return {
      success: true,
      data: { database: response },
    };
  } catch (error) {
    throw error;
  }
}

export async function queryDatabase(
  notion: Client,
  params: {
    databaseId: string;
    filter?: any;
    sorts?: any[];
    pageSize?: number;
  }
): Promise<NotionOutput> {
  if (!params.databaseId) {
    throw new Error("databaseId is required");
  }

  try {
    const response = await notion.databases.query({
      database_id: params.databaseId,
      filter: params.filter,
      sorts: params.sorts,
      page_size: params.pageSize || 100,
    });

    return {
      success: true,
      data: {
        results: response.results,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
      },
    };
  } catch (error) {
    throw error;
  }
}
