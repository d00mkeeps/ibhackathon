import React, { useCallback, useRef, useEffect, useMemo } from "react";
import { FlatList } from "react-native";
import { YStack, Text } from "tamagui";
import { MessageItem } from "../atoms/MessageItem";
import { LoadingMessage } from "../atoms/LoadingMessage";
import { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  streamingMessage?: { content: string; isComplete: boolean } | null;
  showLoadingIndicator?: boolean;
}

export const MessageList = ({
  messages,
  streamingMessage,
  showLoadingIndicator = false, // NEW
}: MessageListProps) => {
  const listRef = useRef<FlatList>(null);

  const allMessages = useMemo(() => {
    const safeMessages = Array.isArray(messages) ? messages : [];

    // If streaming message exists, add it
    if (streamingMessage) {
      const tempStreamingMessage: Message = {
        id: "streaming",
        content: streamingMessage.content || "",
        sender: "assistant",
        conversation_id: safeMessages[0]?.conversation_id || "",
        conversation_sequence: safeMessages.length + 1,
        timestamp: new Date(),
      };
      return [...safeMessages, tempStreamingMessage];
    }

    // Show loading indicator when explicitly requested or when last message is from user
    const lastMessage = safeMessages[safeMessages.length - 1];
    const shouldShowLoading =
      showLoadingIndicator || lastMessage?.sender === "user";

    if (shouldShowLoading) {
      const tempLoadingMessage: Message = {
        id: "loading",
        content: "", // Empty content, LoadingMessage will handle the dots
        sender: "assistant",
        conversation_id: safeMessages[0]?.conversation_id || "",
        conversation_sequence: safeMessages.length + 1,
        timestamp: new Date(),
      };
      return [...safeMessages, tempLoadingMessage];
    }

    return safeMessages;
  }, [messages, streamingMessage, showLoadingIndicator]); // Added showLoadingIndicator to deps

  useEffect(() => {
    if (allMessages.length > 0) {
      listRef.current?.scrollToEnd({ animated: true });
    }
  }, [allMessages.length]);

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    if (!item) return null;

    // Special handling for loading message
    if (item.id === "loading") {
      return <LoadingMessage />;
    }

    return <MessageItem message={item} isStreaming={item.id === "streaming"} />;
  }, []);

  const keyExtractor = useCallback((item: Message) => item.id, []);

  if (allMessages.length === 0) {
    return (
      <YStack flex={1} justifyContent="center" alignItems="center">
        <Text color="$textMuted" fontSize="$4">
          Start a conversation about your workout
        </Text>
      </YStack>
    );
  }

  return (
    <YStack flex={1} position="relative">
      <FlatList
        style={{ flex: 1 }}
        ref={listRef}
        data={allMessages}
        renderItem={renderMessage}
        keyExtractor={keyExtractor}
        scrollEventThrottle={400}
        removeClippedSubviews={true}
        contentContainerStyle={{
          paddingVertical: 16,
        }}
        showsVerticalScrollIndicator={true}
      />
    </YStack>
  );
};
