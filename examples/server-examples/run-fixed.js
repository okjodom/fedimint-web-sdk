// Bootstrap script to run the file-storage.js example with fixes applied
// This script installs the patches and runs the example

// Import memory polyfills first
import './fix-memory.js'
// Set up the WASM files
import './fix-wasm.js'
// Directly patch the WASM JS glue code
import './direct-patch.js'
// Apply the Bun-specific WASM patch
import './bun-patch.js'

// Wait a moment for the patch to apply
console.log('Waiting for WASM patch to initialize...')
await new Promise((resolve) => setTimeout(resolve, 1000))

// Import the actual example script
import './file-storage.js'
