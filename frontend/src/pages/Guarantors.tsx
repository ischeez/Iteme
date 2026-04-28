import { AxiosError } from 'axios'
import { useEffect, useState } from 'react'
import { getGuarantors, type GuarantorItem } from '../api/guarantors'
import { resolveMediaUrl } from '../lib/media'

const TELEGRAM_HOST_REGEX = /^(https?:\/\/)?(t\.me|telegram\.me)\//i

const resolveTelegramChatUrl = (item: GuarantorItem): string | null => {
  const telegramUrl = item.telegramUrl?.trim() ?? ''
  const contact = item.contact?.trim() ?? ''
  const candidate = telegramUrl || contact

  if (!candidate) {
    return null
  }

  if (candidate.startsWith('@')) {
    const username = candidate.slice(1).trim()
    return username ? `https://t.me/${username}` : null
  }

  if (TELEGRAM_HOST_REGEX.test(candidate)) {
    return candidate.replace(/^http:\/\//i, 'https://')
  }

  if (/^[a-zA-Z0-9_]{5,32}$/.test(candidate)) {
    return `https://t.me/${candidate}`
  }

  return null
}

export default function Guarantors() {
  const [items, setItems] = useState<GuarantorItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const data = await getGuarantors()
        setItems(data)
      } catch (err) {
        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить гарантов')
      } finally {
        setIsLoading(false)
      }
    }

    void load()
  }, [])

  return (
    <section className="space-y-4">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Safety</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Гаранты площадки</h1>
      </header>

      {isLoading && <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#555]">Загрузка...</div>}
      {error && <div className="rounded-sm border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}

      {!isLoading && !error && items.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-white p-4 text-sm text-[#666]">Сейчас нет активных гарантов.</div>
      )}

      {!isLoading && !error && items.length > 0 && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {items.map((item) => {
            const href = resolveTelegramChatUrl(item)
            return (
              <article key={item.id} className="rounded-sm border border-black/10 bg-white p-4">
                <div className="flex items-center gap-3">
                  <div className="h-14 w-14 overflow-hidden rounded-full border border-black/10 bg-[#efefef]">
                    {item.avatarUrl ? (
                      <img src={resolveMediaUrl(item.avatarUrl) ?? item.avatarUrl} alt={item.nickname} className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-xs text-[#777]">G</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 self-center">
                    <p className="truncate text-[22px] leading-[1.12] font-medium tracking-[-0.01em] text-[#141414] sm:text-[24px]">{item.nickname}</p>
                    {item.description && <p className="mt-1 truncate text-sm text-[#555]">{item.description}</p>}
                  </div>
                </div>

                {href ? (
                  <a
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-sm border border-black bg-black px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-white"
                  >
                    Перейти в чат
                  </a>
                ) : (
                  <button
                    type="button"
                    disabled
                    className="mt-4 inline-flex h-9 items-center justify-center rounded-sm border border-black/10 bg-[#efefef] px-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#777]"
                  >
                    Чат недоступен
                  </button>
                )}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
