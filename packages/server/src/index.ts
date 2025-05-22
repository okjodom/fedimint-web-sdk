// Main exports
export { FedimintWallet } from './FedimintWallet.js'
export { createClient, type ClientOptions } from './client.js'
export { ModuleKind, ServerClientInterface, CancelFunction } from './types.js'

// Export all services
export {
  BalanceService,
  MintService,
  LightningService,
  FederationService,
  RecoveryService,
} from './services/index.js'

// Export storage adapters
export { StorageAdapter } from './storage/StorageAdapter.js'
export { LevelDBStorage } from './storage/LevelDBStorage.js'
export { FileStorage } from './storage/FileStorage.js'

// Export utilities
export { SubscriptionManager } from './utils/SubscriptionManager.js'

// Export logger utility
export { type LogLevel } from '@fedimint/core-web'

// Export our own types
export interface Amount {
  amount: number
}

export interface Millisats {
  msat: number
}

export interface Balance {
  amount: number
  decimal: string
}

export enum BalanceType {
  Available = 'available',
  Pending = 'pending',
}

export interface FeeToAmount {
  [key: string]: number
}

export interface OutgoingLightningPayment {
  preimage: string
  outpoint: string
}

export enum LnPayState {
  Created = 0,
  Pending = 1,
  Success = 2,
  Failed = 3,
}

export enum PayType {
  Internal = 0,
  Lightning = 1,
}

export interface LightningGateway {
  gateway_id: string
  gateway_fee: number
  route_hints: RouteHint[]
}

export interface RouteHint {
  hops: any[]
}

export interface CreateBolt11Response {
  invoice: string
  invoice_amount: number
  payment_hash: string
}
