/**
 * Twitter/X API Skill - Type Definitions
 */

// ============================================================================
// Configuration Types
// ============================================================================

export interface TwitterConfig {
  apiKey: string;
  apiSecret: string;
  accessToken: string;
  accessTokenSecret: string;
  bearerToken?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

// ============================================================================
// Input/Output Types for SkillBase
// ============================================================================

export interface TwitterInput {
  action: 'postTweet' | 'getTimeline' | 'sendDM' | 'searchTweets' | 'getUserProfile';
  params: Record<string, any>;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

export interface TwitterOutput {
  success: boolean;
  data?: any;
  error?: string;
  [key: string]: unknown; // Index signature for SkillBase compatibility
}

// ============================================================================
// Tweet Types
// ============================================================================

export interface Tweet {
  id: string;
  text: string;
  authorId: string;
  createdAt: string;
  publicMetrics?: {
    retweetCount: number;
    replyCount: number;
    likeCount: number;
    quoteCount: number;
  };
  entities?: {
    mentions?: Array<{ username: string; id: string }>;
    hashtags?: Array<{ tag: string }>;
    urls?: Array<{ url: string; expandedUrl: string }>;
  };
}

export interface PostTweetParams {
  text: string;
  replyTo?: string;
  quoteTweetId?: string;
  mediaIds?: string[];
}

export interface SearchTweetsParams {
  query: string;
  maxResults?: number;
  sortOrder?: 'recency' | 'relevancy';
  startTime?: string;
  endTime?: string;
}

// ============================================================================
// Direct Message Types
// ============================================================================

export interface DirectMessage {
  id: string;
  text: string;
  senderId: string;
  recipientId: string;
  createdAt: string;
}

export interface SendDMParams {
  recipientId: string;
  text: string;
}

// ============================================================================
// User Types
// ============================================================================

export interface TwitterUser {
  id: string;
  username: string;
  name: string;
  description?: string;
  profileImageUrl?: string;
  verified?: boolean;
  publicMetrics?: {
    followersCount: number;
    followingCount: number;
    tweetCount: number;
  };
}

// ============================================================================
// Timeline Types
// ============================================================================

export interface GetTimelineParams {
  maxResults?: number;
  sinceId?: string;
  untilId?: string;
}

// ============================================================================
// Error Types
// ============================================================================

export class TwitterError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'TwitterError';
  }
}

export class RateLimitError extends TwitterError {
  constructor(message = 'Rate limit exceeded') {
    super(message, 'RATE_LIMIT_EXCEEDED', 429);
    this.name = 'RateLimitError';
  }
}

export class AuthenticationError extends TwitterError {
  constructor(message = 'Authentication failed') {
    super(message, 'AUTHENTICATION_FAILED', 401);
    this.name = 'AuthenticationError';
  }
}

export class NotFoundError extends TwitterError {
  constructor(message = 'Resource not found') {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}
