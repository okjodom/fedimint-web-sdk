// Polyfill for SharedArrayBuffer
// This script is used to fix memory-related issues in Bun with WASM

// Create a custom SharedArrayBuffer implementation
class CustomSharedArrayBuffer extends ArrayBuffer {
  constructor(length) {
    super(length)
    console.log('Creating CustomSharedArrayBuffer of length', length)
  }
}

// Apply the polyfill if SharedArrayBuffer is not available
if (typeof SharedArrayBuffer === 'undefined') {
  console.log('Polyfilling SharedArrayBuffer with CustomSharedArrayBuffer')
  globalThis.SharedArrayBuffer = CustomSharedArrayBuffer
}

// Export for use in other modules
export { CustomSharedArrayBuffer }
