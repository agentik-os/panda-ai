/**
 * Web Search Skill
 *
 * Provides web search capability using Brave Search API with Serper fallback.
 * Implements rate limiting and result formatting.
 */

import axios, { type AxiosInstance } from 'axios';
import * as cheerio from 'cheerio';
import { SkillBase, type SkillInput, type SkillOutput } from '../../packages/sdk/src/index.js';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * Search input extending SkillInput
 */
export interface SearchInput extends SkillInput {
  /** Search query string */
  query: string;
  /** Maximum number of results (default: 10) */
  maxResults?: number;
  /** Safe search level */
  safeSearch?: 'strict' | 'moderate' | 'off';
  /** Country code for localized results */
  country?: string;
  /** Language code */
  language?: string;
}

/**
 * Search output extending SkillOutput
 */
export interface SearchOutput extends SkillOutput {
  /** Array of search results */
  results: SearchResult[];
  /** Total number of results found */
  totalResults?: number;
  /** Search query used */
  query: string;
  /** Provider used (brave or serper) */
  provider: 'brave' | 'serper';
  /** Search execution time in ms */
  executionTime: number;
}

/**
 * Individual search result
 */
export interface SearchResult {
  /** Result title */
  title: string;
  /** Result URL */
  url: string;
  /** Result description/snippet */
  description: string;
  /** Timestamp if available */
  timestamp?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Legacy type aliases for backward compatibility
 */
export type SearchQuery = SearchInput;
export type WebSearchResponse = SearchOutput;

/**
 * Skill configuration
 */
export interface WebSearchConfig {
  /** Brave Search API key */
  braveApiKey?: string;
  /** Serper API key (fallback) */
  serperApiKey?: string;
  /** Default max results */
  maxResults?: number;
  /** Request timeout in ms */
  timeout?: number;
  /** Enable rate limiting */
  enableRateLimit?: boolean;
}

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 3600000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter(time => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// ============================================================================
// Web Search Skill Class
// ============================================================================

export class WebSearchSkill extends SkillBase<SearchInput, SearchOutput> {
  // Required metadata
  readonly id = 'web-search';
  readonly name = 'Web Search';
  readonly description = 'Search the web using Brave Search API with fallback to Serper';
  readonly version = '1.0.0';

  // Optional metadata
  readonly author = 'Agentik OS';
  readonly permissions = ['network:http', 'network:https', 'api:brave', 'api:serper'];
  readonly tags = ['search', 'web', 'api'];

  // Private instances
  private httpClient: AxiosInstance;
  private rateLimiter: RateLimiter;

  constructor(config: WebSearchConfig = {}) {
    // Merge config with environment variables
    const mergedConfig = {
      braveApiKey: config.braveApiKey || process.env.BRAVE_API_KEY || '',
      serperApiKey: config.serperApiKey || process.env.SERPER_API_KEY || '',
      maxResults: config.maxResults || 10,
      timeout: config.timeout || 5000,
      enableRateLimit: config.enableRateLimit ?? true,
    };

    // Call parent constructor
    super(mergedConfig);

    // Initialize HTTP client
    this.httpClient = axios.create({
      timeout: this.config.timeout as number,
    });

    // Initialize rate limiter
    this.rateLimiter = new RateLimiter(100, 3600000); // 100 req/hour
  }

  /**
   * Execute search (SkillBase implementation)
   */
  async execute(input: SearchInput): Promise<SearchOutput> {
    const startTime = Date.now();

    // Validate input
    if (!input.query || input.query.trim().length === 0) {
      return {
        success: false,
        error: 'Search query cannot be empty',
        results: [],
        query: '',
        provider: 'brave',
        executionTime: Date.now() - startTime,
      };
    }

    // Check rate limit
    const enableRateLimit = this.config.enableRateLimit ?? true;
    if (enableRateLimit && !this.rateLimiter.canMakeRequest()) {
      return {
        success: false,
        error: `Rate limit exceeded. Remaining: ${this.rateLimiter.getRemainingRequests()}`,
        results: [],
        query: input.query,
        provider: 'brave',
        executionTime: Date.now() - startTime,
      };
    }

    // Record request
    if (enableRateLimit) {
      this.rateLimiter.recordRequest();
    }

    const braveApiKey = this.config.braveApiKey as string;
    const serperApiKey = this.config.serperApiKey as string;

    // Try Brave Search first
    if (braveApiKey) {
      try {
        const results = await this.searchWithBrave(input);
        return {
          success: true,
          results,
          query: input.query,
          provider: 'brave',
          executionTime: Date.now() - startTime,
        };
      } catch (error) {
        this.log('warn', 'Brave Search failed, trying Serper', {
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fallback to Serper
    if (serperApiKey) {
      try {
        const results = await this.searchWithSerper(input);
        return {
          success: true,
          results,
          query: input.query,
          provider: 'serper',
          executionTime: Date.now() - startTime,
        };
      } catch (error) {
        return {
          success: false,
          error: `All search providers failed: ${error}`,
          results: [],
          query: input.query,
          provider: 'serper',
          executionTime: Date.now() - startTime,
        };
      }
    }

    return {
      success: false,
      error: 'No search API keys configured. Set BRAVE_API_KEY or SERPER_API_KEY',
      results: [],
      query: input.query,
      provider: 'brave',
      executionTime: Date.now() - startTime,
    };
  }

  /**
   * Convenience method for backward compatibility
   * @deprecated Use execute() instead
   */
  async search(query: SearchQuery): Promise<WebSearchResponse> {
    const result = await this.execute(query);

    // Throw error for backward compatibility if not successful
    if (!result.success) {
      throw new Error(result.error || 'Search failed');
    }

    return result;
  }

  /**
   * Search using Brave Search API
   */
  private async searchWithBrave(input: SearchInput): Promise<SearchResult[]> {
    const maxResults = this.config.maxResults as number;
    const params = {
      q: input.query,
      count: input.maxResults || maxResults,
      safesearch: input.safeSearch || 'moderate',
      ...(input.country && { country: input.country }),
      ...(input.language && { lang: input.language }),
    };

    const response = await this.httpClient.get(
      'https://api.search.brave.com/res/v1/web/search',
      {
        params,
        headers: {
          'X-Subscription-Token': this.config.braveApiKey as string,
          Accept: 'application/json',
        },
      }
    );

    return this.parseBraveResults(response.data);
  }

  /**
   * Search using Serper API
   */
  private async searchWithSerper(input: SearchInput): Promise<SearchResult[]> {
    const maxResults = this.config.maxResults as number;
    const payload = {
      q: input.query,
      num: input.maxResults || maxResults,
      ...(input.country && { gl: input.country }),
      ...(input.language && { hl: input.language }),
    };

    const response = await this.httpClient.post(
      'https://google.serper.dev/search',
      payload,
      {
        headers: {
          'X-API-KEY': this.config.serperApiKey as string,
          'Content-Type': 'application/json',
        },
      }
    );

    return this.parseSerperResults(response.data);
  }

  /**
   * Parse Brave Search API response
   */
  private parseBraveResults(data: any): SearchResult[] {
    if (!data.web?.results) {
      return [];
    }

    return data.web.results.map((result: any) => ({
      title: this.cleanHtml(result.title || ''),
      url: result.url || '',
      description: this.cleanHtml(result.description || ''),
      timestamp: result.age,
      metadata: {
        language: result.language,
        family_friendly: result.family_friendly,
      },
    }));
  }

  /**
   * Parse Serper API response
   */
  private parseSerperResults(data: any): SearchResult[] {
    if (!data.organic) {
      return [];
    }

    return data.organic.map((result: any) => ({
      title: this.cleanHtml(result.title || ''),
      url: result.link || '',
      description: this.cleanHtml(result.snippet || ''),
      metadata: {
        position: result.position,
      },
    }));
  }

  /**
   * Clean HTML tags and entities from text
   */
  private cleanHtml(html: string): string {
    const $ = cheerio.load(html);
    return $.text().trim();
  }

  /**
   * Get remaining rate limit quota
   */
  getRemainingQuota(): number {
    return this.rateLimiter.getRemainingRequests();
  }
}

// ============================================================================
// Exported Functions (for WASM/MCP integration)
// ============================================================================

let skillInstance: WebSearchSkill | null = null;

/**
 * Initialize the web search skill
 */
export function initialize(config?: WebSearchConfig): void {
  skillInstance = new WebSearchSkill(config);
}

/**
 * Perform a web search (main entry point)
 */
export async function search(
  query: string | SearchQuery
): Promise<WebSearchResponse> {
  if (!skillInstance) {
    initialize();
  }

  const searchQuery: SearchQuery =
    typeof query === 'string' ? { query } : query;

  return skillInstance!.search(searchQuery);
}

/**
 * Get remaining API quota
 */
export function getQuota(): number {
  if (!skillInstance) {
    initialize();
  }
  return skillInstance!.getRemainingQuota();
}

// Default export
export default {
  initialize,
  search,
  getQuota,
  WebSearchSkill,
};
