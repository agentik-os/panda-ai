# Step-063: File Operations Skill - Design Document

**Status:** Design Phase
**Owner:** cli-sdk-2
**Created:** 2026-02-14
**Estimated:** 14 hours (implementation)

---

## Overview

Build a **secure, sandboxed file operations skill** that allows AI agents to safely interact with the filesystem through a permission-based access control system.

### Key Requirements

- ✅ Sandboxed file operations (read, write, list, delete)
- ✅ Permission-based access control (`fs:read`, `fs:write`, `fs:list`, `fs:delete`)
- ✅ Support for text and binary files
- ✅ Recursive directory operations
- ✅ File metadata (size, modified date, permissions)
- ✅ Path traversal protection (strict sandboxing)
- ✅ Quota limits per agent (prevent disk abuse)
- ✅ WASM sandbox integration (Step-060)
- ✅ Permission system integration (Step-061)

---

## Dependencies

- ✅ Step-060: WASM Sandbox with Extism (completed)
- ✅ Step-061: Permission System for Skills (completed)
- 📚 Reference: Step-062 Web Search Skill (pattern)

---

## Security Model

### 1. Sandboxing Layers

```
┌─────────────────────────────────────────┐
│ Agent Request                           │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ Permission Validation (Step-061)        │
│ - Check fs:read / fs:write / fs:list   │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ Path Validation                         │
│ - Normalize path                        │
│ - Check against allowed roots           │
│ - Prevent traversal (../, symlinks)     │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ Quota Check                             │
│ - Check agent's disk usage              │
│ - Enforce size limits                   │
└──────────────┬──────────────────────────┘
               │
               ↓
┌─────────────────────────────────────────┐
│ WASM Sandbox Execution                  │
│ - Isolated filesystem operations        │
└─────────────────────────────────────────┘
```

### 2. Permission Model

| Permission | Operations Allowed | Example Path Patterns |
|------------|-------------------|----------------------|
| `fs:read` | `readFile`, `readDir`, `stat` | All read operations |
| `fs:read:/tmp/*` | Read only in `/tmp/` | Scoped read access |
| `fs:write` | `writeFile`, `mkdir`, `copy` | All write operations |
| `fs:write:/data/*` | Write only in `/data/` | Scoped write access |
| `fs:list` | `listDir`, `glob` | Directory listing |
| `fs:delete` | `deleteFile`, `deleteDir` | Deletion operations |
| `fs:*` | All operations | Full filesystem access (DANGEROUS) |

**Principle:** Agents request **specific** permissions. Default is DENY ALL.

### 3. Path Traversal Protection

**Attack Vectors Blocked:**
```typescript
// ❌ BLOCKED - Attempts to escape sandbox
"/../../etc/passwd"              → Error: Path outside allowed roots
"./data/../../../etc/passwd"     → Error: Path outside allowed roots
"/tmp/symlink-to-root"           → Error: Symlinks not followed by default
"../../../../../etc"             → Error: Path outside allowed roots
"/data/file\x00.txt"             → Error: Null bytes not allowed
```

**Allowed Roots (Configurable per Agent):**
```typescript
interface FileOpsConfig {
  allowedRoots: string[];  // e.g., ["/data/agent-123", "/tmp"]
  followSymlinks: boolean; // Default: false
  maxFileSize: number;     // Default: 10MB
  quotaMB: number;         // Default: 100MB per agent
}
```

**Implementation:**
```typescript
function validatePath(path: string, allowedRoots: string[]): string {
  // 1. Normalize path (resolve .., symlinks if allowed)
  const normalized = resolvePath(path);

  // 2. Check for null bytes
  if (normalized.includes('\x00')) {
    throw new Error('Invalid path: null byte detected');
  }

  // 3. Ensure path is within allowed roots
  const isWithinAllowedRoot = allowedRoots.some(root =>
    normalized.startsWith(root)
  );

  if (!isWithinAllowedRoot) {
    throw new Error(`Access denied: ${path} outside allowed roots`);
  }

  return normalized;
}
```

### 4. Quota Enforcement

