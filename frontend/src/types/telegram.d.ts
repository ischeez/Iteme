export {}

declare global {
  interface TelegramWebApp {
    initData?: string
    initDataUnsafe?: unknown
    platform?: string
    version?: string
    colorScheme?: string
    themeParams?: Record<string, string>
    viewportHeight?: number
    viewportStableHeight?: number
    isExpanded?: boolean
    isClosingConfirmationEnabled?: boolean
    openTelegramLink?: (url: string) => void
    openLink?: (url: string) => void
  }

  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp
    }
  }
}
