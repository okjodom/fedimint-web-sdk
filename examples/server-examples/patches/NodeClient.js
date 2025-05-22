// Modified NodeClient to work with Bun
// This fixes the "malloc is not a function" error

import { logger } from './utils.js'
import { initializeWasm } from './wasm-init.js'

/**
 * Enhanced NodeClient for server environments with pluggable storage.
 */
export class NodeClient {
  subman
  options
  initPromise = undefined
  wasmClient = null
  client = null
  rpcHandles = new Map()
  storageAdapter = null

  /**
   * Create a new NodeClient instance.
   * @param subman Subscription manager for handling RPC callbacks
   * @param options Client options
   */
  constructor(subman, options = {}) {
    this.subman = subman
    this.options = options
    logger.info('NodeClient instantiated')
    this.storageAdapter = options.storageAdapter || null
  }

  /**
   * Idempotent setup - Loads the WASM module and initializes storage.
   */
  async initialize() {
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise(async (resolve) => {
      try {
        // Initialize storage if provided
        if (this.storageAdapter) {
          await this.storageAdapter.initialize()
        }

        // Dynamic import of the WASM module (works in Node.js and Bun)
        try {
          // Use our local copy of the WASM module
          const wasmModule = await import('../.wasm/fedimint_client_wasm.js')

          // Initialize the WASM module
          this.wasmClient = await initializeWasm(wasmModule)
        } catch (e) {
          logger.error('Failed to import WASM module', e)
          throw e
        }

        resolve(true)
      } catch (error) {
        logger.error('Failed to initialize WASM module', error)
        resolve(false)
      }
    })

    return this.initPromise
  }

  async sendSingleMessage(type, payload) {
    const requestId = this.subman.getNextRequestId()
    logger.debug('NodeClient - sendSingleMessage', requestId, type, payload)

    if (type === 'init') {
      await this.initialize()
      return { success: true }
    }

    if (type === 'open') {
      const { clientName } = payload || {}
      try {
        this.client = await this.wasmClient.open(clientName)
        return { success: !!this.client }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to open client: ${message}`)
      }
    }

    if (type === 'join') {
      const { inviteCode, clientName } = payload || {}
      try {
        this.client = await this.wasmClient.join_federation(
          clientName,
          inviteCode,
        )
        return { success: !!this.client }
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to join federation: ${message}`)
      }
    }

    if (type === 'cleanup') {
      // Clean up all RPC handles
      for (const handle of this.rpcHandles.values()) {
        try {
          handle.cancel()
          handle.free()
        } catch (error) {
          logger.warn('Error cleaning up RPC handle', error)
        }
      }
      this.rpcHandles.clear()

      // Free the client
      try {
        this.client?.free()
      } catch (error) {
        logger.warn('Error freeing client', error)
      }

      // Close storage adapter if provided
      if (this.storageAdapter) {
        try {
          await this.storageAdapter.close()
        } catch (error) {
          logger.warn('Error closing storage adapter', error)
        }
      }

      this.client = null
      this.initPromise = undefined
      this.subman.clear()
      return { success: true }
    }

    throw new Error(`Unknown message type: ${type}`)
  }

  rpcStream(module, method, body, onSuccess, onError, onEnd = () => {}) {
    const requestId = this.subman.getNextRequestId()
    logger.debug('NodeClient - rpcStream', requestId, module, method, body)

    if (!this.client) {
      onError('WasmClient not initialized')
      return () => {}
    }

    let rpcHandle = null
    try {
      // Call the RPC method on the WASM client
      rpcHandle = this.client.rpc(
        module,
        method,
        JSON.stringify(body),
        (res) => {
          try {
            const data = JSON.parse(res)
            if (data.error !== undefined) {
              const streamError = {
                error: data.error,
                data: undefined,
                end: undefined,
              }
              this.subman.handleResponse(requestId, streamError)
            } else if (data.data !== undefined) {
              const streamSuccess = {
                data: data.data,
                error: undefined,
                end: undefined,
              }
              this.subman.handleResponse(requestId, streamSuccess)
            } else if (data.end !== undefined) {
              const streamEnd = {
                end: data.end || '',
                data: undefined,
                error: undefined,
              }
              this.subman.handleResponse(requestId, streamEnd)
              this.rpcHandles.delete(requestId)
              rpcHandle?.free()
            }
          } catch (error) {
            const message =
              error instanceof Error ? error.message : String(error)
            const streamError = {
              error: `Failed to parse response: ${message}`,
              data: undefined,
              end: undefined,
            }
            this.subman.handleResponse(requestId, streamError)
          }
        },
      )

      // Store the handle for cleanup
      this.rpcHandles.set(requestId, rpcHandle)

      // Register callbacks
      this.subman.createStreamRequest(requestId, onSuccess, onError, onEnd)
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error)
      onError(`Failed to call RPC: ${message}`)
      return () => {}
    }

    return () => {
      const handle = this.rpcHandles.get(requestId)
      if (handle) {
        try {
          handle.cancel()
          handle.free()
        } catch (error) {
          logger.warn('Error canceling RPC handle', error)
        }
        this.rpcHandles.delete(requestId)
      }
      this.subman.removeCallback(requestId)
    }
  }

  rpcSingle(module, method, body) {
    logger.debug('NodeClient - rpcSingle', module, method, body)
    return new Promise((resolve, reject) => {
      this.rpcStream(module, method, body, resolve, reject)
    })
  }

  async cleanup() {
    await this.sendSingleMessage('cleanup')
  }
}
