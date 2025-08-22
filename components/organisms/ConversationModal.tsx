import React, { useEffect, useCallback } from "react";
import { Stack, Text, Button, Dialog } from "tamagui";
import { ChatInterface } from "./ChatInterface"; // Your existing component
import { useMessaging } from "@/hooks/useMessaging";

interface Conversation {
  id: string;
  name: string;
  created_at: string;
}

interface ConversationModalProps {
  isOpen: boolean;
  conversation: Conversation | null;
  onClose: () => void;
}

export function ConversationModal({
  isOpen,
  conversation,
  onClose,
}: ConversationModalProps) {
  const messaging = useMessaging(conversation?.id || null);

  // Connect when modal opens, disconnect when it closes
  useEffect(() => {
    if (isOpen && conversation?.id) {
      console.log(
        "[ConversationModal] Modal opened, connecting to chat for:",
        conversation.id
      );
      messaging.connect().catch((error) => {
        console.error("[ConversationModal] Failed to connect:", error);
      });
    } else if (!isOpen) {
      console.log("[ConversationModal] Modal closed, disconnecting...");
      messaging.disconnect();
    }
  }, [isOpen, conversation?.id, messaging.connect, messaging.disconnect]);

  // Load existing messages when conversation becomes active
  useEffect(() => {
    if (messaging.isConnected && conversation?.id) {
      messaging.loadMessages().catch((error) => {
        console.error("[ConversationModal] Failed to load messages:", error);
      });
    }
  }, [messaging.isConnected, conversation?.id, messaging.loadMessages]);

  // Handle sending messages
  const handleSend = useCallback(
    async (content: string) => {
      try {
        await messaging.sendMessage(content);
      } catch (error) {
        console.error("[ConversationModal] Send failed:", error);
        // Error is already set in the hook, UI will show it
      }
    },
    [messaging.sendMessage]
  );

  // Handle modal close
  const handleClose = useCallback(() => {
    messaging.disconnect();
    onClose();
  }, [onClose, messaging.disconnect]);

  if (!conversation) return null;

  return (
    <Dialog modal open={isOpen} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay
          key="overlay"
          backgroundColor="rgba(0, 0, 0, 0.5)"
          opacity={1}
        />
        <Dialog.Content
          key="content"
          backgroundColor="$background"
          borderRadius="$4"
          padding="$0" // Remove padding to let ChatInterface control layout
          width="90%"
          maxWidth={800}
          maxHeight="80%"
          display="flex"
          flexDirection="column"
        >
          {/* Header with conversation name and close button */}
          <Stack
            flexDirection="row"
            justifyContent="space-between"
            alignItems="center"
            padding="$4"
            borderBottomWidth={1}
            borderBottomColor="$borderSoft"
          >
            <Text fontSize="$6" fontWeight="bold" color="$color">
              {conversation.name}
            </Text>
            <Button
              size="$3"
              backgroundColor="$gray8"
              borderRadius="$2"
              onPress={handleClose}
            >
              <Text color="white">✕</Text>
            </Button>
          </Stack>

          {/* Connection/Error Status */}
          {(!messaging.isConnected || messaging.error) && (
            <Stack
              padding="$3"
              backgroundColor={messaging.error ? "$red2" : "$yellow2"}
              borderBottomWidth={1}
              borderBottomColor="$borderSoft"
            >
              <Text
                fontSize="$3"
                color={messaging.error ? "$red11" : "$yellow11"}
                textAlign="center"
              >
                {messaging.error
                  ? `⚠️ ${messaging.error.message}`
                  : messaging.isLoading
                  ? "🤖 Connecting to CARA..."
                  : "⚠️ Not connected to CARA"}
              </Text>
              {messaging.error && !messaging.isLoading && (
                <Button
                  size="$2"
                  marginTop="$2"
                  onPress={() => messaging.connect()}
                  alignSelf="center"
                >
                  Retry Connection
                </Button>
              )}
            </Stack>
          )}

          {/* Chat Interface */}
          <Stack flex={1} minHeight={400}>
            {messaging.isConnected ? (
              <ChatInterface
                messages={messaging.messages}
                streamingMessage={messaging.streamingMessage}
                onSend={handleSend}
                placeholder="Ask CARA anything..."
                connectionState={
                  messaging.isStreaming ? "expecting_ai_message" : "ready"
                }
              />
            ) : (
              <Stack
                flex={1}
                justifyContent="center"
                alignItems="center"
                backgroundColor="$gray1"
                padding="$6"
              >
                <Text
                  fontSize="$5"
                  fontWeight="600"
                  color="$color"
                  textAlign="center"
                  marginBottom="$2"
                >
                  🤖 CARA
                </Text>
                <Text
                  fontSize="$4"
                  color="$color"
                  opacity={0.7}
                  textAlign="center"
                  marginBottom="$3"
                >
                  Complex Analysis Research Assistant
                </Text>
                <Text
                  fontSize="$3"
                  color="$color"
                  opacity={0.5}
                  textAlign="center"
                >
                  {messaging.isLoading
                    ? "Establishing connection..."
                    : messaging.error
                    ? "Connection failed - check the retry button above"
                    : "Ready to connect and start analyzing!"}
                </Text>
                {!messaging.isLoading && !messaging.error && (
                  <Button
                    marginTop="$4"
                    onPress={() => messaging.connect()}
                    disabled={messaging.isLoading}
                  >
                    Connect to CARA
                  </Button>
                )}
              </Stack>
            )}
          </Stack>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog>
  );
}
