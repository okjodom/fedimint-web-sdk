// A simplified example that focuses on getting the WASM to work in Bun

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Copy the WASM files if needed
const wasmDir = path.join(__dirname, '.wasm')
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true })
}

// Source directory with WASM files
const sourceDir =
  '/home/okj/fedimint/web/node_modules/.pnpm/@fedimint+fedimint-client-wasm-bundler@0.0.3/node_modules/@fedimint/fedimint-client-wasm-bundler'
const files = [
  'fedimint_client_wasm.js',
  'fedimint_client_wasm_bg.js',
  'fedimint_client_wasm_bg.wasm',
  'fedimint_client_wasm.d.ts',
]

// Copy files
for (const file of files) {
  const source = path.join(sourceDir, file)
  const dest = path.join(wasmDir, file)

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest)
    console.log(`Copied ${file} to ${wasmDir}`)
  }
}

// Patch the file
const bgJsPath = path.join(wasmDir, 'fedimint_client_wasm_bg.js')
let content = fs.readFileSync(bgJsPath, 'utf8')

// Add our global functions at the top of the file
const patchCode = `
// Bun WASM compatibility patch
if (typeof globalThis.malloc === 'undefined') {
  globalThis.malloc = function(size, align) {
    console.log("Global malloc called with size:", size);
    return globalThis.wasm.__wbindgen_malloc(size);
  };
}
`

// Add the patch code at the beginning of the file
content = patchCode + content
fs.writeFileSync(bgJsPath, content)
console.log('Applied patch to the WASM JS file')

// Now use the patched module
console.log('Initializing WASM module...')

// Wait to make sure files are written
setTimeout(async () => {
  try {
    // Import the module
    const wasmModule = await import('./.wasm/fedimint_client_wasm.js')
    console.log('WASM module imported successfully')

    // Add malloc to global scope for debugging
    globalThis.malloc = function (size, align) {
      console.log('Global malloc called with size:', size)
      return wasmModule.wasm.__wbindgen_malloc(size)
    }

    // Try to open a client
    console.log('Trying to open a client...')
    const client = await wasmModule.WasmClient.open('test-client')
    console.log('Client opened successfully:', client)
  } catch (e) {
    console.error('Error using WASM module:', e)
  }
}, 1000)
