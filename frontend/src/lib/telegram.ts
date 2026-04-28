const TELEGRAM_HOST_REGEX = /^https?:\/\/(t\.me|telegram\.me)\//i

export const openTelegramChat = (url: string) => {
  const target = url.trim()

  if (!target) {
    return
  }

  const webApp = window.Telegram?.WebApp

  if (webApp && TELEGRAM_HOST_REGEX.test(target) && typeof webApp.openTelegramLink === 'function') {
    webApp.openTelegramLink(target)
    return
  }

  if (webApp && typeof webApp.openLink === 'function') {
    webApp.openLink(target)
    return
  }

  window.location.href = target
}
