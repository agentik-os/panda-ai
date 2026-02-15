/**
 * OAuth Integration - Google, GitHub, Microsoft
 *
 * Provides OAuth authentication support for enterprise SSO
 */

import type { UserWithRole } from "../rbac/roles";
import { Role } from "../rbac/roles";

/**
 * OAuth Provider types
 */
export enum OAuthProvider {
  GOOGLE = "google",
  GITHUB = "github",
  MICROSOFT = "microsoft",
}

/**
 * OAuth Configuration
 */
export interface OAuthConfig {
  provider: OAuthProvider;
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes?: string[];
}

/**
 * OAuth User Profile (normalized across providers)
 */
export interface OAuthProfile {
  id: string;
  email: string;
  name?: string;
  avatar?: string;
  provider: OAuthProvider;
  raw?: Record<string, unknown>;
}

/**
 * OAuth Token Response
 */
export interface OAuthTokens {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: number;
  idToken?: string;
}

/**
 * OAuth Session
 */
export interface OAuthSession {
  user: UserWithRole;
  tokens: OAuthTokens;
  profile: OAuthProfile;
  createdAt: Date;
  expiresAt: Date;
}

/**
 * OAuth Error
 */
export class OAuthError extends Error {
  constructor(
    message: string,
    public provider: OAuthProvider,
    public code?: string,
  ) {
    super(message);
    this.name = "OAuthError";
  }
}

/**
 * OAuth Provider Configuration
 */
const PROVIDER_CONFIG: Record<
  OAuthProvider,
  {
    authUrl: string;
    tokenUrl: string;
    profileUrl: string;
    defaultScopes: string[];
  }
> = {
  [OAuthProvider.GOOGLE]: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    profileUrl: "https://www.googleapis.com/oauth2/v2/userinfo",
    defaultScopes: ["openid", "profile", "email"],
  },
  [OAuthProvider.GITHUB]: {
    authUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    profileUrl: "https://api.github.com/user",
    defaultScopes: ["user:email", "read:user"],
  },
  [OAuthProvider.MICROSOFT]: {
    authUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/common/oauth2/v2.0/token",
    profileUrl: "https://graph.microsoft.com/v1.0/me",
    defaultScopes: ["openid", "profile", "email", "User.Read"],
  },
};

/**
 * OAuth Handler
 */
export class OAuthHandler {
  private config: OAuthConfig;

  constructor(config: OAuthConfig) {
    this.config = config;
  }

