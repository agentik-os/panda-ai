/**
 * Notion Page Operations
 */

import { Client } from "@notionhq/client";
import { NotionOutput } from "./index.js";

export async function createPage(
  notion: Client,
  params: {
    parent: any;
    properties: any;
    children?: any[];
  }
): Promise<NotionOutput> {
  if (!params.parent || !params.properties) {
    throw new Error("parent and properties are required");
  }

  try {
    const response = await notion.pages.create({
      parent: params.parent,
      properties: params.properties,
      children: params.children,
    });

    return {
      success: true,
      data: { page: response },
    };
  } catch (error) {
    throw error;
  }
}

export async function getPage(
  notion: Client,
  params: {
    pageId: string;
  }
): Promise<NotionOutput> {
  if (!params.pageId) {
    throw new Error("pageId is required");
  }

  try {
    const response = await notion.pages.retrieve({
      page_id: params.pageId,
    });

    return {
      success: true,
      data: { page: response },
    };
  } catch (error) {
    throw error;
  }
}

export async function updatePage(
  notion: Client,
  params: {
    pageId: string;
    properties: any;
  }
): Promise<NotionOutput> {
  if (!params.pageId || !params.properties) {
    throw new Error("pageId and properties are required");
  }

  try {
    const response = await notion.pages.update({
      page_id: params.pageId,
      properties: params.properties,
    });

    return {
      success: true,
      data: { page: response },
    };
  } catch (error) {
    throw error;
  }
}

export async function archivePage(
  notion: Client,
  params: {
    pageId: string;
  }
): Promise<NotionOutput> {
  if (!params.pageId) {
    throw new Error("pageId is required");
  }

  try {
    const response = await notion.pages.update({
      page_id: params.pageId,
      archived: true,
    });

    return {
      success: true,
      data: {
        archived: true,
        pageId: params.pageId,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function getPageBlocks(
  notion: Client,
  params: {
    blockId: string;
  }
): Promise<NotionOutput> {
  if (!params.blockId) {
    throw new Error("blockId is required");
  }

  try {
    const response = await notion.blocks.children.list({
      block_id: params.blockId,
    });

    return {
      success: true,
      data: {
        blocks: response.results,
        hasMore: response.has_more,
        nextCursor: response.next_cursor,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function appendBlocks(
  notion: Client,
  params: {
    blockId: string;
    children: any[];
  }
): Promise<NotionOutput> {
  if (!params.blockId || !params.children) {
    throw new Error("blockId and children are required");
  }

  try {
    const response = await notion.blocks.children.append({
      block_id: params.blockId,
      children: params.children,
    });

    return {
      success: true,
      data: {
        blocks: response.results,
      },
    };
  } catch (error) {
    throw error;
  }
}

export async function search(
  notion: Client,
  params: {
    query?: string;
    filter?: any;
    pageSize?: number;
  }
): Promise<NotionOutput> {
  try {
    const response = await notion.search({
      query: params.query,
      filter: params.filter,
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
