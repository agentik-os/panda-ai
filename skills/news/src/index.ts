/**
 * News Aggregator Skill
 */

import axios from 'axios';
import { SkillBase, SkillInput } from '../../../packages/sdk/src/index.js';

export interface NewsConfig {
  apiKey: string;
  country?: string;
  language?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface NewsInput extends SkillInput {
  action: 'getTopHeadlines' | 'searchNews' | 'getSources';
  params: Record<string, any>;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface NewsOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export class NewsSkill extends SkillBase<NewsInput, NewsOutput> {
  readonly id = 'news';
  readonly name = 'News Aggregator';
  readonly version = '1.0.0';
  readonly description = 'Fetch news articles and headlines from NewsAPI';

  private newsConfig: NewsConfig;
  private baseUrl = 'https://newsapi.org/v2';

  constructor(config: NewsConfig) {
    super();
    this.newsConfig = config;
  }

  async execute(input: NewsInput): Promise<NewsOutput> {
    try {
      switch (input.action) {
        case 'getTopHeadlines':
          const headlines = await axios.get(`${this.baseUrl}/top-headlines`, {
            params: {
              country: input.params.country || this.newsConfig.country || 'us',
              category: input.params.category,
              pageSize: input.params.pageSize || 20,
              apiKey: this.newsConfig.apiKey
            }
          });
          return { success: true, data: headlines.data };
          
        case 'searchNews':
          const search = await axios.get(`${this.baseUrl}/everything`, {
            params: {
              q: input.params.query,
              from: input.params.from,
              to: input.params.to,
              language: input.params.language || this.newsConfig.language || 'en',
              sortBy: input.params.sortBy || 'publishedAt',
              pageSize: input.params.pageSize || 20,
              apiKey: this.newsConfig.apiKey
            }
          });
          return { success: true, data: search.data };
          
        case 'getSources':
          const sources = await axios.get(`${this.baseUrl}/sources`, {
            params: {
              language: input.params.language || this.newsConfig.language || 'en',
              country: input.params.country || this.newsConfig.country,
              category: input.params.category,
              apiKey: this.newsConfig.apiKey
            }
          });
          return { success: true, data: sources.data };
          
        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async validate(input: NewsInput): Promise<boolean> {
    return !!input?.action && !!input?.params;
  }
}

export function createNewsSkill(config: NewsConfig): NewsSkill {
  return new NewsSkill(config);
}
