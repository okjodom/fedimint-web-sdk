import type { ClientInterface, JSONValue } from '../types'

export class RecoveryService {
  constructor(private client: ClientInterface) {}

  async hasPendingRecoveries() {
    return await this.client.rpcSingle<boolean>(
      '',
      'has_pending_recoveries',
      {},
    )
  }

  async waitForAllRecoveries() {
    await this.client.rpcSingle('', 'wait_for_all_recoveries', {})
  }

  subscribeToRecoveryProgress(
    onSuccess: (progress: { module_id: number; progress: JSONValue }) => void,
    onError: (error: string) => void,
  ) {
    return this.client.rpcStream<{
      module_id: number
      progress: JSONValue
    }>('', 'subscribe_to_recovery_progress', {}, onSuccess, onError)
  }
}
