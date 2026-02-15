/**
 * Role-Based Access Control (RBAC)
 *
 * Provides role and permission management for Agentik OS
 *
 * @module rbac
 */

export {
  Role,
  Permission,
  ROLE_PERMISSIONS,
  type UserWithRole,
  hasPermission,
  userHasPermission,
  getRolePermissions,
  canAccess,
  isOwner,
  canAccessOrOwn,
  getRoleLevel,
  hasHigherOrEqualRole,
} from "./roles";

export {
  UnauthorizedError,
  ForbiddenError,
  requireAuth,
  requirePermission,
  requirePermissionOrOwnership,
  requireAnyPermission,
  requireAllPermissions,
  isAllowed,
  isAnyAllowed,
  isAllAllowed,
  createAuthMiddleware,
} from "./middleware";
