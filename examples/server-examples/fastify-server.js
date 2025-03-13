import Fastify from 'fastify'
import { FedimintWallet, FedimintEnv } from '@fedimint/server'
import { LevelDBStorage } from '@fedimint/server/storage'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create Fastify server
const server = Fastify({
  logger: true,
})

// Create a LevelDB storage adapter
const storage = new LevelDBStorage(path.join(__dirname, 'fastify-data'))

// Initialize the wallet with Node.js environment and LevelDB storage
const wallet = new FedimintWallet({
  env: FedimintEnv.Node,
  storageAdapter: storage,
  logLevel: 'INFO',
})

// Register JSON body parser
server.register(import('@fastify/cors'))

// Health check route
server.get('/health', async () => {
  return { status: 'ok' }
})

// Get balance route
server.get('/api/balance', async (request, reply) => {
  try {
    const balance = await wallet.balance.getBalance()
    return { balance }
  } catch (error) {
    reply.code(500)
    return { error: error.message }
  }
})

// Create invoice route
server.post('/api/invoice', async (request, reply) => {
  try {
    const { amount, description } = request.body || {}

    if (!amount || isNaN(amount)) {
      reply.code(400)
      return { error: 'Invalid amount' }
    }

    const invoice = await wallet.lightning.createInvoice(
      parseInt(amount),
      description || 'Payment via Fedimint',
    )

    return { invoice }
  } catch (error) {
    reply.code(500)
    return { error: error.message }
  }
})

// Pay invoice route
server.post('/api/pay', async (request, reply) => {
  try {
    const { bolt11 } = request.body || {}

    if (!bolt11) {
      reply.code(400)
      return { error: 'Missing bolt11 invoice' }
    }

    const payment = await wallet.lightning.payInvoice(bolt11)
    return { payment }
  } catch (error) {
    reply.code(500)
    return { error: error.message }
  }
})

// Federation info route
server.get('/api/federation', async (request, reply) => {
  try {
    const federationId = await wallet.federation.getFederationId()
    const config = await wallet.federation.getConfig()

    return {
      federationId,
      config,
    }
  } catch (error) {
    reply.code(500)
    return { error: error.message }
  }
})

// Initialize wallet before starting server
async function initializeWallet() {
  await wallet.initialize()
  server.log.info('Wallet initialized')

  // Open or join a federation
  try {
    const isOpen = await wallet.open('fastify-server-client')
    server.log.info('Wallet open: ' + isOpen)

    if (!isOpen) {
      throw new Error('Failed to open wallet')
    }

    const fedId = await wallet.federation.getFederationId()
    server.log.info('Federation ID: ' + fedId)

    const balance = await wallet.balance.getBalance()
    server.log.info('Initial balance: ' + JSON.stringify(balance))
  } catch (error) {
    server.log.error('Error initializing wallet: ' + error.message)
    process.exit(1)
  }
}

// Graceful shutdown
async function closeGracefully(signal) {
  server.log.info(`Received signal to terminate: ${signal}`)

  try {
    // Close wallet
    await wallet.cleanup()
    server.log.info('Wallet cleaned up')

    // Close server
    await server.close()
    server.log.info('Fastify server closed')

    process.exit(0)
  } catch (error) {
    server.log.error('Error during cleanup:', error)
    process.exit(1)
  }
}

// Handle shutdown signals
process.on('SIGINT', () => closeGracefully('SIGINT'))
process.on('SIGTERM', () => closeGracefully('SIGTERM'))

// Start the server
const PORT = process.env.PORT || 3000

async function start() {
  try {
    await initializeWallet()
    await server.listen({ port: PORT, host: '0.0.0.0' })
  } catch (err) {
    server.log.error(err)
    process.exit(1)
  }
}

start()
