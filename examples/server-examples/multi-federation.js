import { FedimintWallet } from '@fedimint/server'
import { LevelDBStorage } from '@fedimint/server/storage'
import { fileURLToPath } from 'url'
import path from 'path'

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Manage multiple federation clients
class MultiFederationManager {
  constructor(baseDataDir) {
    this.baseDataDir = baseDataDir
    this.clients = new Map()
  }

  async createClient(clientName) {
    if (this.clients.has(clientName)) {
      throw new Error(`Client ${clientName} already exists`)
    }

    const clientDataDir = path.join(this.baseDataDir, clientName)
    const storage = new LevelDBStorage(clientDataDir)

    const wallet = new FedimintWallet({
      storageAdapter: storage,
      logLevel: 'info',
    })

    // Initialize the wallet
    await wallet.initialize()

    // Store the client
    this.clients.set(clientName, { wallet, storage })

    return wallet
  }

  async openClient(clientName) {
    if (!this.clients.has(clientName)) {
      throw new Error(`Client ${clientName} does not exist`)
    }

    const { wallet } = this.clients.get(clientName)
    await wallet.open(clientName)
    return wallet
  }

  async closeClient(clientName) {
    if (!this.clients.has(clientName)) {
      return
    }

    const { wallet } = this.clients.get(clientName)
    await wallet.cleanup()
    this.clients.delete(clientName)
  }

  async closeAll() {
    const clientNames = Array.from(this.clients.keys())
    for (const clientName of clientNames) {
      await this.closeClient(clientName)
    }
  }
}

async function main() {
  // Create a federation manager for handling multiple clients
  const federationManager = new MultiFederationManager(
    path.join(__dirname, 'multi-federation-data'),
  )

  try {
    // Create and open client 1
    console.log('Creating client 1...')
    const client1 = await federationManager.createClient('federation-client-1')
    let isOpen = await client1.open('federation-client-1')
    console.log('Client 1 open:', isOpen)

    if (isOpen) {
      const balance1 = await client1.balance.getBalance()
      console.log('Client 1 balance:', balance1)

      // Get federation ID
      try {
        const fedId = await client1.federation.getFederationId()
        console.log('Client 1 federation ID:', fedId)
      } catch (error) {
        console.log('Client 1 not connected to a federation yet')
      }
    }

    // Create and open client 2
    console.log('\nCreating client 2...')
    const client2 = await federationManager.createClient('federation-client-2')
    isOpen = await client2.open('federation-client-2')
    console.log('Client 2 open:', isOpen)

    if (isOpen) {
      const balance2 = await client2.balance.getBalance()
      console.log('Client 2 balance:', balance2)

      // Get federation ID
      try {
        const fedId = await client2.federation.getFederationId()
        console.log('Client 2 federation ID:', fedId)
      } catch (error) {
        console.log('Client 2 not connected to a federation yet')
      }
    }

    // Close specific client
    console.log('\nClosing client 1...')
    await federationManager.closeClient('federation-client-1')
    console.log('Client 1 closed')

    // Close all remaining clients
    console.log('Closing all remaining clients...')
    await federationManager.closeAll()
    console.log('All clients closed')
  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)
