// tamagui.d.ts
import { AppConfig } from './tamagui.config'

declare module 'tamagui' {
  interface TamaguiCustomConfig extends AppConfig {}
}

// This ensures TypeScript knows about your custom tokens
declare module '@tamagui/core' {
  interface TamaguiCustomConfig extends AppConfig {}
}