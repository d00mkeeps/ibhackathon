// /app/_layout.tsx
import FontAwesome from "@expo/vector-icons/FontAwesome";
import {
  DarkTheme,
  DefaultTheme,
  ThemeProvider,
} from "@react-navigation/native";
import { useFonts } from "expo-font";
import { SplashScreen, Stack } from "expo-router";
import { useEffect } from "react";
import { useColorScheme } from "react-native";
import { SafeAreaProvider, SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import React from "react";
import { TamaguiProvider, Theme } from "@tamagui/core";
import config from "../tamagui.config";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import "react-native-get-random-values";

export { ErrorBoundary } from "expo-router";

export const unstable_settings = {
  initialRouteName: "index",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require("../assets/fonts/SpaceMono-Regular.ttf"),
    ...FontAwesome.font,
  });

  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();

  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <TamaguiProvider config={config}>
            <Theme name={colorScheme === "dark" ? "dark" : "light"}>
              <ThemeProvider
                value={colorScheme === "dark" ? DarkTheme : DefaultTheme}
              >
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />{" "}
                  {/* Yer main screen, no tabs! */}
                  <Stack.Screen
                    name="modal"
                    options={{ presentation: "modal" }}
                  />
                </Stack>
              </ThemeProvider>
            </Theme>
          </TamaguiProvider>
          <Toast />
        </GestureHandlerRootView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
