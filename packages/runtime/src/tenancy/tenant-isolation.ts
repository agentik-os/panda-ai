/**
 * Multi-Tenancy & Tenant Isolation
 *
 * Provides worksp isolation for multi-tenant deployments:
 * - Tenant ID scoping for all data
 * - Row-level security
 * - Isolated storage per tenant
 * - Cross-tenant access prevention
 *
 * @module tenancy
 */

/**
 * Tenant context
 */
export interface TenantContext {
  tenantId: string;
  organizationId?: string;
  name: string;
  plan: "free" | "pro" | "enterprise";
  createdAt: Date;
  features: TenantFeatures;
  limits: TenantLimits;
  metadata?: Record<string, unknown>;
}

/**
 * Tenant features (plan-based)
 */
export interface TenantFeatures {
  multiModel: boolean; // Access to multiple AI models
  customSkills: boolean; // Create custom skills
  marketplace: boolean; // Access to marketplace
  sso: boolean; // SAML SSO
  auditLogs: boolean; // Full audit logging
  prioritySupport: boolean;
  airGapped: boolean; // Air-gapped deployment support
}

/**
 * Tenant limits (plan-based)
 */
export interface TenantLimits {
  maxAgents: number;
  maxUsers: number;
  maxConversations: number;
  maxStorageGB: number;
  maxRequestsPerHour: number;
  maxConcurrentAgents: number;
}

/**
 * Tenant plan configurations
 */
export const TENANT_PLANS: Record<
  TenantContext["plan"],
  { features: TenantFeatures; limits: TenantLimits }
> = {
  free: {
    features: {
      multiModel: false,
      customSkills: false,
      marketplace: true,
      sso: false,
      auditLogs: false,
      prioritySupport: false,
      airGapped: false,
    },
    limits: {
      maxAgents: 3,
      maxUsers: 1,
      maxConversations: 100,
      maxStorageGB: 1,
      maxRequestsPerHour: 100,
      maxConcurrentAgents: 1,
    },
  },
  pro: {
    features: {
      multiModel: true,
      customSkills: true,
      marketplace: true,
      sso: false,
      auditLogs: true,
      prioritySupport: false,
      airGapped: false,
    },
    limits: {
      maxAgents: 50,
      maxUsers: 10,
      maxConversations: 10000,
      maxStorageGB: 50,
      maxRequestsPerHour: 5000,
      maxConcurrentAgents: 10,
    },
  },
  enterprise: {
    features: {
      multiModel: true,
      customSkills: true,
      marketplace: true,
      sso: true,
      auditLogs: true,
      prioritySupport: true,
      airGapped: true,
    },
    limits: {
      maxAgents: Infinity,
      maxUsers: Infinity,
      maxConversations: Infinity,
      maxStorageGB: Infinity,
      maxRequestsPerHour: Infinity,
      maxConcurrentAgents: Infinity,
    },
  },
};

/**
 * Tenant isolation error
 */
export class TenantIsolationError extends Error {
  constructor(
    message: string,
    public tenantId: string,
    public code?: string,
  ) {
    super(message);
    this.name = "TenantIsolationError";
  }
}

/**
 * Tenant Manager - Enforces tenant isolation
 */
export class TenantManager {
  private currentTenant: TenantContext | null = null;

  /**
   * Set current tenant context (for request-scoped isolation)
   */
  setTenant(tenant: TenantContext): void {
    this.currentTenant = tenant;
  }

  /**
   * Get current tenant
   */
  getTenant(): TenantContext {
    if (!this.currentTenant) {
      throw new TenantIsolationError(
        "No tenant context set",
        "unknown",
        "no_tenant_context",
      );
    }
    return this.currentTenant;
  }

  /**
   * Get current tenant ID (shorthand)
   */
  getTenantId(): string {
    return this.getTenant().tenantId;
  }

  /**
   * Clear tenant context (cleanup)
   */
  clearTenant(): void {
    this.currentTenant = null;
  }

  /**
   * Check if tenant has feature enabled
   */
  hasFeature(feature: keyof TenantFeatures): boolean {
    const tenant = this.getTenant();
    return tenant.features[feature];
  }

  /**
   * Check if tenant is within limit
   */
  isWithinLimit(
    limit: keyof TenantLimits,
    current: number,
  ): boolean {
    const tenant = this.getTenant();
    const max = tenant.limits[limit];
    return current < max;
  }

  /**
   * Enforce tenant limit (throw if exceeded)
   */
  enforceLimit(
    limit: keyof TenantLimits,
    current: number,
  ): void {
    if (!this.isWithinLimit(limit, current)) {
      const tenant = this.getTenant();
      throw new TenantIsolationError(
        `Tenant limit exceeded: ${limit} (current: ${current}, max: ${tenant.limits[limit]})`,
        tenant.tenantId,
        "limit_exceeded",
      );
    }
  }

