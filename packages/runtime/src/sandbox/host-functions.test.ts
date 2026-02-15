import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { CurrentPlugin } from '@extism/extism';
import {
  createHostFunctions,
  getHostFunctionDefinitions,
  DEFAULT_NAMESPACE,
  type HostFunctionContext,
} from './host-functions.js';
import { PermissionChecker, PermissionType } from './permissions.js';

// Mock CurrentPlugin
function createMockCurrentPlugin(): CurrentPlugin {
  const memory = new Map<bigint, Uint8Array>();
  let nextOffset = 0n;

  return {
    read(offs: bigint) {
      const data = memory.get(offs) ?? new Uint8Array(0);
      return {
        text: () => new TextDecoder().decode(data),
        json: () => JSON.parse(new TextDecoder().decode(data)),
        bytes: () => data,
        // DataView methods
        getUint32: (byteOffset: number, littleEndian?: boolean) =>
          new DataView(data.buffer).getUint32(byteOffset, littleEndian),
      } as ReturnType<CurrentPlugin['read']>;
    },
    store(data: Uint8Array) {
      const offs = nextOffset++;
      memory.set(offs, data);
      return offs;
    },
  } as unknown as CurrentPlugin;
}

describe('Host Functions', () => {
  let context: HostFunctionContext;
  let cp: CurrentPlugin;

  beforeEach(() => {
    cp = createMockCurrentPlugin();

    context = {
      permissions: PermissionChecker.fromPreset('standard'),
      kvStore: new Map(),
      metadata: {
        pluginId: 'test-plugin',
        name: 'Test Plugin',
      },
    };
  });

  describe('KV Functions', () => {
    it('kv_write should store data', () => {
      const functions = createHostFunctions(context);

      const key = cp.store(new TextEncoder().encode('test-key'));
      const value = cp.store(new TextEncoder().encode('test-value'));

      functions.kv_write(cp, key, value);

      expect(context.kvStore.has('test-key')).toBe(true);
      const stored = context.kvStore.get('test-key');
      expect(new TextDecoder().decode(stored)).toBe('test-value');
    });

    it('kv_read should retrieve data', () => {
      const functions = createHostFunctions(context);

      // First write
      context.kvStore.set('test-key', new TextEncoder().encode('test-value'));

      // Then read
      const key = cp.store(new TextEncoder().encode('test-key'));
      const resultOffs = functions.kv_read(cp, key);

      const result = cp.read(resultOffs);
      expect(result.text()).toBe('test-value');
    });

    it('kv_read should return empty for non-existent key', () => {
      const functions = createHostFunctions(context);

      const key = cp.store(new TextEncoder().encode('non-existent'));
      const resultOffs = functions.kv_read(cp, key);

      const result = cp.read(resultOffs);
      expect(result.bytes()).toHaveLength(0);
    });

    it('kv_delete should remove data', () => {
      const functions = createHostFunctions(context);

      context.kvStore.set('test-key', new TextEncoder().encode('test-value'));
      expect(context.kvStore.has('test-key')).toBe(true);

      const key = cp.store(new TextEncoder().encode('test-key'));
      functions.kv_delete(cp, key);

      expect(context.kvStore.has('test-key')).toBe(false);
    });

    it('kv_exists should return 1 for existing key', () => {
      const functions = createHostFunctions(context);

      context.kvStore.set('test-key', new TextEncoder().encode('test-value'));

      const key = cp.store(new TextEncoder().encode('test-key'));
      const resultOffs = functions.kv_exists(cp, key);

      const result = cp.read(resultOffs);
      expect(result.bytes()[0]).toBe(1);
    });

    it('kv_exists should return 0 for non-existent key', () => {
      const functions = createHostFunctions(context);

      const key = cp.store(new TextEncoder().encode('non-existent'));
      const resultOffs = functions.kv_exists(cp, key);

      const result = cp.read(resultOffs);
      expect(result.bytes()[0]).toBe(0);
    });

    it('kv_write should throw when permission denied', () => {
      // Create context with minimal permissions (no KV_WRITE)
      const restrictedContext = {
        ...context,
        permissions: PermissionChecker.fromPreset('minimal'),
      };

      const functions = createHostFunctions(restrictedContext);

      const key = cp.store(new TextEncoder().encode('test-key'));
      const value = cp.store(new TextEncoder().encode('test-value'));

      expect(() => functions.kv_write(cp, key, value)).toThrow(
        'Permission denied',
      );
    });
  });

  describe('System Functions', () => {
    it('sys_time_now should return current timestamp', () => {
      const functions = createHostFunctions(context);

      const beforeTime = BigInt(Date.now());
      const resultOffs = functions.sys_time_now(cp);
      const afterTime = BigInt(Date.now());

      const result = cp.read(resultOffs);
      const timestamp = new DataView(result.bytes().buffer).getBigUint64(
        0,
        true,
      );

      expect(timestamp).toBeGreaterThanOrEqual(beforeTime);
      expect(timestamp).toBeLessThanOrEqual(afterTime);
    });

    it('sys_random_bytes should generate random bytes', () => {
      const functions = createHostFunctions(context);

      const length = 32;
      const lengthBuffer = new ArrayBuffer(4);
      new DataView(lengthBuffer).setUint32(0, length, true);

      const lengthOffs = cp.store(new Uint8Array(lengthBuffer));
      const resultOffs = functions.sys_random_bytes(cp, lengthOffs);

      const result = cp.read(resultOffs);
      expect(result.bytes()).toHaveLength(length);
    });

    it('sys_random_bytes should throw for excessive length', () => {
      const functions = createHostFunctions(context);

      const length = 2 * 1024 * 1024; // 2MB (exceeds 1MB limit)
      const lengthBuffer = new ArrayBuffer(4);
      new DataView(lengthBuffer).setUint32(0, length, true);

      const lengthOffs = cp.store(new Uint8Array(lengthBuffer));

      expect(() => functions.sys_random_bytes(cp, lengthOffs)).toThrow(
        'exceeds maximum',
      );
    });

    it('sys_time_now should throw when permission denied', () => {
      const restrictedContext = {
        ...context,
        permissions: new PermissionChecker({
          permissions: [],
          allowUnlisted: false,
        }),
      };

      const functions = createHostFunctions(restrictedContext);

      expect(() => functions.sys_time_now(cp)).toThrow('Permission denied');
    });
  });

  describe('Memory Functions', () => {
    it('memory_write should store data with __mem: prefix', () => {
      // Create context with memory permissions
      const memoryContext = {
        ...context,
        permissions: new PermissionChecker({
          permissions: [
            { type: PermissionType.MEMORY_WRITE },
          ],
          allowUnlisted: false,
        }),
      };

      const functions = createHostFunctions(memoryContext);

      const key = cp.store(new TextEncoder().encode('test-key'));
      const value = cp.store(new TextEncoder().encode('test-value'));

      functions.memory_write(cp, key, value);

      expect(memoryContext.kvStore.has('__mem:test-key')).toBe(true);
      const stored = memoryContext.kvStore.get('__mem:test-key');
      expect(new TextDecoder().decode(stored)).toBe('test-value');
    });

    it('memory_read should retrieve data with __mem: prefix', () => {
      // Create context with memory permissions
      const memoryContext = {
        ...context,
        permissions: new PermissionChecker({
          permissions: [
            { type: PermissionType.MEMORY_READ },
          ],
          allowUnlisted: false,
        }),
      };

      const functions = createHostFunctions(memoryContext);

      memoryContext.kvStore.set(
        '__mem:test-key',
        new TextEncoder().encode('test-value'),
      );

      const key = cp.store(new TextEncoder().encode('test-key'));
      const resultOffs = functions.memory_read(cp, key);

      const result = cp.read(resultOffs);
      expect(result.text()).toBe('test-value');
    });
  });

  describe('Logging Functions', () => {
    it('log_info should log with plugin name', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

      const functions = createHostFunctions(context);

      const message = cp.store(new TextEncoder().encode('Test message'));
      functions.log_info(cp, message);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Plugin Test Plugin] INFO:',
        'Test message',
      );

      consoleSpy.mockRestore();
    });

    it('log_error should log with plugin name', () => {
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const functions = createHostFunctions(context);

      const message = cp.store(new TextEncoder().encode('Error message'));
      functions.log_error(cp, message);

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Plugin Test Plugin] ERROR:',
        'Error message',
      );

      consoleSpy.mockRestore();
    });
  });

  describe('Environment Functions', () => {
    it('env_get should return environment variable', () => {
      process.env.TEST_VAR = 'test-value';

      // Create context with env read permission
      const envContext = {
        ...context,
        permissions: new PermissionChecker({
          permissions: [
            { type: PermissionType.ENV_READ },
          ],
          allowUnlisted: false,
        }),
      };

      const functions = createHostFunctions(envContext);

      const key = cp.store(new TextEncoder().encode('TEST_VAR'));
      const resultOffs = functions.env_get(cp, key);

      const result = cp.read(resultOffs);
      expect(result.text()).toBe('test-value');

      delete process.env.TEST_VAR;
    });

    it('env_set should set environment variable', () => {
      // Create context with env write permission
      const envContext = {
        ...context,
        permissions: new PermissionChecker({
          permissions: [
            { type: PermissionType.ENV_WRITE },
          ],
          allowUnlisted: false,
        }),
      };

      const functions = createHostFunctions(envContext);

      const key = cp.store(new TextEncoder().encode('TEST_VAR'));
      const value = cp.store(new TextEncoder().encode('test-value'));

      functions.env_set(cp, key, value);

      expect(process.env.TEST_VAR).toBe('test-value');

      delete process.env.TEST_VAR;
    });

    it('env_get should throw when permission denied', () => {
      const restrictedContext = {
        ...context,
        permissions: PermissionChecker.fromPreset('minimal'),
      };

      const functions = createHostFunctions(restrictedContext);

      const key = cp.store(new TextEncoder().encode('TEST_VAR'));

      expect(() => functions.env_get(cp, key)).toThrow('Permission denied');
    });
  });

  describe('HTTP Functions', () => {
    it('http_get should throw not implemented error', () => {
      const functions = createHostFunctions(context);

      const url = cp.store(
        new TextEncoder().encode('https://example.com/api'),
      );

      expect(() => functions.http_get(cp, url)).toThrow(
        'not yet implemented',
      );
    });
  });

  describe('getHostFunctionDefinitions', () => {
    it('should return functions under default namespace', () => {
      const definitions = getHostFunctionDefinitions(context);

      expect(definitions).toHaveProperty(DEFAULT_NAMESPACE);
      expect(definitions[DEFAULT_NAMESPACE]).toHaveProperty('kv_read');
      expect(definitions[DEFAULT_NAMESPACE]).toHaveProperty('kv_write');
      expect(definitions[DEFAULT_NAMESPACE]).toHaveProperty('sys_time_now');
    });
  });
});
