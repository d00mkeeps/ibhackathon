import React, { useState, useEffect } from "react";
import { YStack, XStack, Text } from "tamagui";
export const LoadingMessage = () => {
  const [dotIndex, setDotIndex] = useState(0);
  const [scale, setScale] = useState(1);
  const [isGrowing, setIsGrowing] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setScale((prev) => {
        if (isGrowing && prev >= 2) {
          setIsGrowing(false);
          return 2;
        } else if (!isGrowing && prev <= 1) {
          setIsGrowing(true);
          setDotIndex((current) => (current + 1) % 3);
          return 1;
        }
        return isGrowing ? prev + 0.2 : prev - 0.2;
      });
    }, 50); // 250ms total (5 * 50ms)

    return () => clearInterval(interval);
  }, [isGrowing]);

  return (
    <XStack
      width="100%"
      justifyContent="flex-start"
      paddingHorizontal="$4"
      paddingVertical="$2"
    >
      <YStack
        maxWidth={"90%"}
        backgroundColor="transparent"
        paddingHorizontal="$0"
        paddingVertical="$1"
        borderRadius="$0"
        opacity={0.7}
      >
        <XStack alignItems="center" gap="$2">
          {[0, 1, 2].map((index) => (
            <Text
              key={index}
              style={{
                color: "#ffffff",
                fontSize: dotIndex === index ? 12 * scale : 12,
                lineHeight: 24,
                fontWeight: "400",
                transform: [{ scale: dotIndex === index ? scale : 1 }],
              }}
            >
              •
            </Text>
          ))}
        </XStack>
      </YStack>
    </XStack>
  );
};
