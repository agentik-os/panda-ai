/**
 * Skill Permission System
 *
 * Defines permission types and structures for skills.
 * Skills declare required permissions in their manifest (skill.json).
 * Permissions follow the format: "category:resource"
 *
 * @example
 * ```json
 * {
 *   "permissions": [
 *     "network:http",
 *     "fs:read:/app/data",
 *     "api:openai"
 *   ]
 * }
 * ```
 */

/**
 * Permission categories supported by skills
 */
export enum PermissionCategory {
  /** Filesystem access */
  FS = "fs",
  /** Network access */
  NETWORK = "network",
  /** System-level operations */
  SYSTEM = "system",
  /** External API access */
  API = "api",
  /** Environment variables */
  ENV = "env",
  /** Key-value storage */
  KV = "kv",
  /** AI model access */
  AI = "ai",
  /** Memory management */
  MEMORY = "memory",
  /** External tool execution */
  EXTERNAL = "external",
}

/**
 * Filesystem permission resources
 */
export enum FilesystemResource {
  READ = "read",
  WRITE = "write",
  DELETE = "delete",
  LIST = "list",
}

/**
 * Network permission resources
 */
export enum NetworkResource {
  HTTP = "http",
  HTTPS = "https",
  WEBSOCKET = "websocket",
  GRPC = "grpc",
}

/**
 * System permission resources
 */
export enum SystemResource {
  EXEC = "exec",
  TIME = "time",
  RANDOM = "random",
  SPAWN = "spawn",
}

/**
 * Skill permission structure
 */
export interface SkillPermission {
  /** Permission string in format "category:resource" or "category:resource:path" */
  permission: string;
  /** Reason this permission is required */
  reason?: string;
  /** Whether permission requires user approval */
  requiresApproval?: boolean;
}

/**
 * Complete skill permission set from manifest
 */
export interface SkillPermissionSet {
  /** Filesystem permissions */
  filesystem?: {
    /** Allowed read paths (glob patterns supported) */
    read?: string[];
    /** Allowed write paths (glob patterns supported) */
    write?: string[];
    /** Allowed delete paths (glob patterns supported) */
    delete?: string[];
  };
  /** Network permissions */
  network?: {
    /** Allowed protocols */
    protocols?: string[]; // ["http", "https"]
    /** Allowed domains (glob patterns supported) */
    allowedDomains?: string[];
    /** Blocked domains (glob patterns supported) */
    blockedDomains?: string[];
  };
  /** System permissions */
  system?: {
    /** Allow command execution */
    execCommands?: boolean;
    /** Allow environment variable access */
    envAccess?: boolean;
    /** Allow process spawning */
    processSpawn?: boolean;
  };
  /** API permissions */
  api?: {
    /** Allowed API endpoints */
    allowedEndpoints?: string[];
    /** Rate limit (requests per hour) */
    rateLimit?: number;
  };
  /** AI model permissions */
  ai?: {
    /** Allowed AI providers */
    providers?: string[]; // ["anthropic", "openai", "google"]
    /** Allowed models */
    models?: string[]; // ["claude-opus-4", "gpt-4"]
    /** Max tokens per request */
    maxTokens?: number;
  };
  /** Key-value storage permissions */
  kv?: {
    /** Allow read operations */
    read?: boolean;
    /** Allow write operations */
    write?: boolean;
    /** Allowed key prefixes for read operations */
    readPrefixes?: string[];
    /** Allowed key prefixes for write operations */
    writePrefixes?: string[];
  };
}

/**
 * Parse a permission string into category and resource
 *
 * @param permission - Permission string (e.g., "network:http", "fs:read:/app/data")
 * @returns Parsed permission components
 */
export function parsePermission(permission: string): {
  category: string;
  resource: string;
  path?: string;
} {
  const parts = permission.split(":");
  if (parts.length < 2) {
    throw new Error(
      `Invalid permission format: ${permission}. Expected "category:resource" or "category:resource:path"`,
    );
  }

  return {
    category: parts[0]!,
    resource: parts[1]!,
    path: parts.length > 2 ? parts.slice(2).join(":") : undefined,
  };
}

/**
 * Validate permission string format
 *
 * @param permission - Permission string to validate
 * @returns True if valid, false otherwise
 */
