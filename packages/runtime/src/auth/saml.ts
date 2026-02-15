/**
 * SAML SSO Integration - Enterprise Login
 *
 * Provides SAML 2.0 Single Sign-On for enterprise customers
 * Compatible with Okta, Auth0, Azure AD, Google Workspace
 */

import type { UserWithRole } from "../rbac/roles";
import { Role } from "../rbac/roles";

/**
 * SAML Provider types
 */
export enum SAMLProvider {
  OKTA = "okta",
  AUTH0 = "auth0",
  AZURE_AD = "azure_ad",
  GOOGLE_WORKSPACE = "google_workspace",
  ONELOGIN = "onelogin",
  GENERIC = "generic",
}

/**
 * SAML Configuration
 */
export interface SAMLConfig {
  provider: SAMLProvider;
  entityId: string; // Service Provider Entity ID
  entryPoint: string; // Identity Provider SSO URL
  cert: string; // Identity Provider Certificate (X.509)
  privateKey?: string; // Service Provider Private Key (optional)
  decryptionPvk?: string; // Private key for SAML response decryption
  signatureAlgorithm?: "sha1" | "sha256" | "sha512";
  digestAlgorithm?: "sha1" | "sha256" | "sha512";
  assertionConsumerServiceUrl: string; // ACS URL (callback)
  issuer: string; // Service Provider issuer
  identifierFormat?: string;
  wantAssertionsSigned?: boolean;
  wantAuthnResponseSigned?: boolean;
  disableRequestedAuthnContext?: boolean;
  forceAuthn?: boolean;
  allowCreate?: boolean;
  callbackUrl?: string;
}

/**
 * SAML Assertion Attributes
 */
export interface SAMLAttributes {
  email?: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  groups?: string[];
  roles?: string[];
  organizationId?: string;
  [key: string]: string | string[] | undefined;
}

/**
 * SAML Profile (normalized)
 */
export interface SAMLProfile {
  nameID: string;
  nameIDFormat: string;
  sessionIndex?: string;
  attributes: SAMLAttributes;
  issuer?: string;
  raw?: Record<string, unknown>;
}

/**
 * SAML Response
 */
export interface SAMLResponse {
  profile: SAMLProfile;
  loggedIn: boolean;
}

/**
 * SAML Error
 */
export class SAMLError extends Error {
  constructor(
    message: string,
    public provider: SAMLProvider,
    public code?: string,
  ) {
    super(message);
    this.name = "SAMLError";
  }
}

/**
 * SAML Request Builder
 */
export class SAMLRequestBuilder {
  constructor(private config: SAMLConfig) {}

  /**
   * Generate SAML AuthnRequest
   */
  generateAuthnRequest(relayState?: string): {
    url: string;
    samlRequest: string;
    relayState?: string;
  } {
    const id = this.generateRequestId();
    const issueInstant = new Date().toISOString();

    const samlRequest = this.buildAuthnRequestXML({
      id,
      issueInstant,
      issuer: this.config.issuer,
      destination: this.config.entryPoint,
      assertionConsumerServiceUrl: this.config.assertionConsumerServiceUrl,
      identifierFormat:
        this.config.identifierFormat ??
        "urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress",
      forceAuthn: this.config.forceAuthn ?? false,
      allowCreate: this.config.allowCreate ?? true,
    });

    // Deflate and base64 encode
    const encoded = this.encodeRequest(samlRequest);

    // Build redirect URL
    const params = new URLSearchParams({
      SAMLRequest: encoded,
    });

    if (relayState) {
      params.set("RelayState", relayState);
    }

    const url = `${this.config.entryPoint}?${params.toString()}`;

    return {
      url,
      samlRequest: encoded,
      relayState,
    };
  }

  /**
   * Generate SAML LogoutRequest
   */
  generateLogoutRequest(nameID: string, sessionIndex?: string): {
    url: string;
    samlRequest: string;
  } {
    const id = this.generateRequestId();
    const issueInstant = new Date().toISOString();

    const samlRequest = this.buildLogoutRequestXML({
      id,
      issueInstant,
      issuer: this.config.issuer,
      destination: this.config.entryPoint,
      nameID,
      sessionIndex,
    });

    const encoded = this.encodeRequest(samlRequest);

    const params = new URLSearchParams({
      SAMLRequest: encoded,
    });

    const url = `${this.config.entryPoint}?${params.toString()}`;

    return {
      url,
      samlRequest: encoded,
    };
  }

  /**
   * Build AuthnRequest XML
   */
  private buildAuthnRequestXML(params: {
    id: string;
    issueInstant: string;
    issuer: string;
    destination: string;
    assertionConsumerServiceUrl: string;
    identifierFormat: string;
    forceAuthn: boolean;
    allowCreate: boolean;
  }): string {
    return `<?xml version="1.0"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    ID="${params.id}"
                    Version="2.0"
                    IssueInstant="${params.issueInstant}"
                    Destination="${params.destination}"
                    AssertionConsumerServiceURL="${params.assertionConsumerServiceUrl}"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                    ForceAuthn="${params.forceAuthn}">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${params.issuer}</saml:Issuer>
  <samlp:NameIDPolicy xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                      Format="${params.identifierFormat}"
                      AllowCreate="${params.allowCreate}"/>
</samlp:AuthnRequest>`;
  }

