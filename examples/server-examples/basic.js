import { FedimintWallet } from '@okjodom/fm-server'
import { LevelDBStorage } from '@okjodom/fm-server/storage'
import { fileURLToPath } from 'url'
import path from 'path'

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  // Create a LevelDB storage adapter
  const storage = new LevelDBStorage(
    path.join(__dirname, '.fm_storage/basic_js_example'),
  )

  // Initialize the wallet with Node.js environment and LevelDB storage
  const wallet = new FedimintWallet({
    storageAdapter: storage,
    logLevel: 'debug',
  })

  try {
    // Initialize the wallet
    await wallet.initialize()
    console.log('Wallet initialized')

    // Check if the wallet has an existing client
    // If not, you would need to join a federation
    // await wallet.joinFederation('your-invite-code', 'client-name')

    // Open the wallet
    const isOpen = await wallet.open('my-client')
    console.log('Wallet open:', isOpen)

    if (isOpen) {
      // Get the balance
      const balance = await wallet.balance.getBalance()
      console.log('Balance:', balance)

      // Get federation information
      const fedId = await wallet.federation.getFederationId()
      console.log('Federation ID:', fedId)

      // Generate a new invite code (if supported by the federation)
      try {
        const inviteCode = await wallet.federation.getInviteCode()
        console.log('New invite code:', inviteCode)
      } catch (e) {
        console.log('Could not generate invite code:', e.message)
      }
    }
  } catch (error) {
    console.error('Error:', error)
  } finally {
    // Clean up resources
    await wallet.cleanup()
    console.log('Wallet cleaned up')
  }
}

main().catch(console.error)
