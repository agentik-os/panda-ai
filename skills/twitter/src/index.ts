/**
 * Twitter/X API Skill - Main Entry Point
 *
 * Comprehensive Twitter/X integration for posting tweets, reading timeline,
 * sending DMs, and interacting with the Twitter API v2.
 */

import { TwitterApi, TweetV2PostTweetResult, TweetV2, UserV2 } from 'twitter-api-v2';
import { SkillBase } from '../../../packages/sdk/src/index.js';
import type {
  TwitterInput,
  TwitterOutput,
  TwitterConfig,
  Tweet,
  PostTweetParams,
  SearchTweetsParams,
  SendDMParams,
  GetTimelineParams,
  TwitterUser,
} from './types.js';
import { TwitterError, RateLimitError, NotFoundError } from './types.js';

// ============================================================================
// Rate Limiter
// ============================================================================

class RateLimiter {
  private requests: number[] = [];
  private maxRequests: number;
  private windowMs: number;

  constructor(maxRequests = 100, windowMs = 900000) {
    // 100 requests per 15 minutes
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
  }

  canMakeRequest(): boolean {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return this.requests.length < this.maxRequests;
  }

  recordRequest(): void {
    this.requests.push(Date.now());
  }

  getRemainingRequests(): number {
    const now = Date.now();
    this.requests = this.requests.filter((time) => now - time < this.windowMs);
    return Math.max(0, this.maxRequests - this.requests.length);
  }
}

// ============================================================================
// Twitter Skill Class
// ============================================================================

export class TwitterSkill extends SkillBase<TwitterInput, TwitterOutput> {
  // Required metadata
  readonly id = 'twitter';
  readonly name = 'Twitter/X API';
  readonly description = 'Post tweets, read timeline, manage DMs, and interact with Twitter/X API v2';
  readonly version = '1.0.0';

  // Optional metadata
  readonly author = 'Agentik OS';
  readonly permissions = [
    'network:https:api.twitter.com',
    'network:https:api.x.com',
    'api:twitter',
    'kv:read:twitter:*',
    'kv:write:twitter:*',
  ];
  readonly tags = ['twitter', 'x', 'social-media', 'api', 'tweets', 'dm'];

  // Private instances
  private client: TwitterApi;
  private rateLimiter: RateLimiter;
  protected readonly config: TwitterConfig;

  constructor(config: TwitterConfig) {
    super();
    this.config = config;

    // Initialize Twitter API client
    this.client = new TwitterApi({
      appKey: config.apiKey,
      appSecret: config.apiSecret,
      accessToken: config.accessToken,
      accessSecret: config.accessTokenSecret,
    });

    this.rateLimiter = new RateLimiter();
  }

  // ============================================================================
  // Required SkillBase Methods
  // ============================================================================