  /**
   * Generate authorization URL
   */
  getAuthorizationUrl(state: string): string {
    const providerConfig = PROVIDER_CONFIG[this.config.provider];
    const scopes = this.config.scopes ?? providerConfig.defaultScopes;

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: scopes.join(" "),
      state,
    });

    return `${providerConfig.authUrl}?${params.toString()}`;
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    const providerConfig = PROVIDER_CONFIG[this.config.provider];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      code,
      redirect_uri: this.config.redirectUri,
      grant_type: "authorization_code",
    });

    try {
      const response = await fetch(providerConfig.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new OAuthError(
          `Token exchange failed: ${error}`,
          this.config.provider,
          "token_exchange_failed",
        );
      }

      const data = (await response.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
        id_token?: string;
      };

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: data.expires_in
          ? Date.now() + data.expires_in * 1000
          : undefined,
        idToken: data.id_token,
      };
    } catch (error) {
      if (error instanceof OAuthError) throw error;
      throw new OAuthError(
        `Token exchange failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        this.config.provider,
        "token_exchange_failed",
      );
    }
  }

  /**
   * Get user profile from provider
   */
  async getUserProfile(accessToken: string): Promise<OAuthProfile> {
    const providerConfig = PROVIDER_CONFIG[this.config.provider];

    try {
      const response = await fetch(providerConfig.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        const error = await response.text();
        throw new OAuthError(
          `Profile fetch failed: ${error}`,
          this.config.provider,
          "profile_fetch_failed",
        );
      }

      const raw = (await response.json()) as Record<string, unknown>;

      // Normalize profile across providers
      return this.normalizeProfile(raw);
    } catch (error) {
      if (error instanceof OAuthError) throw error;
      throw new OAuthError(
        `Profile fetch failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        this.config.provider,
        "profile_fetch_failed",
      );
    }
  }

  /**
   * Refresh access token
   */
  async refreshAccessToken(refreshToken: string): Promise<OAuthTokens> {
    const providerConfig = PROVIDER_CONFIG[this.config.provider];

    const params = new URLSearchParams({
      client_id: this.config.clientId,
      client_secret: this.config.clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    });

    try {
      const response = await fetch(providerConfig.tokenUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          Accept: "application/json",
        },
        body: params.toString(),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new OAuthError(
          `Token refresh failed: ${error}`,
          this.config.provider,
          "token_refresh_failed",
        );
      }

      const data = (await response.json()) as {
        access_token: string;
        refresh_token?: string;
        expires_in?: number;
      };

      return {
        accessToken: data.access_token,
        refreshToken: data.refresh_token ?? refreshToken,
        expiresAt: data.expires_in
          ? Date.now() + data.expires_in * 1000
          : undefined,
      };
    } catch (error) {
      if (error instanceof OAuthError) throw error;
      throw new OAuthError(
        `Token refresh failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        this.config.provider,
        "token_refresh_failed",
      );
    }
  }

  /**
   * Normalize profile data across providers
   */
  private normalizeProfile(raw: Record<string, unknown>): OAuthProfile {
    switch (this.config.provider) {
      case OAuthProvider.GOOGLE:
        return {
          id: String(raw.id ?? ""),
          email: String(raw.email ?? ""),
          name: String(raw.name ?? ""),
          avatar: String(raw.picture ?? ""),
          provider: OAuthProvider.GOOGLE,
          raw,
        };

      case OAuthProvider.GITHUB:
        return {
          id: String(raw.id ?? ""),
          email: String(raw.email ?? ""),
          name: String(raw.name ?? raw.login ?? ""),
          avatar: String(raw.avatar_url ?? ""),
          provider: OAuthProvider.GITHUB,
          raw,
        };

      case OAuthProvider.MICROSOFT:
        return {
          id: String(raw.id ?? ""),
          email: String(raw.userPrincipalName ?? raw.mail ?? ""),
          name: String(raw.displayName ?? ""),
          avatar: undefined, // Microsoft Graph doesn't provide avatar in basic profile
          provider: OAuthProvider.MICROSOFT,
          raw,
        };

      default:
        throw new OAuthError(
          `Unknown provider: ${this.config.provider}`,
          this.config.provider,
          "unknown_provider",
        );
    }
  }

  /**
   * Validate OAuth state (CSRF protection)
   */
  static generateState(): string {
    return crypto.randomUUID();
  }

  /**
   * Verify OAuth state
   */
  static verifyState(received: string, expected: string): boolean {
    return received === expected;
  }
}

/**
 * OAuth Manager - Handles multiple providers
 */
export class OAuthManager {
  private handlers: Map<OAuthProvider, OAuthHandler> = new Map();

  /**
   * Register OAuth provider
   */
  registerProvider(config: OAuthConfig): void {
    this.handlers.set(config.provider, new OAuthHandler(config));
  }

  /**
   * Get handler for provider
   */
  getHandler(provider: OAuthProvider): OAuthHandler {
    const handler = this.handlers.get(provider);
    if (!handler) {
      throw new OAuthError(
        `Provider not configured: ${provider}`,
        provider,
        "provider_not_configured",
      );
    }
    return handler;
  }

  /**
   * Complete OAuth flow (code → tokens → profile → user)
   */
  async completeOAuthFlow(
    provider: OAuthProvider,
    code: string,
  ): Promise<{
    profile: OAuthProfile;
    tokens: OAuthTokens;
  }> {
    const handler = this.getHandler(provider);

    // Exchange code for tokens
    const tokens = await handler.exchangeCodeForTokens(code);

    // Get user profile
    const profile = await handler.getUserProfile(tokens.accessToken);

    return { profile, tokens };
  }

  /**
   * Create or update user from OAuth profile
   */
  async upsertUser(profile: OAuthProfile): Promise<UserWithRole> {
    // In production, this would interact with Convex
    // For now, return a mock user
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: Role.DEVELOPER, // Default role for OAuth users
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * List available providers
   */
  getAvailableProviders(): OAuthProvider[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Global OAuth manager instance
 */
let globalOAuthManager: OAuthManager | null = null;

/**
 * Get global OAuth manager
 */
export function getOAuthManager(): OAuthManager {
  if (!globalOAuthManager) {
    globalOAuthManager = new OAuthManager();
  }
  return globalOAuthManager;
}

/**
 * Initialize OAuth manager with configs
 */
export function initializeOAuth(configs: OAuthConfig[]): void {
  const manager = getOAuthManager();
  for (const config of configs) {
    manager.registerProvider(config);
  }
}
