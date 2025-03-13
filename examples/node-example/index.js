import { createWallet, isNode, isBun } from '@fedimint/core-web'

async function main() {
  console.log(
    `Running in ${isNode() ? 'Node.js' : isBun() ? 'Bun' : 'browser'} environment`,
  )

  // Create wallet instance appropriate for the environment
  // In Node.js/Bun, this will create a FedimintWallet
  // In browser, this would create a FedimintWallet
  const wallet = createWallet()

  try {
    // For an existing federation
    const inviteCode = process.env.INVITE_CODE
    if (!inviteCode) {
      console.error('Please provide an INVITE_CODE environment variable')
      process.exit(1)
    }

    // Join the federation
    console.log('Joining federation...')
    const joined = await wallet.joinFederation(inviteCode)
    if (!joined) {
      console.error('Failed to join federation')
      process.exit(1)
    }

    console.log('Successfully joined federation')

    // Get the federation ID
    const fedId = await wallet.federation.getFederationId()
    console.log('Federation ID:', fedId)

    // Get the wallet balance
    const balance = await wallet.balance.getBalance()
    console.log('Wallet balance:', balance)

    // Subscribe to balance changes
    const unsubscribe = wallet.balance.subscribeBalance((newBalance) => {
      console.log('Balance updated:', newBalance)
    })

    // Later, unsubscribe from balance changes
    // unsubscribe()

    // Keep the process running
    console.log('Wallet is ready. Press Ctrl+C to exit.')
  } catch (error) {
    console.error('Error:', error)
  }
}

main().catch(console.error)
