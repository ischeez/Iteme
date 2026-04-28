import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import {
  deleteVerificationRequest,
  getVerificationRequestsForAdmin,
  processVerificationRequest,
  type VerificationRequestItem,
  type VerificationRequestStatus,
} from '../api/verification'
import { resolveMediaUrl } from '../lib/media'
import { useAuthStore } from '../store/useAuthStore'

const filterOptions: Array<{ label: string; value: 'ALL' | VerificationRequestStatus }> = [
  { label: 'Все', value: 'ALL' },
  { label: 'PENDING', value: 'PENDING' },
  { label: 'APPROVED', value: 'APPROVED' },
  { label: 'REJECTED', value: 'REJECTED' },
]

export default function AdminVerificationPanel() {
  const role = useAuthStore((state) => state.role)
  const [statusFilter, setStatusFilter] = useState<'ALL' | VerificationRequestStatus>('PENDING')
  const [items, setItems] = useState<VerificationRequestItem[]>([])
  const [comments, setComments] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessingId, setIsProcessingId] = useState<string | null>(null)
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const activeFilter = useMemo(
    () => (statusFilter === 'ALL' ? undefined : statusFilter),
    [statusFilter],
  )

  useEffect(() => {
    const controller = new AbortController()

    const load = async () => {
      if (role !== 'ADMIN') {
        setItems([])
        setIsLoading(false)
        return
      }

      try {
        setIsLoading(true)
        setError(null)
        const response = await getVerificationRequestsForAdmin(activeFilter)
        if (!controller.signal.aborted) {
          setItems(response)
        }
      } catch (err) {
        if (controller.signal.aborted) {
          return
        }

        const axiosError = err as AxiosError<{ message?: string }>
        setError(axiosError.response?.data?.message ?? 'Не удалось загрузить заявки на верификацию')
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    void load()

    return () => controller.abort()
  }, [role, activeFilter])

  const handleProcess = async (
    requestId: string,
    status: Extract<VerificationRequestStatus, 'APPROVED' | 'REJECTED'>,
  ) => {
    try {
      setIsProcessingId(requestId)
      setError(null)
      setSuccess(null)

      const updated = await processVerificationRequest(requestId, {
        status,
        adminComment: comments[requestId]?.trim() || undefined,
      })

      setItems((prev) =>
        prev.map((item) => (item.id === requestId ? { ...item, ...updated } : item)),
      )
      setSuccess(`Заявка ${requestId} обновлена: ${updated.status}`)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось обработать заявку')
    } finally {
      setIsProcessingId(null)
    }
  }

  const handleDelete = async (requestId: string) => {
    try {
      setIsDeletingId(requestId)
      setError(null)
      setSuccess(null)

      await deleteVerificationRequest(requestId)
      setItems((prev) => prev.filter((item) => item.id !== requestId))
      setSuccess(`Заявка ${requestId} удалена`)
    } catch (err) {
      const axiosError = err as AxiosError<{ message?: string }>
      setError(axiosError.response?.data?.message ?? 'Не удалось удалить заявку')
    } finally {
      setIsDeletingId(null)
    }
  }

  const getTelegramChatLink = (item: VerificationRequestItem) => {
    const username = item.user?.username?.trim()
    if (username) {
      return `https://t.me/${username}`
    }

    const telegramId = item.user?.telegramId?.trim()
    if (telegramId) {
      return `tg://user?id=${telegramId}`
    }

    return null
  }

  const getSellerTitle = (item: VerificationRequestItem) => {
    const username = item.user?.username?.trim()
    if (username) {
      return `@${username}`
    }

    const fullName = [item.user?.firstName, item.user?.lastName].filter(Boolean).join(' ').trim()
    if (fullName) {
      return fullName
    }

    return `User ${item.userId.slice(0, 8)}`
  }

  return (
    <section className="space-y-4 md:space-y-5">
      <header className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 md:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#707070]">Admin</p>
        <h1 className="mt-1 text-2xl font-semibold text-black">Панель верификации</h1>
      </header>

      {role !== 'ADMIN' && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Доступ только для роли ADMIN.
        </div>
      )}

      {role === 'ADMIN' && (
        <div className="rounded-sm border border-black/10 bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {filterOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setStatusFilter(option.value)}
                className={`rounded-sm border px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] transition ${
                  statusFilter === option.value
                    ? 'border-black bg-black text-white'
                    : 'border-black/15 bg-white text-[#444] hover:bg-[#f3f3f3]'
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>
      )}

      {success && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          {success}
        </div>
      )}

      {role === 'ADMIN' && isLoading && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Загружаем заявки...
        </div>
      )}

      {role === 'ADMIN' && !isLoading && items.length === 0 && (
        <div className="rounded-sm border border-black/10 bg-[#f7f7f7] p-4 text-sm text-[#4b4b4b]">
          Заявок по текущему фильтру нет.
        </div>
      )}

      {role === 'ADMIN' && !isLoading && items.length > 0 && (
        <div className="space-y-2">
          {items.map((item) => (
            <article key={item.id} className="rounded-sm border border-black/10 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#777]">Заявка #{item.id}</p>
                <span className="rounded-sm border border-black/15 bg-[#f8f8f8] px-2 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#444]">
                  {item.status}
                </span>
              </div>

              <p className="mt-2 text-sm text-[#303030]">{item.details}</p>

              {item.evidenceImages && item.evidenceImages.length > 0 && (
                <div className="mt-2">
                  <p className="text-xs text-[#666]">Прикрепленные фото ({item.evidenceImages.length})</p>
                  <div className="mt-1 grid grid-cols-2 gap-2 sm:grid-cols-4">
                    {item.evidenceImages.map((url) => (
                      <a
                        key={url}
                        href={resolveMediaUrl(url) ?? url}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-sm border border-black/10 bg-[#f4f4f4]"
                      >
                        <img src={resolveMediaUrl(url) ?? url} alt="verification evidence" className="h-24 w-full object-cover" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="text-xs text-[#666]">Продавец:</span>
                <span className="rounded-sm border border-black/15 bg-[#f8f8f8] px-2 py-1 text-xs font-semibold text-black">
                  {getSellerTitle(item)}
                </span>
                {getTelegramChatLink(item) ? (
                  <a
                    href={getTelegramChatLink(item) as string}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-sm border border-[#1d6dff]/25 bg-[#1d6dff]/10 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-[#1552bf] transition hover:bg-[#1d6dff]/20"
                  >
                    Написать в Telegram
                  </a>
                ) : (
                  <span className="text-xs text-[#888]">Контакт в Telegram недоступен</span>
                )}
                <button
                  type="button"
                  onClick={() => void handleDelete(item.id)}
                  disabled={isDeletingId === item.id}
                  className="rounded-sm border border-rose-300 bg-rose-50 px-2 py-1 text-xs font-semibold uppercase tracking-[0.1em] text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isDeletingId === item.id ? 'Удаляем...' : 'Удалить заявку'}
                </button>
              </div>
              {item.adminComment && (
                <p className="mt-1 text-xs text-[#666]">Комментарий администратора: {item.adminComment}</p>
              )}

              {item.status === 'PENDING' && (
                <div className="mt-3 space-y-2">
                  <textarea
                    value={comments[item.id] ?? ''}
                    onChange={(event) =>
                      setComments((prev) => ({
                        ...prev,
                        [item.id]: event.target.value,
                      }))
                    }
                    rows={3}
                    placeholder="Комментарий админа (необязательно)"
                    className="w-full rounded-sm border border-black/20 bg-white px-3 py-2 text-sm text-black outline-none transition focus:border-black"
                  />

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => void handleProcess(item.id, 'APPROVED')}
                      disabled={isProcessingId === item.id}
                      className="rounded-sm border border-emerald-700 bg-emerald-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Одобрить
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleProcess(item.id, 'REJECTED')}
                      disabled={isProcessingId === item.id}
                      className="rounded-sm border border-rose-700 bg-rose-700 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.12em] text-white transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      Отклонить
                    </button>
                  </div>
                </div>
              )}
            </article>
          ))}
        </div>
      )}
    </section>
  )
}
