# Fedimint Server SDK Implementation

This document describes the implementation of the Fedimint SDK for Node.js/Bun server environments.

## Architecture

The architecture of the Server SDK builds on the existing Fedimint Web SDK, with several enhancements for server environments:

1. **Storage Adapters**: Pluggable storage backends for Node.js environments

   - Interface-based design for easy extension
   - LevelDB implementation for production use
   - File-based implementation for simple use cases

2. **Environment Detection**: Enhanced runtime environment detection

   - Automatic detection of Browser, Node.js, and Bun environments
   - Environment-specific optimizations

3. **Server-Specific Package**: Dedicated package for server environments
   - Optimized for Node.js/Bun
   - Built-in server-friendly storage adapters
   - Server-specific examples and documentation

## Storage Adapter Interface

The storage adapter interface provides a common API for different storage backends:

```typescript
export interface Transaction {
  get(key: Uint8Array): Promise<Uint8Array | null>
  put(key: Uint8Array, value: Uint8Array): Promise<void>
  delete(key: Uint8Array): Promise<void>
  commit(): Promise<void>
  abort(): Promise<void>
}

export interface StorageAdapter {
  initialize(): Promise<void>
  get(key: Uint8Array): Promise<Uint8Array | null>
  put(key: Uint8Array, value: Uint8Array): Promise<void>
  delete(key: Uint8Array): Promise<void>
  beginTransaction(): Transaction
  close(): Promise<void>
}
```

## Implementations

### LevelDB Storage

The LevelDB storage adapter uses the `classic-level` package to provide a high-performance, transactional storage backend:

- ACID transaction support
- Efficient key-value storage
- Optimized for Node.js environments

### File Storage

The file storage adapter provides a simple file-based storage backend:

- Uses the filesystem directly
- Each key-value pair is stored in a separate file
- Transaction support through in-memory operations and atomic commits

## Enhanced Environment Detection

The SDK automatically detects the JavaScript runtime environment:

```typescript
export enum FedimintEnv {
  Browser,
  Node,
  Bun,
}
```

Detection logic:

```typescript
private detectEnvironment(): FedimintEnv {
  if (typeof window !== 'undefined') {
    return FedimintEnv.Browser;
  }

  if (typeof process !== 'undefined' && process.versions && process.versions.node) {
    return FedimintEnv.Node;
  }

  if (typeof Bun !== 'undefined') {
    return FedimintEnv.Bun;
  }

  return FedimintEnv.Node;
}
```

## Enhanced FedimintWallet

The enhanced `FedimintWallet` class provides a unified API for both browser and server environments:

```typescript
constructor(options: {
  env?: FedimintEnv;           // Auto-detect if not provided
  storageAdapter?: StorageAdapter; // Use default for environment if not provided
  lazy?: boolean;              // Default: false
  logLevel?: LogLevel;         // Default: 'INFO'
  clientName?: string;         // Default: 'fm-default'
  maxConcurrency?: number;     // Default: undefined (unlimited)
} = {})
```

## Module Structure

```
@fedimint/server
├── src
│   ├── FedimintWallet.ts     # Enhanced wallet implementation
│   ├── NodeClient.ts         # Node.js client implementation
│   ├── index.ts              # Main exports
│   └── storage
│       ├── StorageAdapter.ts # Storage adapter interface
│       ├── LevelDBStorage.ts # LevelDB implementation
│       ├── FileStorage.ts    # File-based implementation
│       └── index.ts          # Storage exports
├── examples
│   ├── basic.js              # ESM example
│   ├── basic.cjs             # CommonJS example
│   └── express-server.js     # Express server example
└── tests
    ├── FedimintWallet.test.ts
    └── storage
        └── LevelDBStorage.test.ts
```

## Build Configuration

The package is built using Rollup with the following configurations:

- ESM and CommonJS output formats
- TypeScript support
- Tree-shaking and minification
- Separate exports for main package and storage module
- Complete TypeScript type definitions

## Examples

The package includes several examples:

1. **Basic ESM Example**: Simple example using ESM imports
2. **Basic CommonJS Example**: Simple example using CommonJS requires
3. **Express Server Example**: Lightning payment server using Express

## Usage

```javascript
// ESM
import { FedimintWallet, FedimintEnv } from '@fedimint/server'
import { LevelDBStorage } from '@fedimint/server/storage'

// Initialize with Node.js optimized settings
const wallet = new FedimintWallet({
  env: FedimintEnv.Node,
  storageAdapter: new LevelDBStorage('./data'),
  logLevel: 'INFO',
})

// Use the API the same way as in browser
await wallet.initialize()
await wallet.open('my-fedimint-client')

// Make module calls
const balance = await wallet.balance.getBalance()
console.log('Balance:', balance)
```
