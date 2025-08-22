// tamagui.config.ts
import { config } from "@tamagui/config/v3";
import { createTamagui } from "tamagui";

const tamaguiConfig = createTamagui({
  ...config,
  fonts: {
    ...config.fonts,
    body: {
      family: "System",
      size: config.fonts.body.size,
      lineHeight: config.fonts.body.lineHeight,
      weight: config.fonts.body.weight,
      letterSpacing: config.fonts.body.letterSpacing,
    },
    heading: {
      family: "System",
      size: config.fonts.heading.size,
      lineHeight: config.fonts.heading.lineHeight,
      weight: config.fonts.heading.weight,
      letterSpacing: config.fonts.heading.letterSpacing,
    },
  },
  themes: {
    ...config.themes,
    dark: {
      ...config.themes.dark,
      background: "#231f20",
      backgroundSoft: "#2a2629",
      backgroundMuted: "#1a1718",
      backgroundPress: "#3a3539",

      primary: "#f84f3e", // Volc orange
      primaryLight: "#f86b5c", // Light orange
      primaryMuted: "#d4412f", // Muted orange
      primaryTint: "#2b1f1e", // Dark orange tint

      color: "#ffffff", // White text
      textSoft: "#b0abac", // Warm light gray
      textMuted: "#6b6466", // Warm gray

      borderSoft: "rgba(248, 79, 62, 0.1)", // Orange border
      borderMuted: "rgba(255, 255, 255, 0.05)", // Subtle white border
    },
    light: {
      ...config.themes.light,
      background: "#ffffff", // Pure white
      backgroundSoft: "#f5f4f4", // Light gray (not green!)
      backgroundMuted: "#ebebeb", // Lighter gray
      backgroundPress: "#e8e8e8", // Pressed state

      primary: "#f84f3e", // Volc orange
      primaryLight: "#f86b5c", // Light orange
      primaryMuted: "#d4412f", // Muted orange
      primaryTint: "#fef7f6", // Orange tint

      color: "#231f20", // Volc dark charcoal text
      textSoft: "#6b6466", // Warm gray
      textMuted: "#999999", // Medium gray

      borderSoft: "#f0f0f0", // Light gray border
      borderMuted: "#f8f8f8", // Very light gray border
    },
  },
});

export type AppConfig = typeof tamaguiConfig;

declare module "tamagui" {
  interface TamaguiCustomConfig extends AppConfig {}
}

export default tamaguiConfig;
