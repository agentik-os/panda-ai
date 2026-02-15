import { SkillBase } from "@agentik-os/sdk";

export interface YouTubeConfig extends Record<string, unknown> {
  apiKey: string;
}

export interface YouTubeInput {
  action: "searchVideos" | "getVideo" | "getChannel";
  params: {
    query?: string;
    maxResults?: number;
    videoId?: string;
    channelId?: string;
  };
  [key: string]: unknown;
}

export interface YouTubeOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown;
}

export class YouTubeSkill extends SkillBase<YouTubeInput, YouTubeOutput> {
  readonly id = "youtube";
  readonly name = "YouTube";
  readonly version = "1.0.0";
  readonly description = "YouTube integration - Videos, playlists, channels";

  protected config: YouTubeConfig;

  constructor(config: YouTubeConfig) {
    super();
    this.config = config;
  }

  async execute(input: YouTubeInput): Promise<YouTubeOutput> {
    try {
      const params = input.params as any;
      const baseUrl = "https://www.googleapis.com/youtube/v3";
      const apiKey = this.config.apiKey;

      switch (input.action) {
        case "searchVideos":
          const searchUrl = `${baseUrl}/search?part=snippet&q=${encodeURIComponent(params.query)}&key=${apiKey}&maxResults=${params.maxResults || 10}&type=video`;
          const searchRes = await fetch(searchUrl);
          const searchData = await searchRes.json();
          return { success: true, data: searchData };

        case "getVideo":
          const videoUrl = `${baseUrl}/videos?part=snippet,statistics&id=${params.videoId}&key=${apiKey}`;
          const videoRes = await fetch(videoUrl);
          const videoData = await videoRes.json();
          return { success: true, data: videoData };

        case "getChannel":
          const channelUrl = `${baseUrl}/channels?part=snippet,statistics&id=${params.channelId}&key=${apiKey}`;
          const channelRes = await fetch(channelUrl);
          const channelData = await channelRes.json();
          return { success: true, data: channelData };

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

  async validate(input: YouTubeInput): Promise<boolean> {
    if (!input?.action || !input?.params) return false;

    switch (input.action) {
      case "searchVideos":
        return !!input.params.query;
      case "getVideo":
        return !!input.params.videoId;
      case "getChannel":
        return !!input.params.channelId;
      default:
        return true;
    }
  }
}

export function createYouTubeSkill(config: YouTubeConfig): YouTubeSkill {
  return new YouTubeSkill(config);
}
