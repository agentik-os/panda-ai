/**
 * Permission System for Skill Sandboxing
 *
 * Defines what capabilities a skill can access at runtime.
 * Permissions are declarative and checked before granting access to host functions.
 */

/**
 * Available permission types for skills
 */
export enum PermissionType {
  // File system access
  FS_READ = 'fs:read',
  FS_WRITE = 'fs:write',
  FS_DELETE = 'fs:delete',
  FS_LIST = 'fs:list',

  // Network access
  NET_HTTP = 'net:http',
  NET_HTTPS = 'net:https',
  NET_WS = 'net:ws',
  NET_ANY = 'net:*',

  // Environment variables
  ENV_READ = 'env:read',
  ENV_WRITE = 'env:write',

  // Memory/Storage
  MEMORY_READ = 'memory:read',
  MEMORY_WRITE = 'memory:write',
  KV_READ = 'kv:read',
  KV_WRITE = 'kv:write',

  // System capabilities
  SYS_TIME = 'sys:time',
  SYS_RANDOM = 'sys:random',
  SYS_PROCESS = 'sys:process',

  // AI/Model access
  AI_MODEL_CALL = 'ai:model_call',
  AI_EMBEDDING = 'ai:embedding',

  // External services
  EXTERNAL_API = 'external:api',
  EXTERNAL_WEBHOOK = 'external:webhook',
}

/**
 * Permission declaration for a skill
 */
export interface Permission {
  /** Type of permission */
  type: PermissionType;

  /** Optional resource identifier (e.g., file path, URL domain) */
  resource?: string;

  /** Human-readable reason for requiring this permission */
  reason?: string;

  /** Whether this permission is optional (skill can run without it) */
  optional?: boolean;
}

/**
 * Collection of permissions for a skill
 */
export interface PermissionSet {
  /** List of permissions requested by the skill */
  permissions: Permission[];

  /** Whether to allow any permissions not explicitly listed */
  allowUnlisted?: boolean;
}

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  /** Whether the permission is granted */
  granted: boolean;

  /** Reason for denial (if denied) */
  reason?: string;

  /** Permission that was checked */
  permission: Permission;
}

/**
 * Permission checker - validates if a skill can perform an action
 */
export class PermissionChecker {
  private permissionSet: PermissionSet;

  constructor(permissionSet: PermissionSet) {
    this.permissionSet = permissionSet;
  }

  /**
   * Check if a specific permission is granted
   */
  check(
    type: PermissionType,
    resource?: string,
  ): PermissionCheckResult {
    // Find matching permission in the set
    const permission = this.permissionSet.permissions.find((p) => {
      // Exact type match
      if (p.type !== type) {
        return false;
      }

      // If no resource specified, permission applies to all resources of this type
      if (!p.resource) {
        return true;
      }

      // If resource specified, it must match
      if (resource && this.matchResource(p.resource, resource)) {
        return true;
      }

      return false;
    });

    if (permission) {
      return {
        granted: true,
        permission,
      };
    }

    // Check wildcard permissions
    if (this.permissionSet.allowUnlisted) {
      return {
        granted: true,
        permission: {
          type,
          resource,
          reason: 'Allowed via allowUnlisted flag',
        },
      };
    }

    return {
      granted: false,
      reason: `Permission ${type} not granted for resource: ${resource ?? 'any'}`,
      permission: {
        type,
        resource,
      },
    };
  }

  /**
   * Check multiple permissions at once
   */
  checkMultiple(
    checks: Array<{ type: PermissionType; resource?: string }>,
  ): PermissionCheckResult[] {
    return checks.map(({ type, resource }) => this.check(type, resource));
  }

  /**
   * Check if ALL permissions in a list are granted
   */
  checkAll(
    checks: Array<{ type: PermissionType; resource?: string }>,
  ): boolean {
    return this.checkMultiple(checks).every((result) => result.granted);
  }

  /**
   * Check if ANY permission in a list is granted
   */
  checkAny(
    checks: Array<{ type: PermissionType; resource?: string }>,
  ): boolean {
    return this.checkMultiple(checks).some((result) => result.granted);
  }

  /**
   * Get all granted permissions
   */
  getGrantedPermissions(): Permission[] {
    return this.permissionSet.permissions;
  }

  /**
   * Match a resource pattern against an actual resource
   * Supports wildcards and glob patterns
   */
  private matchResource(pattern: string, resource: string): boolean {
    // Exact match
    if (pattern === resource) {
      return true;
    }

    // Wildcard match (e.g., "*.example.com" matches "api.example.com")
    if (pattern.includes('*')) {
      const regexPattern = pattern
        .replace(/\./g, '\\.')
        .replace(/\*/g, '.*');
      const regex = new RegExp(`^${regexPattern}$`);
      return regex.test(resource);
    }

    // Prefix match (e.g., "/app/" matches "/app/config.json")
    if (pattern.endsWith('/') && resource.startsWith(pattern)) {
      return true;
    }

    return false;
  }

  /**
   * Create a permission checker with common presets
   */
  static fromPreset(preset: 'minimal' | 'standard' | 'unrestricted'): PermissionChecker {
    const presets: Record<string, PermissionSet> = {
      minimal: {
        permissions: [
          {
            type: PermissionType.SYS_TIME,
            reason: 'Read system time',
          },
          {
            type: PermissionType.SYS_RANDOM,
            reason: 'Generate random numbers',
          },
        ],
        allowUnlisted: false,
      },
      standard: {
        permissions: [
          {
            type: PermissionType.SYS_TIME,
            reason: 'Read system time',
          },
          {
            type: PermissionType.SYS_RANDOM,
            reason: 'Generate random numbers',
          },
          {
            type: PermissionType.KV_READ,
            reason: 'Read from key-value store',
          },
          {
            type: PermissionType.KV_WRITE,
            reason: 'Write to key-value store',
          },
          {
            type: PermissionType.NET_HTTPS,
            reason: 'Make HTTPS requests',
          },
        ],
        allowUnlisted: false,
      },
      unrestricted: {
        permissions: [],
        allowUnlisted: true,
      },
    };

    return new PermissionChecker(presets[preset]!);
  }
}

/**
 * Permission validator - validates permission declarations
 */
export class PermissionValidator {
  /**
   * Validate a permission set
   */
  static validate(permissionSet: PermissionSet): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    if (!permissionSet.permissions || !Array.isArray(permissionSet.permissions)) {
      errors.push('permissions must be an array');
      return { valid: false, errors };
    }

    permissionSet.permissions.forEach((permission, index) => {
      if (!permission.type) {
        errors.push(`Permission at index ${index} missing type`);
      }

      if (permission.type && !Object.values(PermissionType).includes(permission.type)) {
        errors.push(
          `Permission at index ${index} has invalid type: ${permission.type}`,
        );
      }
    });

    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
