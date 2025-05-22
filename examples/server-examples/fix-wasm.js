// This is a bootstrap script to fix WASM initialization for Bun

// Copy the WASM files to a local directory for easy access
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Create a local wasm directory
const wasmDir = path.join(__dirname, '.wasm')
if (!fs.existsSync(wasmDir)) {
  fs.mkdirSync(wasmDir, { recursive: true })
}

// Copy the WASM files from node_modules
const sourceDir =
  '/home/okj/fedimint/web/node_modules/.pnpm/@fedimint+fedimint-client-wasm-bundler@0.0.3/node_modules/@fedimint/fedimint-client-wasm-bundler'
const files = [
  'fedimint_client_wasm.js',
  'fedimint_client_wasm_bg.js',
  'fedimint_client_wasm_bg.wasm',
  'fedimint_client_wasm.d.ts',
]

for (const file of files) {
  const source = path.join(sourceDir, file)
  const dest = path.join(wasmDir, file)

  if (fs.existsSync(source)) {
    fs.copyFileSync(source, dest)
    console.log(`Copied ${file} to ${wasmDir}`)
  } else {
    console.error(`Source file ${source} does not exist`)
  }
}

console.log('WASM files copied successfully.')
