/**
 * Memory management utilities for WASM
 * Ensures memory management functions are available across environments
 */

/**
 * Setup memory management functions for WASM
 * @param {Object} wasmInstance - The WebAssembly instance or module
 * @returns {Object} The same instance with memory functions setup
 */
export function setupMemoryFunctions(wasmInstance) {
  if (!wasmInstance) {
    throw new Error('WASM instance is required for memory setup')
  }

  // Check if wasm has the required memory functions
  if (!wasmInstance.__wbindgen_malloc) {
    throw new Error('WASM instance missing __wbindgen_malloc function')
  }

  if (!wasmInstance.__wbindgen_realloc) {
    throw new Error('WASM instance missing __wbindgen_realloc function')
  }

  // Create global polyfills if needed
  if (typeof globalThis.malloc === 'undefined') {
    globalThis.malloc = function (size, align) {
      console.log('Polyfill malloc called with size:', size)
      return wasmInstance.__wbindgen_malloc(size)
    }
  }

  if (typeof globalThis.__wbindgen_malloc === 'undefined') {
    globalThis.__wbindgen_malloc = function (size) {
      console.log('Polyfill __wbindgen_malloc called with size:', size)
      return wasmInstance.__wbindgen_malloc(size)
    }
  }

  if (typeof globalThis.__wbindgen_realloc === 'undefined') {
    globalThis.__wbindgen_realloc = function (ptr, oldSize, newSize, align) {
      console.log('Polyfill __wbindgen_realloc called:', ptr, oldSize, newSize)
      return wasmInstance.__wbindgen_realloc(ptr, oldSize, newSize)
    }
  }

  return wasmInstance
}

/**
 * Creates a patched passStringToWasm0 function that doesn't rely on global malloc
 * @param {Object} wasmInstance - The WebAssembly instance
 * @returns {Function} Patched string passing function
 */
export function createPatchedStringToWasm(wasmInstance) {
  // Function to get Uint8Memory
  const getUint8Memory0 = () => {
    if (!wasmInstance.memory) {
      throw new Error('WASM memory not available')
    }
    return new Uint8Array(wasmInstance.memory.buffer)
  }

  // Return a patched function that uses the instance directly
  return function patchedPassStringToWasm(arg, realloc) {
    const encoder = new TextEncoder()
    const buf = encoder.encode(arg)

    // Use instance functions directly instead of globals
    const ptr = wasmInstance.__wbindgen_malloc(buf.length) >>> 0

    getUint8Memory0()
      .subarray(ptr, ptr + buf.length)
      .set(buf)
    return { ptr, len: buf.length }
  }
}

/**
 * Export memory-related functions for direct access
 * @param {Object} wasmInstance - The WebAssembly instance
 * @returns {Object} Object containing memory functions
 */
export function exportMemoryFunctions(wasmInstance) {
  return {
    __wbindgen_malloc: wasmInstance.__wbindgen_malloc,
    __wbindgen_realloc: wasmInstance.__wbindgen_realloc,
    memory: wasmInstance.memory,
  }
}
