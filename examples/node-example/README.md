# Fedimint Node.js Example

This example demonstrates how to use the Fedimint SDK in a Node.js or Bun environment.

## Getting Started

1. Install dependencies:

```bash
npm install
# or
bun install
```

2. Set the invite code environment variable:

```bash
export INVITE_CODE="your_federation_invite_code_here"
```

3. Run the example:

```bash
npm start
# or
bun start
```

## Notes for Server-Side Usage

The FedimintWallet class provides a server-side compatible version of the Fedimint wallet:

- It directly loads the WASM module without using Web Workers
- It has the same API as the browser-based FedimintWallet
- It's compatible with both Node.js and Bun

## Example Server Integrations

### Express Integration

```javascript
import express from 'express'
import { FedimintWallet } from '@fedimint/core-web'

const app = express()
const wallet = new FedimintWallet()

// Initialize wallet on server startup
async function initWallet() {
  await wallet.joinFederation(process.env.INVITE_CODE)
  console.log('Wallet initialized')
}

// Create API endpoints
app.get('/balance', async (req, res) => {
  const balance = await wallet.balance.getBalance()
  res.json({ balance })
})

app.post('/invoice', async (req, res) => {
  const { amount, description } = req.body
  const invoice = await wallet.lightning.createInvoice(amount, description)
  res.json({ invoice })
})

// Start server
const PORT = process.env.PORT || 3000
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  initWallet()
})
```

### NestJS Integration

Check the `nestjs-example.ts` file for a complete NestJS integration example. It includes:

- A `FedimintService` that manages the wallet lifecycle
- A `FedimintController` that exposes API endpoints
- A `FedimintModule` that can be imported into your application

To use with NestJS:

1. Install NestJS dependencies:

```bash
npm install @nestjs/common @nestjs/core reflect-metadata
```

2. Set the environment variable:

```bash
export FEDIMINT_INVITE_CODE="your_federation_invite_code_here"
```

3. Run the NestJS example:

```bash
# With ts-node
npx ts-node nestjs-example.ts

# Or with NestJS CLI
nest start
```
