import { ServerClientInterface } from '../types.js'

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
