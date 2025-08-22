import { Message } from "@/types";

export type WebSocketMessageType = 
  | 'content' 
  | 'done' 
  | 'workout_history_approved' 
  | 'error'
  | 'workout_approved'
  | 'loading_start'

  export interface SignalData {
    type: string;
    data: any;
  }
export interface WebSocketMessage {
type?: any;
data?: string | Message[] | SignalData;error?: string;
message?: string,
generate_graph?: boolean,
timestamp?: string
}
export function isSignalMessage(message: WebSocketMessage): message is WebSocketMessage & { data: SignalData } {
  return message.type === 'signal' && 
         typeof message.data === 'object' && 
         message.data !== null &&
         !Array.isArray(message.data) &&
         'type' in message.data && 
         'data' in message.data;
}
export type WebSocketEvents = {
  error: (error: Error) => void;
  connect: () => void;
  disconnect: () => void;
  message: (message: any) => void;
  messageSent: (message: WebSocketMessage) => void;
  connecting: () => void; 

};