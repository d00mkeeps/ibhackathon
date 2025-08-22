export type ConnectionStateType = 
  | 'DISCONNECTED' 
  | 'CONNECTING' 
  | 'CONNECTED' 
  | 'STREAMING' 
  | 'ERROR';

export interface ConnectionState {
  type: ConnectionStateType;
  canSendMessage: boolean;
  canConnect: boolean;
  isLoading: boolean;
  error?: Error;
}

export const CONNECTION_STATES = {
  DISCONNECTED: 'DISCONNECTED',
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  STREAMING: 'STREAMING',
  ERROR: 'ERROR'
} as const;

export const createInitialConnectionState = (): ConnectionState => ({
  type: 'DISCONNECTED',
  canSendMessage: false,
  canConnect: true,
  isLoading: false
});