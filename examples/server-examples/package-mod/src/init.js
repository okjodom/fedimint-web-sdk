/**
 * WASM initialization module with environment-specific handling
 * Provides robust initialization for Bun, Node.js and browser environments
 */

import { getEnvironment, isBunEnvironment, isNodeEnvironment } from './env.js'
import { setupMemoryFunctions, exportMemoryFunctions } from './memory.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

// Keep track of initialization state
let isInitialized = false
let wasmInstance = null

/**
 * Initialize WASM for Bun environment
 * @param {string} wasmPath - Path to the WASM file
 * @returns {Promise<Object>} Initialized WASM instance
 */
export async function initWasmBun(wasmPath) {
  console.log('Initializing WASM for Bun environment')

  try {
    // In Bun, we need to handle things differently
    // Convert relative path to absolute
    const currentDir = process.cwd()
    const wasmFilePath = path.resolve(currentDir, wasmPath)

    console.log('Loading WASM from:', wasmFilePath)

    // Load WASM file using file system
    const wasmBuffer = fs.readFileSync(wasmFilePath)
    const wasmModule = await WebAssembly.compile(wasmBuffer)

    // Import the WASM glue code - relative to current working directory
    const bgJsPath = wasmPath.replace('.wasm', '.js')
    const bgJsModulePath = path.resolve(currentDir, bgJsPath)
    console.log('Loading JS glue from:', bgJsModulePath)

    // Use dynamic import with file URL
    const bgJsModule = await import('file://' + bgJsModulePath)

    // Create import object with memory
    const importObject = {}
    const instance = await WebAssembly.instantiate(wasmModule, importObject)

    // Set the instance in the bg module
    if (typeof bgJsModule.__wbg_set_wasm === 'function') {
      bgJsModule.__wbg_set_wasm(instance.exports)
    }

    // Setup memory functions
    setupMemoryFunctions(instance.exports)

    console.log('WASM initialized successfully for Bun')

    // Return the WasmClient from the bg module
    return bgJsModule
  } catch (e) {
    console.error('Failed to initialize WASM for Bun:', e)
    throw e
  }
}

/**
 * Initialize WASM for Node.js environment
 * @param {string} wasmPath - Path to the WASM file
 * @returns {Promise<Object>} Initialized WASM instance
 */
export async function initWasmNode(wasmPath) {
  console.log('Initializing WASM for Node.js environment')

  try {
    // In Node.js, we can use the normal import mechanism
    const wasmModule = await import(wasmPath)

    // Initialize if it has a default export (likely the initialization function)
    if (typeof wasmModule.default === 'function') {
      await wasmModule.default()
    }

    // Setup memory functions if wasm is available
    if (wasmModule.wasm) {
      setupMemoryFunctions(wasmModule.wasm)
    }

    console.log('WASM initialized successfully for Node.js')

    return wasmModule
  } catch (e) {
    console.error('Failed to initialize WASM for Node.js:', e)
    throw e
  }
}

/**
 * Initialize WASM for browser environment
 * @param {string} wasmPath - Path to the WASM file
 * @returns {Promise<Object>} Initialized WASM instance
 */
export async function initWasmBrowser(wasmPath) {
  console.log('Initializing WASM for browser environment')

  try {
    // In the browser, we can use the normal import mechanism
    const wasmModule = await import(wasmPath)

    // Initialize if it has a default export (likely the initialization function)
    if (typeof wasmModule.default === 'function') {
      await wasmModule.default()
    }

    // Setup memory functions if wasm is available
    if (wasmModule.wasm) {
      setupMemoryFunctions(wasmModule.wasm)
    }

    console.log('WASM initialized successfully for browser')

    return wasmModule
  } catch (e) {
    console.error('Failed to initialize WASM for browser:', e)
    throw e
  }
}

/**
 * Main initialization function that detects environment and initializes accordingly
 * @param {string} wasmPath - Path to the WASM file
 * @returns {Promise<Object>} Initialized WASM module
 */
export async function initWasm(wasmPath) {
  // If already initialized, return the instance
  if (isInitialized && wasmInstance) {
    return wasmInstance
  }

  const env = getEnvironment()
  console.log(`Initializing WASM in ${env} environment`)

  try {
    let instance

    if (isBunEnvironment()) {
      instance = await initWasmBun(wasmPath)
    } else if (isNodeEnvironment()) {
      instance = await initWasmNode(wasmPath)
    } else {
      instance = await initWasmBrowser(wasmPath)
    }

    // Store the initialized instance
    wasmInstance = instance
    isInitialized = true

    return instance
  } catch (e) {
    console.error(`Failed to initialize WASM in ${env} environment:`, e)
    throw e
  }
}
