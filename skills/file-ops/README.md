# File Operations Skill

Sandboxed file system operations with permission-based access control for Agentik OS agents.

## Overview

The File Operations skill provides agents with safe, controlled access to the file system. It implements multi-layer security including:

- **Permission-based access control** (fs:read, fs:write, fs:list, fs:delete)
- **Path validation** (prevents traversal, blocks symlinks, validates roots)
- **Quota enforcement** (default 100MB per agent)
- **Security audit logging**
- **WASM sandbox integration**

## Installation

```bash
panda skill install file-ops
```

## Quick Start

```typescript
import { readFile, writeFile, listDir } from '@agentik-os/skill-file-ops';

// Read a file
const content = await readFile('/data/config.json');

// Write a file
await writeFile('/data/output.txt', 'Hello World', { createDirs: true });

// List directory
const entries = await listDir('/data/logs');
entries.forEach(entry => {
  console.log(`${entry.name} (${entry.type}, ${entry.size} bytes)`);
});
```

## API Reference

### File Operations

#### readFile(path, encoding?)

Read file contents.

**Parameters:**
- `path` (string): Absolute path to file
- `encoding` (optional): 'utf-8' | 'binary' | 'base64' (default: 'utf-8')

**Returns:** Promise<string | Buffer>

**Example:**
```typescript
const text = await readFile('/data/file.txt');
const binary = await readFile('/data/image.png', 'binary');
const base64 = await readFile('/data/file.txt', 'base64');
```

#### writeFile(path, content, options?)

Write content to a file.

**Parameters:**
- `path` (string): Absolute path to file
- `content` (string | Buffer): Content to write
- `options` (optional):
  - `encoding`: 'utf-8' | 'binary' | 'base64'
  - `createDirs`: boolean - Create parent directories if missing

**Returns:** Promise<void>

**Example:**
```typescript
await writeFile('/data/output.txt', 'Hello World');
await writeFile('/data/nested/file.txt', 'test', { createDirs: true });
```

#### appendFile(path, content, encoding?)

Append content to a file.

**Parameters:**
- `path` (string): Absolute path to file
- `content` (string | Buffer): Content to append
- `encoding` (optional): 'utf-8' | 'binary' | 'base64'

**Returns:** Promise<void>

**Example:**
```typescript
await appendFile('/data/log.txt', 'New log entry\n');
```

### Directory Operations

#### listDir(path)

List directory contents with metadata.

**Parameters:**
- `path` (string): Absolute path to directory

**Returns:** Promise<DirEntry[]>

**DirEntry:**
```typescript
interface DirEntry {
  name: string;
  type: 'file' | 'directory' | 'symlink';
  size: number;
  modifiedAt: Date;
}
```

**Example:**
```typescript
const entries = await listDir('/data/logs');
const files = entries.filter(e => e.type === 'file');
const totalSize = files.reduce((sum, f) => sum + f.size, 0);
```

#### mkdir(path, recursive?)

Create a directory.

**Parameters:**
- `path` (string): Absolute path to directory
- `recursive` (optional): boolean - Create parent directories (default: true)

**Returns:** Promise<void>

**Example:**
```typescript
await mkdir('/data/new-folder');
await mkdir('/data/nested/deep/folder', true);
```

### File Management

#### copy(sourcePath, destPath)

Copy a file.

**Parameters:**
- `sourcePath` (string): Source file path
- `destPath` (string): Destination file path

**Returns:** Promise<void>

**Example:**
```typescript
await copy('/data/original.txt', '/data/backup.txt');
```

#### move(sourcePath, destPath)

Move or rename a file/directory.

**Parameters:**
- `sourcePath` (string): Source path
- `destPath` (string): Destination path

**Returns:** Promise<void>

**Example:**
```typescript
await move('/data/old-name.txt', '/data/new-name.txt');
await move('/data/folder', '/data/archive/folder');
```

#### deleteFile(path)

Delete a file.

**Parameters:**
- `path` (string): Absolute path to file

**Returns:** Promise<void>

**Example:**
```typescript
await deleteFile('/data/temporary.txt');
```

#### deleteDir(path, recursive?)

Delete a directory.

**Parameters:**
- `path` (string): Absolute path to directory
- `recursive` (optional): boolean - Delete non-empty directory (default: false)

**Returns:** Promise<void>

**Example:**
```typescript
await deleteDir('/data/empty-folder');
await deleteDir('/data/full-folder', true);
```

### File Information

#### exists(path)

Check if a path exists.

**Parameters:**
- `path` (string): Absolute path

