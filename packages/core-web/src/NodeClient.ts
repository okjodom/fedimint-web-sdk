import type {
  CancelFunction,
  JSONValue,
  ModuleKind,
  StreamEnd,
  StreamError,
  StreamResult,
  StreamSuccess,
  WorkerMessageType,
  ClientInterface,
} from './types'
import { logger } from './utils/logger'
import { SubscriptionManager } from './utils/SubscriptionManager'

export class NodeClient implements ClientInterface {
  private initPromise: Promise<boolean> | undefined = undefined
  private wasmClient: any = null
  private client: any = null
  private rpcHandles = new Map<number, any>()

  constructor(private readonly subman: SubscriptionManager) {
    logger.info('NodeClient instantiated')
  }

  // Idempotent setup - Loads the wasm module
  async initialize() {
    if (this.initPromise) return this.initPromise

    this.initPromise = new Promise<boolean>(async (resolve) => {
      try {
        // Dynamic import of the WASM module (works in Node.js and Bun)
        const wasmModule = await import(
          '@fedimint/fedimint-client-wasm-bundler'
        )
        this.wasmClient = wasmModule.WasmClient
        resolve(true)
      } catch (error: unknown) {
        logger.error('Failed to initialize WASM module', error)
        resolve(false)
      }
    })

    return this.initPromise
  }

  async sendSingleMessage<
    Response extends JSONValue = JSONValue,
    Payload extends JSONValue = JSONValue,
  >(type: WorkerMessageType, payload?: Payload) {
    const requestId = this.subman.getNextRequestId()
    logger.debug('NodeClient - sendSingleMessage', requestId, type, payload)

    if (type === 'init') {
      await this.initialize()
      return { success: true } as unknown as Response
    }

    if (type === 'open') {
      const { clientName } = (payload as any) || {}
      try {
        this.client = await this.wasmClient.open(clientName)
        return { success: !!this.client } as unknown as Response
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error)
        throw new Error(`Failed to open client: ${message}`)
      }
    }

    if (type === 'join') {
      const { inviteCode, clientName } = (payload as any) || {}
      try {
        this.client = await this.wasmClient.join_federation(
          clientName,
          inviteCode,
        )
        return { success: !!this.client } as unknown as Response
      } catch (error: unknown) {
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
        } catch (error: unknown) {
          logger.warn('Error cleaning up RPC handle', error)
        }
      }
      this.rpcHandles.clear()

      // Free the client
      try {
        this.client?.free()
      } catch (error: unknown) {
        logger.warn('Error freeing client', error)
      }

      this.client = null
      this.initPromise = undefined
      this.subman.clear()
      return { success: true } as unknown as Response
    }

    throw new Error(`Unknown message type: ${type}`)
  }

  rpcStream<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
    onEnd: () => void = () => {},
  ): CancelFunction {
    const requestId = this.subman.getNextRequestId()
    logger.debug('NodeClient - rpcStream', requestId, module, method, body)

    if (!this.client) {
      onError('WasmClient not initialized')
      return () => {}
    }

    let rpcHandle: any = null

    try {
      // Call the RPC method on the WASM client
      rpcHandle = this.client.rpc(
        module,
        method,
        JSON.stringify(body),
        (res: string) => {
          try {
            const data = JSON.parse(res)

            if (data.error !== undefined) {
              const streamError: StreamError = {
                error: data.error,
                data: undefined as never,
                end: undefined as never,
              }
              this.subman.handleResponse<Response>(requestId, streamError)
            } else if (data.data !== undefined) {
              const streamSuccess: StreamSuccess<Response> = {
                data: data.data,
                error: undefined as never,
                end: undefined as never,
              }
              this.subman.handleResponse<Response>(requestId, streamSuccess)
            } else if (data.end !== undefined) {
              const streamEnd: StreamEnd = {
                end: data.end || '',
                data: undefined as never,
                error: undefined as never,
              }
              this.subman.handleResponse<Response>(requestId, streamEnd)
              this.rpcHandles.delete(requestId)
              rpcHandle?.free()
            }
          } catch (error: unknown) {
            const message =
              error instanceof Error ? error.message : String(error)
            const streamError: StreamError = {
              error: `Failed to parse response: ${message}`,
              data: undefined as never,
              end: undefined as never,
            }
            this.subman.handleResponse<Response>(requestId, streamError)
          }
        },
      )

      // Store the handle for cleanup
      this.rpcHandles.set(requestId, rpcHandle)

      // Register callbacks
      this.subman.createStreamRequest(requestId, onSuccess, onError, onEnd)
    } catch (error: unknown) {
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
        } catch (error: unknown) {
          logger.warn('Error canceling RPC handle', error)
        }
        this.rpcHandles.delete(requestId)
      }
      this.subman.removeCallback(requestId)
    }
  }

  rpcSingle<
    Response extends JSONValue = JSONValue,
    Error extends string = string,
  >(module: ModuleKind, method: string, body: JSONValue) {
    logger.debug('NodeClient - rpcSingle', module, method, body)
    return new Promise<Response>((resolve, reject) => {
      this.rpcStream<Response>(module, method, body, resolve, reject)
    })
  }

  async cleanup() {
    await this.sendSingleMessage('cleanup')
  }
}
