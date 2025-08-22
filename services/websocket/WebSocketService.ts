import EventEmitter from "eventemitter3";

export type MessageCallback = (content: string) => void;
export type CompletionCallback = () => void;
export type ErrorCallback = (error: Error) => void;
export type ConnectionStatusCallback = (status: string) => void;

export type ConnectionState =
  | "disconnected"
  | "connecting"
  | "connected"
  | "reconnecting";

/**
 * WebSocket service for hackathon chat modal
 * Manages connection lifecycle tied to modal open/close
 */
export class WebSocketService {
  private socket: WebSocket | null = null;
  private connectionState: ConnectionState = "disconnected";
  private events = new EventEmitter();

  // Connection management
  private connecting: boolean = false;
  private connectionPromise: Promise<void> | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private heartbeatTimer: ReturnType<typeof setTimeout> | null = null;

  // Retry logic (basic)
  private retryAttempts = 0;
  private maxRetries = 3;
  private retryDelay = 2000; // 2 seconds

  // WebSocket URL
  private wsUrl: string;

  constructor(baseUrl?: string) {
    // Use Railway URL for production, localhost for development
    const isDev =
      typeof window !== "undefined" &&
      window.location?.hostname === "localhost";

    if (isDev) {
      this.wsUrl = "ws://localhost:8000/ws/chat";
    } else {
      this.wsUrl = "wss://ibhackathon-production.up.railway.app/ws/chat";
    }

    // Allow override if baseUrl provided
    if (baseUrl) {
      this.wsUrl = baseUrl;
    }
  }

  /**
   * Connect to chat websocket (called when modal opens)
   */
  async connect(conversationId?: string): Promise<void> {
    console.log(`[WSService] Connecting to chat...`);

    const isDev =
      typeof window !== "undefined" &&
      window.location?.hostname === "localhost";
    const baseWsUrl = isDev
      ? "ws://localhost:8000/ws/chat"
      : "wss://ibhackathon-production.up.railway.app/ws/chat";

    if (conversationId) {
      this.wsUrl = `${baseWsUrl}?conversation_id=${conversationId}`;
    } else {
      this.wsUrl = baseWsUrl;
    }

    // Return existing connection promise if connecting
    if (this.connecting && this.connectionPromise) {
      console.log(`[WSService] Connection in progress, waiting...`);
      return this.connectionPromise;
    }

    // Already connected
    if (this.isConnected()) {
      console.log(`[WSService] Already connected to chat`);
      return;
    }

    // Create connection promise with lock
    this.connecting = true;
    this.connectionPromise = this.establishConnection().finally(() => {
      this.connecting = false;
      this.connectionPromise = null;
    });

    return this.connectionPromise;
  }

  /**
   * Disconnect from chat websocket (called when modal closes)
   */
  disconnect(): void {
    console.log(`[WSService] Disconnecting from chat`);
    this.cleanup();
    this.setConnectionState("disconnected");
  }

  /**
   * Send message to chat
   */
  sendMessage(message: string): void {
    if (!this.isConnected()) {
      throw new Error("Not connected - call connect() first");
    }

    const payload = {
      type: "message",
      message: message,
    };

    this.socket!.send(JSON.stringify(payload));
    console.log(`[WSService] Sent message: ${message.substring(0, 50)}...`);
  }