export function isValidPermission(permission: string): boolean {
  try {
    const { category, resource } = parsePermission(permission);

    // Check if category is valid
    if (!Object.values(PermissionCategory).includes(category as PermissionCategory)) {
      return false;
    }

    // Basic resource validation (non-empty)
    if (!resource || resource.length === 0) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Convert permission string array to SkillPermissionSet
 *
 * @param permissions - Array of permission strings
 * @returns Structured permission set
 */
export function buildPermissionSet(permissions: string[]): SkillPermissionSet {
  const set: SkillPermissionSet = {};

  for (const perm of permissions) {
    const { category, resource, path } = parsePermission(perm);

    switch (category) {
      case PermissionCategory.FS:
        if (!set.filesystem) set.filesystem = {};
        if (resource === FilesystemResource.READ) {
          if (!set.filesystem.read) set.filesystem.read = [];
          set.filesystem.read.push(path ?? "*");
        } else if (resource === FilesystemResource.WRITE) {
          if (!set.filesystem.write) set.filesystem.write = [];
          set.filesystem.write.push(path ?? "*");
        } else if (resource === FilesystemResource.DELETE) {
          if (!set.filesystem.delete) set.filesystem.delete = [];
          set.filesystem.delete.push(path ?? "*");
        }
        break;

      case PermissionCategory.NETWORK:
        if (!set.network) set.network = {};
        if (!set.network.protocols) set.network.protocols = [];
        set.network.protocols.push(resource);
        if (path) {
          if (!set.network.allowedDomains) set.network.allowedDomains = [];
          set.network.allowedDomains.push(path);
        }
        break;

      case PermissionCategory.SYSTEM:
        if (!set.system) set.system = {};
        if (resource === SystemResource.EXEC) {
          set.system.execCommands = true;
        } else if (resource === "env") {
          set.system.envAccess = true;
        } else if (resource === SystemResource.SPAWN) {
          set.system.processSpawn = true;
        }
        break;

      case PermissionCategory.API:
        if (!set.api) set.api = { allowedEndpoints: [] };
        if (!set.api.allowedEndpoints) set.api.allowedEndpoints = [];
        if (path) {
          set.api.allowedEndpoints.push(path);
        } else {
          set.api.allowedEndpoints.push(resource);
        }
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
        } else if (resource === "write") {
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
 * Check if a permission requires user approval
 *
 * @param permission - Permission string to check
 * @returns True if permission requires approval
 */
export function requiresApproval(permission: string): boolean {
  const { category, resource } = parsePermission(permission);

  // Permissions that always require approval
  const dangerousPerms = [
    { category: PermissionCategory.FS, resource: FilesystemResource.WRITE },
    { category: PermissionCategory.FS, resource: FilesystemResource.DELETE },
    { category: PermissionCategory.SYSTEM, resource: SystemResource.EXEC },
    { category: PermissionCategory.SYSTEM, resource: SystemResource.SPAWN },
  ];

  return dangerousPerms.some(
    (p) => p.category === category && p.resource === resource,
  );
}

/**
 * Get human-readable description of a permission
 *
 * @param permission - Permission string
 * @returns Human-readable description
 */
export function describePermission(permission: string): string {
  const { category, resource, path } = parsePermission(permission);

  const descriptions: Record<string, Record<string, string>> = {
    [PermissionCategory.FS]: {
      [FilesystemResource.READ]: path
        ? `Read files from ${path}`
        : "Read files",
      [FilesystemResource.WRITE]: path
        ? `Write files to ${path}`
        : "Write files",
      [FilesystemResource.DELETE]: path
        ? `Delete files from ${path}`
        : "Delete files",
    },
    [PermissionCategory.NETWORK]: {
      [NetworkResource.HTTP]: "Make HTTP requests",
      [NetworkResource.HTTPS]: path
        ? `Make HTTPS requests to ${path}`
        : "Make HTTPS requests",
      [NetworkResource.WEBSOCKET]: "Use WebSocket connections",
    },
    [PermissionCategory.SYSTEM]: {
      [SystemResource.EXEC]: "Execute system commands",
      [SystemResource.TIME]: "Access system time",
      [SystemResource.RANDOM]: "Generate random numbers",
      [SystemResource.SPAWN]: "Spawn new processes",
    },
    [PermissionCategory.API]: {
      default: path ? `Access ${resource} API at ${path}` : `Access ${resource} API`,
    },
    [PermissionCategory.AI]: {
      provider: path ? `Use ${path} AI provider` : "Use AI providers",
      model: path ? `Use ${path} AI model` : "Use AI models",
    },
    [PermissionCategory.KV]: {
      read: "Read from key-value store",
      write: "Write to key-value store",
    },
  };

  return (
    descriptions[category]?.[resource] ??
    descriptions[category]?.default ??
    `${category}:${resource}${path ? `:${path}` : ""}`
  );
}
