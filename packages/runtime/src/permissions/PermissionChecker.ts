/**
 * Permission Checker
 *
 * Validates and enforces permission-based access control for skills
 */

export class PermissionChecker {
  /**
   * Check if a permission set contains a specific permission
   * @param permissions Set of granted permissions
   * @param requiredPermission Permission to check for
   * @returns true if permission is granted
   */
  hasPermission(permissions: Set<string>, requiredPermission: string): boolean {
    // Empty permission set = no permissions
    if (permissions.size === 0) {
      return false;
    }

    // Validate permission format (lowercase:lowercase)
    if (!/^[a-z]+:[a-z]+$/.test(requiredPermission)) {
      return false;
    }

    // Exact match only - no wildcards
    return permissions.has(requiredPermission);
  }

  /**
   * Validate a permission string format
   * @param permission Permission string to validate
   * @returns true if valid format
   */
  validatePermission(permission: string): boolean {
    return /^[a-z]+:[a-z]+$/.test(permission);
  }

  /**
   * Validate a role assignment
   * @param role Role name to validate
   * @returns true if role is valid
   */
  validateRole(role: string): boolean {
    const validRoles = ['guest', 'user', 'admin'];
    return validRoles.includes(role);
  }
}