```typescript
interface AgentQuota {
  agentId: string;
  usedMB: number;      // Current disk usage
  limitMB: number;     // Maximum allowed (default: 100MB)
  fileCount: number;   // Number of files
  lastUpdated: Date;
}

class QuotaManager {
  async checkQuota(agentId: string, additionalBytes: number): Promise<void> {
    const quota = await this.getQuota(agentId);
    const newUsageMB = (quota.usedMB * 1024 * 1024 + additionalBytes) / (1024 * 1024);

    if (newUsageMB > quota.limitMB) {
      throw new Error(
        `Quota exceeded: ${newUsageMB.toFixed(2)}MB / ${quota.limitMB}MB`
      );
    }
  }

  async updateQuota(agentId: string, deltaBytes: number): Promise<void> {
    // Update agent's disk usage in database
  }
}
```

---

## API Surface

### Core Operations

#### 1. Read Operations

```typescript
/**
 * Read file contents (text or binary)
 */
async function readFile(options: {
  path: string;
  encoding?: 'utf-8' | 'binary' | 'base64';
}): Promise<ReadFileResponse>;

interface ReadFileResponse {
  content: string | Buffer;
  size: number;
  encoding: string;
  checksum: string; // SHA-256 hash
}

/**
 * List directory contents
 */
async function listDir(options: {
  path: string;
  recursive?: boolean;
  pattern?: string; // glob pattern
}): Promise<ListDirResponse>;

interface ListDirResponse {
  entries: FileEntry[];
  totalCount: number;
}

interface FileEntry {
  name: string;
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modified: Date;
  created: Date;
  permissions: string; // e.g., "rw-r--r--"
}

/**
 * Get file metadata
 */
async function stat(path: string): Promise<FileStats>;

interface FileStats {
  path: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modified: Date;
  created: Date;
  accessed: Date;
  permissions: string;
  owner?: string;
  group?: string;
}
```

#### 2. Write Operations

```typescript
/**
 * Write file (create or overwrite)
 */
async function writeFile(options: {
  path: string;
  content: string | Buffer;
  encoding?: 'utf-8' | 'binary' | 'base64';
  createDirs?: boolean; // Create parent directories
}): Promise<WriteFileResponse>;

interface WriteFileResponse {
  path: string;
  size: number;
  created: boolean; // true if new, false if overwrote
}

/**
 * Append to file
 */
async function appendFile(options: {
  path: string;
  content: string | Buffer;
  encoding?: 'utf-8' | 'binary';
}): Promise<WriteFileResponse>;

/**
 * Create directory
 */
async function mkdir(options: {
  path: string;
  recursive?: boolean;
}): Promise<MkdirResponse>;

interface MkdirResponse {
  path: string;
  created: boolean;
}

/**
 * Copy file or directory
 */
async function copy(options: {
  source: string;
  destination: string;
  overwrite?: boolean;
}): Promise<CopyResponse>;

interface CopyResponse {
  source: string;
  destination: string;
  size: number;
}

/**
 * Move/rename file or directory
 */
async function move(options: {
  source: string;
  destination: string;
  overwrite?: boolean;
}): Promise<MoveResponse>;

interface MoveResponse {
  oldPath: string;
  newPath: string;
}
```

#### 3. Delete Operations

```typescript
/**
 * Delete file
 */
async function deleteFile(path: string): Promise<DeleteResponse>;

/**
 * Delete directory (with safety checks)
 */
async function deleteDir(options: {
  path: string;
  recursive?: boolean;
  confirmDangerous?: boolean; // Required for recursive deletes
}): Promise<DeleteResponse>;

interface DeleteResponse {
  path: string;
  deleted: boolean;
  freedMB: number; // Disk space freed
}
```

#### 4. Utility Operations

```typescript
/**
 * Check if path exists
 */
async function exists(path: string): Promise<boolean>;

/**
 * Get file checksum
 */
async function checksum(options: {
  path: string;
  algorithm?: 'sha256' | 'md5';
}): Promise<ChecksumResponse>;

interface ChecksumResponse {
  path: string;
  checksum: string;
  algorithm: string;
}

/**
 * Get agent's current quota usage
 */
async function getQuota(agentId: string): Promise<QuotaResponse>;

interface QuotaResponse {
  agentId: string;
  usedMB: number;
  limitMB: number;
  fileCount: number;
  percentUsed: number;
}
```

---

## Implementation Structure

### File: `skills/file-ops/index.ts`

