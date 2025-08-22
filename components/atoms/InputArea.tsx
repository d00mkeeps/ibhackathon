import React, { useState, useCallback } from "react";
import { XStack, Input, Button, Text } from "tamagui";
import { Send } from "@tamagui/lucide-icons";

interface InputAreaProps {
  disabled?: boolean;
  placeholder?: string;
  onSendMessage: (message: string) => void;
}

export const InputArea = ({
  disabled = false,
  placeholder = "Type a message...",
  onSendMessage,
}: InputAreaProps) => {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | undefined>();

  const handleSend = useCallback(() => {
    if (!disabled && input.trim()) {
      onSendMessage(input.trim());
      setInput("");
      setError(undefined);
    }
  }, [disabled, input, onSendMessage]);

  return (
    <XStack
      padding="$3"
      gap="$2"
      backgroundColor="$background"
      borderTopWidth={1}
      borderTopColor="$borderSoft"
    >
      <Input
        flex={1}
        value={input}
        onChangeText={(text) => {
          setInput(text);
          if (error && text.length <= 240) setError(undefined);
        }}
        placeholder={disabled ? "Please wait..." : placeholder}
        disabled={disabled}
        backgroundColor={disabled ? "$backgroundMuted" : "$backgroundSoft"}
        borderColor={error ? "$error" : "$borderSoft"}
        color="$color"
        placeholderTextColor="$textMuted"
        onSubmitEditing={handleSend}
        returnKeyType="send"
        multiline={false}
        maxLength={240}
      />
      <Button
        size="$3"
        backgroundColor="$primary"
        disabled={disabled || !input.trim()}
        onPress={handleSend}
        circular
        icon={Send}
        color="white"
      />
    </XStack>
  );
};
