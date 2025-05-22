/**
 * Test script for the enhanced fedimint-client-wasm-bundler package
 * Tests initialization and basic functionality in the current environment
 */

import {
  initWasm,
  WasmClient,
  getEnvironment,
  logEnvironmentInfo,
  setupMemoryFunctions,
  wasm,
} from './src/index.js'

// Log information about the current environment
console.log('Starting test...')
logEnvironmentInfo()

async function runTest() {
  try {
    console.log('Initializing WASM module...')
    const env = getEnvironment()

    // Initialize WASM with the appropriate path
    await initWasm('./.wasm/fedimint_client_wasm_bg.wasm')

    // Setup memory functions globally
    if (wasm) {
      setupMemoryFunctions(wasm)
      console.log('Memory functions setup complete')
    } else {
      console.warn('WASM object not available for memory setup')
    }

    // Try to open a client
    console.log('Attempting to open a client...')
    try {
      const client = await WasmClient.open('test-client')
      console.log('Client opened successfully:', !!client)

      // Clean up resources
      if (client) {
        console.log('Freeing client resources...')
        client.free()
      }
    } catch (error) {
      console.error('Error opening client:', error)
    }

    console.log('Test completed')
  } catch (error) {
    console.error('Test failed:', error)
  }
}

// Run the test
runTest().catch(console.error)
