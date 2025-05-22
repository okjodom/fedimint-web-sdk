import { ClassicLevel } from 'classic-level'
import { StorageAdapter, Transaction } from './StorageAdapter.js'

/**
 * LevelDB transaction implementation.
 */
class LevelDBTransaction implements Transaction {
  private operations: Array<{
    type: 'put' | 'del'
    key: Uint8Array
    value?: Uint8Array
  }> = []
  private cache = new Map<string, Uint8Array | null>()

  constructor(private db: ClassicLevel<Uint8Array, Uint8Array>) {}

  /**
   * Get a value by key.
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  async get(key: Uint8Array): Promise<Uint8Array | null> {
    // Check cache first
    const keyString = Buffer.from(key).toString('hex')
    if (this.cache.has(keyString)) {
      return this.cache.get(keyString) || null
    }

    try {
      const value = await this.db.get(key)
      this.cache.set(keyString, value)
      return value
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
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

    const batch = this.db.batch()

    for (const op of this.operations) {
      if (op.type === 'put' && op.value) {
        batch.put(op.key, op.value)
      } else if (op.type === 'del') {
        batch.del(op.key)
      }
    }

    await batch.write()
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
 * LevelDB storage adapter implementation for Node.js environments.
 */
export class LevelDBStorage implements StorageAdapter {
  private db: ClassicLevel<Uint8Array, Uint8Array> | null = null
  private isInitialized = false

  /**
   * Create a new LevelDB storage adapter.
   * @param dbPath Path to the database directory
   * @param options LevelDB options
   */
  constructor(
    private readonly dbPath: string,
    private readonly options: {
      createIfMissing?: boolean
      errorIfExists?: boolean
    } = { createIfMissing: true },
  ) {}

  /**
   * Initialize the storage.
   * Must be called before using any other methods.
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.db = new ClassicLevel(this.dbPath, {
        keyEncoding: 'binary',
        valueEncoding: 'binary',
        ...this.options,
      })

      await this.db.open()
      this.isInitialized = true
    } catch (error) {
      throw new Error(`Failed to initialize LevelDB storage: ${error}`)
    }
  }

  /**
   * Ensure the database is initialized.
   * @throws Error if the database is not initialized
   */
  private ensureInitialized(): void {
    if (!this.isInitialized || !this.db) {
      throw new Error('Database not initialized. Call initialize() first.')
    }
  }

  /**
   * Get a value by key.
   * @param key The key to retrieve
   * @returns The value or null if not found
   */
  async get(key: Uint8Array): Promise<Uint8Array | null> {
    this.ensureInitialized()

    try {
      return await this.db!.get(key)
    } catch (error: any) {
      if (error.code === 'LEVEL_NOT_FOUND') {
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
    await this.db!.put(key, value)
  }

  /**
   * Delete a key-value pair.
   * @param key The key to delete
   */
  async delete(key: Uint8Array): Promise<void> {
    this.ensureInitialized()

    try {
      await this.db!.del(key)
    } catch (error: any) {
      if (error.code !== 'LEVEL_NOT_FOUND') {
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
    return new LevelDBTransaction(this.db!)
  }

  /**
   * Close the database and release resources.
   */
  async close(): Promise<void> {
    if (this.isInitialized && this.db) {
      await this.db.close()
      this.isInitialized = false
      this.db = null
    }
  }
}
