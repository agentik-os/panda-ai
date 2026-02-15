import { describe, it, expect } from 'vitest';
import {
  PermissionChecker,
  PermissionValidator,
  PermissionType,
  type PermissionSet,
} from './permissions.js';

describe('PermissionChecker', () => {
  describe('check', () => {
    it('should grant permission when type matches', () => {
      const checker = new PermissionChecker({
        permissions: [{ type: PermissionType.KV_READ }],
        allowUnlisted: false,
      });

      const result = checker.check(PermissionType.KV_READ);
      expect(result.granted).toBe(true);
    });

    it('should deny permission when type does not match', () => {
      const checker = new PermissionChecker({
        permissions: [{ type: PermissionType.KV_READ }],
        allowUnlisted: false,
      });

      const result = checker.check(PermissionType.KV_WRITE);
      expect(result.granted).toBe(false);
      expect(result.reason).toContain('not granted');
    });

    it('should grant permission with exact resource match', () => {
      const checker = new PermissionChecker({
        permissions: [
          {
            type: PermissionType.NET_HTTPS,
            resource: 'https://api.example.com',
          },
        ],
        allowUnlisted: false,
      });

      const result = checker.check(
        PermissionType.NET_HTTPS,
        'https://api.example.com',
      );
      expect(result.granted).toBe(true);
    });

    it('should deny permission with different resource', () => {
      const checker = new PermissionChecker({
        permissions: [
          {
            type: PermissionType.NET_HTTPS,
            resource: 'https://api.example.com',
          },
        ],
        allowUnlisted: false,
      });

      const result = checker.check(
        PermissionType.NET_HTTPS,
        'https://evil.com',
      );
      expect(result.granted).toBe(false);
    });

    it('should support wildcard resource patterns', () => {
      const checker = new PermissionChecker({
        permissions: [
          {
            type: PermissionType.NET_HTTPS,
            resource: '*.example.com',
          },
        ],
        allowUnlisted: false,
      });

      expect(
        checker.check(PermissionType.NET_HTTPS, 'api.example.com').granted,
      ).toBe(true);
      expect(
        checker.check(PermissionType.NET_HTTPS, 'cdn.example.com').granted,
      ).toBe(true);
      expect(
        checker.check(PermissionType.NET_HTTPS, 'example.com').granted,
      ).toBe(false);
    });

    it('should support prefix resource patterns', () => {
      const checker = new PermissionChecker({
        permissions: [
          {
            type: PermissionType.FS_READ,
            resource: '/app/data/',
          },
        ],
        allowUnlisted: false,
      });

      expect(
        checker.check(PermissionType.FS_READ, '/app/data/config.json').granted,
      ).toBe(true);
      expect(
        checker.check(PermissionType.FS_READ, '/app/data/secrets/key.txt')
          .granted,
      ).toBe(true);
      expect(checker.check(PermissionType.FS_READ, '/etc/passwd').granted).toBe(
        false,
      );
    });

    it('should grant any permission when allowUnlisted is true', () => {
      const checker = new PermissionChecker({
        permissions: [],
        allowUnlisted: true,
      });

      expect(checker.check(PermissionType.KV_READ).granted).toBe(true);
      expect(checker.check(PermissionType.NET_HTTPS).granted).toBe(true);
      expect(checker.check(PermissionType.SYS_PROCESS).granted).toBe(true);
    });
  });

  describe('checkMultiple', () => {
    it('should check multiple permissions', () => {
      const checker = new PermissionChecker({
        permissions: [
          { type: PermissionType.KV_READ },
          { type: PermissionType.KV_WRITE },
        ],
        allowUnlisted: false,
      });

      const results = checker.checkMultiple([
        { type: PermissionType.KV_READ },
        { type: PermissionType.KV_WRITE },
        { type: PermissionType.NET_HTTPS },
      ]);

      expect(results).toHaveLength(3);
      expect(results[0]?.granted).toBe(true);
      expect(results[1]?.granted).toBe(true);
      expect(results[2]?.granted).toBe(false);
    });
  });

  describe('checkAll', () => {
    it('should return true when all permissions granted', () => {
      const checker = new PermissionChecker({
        permissions: [
          { type: PermissionType.KV_READ },
          { type: PermissionType.KV_WRITE },
        ],
        allowUnlisted: false,
      });

      const result = checker.checkAll([
        { type: PermissionType.KV_READ },
        { type: PermissionType.KV_WRITE },
      ]);

      expect(result).toBe(true);
    });

    it('should return false when any permission denied', () => {
      const checker = new PermissionChecker({
        permissions: [{ type: PermissionType.KV_READ }],
        allowUnlisted: false,
      });

      const result = checker.checkAll([
        { type: PermissionType.KV_READ },
        { type: PermissionType.KV_WRITE },
      ]);

      expect(result).toBe(false);
    });
  });

  describe('checkAny', () => {
    it('should return true when at least one permission granted', () => {
      const checker = new PermissionChecker({
        permissions: [{ type: PermissionType.KV_READ }],
        allowUnlisted: false,
      });

      const result = checker.checkAny([
        { type: PermissionType.KV_READ },
        { type: PermissionType.KV_WRITE },
      ]);

      expect(result).toBe(true);
    });

    it('should return false when no permissions granted', () => {
      const checker = new PermissionChecker({
        permissions: [{ type: PermissionType.SYS_TIME }],
        allowUnlisted: false,
      });

      const result = checker.checkAny([
        { type: PermissionType.KV_READ },
        { type: PermissionType.KV_WRITE },
      ]);

      expect(result).toBe(false);
    });
  });

  describe('fromPreset', () => {
    it('should create minimal preset', () => {
      const checker = PermissionChecker.fromPreset('minimal');

      expect(checker.check(PermissionType.SYS_TIME).granted).toBe(true);
      expect(checker.check(PermissionType.SYS_RANDOM).granted).toBe(true);
      expect(checker.check(PermissionType.KV_READ).granted).toBe(false);
    });

    it('should create standard preset', () => {
      const checker = PermissionChecker.fromPreset('standard');

      expect(checker.check(PermissionType.SYS_TIME).granted).toBe(true);
      expect(checker.check(PermissionType.KV_READ).granted).toBe(true);
      expect(checker.check(PermissionType.NET_HTTPS).granted).toBe(true);
      expect(checker.check(PermissionType.FS_WRITE).granted).toBe(false);
    });

    it('should create unrestricted preset', () => {
      const checker = PermissionChecker.fromPreset('unrestricted');

      expect(checker.check(PermissionType.SYS_TIME).granted).toBe(true);
      expect(checker.check(PermissionType.KV_READ).granted).toBe(true);
      expect(checker.check(PermissionType.NET_HTTPS).granted).toBe(true);
      expect(checker.check(PermissionType.FS_WRITE).granted).toBe(true);
      expect(checker.check(PermissionType.SYS_PROCESS).granted).toBe(true);
    });
  });
});

describe('PermissionValidator', () => {
  it('should validate a correct permission set', () => {
    const permissionSet: PermissionSet = {
      permissions: [
        { type: PermissionType.KV_READ },
        { type: PermissionType.KV_WRITE },
      ],
      allowUnlisted: false,
    };

    const result = PermissionValidator.validate(permissionSet);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should detect missing permissions array', () => {
    const permissionSet = {
      allowUnlisted: false,
    } as unknown as PermissionSet;

    const result = PermissionValidator.validate(permissionSet);
    expect(result.valid).toBe(false);
    expect(result.errors).toContain('permissions must be an array');
  });

  it('should detect missing permission type', () => {
    const permissionSet: PermissionSet = {
      permissions: [{} as never],
      allowUnlisted: false,
    };

    const result = PermissionValidator.validate(permissionSet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('missing type'))).toBe(true);
  });

  it('should detect invalid permission type', () => {
    const permissionSet: PermissionSet = {
      permissions: [{ type: 'invalid:type' as PermissionType }],
      allowUnlisted: false,
    };

    const result = PermissionValidator.validate(permissionSet);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('invalid type'))).toBe(true);
  });
});
