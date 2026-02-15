/**
 * Host Functions for WASM Sandbox
 *
 * These functions are exposed to WASM plugins and provide safe access
 * to runtime capabilities while respecting permissions.
 */

import type { CurrentPlugin } from '@extism/extism';
import { PermissionChecker, PermissionType } from './permissions.js';

/**
 * Context passed to host functions
 */
export interface HostFunctionContext {
  /** Permission checker for this plugin */
  permissions: PermissionChecker;

  /** Key-value store for plugin state */
  kvStore: Map<string, Uint8Array>;

  /** Plugin metadata */
  metadata: {
    pluginId: string;
    name: string;
  };
}

/**
 * Create host functions for a WASM plugin
 */
export function createHostFunctions(context: HostFunctionContext) {
  return {
    /**
     * Key-Value Store Functions
     */
    kv_read(cp: CurrentPlugin, keyOffs: bigint): bigint {
      const check = context.permissions.check(PermissionType.KV_READ);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      const value = context.kvStore.get(key) ?? new Uint8Array(0);

      return cp.store(value);
    },

    kv_write(cp: CurrentPlugin, keyOffs: bigint, valueOffs: bigint): void {
      const check = context.permissions.check(PermissionType.KV_WRITE);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      const value = cp.read(valueOffs)!.bytes();

      context.kvStore.set(key, value);
    },

    kv_delete(cp: CurrentPlugin, keyOffs: bigint): void {
      const check = context.permissions.check(PermissionType.KV_WRITE);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      context.kvStore.delete(key);
    },

    kv_exists(cp: CurrentPlugin, keyOffs: bigint): bigint {
      const check = context.permissions.check(PermissionType.KV_READ);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      const exists = context.kvStore.has(key);

      // Return 1 for true, 0 for false
      const result = new Uint8Array([exists ? 1 : 0]);
      return cp.store(result);
    },

    /**
     * System Functions
     */
    sys_time_now(cp: CurrentPlugin): bigint {
      const check = context.permissions.check(PermissionType.SYS_TIME);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const timestamp = BigInt(Date.now());
      const buffer = new ArrayBuffer(8);
      const view = new DataView(buffer);
      view.setBigUint64(0, timestamp, true); // little-endian

      return cp.store(new Uint8Array(buffer));
    },

    sys_random_bytes(cp: CurrentPlugin, lengthOffs: bigint): bigint {
      const check = context.permissions.check(PermissionType.SYS_RANDOM);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const lengthBytes = cp.read(lengthOffs)!.bytes();
      const length = new DataView(lengthBytes.buffer).getUint32(0, true);

      // Limit random bytes to prevent abuse
      if (length > 1024 * 1024) {
        // 1MB max
        throw new Error('Random bytes length exceeds maximum (1MB)');
      }

      const randomBytes = new Uint8Array(length);
      crypto.getRandomValues(randomBytes);

      return cp.store(randomBytes);
    },

    /**
     * Memory Functions
     */
    memory_read(cp: CurrentPlugin, keyOffs: bigint): bigint {
      const check = context.permissions.check(PermissionType.MEMORY_READ);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      const value = context.kvStore.get(`__mem:${key}`) ?? new Uint8Array(0);

      return cp.store(value);
    },

    memory_write(cp: CurrentPlugin, keyOffs: bigint, valueOffs: bigint): void {
      const check = context.permissions.check(PermissionType.MEMORY_WRITE);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      const value = cp.read(valueOffs)!.bytes();

      context.kvStore.set(`__mem:${key}`, value);
    },

    /**
     * Logging Functions (always allowed)
     */
    log_info(cp: CurrentPlugin, messageOffs: bigint): void {
      const message = cp.read(messageOffs)!.text();
      console.log(`[Plugin ${context.metadata.name}] INFO:`, message);
    },

    log_warn(cp: CurrentPlugin, messageOffs: bigint): void {
      const message = cp.read(messageOffs)!.text();
      console.warn(`[Plugin ${context.metadata.name}] WARN:`, message);
    },

    log_error(cp: CurrentPlugin, messageOffs: bigint): void {
      const message = cp.read(messageOffs)!.text();
      console.error(`[Plugin ${context.metadata.name}] ERROR:`, message);
    },

    log_debug(cp: CurrentPlugin, messageOffs: bigint): void {
      const message = cp.read(messageOffs)!.text();
      console.debug(`[Plugin ${context.metadata.name}] DEBUG:`, message);
    },

    /**
     * HTTP Functions
     */
    http_get(cp: CurrentPlugin, urlOffs: bigint): bigint {
      const url = cp.read(urlOffs)!.text();

      // Check permission based on protocol
      const isHttps = url.startsWith('https://');
      const permissionType = isHttps
        ? PermissionType.NET_HTTPS
        : PermissionType.NET_HTTP;

      const check = context.permissions.check(permissionType, url);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      // Return a promise handle (would need async support in Extism)
      // For now, throw - HTTP will be implemented in a future step
      throw new Error('HTTP functions not yet implemented - coming in step-062');
    },

    /**
     * Environment Functions
     */
    env_get(cp: CurrentPlugin, keyOffs: bigint): bigint {
      const check = context.permissions.check(PermissionType.ENV_READ);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      const value = process.env[key] ?? '';

      return cp.store(new TextEncoder().encode(value));
    },

    env_set(cp: CurrentPlugin, keyOffs: bigint, valueOffs: bigint): void {
      const check = context.permissions.check(PermissionType.ENV_WRITE);
      if (!check.granted) {
        throw new Error(`Permission denied: ${check.reason}`);
      }

      const key = cp.read(keyOffs)!.text();
      const value = cp.read(valueOffs)!.text();

      process.env[key] = value;
    },
  };
}

/**
 * Default host function namespace
 */
export const DEFAULT_NAMESPACE = 'extism:host/agentik';

/**
 * Get function definitions for Extism plugin creation
 */
export function getHostFunctionDefinitions(context: HostFunctionContext) {
  const functions = createHostFunctions(context);

  return {
    [DEFAULT_NAMESPACE]: functions,
  };
}
