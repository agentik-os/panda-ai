/**
 * Skill Permission Checker
 *
 * Runtime permission checking for skills.
 * Validates that skill operations match declared permissions.
 */

import {
  type SkillPermissionSet,
  parsePermission,
  PermissionCategory,
} from "./permissions";

/**
 * Result of a permission check
 */
export interface PermissionCheckResult {
  /** Whether permission is granted */
  granted: boolean;
  /** Reason for grant/deny */
  reason?: string;
  /** Original permission string that was checked */
  permission?: string;
}

/**
 * Runtime permission checker for skills
 */
export class SkillPermissionChecker {
  private permissionSet: SkillPermissionSet;
  private rawPermissions: string[];

  constructor(permissions: string[]) {
    this.rawPermissions = permissions;
    // Build structured permission set from strings
    this.permissionSet = this.buildSet(permissions);
  }

  /**
   * Check if a filesystem read operation is allowed
   *
   * @param path - File path to read
   * @returns Permission check result
   */
  checkFilesystemRead(path: string): PermissionCheckResult {
    if (!this.permissionSet.filesystem?.read) {
      return {
        granted: false,
        reason: "No filesystem read permissions declared",
      };
    }

    const allowed = this.matchPath(path, this.permissionSet.filesystem.read);
    return {
      granted: allowed,
      reason: allowed
        ? `Read access granted for ${path}`
        : `Read access denied for ${path}`,
      permission: `fs:read:${path}`,
    };
  }

  /**
   * Check if a filesystem write operation is allowed
   *
   * @param path - File path to write
   * @returns Permission check result
   */
  checkFilesystemWrite(path: string): PermissionCheckResult {
    if (!this.permissionSet.filesystem?.write) {
      return {
        granted: false,
        reason: "No filesystem write permissions declared",
      };
    }

    const allowed = this.matchPath(path, this.permissionSet.filesystem.write);
    return {
      granted: allowed,
      reason: allowed
        ? `Write access granted for ${path}`
        : `Write access denied for ${path}`,
      permission: `fs:write:${path}`,
    };
  }

  /**
   * Check if a filesystem delete operation is allowed
   *
   * @param path - File path to delete
   * @returns Permission check result
   */
  checkFilesystemDelete(path: string): PermissionCheckResult {
    if (!this.permissionSet.filesystem?.delete) {
      return {
        granted: false,
        reason: "No filesystem delete permissions declared",
      };
    }

    const allowed = this.matchPath(path, this.permissionSet.filesystem.delete);
    return {
      granted: allowed,
      reason: allowed
        ? `Delete access granted for ${path}`
        : `Delete access denied for ${path}`,
      permission: `fs:delete:${path}`,
    };
  }

  /**
   * Check if a network request is allowed
   *
   * @param protocol - Network protocol (http, https, websocket)
   * @param domain - Target domain
   * @returns Permission check result
   */
  checkNetwork(protocol: string, domain?: string): PermissionCheckResult {
    // Check protocol
    if (!this.permissionSet.network?.protocols?.includes(protocol)) {
      return {
        granted: false,
        reason: `Protocol ${protocol} not allowed`,
        permission: `network:${protocol}`,
      };
    }

    // Check domain if specified
    if (domain) {
      // Check if domain is in allowed list
      if (this.permissionSet.network.allowedDomains) {
        const allowed = this.matchDomain(
          domain,
          this.permissionSet.network.allowedDomains,
        );
        if (!allowed) {
          return {
            granted: false,
            reason: `Domain ${domain} not in allowed list`,
            permission: `network:${protocol}:${domain}`,
          };
        }
      }

      // Check if domain is in blocked list
      if (this.permissionSet.network.blockedDomains) {
        const blocked = this.matchDomain(
          domain,
          this.permissionSet.network.blockedDomains,
        );
        if (blocked) {
          return {
            granted: false,
            reason: `Domain ${domain} is blocked`,
            permission: `network:${protocol}:${domain}`,
          };
        }
      }
    }

    return {
      granted: true,
      reason: domain
        ? `Network access granted for ${protocol}://${domain}`
        : `Network access granted for ${protocol}`,
      permission: domain ? `network:${protocol}:${domain}` : `network:${protocol}`,
    };
  }

