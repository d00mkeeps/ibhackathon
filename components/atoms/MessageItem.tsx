import React, { memo } from "react";
import { YStack, XStack, Text } from "tamagui";
import { StyleSheet } from "react-native";
import Markdown from "react-native-markdown-display";
import { Message } from "@/types";

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageItem = memo(
  ({ message, isStreaming = false }: MessageItemProps) => {
    if (!message) return null;

    const isUser = message.sender === "user";

    // Ensure content is a string
    const safeContent =
      typeof message.content === "string"
        ? message.content
        : String(message.content || "");

    const renderContent = safeContent + (isStreaming ? "..." : "");

    const markdownStyles = StyleSheet.create({
      body: {
        fontSize: 16,
        fontWeight: "400",
        lineHeight: 18,
        color: "#ffffff",
        margin: 0,
        padding: 0,
      },
      paragraph: {
        marginVertical: 8,
      },
      heading1: {
        fontSize: 20,
        lineHeight: 24,
        fontWeight: "700",
        paddingVertical: 8,
        color: "#ffffff",
      },
      heading2: {
        fontSize: 18,
        lineHeight: 22,
        fontWeight: "700",
        paddingVertical: 8,
        color: "#ffffff",
      },
      strong: { fontWeight: "800" },
      em: { fontStyle: "italic" },
      code_inline: {
        fontFamily: "monospace",
        backgroundColor: "rgba(255,255,255,0.2)",
        paddingHorizontal: 4,
        borderRadius: 3,
      },
      code_block: {
        fontFamily: "monospace",
        backgroundColor: "rgba(255,255,255,0.2)",
        padding: 8,
        borderRadius: 6,
        marginVertical: 4,
      },
    });

    return (
      <XStack
        width="100%"
        justifyContent={isUser ? "flex-end" : "flex-start"}
        paddingHorizontal="$4"
        paddingVertical="$2"
      >
        <YStack
          maxWidth={"90%"}
          backgroundColor={isUser ? "$primary" : "transparent"}
          paddingHorizontal={isUser ? "$3" : "$0"}
          paddingVertical="$1"
          borderRadius={isUser ? "$4" : "$0"}
          opacity={isStreaming ? 0.7 : 1}
        >
          {isUser ? (
            // User messages: plain text (no markdown)
            <Text
              style={{
                color: "#ffffff",
                fontSize: 16,
                lineHeight: 18,
                fontWeight: "400",
              }}
            >
              {renderContent}
            </Text>
          ) : (
            // Assistant messages: markdown rendering
            <Markdown style={markdownStyles}>{renderContent}</Markdown>
          )}
        </YStack>
      </XStack>
    );
  }
);
