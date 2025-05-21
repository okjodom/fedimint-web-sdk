import type {
  JSONValue,
  WorkerMessageType,
  StreamError,
} from '@fedimint/core-web'

// Server-specific extension of the ModuleKind type to include additional modules
export const MODULE_KINDS = [
  '',
  'ln',
  'mint',
  'lightning',
  'federation',
  'admin',
] as const
export type ModuleKind = (typeof MODULE_KINDS)[number]

// Type for cancel function
export type CancelFunction = () => void

// Server-specific ClientInterface that uses our extended ModuleKind
export interface ServerClientInterface {
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