  /**
   * Check if an API call is allowed
   *
   * @param endpoint - API endpoint or provider name
   * @returns Permission check result
   */
  checkAPI(endpoint: string): PermissionCheckResult {
    if (!this.permissionSet.api?.allowedEndpoints) {
      return {
        granted: false,
        reason: "No API permissions declared",
      };
    }

    const allowed = this.permissionSet.api.allowedEndpoints.some(
      (pattern) =>
        pattern === endpoint ||
        endpoint.startsWith(pattern) ||
        this.matchPattern(endpoint, pattern),
    );

    return {
      granted: allowed,
      reason: allowed
        ? `API access granted for ${endpoint}`
        : `API access denied for ${endpoint}`,
      permission: `api:${endpoint}`,
    };
  }

  /**
   * Check if AI model access is allowed
   *
   * @param provider - AI provider (e.g., "anthropic", "openai")
   * @param model - Model name (e.g., "claude-opus-4")
   * @returns Permission check result
   */
  checkAI(provider: string, model?: string): PermissionCheckResult {
    if (!this.permissionSet.ai) {
      return {
        granted: false,
        reason: "No AI permissions declared",
      };
    }

    // Check provider
    if (this.permissionSet.ai.providers) {
      if (!this.permissionSet.ai.providers.includes(provider)) {
        return {
          granted: false,
          reason: `AI provider ${provider} not allowed`,
          permission: `ai:provider:${provider}`,
        };
      }
    }

    // Check model if specified
    if (model && this.permissionSet.ai.models) {
      if (!this.permissionSet.ai.models.includes(model)) {
        return {
          granted: false,
          reason: `AI model ${model} not allowed`,
          permission: `ai:model:${model}`,
        };
      }
    }

    return {
      granted: true,
      reason: model
        ? `AI access granted for ${provider}/${model}`
        : `AI access granted for ${provider}`,
      permission: model ? `ai:model:${model}` : `ai:provider:${provider}`,
    };
  }

  /**
   * Check if a system operation is allowed
   *
   * @param operation - System operation (exec, env, spawn)
   * @returns Permission check result
   */
  checkSystem(operation: string): PermissionCheckResult {
    if (!this.permissionSet.system) {
      return {
        granted: false,
        reason: "No system permissions declared",
      };
    }

    let granted = false;
    switch (operation) {
      case "exec":
        granted = this.permissionSet.system.execCommands === true;
        break;
      case "env":
        granted = this.permissionSet.system.envAccess === true;
        break;
      case "spawn":
        granted = this.permissionSet.system.processSpawn === true;
        break;
      default:
        return {
          granted: false,
          reason: `Unknown system operation: ${operation}`,
        };
    }

    return {
      granted,
      reason: granted
        ? `System ${operation} permission granted`
        : `System ${operation} permission denied`,
      permission: `system:${operation}`,
    };
  }

  /**
   * Check if a key-value storage operation is allowed
   *
   * @param operation - KV operation (read, write)
   * @param key - Storage key
   * @returns Permission check result
   */
  checkKV(operation: "read" | "write", key: string): PermissionCheckResult {
    if (!this.permissionSet.kv) {
      return {
        granted: false,
        reason: "No key-value storage permissions declared",
      };
    }

    // Check operation type
    if (operation === "read" && !this.permissionSet.kv.read) {
      return {
        granted: false,
        reason: "KV read permission not granted",
        permission: "kv:read",
      };
    }

    if (operation === "write" && !this.permissionSet.kv.write) {
      return {
        granted: false,
        reason: "KV write permission not granted",
        permission: "kv:write",
      };
    }

    // Check key prefix if specified for this operation
    const prefixes = operation === "read"
      ? this.permissionSet.kv.readPrefixes
      : this.permissionSet.kv.writePrefixes;

    if (prefixes && prefixes.length > 0) {
      const allowed = prefixes.some((prefix) => key.startsWith(prefix));
      if (!allowed) {
        return {
          granted: false,
          reason: `Key ${key} does not match allowed ${operation} prefixes`,
          permission: `kv:${operation}:${key}`,
        };
      }
    }

    return {
      granted: true,
      reason: `KV ${operation} granted for ${key}`,
      permission: `kv:${operation}:${key}`,
    };
  }

  /**
   * Check if a raw permission string is granted
   *
   * @param permission - Permission string to check
   * @returns Permission check result
   */
  check(permission: string): PermissionCheckResult {
    const granted = this.rawPermissions.includes(permission);
    return {
      granted,
      reason: granted
        ? `Permission ${permission} granted`
        : `Permission ${permission} not declared`,
      permission,
    };
  }

  /**
   * Get all granted permissions
   *
   * @returns Array of granted permission strings
   */
  getGrantedPermissions(): string[] {
    return [...this.rawPermissions];
  }

