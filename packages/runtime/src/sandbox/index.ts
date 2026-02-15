/**
 * WASM Sandbox Module
 *
 * Secure WASM-based skill execution with Extism
 */

export { WasmSandbox, loadWasmFromFile, loadWasmFromUrl } from './wasm.js';
export type {
  WasmSource,
  WasmSandboxConfig,
  WasmExecutionResult,
} from './wasm.js';

export {
  PermissionChecker,
  PermissionValidator,
  PermissionType,
} from './permissions.js';
export type {
  Permission,
  PermissionSet,
  PermissionCheckResult,
} from './permissions.js';

export { createHostFunctions, getHostFunctionDefinitions, DEFAULT_NAMESPACE } from './host-functions.js';
export type { HostFunctionContext } from './host-functions.js';
