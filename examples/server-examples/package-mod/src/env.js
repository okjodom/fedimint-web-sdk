/**
 * Environment detection module for the WASM client
 * Provides utilities to detect the runtime environment (Bun, Node.js, browser)
 */

/**
 * Detect if running in Bun environment
 * @returns {boolean} True if running in Bun
 */
export function isBunEnvironment() {
  return typeof Bun !== 'undefined'
}

/**
 * Detect if running in Node.js environment
 * @returns {boolean} True if running in Node.js
 */
export function isNodeEnvironment() {
  return (
    typeof process !== 'undefined' && process.versions && process.versions.node
  )
}

/**
 * Detect if running in browser environment
 * @returns {boolean} True if running in browser
 */
export function isBrowserEnvironment() {
  return typeof window !== 'undefined' && typeof document !== 'undefined'
}

/**
 * Get the current runtime environment
 * @returns {'bun'|'node'|'browser'|'unknown'} The detected environment
 */
export function getEnvironment() {
  if (isBunEnvironment()) return 'bun'
  if (isNodeEnvironment()) return 'node'
  if (isBrowserEnvironment()) return 'browser'
  return 'unknown'
}

/**
 * Check if environment supports WebAssembly
 * @returns {boolean} True if WebAssembly is supported
 */
export function supportsWebAssembly() {
  return typeof WebAssembly !== 'undefined'
}

/**
 * Log environment information
 * @returns {Object} Environment information
 */
export function logEnvironmentInfo() {
  const env = {
    environment: getEnvironment(),
    webAssemblySupport: supportsWebAssembly(),
    memoryManagement: {
      globalMalloc: typeof globalThis.malloc !== 'undefined',
      globalWbindgenMalloc: typeof globalThis.__wbindgen_malloc !== 'undefined',
    },
  }

  console.log('Environment Information:', env)
  return env
}