  /**
   * Get structured permission set
   *
   * @returns Structured permission set
   */
  getPermissionSet(): SkillPermissionSet {
    return this.permissionSet;
  }

  /**
   * Build structured permission set from permission strings
   */
  private buildSet(permissions: string[]): SkillPermissionSet {
    const set: SkillPermissionSet = {};

    for (const perm of permissions) {
      const { category, resource, path } = parsePermission(perm);

      switch (category) {
        case PermissionCategory.FS:
          if (!set.filesystem) set.filesystem = {};
          if (resource === "read") {
            if (!set.filesystem.read) set.filesystem.read = [];
            set.filesystem.read.push(path ?? "*");
          } else if (resource === "write") {
            if (!set.filesystem.write) set.filesystem.write = [];
            set.filesystem.write.push(path ?? "*");
          } else if (resource === "delete") {
            if (!set.filesystem.delete) set.filesystem.delete = [];
            set.filesystem.delete.push(path ?? "*");
          }
          break;

        case PermissionCategory.NETWORK:
          if (!set.network) set.network = {};
          if (!set.network.protocols) set.network.protocols = [];
          if (!set.network.protocols.includes(resource)) {
            set.network.protocols.push(resource);
          }
          if (path) {
            if (!set.network.allowedDomains) set.network.allowedDomains = [];
            set.network.allowedDomains.push(path);
          }
          break;

        case PermissionCategory.SYSTEM:
          if (!set.system) set.system = {};
          if (resource === "exec") set.system.execCommands = true;
          if (resource === "env") set.system.envAccess = true;
          if (resource === "spawn") set.system.processSpawn = true;
          break;

        case PermissionCategory.API:
          if (!set.api) set.api = { allowedEndpoints: [] };
          if (!set.api.allowedEndpoints) set.api.allowedEndpoints = [];
          set.api.allowedEndpoints.push(path ?? resource);
          break;

        case PermissionCategory.AI:
          if (!set.ai) set.ai = {};
          if (resource === "provider") {
            if (!set.ai.providers) set.ai.providers = [];
            if (path) set.ai.providers.push(path);
          } else if (resource === "model") {
            if (!set.ai.models) set.ai.models = [];
            if (path) set.ai.models.push(path);
          }
          break;

        case PermissionCategory.KV:
          if (!set.kv) set.kv = {};
          if (resource === "read") {
            set.kv.read = true;
            if (path) {
              if (!set.kv.readPrefixes) set.kv.readPrefixes = [];
              set.kv.readPrefixes.push(path);
            }
          }
          if (resource === "write") {
            set.kv.write = true;
            if (path) {
              if (!set.kv.writePrefixes) set.kv.writePrefixes = [];
              set.kv.writePrefixes.push(path);
            }
          }
          break;
      }
    }

    return set;
  }

  /**
   * Match a path against allowed patterns
   * Supports wildcards (*) and glob patterns
   */
  private matchPath(path: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      // Wildcard - allow all
      if (pattern === "*") return true;

      // Exact match
      if (pattern === path) return true;

      // Prefix match with trailing slash (e.g., "/app/" matches "/app/config.json")
      if (pattern.endsWith("/") && path.startsWith(pattern)) return true;

      // Prefix match without trailing slash (e.g., "/app/data" matches "/app/data/file.txt")
      if (!pattern.endsWith("/") && path.startsWith(pattern + "/")) return true;

      // Glob pattern (e.g., "/app/*.json")
      if (pattern.includes("*")) {
        return this.matchPattern(path, pattern);
      }

      return false;
    });
  }

  /**
   * Match a domain against allowed patterns
   * Supports wildcards (*.example.com)
   */
  private matchDomain(domain: string, patterns: string[]): boolean {
    return patterns.some((pattern) => {
      // Wildcard - allow all
      if (pattern === "*") return true;

      // Exact match
      if (pattern === domain) return true;

      // Wildcard subdomain (*.example.com matches api.example.com)
      if (pattern.startsWith("*.")) {
        const baseDomain = pattern.slice(2);
        return domain.endsWith(`.${baseDomain}`) || domain === baseDomain;
      }

      return false;
    });
  }

  /**
   * Match a string against a glob pattern
   */
  private matchPattern(str: string, pattern: string): boolean {
    const regexPattern = pattern
      .replace(/[.+?^${}()|[\]\\]/g, "\\$&") // Escape regex special chars
      .replace(/\*/g, ".*"); // Convert * to .*
    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(str);
  }
}
