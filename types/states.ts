export type WebSocketEvent = 
  | 'CONNECT'
  | 'CONNECTED'
  | 'DISCONNECT'
  | 'MESSAGE_RECEIVED'
  | 'STREAM_START'
  | 'STREAM_END'
  | 'ERROR';

export type ConnectionStateType = 
  | 'DISCONNECTED'
  | 'CONNECTING'
  | 'CONNECTED'
  | 'STREAMING'
  | 'ERROR';

export interface ConnectionState {
  type: ConnectionStateType;
  error?: Error;
  canSendMessage: boolean;
  canConnect: boolean;
  isLoading: boolean;
}