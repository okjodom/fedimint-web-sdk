import { ServerClientInterface } from '../types.js'

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
