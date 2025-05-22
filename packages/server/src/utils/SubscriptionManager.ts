import { JSONValue, StreamError, StreamResult } from '@fedimint/core-web'
import { logger } from './logger.js'

/**
 * Manages RPC stream subscriptions and callbacks
 */
export class SubscriptionManager {
  private requestCounter = 0
  private requestCallbacks = new Map<number, (value: any) => void>()

  constructor() {
    logger.debug('SubscriptionManager instantiated')
  }

  /**
   * Generates a unique request ID
   */
  getNextRequestId(): number {
    return ++this.requestCounter
  }

  /**
   * Registers a callback for a request ID
   */
  registerCallback(requestId: number, callback: (value: any) => void): void {
    this.requestCallbacks.set(requestId, callback)
  }

  /**
   * Removes a callback for a request ID
   */
  removeCallback(requestId: number): void {
    this.requestCallbacks.delete(requestId)
  }

  /**
   * Handles a response to an RPC request
   */
  handleResponse<T extends JSONValue>(
    requestId: number,
    response: StreamResult<T>,
  ): void {
    const callback = this.requestCallbacks.get(requestId)
    if (callback) {
      callback(response)
    } else {
      logger.warn(
        'SubscriptionManager - handleResponse - no callback found for request ID',
        requestId,
        response,
      )
    }
  }

  /**
   * Creates a promise-based subscription for a single response
   */
  createSingleRequest<T extends JSONValue>(requestId: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.registerCallback(requestId, (response: StreamResult<T>) => {
        this.removeCallback(requestId)
        if ('data' in response && response.data !== undefined) {
          resolve(response.data)
        } else if ('error' in response && response.error !== undefined) {
          reject(response.error)
        } else {
          logger.warn(
            'SubscriptionManager - createSingleRequest - malformed response',
            requestId,
            response,
          )
          reject(new Error('Malformed response'))
        }
      })
    })
  }

  /**
   * Creates a callback-based subscription for streaming responses
   */
  createStreamRequest<T extends JSONValue>(
    requestId: number,
    onSuccess: (res: T) => void,
    onError: (res: StreamError['error']) => void,
    onEnd: () => void = () => {},
  ): void {
    this.registerCallback(requestId, (response: StreamResult<T>) => {
      if ('error' in response && response.error !== undefined) {
        onError(response.error)
      } else if ('data' in response && response.data !== undefined) {
        onSuccess(response.data)
      } else if ('end' in response && response.end !== undefined) {
        this.removeCallback(requestId)
        onEnd()
      }
    })
  }

  /**
   * Clears all subscriptions
   */
  clear(): void {
    this.requestCallbacks.clear()
    this.requestCounter = 0
  }

  // For Testing
  _getRequestCounter() {
    return this.requestCounter
  }

  _getRequestCallbackMap() {
    return this.requestCallbacks
  }
}
