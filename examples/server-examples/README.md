# @fedimint/server Examples

This directory contains examples for using the Fedimint Server SDK in different Node.js/Bun server environments.

## Running with Bun

When running these examples with Bun, you might encounter the following error:

```
Failed to open client: malloc is not a function. (In 'malloc(buf.length, 1)', 'malloc' is undefined)
```

This happens because the WASM initialization process is different in Bun compared to Node.js.

### Solution

We've created a set of patched files that fix this issue. To run the examples in Bun:

1. First, set up the WASM files locally:

```bash
bun run fix-wasm.js
```

2. Then run the example through our fixed bootstrap script:

```bash
bun run run-fixed.js
```

### How it works

The fix addresses several issues:

1. **WASM Initialization**: The patch properly initializes the WASM module before using it, ensuring that `malloc` and other WASM functions are available.

2. **Custom Wallet Implementation**: We created a custom wallet implementation that uses our patched NodeClient.

3. **Memory Polyfills**: For some Bun environments, we added memory-related polyfills.

## Basic Examples

### ESM (ES Modules)

The `basic.js` example demonstrates basic usage with ES Modules:

```bash
# Install dependencies
npm install @fedimint/server

# Run the example
node basic.js
```

### CommonJS

The `basic.cjs` example demonstrates basic usage with CommonJS:

```bash
# Install dependencies
npm install @fedimint/server

# Run the example
node basic.cjs
```

## Storage Examples

### LevelDB Storage

The basic examples use LevelDB storage by default. This is recommended for production use as it provides ACID transaction support and efficient key-value storage.

### File Storage

The `file-storage.js` example demonstrates using file-based storage:

```bash
# Run the example
node file-storage.js
```

File storage is simpler but less efficient for high-throughput applications.

## Federation Management

### Joining a Federation

The `join-federation.js` example demonstrates joining a federation:

```bash
# Run the example with an invite code
node join-federation.js "fm-YOUR_INVITE_CODE_HERE"
```

### Multi-Federation Support

The `multi-federation.js` example demonstrates managing multiple federation clients:

```bash
# Run the example
node multi-federation.js
```

## Server Examples

### Express Server

The `express-server.js` example demonstrates building a Lightning payment server with Express:

```bash
# Install dependencies
npm install express @fedimint/server

# Run the example
node express-server.js
```

This creates a server with the following endpoints:

- `GET /api/balance` - Get the current balance
- `POST /api/invoice` - Create a lightning invoice
- `POST /api/pay` - Pay a lightning invoice

### Fastify Server

The `fastify-server.js` example demonstrates building a Lightning payment server with Fastify:

```bash
# Install dependencies
npm install fastify @fastify/cors @fedimint/server

# Run the example
node fastify-server.js
```

This creates a server with the following endpoints:

- `GET /health` - Health check endpoint
- `GET /api/balance` - Get the current balance
- `POST /api/invoice` - Create a lightning invoice
- `POST /api/pay` - Pay a lightning invoice
- `GET /api/federation` - Get federation information

## Additional Information

For more details on the Fedimint Server SDK, see the main README file in the parent directory.
