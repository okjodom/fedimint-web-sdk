import { describe, it, expect, vi } from 'vitest'
import { FedimintWallet, FedimintEnv } from './FedimintWallet'
import { FileStorage } from './storage/FileStorage'
import os from 'os'
import path from 'path'
import fs from 'fs/promises'

// Mock the NodeClient implementation
vi.mock('./NodeClient', () => {
  return {
    NodeClient: vi.fn().mockImplementation(() => {
      return {
        initialize: vi.fn().mockResolvedValue(true),
        sendSingleMessage: vi.fn().mockImplementation((type, payload) => {
          if (type === 'open' || type === 'join') {
            return Promise.resolve({ success: true })
          }
          if (type === 'cleanup') {
            return Promise.resolve({ success: true })
          }
          return Promise.resolve({})
        }),
        cleanup: vi.fn().mockResolvedValue(true),
        rpcSingle: vi.fn().mockResolvedValue({}),
        rpcStream: vi.fn(),
      }
    }),
  }
})

describe('FedimintWallet', () => {
  it('should detect environment correctly', async () => {
    const wallet = new FedimintWallet()
    expect(wallet.getEnvironment()).toBe(FedimintEnv.Node)
  })

  it('should initialize with custom environment', async () => {
    const wallet = new FedimintWallet({
      env: FedimintEnv.Bun,
    })
    expect(wallet.getEnvironment()).toBe(FedimintEnv.Bun)
  })

  it('should initialize with storage adapter', async () => {
    const tempDir = path.join(os.tmpdir(), `fedimint-test-${Date.now()}`)
    await fs.mkdir(tempDir, { recursive: true })

    try {
      const storage = new FileStorage(tempDir)
      const wallet = new FedimintWallet({
        storageAdapter: storage,
        lazy: true,
      })

      await wallet.initialize()
      await wallet.open('test-client')

      expect(wallet.isOpen()).toBe(true)

      await wallet.cleanup()
    } finally {
      await fs.rm(tempDir, { recursive: true, force: true })
    }
  })

  it('should set log level', () => {
    const wallet = new FedimintWallet()
    wallet.setLogLevel('DEBUG')
    // Log level is set internally, we can't easily test the effect
    // but at least we can test that the method doesn't throw
    expect(true).toBeTruthy()
  })
})
