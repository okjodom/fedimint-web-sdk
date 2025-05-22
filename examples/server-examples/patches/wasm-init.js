// This file provides WASM initialization support for Bun
// It's used to fix the "malloc is not a function" error

// Export initialization function to be used in NodeClient.js
export async function initializeWasm(wasmModule) {
  // Check if we're running in Bun
  const isBun = typeof Bun !== 'undefined'

  if (isBun) {
    // In Bun, we need to bypass the normal initialization and use our own method
    try {
      // Bypass the normal initialization and use our own method
      const customModule = await initWasmManually()

      // Create a patched WasmClient class with our custom __wbindgen_malloc function
      const PatchedWasmClient = customModule.WasmClient

      // Add the missing malloc function
      global.__wbindgen_malloc = customModule.__wbindgen_malloc
      global.__wbindgen_realloc = customModule.__wbindgen_realloc

      // Return our patched WasmClient
      return PatchedWasmClient
    } catch (e) {
      console.error('Error initializing WASM module:', e)
    }
  }

  // For non-Bun environments, just return the WasmClient
  return wasmModule.WasmClient
}

// Manual initialization for WASM in Bun environment
async function initWasmManually() {
  try {
    // Use a direct approach with imported modules
    console.log('Manually initializing WASM modules')

    // Import the WASM binary directly
    const wasmBinary = await import('../.wasm/fedimint_client_wasm_bg.wasm')

    // Import the background JS module with the glue code
    const wasmBg = await import('../.wasm/fedimint_client_wasm_bg.js')

    // Connect the WASM module to the background JS
    wasmBg.__wbg_set_wasm(wasmBinary)

    // Import the main module that re-exports everything
    const wasmMain = await import('../.wasm/fedimint_client_wasm.js')

    console.log('WASM module manually initialized')

    // Create our patched module with the missing functions
    return {
      WasmClient: wasmMain.WasmClient,
      __wbindgen_malloc: function (size) {
        // A custom malloc implementation for Bun
        console.log('Custom malloc called with size:', size)
        return wasmBg.wasm.__wbindgen_malloc(size)
      },
      __wbindgen_realloc: function (ptr, oldSize, newSize) {
        console.log('Custom realloc called:', ptr, oldSize, newSize)
        return wasmBg.wasm.__wbindgen_realloc(ptr, oldSize, newSize)
      },
    }
  } catch (e) {
    console.error('Failed to manually initialize WASM:', e)
    throw e
  }
}