```typescript
/**
 * File Operations Skill
 *
 * Provides secure, sandboxed filesystem operations with permission-based
 * access control and quota enforcement.
 */

import { promises as fs } from 'fs';
import { join, resolve, relative } from 'path';
import { createHash } from 'crypto';

// ============================================================================
// Configuration
// ============================================================================

export interface FileOpsConfig {
  /** Allowed root directories (sandbox boundaries) */
  allowedRoots: string[];

  /** Follow symlinks (default: false for security) */
  followSymlinks?: boolean;

  /** Maximum file size in bytes (default: 10MB) */
  maxFileSize?: number;

  /** Agent disk quota in MB (default: 100MB) */
  quotaMB?: number;

  /** Enable quota enforcement (default: true) */
  enforceQuota?: boolean;
}

// ============================================================================
// Path Validator
// ============================================================================

class PathValidator {
  constructor(private allowedRoots: string[]) {}

  validate(path: string): string {
    // Implementation of validatePath logic from security section
  }

  isWithinRoots(path: string): boolean {
    // Check if path is within allowed roots
  }
}

// ============================================================================
// Quota Manager
// ============================================================================

class QuotaManager {
  // Implementation from security section
}

// ============================================================================
// File Operations Skill Class
// ============================================================================

export class FileOpsSkill {
  private config: Required<FileOpsConfig>;
  private pathValidator: PathValidator;
  private quotaManager: QuotaManager;

  constructor(config: FileOpsConfig) {
    // Initialize with defaults
    this.config = {
      allowedRoots: config.allowedRoots,
      followSymlinks: config.followSymlinks ?? false,
      maxFileSize: config.maxFileSize ?? 10 * 1024 * 1024, // 10MB
      quotaMB: config.quotaMB ?? 100,
      enforceQuota: config.enforceQuota ?? true,
    };

    this.pathValidator = new PathValidator(this.config.allowedRoots);
    this.quotaManager = new QuotaManager();
  }

  /**
   * Read file
   */
  async readFile(options: ReadFileOptions): Promise<ReadFileResponse> {
    // Implementation
  }

  /**
   * Write file
   */
  async writeFile(options: WriteFileOptions): Promise<WriteFileResponse> {
    // Implementation with quota check
  }

  // ... other operations
}

// ============================================================================
// Exported Functions (for WASM/MCP integration)
// ============================================================================

let skillInstance: FileOpsSkill | null = null;

export function initialize(config: FileOpsConfig): void {
  skillInstance = new FileOpsSkill(config);
}

export async function readFile(
  options: ReadFileOptions
): Promise<ReadFileResponse> {
  if (!skillInstance) {
    throw new Error('FileOpsSkill not initialized');
  }
  return skillInstance.readFile(options);
}

// ... other exported functions

export default {
  initialize,
  readFile,
  writeFile,
  listDir,
  deleteFile,
  // ... all operations
  FileOpsSkill,
};
```

---

## Integration with Permission System (Step-061)

### Permission Validation Flow

```typescript
/**
 * Before any file operation, check permissions
 */
async function checkPermissions(
  operation: FileOperation,
  path: string,
  agentId: string
): Promise<void> {
  const permissionSystem = getPermissionSystem();

  // Map operation to required permission
  const requiredPermission = mapOperationToPermission(operation, path);

  // Validate with Step-061 permission system
  const hasPermission = await permissionSystem.hasPermission(
    agentId,
    requiredPermission
  );

  if (!hasPermission) {
    throw new Error(
      `Permission denied: Agent ${agentId} lacks ${requiredPermission} for ${path}`
    );
  }
}

function mapOperationToPermission(
  operation: FileOperation,
  path: string
): string {
  const operations = {
    readFile: `fs:read:${path}`,
    writeFile: `fs:write:${path}`,
    listDir: `fs:list:${path}`,
    deleteFile: `fs:delete:${path}`,
    deleteDir: `fs:delete:${path}`,
  };

  return operations[operation] || `fs:*:${path}`;
}
```

### Permission Request in skill.json

```json
{
  "permissions": [
    "fs:read:/data/*",
    "fs:write:/data/*",
    "fs:list:/data/*",
    "fs:delete:/data/*"
  ]
}
```

---

## Error Handling

### Error Types

```typescript
export class FileOpsError extends Error {
  constructor(
    public code: FileOpsErrorCode,
    message: string,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'FileOpsError';
  }
}

export enum FileOpsErrorCode {
  // Permission errors
  PERMISSION_DENIED = 'PERMISSION_DENIED',
  PATH_OUTSIDE_SANDBOX = 'PATH_OUTSIDE_SANDBOX',

  // File system errors
  FILE_NOT_FOUND = 'FILE_NOT_FOUND',
  FILE_EXISTS = 'FILE_EXISTS',
  DIRECTORY_NOT_EMPTY = 'DIRECTORY_NOT_EMPTY',
  INVALID_PATH = 'INVALID_PATH',

  // Quota errors
  QUOTA_EXCEEDED = 'QUOTA_EXCEEDED',
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',

  // Operation errors
  READ_FAILED = 'READ_FAILED',
  WRITE_FAILED = 'WRITE_FAILED',
  DELETE_FAILED = 'DELETE_FAILED',
}
```

