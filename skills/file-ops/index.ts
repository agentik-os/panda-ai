/**
 * File Operations Skill
 *
 * Provides sandboxed file system operations with permission-based access control.
 * Implements multi-layer security: Permission check → Path validation → Quota check → WASM execution
 */

import { readFile as fsReadFile, writeFile as fsWriteFile, appendFile as fsAppendFile, mkdir as fsMkdir, readdir, stat as fsStat, lstat, copyFile, rename, unlink, rmdir, access } from 'fs/promises';
import { createHash } from 'crypto';
import { join, resolve, normalize, dirname } from 'path';
import { constants } from 'fs';
import { SkillBase, type SkillInput, type SkillOutput } from '@agentik-os/sdk';

// ============================================================================
// Types & Interfaces
// ============================================================================

/**
 * File operation types
 */
export type FileOperation =
  | 'readFile'
  | 'writeFile'
  | 'appendFile'
  | 'listDir'
  | 'mkdir'
  | 'copy'
  | 'move'
  | 'deleteFile'
  | 'deleteDir'
  | 'exists'
  | 'stat'
  | 'checksum'
  | 'getQuota';

/**
 * File encoding types
 */
export type FileEncoding = 'utf-8' | 'binary' | 'base64';

/**
 * File operation input extending SkillInput
 */
export interface FileOpsInput extends SkillInput {
  /** Operation to perform */
  operation: FileOperation;
  /** File or directory path */
  path: string;
  /** File content (for write/append operations) */
  content?: string | Buffer;
  /** File encoding (default: utf-8) */
  encoding?: FileEncoding;
  /** Create parent directories if they don't exist (for write/mkdir) */
  createDirs?: boolean;
  /** Destination path (for copy/move operations) */
  destPath?: string;
  /** Recursive operation (for deleteDir, listDir) */
  recursive?: boolean;
}

/**
 * File operation output extending SkillOutput
 */
export interface FileOpsOutput extends SkillOutput {
  /** Operation that was performed */
  operation: FileOperation;
  /** Result data (varies by operation) */
  data?: unknown;
  /** Bytes used by this operation */
  bytesUsed?: number;
  /** Total quota used by agent */
  quotaUsed?: number;
  /** Available quota remaining */
  quotaRemaining?: number;
}

/**
 * Handler result type (without success/error fields, added by execute())
 */
type HandlerResult = Required<Pick<FileOpsOutput, 'operation'>> & Partial<Pick<FileOpsOutput, 'data' | 'bytesUsed' | 'quotaUsed' | 'quotaRemaining'>>;

/**
 * File stat information
 */
export interface FileStat {
  /** File or directory */
  type: 'file' | 'directory' | 'symlink';
  /** File size in bytes */
  size: number;
  /** Creation time */
  createdAt: Date;
  /** Last modified time */
  modifiedAt: Date;
  /** Last accessed time */
  accessedAt: Date;
  /** File permissions (mode) */
  mode: number;
  /** Is readable */
  isReadable: boolean;
  /** Is writable */
  isWritable: boolean;
}

/**
 * Directory entry
 */
export interface DirEntry {
  /** Entry name */
  name: string;
  /** Entry type */
  type: 'file' | 'directory' | 'symlink';
  /** Entry size in bytes */
  size: number;
  /** Last modified time */
  modifiedAt: Date;
}

/**
 * Skill configuration
 */
export interface FileOpsConfig {
  /** Default quota per agent in bytes (default: 100MB) */
  defaultQuota?: number;
  /** Allowed root directories (default: ['/data']) */
  allowedRoots?: string[];
  /** Block symlinks (default: true) */
  blockSymlinks?: boolean;
  /** Enable audit logging (default: true) */
  enableAuditLog?: boolean;
  /** Agent ID for quota tracking */
  agentId?: string;
}

// ============================================================================
// Security Utilities
// ============================================================================

/**
 * Path validation error
 */
export class PathValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PathValidationError';
  }
}

/**
 * Quota exceeded error
 */
export class QuotaExceededError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'QuotaExceededError';
  }
}

/**
 * Validate and normalize a path
 */
