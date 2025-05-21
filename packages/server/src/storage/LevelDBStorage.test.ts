import os from 'os'
import path from 'path'
import fs from 'fs/promises'
import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { LevelDBStorage } from './LevelDBStorage'

describe('LevelDBStorage', () => {
  let tempDir: string
  let storage: LevelDBStorage

  beforeEach(async () => {
    // Create a temporary directory for testing
    tempDir = path.join(os.tmpdir(), `fedimint-test-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    // Create a new storage instance
    storage = new LevelDBStorage(tempDir)
    await storage.initialize()
  })

  afterEach(async () => {
    // Clean up
    await storage.close()
    await fs.rm(tempDir, { recursive: true, force: true })
  })

  it('should store and retrieve values', async () => {
    const key = new Uint8Array([1, 2, 3])
    const value = new Uint8Array([4, 5, 6])

    await storage.put(key, value)
    const retrieved = await storage.get(key)

    expect(retrieved).not.toBeNull()
    expect(retrieved).toEqual(value)
  })

  it('should return null for non-existent keys', async () => {
    const key = new Uint8Array([7, 8, 9])
    const retrieved = await storage.get(key)

    expect(retrieved).toBeNull()
  })

  it('should delete values', async () => {
    const key = new Uint8Array([10, 11, 12])
    const value = new Uint8Array([13, 14, 15])

    await storage.put(key, value)
    let retrieved = await storage.get(key)
    expect(retrieved).toEqual(value)

    await storage.delete(key)
    retrieved = await storage.get(key)
    expect(retrieved).toBeNull()
  })

  it('should support transactions', async () => {
    const key1 = new Uint8Array([16, 17, 18])
    const value1 = new Uint8Array([19, 20, 21])
    const key2 = new Uint8Array([22, 23, 24])
    const value2 = new Uint8Array([25, 26, 27])

    const transaction = storage.beginTransaction()

    await transaction.put(key1, value1)
    await transaction.put(key2, value2)

    // Values should not be visible outside the transaction yet
    expect(await storage.get(key1)).toBeNull()
    expect(await storage.get(key2)).toBeNull()

    // Values should be visible inside the transaction
    expect(await transaction.get(key1)).toEqual(value1)
    expect(await transaction.get(key2)).toEqual(value2)

    // Commit the transaction
    await transaction.commit()

    // Now values should be visible outside the transaction
    expect(await storage.get(key1)).toEqual(value1)
    expect(await storage.get(key2)).toEqual(value2)
  })

  it('should support transaction abort', async () => {
    const key = new Uint8Array([28, 29, 30])
    const value = new Uint8Array([31, 32, 33])

    const transaction = storage.beginTransaction()

    await transaction.put(key, value)
    expect(await transaction.get(key)).toEqual(value)

    // Abort the transaction
    await transaction.abort()

    // Value should not be stored
    expect(await storage.get(key)).toBeNull()
  })
})