**Returns:** Promise<boolean>

**Example:**
```typescript
if (await exists('/data/config.json')) {
  const config = await readFile('/data/config.json');
}
```

#### stat(path)

Get file or directory metadata.

**Parameters:**
- `path` (string): Absolute path

**Returns:** Promise<FileStat>

**FileStat:**
```typescript
interface FileStat {
  type: 'file' | 'directory' | 'symlink';
  size: number;
  createdAt: Date;
  modifiedAt: Date;
  accessedAt: Date;
  mode: number;
  isReadable: boolean;
  isWritable: boolean;
}
```

**Example:**
```typescript
const stats = await stat('/data/file.txt');
console.log(`Size: ${stats.size} bytes`);
console.log(`Modified: ${stats.modifiedAt}`);
console.log(`Writable: ${stats.isWritable}`);
```

#### checksum(path)

Calculate SHA-256 checksum of a file.

**Parameters:**
- `path` (string): Absolute path to file

**Returns:** Promise<string> - Hex-encoded SHA-256 hash

**Example:**
```typescript
const hash = await checksum('/data/file.txt');
console.log(`SHA-256: ${hash}`);

// Verify file integrity
const expected = 'abc123...';
if (hash !== expected) {
  console.error('File has been modified!');
}
```

### Quota Management

#### getQuota()

Get current quota usage for the agent.

**Returns:** Promise<QuotaInfo>

**QuotaInfo:**
```typescript
interface QuotaInfo {
  used: number;      // Bytes used
  remaining: number; // Bytes remaining
  total: number;     // Total quota in bytes
}
```

**Example:**
```typescript
const quota = await getQuota();
console.log(`Used: ${quota.used / 1024 / 1024} MB`);
console.log(`Remaining: ${quota.remaining / 1024 / 1024} MB`);
console.log(`Total: ${quota.total / 1024 / 1024} MB`);
```

## Security Model

### Multi-Layer Defense

1. **Permission Check** - Agent must have required permission
2. **Path Validation** - Path must be within allowed roots
3. **Quota Check** - Operation must not exceed quota
4. **WASM Execution** - Operation runs in sandbox

### Permissions

