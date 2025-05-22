// Bun patch to make WASM work properly
// This adds the missing malloc and realloc functions to the global scope

// Check if we're running in Bun
if (typeof Bun !== 'undefined') {
  console.log('Applying Bun WASM patch')

  // Import the background WASM module to get malloc and realloc
  import('./.wasm/fedimint_client_wasm_bg.js')
    .then((wasmBg) => {
      // Import the WASM binary
      import('./.wasm/fedimint_client_wasm_bg.wasm')
        .then((wasmBinary) => {
          // Connect them
          wasmBg.__wbg_set_wasm(wasmBinary)

          // Add malloc and realloc to the global scope
          globalThis.malloc = function (size, align) {
            console.log('Global malloc called:', size, align)
            return wasmBg.wasm.__wbindgen_malloc(size)
          }

          globalThis.__wbindgen_malloc = function (size) {
            console.log('Global __wbindgen_malloc called:', size)
            return wasmBg.wasm.__wbindgen_malloc(size)
          }

          globalThis.__wbindgen_realloc = function (
            ptr,
            oldSize,
            newSize,
            align,
          ) {
            console.log(
              'Global __wbindgen_realloc called:',
              ptr,
              oldSize,
              newSize,
              align,
            )
            return wasmBg.wasm.__wbindgen_realloc(ptr, oldSize, newSize)
          }

          console.log('Bun WASM patch applied successfully')
        })
        .catch((e) => {
          console.error('Failed to load WASM binary:', e)
        })
    })
    .catch((e) => {
      console.error('Failed to load WASM background module:', e)
    })
}
