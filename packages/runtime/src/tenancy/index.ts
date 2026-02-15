/**
 * Multi-Tenancy Module
 *
 * Provides isolated workspaces for multi-tenant deployments
 *
 * @module tenancy
 */

export {
  TenantManager,
  TenantIsolationError,
  TENANT_PLANS,
  getTenantManager,
  initializeTenant,
  getCurrentTenantId,
  requireFeature,
  enforceLimit,
  withTenantScope,
  withTenantData,
  type TenantContext,
  type TenantFeatures,
  type TenantLimits,
  type TenantScopedQuery,
  type TenantScopedData,
} from "./tenant-isolation";
