import { ServerClientInterface } from '../types'

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
