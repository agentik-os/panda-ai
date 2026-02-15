/**
 * WASM Sandbox with Extism
 *
 * Secure WASM-based sandbox for executing skills/plugins with permission control.
 */

import createPlugin, { type Plugin } from '@extism/extism';
import { PermissionChecker, type PermissionSet } from './permissions.js';
import {
  getHostFunctionDefinitions,
  type HostFunctionContext,
} from './host-functions.js';

/**
 * WASM plugin source - can be URL, file path, or bytes
 */
export type WasmSource =
  | string // URL or file path
  | Uint8Array // Raw WASM bytes
  | { url: string } // Manifest with URL
  | { path: string } // Manifest with file path
  | { data: Uint8Array }; // Manifest with raw bytes

/**
 * Configuration for creating a WASM sandbox
 */
export interface WasmSandboxConfig {
  /** WASM module source */
  source: WasmSource;

  /** Permission set for the plugin */
  permissions: PermissionSet;

  /** Plugin metadata */
  metadata: {
    pluginId: string;
    name: string;
    version?: string;
  };

  /** Optional configuration passed to the plugin */
  config?: Record<string, string>;

  /** Whether to enable WASI support */
  enableWasi?: boolean;

  /** Memory limit in bytes (default: 64MB) */
  memoryLimit?: number;

  /** Timeout for plugin calls in milliseconds (default: 30000) */
  timeout?: number;
}

/**
 * Result of executing a WASM plugin function
 */
export interface WasmExecutionResult {
  /** Output data from the plugin */
  output: Uint8Array;

  /** Execution time in milliseconds */
  executionTime: number;

  /** Memory used in bytes */
  memoryUsed?: number;

  /** Whether execution succeeded */
  success: boolean;

  /** Error message if execution failed */
  error?: string;
}

/**
 * WASM Sandbox - Secure execution environment for skills/plugins
 */
export class WasmSandbox {
  private plugin: Plugin | null = null;
  private config: WasmSandboxConfig;
  private permissionChecker: PermissionChecker;
  private kvStore: Map<string, Uint8Array>;
  private initialized = false;

  constructor(config: WasmSandboxConfig) {
    this.config = config;
    this.permissionChecker = new PermissionChecker(config.permissions);
    this.kvStore = new Map();
  }

  /**
   * Initialize the WASM sandbox
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Create host function context
      const hostContext: HostFunctionContext = {
        permissions: this.permissionChecker,
        kvStore: this.kvStore,
        metadata: this.config.metadata,
      };

      // Get host functions
      const functions = getHostFunctionDefinitions(hostContext);

      // Normalize source to URL/path/bytes
      let source: string | Uint8Array;
      if (typeof this.config.source === 'string') {
        source = this.config.source;
      } else if (this.config.source instanceof Uint8Array) {
        source = this.config.source;
      } else if ('url' in this.config.source) {
        source = this.config.source.url;
      } else if ('path' in this.config.source) {
        source = this.config.source.path;
      } else if ('data' in this.config.source) {
        source = this.config.source.data;
      } else {
        throw new Error('Invalid WASM source');
      }

      // Create plugin with Extism
      this.plugin = await createPlugin(source, {
        useWasi: this.config.enableWasi ?? true,
        config: this.config.config,
        functions,
        // Memory limit would be set here if Extism supports it
      });

      this.initialized = true;
    } catch (error) {
      throw new Error(
        `Failed to initialize WASM sandbox: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Execute a function in the WASM plugin
   */
  async execute(
    functionName: string,
    input?: string | Uint8Array,
  ): Promise<WasmExecutionResult> {
    if (!this.initialized || !this.plugin) {
      throw new Error('Sandbox not initialized. Call initialize() first.');
    }

    const startTime = Date.now();

    try {
      // Set timeout if configured
      if (this.config.timeout) {
        // Extism doesn't have built-in timeout in the JS SDK
        // We'll implement a wrapper timeout
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => {
            reject(new Error('Plugin execution timeout'));
          }, this.config.timeout);
        });

        const executionPromise = this.plugin.call(functionName, input ?? '');

        const output = await Promise.race([executionPromise, timeoutPromise]);

        const executionTime = Date.now() - startTime;

        return {
          output: output?.bytes() ?? new Uint8Array(0),
          executionTime,
          success: true,
        };
      } else {
        // No timeout - execute directly
        const output = await this.plugin.call(functionName, input ?? '');

        const executionTime = Date.now() - startTime;

        return {
          output: output?.bytes() ?? new Uint8Array(0),
          executionTime,
          success: true,
        };
      }
    } catch (error) {
      const executionTime = Date.now() - startTime;

      return {
        output: new Uint8Array(0),
        executionTime,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute and get text output
   */
  async executeText(
    functionName: string,
    input?: string,
  ): Promise<string> {
    const result = await this.execute(
      functionName,
      input ? new TextEncoder().encode(input) : undefined,
    );

    if (!result.success) {
      throw new Error(`Execution failed: ${result.error}`);
    }

    return new TextDecoder().decode(result.output);
  }

  /**
   * Execute and get JSON output
   */
  async executeJson<T = unknown>(
    functionName: string,
    input?: unknown,
  ): Promise<T> {
    const inputStr = input ? JSON.stringify(input) : undefined;
    const outputStr = await this.executeText(functionName, inputStr);

    return JSON.parse(outputStr) as T;
  }

  /**
   * Reset plugin state (clears variables and KV store)
   */
  async reset(): Promise<void> {
    if (this.plugin) {
      await this.plugin.reset();
      this.kvStore.clear();
    }
  }

  /**
   * Get plugin's KV store (read-only)
   */
  getKVStore(): ReadonlyMap<string, Uint8Array> {
    return this.kvStore;
  }

  /**
   * Get permission checker
   */
  getPermissions(): PermissionChecker {
    return this.permissionChecker;
  }

  /**
   * Check if sandbox is initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Dispose of the sandbox and free resources
   */
  async dispose(): Promise<void> {
    if (this.plugin) {
      await this.plugin.close();
      this.plugin = null;
    }

    this.kvStore.clear();
    this.initialized = false;
  }

  /**
   * Create a sandbox from a preset configuration
   */
  static async fromPreset(
    source: WasmSource,
    metadata: { pluginId: string; name: string },
    preset: 'minimal' | 'standard' | 'unrestricted' = 'standard',
  ): Promise<WasmSandbox> {
    const permissionChecker = PermissionChecker.fromPreset(preset);

    const sandbox = new WasmSandbox({
      source,
      permissions: {
        permissions: permissionChecker.getGrantedPermissions(),
        allowUnlisted: preset === 'unrestricted',
      },
      metadata,
    });

    await sandbox.initialize();
    return sandbox;
  }
}

/**
 * Utility to load WASM from a file
 */
export async function loadWasmFromFile(filePath: string): Promise<Uint8Array> {
  const fs = await import('fs/promises');
  return await fs.readFile(filePath);
}

/**
 * Utility to load WASM from a URL
 */
export async function loadWasmFromUrl(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load WASM from ${url}: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return new Uint8Array(arrayBuffer);
}
