import type {
  CancelFunction,
  JSONValue,
  ModuleKind,
  StreamError,
  StreamResult,
  WorkerMessageType,
  ClientInterface,
} from '../types'
import { logger } from '../utils/logger'
import { SubscriptionManager } from '../utils/SubscriptionManager'

// Handles communication with the wasm worker
export class WorkerClient implements ClientInterface {
  private worker: Worker
  private initPromise: Promise<boolean> | undefined = undefined

  constructor(private readonly subman: SubscriptionManager) {
    // Must create the URL inside the constructor for vite
    this.worker = new Worker(new URL('./worker.js', import.meta.url), {
      type: 'module',
    })
    this.worker.onmessage = this.handleWorkerMessage.bind(this)
    this.worker.onerror = this.handleWorkerError.bind(this)

    logger.info('WorkerClient instantiated')
    logger.debug('WorkerClient', this.worker)
  }

  // Idempotent setup - Loads the wasm module
  initialize() {
    if (this.initPromise) return this.initPromise
    this.initPromise = this.sendSingleMessage('init')
    return this.initPromise
  }

  private handleWorkerLogs(event: MessageEvent) {
    const { type, level, message, ...data } = event.data
    logger.log(level, message, ...data)
  }

  private handleWorkerError(event: ErrorEvent) {
    logger.error('Worker error', event)
  }

  private handleWorkerMessage(event: MessageEvent) {
    const { type, requestId, ...data } = event.data
    if (type === 'log') {
      this.handleWorkerLogs(event.data)
      return
    }

    logger.debug('WorkerClient - handleWorkerMessage', event.data)
    this.subman.handleResponse(requestId, data)
  }

  sendSingleMessage<
    Response extends JSONValue = JSONValue,
    Payload extends JSONValue = JSONValue,
  >(type: WorkerMessageType, payload?: Payload) {
    const requestId = this.subman.getNextRequestId()
    logger.debug('WorkerClient - sendSingleMessage', requestId, type, payload)

    // Create promise before sending message
    const responsePromise = this.subman.createSingleRequest<Response>(requestId)

    // Send message to worker
    this.worker.postMessage({ type, payload, requestId })

    return responsePromise
  }

  /**
   * @summary Initiates an RPC stream with the specified module and method.
   *
   * @description
   * This function sets up an RPC stream by sending a request to a worker and
   * handling responses asynchronously. It ensures that unsubscription is handled
   * correctly, even if the unsubscribe function is called before the subscription
   * is fully established, by deferring the unsubscription attempt using `setTimeout`.
   *
   * @template Response - The expected type of the successful response.
   * @template Body - The type of the request body.
   * @param module - The module kind to interact with.
   * @param method - The method name to invoke on the module.
   * @param body - The request payload.
   * @param onSuccess - Callback invoked with the response data on success.
   * @param onError - Callback invoked with error information if an error occurs.
   * @param onEnd - Optional callback invoked when the stream ends.
   * @returns A function that can be called to cancel the subscription.
   */
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
    logger.debug('WorkerClient - rpcStream', requestId, module, method, body)

    let isSubscribed = false
    let unsubscribe: (value: void) => void = () => {}

    const unsubscribePromise = new Promise<void>((resolve) => {
      unsubscribe = () => {
        if (isSubscribed) {
          // If already subscribed, resolve immediately to trigger unsubscription
          resolve()
        } else {
          // If not yet subscribed, defer the unsubscribe attempt to the next event loop tick
          setTimeout(() => unsubscribe(), 0)
        }
      }
    })

    // Register the callback
    this.subman.createStreamRequest(requestId, onSuccess, onError, onEnd)

    // Send the message to the worker
    this.worker.postMessage({
      type: 'rpc',
      payload: { module, method, body },
      requestId,
    })

    isSubscribed = true

    // Handle unsubscription
    unsubscribePromise.then(() => {
      this.worker.postMessage({
        type: 'unsubscribe',
        requestId,
      })
      this.subman.removeCallback(requestId)
    })

    return unsubscribe
  }

  rpcSingle<
    Response extends JSONValue = JSONValue,
    Error extends string = string,
  >(module: ModuleKind, method: string, body: JSONValue) {
    logger.debug('WorkerClient - rpcSingle', module, method, body)
    return new Promise<Response>((resolve, reject) => {
      this.rpcStream<Response>(module, method, body, resolve, reject)
    })
  }

  async cleanup() {
    await this.sendSingleMessage('cleanup')
    this.initPromise = undefined
    this.subman.clear()
  }
}
