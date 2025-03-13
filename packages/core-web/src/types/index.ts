export * from './wallet'
export * from './utils'
export * from './worker'

import { JSONValue } from './utils'
import { ModuleKind, StreamError, StreamEnd, CancelFunction } from './wallet'
import { WorkerMessageType } from './worker'

// Interface for both NodeClient and WorkerClient
export interface ClientInterface {
  initialize(): Promise<boolean>
  sendSingleMessage<
    Response extends JSONValue = JSONValue,
    Payload extends JSONValue = JSONValue,
  >(
    type: WorkerMessageType,
    payload?: Payload,
  ): Promise<Response>
  rpcStream<
    Response extends JSONValue = JSONValue,
    Body extends JSONValue = JSONValue,
  >(
    module: ModuleKind,
    method: string,
    body: Body,
    onSuccess: (res: Response) => void,
    onError: (res: StreamError['error']) => void,
    onEnd?: () => void,
  ): CancelFunction
  rpcSingle<
    Response extends JSONValue = JSONValue,
    Error extends string = string,
  >(
    module: ModuleKind,
    method: string,
    body: JSONValue,
  ): Promise<Response>
  cleanup(): Promise<void>
}

// Re-export for internal use
export {
  JSONValue,
  ModuleKind,
  StreamError,
  StreamEnd,
  CancelFunction,
  WorkerMessageType,
}
