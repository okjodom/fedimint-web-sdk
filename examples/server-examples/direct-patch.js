// Direct patching of the WASM JS glue code
// This script modifies the fedimint_client_wasm_bg.js file to add a global malloc function

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const bgJsPath = path.join(__dirname, '.wasm/fedimint_client_wasm_bg.js')

console.log('Directly patching WASM JS glue code')

// Read the file
let content = fs.readFileSync(bgJsPath, 'utf8')

// Add our own malloc and realloc functions at the top of the file
const patchCode = `
// Bun WASM compatibility patch
let wasm;

// Add malloc for Bun compatibility
function malloc(size, align) {
  return wasm.__wbindgen_malloc(size);
}

// Original code follows
`

// Add the patch after the first 'let wasm;' line
content = content.replace('let wasm;', patchCode)

// Save the modified file
fs.writeFileSync(bgJsPath, content)

console.log('WASM JS glue code patched successfully')
