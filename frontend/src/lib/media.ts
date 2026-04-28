const resolveMediaOrigin = (): string => {
  if (typeof window === 'undefined') {
    return 'http://localhost:3000'
  }

  const envUrl = import.meta.env.VITE_API_URL?.trim()
  if (envUrl) {
    try {
      return new URL(envUrl, window.location.origin).origin
    } catch {
      // Fall back to runtime origin below.
    }
  }

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'

  if (isLocalhost) {
    return 'http://localhost:3000'
  }

  return window.location.origin
}

export const resolveMediaUrl = (rawUrl?: string | null): string | undefined => {
  const normalized = rawUrl?.trim()

  if (!normalized) {
    return undefined
  }

  const mediaOrigin = resolveMediaOrigin()

  if (normalized.startsWith('/storage/')) {
    return `${mediaOrigin}${normalized}`
  }

  if (normalized.startsWith('storage/')) {
    return `${mediaOrigin}/${normalized}`
  }

  // Support old records saved as absolute URLs (e.g. localhost) by rewriting to current API origin.
  try {
    const parsed = new URL(normalized)
    if (parsed.pathname.startsWith('/storage/')) {
      return `${mediaOrigin}${parsed.pathname}${parsed.search}`
    }
  } catch {
    // Not an absolute URL; keep as-is.
  }

  return normalized
}
