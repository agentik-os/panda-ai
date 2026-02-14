/**
 * LinkedIn API Skill
 */

import axios from "axios";
import { SkillBase } from "../../../packages/sdk/src/index.js";

export interface LinkedInConfig extends Record<string, unknown> {
  clientId: string;
  clientSecret: string;
  accessToken: string;
}

export interface LinkedInInput {
  action: "post" | "getProfile" | "share";
  params: Record<string, any>;
  [key: string]: unknown;
}

export interface LinkedInOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class LinkedInSkill extends SkillBase<LinkedInInput, LinkedInOutput> {
  readonly id = "linkedin";
  readonly name = "LinkedIn API";
  readonly version = "1.0.0";
  readonly description =
    "Professional networking and content sharing on LinkedIn";

  protected config: LinkedInConfig;
  private baseUrl = "https://api.linkedin.com/v2";

  constructor(config: LinkedInConfig) {
    super();
    this.config = config;
  }

  async execute(input: LinkedInInput): Promise<LinkedInOutput> {
    try {
      switch (input.action) {
        case "post":
          return await this.createPost(input.params);
        case "getProfile":
          return await this.getProfile();
        case "share":
          return await this.shareContent(input.params);
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

  async validate(input: LinkedInInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }

  private async createPost(params: any): Promise<LinkedInOutput> {
    const response = await axios.post(
      `${this.baseUrl}/ugcPosts`,
      {
        author: `urn:li:person:${params.authorId}`,
        lifecycleState: "PUBLISHED",
        specificContent: {
          "com.linkedin.ugc.ShareContent": {
            shareCommentary: {
              text: params.text,
            },
            shareMediaCategory: "NONE",
          },
        },
        visibility: {
          "com.linkedin.ugc.MemberNetworkVisibility": "PUBLIC",
        },
      },
      {
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    return { success: true, data: response.data };
  }

  private async getProfile(): Promise<LinkedInOutput> {
    const response = await axios.get(`${this.baseUrl}/me`, {
      headers: { Authorization: `Bearer ${this.config.accessToken}` },
    });
    return { success: true, data: response.data };
  }

  private async shareContent(params: any): Promise<LinkedInOutput> {
    return this.createPost(params);
  }
}

export function createLinkedInSkill(config: LinkedInConfig): LinkedInSkill {
  return new LinkedInSkill(config);
}
