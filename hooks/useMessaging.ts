import { useCallback, useEffect, useRef, useState } from "react";
import { getWebSocketService } from "@/services/websocket/WebSocketService";
import { Message } from "@/types"; // Use your existing Message type

export interface StreamingMessageState {
  conversationId: string; // Match your existing ChatInterface expectation
  content: string;
  isComplete: boolean;
  isProcessing?: boolean;
}

export function useMessaging(conversationId: string | null) {
  const webSocketService = getWebSocketService();
  const unsubscribeRefs = useRef<(() => void)[]>([]);

  // State management
  const [messages, setMessages] = useState<Message[]>([]);
  const [streamingMessage, setStreamingMessage] =
    useState<StreamingMessageState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  // Register websocket handlers
  const registerHandlers = useCallback(() => {
    // Clear any existing handlers
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];

    // Register handlers for incoming messages
    const unsubscribeContent = webSocketService.onMessage((content) => {
      console.log(
        "[useMessaging] Received content:",
        content.substring(0, 50) + "..."
      );

      if (conversationId) {
        setStreamingMessage((prev) => ({
          conversationId,
          content: (prev?.content || "") + content,
          isComplete: false,
        }));
      }
    });

    const unsubscribeComplete = webSocketService.onComplete(() => {
      console.log("[useMessaging] Message complete");

      if (!conversationId) return;

      setStreamingMessage((prev) => {
        if (prev?.content.trim()) {
          // Add completed message to messages with proper conversation fields
          const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            conversation_id: conversationId,
            conversation_sequence: messages.length + 1, // Simple sequencing for now
            content: prev.content,
            sender: "assistant",
            timestamp: new Date(),
          };

          setMessages((currentMessages) => [...currentMessages, aiMessage]);
        }

        return null; // Clear streaming message
      });
    });

    const unsubscribeError = webSocketService.onError((error) => {
      console.error("[useMessaging] WebSocket error:", error);
      setStreamingMessage(null);
      setError(error);
    });

    const unsubscribeConnectionStatus = webSocketService.onConnectionStatus(
      (status) => {
        console.log("[useMessaging] Connection status:", status);
        setIsConnected(status === "connected");
      }
    );

    // Store unsubscribe functions
    unsubscribeRefs.current = [
      unsubscribeContent,
      unsubscribeComplete,
      unsubscribeError,
      unsubscribeConnectionStatus,
    ];

    console.log("[useMessaging] Registered websocket handlers");
  }, [conversationId, messages.length]); // Add dependencies

  // Update the connect method to pass conversationId
  const connect = useCallback(async () => {
    if (!conversationId) {
      throw new Error("No conversation ID provided");
    }

    try {
      setIsLoading(true);
      setError(null);
      console.log(
        "[useMessaging] Connecting to chat for conversation:",
        conversationId
      );

      // Register handlers first
      registerHandlers();

      // Pass conversationId to webSocketService.connect()
      await webSocketService.connect(conversationId);
      setIsConnected(true);
    } catch (error) {
      console.error("[useMessaging] Failed to connect:", error);
      setError(error instanceof Error ? error : new Error(String(error)));
      setIsConnected(false);
    } finally {
      setIsLoading(false);
    }
  }, [conversationId, registerHandlers]);

  // Disconnect from websocket (called when modal closes)
  const disconnect = useCallback(() => {
    console.log("[useMessaging] Disconnecting from chat...");

    // Clean up handlers
    unsubscribeRefs.current.forEach((unsubscribe) => unsubscribe());
    unsubscribeRefs.current = [];

    // Disconnect websocket
    webSocketService.disconnect();
    setIsConnected(false);

    // Clear any streaming state
    setStreamingMessage(null);
  }, []);

  // Send message
  const sendMessage = useCallback(
    async (content: string) => {
      if (!conversationId) {
        throw new Error("No conversation ID");
      }

      if (!isConnected) {
        throw new Error("Not connected to chat");
      }

      if (!content.trim()) {
        throw new Error("Cannot send empty message");
      }

      try {
        // Add user message to local state with proper conversation fields
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          conversation_id: conversationId,
          conversation_sequence: messages.length + 1,
          content: content.trim(),
          sender: "user",
          timestamp: new Date(),
        };

        setMessages((currentMessages) => [...currentMessages, userMessage]);

        // Clear any previous error
        setError(null);

        // Send message via websocket
        webSocketService.sendMessage(content.trim());
      } catch (error) {
        console.error("Error sending message:", error);
        const errorMessage =
          error instanceof Error ? error : new Error(String(error));
        setError(errorMessage);
        throw errorMessage;
      }
    },
    [conversationId, isConnected, messages.length]
  );

  // Clear messages (useful for starting fresh)
  const clearMessages = useCallback(() => {
    setMessages([]);
    setStreamingMessage(null);
    setError(null);
  }, []);

  // Load existing messages for conversation (placeholder for now)
  const loadMessages = useCallback(async () => {
    if (!conversationId) return [];

    // TODO: Load from backend/database
    console.log(
      "[useMessaging] Loading messages for conversation:",
      conversationId
    );

    return messages;
  }, [conversationId, messages]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  const isStreaming = !!streamingMessage && !streamingMessage.isComplete;
  const hasMessages = messages.length > 0;
  const messageCount = messages.length;

  return {
    // State
    messages,
    streamingMessage,
    isStreaming,
    isLoading,
    error,
    isConnected,
    hasMessages,
    messageCount,
    conversationId,

    // Actions
    connect,
    disconnect,
    sendMessage,
    clearMessages,
    loadMessages,
  };
}