  /**
   * Require feature (throw if not enabled)
   */
  requireFeature(feature: keyof TenantFeatures): void {
    if (!this.hasFeature(feature)) {
      const tenant = this.getTenant();
      throw new TenantIsolationError(
        `Feature not enabled: ${feature} (upgrade to enable)`,
        tenant.tenantId,
        "feature_not_enabled",
      );
    }
  }

  /**
   * Create new tenant
   */
  async createTenant(params: {
    name: string;
    plan: TenantContext["plan"];
    organizationId?: string;
    metadata?: Record<string, unknown>;
  }): Promise<TenantContext> {
    const tenantId = crypto.randomUUID();
    const planConfig = TENANT_PLANS[params.plan];

    const tenant: TenantContext = {
      tenantId,
      organizationId: params.organizationId,
      name: params.name,
      plan: params.plan,
      createdAt: new Date(),
      features: planConfig.features,
      limits: planConfig.limits,
      metadata: params.metadata,
    };

    // In production, would save to Convex
    // For now, return the created tenant

    return tenant;
  }

  /**
   * Update tenant plan (upgrade/downgrade)
   */
  async updateTenantPlan(
    tenantId: string,
    newPlan: TenantContext["plan"],
  ): Promise<TenantContext> {
    // In production, would fetch from Convex
    const tenant = this.getTenant();

    if (tenant.tenantId !== tenantId) {
      throw new TenantIsolationError(
        "Cannot update tenant from different tenant context",
        tenant.tenantId,
        "cross_tenant_access",
      );
    }

    const planConfig = TENANT_PLANS[newPlan];

    const updated: TenantContext = {
      ...tenant,
      plan: newPlan,
      features: planConfig.features,
      limits: planConfig.limits,
    };

    // In production, would update in Convex

    return updated;
  }

  /**
   * Get tenant usage stats
   */
  async getTenantUsage(_tenantId: string): Promise<{
    agents: number;
    users: number;
    conversations: number;
    storageGB: number;
    requestsThisHour: number;
    concurrentAgents: number;
  }> {
    // In production, would query from Convex with tenant filter
    // For now, return mock data

    return {
      agents: 0,
      users: 0,
      conversations: 0,
      storageGB: 0,
      requestsThisHour: 0,
      concurrentAgents: 0,
    };
  }

  /**
   * Validate cross-tenant access (prevent data leaks)
   */
  validateTenantAccess(resourceTenantId: string): void {
    const currentTenantId = this.getTenantId();

    if (resourceTenantId !== currentTenantId) {
      throw new TenantIsolationError(
        `Cross-tenant access denied: resource belongs to tenant ${resourceTenantId}, current tenant is ${currentTenantId}`,
        currentTenantId,
        "cross_tenant_access",
      );
    }
  }
}

/**
 * Tenant-scoped data filter (for Convex queries)
 */
export interface TenantScopedQuery {
  tenantId: string;
  [key: string]: unknown;
}

/**
 * Add tenant ID to query filter
 */
export function withTenantScope<T extends Record<string, unknown>>(
  query: T,
  tenantId: string,
): T & TenantScopedQuery {
  return {
    ...query,
    tenantId,
  };
}

/**
 * Tenant-scoped data (for Convex inserts/updates)
 */
export interface TenantScopedData {
  tenantId: string;
  [key: string]: unknown;
}

/**
 * Add tenant ID to data
 */
export function withTenantData<T extends Record<string, unknown>>(
  data: T,
  tenantId: string,
): T & TenantScopedData {
  return {
    ...data,
    tenantId,
  };
}

/**
 * Global tenant manager instance
 */
let globalTenantManager: TenantManager | null = null;

/**
 * Get global tenant manager
 */
export function getTenantManager(): TenantManager {
  if (!globalTenantManager) {
    globalTenantManager = new TenantManager();
  }
  return globalTenantManager;
}

/**
 * Initialize tenant manager with current tenant
 */
export function initializeTenant(tenant: TenantContext): void {
  const manager = getTenantManager();
  manager.setTenant(tenant);
}

/**
 * Quick helper: Get current tenant ID
 */
export function getCurrentTenantId(): string {
  return getTenantManager().getTenantId();
}

/**
 * Quick helper: Require feature
 */
export function requireFeature(feature: keyof TenantFeatures): void {
  getTenantManager().requireFeature(feature);
}

/**
 * Quick helper: Enforce limit
 */
export function enforceLimit(
  limit: keyof TenantLimits,
  current: number,
): void {
  getTenantManager().enforceLimit(limit, current);
}