  async execute(input: TwitterInput): Promise<TwitterOutput> {
    try {
      if (!this.rateLimiter.canMakeRequest()) {
        throw new RateLimitError('Rate limit exceeded. Please try again later.');
      }

      this.rateLimiter.recordRequest();

      switch (input.action) {
        case 'postTweet':
          return await this._postTweet(input.params as PostTweetParams);
        case 'getTimeline':
          return await this._getTimeline(input.params as GetTimelineParams);
        case 'sendDM':
          return await this._sendDM(input.params as SendDMParams);
        case 'searchTweets':
          return await this._searchTweets(input.params as SearchTweetsParams);
        case 'getUserProfile':
          return await this._getUserProfile(input.params as { username: string });
        default:
          throw new Error(`Unknown action: ${input.action}`);
      }
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      };
    }
  }

  async validate(input: TwitterInput): Promise<boolean> {
    if (!input || typeof input !== 'object') {
      return false;
    }

    if (!input.action || typeof input.action !== 'string') {
      return false;
    }

    if (!input.params || typeof input.params !== 'object') {
      return false;
    }

    return true;
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * Post a tweet to Twitter/X
   */
  async postTweet(params: PostTweetParams): Promise<Tweet> {
    const result = await this.execute({
      action: 'postTweet',
      params,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to post tweet');
    }

    return result.data;
  }

  /**
   * Get user's home timeline
   */
  async getTimeline(params: GetTimelineParams = {}): Promise<Tweet[]> {
    const result = await this.execute({
      action: 'getTimeline',
      params,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get timeline');
    }

    return result.data;
  }

  /**
   * Send a direct message
   */
  async sendDM(params: SendDMParams): Promise<{ id: string; text: string }> {
    const result = await this.execute({
      action: 'sendDM',
      params,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to send DM');
    }

    return result.data;
  }

  /**
   * Search for tweets
   */
  async searchTweets(params: SearchTweetsParams): Promise<Tweet[]> {
    const result = await this.execute({
      action: 'searchTweets',
      params,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to search tweets');
    }

    return result.data;
  }

  /**
   * Get user profile information
   */
  async getUserProfile(username: string): Promise<TwitterUser> {
    const result = await this.execute({
      action: 'getUserProfile',
      params: { username },
    });

    if (!result.success || !result.data) {
      throw new Error(result.error || 'Failed to get user profile');
    }

    return result.data;
  }

  // ============================================================================
  // Private Implementation Methods
  // ============================================================================

  private async _postTweet(params: PostTweetParams): Promise<TwitterOutput> {
    try {
      const tweetData: any = {
        text: params.text,
      };

      if (params.replyTo) {
        tweetData.reply = { in_reply_to_tweet_id: params.replyTo };
      }

      if (params.quoteTweetId) {
        tweetData.quote_tweet_id = params.quoteTweetId;
      }

      if (params.mediaIds && params.mediaIds.length > 0) {
        tweetData.media = { media_ids: params.mediaIds };
      }

      const result: TweetV2PostTweetResult = await this.client.v2.tweet(tweetData);

      const tweet: Tweet = {
        id: result.data.id,
        text: result.data.text,
        authorId: '',
        createdAt: new Date().toISOString(),
      };

      return {
        success: true,
        data: tweet,
      };
    } catch (error) {
      throw new TwitterError(
        error instanceof Error ? error.message : 'Failed to post tweet'
      );
    }
  }

  private async _getTimeline(params: GetTimelineParams): Promise<TwitterOutput> {
    try {
      const maxResults = params.maxResults || 10;

      const timeline = await this.client.v2.homeTimeline({
        max_results: maxResults,
        ...(params.sinceId && { since_id: params.sinceId }),
        ...(params.untilId && { until_id: params.untilId }),
        'tweet.fields': ['created_at', 'public_metrics', 'entities'],
      });

      const tweets: Tweet[] = timeline.data.data.map((tweet: TweetV2) => ({
        id: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id || '',
        createdAt: tweet.created_at || new Date().toISOString(),
        publicMetrics: tweet.public_metrics
          ? {
              retweetCount: tweet.public_metrics.retweet_count || 0,
              replyCount: tweet.public_metrics.reply_count || 0,
              likeCount: tweet.public_metrics.like_count || 0,
              quoteCount: tweet.public_metrics.quote_count || 0,
            }
          : undefined,
        entities: tweet.entities
          ? {
              mentions: tweet.entities.mentions?.map((m) => ({ username: m.username, id: m.id })),
              hashtags: tweet.entities.hashtags?.map((h) => ({ tag: h.tag })),
              urls: tweet.entities.urls?.map((u) => ({ url: u.url, expandedUrl: u.expanded_url || u.url })),
            }
          : undefined,
      }));

      return {
        success: true,
        data: tweets,
      };
    } catch (error) {
      throw new TwitterError(
        error instanceof Error ? error.message : 'Failed to get timeline'
      );
    }
  }

  private async _sendDM(params: SendDMParams): Promise<TwitterOutput> {
    try {
      const result = await this.client.v2.sendDmToParticipant(
        params.recipientId,
        { text: params.text }
      );

      return {
        success: true,
        data: {
          id: result.dm_event_id,
          text: params.text,
        },
      };
    } catch (error) {
      throw new TwitterError(
        error instanceof Error ? error.message : 'Failed to send DM'
      );
    }
  }

  private async _searchTweets(params: SearchTweetsParams): Promise<TwitterOutput> {
    try {
      const maxResults = params.maxResults || 10;

      const searchResult = await this.client.v2.search(params.query, {
        max_results: maxResults,
        ...(params.sortOrder && { sort_order: params.sortOrder }),
        ...(params.startTime && { start_time: params.startTime }),
        ...(params.endTime && { end_time: params.endTime }),
        'tweet.fields': ['created_at', 'public_metrics', 'entities'],
      });

      const tweets: Tweet[] = searchResult.data.data.map((tweet: TweetV2) => ({
        id: tweet.id,
        text: tweet.text,
        authorId: tweet.author_id || '',
        createdAt: tweet.created_at || new Date().toISOString(),
        publicMetrics: tweet.public_metrics
          ? {
              retweetCount: tweet.public_metrics.retweet_count || 0,
              replyCount: tweet.public_metrics.reply_count || 0,
              likeCount: tweet.public_metrics.like_count || 0,
              quoteCount: tweet.public_metrics.quote_count || 0,
            }
          : undefined,
        entities: tweet.entities
          ? {
              mentions: tweet.entities.mentions?.map((m) => ({ username: m.username, id: m.id })),
              hashtags: tweet.entities.hashtags?.map((h) => ({ tag: h.tag })),
              urls: tweet.entities.urls?.map((u) => ({ url: u.url, expandedUrl: u.expanded_url || u.url })),
            }
          : undefined,
      }));

      return {
        success: true,
        data: tweets,
      };
    } catch (error) {
      throw new TwitterError(
        error instanceof Error ? error.message : 'Failed to search tweets'
      );
    }
  }

  private async _getUserProfile(params: { username: string }): Promise<TwitterOutput> {
    try {
      const user = await this.client.v2.userByUsername(params.username, {
        'user.fields': ['description', 'profile_image_url', 'verified', 'public_metrics'],
      });

      if (!user.data) {
        throw new NotFoundError(`User ${params.username} not found`);
      }

      const userData: UserV2 = user.data;

      const profile: TwitterUser = {
        id: userData.id,
        username: userData.username,
        name: userData.name,
        description: userData.description,
        profileImageUrl: userData.profile_image_url,
        verified: userData.verified,
        publicMetrics: userData.public_metrics
          ? {
              followersCount: userData.public_metrics.followers_count || 0,
              followingCount: userData.public_metrics.following_count || 0,
              tweetCount: userData.public_metrics.tweet_count || 0,
            }
          : undefined,
      };

      return {
        success: true,
        data: profile,
      };
    } catch (error) {
      throw new TwitterError(
        error instanceof Error ? error.message : 'Failed to get user profile'
      );
    }
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  getRemainingRequests(): number {
    return this.rateLimiter.getRemainingRequests();
  }
}

// Export default instance creator
export function createTwitterSkill(config: TwitterConfig): TwitterSkill {
  return new TwitterSkill(config);
}

// Re-export types
export type {
  TwitterInput,
  TwitterOutput,
  TwitterConfig,
  Tweet,
  PostTweetParams,
  SearchTweetsParams,
  SendDMParams,
  GetTimelineParams,
  TwitterUser,
};

export {
  TwitterError,
  RateLimitError,
  AuthenticationError,
  NotFoundError,
} from './types.js';
