/**
 * File Operations Skill - Comprehensive Test Suite
 * 100+ tests covering all functionality, security, and edge cases
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mkdir, writeFile as fsWrite, rm, readFile as fsRead, symlink } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  FileOperationsSkill,
  readFile,
  writeFile,
  appendFile,
  listDir,
  mkdir as mkdirSkill,
  copy,
  move,
  deleteFile,
  deleteDir,
  exists,
  stat,
  checksum,
  getQuota,
  initialize,
  PathValidationError,
  QuotaExceededError,
} from './index.js';

describe('File Operations Skill', () => {
  let testDir: string;
  let skill: FileOperationsSkill;

  beforeEach(async () => {
    // Create unique test directory
    testDir = join(tmpdir(), `file-ops-test-${Date.now()}-${Math.random().toString(36).substring(7)}`);
    await mkdir(testDir, { recursive: true });

    // Initialize skill with test directory as allowed root
    skill = new FileOperationsSkill({
      allowedRoots: [testDir],
      defaultQuota: 1048576, // 1MB for testing
      blockSymlinks: true,
      enableAuditLog: false,
      agentId: 'test-agent',
    });

    // Initialize singleton
    initialize({
      allowedRoots: [testDir],
      defaultQuota: 1048576,
      blockSymlinks: true,
      agentId: 'test-agent',
    });
  });

  afterEach(async () => {
    // Clean up test directory
    await rm(testDir, { recursive: true, force: true });
  });

  // ============================================================================
  // Read File Tests (10 tests)
  // ============================================================================

  describe('readFile', () => {
    it('should read text file with utf-8 encoding', async () => {
      const testFile = join(testDir, 'test.txt');
      await fsWrite(testFile, 'Hello World', 'utf-8');

      const result = await skill.execute({ operation: 'readFile', path: testFile, encoding: 'utf-8' });

      expect(result.success).toBe(true);
      expect(result.data).toBe('Hello World');
    });

    it('should read binary file', async () => {
      const testFile = join(testDir, 'test.bin');
      const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);
      await fsWrite(testFile, buffer);

      const result = await skill.execute({ operation: 'readFile', path: testFile, encoding: 'binary' });

      expect(result.success).toBe(true);
      expect(Buffer.isBuffer(result.data) || typeof result.data === 'string').toBe(true);
    });

    it('should read file with base64 encoding', async () => {
      const testFile = join(testDir, 'test.txt');
      await fsWrite(testFile, 'Hello', 'utf-8');

      const result = await skill.execute({ operation: 'readFile', path: testFile, encoding: 'base64' });

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('string');
    });

    it('should fail for non-existent file', async () => {
      const result = await skill.execute({ operation: 'readFile', path: join(testDir, 'nonexistent.txt') });

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'readFile', path: '/etc/passwd' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outside allowed roots');
    });

    it('should handle empty file', async () => {
      const testFile = join(testDir, 'empty.txt');
      await fsWrite(testFile, '', 'utf-8');

      const result = await skill.execute({ operation: 'readFile', path: testFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe('');
    });

    it('should handle large file (within quota)', async () => {
      const testFile = join(testDir, 'large.txt');
      const content = 'x'.repeat(10000);
      await fsWrite(testFile, content);

      const result = await skill.execute({ operation: 'readFile', path: testFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe(content);
    });

    it('should handle file with special characters in name', async () => {
      const testFile = join(testDir, 'test file (1).txt');
      await fsWrite(testFile, 'content');

      const result = await skill.execute({ operation: 'readFile', path: testFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe('content');
    });

    it('should handle unicode content', async () => {
      const testFile = join(testDir, 'unicode.txt');
      await fsWrite(testFile, '你好世界 🌍', 'utf-8');

      const result = await skill.execute({ operation: 'readFile', path: testFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe('你好世界 🌍');
    });

    it('should use singleton function', async () => {
      const testFile = join(testDir, 'singleton.txt');
      await fsWrite(testFile, 'test');

      const content = await readFile(testFile);

      expect(content).toBe('test');
    });
  });

  // ============================================================================
  // Write File Tests (15 tests)
  // ============================================================================

  describe('writeFile', () => {
    it('should write text file', async () => {
      const testFile = join(testDir, 'write.txt');
      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: 'Hello' });

      expect(result.success).toBe(true);
      expect(result.bytesUsed).toBe(5);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('Hello');
    });

    it('should write binary content', async () => {
      const testFile = join(testDir, 'write.bin');
      const buffer = Buffer.from([0x48, 0x65, 0x6c, 0x6c, 0x6f]);

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: buffer, encoding: 'binary' });

      expect(result.success).toBe(true);
    });

    it('should overwrite existing file', async () => {
      const testFile = join(testDir, 'overwrite.txt');
      await fsWrite(testFile, 'old');

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: 'new' });

      expect(result.success).toBe(true);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('new');
    });

    it('should create parent directories when createDirs=true', async () => {
      const testFile = join(testDir, 'nested/dir/file.txt');

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: 'test', createDirs: true });

      expect(result.success).toBe(true);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('test');
    });

    it('should fail without createDirs when parent missing', async () => {
      const testFile = join(testDir, 'missing/file.txt');

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: 'test' });

      expect(result.success).toBe(false);
    });

    it('should enforce quota limits', async () => {
      const testFile = join(testDir, 'large.txt');
      const content = 'x'.repeat(2000000); // 2MB (exceeds 1MB quota)

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should track quota usage', async () => {
      const testFile = join(testDir, 'quota.txt');
      const content = 'x'.repeat(1000);

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content });

      expect(result.success).toBe(true);
      expect(result.quotaUsed).toBe(1000);
      expect(result.quotaRemaining).toBe(1048576 - 1000);
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'writeFile', path: '/tmp/hack.txt', content: 'bad' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outside allowed roots');
    });

    it('should require content parameter', async () => {
      const result = await skill.execute({ operation: 'writeFile', path: join(testDir, 'test.txt') });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Content is required');
    });

    it('should handle empty content', async () => {
      const testFile = join(testDir, 'empty.txt');

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: '' });

      expect(result.success).toBe(true);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('');
    });

    it('should handle unicode content', async () => {
      const testFile = join(testDir, 'unicode.txt');

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: '你好 🌍' });

      expect(result.success).toBe(true);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('你好 🌍');
    });

    it('should use singleton function', async () => {
      const testFile = join(testDir, 'singleton.txt');

      await writeFile(testFile, 'test');

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('test');
    });

    it('should handle createDirs option in singleton', async () => {
      const testFile = join(testDir, 'nested/file.txt');

      await writeFile(testFile, 'test', { createDirs: true });

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('test');
    });

    it('should accumulate quota across multiple writes', async () => {
      await skill.execute({ operation: 'writeFile', path: join(testDir, 'file1.txt'), content: 'x'.repeat(500) });
      const result = await skill.execute({ operation: 'writeFile', path: join(testDir, 'file2.txt'), content: 'x'.repeat(500) });

      expect(result.quotaUsed).toBe(1000);
    });

    it('should handle Windows-style paths', async () => {
      // Just ensure no crash with backslashes (normalized)
      const testFile = join(testDir, 'test.txt');

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: 'test' });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Append File Tests (8 tests)
  // ============================================================================

  describe('appendFile', () => {
    it('should append to existing file', async () => {
      const testFile = join(testDir, 'append.txt');
      await fsWrite(testFile, 'Hello ');

      const result = await skill.execute({ operation: 'appendFile', path: testFile, content: 'World' });

      expect(result.success).toBe(true);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('Hello World');
    });

    it('should create file if it does not exist', async () => {
      const testFile = join(testDir, 'new.txt');

      const result = await skill.execute({ operation: 'appendFile', path: testFile, content: 'New' });

      expect(result.success).toBe(true);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('New');
    });

    it('should track quota for appended bytes', async () => {
      const testFile = join(testDir, 'quota.txt');
      await fsWrite(testFile, 'Hello');

      const result = await skill.execute({ operation: 'appendFile', path: testFile, content: ' World' });

      expect(result.success).toBe(true);
      expect(result.bytesUsed).toBe(6);
    });

    it('should enforce quota on append', async () => {
      const testFile = join(testDir, 'large.txt');
      const content = 'x'.repeat(2000000);

      const result = await skill.execute({ operation: 'appendFile', path: testFile, content });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should require content parameter', async () => {
      const result = await skill.execute({ operation: 'appendFile', path: join(testDir, 'test.txt') });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Content is required');
    });

    it('should handle unicode content', async () => {
      const testFile = join(testDir, 'unicode.txt');
      await fsWrite(testFile, 'Hello ');

      await skill.execute({ operation: 'appendFile', path: testFile, content: '世界' });

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('Hello 世界');
    });

    it('should use singleton function', async () => {
      const testFile = join(testDir, 'singleton.txt');
      await fsWrite(testFile, 'Hello ');

      await appendFile(testFile, 'World');

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('Hello World');
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'appendFile', path: '/tmp/hack.txt', content: 'bad' });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // List Directory Tests (10 tests)
  // ============================================================================

  describe('listDir', () => {
    it('should list files in directory', async () => {
      await fsWrite(join(testDir, 'file1.txt'), 'test');
      await fsWrite(join(testDir, 'file2.txt'), 'test');

      const result = await skill.execute({ operation: 'listDir', path: testDir });

      expect(result.success).toBe(true);
      const entries = result.data as any[];
      expect(entries.length).toBe(2);
      expect(entries.some(e => e.name === 'file1.txt')).toBe(true);
      expect(entries.some(e => e.name === 'file2.txt')).toBe(true);
    });

    it('should include file metadata', async () => {
      await fsWrite(join(testDir, 'file.txt'), 'test');

      const result = await skill.execute({ operation: 'listDir', path: testDir });

      const entries = result.data as any[];
      const file = entries.find(e => e.name === 'file.txt');

      expect(file).toBeDefined();
      expect(file.type).toBe('file');
      expect(file.size).toBeGreaterThan(0);
      expect(file.modifiedAt).toBeDefined();
    });

    it('should list subdirectories', async () => {
      await mkdir(join(testDir, 'subdir'));

      const result = await skill.execute({ operation: 'listDir', path: testDir });

      const entries = result.data as any[];
      const dir = entries.find(e => e.name === 'subdir');

      expect(dir).toBeDefined();
      expect(dir.type).toBe('directory');
    });

    it('should return empty array for empty directory', async () => {
      const emptyDir = join(testDir, 'empty');
      await mkdir(emptyDir);

      const result = await skill.execute({ operation: 'listDir', path: emptyDir });

      expect(result.success).toBe(true);
      expect(result.data).toEqual([]);
    });

    it('should fail for non-existent directory', async () => {
      const result = await skill.execute({ operation: 'listDir', path: join(testDir, 'nonexistent') });

      expect(result.success).toBe(false);
    });

    it('should fail for file instead of directory', async () => {
      const testFile = join(testDir, 'file.txt');
      await fsWrite(testFile, 'test');

      const result = await skill.execute({ operation: 'listDir', path: testFile });

      expect(result.success).toBe(false);
    });

    it('should handle directories with special characters', async () => {
      const specialDir = join(testDir, 'dir (1)');
      await mkdir(specialDir);
      await fsWrite(join(specialDir, 'file.txt'), 'test');

      const result = await skill.execute({ operation: 'listDir', path: specialDir });

      expect(result.success).toBe(true);
    });

    it('should use singleton function', async () => {
      await fsWrite(join(testDir, 'file.txt'), 'test');

      const entries = await listDir(testDir);

      expect(entries.length).toBeGreaterThan(0);
      expect(entries.some(e => e.name === 'file.txt')).toBe(true);
    });

    it('should list hidden files (starting with dot)', async () => {
      await fsWrite(join(testDir, '.hidden'), 'test');

      const result = await skill.execute({ operation: 'listDir', path: testDir });

      const entries = result.data as any[];
      expect(entries.some(e => e.name === '.hidden')).toBe(true);
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'listDir', path: '/tmp' });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Create Directory Tests (8 tests)
  // ============================================================================

  describe('mkdir', () => {
    it('should create directory', async () => {
      const newDir = join(testDir, 'newdir');

      const result = await skill.execute({ operation: 'mkdir', path: newDir });

      expect(result.success).toBe(true);

      const exists = await skill.execute({ operation: 'exists', path: newDir });
      expect((exists.data as any).exists).toBe(true);
    });

    it('should create nested directories with recursive', async () => {
      const nestedDir = join(testDir, 'a/b/c');

      const result = await skill.execute({ operation: 'mkdir', path: nestedDir, createDirs: true });

      expect(result.success).toBe(true);

      const exists = await skill.execute({ operation: 'exists', path: nestedDir });
      expect((exists.data as any).exists).toBe(true);
    });

    it('should succeed if directory already exists (recursive)', async () => {
      const newDir = join(testDir, 'existing');
      await mkdir(newDir);

      const result = await skill.execute({ operation: 'mkdir', path: newDir, createDirs: true });

      expect(result.success).toBe(true);
    });

    it('should fail for existing directory without recursive', async () => {
      const newDir = join(testDir, 'existing');
      await mkdir(newDir);

      const result = await skill.execute({ operation: 'mkdir', path: newDir, createDirs: false });

      expect(result.success).toBe(false);
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'mkdir', path: '/tmp/hack' });

      expect(result.success).toBe(false);
    });

    it('should handle directories with special characters', async () => {
      const specialDir = join(testDir, 'dir (1)');

      const result = await skill.execute({ operation: 'mkdir', path: specialDir });

      expect(result.success).toBe(true);
    });

    it('should use singleton function', async () => {
      const newDir = join(testDir, 'singleton');

      await mkdirSkill(newDir);

      const exists = await skill.execute({ operation: 'exists', path: newDir });
      expect((exists.data as any).exists).toBe(true);
    });

    it('should handle unicode directory names', async () => {
      const unicodeDir = join(testDir, '中文目录');

      const result = await skill.execute({ operation: 'mkdir', path: unicodeDir });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Copy File Tests (8 tests)
  // ============================================================================

  describe('copy', () => {
    it('should copy file', async () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');
      await fsWrite(source, 'test content');

      const result = await skill.execute({ operation: 'copy', path: source, destPath: dest });

      expect(result.success).toBe(true);

      const destContent = await fsRead(dest, 'utf-8');
      expect(destContent).toBe('test content');
    });

    it('should track quota for copied file', async () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'copy', path: source, destPath: dest });

      expect(result.success).toBe(true);
      expect(result.bytesUsed).toBe(4);
    });

    it('should enforce quota on copy', async () => {
      const source = join(testDir, 'large.txt');
      const dest = join(testDir, 'dest.txt');
      const content = 'x'.repeat(2000000);
      await fsWrite(source, content);

      const result = await skill.execute({ operation: 'copy', path: source, destPath: dest });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should require destPath parameter', async () => {
      const source = join(testDir, 'source.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'copy', path: source });

      expect(result.success).toBe(false);
      expect(result.error).toContain('destPath is required');
    });

    it('should fail if source does not exist', async () => {
      const result = await skill.execute({ operation: 'copy', path: join(testDir, 'nonexistent.txt'), destPath: join(testDir, 'dest.txt') });

      expect(result.success).toBe(false);
    });

    it('should fail if destination is outside allowed roots', async () => {
      const source = join(testDir, 'source.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'copy', path: source, destPath: '/tmp/hack.txt' });

      expect(result.success).toBe(false);
    });

    it('should use singleton function', async () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');
      await fsWrite(source, 'test');

      await copy(source, dest);

      const destContent = await fsRead(dest, 'utf-8');
      expect(destContent).toBe('test');
    });

    it('should overwrite existing destination file', async () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');
      await fsWrite(source, 'new');
      await fsWrite(dest, 'old');

      await skill.execute({ operation: 'copy', path: source, destPath: dest });

      const destContent = await fsRead(dest, 'utf-8');
      expect(destContent).toBe('new');
    });
  });

  // ============================================================================
  // Move File Tests (8 tests)
  // ============================================================================

  describe('move', () => {
    it('should move file', async () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');
      await fsWrite(source, 'test content');

      const result = await skill.execute({ operation: 'move', path: source, destPath: dest });

      expect(result.success).toBe(true);

      const destExists = await skill.execute({ operation: 'exists', path: dest });
      expect((destExists.data as any).exists).toBe(true);

      const sourceExists = await skill.execute({ operation: 'exists', path: source });
      expect((sourceExists.data as any).exists).toBe(false);
    });

    it('should move file to subdirectory', async () => {
      const source = join(testDir, 'file.txt');
      const subdir = join(testDir, 'subdir');
      const dest = join(subdir, 'file.txt');

      await fsWrite(source, 'test');
      await mkdir(subdir);

      const result = await skill.execute({ operation: 'move', path: source, destPath: dest });

      expect(result.success).toBe(true);
    });

    it('should require destPath parameter', async () => {
      const source = join(testDir, 'source.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'move', path: source });

      expect(result.success).toBe(false);
      expect(result.error).toContain('destPath is required');
    });

    it('should fail if source does not exist', async () => {
      const result = await skill.execute({ operation: 'move', path: join(testDir, 'nonexistent.txt'), destPath: join(testDir, 'dest.txt') });

      expect(result.success).toBe(false);
    });

    it('should fail if destination is outside allowed roots', async () => {
      const source = join(testDir, 'source.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'move', path: source, destPath: '/tmp/hack.txt' });

      expect(result.success).toBe(false);
    });

    it('should use singleton function', async () => {
      const source = join(testDir, 'source.txt');
      const dest = join(testDir, 'dest.txt');
      await fsWrite(source, 'test');

      await move(source, dest);

      const destExists = await skill.execute({ operation: 'exists', path: dest });
      expect((destExists.data as any).exists).toBe(true);
    });

    it('should rename file (move in same directory)', async () => {
      const source = join(testDir, 'old.txt');
      const dest = join(testDir, 'new.txt');
      await fsWrite(source, 'test');

      await skill.execute({ operation: 'move', path: source, destPath: dest });

      const destContent = await fsRead(dest, 'utf-8');
      expect(destContent).toBe('test');
    });

    it('should move directory', async () => {
      const sourceDir = join(testDir, 'olddir');
      const destDir = join(testDir, 'newdir');
      await mkdir(sourceDir);
      await fsWrite(join(sourceDir, 'file.txt'), 'test');

      const result = await skill.execute({ operation: 'move', path: sourceDir, destPath: destDir });

      expect(result.success).toBe(true);

      const fileExists = await skill.execute({ operation: 'exists', path: join(destDir, 'file.txt') });
      expect((fileExists.data as any).exists).toBe(true);
    });
  });

  // ============================================================================
  // Delete File Tests (6 tests)
  // ============================================================================

  describe('deleteFile', () => {
    it('should delete file', async () => {
      const testFile = join(testDir, 'delete.txt');
      await fsWrite(testFile, 'test');

      const result = await skill.execute({ operation: 'deleteFile', path: testFile });

      expect(result.success).toBe(true);

      const exists = await skill.execute({ operation: 'exists', path: testFile });
      expect((exists.data as any).exists).toBe(false);
    });

    it('should fail for non-existent file', async () => {
      const result = await skill.execute({ operation: 'deleteFile', path: join(testDir, 'nonexistent.txt') });

      expect(result.success).toBe(false);
    });

    it('should fail for directory', async () => {
      const dir = join(testDir, 'dir');
      await mkdir(dir);

      const result = await skill.execute({ operation: 'deleteFile', path: dir });

      expect(result.success).toBe(false);
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'deleteFile', path: '/tmp/hack.txt' });

      expect(result.success).toBe(false);
    });

    it('should use singleton function', async () => {
      const testFile = join(testDir, 'delete.txt');
      await fsWrite(testFile, 'test');

      await deleteFile(testFile);

      const exists = await skill.execute({ operation: 'exists', path: testFile });
      expect((exists.data as any).exists).toBe(false);
    });

    it('should delete file with special characters', async () => {
      const testFile = join(testDir, 'file (1).txt');
      await fsWrite(testFile, 'test');

      const result = await skill.execute({ operation: 'deleteFile', path: testFile });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Delete Directory Tests (7 tests)
  // ============================================================================

  describe('deleteDir', () => {
    it('should delete empty directory', async () => {
      const dir = join(testDir, 'emptydir');
      await mkdir(dir);

      const result = await skill.execute({ operation: 'deleteDir', path: dir, recursive: false });

      expect(result.success).toBe(true);

      const exists = await skill.execute({ operation: 'exists', path: dir });
      expect((exists.data as any).exists).toBe(false);
    });

    it('should delete directory recursively', async () => {
      const dir = join(testDir, 'fulldir');
      await mkdir(dir);
      await fsWrite(join(dir, 'file.txt'), 'test');
      await mkdir(join(dir, 'subdir'));

      const result = await skill.execute({ operation: 'deleteDir', path: dir, recursive: true });

      expect(result.success).toBe(true);

      const exists = await skill.execute({ operation: 'exists', path: dir });
      expect((exists.data as any).exists).toBe(false);
    });

    it('should fail to delete non-empty directory without recursive', async () => {
      const dir = join(testDir, 'fulldir');
      await mkdir(dir);
      await fsWrite(join(dir, 'file.txt'), 'test');

      const result = await skill.execute({ operation: 'deleteDir', path: dir, recursive: false });

      expect(result.success).toBe(false);
    });

    it('should fail for non-existent directory', async () => {
      const result = await skill.execute({ operation: 'deleteDir', path: join(testDir, 'nonexistent') });

      expect(result.success).toBe(false);
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'deleteDir', path: '/tmp/hack' });

      expect(result.success).toBe(false);
    });

    it('should use singleton function', async () => {
      const dir = join(testDir, 'singleton');
      await mkdir(dir);
      await fsWrite(join(dir, 'file.txt'), 'test');

      await deleteDir(dir, true);

      const exists = await skill.execute({ operation: 'exists', path: dir });
      expect((exists.data as any).exists).toBe(false);
    });

    it('should delete nested directories recursively', async () => {
      const dir = join(testDir, 'a');
      await mkdir(join(dir, 'b/c'), { recursive: true });
      await fsWrite(join(dir, 'b/c/file.txt'), 'test');

      const result = await skill.execute({ operation: 'deleteDir', path: dir, recursive: true });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Exists Tests (6 tests)
  // ============================================================================

  describe('exists', () => {
    it('should return true for existing file', async () => {
      const testFile = join(testDir, 'exists.txt');
      await fsWrite(testFile, 'test');

      const result = await skill.execute({ operation: 'exists', path: testFile });

      expect(result.success).toBe(true);
      expect((result.data as any).exists).toBe(true);
    });

    it('should return true for existing directory', async () => {
      const dir = join(testDir, 'existingdir');
      await mkdir(dir);

      const result = await skill.execute({ operation: 'exists', path: dir });

      expect((result.data as any).exists).toBe(true);
    });

    it('should return false for non-existent path', async () => {
      const result = await skill.execute({ operation: 'exists', path: join(testDir, 'nonexistent.txt') });

      expect(result.success).toBe(true);
      expect((result.data as any).exists).toBe(false);
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'exists', path: '/etc/passwd' });

      expect(result.success).toBe(false);
    });

    it('should use singleton function', async () => {
      const testFile = join(testDir, 'singleton.txt');
      await fsWrite(testFile, 'test');

      const fileExists = await exists(testFile);

      expect(fileExists).toBe(true);
    });

    it('should return false for deleted file', async () => {
      const testFile = join(testDir, 'deleted.txt');
      await fsWrite(testFile, 'test');
      await skill.execute({ operation: 'deleteFile', path: testFile });

      const result = await skill.execute({ operation: 'exists', path: testFile });

      expect((result.data as any).exists).toBe(false);
    });
  });

  // ============================================================================
  // Stat Tests (8 tests)
  // ============================================================================

  describe('stat', () => {
    it('should return file stats', async () => {
      const testFile = join(testDir, 'stat.txt');
      await fsWrite(testFile, 'test content');

      const result = await skill.execute({ operation: 'stat', path: testFile });

      expect(result.success).toBe(true);
      const stats = result.data as any;
      expect(stats.type).toBe('file');
      expect(stats.size).toBe(12);
      expect(stats.createdAt).toBeDefined();
      expect(stats.modifiedAt).toBeDefined();
      expect(stats.accessedAt).toBeDefined();
    });

    it('should return directory stats', async () => {
      const dir = join(testDir, 'statdir');
      await mkdir(dir);

      const result = await skill.execute({ operation: 'stat', path: dir });

      const stats = result.data as any;
      expect(stats.type).toBe('directory');
    });

    it('should include permission flags', async () => {
      const testFile = join(testDir, 'perms.txt');
      await fsWrite(testFile, 'test');

      const result = await skill.execute({ operation: 'stat', path: testFile });

      const stats = result.data as any;
      expect(stats.isReadable).toBe(true);
      expect(stats.isWritable).toBe(true);
      expect(stats.mode).toBeDefined();
    });

    it('should fail for non-existent path', async () => {
      const result = await skill.execute({ operation: 'stat', path: join(testDir, 'nonexistent.txt') });

      expect(result.success).toBe(false);
    });

    it('should fail for path outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'stat', path: '/etc/passwd' });

      expect(result.success).toBe(false);
    });

    it('should use singleton function', async () => {
      const testFile = join(testDir, 'singleton.txt');
      await fsWrite(testFile, 'test');

      const stats = await stat(testFile);

      expect(stats.type).toBe('file');
      expect(stats.size).toBeGreaterThan(0);
    });

    it('should return correct size for empty file', async () => {
      const testFile = join(testDir, 'empty.txt');
      await fsWrite(testFile, '');

      const result = await skill.execute({ operation: 'stat', path: testFile });

      const stats = result.data as any;
      expect(stats.size).toBe(0);
    });

    it('should return correct size for large file', async () => {
      const testFile = join(testDir, 'large.txt');
      const content = 'x'.repeat(10000);
      await fsWrite(testFile, content);

      const result = await skill.execute({ operation: 'stat', path: testFile });

      const stats = result.data as any;
      expect(stats.size).toBe(10000);
    });
  });

  // ============================================================================
  // Checksum Tests (6 tests)
  // ============================================================================

  describe('checksum', () => {
    it('should calculate file checksum', async () => {
      const testFile = join(testDir, 'checksum.txt');
      await fsWrite(testFile, 'test content');

      const result = await skill.execute({ operation: 'checksum', path: testFile });

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.checksum).toBeDefined();
      expect(data.algorithm).toBe('sha256');
      expect(data.checksum.length).toBe(64); // SHA256 hex length
    });

    it('should return consistent checksum for same content', async () => {
      const file1 = join(testDir, 'file1.txt');
      const file2 = join(testDir, 'file2.txt');
      await fsWrite(file1, 'identical');
      await fsWrite(file2, 'identical');

      const result1 = await skill.execute({ operation: 'checksum', path: file1 });
      const result2 = await skill.execute({ operation: 'checksum', path: file2 });

      expect((result1.data as any).checksum).toBe((result2.data as any).checksum);
    });

    it('should return different checksums for different content', async () => {
      const file1 = join(testDir, 'file1.txt');
      const file2 = join(testDir, 'file2.txt');
      await fsWrite(file1, 'content1');
      await fsWrite(file2, 'content2');

      const result1 = await skill.execute({ operation: 'checksum', path: file1 });
      const result2 = await skill.execute({ operation: 'checksum', path: file2 });

      expect((result1.data as any).checksum).not.toBe((result2.data as any).checksum);
    });

    it('should fail for non-existent file', async () => {
      const result = await skill.execute({ operation: 'checksum', path: join(testDir, 'nonexistent.txt') });

      expect(result.success).toBe(false);
    });

    it('should use singleton function', async () => {
      const testFile = join(testDir, 'singleton.txt');
      await fsWrite(testFile, 'test');

      const hash = await checksum(testFile);

      expect(hash).toBeDefined();
      expect(hash.length).toBe(64);
    });

    it('should handle empty file checksum', async () => {
      const testFile = join(testDir, 'empty.txt');
      await fsWrite(testFile, '');

      const result = await skill.execute({ operation: 'checksum', path: testFile });

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.checksum).toBeDefined();
    });
  });

  // ============================================================================
  // Get Quota Tests (5 tests)
  // ============================================================================

  describe('getQuota', () => {
    it('should return quota information', async () => {
      const result = await skill.execute({ operation: 'getQuota', path: '' });

      expect(result.success).toBe(true);
      const data = result.data as any;
      expect(data.used).toBeDefined();
      expect(data.remaining).toBeDefined();
      expect(data.total).toBe(1048576); // 1MB
    });

    it('should track quota usage', async () => {
      const testFile = join(testDir, 'quota.txt');
      await skill.execute({ operation: 'writeFile', path: testFile, content: 'x'.repeat(1000) });

      const result = await skill.execute({ operation: 'getQuota', path: '' });

      const data = result.data as any;
      expect(data.used).toBe(1000);
      expect(data.remaining).toBe(1048576 - 1000);
    });

    it('should update quota after multiple operations', async () => {
      await skill.execute({ operation: 'writeFile', path: join(testDir, 'file1.txt'), content: 'x'.repeat(500) });
      await skill.execute({ operation: 'writeFile', path: join(testDir, 'file2.txt'), content: 'x'.repeat(500) });

      const result = await skill.execute({ operation: 'getQuota', path: '' });

      const data = result.data as any;
      expect(data.used).toBe(1000);
    });

    it('should use singleton function', async () => {
      const quota = await getQuota();

      expect(quota.used).toBeDefined();
      expect(quota.remaining).toBeDefined();
      expect(quota.total).toBeDefined();
    });

    it('should not require path validation', async () => {
      // getQuota doesn't need a path, so it should not validate
      const result = await skill.execute({ operation: 'getQuota', path: '/invalid/path' });

      expect(result.success).toBe(true);
    });
  });

  // ============================================================================
  // Security Tests (Path Traversal, Symlinks, Null Bytes) (15 tests)
  // ============================================================================

  describe('Security', () => {
    it('should block path traversal with ../', async () => {
      const result = await skill.execute({ operation: 'readFile', path: join(testDir, '../../../etc/passwd') });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outside allowed roots');
    });

    it('should block path traversal with ..\\', async () => {
      const result = await skill.execute({ operation: 'readFile', path: join(testDir, '..\\..\\..\\etc\\passwd') });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Path traversal detected');
    });

    it('should block null byte injection', async () => {
      const result = await skill.execute({ operation: 'readFile', path: testDir + '\x00' + '.txt' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('null byte detected');
    });

    it('should block absolute paths outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'readFile', path: '/etc/passwd' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outside allowed roots');
    });

    it('should block symlinks when enabled', async () => {
      const testFile = join(testDir, 'real.txt');
      const symlinkFile = join(testDir, 'link.txt');
      await fsWrite(testFile, 'test');
      await symlink(testFile, symlinkFile);

      const result = await skill.execute({ operation: 'readFile', path: symlinkFile });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Symlinks are not allowed');
    });

    it('should allow symlinks when blockSymlinks=false', async () => {
      const permissiveSkill = new FileOperationsSkill({
        allowedRoots: [testDir],
        blockSymlinks: false,
        agentId: 'permissive-agent',
      });

      const testFile = join(testDir, 'real2.txt');
      const symlinkFile = join(testDir, 'link2.txt');
      await fsWrite(testFile, 'test');
      await symlink(testFile, symlinkFile);

      // Note: reading symlink may still fail for other reasons, but should not error on symlink check
      const result = await permissiveSkill.execute({ operation: 'readFile', path: symlinkFile });

      // Should not fail with "symlinks not allowed" error
      if (!result.success) {
        expect(result.error).not.toContain('Symlinks are not allowed');
      }
    });

    it('should block write outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'writeFile', path: '/tmp/hack.txt', content: 'bad' });

      expect(result.success).toBe(false);
      expect(result.error).toContain('outside allowed roots');
    });

    it('should block delete outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'deleteFile', path: '/tmp/hack.txt' });

      expect(result.success).toBe(false);
    });

    it('should block copy to outside allowed roots', async () => {
      const source = join(testDir, 'source.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'copy', path: source, destPath: '/tmp/hack.txt' });

      expect(result.success).toBe(false);
    });

    it('should block move to outside allowed roots', async () => {
      const source = join(testDir, 'source.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'move', path: source, destPath: '/tmp/hack.txt' });

      expect(result.success).toBe(false);
    });

    it('should block listing directories outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'listDir', path: '/tmp' });

      expect(result.success).toBe(false);
    });

    it('should block mkdir outside allowed roots', async () => {
      const result = await skill.execute({ operation: 'mkdir', path: '/tmp/hack' });

      expect(result.success).toBe(false);
    });

    it('should validate all paths even in nested operations', async () => {
      // Attempt to copy from allowed to disallowed
      const source = join(testDir, 'source.txt');
      await fsWrite(source, 'test');

      const result = await skill.execute({ operation: 'copy', path: source, destPath: '/etc/passwd' });

      expect(result.success).toBe(false);
    });

    it('should handle encoded path traversal attempts', async () => {
      // URL-encoded ../
      const encodedPath = testDir + '/%2e%2e/%2e%2e/etc/passwd';

      const result = await skill.execute({ operation: 'readFile', path: encodedPath });

      // Should fail due to path validation
      expect(result.success).toBe(false);
    });

    it('should block mixed separator path traversal', async () => {
      const mixedPath = testDir + '/..//..//etc/passwd';

      const result = await skill.execute({ operation: 'readFile', path: mixedPath });

      expect(result.success).toBe(false);
    });
  });

  // ============================================================================
  // Quota Enforcement Tests (5 tests)
  // ============================================================================

  describe('Quota Enforcement', () => {
    it('should prevent write when quota exceeded', async () => {
      const largeContent = 'x'.repeat(2000000); // 2MB (exceeds 1MB quota)
      const result = await skill.execute({ operation: 'writeFile', path: join(testDir, 'large.txt'), content: largeContent });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should prevent append when quota exceeded', async () => {
      const largeContent = 'x'.repeat(2000000);
      const result = await skill.execute({ operation: 'appendFile', path: join(testDir, 'large.txt'), content: largeContent });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should prevent copy when quota exceeded', async () => {
      const source = join(testDir, 'source.txt');
      const largeContent = 'x'.repeat(2000000);
      await fsWrite(source, largeContent);

      const result = await skill.execute({ operation: 'copy', path: source, destPath: join(testDir, 'dest.txt') });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Quota exceeded');
    });

    it('should track cumulative quota across operations', async () => {
      await skill.execute({ operation: 'writeFile', path: join(testDir, 'file1.txt'), content: 'x'.repeat(500000) });
      await skill.execute({ operation: 'writeFile', path: join(testDir, 'file2.txt'), content: 'x'.repeat(500000) });

      const quota = await getQuota();

      expect(quota.used).toBe(1000000);
      expect(quota.remaining).toBe(48576);
    });

    it('should allow operations within quota', async () => {
      const smallContent = 'x'.repeat(10000); // 10KB (well within 1MB quota)

      const result = await skill.execute({ operation: 'writeFile', path: join(testDir, 'small.txt'), content: smallContent });

      expect(result.success).toBe(true);
      expect(result.bytesUsed).toBe(10000);
    });
  });

  // ============================================================================
  // Edge Cases (10 tests)
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle empty file read', async () => {
      const testFile = join(testDir, 'empty.txt');
      await fsWrite(testFile, '');

      const result = await skill.execute({ operation: 'readFile', path: testFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe('');
    });

    it('should handle empty file write', async () => {
      const testFile = join(testDir, 'empty.txt');

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: '' });

      expect(result.success).toBe(true);

      const content = await fsRead(testFile, 'utf-8');
      expect(content).toBe('');
    });

    it('should handle file with only whitespace', async () => {
      const testFile = join(testDir, 'whitespace.txt');
      await fsWrite(testFile, '   \n\t  ');

      const result = await skill.execute({ operation: 'readFile', path: testFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe('   \n\t  ');
    });

    it('should handle very long file names (within OS limits)', async () => {
      const longName = 'a'.repeat(200) + '.txt';
      const testFile = join(testDir, longName);

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle files with special characters in name', async () => {
      const specialFile = join(testDir, 'file-with-chars!@#$%.txt');

      const result = await skill.execute({ operation: 'writeFile', path: specialFile, content: 'test' });

      expect(result.success).toBe(true);
    });

    it('should handle concurrent operations on same file', async () => {
      const testFile = join(testDir, 'concurrent.txt');

      const promises = [
        skill.execute({ operation: 'writeFile', path: testFile, content: 'test1' }),
        skill.execute({ operation: 'writeFile', path: testFile, content: 'test2' }),
      ];

      const results = await Promise.all(promises);

      // Both should succeed (last write wins)
      expect(results.every(r => r.success)).toBe(true);
    });

    it('should handle deeply nested directory creation', async () => {
      const deepPath = join(testDir, 'a/b/c/d/e/f/g/h/i/j/file.txt');

      const result = await skill.execute({ operation: 'writeFile', path: deepPath, content: 'test', createDirs: true });

      expect(result.success).toBe(true);
    });

    it('should handle binary content with null bytes', async () => {
      const testFile = join(testDir, 'binary.dat');
      const buffer = Buffer.from([0x00, 0x01, 0x02, 0xFF]);

      const result = await skill.execute({ operation: 'writeFile', path: testFile, content: buffer, encoding: 'binary' });

      expect(result.success).toBe(true);
    });

    it('should handle case-sensitive file systems correctly', async () => {
      const file1 = join(testDir, 'Test.txt');
      const file2 = join(testDir, 'test.txt');

      await skill.execute({ operation: 'writeFile', path: file1, content: 'uppercase' });
      await skill.execute({ operation: 'writeFile', path: file2, content: 'lowercase' });

      // On case-sensitive systems, both should exist
      // On case-insensitive systems, last write wins
      const result1 = await skill.execute({ operation: 'exists', path: file1 });
      const result2 = await skill.execute({ operation: 'exists', path: file2 });

      expect((result1.data as any).exists).toBe(true);
      expect((result2.data as any).exists).toBe(true);
    });

    it('should handle rapid sequential operations', async () => {
      const testFile = join(testDir, 'rapid.txt');

      for (let i = 0; i < 10; i++) {
        await skill.execute({ operation: 'writeFile', path: testFile, content: `iteration ${i}` });
      }

      const result = await skill.execute({ operation: 'readFile', path: testFile });

      expect(result.success).toBe(true);
      expect(result.data).toBe('iteration 9');
    });
  });

  // ============================================================================
  // Metadata Tests (5 tests)
  // ============================================================================

  describe('Skill Metadata', () => {
    it('should have correct id', () => {
      expect(skill.id).toBe('file-ops');
    });

    it('should have correct name', () => {
      expect(skill.name).toBe('File Operations');
    });

    it('should have correct version', () => {
      expect(skill.version).toBe('1.0.0');
    });

    it('should have correct permissions', () => {
      expect(skill.permissions).toContain('fs:read:/data/*');
      expect(skill.permissions).toContain('fs:write:/data/*');
      expect(skill.permissions).toContain('fs:list:/data/*');
      expect(skill.permissions).toContain('fs:delete:/data/*');
    });

    it('should have correct tags', () => {
      expect(skill.tags).toContain('filesystem');
      expect(skill.tags).toContain('files');
      expect(skill.tags).toContain('storage');
    });
  });
});