### Error Examples

```typescript
try {
  await writeFile({
    path: '/data/file.txt',
    content: 'Hello',
  });
} catch (error) {
  if (error.code === 'QUOTA_EXCEEDED') {
    console.log('Agent quota exceeded. Delete files or request more space.');
  } else if (error.code === 'PERMISSION_DENIED') {
    console.log('Agent lacks fs:write permission for this path.');
  } else if (error.code === 'PATH_OUTSIDE_SANDBOX') {
    console.log('Attempted path traversal attack detected.');
  }
}
```

---

## Test Plan

### Unit Tests

```typescript
describe('FileOpsSkill', () => {
  describe('Path Validation', () => {
    it('should block path traversal attempts', async () => {
      const skill = new FileOpsSkill({
        allowedRoots: ['/data/agent-123'],
      });

      await expect(
        skill.readFile({ path: '/data/agent-123/../../etc/passwd' })
      ).rejects.toThrow('Path outside allowed roots');
    });

    it('should allow paths within sandbox', async () => {
      // Test valid paths
    });

    it('should block null byte injection', async () => {
      // Test null byte protection
    });

    it('should block symlink traversal when disabled', async () => {
      // Test symlink protection
    });
  });

  describe('Quota Enforcement', () => {
    it('should enforce disk quota limits', async () => {
      const skill = new FileOpsSkill({
        allowedRoots: ['/data'],
        quotaMB: 1, // 1MB limit
      });

      const largecontent = 'x'.repeat(2 * 1024 * 1024); // 2MB

      await expect(
        skill.writeFile({
          path: '/data/large.txt',
          content: largeContent,
        })
      ).rejects.toThrow('Quota exceeded');
    });

    it('should update quota after operations', async () => {
      // Test quota updates
    });
  });

  describe('Read Operations', () => {
    it('should read text files', async () => {
      // Test text file reading
    });

    it('should read binary files', async () => {
      // Test binary file reading
    });

    it('should list directory contents', async () => {
      // Test directory listing
    });

    it('should get file stats', async () => {
      // Test stat operation
    });
  });

  describe('Write Operations', () => {
    it('should create new files', async () => {
      // Test file creation
    });

    it('should overwrite existing files', async () => {
      // Test file overwriting
    });

    it('should create parent directories', async () => {
      // Test createDirs option
    });

    it('should enforce max file size', async () => {
      // Test file size limits
    });
  });

  describe('Delete Operations', () => {
    it('should delete files', async () => {
      // Test file deletion
    });

    it('should delete directories recursively', async () => {
      // Test recursive directory deletion
    });

    it('should require confirmation for dangerous deletes', async () => {
      // Test safety confirmation
    });
  });
});
```

### Integration Tests

```typescript
describe('FileOps + Permission System Integration', () => {
  it('should deny operations without permission', async () => {
    const agent = createAgent({
      id: 'agent-123',
      permissions: [], // No file permissions
    });

    await expect(
      runSkillAsAgent(agent, 'file-ops', {
        operation: 'readFile',
        path: '/data/file.txt',
      })
    ).rejects.toThrow('Permission denied: Agent lacks fs:read');
  });

  it('should allow operations with permission', async () => {
    const agent = createAgent({
      id: 'agent-123',
      permissions: ['fs:read:/data/*'],
    });

    const result = await runSkillAsAgent(agent, 'file-ops', {
      operation: 'readFile',
      path: '/data/file.txt',
    });

    expect(result.content).toBeDefined();
  });
});

describe('FileOps + WASM Sandbox Integration', () => {
  it('should run file operations in WASM sandbox', async () => {
    // Test WASM execution
  });

  it('should enforce sandbox boundaries', async () => {
    // Test that WASM cannot escape sandbox
  });
});
```

### Security Tests

```typescript
describe('Security Tests', () => {
  const attackVectors = [
    '/../../etc/passwd',
    '../../../etc/passwd',
    '/data/../../../etc',
    '/data/file\x00.txt',
    '/data/symlink-to-root',
  ];

  attackVectors.forEach(vector => {
    it(`should block attack vector: ${vector}`, async () => {
      await expect(
        skill.readFile({ path: vector })
      ).rejects.toThrow();
    });
  });
});
```

