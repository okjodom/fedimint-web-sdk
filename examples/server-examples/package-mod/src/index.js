/**
 * Modified fedimint-client-wasm-bundler package with enhanced environment support
 * Provides consistent initialization across Bun, Node.js and browser environments
 */

// Export environment detection utilities
export {
  getEnvironment,
  isBunEnvironment,
  isNodeEnvironment,
  isBrowserEnvironment,
  supportsWebAssembly,
  logEnvironmentInfo,
} from './env.js'

// Export memory management utilities
export {
  setupMemoryFunctions,
  createPatchedStringToWasm,
  exportMemoryFunctions,
} from './memory.js'

// Export initialization utilities
export { initWasm, initWasmBun, initWasmNode, initWasmBrowser } from './init.js'

// Import WASM components
// Note: We need to handle the case where wasm is not exported directly
import { WasmClient, RpcHandle } from '../.wasm/fedimint_client_wasm.js'

// Get the wasm object from the background module
import * as bgModule from '../.wasm/fedimint_client_wasm_bg.js'
const originalWasm = bgModule.wasm

// Export main components
export { WasmClient, RpcHandle }

// Create mock memory functions if originals aren't available
const mockWasmMemory = {
  __wbindgen_malloc: function (size) {
    console.warn('Using mock __wbindgen_malloc')
    return 0 // Mock implementation
  },
  __wbindgen_realloc: function (ptr, oldSize, newSize) {
    console.warn('Using mock __wbindgen_realloc')
    return 0 // Mock implementation
  },
}

// Export memory functions directly
export const wasm = originalWasm
  ? {
      ...originalWasm,
      // Ensure these functions are always available
      __wbindgen_malloc:
        originalWasm.__wbindgen_malloc || mockWasmMemory.__wbindgen_malloc,
      __wbindgen_realloc:
        originalWasm.__wbindgen_realloc || mockWasmMemory.__wbindgen_realloc,
    }
  : mockWasmMemory

// Create a default initialization function for compatibility
export default async function initialize(
  wasmPath = './.wasm/fedimint_client_wasm_bg.wasm',
) {
  const module = await initWasm(wasmPath)
  return module
}
