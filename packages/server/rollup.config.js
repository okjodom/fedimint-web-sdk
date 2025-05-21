import typescript from '@rollup/plugin-typescript'
import terser from '@rollup/plugin-terser'
import dts from 'rollup-plugin-dts'
import commonjs from '@rollup/plugin-commonjs'
import { nodeResolve } from '@rollup/plugin-node-resolve'
import { defineConfig } from 'rollup'

export default defineConfig([
  // Main bundle - explicitly list all files with their own entry points
  {
    input: {
      index: 'src/index.ts',
      FedimintWallet: 'src/FedimintWallet.ts',
      NodeClient: 'src/NodeClient.ts',
      client: 'src/client.ts',
      types: 'src/types.ts',
      'services/index': 'src/services/index.ts',
      'services/BalanceService': 'src/services/BalanceService.ts',
      'services/MintService': 'src/services/MintService.ts',
      'services/LightningService': 'src/services/LightningService.ts',
      'services/FederationService': 'src/services/FederationService.ts',
      'services/RecoveryService': 'src/services/RecoveryService.ts',
      'utils/SubscriptionManager': 'src/utils/SubscriptionManager.ts',
    },
    output: [
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    ],
    external: [
      '@fedimint/core-web',
      '@fedimint/fedimint-client-wasm-bundler',
      'classic-level',
      'fs/promises',
      'path',
    ],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
      }),
      terser(),
    ],
  },
  // Storage module
  {
    input: {
      'storage/index': 'src/storage/index.ts',
      'storage/LevelDBStorage': 'src/storage/LevelDBStorage.ts',
      'storage/FileStorage': 'src/storage/FileStorage.ts',
      'storage/StorageAdapter': 'src/storage/StorageAdapter.ts',
    },
    output: [
      {
        dir: 'dist',
        format: 'esm',
        sourcemap: true,
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
      {
        dir: 'dist/cjs',
        format: 'cjs',
        sourcemap: true,
        entryFileNames: '[name].js',
        preserveModules: true,
        preserveModulesRoot: 'src',
      },
    ],
    external: ['classic-level', 'fs/promises', 'path'],
    plugins: [
      nodeResolve(),
      commonjs(),
      typescript({
        tsconfig: './tsconfig.json',
        declaration: true,
        declarationDir: 'dist',
      }),
      terser(),
    ],
  },
  // Type definitions
  {
    input: 'dist/index.d.ts',
    output: {
      file: 'dist/index.d.ts',
      format: 'es',
    },
    plugins: [dts()],
  },
])
