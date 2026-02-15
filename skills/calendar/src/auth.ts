/**
 * OAuth2 Authentication Manager for Google Calendar API
 */

import { google } from 'googleapis';
import type { Auth } from 'googleapis';
import type { OAuth2Config, OAuth2Credentials } from './types.js';
import { AuthenticationError } from './types.js';

type OAuth2Client = Auth.OAuth2Client;

/**
 * Manages OAuth2 authentication flow and token refresh
 */
export class OAuth2Manager {
  private client: OAuth2Client;
  private credentials?: OAuth2Credentials;

  constructor(config: OAuth2Config) {
    this.client = new google.auth.OAuth2(
      config.clientId,
      config.clientSecret,
      config.redirectUri
    );
  }

  /**
   * Generate authorization URL for OAuth2 flow
   */
  getAuthUrl(scopes: string[] = ['https://www.googleapis.com/auth/calendar']): string {
    return this.client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      prompt: 'consent', // Force consent to get refresh token
    });
  }

  /**
   * Exchange authorization code for tokens
   */
  async getToken(code: string): Promise<OAuth2Credentials> {
    try {
      const { tokens } = await this.client.getToken(code);

      if (!tokens.access_token) {
        throw new AuthenticationError('No access token received');
      }

      this.credentials = tokens as OAuth2Credentials;
      this.client.setCredentials(tokens);

      return this.credentials;
    } catch (error) {
      throw new AuthenticationError(
        `Failed to exchange authorization code: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Set existing credentials
   */
  setCredentials(credentials: OAuth2Credentials): void {
    this.credentials = credentials;
    this.client.setCredentials(credentials);
  }

  /**
   * Get current credentials
   */
  getCredentials(): OAuth2Credentials | undefined {
    return this.credentials;
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<OAuth2Credentials> {
    try {
      const { credentials } = await this.client.refreshAccessToken();

      if (!credentials.access_token) {
        throw new AuthenticationError('No access token received after refresh');
      }

      this.credentials = credentials as OAuth2Credentials;
      this.client.setCredentials(credentials);

      return this.credentials;
    } catch (error) {
      throw new AuthenticationError(
        `Failed to refresh access token: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }

  /**
   * Check if token is expired or about to expire (within 5 minutes)
   */
  isTokenExpired(): boolean {
    if (!this.credentials?.expiry_date) {
      return true;
    }

    const expiryTime = this.credentials.expiry_date;
    const now = Date.now();
    const fiveMinutes = 5 * 60 * 1000;

    return expiryTime - now < fiveMinutes;
  }

  /**
   * Ensure token is valid, refreshing if necessary
   */
  async ensureValidToken(): Promise<void> {
    if (!this.credentials) {
      throw new AuthenticationError('No credentials set. Please authenticate first.');
    }

    if (this.isTokenExpired()) {
      if (!this.credentials.refresh_token) {
        throw new AuthenticationError('Token expired and no refresh token available');
      }

      await this.refreshAccessToken();
    }
  }

  /**
   * Get the OAuth2 client for API calls
   */
  getClient(): OAuth2Client {
    return this.client;
  }

  /**
   * Revoke credentials
   */
  async revoke(): Promise<void> {
    try {
      await this.client.revokeCredentials();
      this.credentials = undefined;
    } catch (error) {
      throw new AuthenticationError(
        `Failed to revoke credentials: ${error instanceof Error ? error.message : String(error)}`,
        error
      );
    }
  }
}