  /**
   * Check if currently connected
   */
  isConnected(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  /**
   * Get current connection state
   */
  getConnectionState(): ConnectionState {
    return this.connectionState;
  }

  /**
   * Internal connection establishment
   */
  private async establishConnection(): Promise<void> {
    this.cleanup();
    this.setConnectionState("connecting");

    console.log(`[WSService] Establishing connection to: ${this.wsUrl}`);
    this.socket = new WebSocket(this.wsUrl);

    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error("Connection timeout"));
      }, 10000);

      this.socket!.onopen = () => {
        clearTimeout(timeout);
        this.setConnectionState("connected");
        this.retryAttempts = 0; // Reset retry counter
        this.startHeartbeat();

        console.log(`[WSService] Connected to chat`);
        resolve();
      };

      this.socket!.onclose = (event) => {
        clearTimeout(timeout);

        console.log(`[WSService] Connection closed:`, {
          code: event.code,
          wasClean: event.wasClean,
          reason: event.reason,
        });

        this.handleDisconnect();

        // Only reject on abnormal closures
        if (event.code !== 1000 && !event.wasClean) {
          reject(new Error(`Connection closed abnormally: ${event.code}`));
        }
      };

      this.socket!.onerror = (error) => {
        clearTimeout(timeout);
        console.error("[WSService] Connection error:", error);
        reject(new Error("WebSocket connection error"));
      };

      this.socket!.onmessage = (event) => {
        this.handleMessage(event);
      };
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);

      switch (message.type) {
        case "content":
          if (message.data) {
            this.events.emit("message", message.data);
          }
          break;

        case "complete":
          this.events.emit("complete");
          break;

        case "connection_status":
          console.log("[WSService] Connection status:", message.data);
          this.events.emit("connectionStatus", message.data);
          break;

        case "heartbeat_ack":
          console.log("[WSService] Heartbeat acknowledged");
          break;

        case "error":
          console.error("[WSService] Server error:", message);
          const errorMessage = message.data?.message || "Server error";
          this.events.emit("error", new Error(errorMessage));
          break;

        default:
          console.warn("[WSService] Unknown message type:", message.type);
      }
    } catch (error) {
      console.error("[WSService] Failed to parse message:", error);
      this.events.emit("error", new Error("Failed to parse WebSocket message"));
    }
  }

  /**
   * Handle connection disconnect
   */
  private handleDisconnect(): void {
    this.setConnectionState("disconnected");
    this.stopHeartbeat();

    // Basic reconnection logic for unexpected disconnects
    if (this.retryAttempts < this.maxRetries) {
      this.scheduleReconnect();
    } else {
      console.error("[WSService] Max reconnection attempts reached");
      this.events.emit(
        "error",
        new Error("Connection lost - max retries reached")
      );
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.retryAttempts++;
    this.setConnectionState("reconnecting");

    console.log(
      `[WSService] Scheduling reconnect in ${this.retryDelay}ms (attempt ${this.retryAttempts}/${this.maxRetries})`
    );

    this.reconnectTimer = setTimeout(async () => {
      try {
        this.connecting = true;
        this.connectionPromise = this.establishConnection().finally(() => {
          this.connecting = false;
          this.connectionPromise = null;
        });
        await this.connectionPromise;
      } catch (error) {
        console.error("[WSService] Reconnection failed:", error);
        this.handleDisconnect(); // Try again if under max retries
      }
    }, this.retryDelay);
  }

  /**
   * Start heartbeat to keep connection alive
   */
  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      if (this.isConnected()) {
        const heartbeat = {
          type: "heartbeat",
          timestamp: Date.now(),
        };
        this.socket!.send(JSON.stringify(heartbeat));
      }
    }, 30000); // Every 30 seconds
  }

  /**
   * Stop heartbeat timer
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * Set connection state and emit events if needed
   */
  private setConnectionState(state: ConnectionState): void {
    if (this.connectionState !== state) {
      this.connectionState = state;
      console.log(`[WSService] State changed: ${state}`);
    }
  }

  /**
   * Clean up all timers and connections
   */
  private cleanup(): void {
    // Clear timers
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    this.stopHeartbeat();

    // Close socket
    if (this.socket) {
      this.socket.close(1000, "Normal closure");
      this.socket = null;
    }
  }

  // PUBLIC EVENT REGISTRATION

  /**
   * Register message content handler
   */
  onMessage(callback: MessageCallback): () => void {
    this.events.on("message", callback);
    return () => this.events.off("message", callback);
  }

  /**
   * Register completion handler
   */
  onComplete(callback: CompletionCallback): () => void {
    this.events.on("complete", callback);
    return () => this.events.off("complete", callback);
  }

  /**
   * Register error handler
   */
  onError(callback: ErrorCallback): () => void {
    this.events.on("error", callback);
    return () => this.events.off("error", callback);
  }

  /**
   * Register connection status handler
   */
  onConnectionStatus(callback: ConnectionStatusCallback): () => void {
    this.events.on("connectionStatus", callback);
    return () => this.events.off("connectionStatus", callback);
  }

  /**
   * Remove all event listeners (for cleanup)
   */
  removeAllListeners(): void {
    this.events.removeAllListeners();
  }
}

// Singleton instance
let webSocketServiceInstance: WebSocketService | null = null;

export const getWebSocketService = (): WebSocketService => {
  if (!webSocketServiceInstance) {
    webSocketServiceInstance = new WebSocketService();
  }
  return webSocketServiceInstance;
};

export const cleanup = (): void => {
  if (webSocketServiceInstance) {
    webSocketServiceInstance.disconnect();
    webSocketServiceInstance.removeAllListeners();
    webSocketServiceInstance = null;
  }
};
