import { FedimintWallet, FedimintWalletEnv } from '@fedimint/core-web'

let wallet: FedimintWallet | undefined

export const initFedimintReact = (lazy: boolean = false) => {
  if (!lazy) {
    wallet = new FedimintWallet(FedimintWalletEnv.Web, lazy)
  }

  return {}
}
