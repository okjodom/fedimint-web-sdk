import { StorageAdapter } from './storage'
import { SubscriptionManager } from './utils'
import { ServerClientInterface } from './types'

// Define options type to be more specific
export interface ClientOptions {
  storageAdapter?: StorageAdapter
  workerThreads?: boolean
  maxConcurrency?: number
  [key: string]: any
}

/**
 * Creates a client for the specified environment.
 * This is a factory function that dynamically imports client implementations
 * to avoid circular dependencies between modules.
 *
 * @param env The environment to create a client for
 * @param subman The subscription manager
 * @param options Additional options
 * @returns A promise that resolves to a client instance
 */
export const createClient = async (
  subman: SubscriptionManager,
  options: ClientOptions = {},
): Promise<ServerClientInterface> => {
  // For Node.js or Bun environment, import the NodeClient
  const { NodeClient } = await import('./NodeClient')
  return new NodeClient(subman, options)
}