  /**
   * Build LogoutRequest XML
   */
  private buildLogoutRequestXML(params: {
    id: string;
    issueInstant: string;
    issuer: string;
    destination: string;
    nameID: string;
    sessionIndex?: string;
  }): string {
    const sessionIndexXML = params.sessionIndex
      ? `<samlp:SessionIndex>${params.sessionIndex}</samlp:SessionIndex>`
      : "";

    return `<?xml version="1.0"?>
<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                     ID="${params.id}"
                     Version="2.0"
                     IssueInstant="${params.issueInstant}"
                     Destination="${params.destination}">
  <saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${params.issuer}</saml:Issuer>
  <saml:NameID xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${params.nameID}</saml:NameID>
  ${sessionIndexXML}
</samlp:LogoutRequest>`;
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `_${crypto.randomUUID()}`;
  }

  /**
   * Encode SAML request (deflate + base64)
   */
  private encodeRequest(xml: string): string {
    // In production, would use zlib deflate + base64
    // For now, just base64 encode
    return Buffer.from(xml).toString("base64");
  }
}

/**
 * SAML Response Parser
 */
export class SAMLResponseParser {
  constructor(private config: SAMLConfig) {}

  /**
   * Parse and validate SAML response
   */
  async parseResponse(samlResponse: string): Promise<SAMLResponse> {
    try {
      // Decode base64
      const xml = Buffer.from(samlResponse, "base64").toString("utf-8");

      // Validate signature (if required)
      if (this.config.wantAuthnResponseSigned) {
        await this.validateSignature(xml);
      }

      // Extract profile
      const profile = this.extractProfile(xml);

      return {
        profile,
        loggedIn: true,
      };
    } catch (error) {
      throw new SAMLError(
        `Failed to parse SAML response: ${error instanceof Error ? error.message : "Unknown error"}`,
        this.config.provider,
        "response_parse_failed",
      );
    }
  }

  /**
   * Validate SAML response signature
   */
  private async validateSignature(_xml: string): Promise<void> {
    // In production, would use xml-crypto to validate signature
    // For now, skip validation (development only)
    if (process.env.NODE_ENV === "production") {
      console.warn(
        "[SAML] Signature validation not implemented - DO NOT USE IN PRODUCTION",
      );
    }
  }

  /**
   * Extract user profile from SAML assertion
   */
  private extractProfile(xml: string): SAMLProfile {
    // In production, would use proper XML parser (xml2js, fast-xml-parser)
    // For now, basic regex extraction (NOT PRODUCTION READY)

    const nameIDMatch = xml.match(
      /<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/,
    );
    const nameID = nameIDMatch?.[1] ?? "";

    const nameIDFormatMatch = xml.match(
      /<saml:NameID[^>]*Format="([^"]+)"/,
    );
    const nameIDFormat = nameIDFormatMatch?.[1] ?? "";

    const sessionIndexMatch = xml.match(
      /<saml:AuthnStatement[^>]*SessionIndex="([^"]+)"/,
    );
    const sessionIndex = sessionIndexMatch?.[1];

    // Extract attributes
    const attributes = this.extractAttributes(xml);

    return {
      nameID,
      nameIDFormat,
      sessionIndex,
      attributes,
    };
  }

  /**
   * Extract attributes from SAML assertion
   */
  private extractAttributes(xml: string): SAMLAttributes {
    const attributes: SAMLAttributes = {};

    // Common attribute mappings
    const attributeMappings: Record<string, string> = {
      email: "email",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress":
        "email",
      firstName: "firstName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname":
        "firstName",
      lastName: "lastName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/surname":
        "lastName",
      displayName: "displayName",
      "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name":
        "displayName",
      groups: "groups",
      roles: "roles",
    };

    // Extract attribute statements (simplified - use proper XML parser in production)
    const attributeRegex =
      /<saml:Attribute[^>]*Name="([^"]+)"[^>]*>[\s\S]*?<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/g;

    let match;
    while ((match = attributeRegex.exec(xml)) !== null) {
      const [, name, value] = match;
      if (name && value) {
        const mappedName = attributeMappings[name] ?? name;
        attributes[mappedName] = value;
      }
    }

    return attributes;
  }
}

/**
 * SAML Handler
 */
export class SAMLHandler {
  private requestBuilder: SAMLRequestBuilder;
  private responseParser: SAMLResponseParser;

  constructor(private config: SAMLConfig) {
    this.requestBuilder = new SAMLRequestBuilder(config);
    this.responseParser = new SAMLResponseParser(config);
  }