---

## skill.json

```json
{
  "id": "file-ops",
  "name": "File Operations",
  "version": "1.0.0",
  "description": "Secure, sandboxed file operations with permission-based access control",
  "author": "Agentik OS",
  "type": "builtin",
  "permissions": [
    "fs:read",
    "fs:write",
    "fs:list",
    "fs:delete"
  ],
  "quota": {
    "diskMB": 100,
    "maxFileSize": 10485760
  },
  "config": {
    "allowedRoots": [
      "/data/agents"
    ],
    "followSymlinks": false,
    "maxFileSize": 10485760,
    "quotaMB": 100,
    "enforceQuota": true
  },
  "dependencies": {
    "glob": "^10.0.0"
  }
}
```

---

## README.md Outline

```markdown
# File Operations Skill

Secure, sandboxed filesystem operations for AI agents.

## Features

- ✅ Read, write, list, delete operations
- ✅ Permission-based access control
- ✅ Path traversal protection
- ✅ Quota enforcement (100MB default)
- ✅ Text and binary file support
- ✅ Recursive directory operations
- ✅ File metadata and checksums
- ✅ WASM sandbox integration

## Installation

[Installation instructions]

## Usage

### Basic Examples

[Code examples for common operations]

### Security

[Security features and best practices]

## API Reference

[Complete API documentation]

## Permissions

[Permission model explanation]

## Quota Management

[Quota system explanation]

## Error Handling

[Error types and handling]

## Testing

[Test instructions]

## Integration with Agentik OS

[Integration guide]
```

---

## Implementation Checklist

### Phase 1: Core Implementation (8 hours)
- [ ] Create `skills/file-ops/` directory structure
- [ ] Implement PathValidator class
- [ ] Implement QuotaManager class
- [ ] Implement FileOpsSkill class
- [ ] Implement all read operations (readFile, listDir, stat)
- [ ] Implement all write operations (writeFile, mkdir, copy, move)
- [ ] Implement all delete operations (deleteFile, deleteDir)
- [ ] Implement utility operations (exists, checksum, getQuota)

### Phase 2: Security & Integration (3 hours)
- [ ] Integrate with Step-061 Permission System
- [ ] Add path validation for all operations
- [ ] Add quota checks for write/copy operations
- [ ] Implement error handling with FileOpsError
- [ ] Add logging for security events

### Phase 3: Testing (2 hours)
- [ ] Write unit tests (100+ test cases)
- [ ] Write integration tests with permission system
- [ ] Write security tests (attack vectors)
- [ ] Test WASM sandbox integration
- [ ] Test quota enforcement

### Phase 4: Documentation (1 hour)
- [ ] Write skill.json
- [ ] Write comprehensive README.md
- [ ] Add inline code documentation
- [ ] Create usage examples
- [ ] Document permission model

---

## Security Considerations

### Critical Security Rules

1. **Default Deny:** All file operations denied unless explicitly permitted
2. **No Global Access:** Never grant `fs:*` permission by default
3. **Validate Everything:** Validate ALL paths before ANY operation
4. **Audit Logging:** Log all permission denials and quota violations
5. **Fail Secure:** On error, deny operation (don't fall back to permissive)

### Security Testing Requirements

- [ ] Fuzz testing with random path inputs
- [ ] Penetration testing by security team
- [ ] Code review by architect for security vulnerabilities
- [ ] Verify WASM sandbox cannot be escaped
- [ ] Verify quota cannot be bypassed

---

## Performance Considerations

- **Caching:** Cache path validation results (with TTL)
- **Async I/O:** All operations use async fs promises
- **Batch Operations:** Support batch reads/writes to reduce overhead
- **Quota Checks:** Cache quota status (refresh every 5 seconds)
- **Symlink Resolution:** Only resolve when `followSymlinks: true`

---

## Future Enhancements

- [ ] File watching (monitor for changes)
- [ ] Stream support for large files
- [ ] Compression support (gzip, zip)
- [ ] Search within files (grep-like)
- [ ] File versioning/backup
- [ ] Cloud storage integration (S3, GCS)

---

**Design Complete:** Ready for implementation by channels-integrations-3 or runtime-backend-2
**Next Step:** Review by architect + team-lead, then implement
