/**
 * Interface for Fedimint storage adapters in Node.js environments.
 * This provides a common interface for different storage backends.
 */
export interface Transaction {
  /** Get a value by key */
  get(key: Uint8Array): Promise<Uint8Array | null>

  /** Put a key-value pair */
  put(key: Uint8Array, value: Uint8Array): Promise<void>

  /** Delete a key-value pair */
  delete(key: Uint8Array): Promise<void>

  /** Commit the transaction */
  commit(): Promise<void>

  /** Abort the transaction */
  abort(): Promise<void>
}

/**
 * Interface for storage adapters used by the Fedimint client in Node.js environments.
 */
export interface StorageAdapter {
  /** Initialize the storage */
  initialize(): Promise<void>

  /** Get a value by key */
  get(key: Uint8Array): Promise<Uint8Array | null>

  /** Put a key-value pair */
  put(key: Uint8Array, value: Uint8Array): Promise<void>

  /** Delete a key-value pair */
  delete(key: Uint8Array): Promise<void>

  /** Begin a new transaction */
  beginTransaction(): Transaction

  /** Close the storage and release resources */
  close(): Promise<void>
}
