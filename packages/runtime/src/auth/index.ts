/**
 * Authentication Module - OAuth + SAML SSO
 *
 * Provides enterprise-grade authentication:
 * - OAuth (Google, GitHub, Microsoft)
 * - SAML SSO (Okta, Auth0, Azure AD)
 * - RBAC (Role-Based Access Control)
 * - Audit Logging
 *
 * @module auth
 */

// OAuth
export {
  OAuthProvider,
  OAuthError,
  OAuthHandler,
  OAuthManager,
  getOAuthManager,
  initializeOAuth,
  type OAuthConfig,
  type OAuthProfile,
  type OAuthTokens,
  type OAuthSession,
} from "./oauth";

// SAML
export {
  SAMLProvider,
  SAMLError,
  SAMLRequestBuilder,
  SAMLResponseParser,
  SAMLHandler,
  SAMLManager,
  getSAMLManager,
  initializeSAML,
  type SAMLConfig,
  type SAMLAttributes,
  type SAMLProfile,
  type SAMLResponse,
} from "./saml";
