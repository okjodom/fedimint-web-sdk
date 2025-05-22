// A custom FedimintWallet implementation that uses our patched NodeClient
import { SubscriptionManager } from '@okjodom/fm-server'
import { NodeClient } from './NodeClient.js'
import {
  BalanceService,
  FederationService,
  LightningService,
  MintService,
} from '@okjodom/fm-server/services'
import { logger } from './utils.js'

/**
 * Main wallet class for fedimint-server usage
 */
export class CustomFedimintWallet {
  // Services
  balance
  federation
  lightning
  mint

  // Internal state
  subman
  client
  storageAdapter
  logLevel

  /**
   * Create a new FedimintWallet
   * @param options Wallet options
   */
  constructor(options = {}) {
    logger.info('Initializing FedimintWallet')

    // Initialize subscription manager for RPC callbacks
    this.subman = new SubscriptionManager()

    // Set up client
    this.client = new NodeClient(this.subman, options)

    // Store optional storage adapter
    this.storageAdapter = options.storageAdapter || null

    // Configure logging
    this.logLevel = options.logLevel || 'info'

    // Initialize services
    this.balance = new BalanceService(this.client)
    this.federation = new FederationService(this.client)
    this.lightning = new LightningService(this.client)
    this.mint = new MintService(this.client)
  }

  /**
   * Initialize the wallet (load WASM module)
   */
  async initialize() {
    return this.client.sendSingleMessage('init')
  }

  /**
   * Open an existing federation client
   * @param clientName The name of the client
   */
  async open(clientName) {
    const result = await this.client.sendSingleMessage('open', { clientName })
    return result.success
  }

  /**
   * Join a new federation
   * @param inviteCode The federation invite code
   * @param clientName Optional client name (defaults to random)
   */
  async joinFederation(inviteCode, clientName = `client-${Date.now()}`) {
    const result = await this.client.sendSingleMessage('join', {
      inviteCode,
      clientName,
    })
    return result.success
  }

  /**
   * Cleanup all wallet resources
   */
  async cleanup() {
    return this.client.sendSingleMessage('cleanup')
  }

  /**
   * Parse a federation invite code
   * @param inviteCode The federation invite code
   */
  parseInviteCode(inviteCode) {
    // TODO: Implement parsing
    return {
      federationId: '',
      apiEndpoint: '',
    }
  }

  /**
   * Parse a BOLT11 invoice
   * @param invoice The BOLT11 invoice string
   */
  parseBolt11Invoice(invoice) {
    // TODO: Implement parsing
    return {
      amount: 0,
      description: '',
      paymentHash: '',
      timestamp: 0,
      expiry: 0,
    }
  }

  /**
   * Set log level
   * @param level The log level to set
   */
  setLogLevel(level) {
    this.logLevel = level
  }

  /**
   * Check if the wallet is open
   */
  isOpen() {
    return !!this.client.client
  }
}