| Permission | Operations | Path Pattern |
|------------|------------|--------------|
| `fs:read:/data/*` | readFile, stat, checksum | /data/* |
| `fs:write:/data/*` | writeFile, appendFile | /data/* |
| `fs:list:/data/*` | listDir | /data/* |
| `fs:delete:/data/*` | deleteFile, deleteDir | /data/* |

**Example:**
```json
{
  "permissions": [
    "fs:read:/data/public/*",
    "fs:write:/data/uploads/*",
    "fs:list:/data/*"
  ]
}
```

### Allowed Roots

By default, agents can only access files within `/data`. This can be configured:

```typescript
const skill = new FileOperationsSkill({
  allowedRoots: ['/data', '/tmp'],
});
```

### Path Validation

The following are **blocked**:

- Path traversal: `../../../etc/passwd`
- Null bytes: `file.txt\x00.png`
- Absolute paths outside roots: `/etc/passwd`
- Symlinks (configurable)

### Quota Limits

Default quota: **100MB per agent**

Quota is tracked across all write operations:
- `writeFile` - Full content size
- `appendFile` - Appended content size
- `copy` - File size being copied

**Example:**
```typescript
const skill = new FileOperationsSkill({
  defaultQuota: 524288000, // 500MB
});
```

## Configuration

### Skill Configuration (skill.json)

```json
{
  "id": "file-ops",
  "name": "File Operations",
  "version": "1.0.0",
  "permissions": [
    "fs:read:/data/*",
    "fs:write:/data/*",
    "fs:list:/data/*",
    "fs:delete:/data/*"
  ],
  "config": {
    "defaultQuota": 104857600,
    "allowedRoots": ["/data"],
    "blockSymlinks": true,
    "enableAuditLog": true
  }
}
```

### Runtime Configuration

```typescript
import { FileOperationsSkill } from '@agentik-os/skill-file-ops';

const skill = new FileOperationsSkill({
  defaultQuota: 104857600,     // 100MB
  allowedRoots: ['/data'],     // Allowed root directories
  blockSymlinks: true,         // Block symlink access
  enableAuditLog: true,        // Log all operations
  agentId: 'my-agent',        // Agent identifier for quota
});
```

## Error Handling

### PathValidationError

Thrown when a path violates security rules.

```typescript
try {
  await readFile('/etc/passwd');
} catch (error) {
  if (error instanceof PathValidationError) {
    console.error('Security violation:', error.message);
  }
}
```

### QuotaExceededError

Thrown when an operation would exceed the quota.

```typescript
try {
  await writeFile('/data/large.txt', 'x'.repeat(200000000));
} catch (error) {
  if (error instanceof QuotaExceededError) {
    console.error('Quota exceeded:', error.message);
    const quota = await getQuota();
    console.log(`Used: ${quota.used}, Remaining: ${quota.remaining}`);
  }
}
```

### General Errors

All operations return errors via the standard SkillOutput:

```typescript
import { FileOperationsSkill } from '@agentik-os/skill-file-ops';

const skill = new FileOperationsSkill();
const result = await skill.execute({ operation: 'readFile', path: '/data/file.txt' });

if (!result.success) {
  console.error('Operation failed:', result.error);
}
```

## Advanced Usage

### Custom Skill Instance

```typescript
import { FileOperationsSkill, initialize } from '@agentik-os/skill-file-ops';

// Create custom instance
const customSkill = new FileOperationsSkill({
  defaultQuota: 524288000, // 500MB
  allowedRoots: ['/data', '/tmp'],
  blockSymlinks: false,
  agentId: 'custom-agent',
});

const result = await customSkill.execute({
  operation: 'writeFile',
  path: '/data/output.txt',
  content: 'Custom content',
});
```

### Batch Operations

```typescript
// Read multiple files in parallel
const paths = ['/data/file1.txt', '/data/file2.txt', '/data/file3.txt'];
const contents = await Promise.all(
  paths.map(path => readFile(path))
);

// Write multiple files
const writes = [
  { path: '/data/out1.txt', content: 'Content 1' },
  { path: '/data/out2.txt', content: 'Content 2' },
];
await Promise.all(
  writes.map(w => writeFile(w.path, w.content))
);
```

### Directory Tree Walking

```typescript
async function walkDirectory(dirPath: string): Promise<string[]> {
  const allFiles: string[] = [];
  const entries = await listDir(dirPath);

  for (const entry of entries) {
    const fullPath = join(dirPath, entry.name);
    if (entry.type === 'file') {
      allFiles.push(fullPath);
    } else if (entry.type === 'directory') {
      const subFiles = await walkDirectory(fullPath);
      allFiles.push(...subFiles);
    }
  }

  return allFiles;
}

const allFiles = await walkDirectory('/data/logs');
console.log(`Found ${allFiles.length} files`);
```

### File Rotation

```typescript
async function rotateLogFile(logPath: string, maxSize: number) {
  const stats = await stat(logPath);

  if (stats.size > maxSize) {
    const timestamp = new Date().toISOString().replace(/:/g, '-');
    const archivePath = `${logPath}.${timestamp}`;
    await move(logPath, archivePath);
    console.log(`Rotated log to ${archivePath}`);
  }
}

await rotateLogFile('/data/app.log', 10 * 1024 * 1024); // 10MB
```

## Testing

Run the test suite:

```bash
cd skills/file-ops
pnpm test
```

Test coverage: **100+ tests** covering:
- All 12 API methods
- Security (path traversal, symlinks, null bytes)
- Quota enforcement
- Edge cases (unicode, special chars, empty files)
- Concurrent operations
- Error handling

## Integration with Step-061 (Permission System)

The File Operations skill integrates with the Permission System:

```typescript
// Permission check happens before file operation
const hasPermission = await permissionSystem.check(agentId, 'fs:write:/data/file.txt');

if (!hasPermission) {
  throw new PermissionDeniedError('Agent lacks fs:write permission');
}

// Then proceed with file operation
await writeFile('/data/file.txt', content);
```

## Integration with Step-060 (WASM Sandbox)

All file operations run within the WASM sandbox for additional security:

```typescript
// WASM sandbox wraps all operations
const wasmResult = await wasmSandbox.execute('file-ops', {
  operation: 'writeFile',
  path: '/data/file.txt',
  content: 'Sandboxed content',
});
```

## Performance Considerations

- **Buffering**: Large files are streamed, not loaded entirely into memory
- **Parallel Operations**: Use `Promise.all()` for concurrent operations
- **Quota Tracking**: Minimal overhead (~0.1ms per operation)
- **Path Validation**: Cached validation results for repeated paths

## License

MIT - Agentik OS

## Support

- Documentation: https://docs.agentik-os.com/skills/file-ops
- Issues: https://github.com/agentik-os/agentik-os/issues
- Discord: https://discord.gg/agentik-os
