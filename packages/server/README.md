# @fedimint/server

Fedimint SDK optimized for Node.js/Bun server environments.

## Installation

```bash
npm install @fedimint/server
# or
yarn add @fedimint/server
# or
pnpm add @fedimint/server
```

## Features

- Optimized for server-side JavaScript environments (Node.js and Bun)
- Pluggable storage adapters (LevelDB, File-based)
- Built-in environment detection
- Server-specific utilities and helpers
- Support for both ESM and CommonJS imports

## Example Usage

```javascript
// ESM
import { FedimintWallet, FedimintEnv } from '@fedimint/server'
import { LevelDBStorage } from '@fedimint/server/storage'

// CommonJS
const { FedimintWallet, FedimintEnv } = require('@fedimint/server')
const { LevelDBStorage } = require('@fedimint/server/storage')

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

// Use Lightning module
const invoice = await wallet.lightning.createInvoice(1000, 'Test payment')
console.log('Invoice:', invoice)
```

## Storage Adapters

### LevelDB Storage

```javascript
import { LevelDBStorage } from '@fedimint/server/storage'

const storage = new LevelDBStorage('./data', {
  createIfMissing: true,
})

const wallet = new FedimintWallet({
  storageAdapter: storage,
})
```

### File Storage

```javascript
import { FileStorage } from '@fedimint/server/storage'

const storage = new FileStorage('./data')

const wallet = new FedimintWallet({
  storageAdapter: storage,
})
```

### Custom Storage Adapters

You can implement your own storage adapter by implementing the `StorageAdapter` interface:

```typescript
import { StorageAdapter, Transaction } from '@fedimint/server/storage'

class MyCustomStorage implements StorageAdapter {
  // Implementation
}
```

## License

MIT
