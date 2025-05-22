# WebAssembly Module Error Investigation in Fedimint Server SDK

## Overview

This document explores why the Fedimint server-side SDK encounters issues when running in Node.js environments, specifically related to WebAssembly (WASM) module loading and browser API dependencies.

## Issue

When attempting to run the Fedimint server examples in a Node.js environment, we encounter errors related to:

1. WASM module loading failures:

   ```
   Unknown file extension ".wasm" for /path/to/fedimint_client_wasm_bg.wasm
   ```

2. IndexedDB access errors:
   ```
   Failed to open client: idb error
   ```

## Root Causes

### 1. WASM Client Architecture

The core Fedimint client functionality is built in Rust and compiled to WebAssembly (WASM), which is then used in JavaScript environments. This architecture allows for code sharing between browser and Node.js environments, but introduces compatibility challenges.

### 2. Browser-Centric Storage

The underlying Rust/WASM client uses IndexedDB as its storage mechanism for:

- Storing client configuration data
- Persisting federation connection details
- Managing client state across sessions

This dependency on browser APIs becomes problematic in Node.js environments where IndexedDB is not available natively.

### 3. Abstraction Layer Gap

While the JavaScript SDK provides storage abstractions like `LevelDBStorage` and `FileStorage` through the `StorageAdapter` interface, there's a fundamental disconnect. These adapters are available in the JavaScript layer, but the actual WASM client (compiled Rust code) appears to directly use IndexedDB internally.

Evidence of this is in `NodeClient.ts` where we see:

```typescript
// Dynamic import of the WASM module (works in Node.js and Bun)
const wasmModule = await import('@fedimint/fedimint-client-wasm-bundler')
this.wasmClient = wasmModule.WasmClient

// TODO: Integrate WASM client with our storage adapter
```

This TODO comment indicates the developers were aware of the need to properly connect the storage adapters to the WASM client but hadn't fully implemented it yet.

### 4. Missing Node.js Compatibility Layer

The WASM module appears to be primarily designed for browser environments without appropriate fallbacks for Node.js. The error occurs at client initialization when it tries to use IndexedDB, which isn't available in Node.js:

```typescript
if (type === 'open') {
  const { clientName } = (payload as any) || {}
  try {
    this.client = await this.wasmClient.open(clientName)
    return { success: !!this.client } as unknown as Response
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to open client: ${message}`)
  }
}
```

## Potential Solutions

### Short-term

1. **Use Bun Runtime**: Bun provides better browser API compatibility in Node.js-like environments, including support for IndexedDB.

   ```bash
   # Install Bun
   curl -fsSL https://bun.sh/install | bash

   # Run examples with Bun
   cd examples/server-examples
   bun run basic.js
   ```

2. **Advanced Polyfill**: Create a more sophisticated IndexedDB polyfill that matches the exact behavior expected by the WASM client. This is challenging because it needs to match the specific expectations of the Rust code.

### Long-term

1. **Modify Rust/WASM Client**: Update the Rust code to use a pluggable storage interface that can be connected to different backends (IndexedDB for browsers, LevelDB for Node.js).

2. **Dedicated Node.js Client**: Implement a Node.js-specific client that doesn't rely on WASM and browser APIs but uses the same protocols and interfaces.

3. **Wrapper Bridge**: Develop a compatibility layer that intercepts IndexedDB calls from the WASM module and redirects them to the appropriate storage adapter.

## Technical Details

### Storage Interface

The JavaScript SDK defines a storage adapter interface:

```typescript
export interface StorageAdapter {
  initialize(): Promise<void>
  get(key: Uint8Array): Promise<Uint8Array | null>
  put(key: Uint8Array, value: Uint8Array): Promise<void>
  delete(key: Uint8Array): Promise<void>
  beginTransaction(): Transaction
  close(): Promise<void>
}
```

This interface is implemented by `LevelDBStorage` and `FileStorage`, but there's no connection between these implementations and the WASM client's internal storage needs.

### WASM Module Loading

Node.js ESM doesn't natively support `.wasm` files without an experimental loader. This can be addressed with:

```bash
node --experimental-wasm-modules script.js
```

Or by creating a custom loader:

```javascript
// custom-loader.js
export async function resolve(specifier, context, nextResolve) {
  if (specifier.endsWith('.wasm')) {
    return {
      format: 'wasm',
      shortCircuit: true,
      url: new URL(specifier, context.parentURL).href,
    }
  }
  return nextResolve(specifier, context)
}

export async function load(url, context, nextLoad) {
  if (context.format === 'wasm') {
    const filePath = new URL(url)
    const source = await readFile(filePath)
    return {
      format: 'wasm',
      shortCircuit: true,
      source,
    }
  }
  return nextLoad(url, context)
}
```

## Conclusion

The Fedimint server SDK's dependency on browser APIs like IndexedDB is due to its architecture using a shared WASM module compiled from Rust. To make it work reliably in Node.js environments, either the Rust code needs modification to support pluggable storage, or a complete browser API compatibility layer needs to be implemented.

For now, using Bun as the runtime environment is the most practical workaround, as it provides the necessary browser APIs that the WASM client expects.
