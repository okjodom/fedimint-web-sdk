import { ServerClientInterface } from './types.js'

/**
 * Service for interacting with the federation's balance functionality.
 */
export class BalanceService {
  constructor(private client: ServerClientInterface) {}

  async getBalance() {
    return this.client.rpcSingle('mint', 'get_balance', {})
  }

  async subscribeBalance(callback: (balance: any) => void) {
    return this.client.rpcStream(
      'mint',
      'subscribe_balance',
      {},
      callback,
      console.error,
    )
  }
}

/**
 * Service for interacting with the federation's mint functionality.
 */
export class MintService {
  constructor(private client: ServerClientInterface) {}

  async redeemEcash(ecash: string) {
    return this.client.rpcSingle('mint', 'redeem_note', { note: ecash })
  }

  async spendNotes(amount: number) {
    return this.client.rpcSingle('mint', 'spend_note', { amount })
  }

  async parseNotes(notes: string) {
    return this.client.rpcSingle('mint', 'parse_note', { note: notes })
  }
}

/**
 * Service for interacting with the federation's lightning functionality.
 */
export class LightningService {
  constructor(private client: ServerClientInterface) {}

  async createInvoice(amount: number, description: string) {
    return this.client.rpcSingle('lightning', 'create_bolt11_invoice', {
      amount,
      description,
    })
  }

  async payInvoice(bolt11: string) {
    return this.client.rpcSingle('lightning', 'pay_bolt11_invoice', { bolt11 })
  }
}

/**
 * Service for interacting with the federation's federation functionality.
 */
export class FederationService {
  constructor(private client: ServerClientInterface) {}

  async getFederationId() {
    return this.client.rpcSingle('federation', 'federation_id', {})
  }

  async getConfig() {
    return this.client.rpcSingle('federation', 'config', {})
  }

  async getInviteCode() {
    return this.client.rpcSingle('federation', 'invite_code', {})
  }
}

/**
 * Service for interacting with the federation's recovery functionality.
 */
export class RecoveryService {
  constructor(private client: ServerClientInterface) {}

  // Recovery methods when implemented
}
