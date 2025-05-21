import { LightningService } from '../services'
import { SubscriptionManager } from '../utils/SubscriptionManager'

export const TESTING_INVITE =
  'fed11qgqrsdnhwden5te0v9cxjtt4dekxzamxw4kz6mmjvvkhydted9ukg6r9xfsnx7th0fhn26tf093juamwv4u8gtnpwpcz7qqpyz0e327ua8geceutfrcaezwt22mk6s2rdy09kg72jrcmncng2gn0kp2m5sk'

// This is a testing service that allows for inspecting the internals
// of the WorkerClient. It is not intended for use in production.
export class TestingService {
  public TESTING_INVITE: string
  constructor(
    private subman: SubscriptionManager,
    private lightning: LightningService,
  ) {
    // Solo Mint on mutinynet
    this.TESTING_INVITE = TESTING_INVITE
  }

  // subscriptionManager = new SubscriptionManager()
  getRequestCounter() {
    return this.subman._getRequestCounter()
  }

  getRequestCallbackMap() {
    return this.subman._getRequestCallbackMap()
  }

  async getInviteCode() {
    const res = await fetch('http://localhost:15243/connect-string')
    if (res.ok) {
      return await res.text()
    } else {
      throw new Error(`Failed to get invite code: ${await res.text()}`)
    }
  }

  private async getFaucetGatewayApi() {
    const res = await fetch('http://localhost:15243/gateway-api')
    if (res.ok) {
      return await res.text()
    } else {
      throw new Error(`Failed to get gateway: ${await res.text()}`)
    }
  }

  async getFaucetGatewayInfo() {
    const gateways = await this.lightning.listGateways()
    const api = await this.getFaucetGatewayApi()
    const gateway = gateways.find((g) => g.info.api === api)
    if (!gateway) {
      throw new Error(`Gateway not found: ${api}`)
    }
    return gateway.info
  }

  async payFaucetInvoice(invoice: string) {
    const res = await fetch('http://localhost:15243/pay', {
      method: 'POST',
      body: invoice,
    })
    if (res.ok) {
      return await res.text()
    } else {
      throw new Error(`Failed to pay faucet invoice: ${await res.text()}`)
    }
  }

  async createFaucetInvoice(amount: number) {
    const res = await fetch('http://localhost:15243/invoice', {
      method: 'POST',
      body: amount.toString(),
    })
    if (res.ok) {
      return await res.text()
    } else {
      throw new Error(`Failed to generate faucet invoice: ${await res.text()}`)
    }
  }
}
