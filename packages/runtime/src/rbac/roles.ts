/**
 * Role-Based Access Control (RBAC) - Roles Definition
 *
 * Defines the role hierarchy and permissions for Agentik OS
 */

/**
 * Available roles in the system
 */
export enum Role {
  ADMIN = "admin",
  DEVELOPER = "developer",
  VIEWER = "viewer",
}

/**
 * System permissions
 */
export enum Permission {
  // Agent Management
  AGENT_CREATE = "agent:create",
  AGENT_READ = "agent:read",
  AGENT_UPDATE = "agent:update",
  AGENT_DELETE = "agent:delete",
  AGENT_EXECUTE = "agent:execute",

  // Conversation Management
  CONVERSATION_READ = "conversation:read",
  CONVERSATION_DELETE = "conversation:delete",

  // Dream Management
  DREAM_READ = "dream:read",
  DREAM_TRIGGER = "dream:trigger",
  DREAM_DELETE = "dream:delete",

  // Time Travel Debug
  TIME_TRAVEL_READ = "time-travel:read",
  TIME_TRAVEL_REPLAY = "time-travel:replay",

  // Skill Management
  SKILL_READ = "skill:read",
  SKILL_INSTALL = "skill:install",
  SKILL_UNINSTALL = "skill:uninstall",
  SKILL_PUBLISH = "skill:publish",

  // Marketplace
  MARKETPLACE_READ = "marketplace:read",
  MARKETPLACE_PUBLISH = "marketplace:publish",
  MARKETPLACE_APPROVE = "marketplace:approve",

  // User Management (Admin only)
  USER_CREATE = "user:create",
  USER_READ = "user:read",
  USER_UPDATE = "user:update",
  USER_DELETE = "user:delete",

  // Cost Management
  COST_READ = "cost:read",
  COST_EXPORT = "cost:export",
  COST_LIMIT_SET = "cost:limit-set",

  // Audit Logs (Admin only)
  AUDIT_READ = "audit:read",
  AUDIT_EXPORT = "audit:export",

  // System Configuration (Admin only)
  SYSTEM_CONFIG_READ = "system:config-read",
  SYSTEM_CONFIG_WRITE = "system:config-write",
}

/**
 * Role-to-Permissions mapping
 */
export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    // Admins have ALL permissions
    ...Object.values(Permission),
  ],

  [Role.DEVELOPER]: [
    // Agents
    Permission.AGENT_CREATE,
    Permission.AGENT_READ,
    Permission.AGENT_UPDATE,
    Permission.AGENT_DELETE,
    Permission.AGENT_EXECUTE,

    // Conversations
    Permission.CONVERSATION_READ,
    Permission.CONVERSATION_DELETE,

    // Dreams
    Permission.DREAM_READ,
    Permission.DREAM_TRIGGER,

    // Time Travel
    Permission.TIME_TRAVEL_READ,
    Permission.TIME_TRAVEL_REPLAY,

    // Skills
    Permission.SKILL_READ,
    Permission.SKILL_INSTALL,
    Permission.SKILL_UNINSTALL,
    Permission.SKILL_PUBLISH,

    // Marketplace
    Permission.MARKETPLACE_READ,
    Permission.MARKETPLACE_PUBLISH,

    // Users (read only)
    Permission.USER_READ,

    // Costs
    Permission.COST_READ,
    Permission.COST_EXPORT,

    // System config (read only)
    Permission.SYSTEM_CONFIG_READ,
  ],

  [Role.VIEWER]: [
    // Read-only access
    Permission.AGENT_READ,
    Permission.CONVERSATION_READ,
    Permission.DREAM_READ,
    Permission.TIME_TRAVEL_READ,
    Permission.SKILL_READ,
    Permission.MARKETPLACE_READ,
    Permission.COST_READ,
  ],
};

/**
 * User with role information
 */
export interface UserWithRole {
  id: string;
  email: string;
  name?: string;
  role: Role;
  organizationId?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Check if a role has a specific permission
 */
export function hasPermission(role: Role, permission: Permission): boolean {
  const rolePermissions = ROLE_PERMISSIONS[role];
  return rolePermissions.includes(permission);
}

/**
 * Check if a user has a specific permission
 */
export function userHasPermission(user: UserWithRole, permission: Permission): boolean {
  return hasPermission(user.role, permission);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role];
}

/**
 * Check if a role can perform an action on a resource
 */
export function canAccess(role: Role, resource: string, action: string): boolean {
  const permission = `${resource}:${action}` as Permission;
  return hasPermission(role, permission);
}

/**
 * Check if user owns a resource (for owner-based access control)
 */
export function isOwner(userId: string, resourceOwnerId: string): boolean {
  return userId === resourceOwnerId;
}

/**
 * Check access with ownership fallback
 * Allows access if user has permission OR is the owner
 */
export function canAccessOrOwn(
  user: UserWithRole,
  permission: Permission,
  resourceOwnerId?: string,
): boolean {
  // Has permission via role
  if (userHasPermission(user, permission)) {
    return true;
  }

  // Or is the owner
  if (resourceOwnerId && isOwner(user.id, resourceOwnerId)) {
    return true;
  }

  return false;
}

/**
 * Get role hierarchy level (for comparison)
 */
export function getRoleLevel(role: Role): number {
  const levels: Record<Role, number> = {
    [Role.ADMIN]: 3,
    [Role.DEVELOPER]: 2,
    [Role.VIEWER]: 1,
  };
  return levels[role];
}

/**
 * Check if role A has equal or higher privileges than role B
 */
export function hasHigherOrEqualRole(roleA: Role, roleB: Role): boolean {
  return getRoleLevel(roleA) >= getRoleLevel(roleB);
}
