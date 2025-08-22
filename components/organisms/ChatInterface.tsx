import React from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { YStack, Text, XStack, Button } from "tamagui";
import { MessageList } from "../molecules/MessageList";
import { InputArea } from "../atoms/InputArea";
import { Message } from "@/types";

interface StreamingMessageState {
  conversationId: string;
  content: string;
  isComplete: boolean;
  isProcessing?: boolean;
}

interface ChatInterfaceProps {
  messages?: Message[];
  streamingMessage?: StreamingMessageState | null;
  onSend: (content: string) => void;
  placeholder?: string;
  connectionState?: "ready" | "expecting_ai_message";
  queuedMessageCount?: number;
}

export const ChatInterface = ({
  messages = [],
  streamingMessage,
  onSend,
  placeholder = "Type a message...",
  connectionState = "ready",
  queuedMessageCount = 0,
}: ChatInterfaceProps) => {
  const getPlaceholder = () => {
    switch (connectionState) {
      case "expecting_ai_message":
        return "Loading..."; // Simple and clean
      default:
        return placeholder;
    }
  };

  const getStatusText = () => {
    if (queuedMessageCount > 0) {
      return `${queuedMessageCount} message${
        queuedMessageCount > 1 ? "s" : ""
      } queued`;
    }
    return null;
  };

  // ADD THIS: Quick action buttons method
  const handleQuickAction = (message: string) => {
    if (connectionState !== "expecting_ai_message") {
      onSend(message);
    }
  };

  const shouldShowLoadingIndicator = connectionState === "expecting_ai_message";
  const isInputDisabled = connectionState === "expecting_ai_message";

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 100 : 0}
      style={{ flex: 1 }}
    >
      <YStack flex={1}>
        <MessageList
          messages={messages}
          streamingMessage={streamingMessage}
          showLoadingIndicator={shouldShowLoadingIndicator}
        />
        {getStatusText() && (
          <Text
            ta="center"
            color="$textMuted"
            fontSize="$2"
            paddingVertical="$1"
          >
            {getStatusText()}
          </Text>
        )}

        {/* ADD THIS: Quick action buttons */}
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$2"
          gap="$2"
          flexWrap="wrap"
        >
          <Button
            size="$2"
            variant="outlined"
            onPress={() => handleQuickAction("show me what you can do")}
            disabled={isInputDisabled}
            flex={1}
            minWidth={120}
          >
            What can you do?
          </Button>
          <Button
            size="$2"
            variant="outlined"
            onPress={() =>
              handleQuickAction("can you see any standout potential moonshots")
            }
            disabled={isInputDisabled}
            flex={1}
            minWidth={120}
          >
            Find me moonshots
          </Button>
          <Button
            size="$2"
            variant="outlined"
            onPress={() => handleQuickAction("where is your data from?")}
            disabled={isInputDisabled}
            flex={1}
            minWidth={120}
          >
            What's your data source?
          </Button>
        </XStack>

        <InputArea
          placeholder={getPlaceholder()}
          onSendMessage={onSend}
          disabled={isInputDisabled}
        />
      </YStack>
    </KeyboardAvoidingView>
  );
};
