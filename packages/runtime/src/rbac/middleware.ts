/**
 * RBAC Middleware - Route Protection
 *
 * Enforces role-based access control on API endpoints
 */

import { Permission, type UserWithRole, userHasPermission, canAccessOrOwn } from "./roles";

/**
 * Unauthorized error
 */
export class UnauthorizedError extends Error {
  constructor(message: string = "Unauthorized") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/**
 * Forbidden error
 */
export class ForbiddenError extends Error {
  constructor(message: string = "Forbidden: Insufficient permissions") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Require authentication (user must be logged in)
 */
export function requireAuth(user: UserWithRole | null | undefined): asserts user is UserWithRole {
  if (!user) {
    throw new UnauthorizedError("Authentication required");
  }
}

/**
 * Require specific permission
 */
export function requirePermission(user: UserWithRole | null | undefined, permission: Permission): void {
  requireAuth(user);

  if (!userHasPermission(user, permission)) {
    throw new ForbiddenError(`Missing required permission: ${permission}`);
  }
}

/**
 * Require permission or ownership
 */
export function requirePermissionOrOwnership(
  user: UserWithRole | null | undefined,
  permission: Permission,
  resourceOwnerId: string,
): void {
  requireAuth(user);

  if (!canAccessOrOwn(user, permission, resourceOwnerId)) {
    throw new ForbiddenError(`Missing permission or ownership: ${permission}`);
  }
}

/**
 * Require any of the given permissions
 */
export function requireAnyPermission(
  user: UserWithRole | null | undefined,
  permissions: Permission[],
): void {
  requireAuth(user);

  const hasAny = permissions.some((p) => userHasPermission(user, p));

  if (!hasAny) {
    throw new ForbiddenError(`Missing required permissions: ${permissions.join(", ")}`);
  }
}

/**
 * Require all of the given permissions
 */
export function requireAllPermissions(
  user: UserWithRole | null | undefined,
  permissions: Permission[],
): void {
  requireAuth(user);

  const hasAll = permissions.every((p) => userHasPermission(user, p));

  if (!hasAll) {
    const missing = permissions.filter((p) => !userHasPermission(user, p));
    throw new ForbiddenError(`Missing required permissions: ${missing.join(", ")}`);
  }
}

/**
 * Check if operation is allowed (returns boolean, doesn't throw)
 */
export function isAllowed(user: UserWithRole | null | undefined, permission: Permission): boolean {
  if (!user) return false;
  return userHasPermission(user, permission);
}

/**
 * Check if any permission is allowed
 */
export function isAnyAllowed(user: UserWithRole | null | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.some((p) => userHasPermission(user, p));
}

/**
 * Check if all permissions are allowed
 */
export function isAllAllowed(user: UserWithRole | null | undefined, permissions: Permission[]): boolean {
  if (!user) return false;
  return permissions.every((p) => userHasPermission(user, p));
}

/**
 * Middleware factory for Express/Next.js API routes
 */
export function createAuthMiddleware(options: {
  getUser: () => Promise<UserWithRole | null>;
  permission?: Permission;
  permissions?: Permission[];
  requireAll?: boolean;
}) {
  return async () => {
    const user = await options.getUser();

    // Check authentication
    requireAuth(user);

    // Check single permission
    if (options.permission) {
      requirePermission(user, options.permission);
    }

    // Check multiple permissions
    if (options.permissions) {
      if (options.requireAll) {
        requireAllPermissions(user, options.permissions);
      } else {
        requireAnyPermission(user, options.permissions);
      }
    }

    return user;
  };
}
