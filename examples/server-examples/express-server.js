import express from 'express'
import { FedimintWallet, FedimintEnv } from '@fedimint/server'
import { LevelDBStorage } from '@fedimint/server/storage'
import path from 'path'
import { fileURLToPath } from 'url'

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create a LevelDB storage adapter
const storage = new LevelDBStorage(path.join(__dirname, 'data-server'))

// Initialize the wallet with Node.js environment and LevelDB storage
const wallet = new FedimintWallet({
  env: FedimintEnv.Node,
  storageAdapter: storage,
  logLevel: 'INFO',
})

// Create Express app
const app = express()
app.use(express.json())

// Initialize wallet before starting server
async function initializeWallet() {
  await wallet.initialize()
  console.log('Wallet initialized')

  // Open or join a federation
  try {
    const isOpen = await wallet.open('my-server-client')
    console.log('Wallet open:', isOpen)

    if (!isOpen) {
      throw new Error('Failed to open wallet')
    }

    const fedId = await wallet.federation.getFederationId()
    console.log('Federation ID:', fedId)

    const balance = await wallet.balance.getBalance()
    console.log('Initial balance:', balance)
  } catch (error) {
    console.error('Error initializing wallet:', error)
    process.exit(1)
  }
}

// API routes
app.get('/api/balance', async (req, res) => {
  try {
    const balance = await wallet.balance.getBalance()
    res.json({ balance })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/invoice', async (req, res) => {
  try {
    const { amount, description } = req.body

    if (!amount || isNaN(amount)) {
      return res.status(400).json({ error: 'Invalid amount' })
    }

    const invoice = await wallet.lightning.createInvoice(
      parseInt(amount),
      description || 'Payment via Fedimint',
    )

    res.json({ invoice })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/pay', async (req, res) => {
  try {
    const { bolt11 } = req.body

    if (!bolt11) {
      return res.status(400).json({ error: 'Missing bolt11 invoice' })
    }

    const payment = await wallet.lightning.payInvoice(bolt11)
    res.json({ payment })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Graceful shutdown
function shutdown() {
  console.log('Shutting down...')
  wallet
    .cleanup()
    .then(() => {
      console.log('Wallet cleaned up')
      process.exit(0)
    })
    .catch((error) => {
      console.error('Error during cleanup:', error)
      process.exit(1)
    })
}

// Handle shutdown signals
process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)

// Start server
const PORT = process.env.PORT || 3000

initializeWallet()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`)
    })
  })
  .catch(console.error)
