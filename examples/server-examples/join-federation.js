import { FedimintWallet } from '@fedimint/server'
import { LevelDBStorage } from '@fedimint/server/storage'
import { fileURLToPath } from 'url'
import fs from 'fs/promises'
import path from 'path'

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Ensure the data directory exists
const dataDir = path.join(__dirname, 'federation-data')

async function main() {
  // Get invite code from command line arguments
  const inviteCode = process.argv[2]
  if (!inviteCode) {
    console.error('Please provide an invite code as the first argument')
    process.exit(1)
  }

  try {
    // Create directory if it doesn't exist
    await fs.mkdir(dataDir, { recursive: true })

    // Create a LevelDB storage adapter
    const storage = new LevelDBStorage(dataDir)

    // Initialize the wallet with Node.js environment
    const wallet = new FedimintWallet({
      storageAdapter: storage,
      logLevel: 'debug',
    })

    // Initialize the wallet
    await wallet.initialize()
    console.log('Wallet initialized')

    // Join the federation
    console.log(`Joining federation with invite code: ${inviteCode}`)
    const clientName = 'fedimint-client-' + Date.now()
    const success = await wallet.joinFederation(inviteCode, clientName)

    if (success) {
      console.log(
        `Successfully joined federation with client name: ${clientName}`,
      )

      // Get federation information
      const fedId = await wallet.federation.getFederationId()
      console.log('Federation ID:', fedId)

      // Save the client name for future use
      const clientInfoPath = path.join(dataDir, 'client-info.json')
      await fs.writeFile(
        clientInfoPath,
        JSON.stringify(
          {
            clientName,
            federationId: fedId,
            joinedAt: new Date().toISOString(),
          },
          null,
          2,
        ),
      )
      console.log(`Client information saved to ${clientInfoPath}`)

      // Get federation config
      const config = await wallet.federation.getConfig()
      console.log('Federation config:', config)

      // Get current balance (will be 0 for a new client)
      const balance = await wallet.balance.getBalance()
      console.log('Initial balance:', balance)
    } else {
      console.error('Failed to join federation')
    }

    // Clean up
    await wallet.cleanup()
    console.log('Wallet cleaned up')
  } catch (error) {
    console.error('Error joining federation:', error)
  }
}

main().catch(console.error)
