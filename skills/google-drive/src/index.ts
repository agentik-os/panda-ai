import { SkillBase } from "@agentik-os/sdk";

export interface GoogleDriveConfig extends Record<string, unknown> {
  accessToken: string;
}

export interface GoogleDriveInput {
  action: "listFiles" | "getFile" | "createFile" | "deleteFile";
  params: {
    query?: string;
    maxResults?: number;
    fileId?: string;
    name?: string;
    mimeType?: string;
    content?: string;
  };
  [key: string]: unknown;
}

export interface GoogleDriveOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class GoogleDriveSkill extends SkillBase<GoogleDriveInput, GoogleDriveOutput> {
  readonly id = "google-drive";
  readonly name = "Google Drive";
  readonly version = "1.0.0";
  readonly description = "Google Drive integration - Files, folders, sharing";

  protected config: GoogleDriveConfig;

  constructor(config: GoogleDriveConfig) {
    super();
    this.config = config;
  }

  async execute(input: GoogleDriveInput): Promise<GoogleDriveOutput> {
    try {
      const params = input.params as any;
      const baseUrl = "https://www.googleapis.com/drive/v3";
      const headers = {
        "Authorization": `Bearer ${this.config.accessToken}`,
        "Content-Type": "application/json",
      };

      switch (input.action) {
        case "listFiles":
          const query = params.query || "";
          const listUrl = `${baseUrl}/files?q=${encodeURIComponent(query)}&pageSize=${params.maxResults || 10}`;
          const listRes = await fetch(listUrl, { headers });
          const listData = await listRes.json();
          return { success: true, data: listData };

        case "getFile":
          const getUrl = `${baseUrl}/files/${params.fileId}?fields=*`;
          const getRes = await fetch(getUrl, { headers });
          const getData = await getRes.json();
          return { success: true, data: getData };

        case "createFile":
          const metadata = {
            name: params.name,
            mimeType: params.mimeType,
          };
          const createRes = await fetch(`${baseUrl}/files`, {
            method: "POST",
            headers,
            body: JSON.stringify(metadata),
          });
          const createData = await createRes.json();
          return { success: true, data: createData };

        case "deleteFile":
          const deleteUrl = `${baseUrl}/files/${params.fileId}`;
          await fetch(deleteUrl, {
            method: "DELETE",
            headers,
          });
          return { success: true, data: { message: "File deleted successfully" } };

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

  async validate(input: GoogleDriveInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    switch (input.action) {
      case "listFiles":
        return true;
      case "getFile":
      case "deleteFile":
        return !!input.params.fileId;
      case "createFile":
        return !!(input.params.name && input.params.mimeType);
      default:
        return true;
    }
  }
}

export function createGoogleDriveSkill(config: GoogleDriveConfig): GoogleDriveSkill {
  return new GoogleDriveSkill(config);
}
