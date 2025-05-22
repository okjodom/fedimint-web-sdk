import { FedimintWallet } from '@okjodom/fm-server'
import { FileStorage } from '@okjodom/fm-server/storage'
import { fileURLToPath } from 'url'
import path from 'path'

// Get the directory name in ESM
const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function main() {
  // Create a File-based storage adapter
  const storage = new FileStorage(
    path.join(__dirname, '.fm_storage/file_storage_example'),
  )

  // Initialize the wallet with Node.js environment and file storage
  const wallet = new FedimintWallet({
    storageAdapter: storage,
    logLevel: 'debug',
  })

  try {
    // Initialize the wallet
    await wallet.initialize()
    console.log('Wallet initialized with file storage')

    // Open the wallet
    const isOpen = await wallet.open('file-storage-client')
    console.log('Wallet open:', isOpen)

    if (isOpen) {
      // Get the balance
      const balance = await wallet.balance.getBalance()
      console.log('Balance:', balance)

      // Store some test data
      console.log('Testing file storage operations...')
      const transaction = storage.beginTransaction()

      // Store a test key-value pair
      const testKey = new TextEncoder().encode('test-key')
      const testValue = new TextEncoder().encode('test-value')

      await transaction.put(testKey, testValue)
      console.log('Added test data to transaction')

      // Verify it's in the transaction cache
      const cachedValue = await transaction.get(testKey)
      console.log(
        'Value in transaction:',
        new TextDecoder().decode(cachedValue),
      )

      // Commit transaction
      await transaction.commit()
      console.log('Transaction committed')

      // Verify it's now stored in the main storage
      const storedValue = await storage.get(testKey)
      console.log(
        'Value in main storage:',
        new TextDecoder().decode(storedValue),
      )

      // Cleanup
      await storage.delete(testKey)
      console.log('Test data cleaned up')
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
