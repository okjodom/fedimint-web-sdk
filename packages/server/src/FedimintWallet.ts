import { logger, type LogLevel } from '@fedimint/core-web'
import { ServerClientInterface } from './types'
import { SubscriptionManager } from './utils'
import { StorageAdapter } from './storage'
import { createClient } from './client'
import {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
} from './services'

const DEFAULT_CLIENT_NAME = 'fm-default' as const

/**
 * Fedimint Wallet optimized for Node.js/Bun server environments.
 */
export class FedimintWallet {
  private _subman: SubscriptionManager
  private _client!: ServerClientInterface
  private _clientInitPromise!: Promise<ServerClientInterface>

  public balance!: BalanceService
  public mint!: MintService
  public lightning!: LightningService
  public federation!: FederationService
  public recovery!: RecoveryService

  private _openPromise: Promise<void> | undefined = undefined
  private _resolveOpen: () => void = () => {}
  private _isOpen: boolean = false

  /**
   * Creates a new instance of FedimintWallet.
   *
   * @param options Configuration options
   */
  constructor(
    options: {
      storageAdapter?: StorageAdapter // Storage adapter for persistence
      lazy?: boolean // Default: false
      logLevel?: LogLevel // Default: 'INFO'
      clientName?: string // Default: 'fm-default'
      maxConcurrency?: number // Default: undefined (unlimited)
    } = {},
  ) {
    this._openPromise = new Promise((resolve) => {
      this._resolveOpen = resolve
    })

    // Set log level if provided
    if (options.logLevel) {
      logger.setLevel(options.logLevel)
    }

    this._subman = new SubscriptionManager()

    // Browser check - just to prevent misuse
    if (typeof window !== 'undefined') {
      throw new Error(
        'Browser environment not supported in @fedimint/server package. Use @fedimint/core-web instead.',
      )
    }

    // Create client initialization promise - will be fulfilled in initialize()
    this._clientInitPromise = createClient(this._subman, {
      storageAdapter: options.storageAdapter,
      maxConcurrency: options.maxConcurrency,
    })

    if (!options.lazy) {
      // Start initialization but don't wait for it since constructor is synchronous
      this.initialize().catch((e) => {
        logger.error('Failed to initialize FedimintWallet', e)
      })
    }
  }

  /**
   * Initialize the wallet client.
   * This method is idempotent and can be called multiple times.
   */
  async initialize() {
    logger.info('Initializing FedimintWallet')

    // Resolve the client
    if (!this._client) {
      try {
        this._client = await this._clientInitPromise

        // Initialize the client
        await this._client.initialize()

        // Initialize services with the resolved client
        this.mint = new MintService(this._client)
        this.lightning = new LightningService(this._client)
        this.balance = new BalanceService(this._client)
        this.federation = new FederationService(this._client)
        this.recovery = new RecoveryService(this._client)
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to initialize client: ${message}`)
      }
    } else {
      // If the client is already initialized, ensure it's properly initialized
      await this._client.initialize()
    }

    logger.info('FedimintWallet initialized')
  }

  /**
   * Wait for the wallet to be opened.
   * @returns A promise that resolves when the wallet is open
   */
  async waitForOpen() {
    if (this._isOpen) return Promise.resolve()
    return this._openPromise
  }

  /**
   * Open an existing client.
   * @param clientName Name of the client to open
   * @returns Success status
   */
  async open(clientName: string = DEFAULT_CLIENT_NAME) {
    await this.initialize()

    if (this._isOpen) throw new Error('The FedimintWallet is already open.')

    const { success } = await this._client.sendSingleMessage<{
      success: boolean
    }>('open', { clientName })

    if (success) {
      this._isOpen = true
      this._resolveOpen()
    }

    return success
  }

  /**
   * Join a federation.
   * @param inviteCode Federation invite code
   * @param clientName Name to use for the client
   * @returns Success status
   */
  async joinFederation(
    inviteCode: string,
    clientName: string = DEFAULT_CLIENT_NAME,
  ) {
    await this.initialize()

    if (this._isOpen) {
      throw new Error(
        'The FedimintWallet is already open. You can only call `joinFederation` on closed clients.',
      )
    }

    try {
      const response = await this._client.sendSingleMessage<{
        success: boolean
      }>('join', { inviteCode, clientName })

      if (response.success) {
        this._isOpen = true
        this._resolveOpen()
      }

      return response.success
    } catch (e) {
      logger.error('Error joining federation', e)
      return false
    }
  }

  /**
   * Clean up resources.
   * This should ONLY be called when UNLOADING the wallet client.
   * After this call, the FedimintWallet instance should be discarded.
   */
  async cleanup() {
    this._openPromise = undefined
    this._isOpen = false
    await this._client.cleanup()
  }

  /**
   * Check if the wallet is open.
   * @returns True if the wallet is open
   */
  isOpen() {
    return this._isOpen
  }

  /**
   * Sets the log level for the library.
   * @param level The desired log level ('DEBUG', 'INFO', 'WARN', 'ERROR', 'NONE').
   */
  setLogLevel(level: LogLevel) {
    logger.setLevel(level)
    logger.info(`Log level set to ${level}.`)
  }
}