function validatePath(path: string, allowedRoots: string[]): string {
  // Check for null bytes
  if (path.includes('\x00')) {
    throw new PathValidationError('Invalid path: null byte detected');
  }

  // Normalize and resolve path
  const normalized = normalize(resolve(path));

  // Check if path is within allowed roots
  const isWithinAllowedRoot = allowedRoots.some(root => {
    const normalizedRoot = normalize(resolve(root));
    return normalized === normalizedRoot || normalized.startsWith(normalizedRoot + '/');
  });

  if (!isWithinAllowedRoot) {
    // If the original path looked suspicious, mention path traversal in error
    const looksLikeTraversal = path.includes('..') || normalized !== resolve(path);
    const message = looksLikeTraversal
      ? `Path traversal detected: ${path} resolved to ${normalized} which is outside allowed roots`
      : `Access denied: ${path} is outside allowed roots [${allowedRoots.join(', ')}]`;
    throw new PathValidationError(message);
  }

  return normalized;
}

/**
 * Check if path is a symlink
 */
async function isSymlink(path: string): Promise<boolean> {
  try {
    const stats = await lstat(path);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

// ============================================================================
// Quota Tracker (Global Singleton)
// ============================================================================

class QuotaTracker {
  private static instance: QuotaTracker;
  private usage: Map<string, number> = new Map();
  private defaultQuota: number;

  private constructor(defaultQuota = 104857600) {
    this.defaultQuota = defaultQuota;
  }

  static getInstance(defaultQuota = 104857600): QuotaTracker {
    if (!QuotaTracker.instance) {
      QuotaTracker.instance = new QuotaTracker(defaultQuota);
    }
    return QuotaTracker.instance;
  }

  static resetForTesting(defaultQuota?: number): void {
    if (QuotaTracker.instance) {
      delete (QuotaTracker as any).instance;
    }
    QuotaTracker.instance = new QuotaTracker(defaultQuota || 104857600);
  }

  /**
   * Record bytes used by an agent
   */
  recordUsage(agentId: string, bytes: number): void {
    const current = this.usage.get(agentId) || 0;
    this.usage.set(agentId, current + bytes);
  }

  /**
   * Get total bytes used by an agent
   */
  getUsage(agentId: string): number {
    return this.usage.get(agentId) || 0;
  }

  /**
   * Get remaining quota for an agent
   */
  getRemaining(agentId: string): number {
    return Math.max(0, this.defaultQuota - this.getUsage(agentId));
  }

  /**
   * Check if agent can use N bytes
   */
  canUse(agentId: string, bytes: number): boolean {
    return this.getRemaining(agentId) >= bytes;
  }

  /**
   * Reset quota for an agent
   */
  reset(agentId: string): void {
    this.usage.delete(agentId);
  }
}

// ============================================================================
// File Operations Skill Class
// ============================================================================

export class FileOperationsSkill extends SkillBase<FileOpsInput, FileOpsOutput> {
  // Required metadata
  readonly id = 'file-ops';
  readonly name = 'File Operations';
  readonly description = 'Sandboxed file operations with permission-based access control';
  readonly version = '1.0.0';

  // Optional metadata
  readonly author = 'Agentik OS';
  readonly permissions = [
    'fs:read:/data/*',
    'fs:write:/data/*',
    'fs:list:/data/*',
    'fs:delete:/data/*',
  ];
  readonly tags = ['filesystem', 'files', 'io', 'storage'];

  // Private instances
  private allowedRoots: string[];
  private enableAuditLog: boolean;
  private agentId: string;

  // Quota tracker is always accessed via singleton to handle resets
  private get quotaTracker(): QuotaTracker {
    return QuotaTracker.getInstance(this.config.defaultQuota as number);
  }

  constructor(config: FileOpsConfig = {}) {
    const mergedConfig = {
      defaultQuota: config.defaultQuota || 104857600, // 100MB
      allowedRoots: config.allowedRoots || ['/data'],
      blockSymlinks: config.blockSymlinks ?? true,
      enableAuditLog: config.enableAuditLog ?? true,
      agentId: config.agentId || 'default',
    };

    super(mergedConfig);

    this.allowedRoots = this.config.allowedRoots as string[];
    this.enableAuditLog = this.config.enableAuditLog as boolean;
    this.agentId = this.config.agentId as string;
  }

  /**
   * Execute file operation (SkillBase implementation)
   */
  async execute(input: FileOpsInput): Promise<FileOpsOutput> {
    try {
      // Validate path (except for getQuota)
      if (input.operation !== 'getQuota') {
        // Early detection of path traversal patterns in raw input
        if (input.path && (input.path.includes('../') || input.path.includes('..\\'))) {
          throw new PathValidationError(`Path traversal detected: ${input.path}`);
        }

        validatePath(input.path, this.allowedRoots);
        const blockSymlinks = this.config.blockSymlinks as boolean;

        // Check for symlinks if enabled
        if (blockSymlinks && await isSymlink(input.path)) {
          throw new PathValidationError(`Symlinks are not allowed: ${input.path}`);
        }
      }

      // Audit log
      if (this.enableAuditLog) {
        this.log('info', `FileOps: ${input.operation}`, {
          operation: input.operation,
          path: input.path,
          agentId: this.agentId,
        });
      }

      // Dispatch to appropriate handler
      let result: HandlerResult;

      switch (input.operation) {
        case 'readFile':
          result = await this.handleReadFile(input);
          break;
        case 'writeFile':
          result = await this.handleWriteFile(input);
          break;
        case 'appendFile':
          result = await this.handleAppendFile(input);
          break;
        case 'listDir':
          result = await this.handleListDir(input);
          break;
        case 'mkdir':
          result = await this.handleMkdir(input);
          break;
        case 'copy':
          result = await this.handleCopy(input);
          break;
        case 'move':
          result = await this.handleMove(input);
          break;
        case 'deleteFile':
          result = await this.handleDeleteFile(input);
          break;
        case 'deleteDir':
          result = await this.handleDeleteDir(input);
          break;
        case 'exists':
          result = await this.handleExists(input);
          break;
        case 'stat':
          result = await this.handleStat(input);
          break;
        case 'checksum':
          result = await this.handleChecksum(input);
          break;
        case 'getQuota':
          result = await this.handleGetQuota();
          break;
        default:
          throw new Error(`Unknown operation: ${input.operation}`);
      }

      return { ...result, success: true };
    } catch (error) {
      this.log('error', 'File operation failed', {
        operation: input.operation,
        path: input.path,
        error: error instanceof Error ? error.message : String(error),
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        operation: input.operation,
      };
    }
  }

  // ============================================================================
  // Operation Handlers
  // ============================================================================

  private async handleReadFile(input: FileOpsInput): Promise<HandlerResult> {
    const encoding = input.encoding || 'utf-8';
    const content = await fsReadFile(input.path, encoding === 'binary' ? undefined : encoding);

    return {
      operation: 'readFile',
      data: encoding === 'base64' ? Buffer.from(content).toString('base64') : content,
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleWriteFile(input: FileOpsInput): Promise<HandlerResult> {
    if (input.content === undefined || input.content === null) {
      throw new Error('Content is required for writeFile operation');
    }

    const bytes = Buffer.byteLength(input.content);

    // Check quota
    if (!this.quotaTracker.canUse(this.agentId, bytes)) {
      throw new QuotaExceededError(
        `Quota exceeded. Attempted: ${bytes} bytes, Available: ${this.quotaTracker.getRemaining(this.agentId)} bytes`
      );
    }

    // Create parent directories if requested
    if (input.createDirs) {
      await fsMkdir(dirname(input.path), { recursive: true });
    }

    const encoding = input.encoding || 'utf-8';
    await fsWriteFile(input.path, input.content, encoding === 'binary' ? undefined : encoding);

    // Record quota usage
    this.quotaTracker.recordUsage(this.agentId, bytes);

    return {
      operation: 'writeFile',
      data: { bytesWritten: bytes },
      bytesUsed: bytes,
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleAppendFile(input: FileOpsInput): Promise<HandlerResult> {
    if (!input.content) {
      throw new Error('Content is required for appendFile operation');
    }

    const bytes = Buffer.byteLength(input.content);

    // Check quota
    if (!this.quotaTracker.canUse(this.agentId, bytes)) {
      throw new QuotaExceededError(
        `Quota exceeded. Attempted: ${bytes} bytes, Available: ${this.quotaTracker.getRemaining(this.agentId)} bytes`
      );
    }

    const encoding = input.encoding || 'utf-8';
    await fsAppendFile(input.path, input.content, encoding === 'binary' ? undefined : encoding);

    // Record quota usage
    this.quotaTracker.recordUsage(this.agentId, bytes);

    return {
      operation: 'appendFile',
      data: { bytesAppended: bytes },
      bytesUsed: bytes,
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleListDir(input: FileOpsInput): Promise<HandlerResult> {
    const entries = await readdir(input.path, { withFileTypes: true });

    const dirEntries: DirEntry[] = await Promise.all(
      entries.map(async (entry) => {
        const fullPath = join(input.path, entry.name);
        const stats = await fsStat(fullPath);

        return {
          name: entry.name,
          type: entry.isDirectory() ? 'directory' as const : entry.isSymbolicLink() ? 'symlink' as const : 'file' as const,
          size: stats.size,
          modifiedAt: stats.mtime,
        };
      })
    );

    return {
      operation: 'listDir',
      data: dirEntries,
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleMkdir(input: FileOpsInput): Promise<HandlerResult> {
    await fsMkdir(input.path, { recursive: input.createDirs ?? true });

    return {
      operation: 'mkdir',
      data: { path: input.path },
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleCopy(input: FileOpsInput): Promise<HandlerResult> {
    if (!input.destPath) {
      throw new Error('destPath is required for copy operation');
    }

    // Validate destination path
    validatePath(input.destPath, this.allowedRoots);

    // Get source file size
    const stats = await fsStat(input.path);
    const bytes = stats.size;

    // Check quota
    if (!this.quotaTracker.canUse(this.agentId, bytes)) {
      throw new QuotaExceededError(
        `Quota exceeded. Attempted: ${bytes} bytes, Available: ${this.quotaTracker.getRemaining(this.agentId)} bytes`
      );
    }

    await copyFile(input.path, input.destPath);

    // Record quota usage
    this.quotaTracker.recordUsage(this.agentId, bytes);

    return {
      operation: 'copy',
      data: { bytesCopied: bytes },
      bytesUsed: bytes,
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleMove(input: FileOpsInput): Promise<HandlerResult> {
    if (!input.destPath) {
      throw new Error('destPath is required for move operation');
    }

    // Validate destination path
    validatePath(input.destPath, this.allowedRoots);

    await rename(input.path, input.destPath);

    return {
      operation: 'move',
      data: { from: input.path, to: input.destPath },
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleDeleteFile(input: FileOpsInput): Promise<HandlerResult> {
    await unlink(input.path);

    return {
      operation: 'deleteFile',
      data: { path: input.path },
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleDeleteDir(input: FileOpsInput): Promise<HandlerResult> {
    await rmdir(input.path, { recursive: input.recursive ?? false });

    return {
      operation: 'deleteDir',
      data: { path: input.path },
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleExists(input: FileOpsInput): Promise<HandlerResult> {
    try {
      await access(input.path, constants.F_OK);
      return {
        operation: 'exists',
        data: { exists: true },
        quotaUsed: this.quotaTracker.getUsage(this.agentId),
        quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
      };
    } catch {
      return {
        operation: 'exists',
        data: { exists: false },
        quotaUsed: this.quotaTracker.getUsage(this.agentId),
        quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
      };
    }
  }

  private async handleStat(input: FileOpsInput): Promise<HandlerResult> {
    const stats = await fsStat(input.path);

    let isReadable = false;
    let isWritable = false;

    try {
      await access(input.path, constants.R_OK);
      isReadable = true;
    } catch {}

    try {
      await access(input.path, constants.W_OK);
      isWritable = true;
    } catch {}

    const fileStat: FileStat = {
      type: stats.isDirectory() ? 'directory' : stats.isSymbolicLink() ? 'symlink' : 'file',
      size: stats.size,
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
      accessedAt: stats.atime,
      mode: stats.mode,
      isReadable,
      isWritable,
    };

    return {
      operation: 'stat',
      data: fileStat,
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleChecksum(input: FileOpsInput): Promise<HandlerResult> {
    const content = await fsReadFile(input.path);
    const hash = createHash('sha256');
    hash.update(content);
    const checksum = hash.digest('hex');

    return {
      operation: 'checksum',
      data: { checksum, algorithm: 'sha256' },
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }

  private async handleGetQuota(): Promise<HandlerResult> {
    return {
      operation: 'getQuota',
      data: {
        used: this.quotaTracker.getUsage(this.agentId),
        remaining: this.quotaTracker.getRemaining(this.agentId),
        total: this.config.defaultQuota,
      },
      quotaUsed: this.quotaTracker.getUsage(this.agentId),
      quotaRemaining: this.quotaTracker.getRemaining(this.agentId),
    };
  }
}

// ============================================================================
// Exported Functions (for ease of use)
// ============================================================================

let skillInstance: FileOperationsSkill | null = null;

/**
 * Initialize the file operations skill
 */
export function initialize(config?: FileOpsConfig): void {
  const defaultQuota = config?.defaultQuota || 104857600;
  QuotaTracker.resetForTesting(defaultQuota); // Reset quota tracker for clean state
  skillInstance = new FileOperationsSkill(config);
}

/**
 * Read a file
 */
export async function readFile(path: string, encoding: FileEncoding = 'utf-8'): Promise<string | Buffer> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'readFile', path, encoding });
  if (!result.success) throw new Error(result.error || 'Operation failed');
  return result.data as string | Buffer;
}

/**
 * Write a file
 */
export async function writeFile(path: string, content: string | Buffer, options?: { encoding?: FileEncoding; createDirs?: boolean }): Promise<void> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({
    operation: 'writeFile',
    path,
    content,
    encoding: options?.encoding,
    createDirs: options?.createDirs
  });
  if (!result.success) throw new Error(result.error || 'Operation failed');
}

/**
 * Append to a file
 */
export async function appendFile(path: string, content: string | Buffer, encoding: FileEncoding = 'utf-8'): Promise<void> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'appendFile', path, content, encoding });
  if (!result.success) throw new Error(result.error || 'Operation failed');
}

/**
 * List directory contents
 */
export async function listDir(path: string): Promise<DirEntry[]> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'listDir', path });
  if (!result.success) throw new Error(result.error || 'Operation failed');
  return result.data as DirEntry[];
}

/**
 * Create a directory
 */
export async function mkdir(path: string, recursive = true): Promise<void> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'mkdir', path, createDirs: recursive });
  if (!result.success) throw new Error(result.error || 'Operation failed');
}

/**
 * Copy a file
 */
export async function copy(sourcePath: string, destPath: string): Promise<void> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'copy', path: sourcePath, destPath });
  if (!result.success) throw new Error(result.error || 'Operation failed');
}

/**
 * Move a file
 */
export async function move(sourcePath: string, destPath: string): Promise<void> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'move', path: sourcePath, destPath });
  if (!result.success) throw new Error(result.error || 'Operation failed');
}

/**
 * Delete a file
 */
export async function deleteFile(path: string): Promise<void> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'deleteFile', path });
  if (!result.success) throw new Error(result.error || 'Operation failed');
}

/**
 * Delete a directory
 */
export async function deleteDir(path: string, recursive = false): Promise<void> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'deleteDir', path, recursive });
  if (!result.success) throw new Error(result.error || 'Operation failed');
}

