# Enhanced Fedimint Client WASM Bundler

This package is an enhanced version of `@fedimint/fedimint-client-wasm-bundler` with improved support for Bun, Node.js, and browser environments.

## Features

- **Environment Detection** - Automatically detects and adapts to Bun, Node.js, or browser environments
- **Memory Management Polyfills** - Ensures memory management functions are available across all environments
- **Robust Initialization** - Environment-specific initialization with proper error handling
- **Direct Memory Functions Export** - Exposes WASM memory functions for direct use
- **Backward Compatibility** - Works with existing code that uses the original package

## Installation

```bash
npm install @fedimint/fedimint-client-wasm-bundler-enhanced
```

Or with Bun:

```bash
bun add @fedimint/fedimint-client-wasm-bundler-enhanced
```

## Usage

### Basic Usage

```javascript
import {
  WasmClient,
  initWasm,
} from '@fedimint/fedimint-client-wasm-bundler-enhanced'

// Initialize the WASM module
await initWasm('./path/to/fedimint_client_wasm_bg.wasm')

// Use the client
const client = await WasmClient.open('my-client')
```

### Environment-Specific Initialization

```javascript
import {
  initWasmBun,
  initWasmNode,
  getEnvironment,
  WasmClient,
} from '@fedimint/fedimint-client-wasm-bundler-enhanced'

// Check environment
const env = getEnvironment()
console.log(`Running in ${env} environment`)

// Initialize based on environment
if (env === 'bun') {
  await initWasmBun('./path/to/fedimint_client_wasm_bg.wasm')
} else {
  await initWasmNode('./path/to/fedimint_client_wasm_bg.wasm')
}

// Use the client
const client = await WasmClient.open('my-client')
```

### Direct Memory Functions Access

```javascript
import {
  wasm,
  setupMemoryFunctions,
} from '@fedimint/fedimint-client-wasm-bundler-enhanced'

// Access memory functions directly
const ptr = wasm.__wbindgen_malloc(1024)

// Or setup memory functions globally
setupMemoryFunctions(wasm)
```

## API Reference

### Initialization

- `initWasm(wasmPath)` - Auto-detect environment and initialize WASM
- `initWasmBun(wasmPath)` - Initialize WASM specifically for Bun
- `initWasmNode(wasmPath)` - Initialize WASM specifically for Node.js
- `initWasmBrowser(wasmPath)` - Initialize WASM specifically for browsers

### Environment Detection

- `getEnvironment()` - Returns 'bun', 'node', 'browser', or 'unknown'
- `isBunEnvironment()` - Returns true if running in Bun
- `isNodeEnvironment()` - Returns true if running in Node.js
- `isBrowserEnvironment()` - Returns true if running in a browser
- `supportsWebAssembly()` - Returns true if WebAssembly is supported

### Memory Management

- `setupMemoryFunctions(wasmInstance)` - Sets up memory functions for WASM
- `createPatchedStringToWasm(wasmInstance)` - Creates a patched string passing function
- `exportMemoryFunctions(wasmInstance)` - Exports memory functions for direct access

### Core Functionality

- `WasmClient` - Main client class for interacting with Fedimint
- `RpcHandle` - Handle for RPC operations
- `wasm` - Direct access to WASM memory functions

## License

MIT