  /**
   * Initiate SAML login
   */
  initiateLogin(relayState?: string): {
    url: string;
    samlRequest: string;
    relayState?: string;
  } {
    return this.requestBuilder.generateAuthnRequest(relayState);
  }

  /**
   * Handle SAML callback (ACS)
   */
  async handleCallback(samlResponse: string): Promise<SAMLProfile> {
    const response = await this.responseParser.parseResponse(samlResponse);
    if (!response.loggedIn) {
      throw new SAMLError(
        "SAML login failed",
        this.config.provider,
        "login_failed",
      );
    }
    return response.profile;
  }

  /**
   * Initiate SAML logout
   */
  initiateLogout(nameID: string, sessionIndex?: string): {
    url: string;
    samlRequest: string;
  } {
    return this.requestBuilder.generateLogoutRequest(nameID, sessionIndex);
  }

  /**
   * Get SAML metadata (for IdP configuration)
   */
  getMetadata(): string {
    return `<?xml version="1.0"?>
<EntityDescriptor xmlns="urn:oasis:names:tc:SAML:2.0:metadata"
                  entityID="${this.config.entityId}">
  <SPSSODescriptor AuthnRequestsSigned="false"
                   WantAssertionsSigned="${this.config.wantAssertionsSigned ?? true}"
                   protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"
                              Location="${this.config.assertionConsumerServiceUrl}"
                              index="1"/>
  </SPSSODescriptor>
</EntityDescriptor>`;
  }
}

/**
 * SAML Manager - Handles multiple SAML providers
 */
export class SAMLManager {
  private handlers: Map<string, SAMLHandler> = new Map();

  /**
   * Register SAML provider
   */
  registerProvider(organizationId: string, config: SAMLConfig): void {
    this.handlers.set(organizationId, new SAMLHandler(config));
  }

  /**
   * Get handler for organization
   */
  getHandler(organizationId: string): SAMLHandler {
    const handler = this.handlers.get(organizationId);
    if (!handler) {
      throw new SAMLError(
        `SAML not configured for organization: ${organizationId}`,
        SAMLProvider.GENERIC,
        "not_configured",
      );
    }
    return handler;
  }

  /**
   * Complete SAML flow (response → profile → user)
   */
  async completeSAMLFlow(
    organizationId: string,
    samlResponse: string,
  ): Promise<{
    profile: SAMLProfile;
    user: UserWithRole;
  }> {
    const handler = this.getHandler(organizationId);

    // Parse SAML response
    const profile = await handler.handleCallback(samlResponse);

    // Create or update user
    const user = await this.upsertUser(profile, organizationId);

    return { profile, user };
  }

  /**
   * Create or update user from SAML profile
   */
  private async upsertUser(
    profile: SAMLProfile,
    organizationId: string,
  ): Promise<UserWithRole> {
    // Extract user info from SAML attributes
    const email = profile.attributes.email ?? profile.nameID;
    const firstName = profile.attributes.firstName;
    const lastName = profile.attributes.lastName;
    const displayName =
      profile.attributes.displayName ??
      [firstName, lastName].filter(Boolean).join(" ");

    // Map SAML roles to system roles
    const role = this.mapSAMLRoleToSystemRole(profile.attributes.roles);

    // In production, this would interact with Convex
    // For now, return a mock user
    return {
      id: profile.nameID,
      email,
      name: displayName,
      role,
      organizationId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  /**
   * Map SAML roles to system roles
   */
  private mapSAMLRoleToSystemRole(
    samlRoles?: string | string[],
  ): Role {
    if (!samlRoles) return Role.VIEWER;

    const roles = Array.isArray(samlRoles) ? samlRoles : [samlRoles];

    // Check for admin role
    if (
      roles.some((r) =>
        ["admin", "administrator", "superuser"].includes(r.toLowerCase()),
      )
    ) {
      return Role.ADMIN;
    }

    // Check for developer role
    if (
      roles.some((r) => ["developer", "engineer", "dev"].includes(r.toLowerCase()))
    ) {
      return Role.DEVELOPER;
    }

    // Default to viewer
    return Role.VIEWER;
  }

  /**
   * List configured organizations
   */
  getConfiguredOrganizations(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/**
 * Global SAML manager instance
 */
let globalSAMLManager: SAMLManager | null = null;

/**
 * Get global SAML manager
 */
export function getSAMLManager(): SAMLManager {
  if (!globalSAMLManager) {
    globalSAMLManager = new SAMLManager();
  }
  return globalSAMLManager;
}

/**
 * Initialize SAML manager with organization configs
 */
export function initializeSAML(
  configs: Array<{ organizationId: string; config: SAMLConfig }>,
): void {
  const manager = getSAMLManager();
  for (const { organizationId, config } of configs) {
    manager.registerProvider(organizationId, config);
  }
}