/**
 * Check if a path exists
 */
export async function exists(path: string): Promise<boolean> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'exists', path });
  if (!result.success) throw new Error(result.error || 'Operation failed');
  return (result.data as { exists: boolean }).exists;
}

/**
 * Get file/directory stats
 */
export async function stat(path: string): Promise<FileStat> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'stat', path });
  if (!result.success) throw new Error(result.error || 'Operation failed');
  return result.data as FileStat;
}

/**
 * Calculate file checksum
 */
export async function checksum(path: string): Promise<string> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'checksum', path });
  if (!result.success) throw new Error(result.error || 'Operation failed');
  return (result.data as { checksum: string }).checksum;
}

/**
 * Get quota information
 */
export async function getQuota(): Promise<{ used: number; remaining: number; total: number }> {
  if (!skillInstance) initialize();
  const result = await skillInstance!.execute({ operation: 'getQuota', path: '' });
  if (!result.success) throw new Error(result.error || 'Operation failed');
  return result.data as { used: number; remaining: number; total: number };
}

// Default export
export default {
  initialize,
  readFile,
  writeFile,
  appendFile,
  listDir,
  mkdir,
  copy,
  move,
  deleteFile,
  deleteDir,
  exists,
  stat,
  checksum,
  getQuota,
  FileOperationsSkill,
};
