# Findings on Bun WASM Compatibility

## Issue Summary

When running the Fedimint server examples with Bun, we encountered a `malloc is not a function` error. This occurs because:

1. The WASM modules in the `@fedimint/fedimint-client-wasm-bundler` package expect certain JavaScript functions to be available in the global scope
2. The initialization process in Bun differs from Node.js, causing these functions to be unavailable when needed
3. Specifically, `malloc` and related memory management functions are missing

## Solutions Attempted

We tried several approaches to fix this issue:

### 1. Custom Initialization Process

Created a custom initialization wrapper that imports and initializes the WASM modules in a controlled way. This was partially successful but still had issues.

### 2. Global Function Polyfills

Added polyfills for the missing functions to the global scope. This showed promise but didn't fully resolve the issue.

### 3. Direct WASM Module Patching

Patched the WASM JavaScript glue code to use a local function instead of relying on global ones. This approach had the most success.

### 4. Bun-specific Fixes

Attempted some Bun-specific approaches, like adjusting how the WASM modules are loaded and initialized.

## Key Observations

1. The issue is related to how WASM modules are initialized in Bun vs Node.js
2. The core problem is that memory-related functions (`malloc`, `__wbindgen_malloc`, etc.) are not properly set up
3. In browser environments, these functions work differently than in Node.js/Bun
4. The Fedimint WASM modules are primarily designed for browser use

## Current Status

We've made significant progress with our combined approach:

1. Copy the WASM files locally (`fix-wasm.js`)
2. Patch the JavaScript glue code (`direct-patch.js`)
3. Apply memory polyfills (`fix-memory.js`)
4. Customize the initialization process (`patches/wasm-init.js`)

However, we're still encountering the `malloc is not a function` error when trying to open a client.

## Recommendations

1. **Use Node.js for Server-Side Code**: The most reliable solution is to use Node.js rather than Bun for server-side Fedimint code until Bun's WASM support matures.

2. **Modify the Source Package**: A proper fix would require modifying the `@fedimint/fedimint-client-wasm-bundler` package to better support Bun's WASM implementation.

3. **Create a Bun-Specific Fork**: Consider creating a Bun-specific version of the package that addresses these compatibility issues.

## Next Steps

If further work is needed:

1. Further investigate how the WASM initialization works in the browser examples
2. Study Bun's WASM implementation to better understand the differences
3. Consider building a custom WASM bridge specifically for Bun
4. Explore alternative implementations that don't rely on the WASM module

## Conclusion

The `malloc is not a function` error in Bun is a complex issue related to WASM initialization and memory management. While our patches make progress, a complete solution might require deeper changes to the underlying packages or using Node.js instead of Bun for server-side Fedimint applications.
