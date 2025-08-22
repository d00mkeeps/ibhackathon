export interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: number;
  }
  
  export type MessageHandler = (type: string, data: any) => void;