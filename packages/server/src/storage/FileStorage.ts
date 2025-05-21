import path from 'path'
import fs from 'fs/promises'
import { StorageAdapter, Transaction } from './StorageAdapter'

/**
 * File-based transaction implementation.
 */
class FileTransaction implements Transaction {
  private operations: Array<{
    type: 'put' | 'del'
    key: Uint8Array
    value?: Uint8Array
  }> = []
  private cache = new Map<string, Uint8Array | null>()

  constructor(private basePath: string) {}

  /**
   * Get a value by key.
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  async get(key: Uint8Array): Promise<Uint8Array | null> {
    const keyString = Buffer.from(key).toString('hex')

    // Check cache first
    if (this.cache.has(keyString)) {
      return this.cache.get(keyString) || null
    }

    const filePath = path.join(this.basePath, keyString)

    try {
      const value = await fs.readFile(filePath)
      this.cache.set(keyString, value)
      return value
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        this.cache.set(keyString, null)
        return null
      }
      throw error
    }
  }

  /**
   * Put a key-value pair.
   * @param key The key
   * @param value The value
   */
  async put(key: Uint8Array, value: Uint8Array): Promise<void> {
    const keyString = Buffer.from(key).toString('hex')
    this.operations.push({ type: 'put', key, value })
    this.cache.set(keyString, value)
  }

  /**
   * Delete a key-value pair.
   * @param key The key to delete
   */
  async delete(key: Uint8Array): Promise<void> {
    const keyString = Buffer.from(key).toString('hex')
    this.operations.push({ type: 'del', key })
    this.cache.set(keyString, null)
  }

  /**
   * Commit the transaction.
   */
  async commit(): Promise<void> {
    if (this.operations.length === 0) return

    // Process all operations
    for (const op of this.operations) {
      const keyString = Buffer.from(op.key).toString('hex')
      const filePath = path.join(this.basePath, keyString)

      if (op.type === 'put' && op.value) {
        await fs.mkdir(path.dirname(filePath), { recursive: true })
        await fs.writeFile(filePath, op.value)
      } else if (op.type === 'del') {
        try {
          await fs.unlink(filePath)
        } catch (error: any) {
          if (error.code !== 'ENOENT') {
            throw error
          }
        }
      }
    }

    this.operations = []
    this.cache.clear()
  }

  /**
   * Abort the transaction.
   */
  async abort(): Promise<void> {
    this.operations = []
    this.cache.clear()
  }
}

/**
 * Simple file-based storage adapter implementation for Node.js environments.
 * Uses the filesystem to store key-value pairs.
 */
export class FileStorage implements StorageAdapter {
  private isInitialized = false

  /**
   * Create a new file-based storage adapter.
   * @param basePath Path to the directory where data will be stored
   */
  constructor(private readonly basePath: string) {}

  /**
   * Initialize the storage.
   * Must be called before using any other methods.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      await fs.mkdir(this.basePath, { recursive: true })
      this.isInitialized = true
    } catch (error) {
      throw new Error(`Failed to initialize file storage: ${error}`)
    }
  }

  /**
   * Ensure the storage is initialized.
   * @throws Error if the storage is not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized) {
      throw new Error('Storage not initialized. Call initialize() first.')
    }
  }

  /**
   * Get a value by key.
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  async get(key: Uint8Array): Promise<Uint8Array | null> {
    this.ensureInitialized()

    const keyString = Buffer.from(key).toString('hex')
    const filePath = path.join(this.basePath, keyString)

    try {
      return await fs.readFile(filePath)
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  /**
   * Put a key-value pair.
   * @param key The key
   * @param value The value
   */
  async put(key: Uint8Array, value: Uint8Array): Promise<void> {
    this.ensureInitialized()

    const keyString = Buffer.from(key).toString('hex')
    const filePath = path.join(this.basePath, keyString)

    await fs.mkdir(path.dirname(filePath), { recursive: true })
    await fs.writeFile(filePath, value)
  }

  /**
   * Delete a key-value pair.
   * @param key The key to delete
   */
  async delete(key: Uint8Array): Promise<void> {
    this.ensureInitialized()

    const keyString = Buffer.from(key).toString('hex')
    const filePath = path.join(this.basePath, keyString)

    try {
      await fs.unlink(filePath)
    } catch (error: any) {
      if (error.code !== 'ENOENT') {
        throw error
      }
    }
  }

  /**
   * Begin a new transaction.
   * @returns A new transaction object
   */
  beginTransaction(): Transaction {
    this.ensureInitialized()
    return new FileTransaction(this.basePath)
  }

  /**
   * Close the storage and release resources.
   * For file storage, this is a no-op.
   */
  async close(): Promise<void> {
    this.isInitialized = false
  }
}
