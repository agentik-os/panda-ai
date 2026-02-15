import { SkillBase } from "@agentik-os/sdk";

export interface FigmaConfig extends Record<string, unknown> {
  accessToken: string;
}

export interface FigmaInput {
  action: "getFile" | "getComments" | "exportImage";
  params: {
    fileKey?: string;
    nodeIds?: string[];
    format?: string;
  };
  [key: string]: unknown;
}

export interface FigmaOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class FigmaSkill extends SkillBase<FigmaInput, FigmaOutput> {
  readonly id = "figma";
  readonly name = "Figma";
  readonly version = "1.0.0";
  readonly description = "Figma design integration - Files, comments, exports";

  protected config: FigmaConfig;

  constructor(config: FigmaConfig) {
    super();
    this.config = config;
  }

  async execute(input: FigmaInput): Promise<FigmaOutput> {
    try {
      const params = input.params as any;
      const baseUrl = "https://api.figma.com/v1";
      const headers = {
        "X-Figma-Token": this.config.accessToken,
      };

      switch (input.action) {
        case "getFile":
          const fileRes = await fetch(`${baseUrl}/files/${params.fileKey}`, { headers });
          const fileData = await fileRes.json();
          return { success: true, data: fileData };

        case "getComments":
          const commentsRes = await fetch(`${baseUrl}/files/${params.fileKey}/comments`, { headers });
          const commentsData = await commentsRes.json();
          return { success: true, data: commentsData };

        case "exportImage":
          const format = params.format || "png";
          const nodeIds = params.nodeIds.join(",");
          const exportRes = await fetch(
            `${baseUrl}/images/${params.fileKey}?ids=${nodeIds}&format=${format}`,
            { headers }
          );
          const exportData = await exportRes.json();
          return { success: true, data: exportData };

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

  async validate(input: FigmaInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    switch (input.action) {
      case "getFile":
      case "getComments":
        return !!input.params.fileKey;
      case "exportImage":
        return !!(input.params.fileKey && input.params.nodeIds);
      default:
        return true;
    }
  }
}

export function createFigmaSkill(config: FigmaConfig): FigmaSkill {
  return new FigmaSkill(config);
}
