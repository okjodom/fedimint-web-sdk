import { ServerClientInterface } from '../types.js'

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
